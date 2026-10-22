import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const JoinRoom = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-HJ-NP-Z2-9]{7}$/),
  displayName: z.string().trim().min(2).max(32)
});

export async function POST(request: Request) {
  const body = JoinRoom.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Enter a valid 7-character room code and display name." }, { status: 400 });
  try {
    const auth = await createSupabaseServerClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in before joining a room." }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: room } = await admin.from("game_rooms").select("id,code,title,status,max_players").eq("code", body.data.code).maybeSingle();
    if (!room || room.status !== "lobby") return NextResponse.json({ error: "Room not found or no longer accepting players." }, { status: 404 });

    const { data: existing } = await admin.from("game_players").select("user_id").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
    if (existing) return NextResponse.json({ room, joined: true });

    const { count } = await admin.from("game_players").select("*", { count: "exact", head: true }).eq("room_id", room.id);
    if ((count ?? 0) >= room.max_players) return NextResponse.json({ error: "This room is full." }, { status: 409 });

    const { error } = await admin.from("game_players").insert({
      room_id: room.id, user_id: user.id, display_name: body.data.displayName, role: "player", team_id: "alpha", ready: false
    });
    if (error) return NextResponse.json({ error: "Could not join this room. You may already be joining it." }, { status: 409 });

    const { data: last } = await admin.from("game_events").select("sequence").eq("room_id", room.id).order("sequence", { ascending: false }).limit(1).maybeSingle();
    await admin.from("game_events").insert({
      room_id: room.id, sequence: (last?.sequence ?? 0) + 1, event_type: "player_joined",
      actor_user_id: user.id, payload: { displayName: body.data.displayName }
    });
    return NextResponse.json({ room, joined: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server configuration is incomplete. Check Supabase environment variables." }, { status: 503 });
  }
}
