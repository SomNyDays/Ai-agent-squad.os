/**
 * Multiplayer game model for Squad OS.
 *
 * This is a typed domain model, not a connected multiplayer backend. A real
 * server must validate all mutations, ownership, turn order, and rewards.
 */
export type GameRole = "owner" | "player" | "spectator";
export type GamePhase =
  | "lobby"
  | "briefing"
  | "research"
  | "strategy"
  | "boss_review"
  | "correction"
  | "deal_room"
  | "results"
  | "completed";

export type ObjectiveType =
  | "research"
  | "marketing"
  | "sponsorship"
  | "partnership"
  | "product"
  | "resale"
  | "licensing";

export interface GamePlayer {
  id: string;
  displayName: string;
  role: GameRole;
  ready: boolean;
  connected: boolean;
  score: number;
  reputation: number;
  contributionCount: number;
  teamId: string;
}

export interface GameRoom {
  id: string;
  code: string;
  title: string;
  hostPlayerId: string;
  maxPlayers: number;
  players: GamePlayer[];
  phase: GamePhase;
  round: number;
  maxRounds: number;
  turnPlayerId?: string;
  objective: string;
  objectiveType: ObjectiveType;
  rulesVersion: string;
  createdAt: string;
}

export interface GameAction {
  id: string;
  roomId: string;
  playerId: string;
  type: "submit_idea" | "submit_evidence" | "vote" | "boss_challenge" | "correction" | "propose_deal" | "approve_action";
  payload: Record<string, unknown>;
  createdAt: string;
  idempotencyKey: string;
}

export interface GameEvent {
  id: string;
  roomId: string;
  sequence: number;
  type: string;
  actorId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface BossRubric {
  id: string;
  version: string;
  criteria: Array<{
    key: string;
    label: string;
    weight: number;
    minimumScore: number;
    critical?: boolean;
  }>;
  passScore: number;
}

export const DEFAULT_ROOM_RULES = {
  minPlayers: 2,
  maxPlayers: 8,
  rounds: 5,
  turnSeconds: 90,
  phases: ["briefing", "research", "strategy", "boss_review", "correction", "deal_room", "results"] as GamePhase[],
  passScore: 80,
  requireEvidenceForClaims: true,
  requireHumanApprovalForExternalActions: true,
  prohibitSelfApproval: true,
  rewardVerifiedImpact: true,
  rewardOriginalityOnlyWhenFeasible: true
};

export function calculateTeamScore(input: {
  bossScore: number;
  evidenceQuality: number;
  originality: number;
  financialViability: number;
  teamwork: number;
  impact: number;
}) {
  // Evidence and safety are gates, not values that can be offset by creativity.
  const safe = [input.bossScore, input.evidenceQuality, input.originality,
    input.financialViability, input.teamwork, input.impact]
    .every(n => Number.isFinite(n) && n >= 0 && n <= 100);
  if (!safe) throw new Error("Scores must be finite numbers from 0 to 100.");
  const weighted = input.bossScore * 0.25 + input.evidenceQuality * 0.20 +
    input.originality * 0.15 + input.financialViability * 0.20 +
    input.teamwork * 0.10 + input.impact * 0.10;
  if (input.evidenceQuality < 60) return { score: Math.round(weighted), eligible: false, reason: "Evidence gate not met" };
  if (input.financialViability < 50) return { score: Math.round(weighted), eligible: false, reason: "Financial viability gate not met" };
  return { score: Math.round(weighted), eligible: weighted >= 80, reason: weighted >= 80 ? "Qualified" : "Score below pass threshold" };
}


/** Verified business impact converts directly to boss damage.
 * Defaults: $100 net income = 1 point, $250 revenue = 1 point, each sale = 5 points,
 * and each accepted output/deliverable = 3 points. Only verified, non-duplicated figures count.
 */
export interface BusinessImpactInput {
  netIncomeUsd: number;
  revenueUsd: number;
  salesCount: number;
  acceptedOutputs: number;
  verified: boolean;
}

export function calculateImpactPoints(input: BusinessImpactInput) {
  const values = [input.netIncomeUsd, input.revenueUsd, input.salesCount, input.acceptedOutputs];
  if (!values.every(n => Number.isFinite(n) && n >= 0)) {
    throw new Error("Income, revenue, sales, and output must be non-negative finite numbers.");
  }
  const points = input.verified
    ? Math.floor(input.netIncomeUsd / 100) + Math.floor(input.revenueUsd / 250) +
      Math.floor(input.salesCount) * 5 + Math.floor(input.acceptedOutputs) * 3
    : 0;
  return { points, bossDamage: points, eligible: input.verified, reason: input.verified ? "Verified impact counted" : "Pending verification: no damage awarded" };
}
