-- Each party may only change its own side of a quote.
create or replace function public.guard_quote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  -- immutable keys
  new.listing_id := old.listing_id; new.tenant_id := old.tenant_id; new.owner_id := old.owner_id;
  if auth.uid() = old.tenant_id then
    new.rent_psf := old.rent_psf; new.cam_psf := old.cam_psf; new.deposit_months := old.deposit_months;
    new.lock_in_months := old.lock_in_months; new.escalation_pct := old.escalation_pct;
    new.rent_free_days := old.rent_free_days; new.valid_until := old.valid_until; new.owner_note := old.owner_note;
    if new.status not in ('negotiating','accepted','rejected','withdrawn') then new.status := old.status; end if;
    if new.status = 'accepted' and old.status not in ('quoted','negotiating') then new.status := old.status; end if;
  elsif auth.uid() = old.owner_id then
    new.area_sqft := old.area_sqft; new.move_in := old.move_in; new.tenure_months := old.tenure_months;
    new.tenant_note := old.tenant_note; new.counter_rent_psf := old.counter_rent_psf;
    if new.status not in ('quoted','rejected') then new.status := old.status; end if;
  end if;
  return new;
end $$;
create trigger quotes_guard before update on public.quotes
for each row execute function public.guard_quote();
