# AI Agent Squad OS

Next.js App Router application featuring an interactive local agent-vs-boss arena, a mission map, and a starter multiplayer room interface.

## Routes
- `/` home
- `/arena` playable local agent arena
- `/play` multiplayer room interface
- `/mission-map` mission-map prototype (to be migrated into app routing if absent)
- `/api/health` health check

## Local development
Use Node.js 20 or newer:
```bash
npm install
npm run dev
npm run typecheck
npm run build
```

The arena runs without Supabase. Multiplayer requires server-side API and database configuration; the room UI should be treated as an integration placeholder until the endpoints and SQL migrations are configured.

## Environment
Copy `.env.example` to `.env.local`. Never commit real credentials, especially the service-role key. A GitHub Actions workflow runs the typecheck and production build.
