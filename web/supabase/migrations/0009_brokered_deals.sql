-- Brokered deals: every quote and visit goes through the platform (admin) first.
-- Owners work on separate "offer" rows that contain no customer identity at all,
-- and can no longer read the customer-facing quotes/visits tables.

-- ---------- stages ----------
alter table public.quotes drop constraint quotes_status_check;
alter table public.quotes add constraint quotes_status_check check (status in (
  'pending_review',  -- new request, only admin sees it
  'requested',       -- forwarded to owner, waiting for owner's quote
  'owner_quoted',    -- owner sent a quote, admin reviewing
  'quoted',          -- admin approved, company can see it
  'counter_review',  -- company countered, admin reviewing
  'negotiating',     -- counter forwarded to owner
  'accepted', 'won', 'rejected', 'withdrawn', 'expired'));

alter table public.visits drop constraint visits_status_check;
alter table public.visits add constraint visits_status_check check (status in (
  'pending_review', 'requested', 'owner_responded', 'confirmed', 'done', 'cancelled'));

-- new requests always start with the admin
create or replace function public.set_quote_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.owner_id := (select owner_id from listings where id = new.listing_id);
  new.status := 'pending_review';
  select full_name, company_name into new.tenant_name, new.tenant_company from profiles where id = new.tenant_id;
  return new;
end $$;

