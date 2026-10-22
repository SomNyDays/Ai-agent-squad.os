import {NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";
export async function GET(request:Request){
 const url=new URL(request.url);const code=url.searchParams.get("code");const target=url.searchParams.get("next")??"/play";const next=target.startsWith("/")&&!target.startsWith("//")?target:"/play";
 if(code){try{const supabase=createSupabaseServerClient();const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin));}catch{}}
 return NextResponse.redirect(new URL("/login?error=auth_callback",url.origin));
}
