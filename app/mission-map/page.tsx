"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Agent = { id:string; name:string; role:string; emoji:string; color:string; hp:number; xp:number };
type Problem = { department:string; title:string; detail:string; boss:string; bossEmoji:string; solution:string };
const roster:Agent[] = [
 {id:"pixel",name:"PIXEL",role:"RESEARCH",emoji:"🛰️",color:"#60a5fa",hp:100,xp:0},
 {id:"nova",name:"NOVA",role:"STRATEGY",emoji:"🧙",color:"#c084fc",hp:100,xp:0},
 {id:"byte",name:"BYTE",role:"ENGINEERING",emoji:"🤖",color:"#34d399",hp:100,xp:0},
 {id:"tank",name:"TANK",role:"QUALITY",emoji:"🛡️",color:"#fbbf24",hp:100,xp:0}
];
const problems:Problem[] = [
 {department:"RESEARCH",title:"Unknown signal detected",detail:"The mission map is blocked by an encrypted signal. PIXEL must find trustworthy clues and expose the false trail.",boss:"THE MISINFORMATION WRAITH",bossEmoji:"👻",solution:"PIXEL triangulates the signal, verifies the evidence, and reveals a safe route."},
 {department:"STRATEGY",title:"Conflicting priorities",detail:"Two routes compete for scarce resources. NOVA must pick the plan with the best risk-to-reward balance.",boss:"THE CHAOS MIMIC",bossEmoji:"🦑",solution:"NOVA ranks the objectives, allocates resources, and gives the squad one clear plan."},
 {department:"ENGINEERING",title:"Broken system gateway",detail:"A corrupted service blocks the bridge. BYTE must isolate the fault and repair the gateway.",boss:"THE BUG KING",bossEmoji:"👾",solution:"BYTE isolates the defect, patches the gateway, and runs a verification check."},
 {department:"QUALITY",title:"Final integrity check",detail:"The exit is protected by a failure that could undo the whole mission. TANK must test the fix and hold the line.",boss:"THE NULL TITAN",bossEmoji:"🐲",solution:"TANK stress-tests the solution, catches the last edge case, and confirms the system is stable."}
];
const initialLogs=["SQUAD OS // Four specialists assembled.","MISSION CONTROL // Choose Deploy Squad to begin."];
export default function MissionMapPage(){
 const [agents,setAgents]=useState(roster);
 const [stage,setStage]=useState(-1);
 const [mode,setMode]=useState<"ready"|"running"|"fight"|"won"|"lost">("ready");
 const [bossHp,setBossHp]=useState(100);
 const [logs,setLogs]=useState(initialLogs);
 const [screenName,setScreenName]=useState("");
 const [score,setScore]=useState(0);
 const [saved,setSaved]=useState(false);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const problem=problems[Math.max(0,Math.min(stage,problems.length-1))];
 const log=(line:string)=>setLogs(old=>[line,...old].slice(0,6));
 useEffect(()=>{if(mode!=="running")return;const timer=window.setTimeout(()=>{const next=stage+1;if(next>=problems.length){setMode("won");setScore(s=>s+100);log("MISSION CLEAR // All departments completed the route.");return;}setStage(next);setBossHp(100);setMode("fight");setAgents(old=>old.map(a=>({...a,hp:Math.max(1,a.hp-3)})));log("⚠ BLOCKER FOUND // "+problems[next].department+" specialist engaging "+problems[next].boss+".");},1200);return()=>window.clearTimeout(timer);},[mode,stage]);
 function deploy(){if(screenName.trim().length<2){setMessage("Enter a screen name (at least 2 characters) to deploy.");return;}setAgents(roster);setStage(-1);setBossHp(100);setScore(0);setSaved(false);setMessage("");setLogs(["MISSION STARTED // Squad moving into the frontier.",...initialLogs]);setMode("running");}
 function strike(special=false){if(mode!=="fight")return;const active=agents.find(a=>a.role===problem.department)||agents[Math.max(0,stage)];const damage=special?38:22;const hp=Math.max(0,bossHp-damage);setBossHp(hp);setScore(s=>s+(special?20:10));setAgents(old=>old.map(a=>({...a,xp:a.xp+(special?12:6),hp:Math.max(0,a.hp-(hp===0?0: special?1:4))})));log((special?"SQUAD COMBO":"DEPARTMENT ATTACK")+" // "+active.name+" hits "+problem.boss+" for "+damage+".");if(hp===0){log("✓ BLOCKER SOLVED // "+problem.solution);setScore(s=>s+50);setMode("running");}}
 async function submitScore(){if(screenName.trim().length<2){setMessage("Enter a screen name first.");return;}setBusy(true);setMessage("Saving mission result…");const payload={screenName:screenName.trim(),gameId:crypto.randomUUID(),gameType:"mission",points:score+100,won:true};try{const r=await fetch("/api/leaderboard",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw new Error(data.error||"Sign in to save your score.");setSaved(true);setMessage("Mission score saved to the leaderboard.");}catch(e){setMessage(e instanceof Error?e.message:"Could not save score. Sign in and retry.");}finally{setBusy(false);}}
 return <main className="min-h-screen bg-[#070711] px-4 py-6 text-slate-100 md:px-8" style={{backgroundImage:"linear-gradient(rgba(95,72,170,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(95,72,170,.08) 1px,transparent 1px)",backgroundSize:"16px 16px"}}><div className="mx-auto max-w-6xl">
 <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5"><Link href="/" className="text-sm text-cyan-200">← SQUAD OS</Link><strong className="border-2 border-violet-400 bg-[#17112d] px-3 py-2 font-mono tracking-[.22em] text-violet-200 shadow-[4px_4px_0_#35215b]">▣ SQUAD QUEST // FRONTIER</strong><Link href="/leaderboard" className="text-sm text-amber-200">🏆 LEADERBOARD</Link></header>
 <div className="py-7"><p className="text-xs tracking-[.3em] text-cyan-300">PIXEL RPG // DEPARTMENT QUESTS</p><h1 className="mt-2 text-3xl font-black md:text-5xl">DEPLOY YOUR SQUAD</h1><p className="mt-3 max-w-3xl text-slate-400">Watch each specialist move through the frontier. When a problem appears in their department, a boss blocks the route. Fight it, solve the blocker, and advance to the next sector.</p></div>
 <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
 <section className="overflow-hidden border-2 border-violet-400/50 bg-[#0b0b1b] shadow-[6px_6px_0_#241a43]">
 <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><span className="text-xs font-bold tracking-widest text-cyan-200">FRONTIER MAP // SECTOR {stage<0?"00":String(stage+1).padStart(2,"0")}</span><span className={"text-xs "+(mode==="fight"?"text-rose-300":"text-emerald-300")}>● {mode.toUpperCase()}</span></div>
 <div className="relative min-h-[340px] overflow-hidden bg-[#100d25] p-5 md:min-h-[400px]" style={{backgroundImage:"radial-gradient(#54417b 1px,transparent 1px)",backgroundSize:"12px 12px"}}>
 <div className="absolute left-[10%] top-[48%] h-2 w-[78%] border-y-2 border-dashed border-violet-300/80 bg-cyan-400/10"/>
 <div className="absolute left-[10%] top-[48%] h-24 w-[78%] -translate-y-1/2 rounded-full border border-dashed border-cyan-300/15"/>
 {problems.map((p,i)=><div key={p.department} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center" style={{left:(12+i*25)+"%",top:"48%"}}><div className={ "mx-auto flex h-14 w-14 items-center justify-center border-2 text-2xl shadow-[3px_3px_0_rgba(0,0,0,.65)] "+(i<stage?"border-emerald-300/50 bg-emerald-950":i===stage?"border-rose-300 bg-rose-950 shadow-[0_0_25px_#fb718555]":"border-white/15 bg-slate-900")}>{i<stage?"✓":i===stage&&mode==="fight"?p.bossEmoji:["⌕","♟","⚙","⬡"][i]}</div><p className="mt-2 whitespace-nowrap text-[9px] font-bold tracking-wider text-slate-300">{p.department}</p></div>)}
 {agents.map((a,i)=><div key={a.id} className="absolute z-20 transition-all duration-700" style={{left:(mode==="ready"?4:Math.min(76,10+Math.max(0,stage)*23)+i*2)+"%",top:(12+i*19)+"%"}}><div className="flex items-center gap-2 border-2 bg-[#101020]/95 px-2 py-1.5 shadow-[3px_3px_0_#000]"> style={{borderColor:a.color+"88"}}><span className="text-xl">{a.emoji}</span><span className="text-[10px] font-black" style={{color:a.color}}>{a.name}</span></div></div>)}
 {mode==="fight"&&<div className="absolute bottom-4 left-1/2 z-30 w-[82%] -translate-x-1/2 rounded-2xl border border-rose-300/30 bg-rose-950/90 p-4 text-center shadow-[0_0_35px_#fb718522]"><div className="text-4xl">{problem.bossEmoji}</div><p className="mt-1 text-sm font-black tracking-widest text-rose-200">{problem.boss}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50"><div className="h-full bg-rose-400 transition-all" style={{width:bossHp+"%"}}/></div><p className="mt-1 text-xs text-rose-100">{bossHp}% THREAT INTEGRITY</p></div>}
 {mode==="ready"&&<div className="absolute bottom-5 left-5 rounded-xl border border-cyan-300/20 bg-black/50 px-4 py-3 text-xs text-cyan-100">MISSION READY · Squad waiting at base</div>}
 {mode==="won"&&<div className="absolute bottom-5 left-5 right-5 rounded-xl border border-emerald-300/30 bg-emerald-950/90 p-4 text-center text-emerald-200">🏆 FRONTIER CLEARED — ALL DEPARTMENTS SOLVED</div>}
 {mode==="lost"&&<div className="absolute bottom-5 left-5 right-5 rounded-xl border border-rose-300/30 bg-rose-950/90 p-4 text-center">Squad needs recovery. Redeploy to try again.</div>}
 </div><div className="grid grid-cols-2 gap-3 border-t-2 border-violet-400/30 bg-[#090916] p-4 md:grid-cols-4">{agents.map(a=><div key={a.id} className="border-2 border-white/10 bg-[#100f20] p-3"><div className="flex items-center gap-2"><span>{a.emoji}</span><span className="text-xs font-bold" style={{color:a.color}}>{a.name}</span></div><p className="mt-1 text-[10px] text-slate-500">{a.role}</p><div className="mt-2 h-1.5 rounded bg-slate-800"><div className="h-full rounded bg-emerald-400" style={{width:a.hp+"%"}}/></div><p className="mt-1 text-[10px] text-slate-400">HP {a.hp} · XP {a.xp}</p></div>)}</div>
 </section>
 <aside className="grid content-start gap-4">
 <section className="border-2 border-violet-300/20 bg-[#100e20] p-5 shadow-[4px_4px_0_#211637]"><label className="grid gap-2 text-xs text-slate-400">PLAYER CALLSIGN<input value={screenName} onChange={e=>setScreenName(e.target.value.slice(0,32))} maxLength={32} placeholder="Enter your screen name" className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50"/></label><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-500">BLOCKERS SOLVED</p><p className="mt-1 text-2xl font-black">{Math.min(4,Math.max(0,stage))+(mode==="won"?1:0)}</p></div><div className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-500">MISSION POINTS</p><p className="mt-1 text-2xl font-black text-cyan-200">{score}</p></div></div>
 {mode==="ready"&&<button onClick={deploy} className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200">🚀 DEPLOY SQUAD</button>}
 {mode==="fight"&&<div className="mt-4 grid gap-3"><p className="text-xs leading-5 text-slate-400"><strong className="text-rose-200">{problem.title}</strong><br/>{problem.detail}</p><button onClick={()=>strike(false)} className="rounded-xl border border-rose-300/30 bg-rose-950/70 px-4 py-3 font-bold text-rose-100">⚔️ {problem.department} ATTACK</button><button onClick={()=>strike(true)} className="rounded-xl border border-violet-300/30 bg-violet-950/70 px-4 py-3 font-bold text-violet-100">⚡ SQUAD COMBO</button></div>}
 {mode==="running"&&<div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-950/30 p-4 text-sm text-cyan-100"><span className="animate-pulse">◉</span> Squad traversing the map… next department encounter loading.</div>}
 {(mode==="won"||mode==="lost")&&<button onClick={deploy} className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 font-bold">↻ REDEPLOY NEW MISSION</button>}
 {mode==="won"&&!saved&&<button disabled={busy} onClick={()=>void submitScore()} className="mt-3 w-full rounded-xl bg-emerald-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{busy?"SAVING…":"🏆 SAVE LEADERBOARD SCORE"}</button>}
 {message&&<p className="mt-3 text-xs text-amber-200">{message} {!saved&&mode==="won"&&<Link href="/login?next=%2Fmission-map" className="underline">Sign in</Link>}</p>}
 </section>
 <section className="border-2 border-violet-300/20 bg-[#100e20] p-5 shadow-[4px_4px_0_#211637]"><h2 className="text-xs font-black tracking-widest text-cyan-200">MISSION COMMS</h2><div className="mt-3 grid gap-2">{logs.map((line,i)=><p key={i+line} className="border-l border-cyan-300/30 pl-3 text-xs leading-5 text-slate-400">{line}</p>)}</div></section>
 <section className="border-2 border-violet-300/20 bg-[#100e20] p-5 shadow-[4px_4px_0_#211637]"><h2 className="font-bold">Department protocol</h2><p className="mt-2 text-sm leading-6 text-slate-400">Research verifies clues. Strategy chooses the route. Engineering fixes the system. Quality tests the solution. Each blocker belongs to its specialist, but the squad can combine abilities to win.</p><p className="mt-3 text-xs text-slate-500">Combat and agent movement are currently game simulations, not live autonomous AI execution.</p></section>
 </aside></div></div></main>;
}
