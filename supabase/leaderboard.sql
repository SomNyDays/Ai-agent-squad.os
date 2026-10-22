create table if not exists public.game_score_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  screen_name text not null check (char_length(screen_name) between 2 and 32),
  total_points bigint not null default 0 check (total_points >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  wins integer not null default 0 check (wins >= 0 and wins <= games_played),
  best_score integer not null default 0 check (best_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists game_score_profiles_screen_name_unique
  on public.game_score_profiles (lower(screen_name));
create index if not exists game_score_profiles_leaderboard_idx
  on public.game_score_profiles (total_points desc, wins desc, best_score desc);

create table if not exists public.game_score_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null,
  screen_name text not null check (char_length(screen_name) between 2 and 32),
  game_type text not null check (game_type in ('arena','mission','multiplayer')),
  points integer not null check (points between 0 and 5000),
  won boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, game_id)
);
create index if not exists game_score_events_user_created_idx
  on public.game_score_events (user_id, created_at desc);

alter table public.game_score_profiles enable row level security;
alter table public.game_score_events enable row level security;
revoke all on public.game_score_profiles from anon, authenticated;
revoke all on public.game_score_events from anon, authenticated;

create or replace function public.record_game_score(
  p_user_id uuid,
  p_screen_name text,
  p_game_id uuid,
  p_game_type text,
  p_points integer,
  p_won boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_profile public.game_score_profiles;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_screen_name is null or char_length(trim(p_screen_name)) < 2
     or char_length(trim(p_screen_name)) > 32 then
    raise exception 'INVALID_SCREEN_NAME';
  end if;
  if p_game_type not in ('arena','mission','multiplayer')
     or p_points is null or p_points < 0 or p_points > 5000 then
    raise exception 'INVALID_SCORE';
  end if;

  insert into public.game_score_profiles(user_id, screen_name)
    values (p_user_id, trim(p_screen_name))
    on conflict (user_id) do update
      set screen_name = excluded.screen_name, updated_at = now();

  insert into public.game_score_events(user_id, game_id, screen_name, game_type, points, won)
    values (p_user_id, p_game_id, trim(p_screen_name), p_game_type, p_points, coalesce(p_won, false))
    on conflict (user_id, game_id) do nothing
    returning id into v_event_id;

  if v_event_id is not null then
    update public.game_score_profiles
      set total_points = total_points + p_points,
          games_played = games_played + 1,
          wins = wins + case when coalesce(p_won, false) then 1 else 0 end,
          best_score = greatest(best_score, p_points),
          updated_at = now()
      where user_id = p_user_id;
  end if;

  select * into v_profile from public.game_score_profiles where user_id = p_user_id;
  return jsonb_build_object(
    'screen_name', v_profile.screen_name,
    'total_points', v_profile.total_points,
    'games_played', v_profile.games_played,
    'wins', v_profile.wins,
    'best_score', v_profile.best_score,
    'duplicate_submission', v_event_id is null
  );
end;
$$;

revoke all on function public.record_game_score(uuid,text,uuid,text,integer,boolean) from public, anon;
grant execute on function public.record_game_score(uuid,text,uuid,text,integer,boolean) to authenticated;
