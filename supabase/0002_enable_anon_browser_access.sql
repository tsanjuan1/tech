begin;

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
grant usage, select on sequence public.customer_code_seq to anon;
grant usage, select on sequence public.quote_number_seq to anon;

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.quote_items to authenticated;
grant usage, select on sequence public.customer_code_seq to authenticated;
grant usage, select on sequence public.quote_number_seq to authenticated;

commit;
