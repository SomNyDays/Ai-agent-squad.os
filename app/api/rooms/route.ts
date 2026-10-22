import {NextResponse} from "next/server";
import {z} from "zod";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
const schema=z.object({title:z.string().trim().min(3).max(80),objective:z.string().trim().min(10).max(1000),objectiveType:z.enum(["research","marketing","sponsorship","partnership","product","resale","licensing"]),maxPlayers:z.number().int().min(2).max(8),maxRounds:z.number().int().refine(n=>[3,5,7,10].includes(n)),displayName:z.string().trim().min(2).max(32)});
export async function POST(request:Request){
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Check the room title, challenge, player name, and settings."},{status:400});
 try{
  const auth=await createSupabaseServerClient();const {data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Sign in before creating a room."},{status:401});
  const admin=createSupabaseAdminClient();
  const {data:workspaceId,error:workspaceError}=await admin.rpc("ensure_personal_workspace",{p_user_id:user.id,p_name:parsed.data.displayName+"'s Workspace"});
  if(workspaceError)throw workspaceError;
  const {data:room,error}=await admin.rpc("create_game_room",{p_workspace_id:workspaceId,p_host_user_id:user.id,p_display_name:parsed.data.displayName,p_title:parsed.data.title,p_objective:parsed.data.objective,p_objective_type:parsed.data.objectiveType,p_max_players:parsed.data.maxPlayers,p_max_rounds:parsed.data.maxRounds});
  if(error)throw error;
  return NextResponse.json({room,created:true},{status:201});
 }catch(error){console.error("Room creation failed:",error instanceof Error?error.message:"unknown error");return NextResponse.json({error:"Room service unavailable. Verify Supabase configuration and apply supabase/setup.sql."},{status:503});}
}
