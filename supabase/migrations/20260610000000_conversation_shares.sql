create table if not exists public.conversation_shares (
  id text primary key,
  title text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.conversation_shares enable row level security;

create index if not exists conversation_shares_expires_at_idx
  on public.conversation_shares (expires_at);

create or replace function public.touch_conversation_shares_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversation_shares_touch_updated_at
  on public.conversation_shares;

create trigger conversation_shares_touch_updated_at
before update on public.conversation_shares
for each row
execute function public.touch_conversation_shares_updated_at();

drop policy if exists "conversation shares are readable by id until expiry"
  on public.conversation_shares;

create policy "conversation shares are readable by id until expiry"
on public.conversation_shares
for select
to anon
using (expires_at > now());

drop policy if exists "conversation shares can be created through app server"
  on public.conversation_shares;

create policy "conversation shares can be created through app server"
on public.conversation_shares
for insert
to anon
with check (
  expires_at > now()
  and expires_at <= now() + interval '30 days'
  and octet_length(data::text) <= 1048576
);
