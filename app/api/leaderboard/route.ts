import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const scoreSchema = z.object({
  screenName: z.string().trim().min(2).max(32),
  gameId: z.string().uuid(),
  gameType: z.enum(["arena", "mission", "multiplayer"]),
  points: z.number().int().min(0).max(5000),
  won: z.boolean(),
});

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("game_score_profiles")
      .select("screen_name,total_points,games_played,wins,best_score,updated_at")
      .order("total_points", { ascending: false })
      .order("wins", { ascending: false })
      .order("best_score", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ leaderboard: data ?? [] });
  } catch (error) {
    console.error("Leaderboard read failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Leaderboard is not ready. Apply supabase/leaderboard.sql and verify Supabase configuration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsed = scoreSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a screen name, game ID, game type, and valid final score." }, { status: 400 });
  }
  try {
    const auth = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Sign in before saving a leaderboard score." }, { status: 401 });
    }
    const { data, error } = await auth.rpc("record_game_score", {
      p_user_id: user.id,
      p_screen_name: parsed.data.screenName,
      p_game_id: parsed.data.gameId,
      p_game_type: parsed.data.gameType,
      p_points: parsed.data.points,
      p_won: parsed.data.won,
    });
    if (error) {
      if (error.message.toLowerCase().includes("game_score_profiles_screen_name_unique")) {
        return NextResponse.json({ error: "That screen name is already taken. Choose another one." }, { status: 409 });
      }
      if (error.message.includes("AUTH_REQUIRED")) {
        return NextResponse.json({ error: "Sign in before saving a score." }, { status: 401 });
      }
      throw error;
    }
    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Leaderboard score save failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not save score. Check the leaderboard migration and try again." }, { status: 503 });
  }
}
