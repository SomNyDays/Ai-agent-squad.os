-- Prevent clients from forging leaderboard totals by calling the score RPC directly.
-- The current game result is client-controlled; only trusted server code may call this
-- function until a server-authoritative result validation flow is implemented.
revoke all on function public.record_game_score(uuid, text, uuid, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.record_game_score(uuid, text, uuid, text, integer, boolean)
  to service_role;
