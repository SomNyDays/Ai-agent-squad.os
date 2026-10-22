# Global cumulative leaderboard

## Database setup

Apply `supabase/setup.sql` if it has not already been applied, then apply `supabase/leaderboard.sql` in the Supabase SQL Editor. The leaderboard uses Supabase Auth identity, not screen name alone, to prevent one account from writing scores for another account.

## How scoring works

The Arena awards 10 points for a normal attack, 15 for a squad strike, 100 for each boss defeated, and a 500-point clear bonus for defeating all three bosses. At the end of a run, the browser submits one result with a generated game ID. The database's unique (user, game ID) constraint makes repeat submissions idempotent. Each account has one screen name; screen names are case-insensitively unique. The leaderboard sorts by cumulative points, then wins, then best single-game score.

The API requires a signed-in Supabase account to save scores. The public leaderboard can be read without signing in. If a user finishes a game while signed out, the result remains on screen and can be retried after signing in.

## Trust model

This first version protects account ownership and prevents duplicate submission of the same game ID, but it is not a cheat-proof competitive ranking: a modified browser can fabricate a result or submit many distinct game IDs. Before running prize-bearing or competitive events, move scoring to server-validated game sessions with server-recorded actions and rate limits.
