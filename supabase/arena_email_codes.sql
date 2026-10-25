create table if not exists public.arena_email_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists arena_email_codes_email_created_idx
  on public.arena_email_codes (email, created_at desc);

alter table public.arena_email_codes enable row level security;
revoke all on public.arena_email_codes from public, anon, authenticated;
grant select, insert, update, delete on public.arena_email_codes to service_role;

create or replace function public.redeem_arena_email_code(p_email text, p_code_hash text)
returns table(code_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.arena_email_codes as c
     set used_at = now()
   where c.id = (
     select candidate.id
       from public.arena_email_codes as candidate
      where candidate.email = lower(trim(p_email))
        and candidate.code_hash = p_code_hash
        and candidate.used_at is null
        and candidate.expires_at > now()
      order by candidate.created_at desc
      limit 1
      for update
   )
   and c.used_at is null
  returning c.id;
end;
$$;

revoke all on function public.redeem_arena_email_code(text, text) from public, anon, authenticated;
grant execute on function public.redeem_arena_email_code(text, text) to service_role;
