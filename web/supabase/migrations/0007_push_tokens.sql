-- One row per browser/device that allowed notifications.
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens(user_id);
alter table public.push_tokens enable row level security;
create policy "own tokens" on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_tokens to authenticated;
