# Multiplayer mode addendum

The UI currently remains a sandbox dashboard. The multiplayer domain model and SQL are scaffolding for a real shared-room game, not an active online service.

## Suggested game loop

1. **Lobby**: host creates a room, gets an invite code, players join, choose a role, and ready up.
2. **Briefing**: everyone sees the same business challenge, constraints, scoring rubric, round timer, and permitted actions.
3. **Research round**: players or agent teams submit claims with sources, retrieval dates, and confidence labels.
4. **Strategy round**: each team submits a distinct plan, business model, cost assumptions, risks, and low-cost experiment.
5. **Boss review**: independent evaluator grades each plan against a versioned rubric. Team members cannot self-approve.
6. **Correction round**: failed teams receive specific objections and resubmit. No level skip.
7. **Deal room**: players draft mock proposals and negotiate in-game. Real outreach, spending, contracts, and signatures stay gated behind explicit human approval.
8. **Results**: show transparent scoring, source quality, teamwork, originality, simulated/verified financial outcomes, and a replayable event timeline.

## Multiplayer criteria to implement

- Shared room state persisted on the server, not just browser state.
- Identity, display name, invite codes, roles, team assignment, ready state, reconnect/resume.
- Server-authoritative phase transitions, round timers, action validation, idempotency, and anti-cheat.
- Real-time presence and safe event broadcasts via Supabase Realtime or equivalent.
- Durable event log and deterministic replay for debugging and disputes.
- Team/co-op mode and optional competitive leaderboard.
- Fair scoring: evidence and safety are hard gates; originality earns points only when feasible; reward team contribution and measured impact.
- Voting/challenges must not replace independent boss review or source verification.
- Rate limits, room-code entropy, abuse reports, privacy controls, retention policies, and moderation.
- Accessible mobile UI, keyboard operation, reconnect status, and clear loading/error states.
- Explicit separation between game simulation and real-world business execution.

## Stack additions

Keep Next.js + TypeScript + PostgreSQL/Supabase Auth. Add Supabase Realtime for room presence and broadcast, durable background jobs for timers and AI grading, and server-side RPC/transactions for all state changes. Use optimistic UI only for non-authoritative presentation. The database/server remains authoritative for score, phase, deadlines, rewards, and approvals.


---

## Multiplayer expansion

See `app/multiplayer.ts` for room phases, player/action/event types, and fair scoring gates; see `supabase/multiplayer.sql` for the multiplayer persistence schema. Read `MULTIPLAYER.md` for the complete game loop, security requirements, and implementation checklist.

## Multiplayer room API and page

- `/play` provides the room creation/join interface.
- `POST /api/rooms` creates a room for an authenticated user who belongs to a workspace.
- `POST /api/rooms/join` joins an existing lobby by invite code and enforces capacity.
- `lib/supabase/server.ts` verifies the cookie-backed session; `lib/supabase/admin.ts` is server-only.
- Apply `supabase/schema.sql`, then `supabase/multiplayer.sql`, then review/apply `supabase/multiplayer_policies.sql`.

Important: this is not a claim of production certification. Configure Supabase Auth, rate limits, monitoring, and live-room synchronization; run security tests and a production build before launch. The room endpoint uses a service-role key only server-side and should be further hardened with transactional RPCs for race-safe capacity and event sequence allocation.
