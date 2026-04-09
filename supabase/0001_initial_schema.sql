begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'customer_segment'
  ) then
    create type public.customer_segment as enum (
      'pyme',
      'enterprise',
      'public-sector',
      'partner'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'customer_lifecycle_status'
  ) then
    create type public.customer_lifecycle_status as enum (
      'prospect',
      'active',
      'inactive'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'credit_status'
  ) then
    create type public.credit_status as enum (
      'approved',
      'review',
      'blocked'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'quote_status'
  ) then
    create type public.quote_status as enum (
      'draft',
      'sent',
      'approved',
      'rejected',
      'expired'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'currency_code'
  ) then
    create type public.currency_code as enum (
      'ARS',
      'USD'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'solution_type'
  ) then
    create type public.solution_type as enum (
      'workstations',
      'infrastructure',
      'licensing',
      'technical-service',
      'networking'
    );
  end if;
end
$$;

create sequence if not exists public.customer_code_seq start with 1 increment by 1;
create sequence if not exists public.quote_number_seq start with 1 increment by 1;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.next_customer_code()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.customer_code_seq');
  return 'CLI-' || lpad(next_number::text, 4, '0');
end;
$$;

create or replace function public.next_quote_number()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.quote_number_seq');
  return 'P-' || to_char(now(), 'YYYY') || '-' || lpad(next_number::text, 5, '0');
end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  business_name text not null,
  tax_id text not null unique,
  segment public.customer_segment not null,
  account_manager text not null,
  lifecycle_status public.customer_lifecycle_status not null default 'prospect',
  credit_status public.credit_status not null default 'review',
  payment_term_days integer not null default 0,
  email text not null,
  phone text not null,
  city text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_tax_id_format_chk check (tax_id ~ '^\d{11}$'),
  constraint customers_payment_term_days_chk check (payment_term_days between 0 and 365),
  constraint customers_business_name_len_chk check (char_length(trim(business_name)) >= 3),
  constraint customers_account_manager_len_chk check (char_length(trim(account_manager)) >= 3),
  constraint customers_city_len_chk check (char_length(trim(city)) >= 2),
  constraint customers_notes_len_chk check (char_length(notes) <= 500)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer_id uuid not null references public.customers(id) on update cascade on delete restrict,
  customer_snapshot_name text not null,
  customer_snapshot_tax_id text not null,
  solution_type public.solution_type not null,
  seller_name text not null,
  status public.quote_status not null default 'draft',
  currency public.currency_code not null,
  total_amount numeric(18, 2) not null,
  valid_until date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_total_amount_chk check (total_amount > 0),
  constraint quotes_customer_snapshot_tax_id_chk check (customer_snapshot_tax_id ~ '^\d{11}$'),
  constraint quotes_seller_name_len_chk check (char_length(trim(seller_name)) >= 3),
  constraint quotes_notes_len_chk check (char_length(notes) <= 500)
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on update cascade on delete cascade,
  line_number integer not null,
  item_type text not null default 'service',
  product_sku text,
  description text not null,
  quantity numeric(18, 2) not null,
  unit_price numeric(18, 2) not null,
  line_total numeric(18, 2) generated always as (quantity * unit_price) stored,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_items_line_number_chk check (line_number > 0),
  constraint quote_items_quantity_chk check (quantity > 0),
  constraint quote_items_unit_price_chk check (unit_price >= 0),
  constraint quote_items_item_type_chk check (item_type in ('product', 'service', 'note')),
  constraint quote_items_description_len_chk check (char_length(trim(description)) >= 2)
);

create index if not exists idx_customers_tax_id on public.customers (tax_id);
create index if not exists idx_customers_lifecycle_status on public.customers (lifecycle_status);
create index if not exists idx_customers_credit_status on public.customers (credit_status);
create index if not exists idx_quotes_customer_id on public.quotes (customer_id);
create index if not exists idx_quotes_status on public.quotes (status);
create index if not exists idx_quotes_valid_until on public.quotes (valid_until);
create index if not exists idx_quote_items_quote_id on public.quote_items (quote_id);