-- ---------- owner-side records (no customer columns) ----------
create table public.quote_offers (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.quotes(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','owner_quoted','negotiating','approved','declined','closed')),
  area_sqft integer not null,
  move_in date,
  tenure_months integer,
  requirements text,          -- written by admin; never contains customer contact details
  counter_rent_psf numeric,   -- the company's counter, forwarded by admin
  rent_psf numeric, cam_psf numeric, deposit_months integer, lock_in_months integer,
  escalation_pct numeric, rent_free_days integer, valid_until date, owner_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quote_offers_owner_idx on public.quote_offers(owner_id);

create table public.visit_offers (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null unique references public.visits(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','available','unavailable','closed')),
  owner_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index visit_offers_owner_idx on public.visit_offers(owner_id);

-- ---------- guards ----------
-- Company may only withdraw, or answer an approved quote; never edit terms.
create or replace function public.guard_quote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is null or public.is_admin() then return new; end if;
  new.listing_id := old.listing_id; new.tenant_id := old.tenant_id; new.owner_id := old.owner_id;
  new.area_sqft := old.area_sqft; new.move_in := old.move_in; new.tenure_months := old.tenure_months;
  new.tenant_note := old.tenant_note; new.tenant_name := old.tenant_name; new.tenant_company := old.tenant_company;
  new.rent_psf := old.rent_psf; new.cam_psf := old.cam_psf; new.deposit_months := old.deposit_months;
  new.lock_in_months := old.lock_in_months; new.escalation_pct := old.escalation_pct;
  new.rent_free_days := old.rent_free_days; new.valid_until := old.valid_until; new.owner_note := old.owner_note;
  if new.status is distinct from old.status and not (
       (new.status = 'withdrawn' and old.status in ('pending_review','requested','owner_quoted','negotiating','counter_review','quoted'))
    or (new.status in ('accepted','rejected','counter_review') and old.status = 'quoted')
  ) then
    new.status := old.status;
  end if;
  if not (new.status = 'counter_review' and old.status = 'quoted') then new.counter_rent_psf := old.counter_rent_psf; end if;
  return new;
end $$;
drop trigger if exists quotes_touch on public.quotes; -- guard_quote now stamps updated_at

-- Company may only cancel a visit; everything else stays as it was.
create or replace function public.guard_visit() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.visits := old;
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.status = 'cancelled' and old.status in ('pending_review','requested','owner_responded','confirmed') then
    r.status := 'cancelled';
  end if;
  return r;
end $$;
create trigger visits_guard before update on public.visits for each row execute function public.guard_visit();

-- Owner may only fill in their own quote (or decline) while it is waiting on them.
create or replace function public.guard_quote_offer() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.quote_offers := old;
begin
  new.updated_at := now();
  if auth.uid() is null or public.is_admin() then return new; end if;
  if auth.uid() is distinct from old.owner_id or old.status not in ('requested','negotiating') then return old; end if;
  if new.status not in ('owner_quoted','declined') then return old; end if;
  r.status := new.status; r.rent_psf := new.rent_psf; r.cam_psf := new.cam_psf; r.deposit_months := new.deposit_months;
  r.lock_in_months := new.lock_in_months; r.escalation_pct := new.escalation_pct; r.rent_free_days := new.rent_free_days;
  r.valid_until := new.valid_until; r.owner_note := new.owner_note; r.updated_at := now();
  return r;
end $$;
create trigger quote_offers_guard before update on public.quote_offers for each row execute function public.guard_quote_offer();

-- Owner may only answer available / unavailable while the visit is waiting on them.
create or replace function public.guard_visit_offer() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.visit_offers := old;
begin
  new.updated_at := now();
  if auth.uid() is null or public.is_admin() then return new; end if;
  if auth.uid() is distinct from old.owner_id or old.status <> 'requested' or new.status not in ('available','unavailable') then return old; end if;
  r.status := new.status; r.owner_note := new.owner_note; r.updated_at := now();
  return r;
end $$;
create trigger visit_offers_guard before update on public.visit_offers for each row execute function public.guard_visit_offer();

-- ---------- access rules ----------
-- customer requests: the company itself and admins only (owners lose access)
drop policy "parties read quotes" on public.quotes;
drop policy "parties update quotes" on public.quotes;
create policy "company or admin reads quotes" on public.quotes for select using (tenant_id = auth.uid() or public.is_admin());
create policy "company or admin updates quotes" on public.quotes for update using (tenant_id = auth.uid() or public.is_admin());

drop policy "parties read visits" on public.visits;
drop policy "parties update visits" on public.visits;
create policy "company or admin reads visits" on public.visits for select using (tenant_id = auth.uid() or public.is_admin());
create policy "company or admin updates visits" on public.visits for update using (tenant_id = auth.uid() or public.is_admin());

-- owner offers: that owner and admins; only admins create or delete them
alter table public.quote_offers enable row level security;
alter table public.visit_offers enable row level security;
create policy "owner or admin reads quote offers" on public.quote_offers for select using (owner_id = auth.uid() or public.is_admin());
create policy "owner or admin updates quote offers" on public.quote_offers for update using (owner_id = auth.uid() or public.is_admin());
create policy "admin creates quote offers" on public.quote_offers for insert with check (public.is_admin());
create policy "admin deletes quote offers" on public.quote_offers for delete using (public.is_admin());
create policy "owner or admin reads visit offers" on public.visit_offers for select using (owner_id = auth.uid() or public.is_admin());
create policy "owner or admin updates visit offers" on public.visit_offers for update using (owner_id = auth.uid() or public.is_admin());
create policy "admin creates visit offers" on public.visit_offers for insert with check (public.is_admin());
create policy "admin deletes visit offers" on public.visit_offers for delete using (public.is_admin());
grant select, insert, update, delete on public.quote_offers, public.visit_offers to authenticated;

-- ---------- move existing data onto the new flow ----------
update public.quotes set status = 'pending_review' where status = 'requested';
insert into public.quote_offers (quote_id, listing_id, owner_id, status, area_sqft, move_in, tenure_months, counter_rent_psf,
  rent_psf, cam_psf, deposit_months, lock_in_months, escalation_pct, rent_free_days, valid_until, owner_note)
select id, listing_id, owner_id, case status when 'negotiating' then 'negotiating' else 'approved' end, area_sqft, move_in, tenure_months,
  case when status = 'negotiating' then counter_rent_psf end,
  rent_psf, cam_psf, deposit_months, lock_in_months, escalation_pct, rent_free_days, valid_until, owner_note
from public.quotes where status in ('quoted','negotiating','accepted');
update public.visits set status = 'pending_review' where status = 'requested';
insert into public.visit_offers (visit_id, listing_id, owner_id, scheduled_at, status)
select id, listing_id, owner_id, scheduled_at, 'closed' from public.visits where status in ('confirmed','done');
