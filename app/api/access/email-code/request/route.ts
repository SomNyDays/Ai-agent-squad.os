import {NextResponse} from "next/server";
import {createHash, randomInt} from "node:crypto";
import {z} from "zod";

export const runtime = "nodejs";
const schema = z.object({email:z.string().trim().email().max(254).transform(v=>v.toLowerCase())});
const hash = (value:string) => createHash("sha256").update(value).digest("hex");

export async function POST(request:Request) {
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Enter a valid email address."},{status:400,headers:{"Cache-Control":"no-store"}});
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return NextResponse.json({error:"Email access is not configured yet. Please try again later."},{status:503,headers:{"Cache-Control":"no-store"}});
  const code = String(randomInt(0,1000000)).padStart(6,"0");
  const expiresAt = new Date(Date.now()+10*60*1000).toISOString();
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !serviceKey) throw new Error("Supabase server configuration is missing.");
    const inserted = await fetch(baseUrl + "/rest/v1/arena_email_codes", {
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":serviceKey,"Authorization":"Bearer "+serviceKey,"Prefer":"return=minimal"},
      body:JSON.stringify({email:parsed.data.email,code_hash:hash(code),expires_at:expiresAt})
    });
    if (!inserted.ok) throw new Error("Could not store one-time code.");
    const sent = await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({from,to:[parsed.data.email],subject:"Your AI Agent Squad OS access code",text:"Your AI Agent Squad OS access code is "+code+". It expires in 10 minutes and can only be used once. If you did not request this code, you can ignore this email."})
    });
    if (!sent.ok) {
      await fetch(baseUrl + "/rest/v1/arena_email_codes?email=eq."+encodeURIComponent(parsed.data.email)+"&code_hash=eq."+hash(code),{method:"DELETE",headers:{"apikey":serviceKey,"Authorization":"Bearer "+serviceKey}});
      throw new Error("Email provider rejected the message.");
    }
    return NextResponse.json({ok:true,message:"If this address can receive access codes, a code has been sent. It expires in 10 minutes."},{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    console.error("Arena email-code request failed:",error instanceof Error?error.message:"unknown error");
    return NextResponse.json({error:"We could not send an access code right now. Please try again later."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
