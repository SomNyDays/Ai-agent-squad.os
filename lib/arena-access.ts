const encoder = new TextEncoder();
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type ArenaAccessClaims = {
  v: 1;
  sub: string;
  iat: number;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function accessSecret() {
  const secret = process.env.ARENA_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ARENA_ACCESS_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(accessSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function normalizeInviteCode(input: string) {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export async function hashInviteCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(normalizeInviteCode(code)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function formatInviteCode(code: string) {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export async function createAccessToken(inviteId: string, inviteExpiresAt: string | null) {
  const now = Math.floor(Date.now() / 1000);
  const inviteExpiry = inviteExpiresAt ? Math.floor(new Date(inviteExpiresAt).getTime() / 1000) : Number.MAX_SAFE_INTEGER;
  const exp = Math.min(now + SESSION_TTL_SECONDS, inviteExpiry);
  if (!Number.isFinite(exp) || exp <= now) throw new Error("Invite code has expired.");

  const claims: ArenaAccessClaims = { v: 1, sub: inviteId, iat: now, exp };
  const payload = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(payload));
  return { token: payload + "." + base64UrlEncode(new Uint8Array(signature)), expiresAt: exp };
}

export async function verifyAccessToken(token: string | undefined | null): Promise<ArenaAccessClaims | null> {
  if (!token || token.length > 2048) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const payloadBytes = base64UrlDecode(parts[0]);
    const valid = await crypto.subtle.verify("HMAC", await signingKey(), base64UrlDecode(parts[1]), encoder.encode(parts[0]));
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<ArenaAccessClaims>;
    const now = Math.floor(Date.now() / 1000);
    if (claims.v !== 1 || typeof claims.sub !== "string" || !/^[0-9a-f-]{36}$/i.test(claims.sub)) return null;
    if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp) || !claims.iat || !claims.exp) return null;
    if (claims.iat! > now + 60 || claims.exp! <= now || claims.exp! <= claims.iat!) return null;
    return claims as ArenaAccessClaims;
  } catch {
    return null;
  }
}
