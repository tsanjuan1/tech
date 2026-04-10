begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'purchase_order_status'
  ) then
    create type public.purchase_order_status as enum (
      'draft',
      'sent',
      'confirmed',
      'partial-receipt',
      'received',
      'cancelled'
    );
  end if;
end
$$;

create sequence if not exists public.purchase_order_number_seq start with 1 increment by 1;

create or replace function public.next_purchase_order_number()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.purchase_order_number_seq');
  return 'OC-' || to_char(now(), 'YYYY') || '-' || lpad(next_number::text, 5, '0');
end;
$$;

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  product_id uuid not null references public.products(id) on update cascade on delete restrict,
  sales_order_id uuid references public.sales_orders(id) on update cascade on delete set null,
  product_snapshot_sku text not null,
  product_snapshot_name text not null,
  vendor_name text not null,
  warehouse_name text not null,
  buyer_name text not null,
  status public.purchase_order_status not null default 'draft',
  currency public.currency_code not null,
  quantity numeric(18, 2) not null,
  unit_cost numeric(18, 2) not null,
  expected_receipt_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_orders_vendor_len_chk check (char_length(trim(vendor_name)) >= 2),
  constraint purchase_orders_warehouse_len_chk check (char_length(trim(warehouse_name)) >= 2),
  constraint purchase_orders_buyer_len_chk check (char_length(trim(buyer_name)) >= 3),
  constraint purchase_orders_quantity_chk check (quantity > 0),
  constraint purchase_orders_unit_cost_chk check (unit_cost >= 0),
  constraint purchase_orders_notes_len_chk check (char_length(notes) <= 500)
);

create index if not exists idx_purchase_orders_product_id on public.purchase_orders (product_id);
create index if not exists idx_purchase_orders_sales_order_id on public.purchase_orders (sales_order_id);
create index if not exists idx_purchase_orders_status on public.purchase_orders (status);
create index if not exists idx_purchase_orders_expected_receipt_date on public.purchase_orders (expected_receipt_date);

create or replace function public.assign_purchase_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.number is null or btrim(new.number) = '' then
    new.number := public.next_purchase_order_number();
  end if;

  return new;
end;
$$;

create or replace function public.sync_purchase_order_product_snapshot()
returns trigger
language plpgsql
as $$
declare
  selected_product record;
begin
  select
    p.sku,
    p.product_name,
    p.preferred_vendor
  into selected_product
  from public.products p
  where p.id = new.product_id;

  if selected_product is null then
    raise exception 'Product % does not exist', new.product_id using errcode = '23503';
  end if;

  new.product_snapshot_sku := selected_product.sku;
  new.product_snapshot_name := selected_product.product_name;

  if new.vendor_name is null or btrim(new.vendor_name) = '' then
    new.vendor_name := selected_product.preferred_vendor;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_purchase_orders_assign_number on public.purchase_orders;
create trigger trg_purchase_orders_assign_number
before insert on public.purchase_orders
for each row
execute function public.assign_purchase_order_number();

drop trigger if exists trg_purchase_orders_sync_product_snapshot on public.purchase_orders;
create trigger trg_purchase_orders_sync_product_snapshot
before insert or update of product_id, vendor_name on public.purchase_orders
for each row
execute function public.sync_purchase_order_product_snapshot();

drop trigger if exists trg_purchase_orders_set_updated_at on public.purchase_orders;
create trigger trg_purchase_orders_set_updated_at
before update on public.purchase_orders
for each row
execute function public.set_updated_at();

insert into public.purchase_orders (
  id,
  number,
  product_id,
  sales_order_id,
  product_snapshot_sku,
  product_snapshot_name,
  vendor_name,
  warehouse_name,
  buyer_name,
  status,
  currency,
  quantity,
  unit_cost,
  expected_receipt_date,
  notes,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000601',
    'OC-2026-00001',
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000301',
    'PRD-0002',
    'PowerEdge T550',
    'Elit',
    'Deposito Central',
    'Equipo de Compras',
    'confirmed',
    'USD',
    1.00,
    4820.00,
    '2026-04-15',
    'Reposicion puntual para cumplir la orden de infraestructura ya confirmada.',
    '2026-04-08T13:00:00Z',
    '2026-04-08T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    'OC-2026-00002',
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000303',
    'PRD-0001',
    'ThinkPad E14 Gen 6',
    'Ingram Micro',
    'Deposito Central',
    'Equipo de Compras',
    'sent',
    'USD',
    6.00,
    780.00,
    '2026-04-18',
    'Reposicion preventiva para notebooks comerciales y recambio rapido.',
    '2026-04-09T13:00:00Z',
    '2026-04-09T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000603',
    'OC-2026-00003',
    '00000000-0000-0000-0000-000000000404',
    null,
    'PRD-0004',
    'Microsoft 365 Business Premium',
    'Microsoft CSP',
    'Licencias Digitales',
    'Equipo de Compras',
    'draft',
    'USD',
    30.00,
    18.00,
    '2026-04-12',
    'Reaprovisionamiento de licencias para pipeline de renovaciones.',
    '2026-04-10T13:00:00Z',
    '2026-04-10T13:00:00Z'
  )
on conflict (id) do update
set
  number = excluded.number,
  product_id = excluded.product_id,
  sales_order_id = excluded.sales_order_id,
  product_snapshot_sku = excluded.product_snapshot_sku,
  product_snapshot_name = excluded.product_snapshot_name,
  vendor_name = excluded.vendor_name,
  warehouse_name = excluded.warehouse_name,
  buyer_name = excluded.buyer_name,
  status = excluded.status,
  currency = excluded.currency,
  quantity = excluded.quantity,
  unit_cost = excluded.unit_cost,
  expected_receipt_date = excluded.expected_receipt_date,
  notes = excluded.notes,
  updated_at = now();

select setval(
  'public.purchase_order_number_seq',
  coalesce(
    (
      select max(substring(number from '(\d+)$')::bigint)
      from public.purchase_orders
    ),
    1
  ),
  true
);

alter table public.purchase_orders enable row level security;

drop policy if exists purchase_orders_public_full_access on public.purchase_orders;
create policy purchase_orders_public_full_access
on public.purchase_orders
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.purchase_orders to anon;
grant select, insert, update, delete on public.purchase_orders to authenticated;
grant usage, select on sequence public.purchase_order_number_seq to anon;
grant usage, select on sequence public.purchase_order_number_seq to authenticated;

commit;
