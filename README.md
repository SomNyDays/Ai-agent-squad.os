# AI Agent Squad OS

A Next.js App Router project with a playable local agent-vs-boss arena, a mission-map prototype, and a starter Supabase-backed multiplayer room flow.

## Routes
- `/` — home and navigation
- `/arena` — local agent combat simulation with mission progress, health, energy, XP, three bosses, healing, telemetry, and restart
- `/mission-map` — local sector-selection simulation
- `/play` — multiplayer room create/join UI
- `/login` — passwordless email sign-in
- `/auth/callback` — magic-link callback
- `/api/health` — health check
- `POST /api/rooms` — create an authenticated room
- `POST /api/rooms/join` — join an authenticated room using an invite code

## Local development
Use Node.js 20 or newer:
```bash
cp .env.example .env.local
npm install
npm run dev
npm run typecheck
npm run build
```
The arena and mission map work without Supabase. Authentication and multiplayer require a configured Supabase project.

## Supabase configuration
1. Create a Supabase project.
2. Run `supabase/setup.sql` in the Supabase SQL Editor.
3. Copy values from `.env.example` to `.env.local` and set the project URL, anon key, and server-only service-role key.
4. In Supabase Auth, enable email magic links and add local/deployed `/auth/callback` URLs to the allowed redirect URLs.
5. Test room creation and joining with two authenticated accounts.

Never commit real secrets or expose `SUPABASE_SERVICE_ROLE_KEY` to client code. See `supabase/README.md` for setup notes.

## Build automation
GitHub Actions runs `npm install`, `npm run typecheck`, and `npm run build` on pushes and pull requests to `main`.

## Production status
The arena and mission map are front-end simulations, not live autonomous AI execution. Multiplayer is an MVP create/join foundation; realtime presence, ready-up, server-authoritative match transitions, rate limits, monitoring, and a security review are still needed before public production use.
