-- Chakan MIDC Force: core schema
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'tenant' check (role in ('tenant','owner','admin')),
  company_name text,
  gstin text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role, company_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    case when new.raw_user_meta_data->>'role' = 'owner' then 'owner' else 'tenant' end, -- never self-assign admin
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- users may edit their profile but not their role
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
for each row execute function public.protect_role();

-- ---------- listings ----------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','submitted','live','leased','rejected','paused')),
  rejection_reason text,
  verified boolean not null default false,
  is_sample boolean not null default false,

  -- basic
  name text not null,
  city text not null default 'Pune',
  micro_market text,
  address text,
  pincode text,
  lat double precision,
  lng double precision,
  primary_type text,
  storage_types text[] not null default '{}',
  building_type text,
  area_total integer,
  area_available integer,
  area_min integer,
  description text,

  -- location
  dist_highway_km numeric,
  dist_airport_km numeric,
  dist_railway_km numeric,
  road_width_ft integer,
  inside_midc boolean not null default false,
  container_40ft boolean not null default false,
  landmarks text[] not null default '{}',

  -- infrastructure
  grade text,
  flooring text,
  clear_height_m numeric,
  eave_height_m numeric,
  floor_load_mt numeric,
  docks integer,
  dock_levelers boolean not null default false,
  truck_parking integer,
  office_sqft integer,
  amenities text[] not null default '{}',

  -- compliance
  power_kva integer,
  power_backup text,
  fire_safety text,
  fire_noc boolean not null default false,
  fire_noc_expiry date,
  documents jsonb not null default '[]',

  -- pricing
  rent_psf numeric,
  cam_psf numeric default 0,
  deposit_months integer,
  escalation_pct numeric,
  lock_in_months integer,
  available_from date,
  flex_enabled boolean not null default false,
  flex_rate_pallet numeric,

  photos text[] not null default '{}',
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_status_idx on public.listings(status);
create index listings_market_idx on public.listings(micro_market);

-- owners may not self-publish or self-verify
create or replace function public.guard_listing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.is_admin() then
    new.verified := coalesce(old.verified, false);
    if new.status in ('live','rejected') and (old.status is distinct from new.status) then
      -- owner can toggle live <-> paused/leased on an already-approved listing only
      if not (old.status in ('paused','leased') and new.status = 'live' and old.verified) then
        new.status := coalesce(old.status, 'draft');
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger listings_guard before insert or update on public.listings
for each row execute function public.guard_listing();

-- ---------- quotes (request -> owner quote -> negotiation -> decision) ----------
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested','quoted','negotiating','accepted','rejected','withdrawn','expired')),
  area_sqft integer not null check (area_sqft > 0),
  move_in date,
  tenure_months integer,
  tenant_note text,
  rent_psf numeric,
  cam_psf numeric,
  deposit_months integer,
  lock_in_months integer,
  escalation_pct numeric,
  rent_free_days integer,
  valid_until date,
  owner_note text,
  counter_rent_psf numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotes_tenant_idx on public.quotes(tenant_id);
create index quotes_owner_idx on public.quotes(owner_id);

create or replace function public.set_quote_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.owner_id := (select owner_id from listings where id = new.listing_id);
  new.status := 'requested';
  return new;
end $$;
create trigger quotes_set_owner before insert on public.quotes
for each row execute function public.set_quote_owner();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger quotes_touch before update on public.quotes
for each row execute function public.touch_updated_at();

-- ---------- visits ----------
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','confirmed','done','cancelled')),
  note text,
  created_at timestamptz not null default now()
);
create trigger visits_set_owner before insert on public.visits
for each row execute function public.set_quote_owner();

-- ---------- favorites ----------
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.quotes enable row level security;
alter table public.visits enable row level security;
alter table public.favorites enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid() or public.is_admin());

create policy "public reads live" on public.listings for select
  using (status in ('live','leased') or owner_id = auth.uid() or public.is_admin());
create policy "owner inserts" on public.listings for insert with check (owner_id = auth.uid());
create policy "owner updates" on public.listings for update using (owner_id = auth.uid() or public.is_admin());
create policy "owner deletes drafts" on public.listings for delete using (owner_id = auth.uid() and status = 'draft');

create policy "parties read quotes" on public.quotes for select
  using (tenant_id = auth.uid() or owner_id = auth.uid() or public.is_admin());
create policy "tenant requests quote" on public.quotes for insert with check (tenant_id = auth.uid());
create policy "parties update quotes" on public.quotes for update
  using (tenant_id = auth.uid() or owner_id = auth.uid() or public.is_admin());

create policy "parties read visits" on public.visits for select
  using (tenant_id = auth.uid() or owner_id = auth.uid() or public.is_admin());
create policy "tenant books visit" on public.visits for insert with check (tenant_id = auth.uid());
create policy "parties update visits" on public.visits for update
  using (tenant_id = auth.uid() or owner_id = auth.uid() or public.is_admin());

create policy "own favorites" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- public stats without exposing rows
create or replace function public.platform_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'listings', count(*),
    'sqft', coalesce(sum(area_available), 0),
    'markets', count(distinct micro_market),
    'verified', count(*) filter (where verified)
  ) from listings where status = 'live'
$$;
grant execute on function public.platform_stats() to anon, authenticated;

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "photo upload into own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photo delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
