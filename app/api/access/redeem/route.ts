import {NextResponse} from "next/server";
import {z} from "zod";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {createAccessToken, hashInviteCode, normalizeInviteCode} from "@/lib/arena-access";

const schema = z.object({code: z.string().trim().min(20).max(32)});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({error: "Enter a valid invite code."}, {status: 400, headers: {"Cache-Control": "no-store"}});
  }

  const code = normalizeInviteCode(parsed.data.code);
  if (!/^[A-HJ-NP-Z2-9]{20}$/.test(code)) {
    return NextResponse.json({error: "That invite code is invalid, expired, revoked, or already used."}, {status: 401, headers: {"Cache-Control": "no-store"}});
  }

  try {
    const admin = createSupabaseAdminClient();
    const {data, error} = await admin.rpc("redeem_arena_invite", {p_code_hash: await hashInviteCode(code)});
    if (error) throw error;
    const invite = Array.isArray(data) ? data[0] : null;
    if (!invite?.invite_id) {
      return NextResponse.json({error: "That invite code is invalid, expired, revoked, or already used."}, {status: 401, headers: {"Cache-Control": "no-store"}});
    }

    const session = await createAccessToken(invite.invite_id, invite.invite_expires_at ?? null);
    const response = NextResponse.json({ok: true, expiresAt: new Date(session.expiresAt * 1000).toISOString()}, {headers: {"Cache-Control": "no-store"}});
    response.cookies.set("arena_access", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000)),
    });
    return response;
  } catch (error) {
    console.error("Invite redemption failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({error: "Invite access is temporarily unavailable. Verify server configuration and apply supabase/arena_invites.sql."}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }
}
