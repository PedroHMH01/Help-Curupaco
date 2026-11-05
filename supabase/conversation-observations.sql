create table if not exists public.conversation_observations (
  id uuid primary key default gen_random_uuid(),
  freshworks_domain text not null
    check (freshworks_domain = 'sistemanextfit.myfreshworks.com'),
  conversation_id text not null
    check (length(conversation_id) between 1 and 120),
  agent_name text not null
    check (length(btrim(agent_name)) between 1 and 120),
  observation text not null
    check (length(btrim(observation)) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists conversation_observations_lookup_idx
  on public.conversation_observations
  (freshworks_domain, conversation_id, created_at, id);

alter table public.conversation_observations enable row level security;

revoke all on public.conversation_observations from public, anon, authenticated;
grant select, insert on public.conversation_observations to anon, authenticated;

drop policy if exists "Read conversation observations" on public.conversation_observations;
create policy "Read conversation observations"
  on public.conversation_observations
  for select
  to anon, authenticated
  using (freshworks_domain = 'sistemanextfit.myfreshworks.com');

drop policy if exists "Append conversation observations" on public.conversation_observations;
create policy "Append conversation observations"
  on public.conversation_observations
  for insert
  to anon, authenticated
  with check (freshworks_domain = 'sistemanextfit.myfreshworks.com');
