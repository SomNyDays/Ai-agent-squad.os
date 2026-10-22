import {NextResponse} from "next/server"; export async function GET(){return NextResponse.json({status:"ok",application:"ai-agent-squad-os",timestamp:new Date().toISOString()});}
