import {NextResponse} from "next/server";
import {z} from "zod";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
const schema=z.object({code:z.string().trim().toUpperCase().regex(/^[A-HJ-NP-Z2-9]{7}$/),displayName:z.string().trim().min(2).max(32)});
export async function POST(request:Request){
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Enter a valid seven-character room code and player name."},{status:400});
 try{
  const auth=await createSupabaseServerClient();const {data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Sign in before joining a room."},{status:401});
  const admin=createSupabaseAdminClient();
  const {data:room,error}=await admin.rpc("join_game_room",{p_code:parsed.data.code,p_user_id:user.id,p_display_name:parsed.data.displayName});
  if(error){if(error.message.includes("ROOM_NOT_FOUND"))return NextResponse.json({error:"Room not found or no longer accepting players."},{status:404});if(error.message.includes("ROOM_FULL"))return NextResponse.json({error:"This room is full."},{status:409});throw error;}
  return NextResponse.json({room,joined:true});
 }catch(error){console.error("Room join failed:",error instanceof Error?error.message:"unknown error");return NextResponse.json({error:"Room service unavailable. Verify Supabase configuration and apply supabase/setup.sql."},{status:503});}
}
