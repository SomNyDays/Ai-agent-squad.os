"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Users, ShieldCheck, Swords, Trophy, Radio, LoaderCircle } from "lucide-react";

type Room = {
  id: string; code: string; title: string; status: string; phase: string;
  current_round: number; max_rounds: number; max_players: number; objective: string; objective_type: string;
};

export default function PlayPage() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [title, setTitle] = useState("Revenue Lab: First Contact");
  const [objective, setObjective] = useState("Find and validate three realistic revenue opportunities through sponsorships, partnerships, advertising, or licensing.");
  const [objectiveType, setObjectiveType] = useState("partnership");
  const [maxPlayers, setMaxPlayers] = useState("8");
  const [maxRounds, setMaxRounds] = useState("5");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setRoom(null);
    try {
      const endpoint = mode === "create" ? "/api/rooms" : "/api/rooms/join";
      const payload = mode === "create"
        ? { title, objective, objectiveType, maxPlayers: Number(maxPlayers), maxRounds: Number(maxRounds), displayName }
        : { code, displayName };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not complete this action.");
      setRoom(data.room);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#080b12] text-slate-100">
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back to Squad OS</Link>
      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4 text-violet-200"><Gamepad2 size={28}/></div>
        <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-violet-300">Squad OS / Multiplayer</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Enter the strategy arena</h1><p className="mt-2 max-w-2xl text-slate-400">Create a shared challenge room or join your team with an invite code. Real rooms require a configured Supabase project and signed-in accounts.</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[.035] p-5 md:p-7">
          <div className="mb-6 flex gap-2 rounded-xl bg-black/30 p-1">
            <button onClick={() => setMode("create")} className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium ${mode === "create" ? "bg-violet-500 text-white" : "text-slate-400"}`}>Create a room</button>
            <button onClick={() => setMode("join")} className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium ${mode === "join" ? "bg-violet-500 text-white" : "text-slate-400"}`}>Join a room</button>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <label className="block text-sm text-slate-300">Your player name<input required minLength={2} maxLength={32} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Choose a name" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400"/></label>
            {mode === "create" ? <>
              <label className="block text-sm text-slate-300">Room title<input required minLength={3} maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400"/></label>
              <label className="block text-sm text-slate-300">Business challenge<textarea required minLength={10} maxLength={1000} value={objective} onChange={e=>setObjective(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400"/></label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm text-slate-300">Challenge type<select value={objectiveType} onChange={e=>setObjectiveType(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111521] px-3 py-3 text-white">{["research","marketing","sponsorship","partnership","product","resale","licensing"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
                <label className="block text-sm text-slate-300">Players<select value={maxPlayers} onChange={e=>setMaxPlayers(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111521] px-3 py-3 text-white">{["2","3","4","5","6","7","8"].map(x=><option key={x}>{x}</option>)}</select></label>
                <label className="block text-sm text-slate-300">Rounds<select value={maxRounds} onChange={e=>setMaxRounds(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111521] px-3 py-3 text-white">{["3","5","7","10"].map(x=><option key={x}>{x}</option>)}</select></label>
              </div>
            </> : <label className="block text-sm text-slate-300">7-character invite code<input required value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={7} minLength={7} placeholder="ABCD234" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono uppercase tracking-[.25em] text-white outline-none focus:border-violet-400"/></label>}
            {error && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3.5 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60">{busy && <LoaderCircle size={17} className="animate-spin" />}{mode === "create" ? "Create multiplayer room" : "Join strategy room"}</button>
            <p className="text-xs leading-5 text-slate-500">Room creation and joining require authentication. The server checks membership and room capacity; scores must never be trusted from a client.</p>
          </form>
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
            <h2 className="mb-5 text-lg font-semibold">How a match works</h2>
            {[
              [Users,"Team up","Create a private room and invite other players."],
              [Swords,"Build & challenge","Research claims, pitch strategies, and challenge weak evidence."],
              [ShieldCheck,"Boss review","An independent evaluator grades each project against a shared rubric."],
              [Trophy,"Earn the win","Points reward evidence, viability, originality, teamwork, and impact."]
            ].map(([Icon,heading,description]) => <div key={String(heading)} className="mb-5 flex gap-3 last:mb-0"><div className="rounded-xl bg-white/5 p-2.5 text-violet-200"><Icon size={18}/></div><div><h3 className="text-sm font-medium">{String(heading)}</h3><p className="mt-1 text-sm leading-5 text-slate-400">{String(description)}</p></div></div>)}
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[.045] p-5"><div className="flex items-center gap-2 text-emerald-200"><Radio size={17}/><span className="text-sm font-semibold">Fair play rules</span></div><ul className="mt-3 space-y-2 text-sm leading-5 text-slate-400"><li>• Shared, server-authoritative state</li><li>• No self-approval of projects</li><li>• Evidence and financial viability are scoring gates</li><li>• Real spending and external deals require human approval</li></ul></div>
        </aside>
      </div>
      {room && <section aria-live="polite" className="mt-6 rounded-3xl border border-violet-300/25 bg-violet-300/[.06] p-6">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-200">Room ready</p><h2 className="mt-2 text-2xl font-semibold">{room.title}</h2><p className="mt-2 text-slate-300">{room.objective}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-black/25 p-4"><p className="text-xs text-slate-500">Invite code</p><p className="mt-1 font-mono text-2xl tracking-[.2em]">{room.code}</p></div>
          <div className="rounded-xl bg-black/25 p-4"><p className="text-xs text-slate-500">Players</p><p className="mt-1 text-2xl">{room.max_players} max</p></div>
          <div className="rounded-xl bg-black/25 p-4"><p className="text-xs text-slate-500">Game length</p><p className="mt-1 text-2xl">{room.max_rounds} rounds</p></div>
        </div>
        <p className="mt-4 text-sm text-amber-200">The lobby record exists, but live presence, ready-up controls, and phase transitions must be enabled before a complete match can run.</p>
      </section>}
      <footer className="mt-8 flex items-center gap-2 text-xs text-slate-600"><ShieldCheck size={14}/> Game scores and phase changes must be validated by trusted server logic.</footer>
    </div>
  </main>;
}
