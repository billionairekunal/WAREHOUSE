-- Every account must have a name, mobile and company before using the dashboard or sending requests.

create or replace function public.profile_complete(p public.profiles) returns boolean
language sql immutable as $$
  select coalesce(trim(p.full_name), '') <> '' and coalesce(trim(p.phone), '') <> '' and coalesce(trim(p.company_name), '') <> ''
$$;

-- the role trigger lets the onboarding function pick tenant/owner once; nobody else can set this flag (no raw SQL via the API)
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and not public.is_admin() and coalesce(current_setting('app.onboarding', true), '') <> '1' then
    new.role := old.role;
  end if;
  return new;
end $$;

/** Called by the signed-in user from the "Complete your profile" page. */
create or replace function public.complete_profile(p_full_name text, p_phone text, p_company text, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare me public.profiles;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'not signed in'; end if;
  if coalesce(trim(p_full_name), '') = '' or coalesce(trim(p_company), '') = '' then raise exception 'Enter your name and company.'; end if;
  if regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') !~ '^[0-9]{10,13}$' then raise exception 'Enter a valid mobile number.'; end if;
  -- the role can be chosen only while the profile is still incomplete, and never as admin
  if not public.profile_complete(me) and me.role <> 'admin' and p_role in ('tenant', 'owner') then
    perform set_config('app.onboarding', '1', true);
  end if;
  update profiles set full_name = left(trim(p_full_name), 120), phone = left(trim(p_phone), 20), company_name = left(trim(p_company), 160),
    role = case when me.role = 'admin' or p_role not in ('tenant', 'owner') then me.role else p_role end
  where id = me.id;
  perform set_config('app.onboarding', '', true);
end $$;
revoke all on function public.complete_profile(text, text, text, text) from public, anon;
grant execute on function public.complete_profile(text, text, text, text) to authenticated;

-- quotes and visits need a complete requester profile (the admin calls them back)
create or replace function public.require_complete_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles p where p.id = new.tenant_id and public.profile_complete(p)) then
    raise exception 'profile_incomplete';
  end if;
  return new;
end $$;
create trigger quotes_require_profile before insert on public.quotes for each row execute function public.require_complete_profile();
create trigger visits_require_profile before insert on public.visits for each row execute function public.require_complete_profile();

-- Google sign-ups: keep the name Google gives us
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    case when new.raw_user_meta_data->>'role' = 'owner' then 'owner' else 'tenant' end, -- never self-assign admin
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end $$;
