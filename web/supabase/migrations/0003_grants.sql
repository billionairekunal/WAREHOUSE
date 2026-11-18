-- Table privileges (row-level security still decides which rows).
grant usage on schema public to anon, authenticated;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.quotes, public.visits to authenticated;
grant select, insert, delete on public.favorites to authenticated;
