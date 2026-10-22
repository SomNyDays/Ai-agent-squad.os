import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {z} from "zod";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {formatInviteCode, generateInviteCode, hashInviteCode} from "@/lib/arena-access";

export const runtime = "nodejs";
const schema = z.object({
  label: z.string().trim().min(2).max(80),
  maxUses: z.number().int().min(1).max(10000).optional().default(1),
  expiresInHours: z.number().int().min(1).max(8760).optional().default(72),
});

function authorized(request: Request) {
  const expected = process.env.ARENA_INVITE_ADMIN_SECRET;
  const supplied = request.headers.get("x-arena-admin-secret");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({error: "Unauthorized."}, {status: 401, headers: {"Cache-Control": "no-store"}});
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: "Provide a label, optional maxUses (1-10000), and expiresInHours (1-8760)."}, {status: 400, headers: {"Cache-Control": "no-store"}});

  try {
    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 60 * 60 * 1000).toISOString();
    const admin = createSupabaseAdminClient();
    const {data, error} = await admin.from("arena_invites").insert({
      code_hash: await hashInviteCode(code),
      label: parsed.data.label,
      max_uses: parsed.data.maxUses,
      expires_at: expiresAt,
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({
      inviteId: data.id,
      label: parsed.data.label,
      code: formatInviteCode(code),
      maxUses: parsed.data.maxUses,
      expiresAt,
      warning: "Copy this code now. It cannot be retrieved again.",
    }, {status: 201, headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    console.error("Invite creation failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({error: "Could not create invite. Verify server configuration and apply supabase/arena_invites.sql."}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }
}
