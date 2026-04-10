begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'product_category'
  ) then
    create type public.product_category as enum (
      'workstations',
      'servers',
      'networking',
      'software',
      'services',
      'peripherals'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'product_sourcing_type'
  ) then
    create type public.product_sourcing_type as enum (
      'stocked',
      'project',
      'service',
      'license'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'product_lifecycle_status'
  ) then
    create type public.product_lifecycle_status as enum (
      'active',
      'draft',
      'discontinued'
    );
  end if;
end
$$;

create sequence if not exists public.product_sku_seq start with 1 increment by 1;

create or replace function public.next_product_sku()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.product_sku_seq');
  return 'PRD-' || lpad(next_number::text, 4, '0');
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  product_name text not null,
  brand_name text not null,
  category public.product_category not null,
  solution_type public.solution_type not null,
  sourcing_type public.product_sourcing_type not null,
  lifecycle_status public.product_lifecycle_status not null default 'active',
  preferred_vendor text not null,
  cost_currency public.currency_code not null,
  unit_cost numeric(18, 2) not null,
  list_price numeric(18, 2) not null,
  lead_time_days integer not null default 0,
  warranty_months integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_product_name_len_chk check (char_length(trim(product_name)) >= 3),
  constraint products_brand_name_len_chk check (char_length(trim(brand_name)) >= 2),
  constraint products_vendor_len_chk check (char_length(trim(preferred_vendor)) >= 2),
  constraint products_unit_cost_chk check (unit_cost >= 0),
  constraint products_list_price_chk check (list_price > 0),
  constraint products_lead_time_chk check (lead_time_days between 0 and 365),
  constraint products_warranty_chk check (warranty_months between 0 and 60),
  constraint products_notes_len_chk check (char_length(notes) <= 500)
);

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_solution_type on public.products (solution_type);
create index if not exists idx_products_sourcing_type on public.products (sourcing_type);
create index if not exists idx_products_lifecycle_status on public.products (lifecycle_status);

create or replace function public.assign_product_sku()
returns trigger
language plpgsql
as $$
begin
  if new.sku is null or btrim(new.sku) = '' then
    new.sku := public.next_product_sku();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_products_assign_sku on public.products;
create trigger trg_products_assign_sku
before insert on public.products
for each row
execute function public.assign_product_sku();

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

insert into public.products (
  id,
  sku,
  product_name,
  brand_name,
  category,
  solution_type,
  sourcing_type,
  lifecycle_status,
  preferred_vendor,
  cost_currency,
  unit_cost,
  list_price,
  lead_time_days,
  warranty_months,
  notes,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000401',
    'PRD-0001',
    'ThinkPad E14 Gen 6',
    'Lenovo',
    'workstations',
    'workstations',
    'stocked',
    'active',
    'Ingram Micro',
    'USD',
    780.00,
    940.00,
    7,
    12,
    'Notebook corporativa recomendada para recambios de puestos administrativos.',
    '2026-02-24T13:00:00Z',
    '2026-02-24T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    'PRD-0002',
    'PowerEdge T550',
    'Dell',
    'servers',
    'infrastructure',
    'project',
    'active',
    'Elit',
    'USD',
    4820.00,
    5610.00,
    18,
    36,
    'Servidor para proyectos de virtualizacion y sucursales con crecimiento sostenido.',
    '2026-03-09T13:00:00Z',
    '2026-03-09T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    'PRD-0003',
    'FortiSwitch 148F',
    'Fortinet',
    'networking',
    'networking',
    'stocked',
    'active',
    'Air Computers',
    'USD',
    2100.00,
    2490.00,
    10,
    12,
    'Switch capa 3 para despliegues medianos con integracion de seguridad.',
    '2026-03-17T13:00:00Z',
    '2026-03-17T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000404',
    'PRD-0004',
    'Microsoft 365 Business Premium',
    'Microsoft',
    'software',
    'licensing',
    'license',
    'active',
    'Microsoft CSP',
    'USD',
    18.00,
    24.00,
    1,
    0,
    'Licencia anual recomendada para clientes pyme con requisitos de productividad y seguridad.',
    '2026-03-25T13:00:00Z',
    '2026-03-25T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000405',
    'PRD-0005',
    'Onsite Preventive Support',
    'Servicio propio',
    'services',
    'technical-service',
    'service',
    'draft',
    'Equipo tecnico interno',
    'ARS',
    85000.00,
    130000.00,
    3,
    1,
    'Servicio base para contratos de mantenimiento y visitas preventivas.',
    '2026-04-02T13:00:00Z',
    '2026-04-02T13:00:00Z'
  )
on conflict (id) do update
set
  sku = excluded.sku,
  product_name = excluded.product_name,
  brand_name = excluded.brand_name,
  category = excluded.category,
  solution_type = excluded.solution_type,
  sourcing_type = excluded.sourcing_type,
  lifecycle_status = excluded.lifecycle_status,
  preferred_vendor = excluded.preferred_vendor,
  cost_currency = excluded.cost_currency,
  unit_cost = excluded.unit_cost,
  list_price = excluded.list_price,
  lead_time_days = excluded.lead_time_days,
  warranty_months = excluded.warranty_months,
  notes = excluded.notes,
  updated_at = now();

select setval(
  'public.product_sku_seq',
  coalesce(
    (
      select max(substring(sku from '(\d+)$')::bigint)
      from public.products
    ),
    1
  ),
  true
);

alter table public.products enable row level security;

drop policy if exists products_public_full_access on public.products;
create policy products_public_full_access
on public.products
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant usage, select on sequence public.product_sku_seq to anon;
grant usage, select on sequence public.product_sku_seq to authenticated;

commit;
