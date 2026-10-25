import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {z} from "zod";
import {createAccessToken} from "@/lib/arena-access";

export const runtime = "nodejs";
const schema = z.object({email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),code:z.string().trim().regex(/^\d{6}$/)});
const hash = (value:string) => createHash("sha256").update(value).digest("hex");

export async function POST(request:Request) {
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Enter your email and the six-digit code."},{status:400,headers:{"Cache-Control":"no-store"}});
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !serviceKey || !process.env.ARENA_ACCESS_SECRET || process.env.ARENA_ACCESS_SECRET.length<32) throw new Error("Server access configuration is missing.");
    const response = await fetch(baseUrl+"/rest/v1/rpc/redeem_arena_email_code",{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":serviceKey,"Authorization":"Bearer "+serviceKey},
      body:JSON.stringify({p_email:parsed.data.email,p_code_hash:hash(parsed.data.code)})
    });
    if (!response.ok) throw new Error("Could not validate one-time code.");
    const rows = await response.json();
    const row = Array.isArray(rows)?rows[0]:null;
    if (!row?.code_id) return NextResponse.json({error:"That code is incorrect, expired, or already used. Request a new one."},{status:401,headers:{"Cache-Control":"no-store"}});
    const session = await createAccessToken(row.code_id,null);
    const result = NextResponse.json({ok:true,expiresAt:new Date(session.expiresAt*1000).toISOString()},{headers:{"Cache-Control":"no-store"}});
    result.cookies.set("arena_access",session.token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:Math.max(0,session.expiresAt-Math.floor(Date.now()/1000))});
    return result;
  } catch (error) {
    console.error("Arena email-code redemption failed:",error instanceof Error?error.message:"unknown error");
    return NextResponse.json({error:"Email-code access is temporarily unavailable. Please try again later."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
