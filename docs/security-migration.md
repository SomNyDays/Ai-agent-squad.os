# Security migration: private membership helpers

Apply this SQL once after `supabase/setup.sql` has created the workspace and game-room helpers.

The migration moves `is_workspace_member(uuid)` and `is_room_member(uuid)` from the exposed `public` schema into the non-exposed `private` schema, then updates dependent RLS policies. The functions remain callable by authenticated sessions and the server role only; their implementation must continue to scope membership checks to `auth.uid()`.

The leaderboard's `record_game_score` RPC is a separate design decision: it is a `SECURITY DEFINER` function intentionally exposed only to `authenticated`, validates that `auth.uid() = p_user_id`, and updates private score tables transactionally with an idempotency key on `(user_id, game_id)`. This prevents duplicate awards for the same account/game ID, but it does **not** prove that client-submitted points are legitimate. Competitive release should move score calculation/validation server-side and add rate limiting.

The leaderboard tables have RLS enabled and no direct client grants by design. Server-only admin access is used for public leaderboard reads; authenticated score writes go through the constrained RPC. Never place the service-role key in a `NEXT_PUBLIC_*` variable or client bundle.
