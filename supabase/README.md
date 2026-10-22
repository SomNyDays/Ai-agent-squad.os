# Supabase setup
1. Create a Supabase project.
2. Run `supabase/setup.sql` in the SQL Editor.
3. Copy root `.env.example` to `.env.local` and set the project URL, anon key, and server-only service-role key.
4. Enable email magic-link auth and add local/deployed `/auth/callback` URLs to allowed redirect URLs.
5. Test room creation and joining with two authenticated accounts.
Never commit secrets or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. The current multiplayer layer is an MVP room-create/join foundation, not a complete realtime game; presence, ready-up, authoritative rounds, rate limits, and security review remain before public production use.