create or replace function public.assign_customer_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or btrim(new.code) = '' then
    new.code := public.next_customer_code();
  end if;

  if new.email is not null then
    new.email := lower(trim(new.email));
  end if;

  return new;
end;
$$;

create or replace function public.assign_quote_number()
returns trigger
language plpgsql
as $$
begin
  if new.number is null or btrim(new.number) = '' then
    new.number := public.next_quote_number();
  end if;

  return new;
end;
$$;

create or replace function public.sync_quote_customer_snapshot()
returns trigger
language plpgsql
as $$
declare
  selected_customer record;
begin
  select
    c.business_name,
    c.tax_id,
    c.account_manager
  into selected_customer
  from public.customers c
  where c.id = new.customer_id;

  if selected_customer is null then
    raise exception 'Customer % does not exist', new.customer_id using errcode = '23503';
  end if;

  new.customer_snapshot_name := selected_customer.business_name;
  new.customer_snapshot_tax_id := selected_customer.tax_id;

  if new.seller_name is null or btrim(new.seller_name) = '' then
    new.seller_name := selected_customer.account_manager;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_customers_assign_code on public.customers;
create trigger trg_customers_assign_code
before insert or update on public.customers
for each row
execute function public.assign_customer_code();

drop trigger if exists trg_customers_set_updated_at on public.customers;
create trigger trg_customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists trg_quotes_assign_number on public.quotes;
create trigger trg_quotes_assign_number
before insert on public.quotes
for each row
execute function public.assign_quote_number();

drop trigger if exists trg_quotes_sync_customer_snapshot on public.quotes;
create trigger trg_quotes_sync_customer_snapshot
before insert or update of customer_id, seller_name on public.quotes
for each row
execute function public.sync_quote_customer_snapshot();

drop trigger if exists trg_quotes_set_updated_at on public.quotes;
create trigger trg_quotes_set_updated_at
before update on public.quotes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_quote_items_set_updated_at on public.quote_items;
create trigger trg_quote_items_set_updated_at
before update on public.quote_items
for each row
execute function public.set_updated_at();

insert into public.customers (
  id,
  code,
  business_name,
  tax_id,
  segment,
  account_manager,
  lifecycle_status,
  credit_status,
  payment_term_days,
  email,
  phone,
  city,
  notes,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'CLI-0001',
    'Grupo Delta',
    '30715432109',
    'enterprise',
    'Lucia Perez',
    'active',
    'approved',
    30,
    'compras@grupodelta.com.ar',
    '+54 11 5263 8890',
    'Buenos Aires',
    'Cliente estrategico de infraestructura y renovacion de data center.',
    '2026-01-07T15:00:00Z',
    '2026-01-07T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'CLI-0002',
    'Boreal Pharma',
    '30698211457',
    'enterprise',
    'Santiago Torres',
    'active',
    'review',
    45,
    'it.procurement@borealpharma.com',
    '+54 11 4120 7766',
    'Pilar',
    'Cuenta con alto potencial en software, licenciamiento y soporte.',
    '2026-02-14T15:00:00Z',
    '2026-02-14T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'CLI-0003',
    'Municipalidad de San Andres',
    '30700333123',
    'public-sector',
    'Martina Gomez',
    'prospect',
    'review',
    60,
    'modernizacion@sanandres.gob.ar',
    '+54 11 4982 1140',
    'San Andres',
    'Prospecto para networking y renovacion de puestos administrativos.',
    '2026-03-20T15:00:00Z',
    '2026-03-20T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'CLI-0004',
    'Nexo Retail',
    '30555888991',
    'pyme',
    'Lucia Perez',
    'inactive',
    'blocked',
    0,
    'finanzas@nexoretail.com',
    '+54 341 445 2208',
    'Rosario',
    'Cuenta pausada hasta regularizar pagos y renovar condiciones comerciales.',
    '2025-12-01T15:00:00Z',
    '2025-12-01T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'CLI-0005',
    'Alfa Servicios',
    '30711888361',
    'pyme',
    'Martina Gomez',
    'prospect',
    'approved',
    21,
    'compras@alfaservicios.com.ar',
    '+54 11 4322 9911',
    'Buenos Aires',
    'Cuenta en desarrollo para renovacion de notebooks y perifericos.',
    '2026-03-26T15:00:00Z',
    '2026-03-26T15:00:00Z'
  )
