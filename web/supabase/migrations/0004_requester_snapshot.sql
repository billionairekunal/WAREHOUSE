-- Owners see who is asking without reading the private profiles table.
alter table public.quotes add column tenant_name text, add column tenant_company text;
alter table public.visits add column tenant_name text, add column tenant_company text;

create or replace function public.set_quote_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.owner_id := (select owner_id from listings where id = new.listing_id);
  new.status := 'requested';
  select full_name, company_name into new.tenant_name, new.tenant_company from profiles where id = new.tenant_id;
  return new;
end $$;
