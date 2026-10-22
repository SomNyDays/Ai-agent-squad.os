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


## Boss fight visual prototype

Open `/boss-fight` for a turn-based neon arena prototype with an original blue-vs-red cybernetic boss visual, health/energy bars, combat actions, and a combat log. It is a local UI simulation only; it is not connected to multiplayer room state or an authoritative combat service. The visual uses broad neon cyberpunk arena tropes rather than film logos, characters, or copied frames.


## Business impact damage scoring

The boss-fight prototype now converts verified business impact into direct boss damage: **1 impact point = 1 damage**. Default tunable weights are $100 net income = 1 point, $250 revenue = 1 point, 5 points per sale, and 3 points per accepted output/deliverable. Unverified numbers award zero damage. Revenue, income, and sales must be evidenced and transaction values should not be double-counted. The browser checkbox is only a prototype trust toggle; production must verify evidence server-side and award damage from authoritative records.

## Neon Frontier mission map

The `/mission-map` route provides a top-down, Zelda-inspired level-selection flow with original neon-grid sci-fi styling, selectable sector nodes, assigned agent/guardian details, a process feed, and a local simulated level-run action. It is a front-end prototype: the feed and progression are local state, not actual streamed AI execution. For production, publish server-authoritative job events and verify boss scores and business evidence before advancing persistent player state.