on conflict (id) do update
set
  code = excluded.code,
  business_name = excluded.business_name,
  tax_id = excluded.tax_id,
  segment = excluded.segment,
  account_manager = excluded.account_manager,
  lifecycle_status = excluded.lifecycle_status,
  credit_status = excluded.credit_status,
  payment_term_days = excluded.payment_term_days,
  email = excluded.email,
  phone = excluded.phone,
  city = excluded.city,
  notes = excluded.notes,
  updated_at = now();

insert into public.quotes (
  id,
  number,
  customer_id,
  customer_snapshot_name,
  customer_snapshot_tax_id,
  solution_type,
  seller_name,
  status,
  currency,
  total_amount,
  valid_until,
  notes,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000201',
    'P-2026-00001',
    '00000000-0000-0000-0000-000000000101',
    'Grupo Delta',
    '30715432109',
    'infrastructure',
    'Lucia Perez',
    'approved',
    'USD',
    12450.00,
    '2026-04-15',
    'Renovacion de servidores y switching para casa central.',
    '2026-04-04T15:00:00Z',
    '2026-04-04T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'P-2026-00002',
    '00000000-0000-0000-0000-000000000102',
    'Boreal Pharma',
    '30698211457',
    'licensing',
    'Santiago Torres',
    'sent',
    'ARS',
    18750000.00,
    '2026-04-10',
    'Suscripcion anual, onboarding y soporte premium.',
    '2026-04-06T15:00:00Z',
    '2026-04-06T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'P-2026-00003',
    '00000000-0000-0000-0000-000000000105',
    'Alfa Servicios',
    '30711888361',
    'workstations',
    'Martina Gomez',
    'draft',
    'USD',
    5920.00,
    '2026-04-18',
    'Armado de notebooks y docking stations para equipo comercial.',
    '2026-04-07T15:00:00Z',
    '2026-04-07T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    'P-2026-00004',
    '00000000-0000-0000-0000-000000000104',
    'Nexo Retail',
    '30555888991',
    'technical-service',
    'Lucia Perez',
    'rejected',
    'USD',
    3400.00,
    '2026-04-09',
    'Mantenimiento preventivo y reparaciones puntuales.',
    '2026-04-01T15:00:00Z',
    '2026-04-01T15:00:00Z'
  )
on conflict (id) do update
set
  number = excluded.number,
  customer_id = excluded.customer_id,
  customer_snapshot_name = excluded.customer_snapshot_name,
  customer_snapshot_tax_id = excluded.customer_snapshot_tax_id,
  solution_type = excluded.solution_type,
  seller_name = excluded.seller_name,
  status = excluded.status,
  currency = excluded.currency,
  total_amount = excluded.total_amount,
  valid_until = excluded.valid_until,
  notes = excluded.notes,
  updated_at = now();

select setval(
  'public.customer_code_seq',
  coalesce(
    (
      select max(substring(code from '(\d+)$')::bigint)
      from public.customers
    ),
    1
  ),
  true
);

select setval(
  'public.quote_number_seq',
  coalesce(
    (
      select max(substring(number from '(\d+)$')::bigint)
      from public.quotes
    ),
    1
  ),
  true
);

alter table public.customers enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

drop policy if exists customers_authenticated_full_access on public.customers;
create policy customers_authenticated_full_access
on public.customers
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists quotes_authenticated_full_access on public.quotes;
create policy quotes_authenticated_full_access
on public.quotes
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists quote_items_authenticated_full_access on public.quote_items;
create policy quote_items_authenticated_full_access
on public.quote_items
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.customers to anon;
grant select, insert, update, delete on public.quotes to anon;
grant select, insert, update, delete on public.quote_items to anon;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.quote_items to authenticated;
grant usage, select on sequence public.customer_code_seq to anon;
grant usage, select on sequence public.quote_number_seq to anon;
grant usage, select on sequence public.customer_code_seq to authenticated;
grant usage, select on sequence public.quote_number_seq to authenticated;

commit;
