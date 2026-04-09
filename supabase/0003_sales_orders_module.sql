begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'sales_order_status'
  ) then
    create type public.sales_order_status as enum (
      'entered',
      'credit-check',
      'ready-fulfillment',
      'partial-delivery',
      'delivered',
      'on-hold'
    );
  end if;
end
$$;

create sequence if not exists public.sales_order_number_seq start with 1 increment by 1;

create or replace function public.next_sales_order_number()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.sales_order_number_seq');
  return 'OV-' || to_char(now(), 'YYYY') || '-' || lpad(next_number::text, 5, '0');
end;
$$;

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer_id uuid not null references public.customers(id) on update cascade on delete restrict,
  quote_id uuid references public.quotes(id) on update cascade on delete set null,
  customer_snapshot_name text not null,
  customer_snapshot_tax_id text not null,
  solution_type public.solution_type not null,
  seller_name text not null,
  status public.sales_order_status not null default 'entered',
  currency public.currency_code not null,
  total_amount numeric(18, 2) not null,
  requested_delivery_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_orders_total_amount_chk check (total_amount > 0),
  constraint sales_orders_customer_snapshot_tax_id_chk check (customer_snapshot_tax_id ~ '^\d{11}$'),
  constraint sales_orders_seller_name_len_chk check (char_length(trim(seller_name)) >= 3),
  constraint sales_orders_notes_len_chk check (char_length(notes) <= 500)
);

create index if not exists idx_sales_orders_customer_id on public.sales_orders (customer_id);
create index if not exists idx_sales_orders_quote_id on public.sales_orders (quote_id);
create index if not exists idx_sales_orders_status on public.sales_orders (status);
create index if not exists idx_sales_orders_requested_delivery_date on public.sales_orders (requested_delivery_date);

create or replace function public.assign_sales_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.number is null or btrim(new.number) = '' then
    new.number := public.next_sales_order_number();
  end if;

  return new;
end;
$$;

create or replace function public.sync_sales_order_customer_snapshot()
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

drop trigger if exists trg_sales_orders_assign_number on public.sales_orders;
create trigger trg_sales_orders_assign_number
before insert on public.sales_orders
for each row
execute function public.assign_sales_order_number();

drop trigger if exists trg_sales_orders_sync_customer_snapshot on public.sales_orders;
create trigger trg_sales_orders_sync_customer_snapshot
before insert or update of customer_id, seller_name on public.sales_orders
for each row
execute function public.sync_sales_order_customer_snapshot();

drop trigger if exists trg_sales_orders_set_updated_at on public.sales_orders;
create trigger trg_sales_orders_set_updated_at
before update on public.sales_orders
for each row
execute function public.set_updated_at();

insert into public.sales_orders (
  id,
  number,
  customer_id,
  quote_id,
  customer_snapshot_name,
  customer_snapshot_tax_id,
  solution_type,
  seller_name,
  status,
  currency,
  total_amount,
  requested_delivery_date,
  notes,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    'OV-2026-00001',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    'Grupo Delta',
    '30715432109',
    'infrastructure',
    'Lucia Perez',
    'ready-fulfillment',
    'USD',
    12450.00,
    '2026-04-14',
    'Preparar servidores y switching. Coordinar entrega con instalacion.',
    '2026-04-08T15:00:00Z',
    '2026-04-08T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'OV-2026-00002',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000202',
    'Boreal Pharma',
    '30698211457',
    'licensing',
    'Santiago Torres',
    'credit-check',
    'ARS',
    18750000.00,
    '2026-04-11',
    'Esperando validacion administrativa antes de activar el onboarding.',
    '2026-04-09T15:00:00Z',
    '2026-04-09T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'OV-2026-00003',
    '00000000-0000-0000-0000-000000000105',
    null,
    'Alfa Servicios',
    '30711888361',
    'workstations',
    'Martina Gomez',
    'entered',
    'USD',
    5920.00,
    '2026-04-16',
    'Orden manual inicial para reservar notebooks y docks.',
    '2026-04-09T18:00:00Z',
    '2026-04-09T18:00:00Z'
  )
on conflict (id) do update
set
  number = excluded.number,
  customer_id = excluded.customer_id,
  quote_id = excluded.quote_id,
  customer_snapshot_name = excluded.customer_snapshot_name,
  customer_snapshot_tax_id = excluded.customer_snapshot_tax_id,
  solution_type = excluded.solution_type,
  seller_name = excluded.seller_name,
  status = excluded.status,
  currency = excluded.currency,
  total_amount = excluded.total_amount,
  requested_delivery_date = excluded.requested_delivery_date,
  notes = excluded.notes,
  updated_at = now();

select setval(
  'public.sales_order_number_seq',
  coalesce(
    (
      select max(substring(number from '(\d+)$')::bigint)
      from public.sales_orders
    ),
    1
  ),
  true
);

alter table public.sales_orders enable row level security;

drop policy if exists sales_orders_public_full_access on public.sales_orders;
create policy sales_orders_public_full_access
on public.sales_orders
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.sales_orders to anon;
grant select, insert, update, delete on public.sales_orders to authenticated;
grant usage, select on sequence public.sales_order_number_seq to anon;
grant usage, select on sequence public.sales_order_number_seq to authenticated;

commit;
