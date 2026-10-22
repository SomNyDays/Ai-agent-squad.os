import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ error: "Leaderboard is not ready. Verify Supabase configuration." }, { status: 503 });
  }
}

// Scores must come from trusted, server-validated game results. The current Arena
// runs in the browser, so accepting points/won from a client would allow score forgery.
// Keep submissions closed until a server-authoritative result flow is implemented.
export async function POST() {
  return NextResponse.json(
    { error: "Score submissions are temporarily unavailable while server-validated game results are being implemented." },
    { status: 503 },
  );
}
