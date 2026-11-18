-- Non-admin users: new listings start as draft/submitted, verified is admin-only,
-- and status may only move along owner-allowed transitions.
create or replace function public.guard_listing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is null or public.is_admin() then return new; end if;

  if tg_op = 'INSERT' then
    new.verified := false;
    if new.status is null or new.status not in ('draft','submitted') then new.status := 'draft'; end if;
    return new;
  end if;

  new.verified := old.verified;
  new.owner_id := old.owner_id;
  if new.status is distinct from old.status and not (
       new.status in ('draft','submitted')
    or (old.status = 'live' and new.status in ('paused','leased'))
    or (old.status in ('paused','leased') and new.status = 'live' and old.verified)
  ) then
    new.status := old.status;
  end if;
  return new;
end $$;
delete from public.listings where name = 'zz test';
