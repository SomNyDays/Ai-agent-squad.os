"use client";

import Link from "next/link";
import {FormEvent, useState} from "react";
import {useRouter} from "next/navigation";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/arena";
  if (!["/arena", "/mission-map", "/play", "/projects"].some((route) => value === route || value.startsWith(route + "/") || value.startsWith(route + "?"))) return "/arena";
  return value;
}

export default function AccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [mode, setMode] = useState<"email"|"invite">("email");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/access/email-code/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send a code.");
      setSent(true); setMessage(result.message || "Check your inbox for a six-digit code.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send a code."); }
    finally { setBusy(false); }
  }

  async function redeemEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/access/email-code/redeem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,code:emailCode})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to verify the code.");
      router.replace(safeNext(new URLSearchParams(window.location.search).get("next"))); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to verify the code."); }
    finally { setBusy(false); }
  }

  async function redeemInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/access/redeem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:inviteCode})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to redeem invite.");
      router.replace(safeNext(new URLSearchParams(window.location.search).get("next"))); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to redeem invite."); }
    finally { setBusy(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#080b12] px-5 py-10 text-slate-100">
    <section className="w-full max-w-md rounded-3xl border border-violet-300/20 bg-white/[.035] p-7 shadow-2xl shadow-violet-950/20 sm:p-9">
      <Link href="/" className="text-sm text-slate-400 hover:text-white">← AI Agent Squad OS</Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[.25em] text-violet-300">Squad access control</p>
      <h1 className="mt-3 text-3xl font-bold">Enter the Arena</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">Get a one-time access code by email, or use an invite code you already have. Codes unlock the Arena, Mission Map, Multiplayer, and Projects.</p>
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
        <button type="button" onClick={()=>{setMode("email");setError("");setMessage("");}} className={"rounded-lg px-3 py-2 text-sm font-semibold "+(mode==="email"?"bg-violet-500 text-white":"text-slate-400 hover:text-white")}>Email me a code</button>
        <button type="button" onClick={()=>{setMode("invite");setError("");setMessage("");}} className={"rounded-lg px-3 py-2 text-sm font-semibold "+(mode==="invite"?"bg-violet-500 text-white":"text-slate-400 hover:text-white")}>I have an invite</button>
      </div>
      {mode==="email" ? <div className="mt-5 space-y-4">
        <form onSubmit={requestCode} className="space-y-3">
          <label htmlFor="access-email" className="block text-sm font-medium text-slate-200">Email address</label>
          <input id="access-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required maxLength={254} placeholder="you@example.com" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-violet-300/70"/>
          <button disabled={busy} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60">{busy?"Sending…":"Send me an access code"}</button>
        </form>
        {sent && <form onSubmit={redeemEmailCode} className="space-y-3 border-t border-white/10 pt-4">
          <label htmlFor="email-code" className="block text-sm font-medium text-slate-200">Six-digit email code</label>
          <input id="email-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={emailCode} onChange={e=>setEmailCode(e.target.value.replace(/\\D/g,"").slice(0,6))} placeholder="123456" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-center font-mono text-xl tracking-[.35em] outline-none focus:border-violet-300/70"/>
          <p className="text-xs text-slate-500">The code expires in 10 minutes and works once.</p>
          <button disabled={busy} className="w-full rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-3 font-semibold text-violet-100 hover:bg-violet-400/20 disabled:opacity-60">{busy?"Verifying…":"Verify code and unlock"}</button>
        </form>}
      </div> : <form onSubmit={redeemInvite} className="mt-5 space-y-4">
        <label htmlFor="invite-code" className="block text-sm font-medium text-slate-200">Invite code</label>
        <input id="invite-code" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} required minLength={20} maxLength={29} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono tracking-wider outline-none focus:border-violet-300/70"/>
        <button disabled={busy} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white hover:bg-violet-400 disabled:opacity-60">{busy?"Checking invite…":"Unlock Squad OS"}</button>
      </form>}
      {message && <p role="status" className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/5 p-3 text-sm text-emerald-100">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-200">{error}</p>}
      <p className="mt-5 text-xs leading-5 text-slate-500">Codes are validated server-side. Access uses an HTTP-only session cookie. Email codes are single-use and expire after 10 minutes.</p>
    </section>
  </main>;
}
