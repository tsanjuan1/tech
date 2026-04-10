begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'inventory_movement_type'
  ) then
    create type public.inventory_movement_type as enum (
      'receipt',
      'adjustment-in',
      'adjustment-out',
      'dispatch',
      'return'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'inventory_allocation_type'
  ) then
    create type public.inventory_allocation_type as enum (
      'reserve',
      'release',
      'deliver'
    );
  end if;
end
$$;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on update cascade on delete restrict,
  warehouse_name text not null,
  movement_type public.inventory_movement_type not null,
  quantity numeric(18, 2) not null,
  reference_note text not null default '',
  created_at timestamptz not null default now(),
  constraint inventory_movements_warehouse_len_chk check (char_length(trim(warehouse_name)) >= 2),
  constraint inventory_movements_quantity_chk check (quantity > 0),
  constraint inventory_movements_reference_note_len_chk check (char_length(reference_note) <= 500)
);

create table if not exists public.inventory_allocations (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on update cascade on delete restrict,
  product_id uuid not null references public.products(id) on update cascade on delete restrict,
  warehouse_name text not null,
  allocation_type public.inventory_allocation_type not null,
  quantity numeric(18, 2) not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint inventory_allocations_warehouse_len_chk check (char_length(trim(warehouse_name)) >= 2),
  constraint inventory_allocations_quantity_chk check (quantity > 0),
  constraint inventory_allocations_notes_len_chk check (char_length(notes) <= 500)
);

create index if not exists idx_inventory_movements_product_id on public.inventory_movements (product_id);
create index if not exists idx_inventory_movements_created_at on public.inventory_movements (created_at desc);
create index if not exists idx_inventory_movements_warehouse_name on public.inventory_movements (warehouse_name);

create index if not exists idx_inventory_allocations_sales_order_id on public.inventory_allocations (sales_order_id);
create index if not exists idx_inventory_allocations_product_id on public.inventory_allocations (product_id);
create index if not exists idx_inventory_allocations_created_at on public.inventory_allocations (created_at desc);
create index if not exists idx_inventory_allocations_warehouse_name on public.inventory_allocations (warehouse_name);

insert into public.inventory_movements (
  id,
  product_id,
  warehouse_name,
  movement_type,
  quantity,
  reference_note,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000401',
    'Deposito Central',
    'receipt',
    15.00,
    'Ingreso inicial para notebooks corporativas.',
    '2026-04-04T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000502',
    '00000000-0000-0000-0000-000000000401',
    'Deposito Central',
    'dispatch',
    2.00,
    'Salida para entrega parcial de recambio comercial.',
    '2026-04-09T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000503',
    '00000000-0000-0000-0000-000000000402',
    'Deposito Central',
    'receipt',
    4.00,
    'Recepcion para proyecto de infraestructura.',
    '2026-04-05T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000504',
    '00000000-0000-0000-0000-000000000403',
    'Deposito Central',
    'receipt',
    12.00,
    'Ingreso de switches para despliegues medianos.',
    '2026-04-06T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000505',
    '00000000-0000-0000-0000-000000000403',
    'Deposito Central',
    'adjustment-out',
    1.00,
    'Ajuste por equipo de demo asignado a preventa.',
    '2026-04-08T13:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000506',
    '00000000-0000-0000-0000-000000000404',
    'Licencias Digitales',
    'receipt',
    60.00,
    'Bloque de licencias anual para clientes activos.',
    '2026-04-07T13:00:00Z'
  )
on conflict (id) do update
set
  product_id = excluded.product_id,
  warehouse_name = excluded.warehouse_name,
  movement_type = excluded.movement_type,
  quantity = excluded.quantity,
  reference_note = excluded.reference_note,
  created_at = excluded.created_at;

insert into public.inventory_allocations (
  id,
  sales_order_id,
  product_id,
  warehouse_name,
  allocation_type,
  quantity,
  notes,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000551',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000402',
    'Deposito Central',
    'reserve',
    1.00,
    'Reserva para OV-2026-00001.',
    '2026-04-09T15:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000552',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000404',
    'Licencias Digitales',
    'reserve',
    25.00,
    'Reserva inicial para licencias anuales.',
    '2026-04-09T15:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000553',
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000401',
    'Deposito Central',
    'reserve',
    4.00,
    'Reserva para notebooks del equipo comercial.',
    '2026-04-10T13:00:00Z'
  )
on conflict (id) do update
set
  sales_order_id = excluded.sales_order_id,
  product_id = excluded.product_id,
  warehouse_name = excluded.warehouse_name,
  allocation_type = excluded.allocation_type,
  quantity = excluded.quantity,
  notes = excluded.notes,
  created_at = excluded.created_at;

alter table public.inventory_movements enable row level security;
alter table public.inventory_allocations enable row level security;

drop policy if exists inventory_movements_public_full_access on public.inventory_movements;
create policy inventory_movements_public_full_access
on public.inventory_movements
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists inventory_allocations_public_full_access on public.inventory_allocations;
create policy inventory_allocations_public_full_access
on public.inventory_allocations
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.inventory_movements to anon;
grant select, insert, update, delete on public.inventory_movements to authenticated;
grant select, insert, update, delete on public.inventory_allocations to anon;
grant select, insert, update, delete on public.inventory_allocations to authenticated;

commit;
