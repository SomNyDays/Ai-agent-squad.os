create extension if not exists pgcrypto;

create table if not exists public.arena_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  label text not null check (char_length(label) between 2 and 80),
  max_uses integer not null default 1 check (max_uses between 1 and 10000),
  uses integer not null default 0 check (uses >= 0 and uses <= max_uses),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists arena_invites_active_idx
  on public.arena_invites (expires_at)
  where revoked_at is null;

alter table public.arena_invites enable row level security;
revoke all on public.arena_invites from public, anon, authenticated;
grant select, insert, update, delete on public.arena_invites to service_role;

create or replace function public.redeem_arena_invite(p_code_hash text)
returns table(invite_id uuid, invite_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.arena_invites as i
     set uses = i.uses + 1
   where i.code_hash = p_code_hash
     and i.revoked_at is null
     and (i.expires_at is null or i.expires_at > now())
     and i.uses < i.max_uses
  returning i.id, i.expires_at;
end;
$$;

revoke all on function public.redeem_arena_invite(text) from public, anon, authenticated;
grant execute on function public.redeem_arena_invite(text) to service_role;
