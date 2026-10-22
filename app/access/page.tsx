"use client";

import Link from "next/link";
import {FormEvent, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/arena";
  if (!["/arena", "/mission-map", "/play", "/projects"].some((route) => value === route || value.startsWith(route + "/") || value.startsWith(route + "?"))) return "/arena";
  return value;
}

export default function AccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/access/redeem", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({code}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to redeem invite.");
      router.replace(safeNext(searchParams.get("next")));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to redeem invite.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#080b12] px-5 py-10 text-slate-100">
    <section className="w-full max-w-md rounded-3xl border border-violet-300/20 bg-white/[.035] p-7 shadow-2xl shadow-violet-950/20 sm:p-9">
      <Link href="/" className="text-sm text-slate-400 hover:text-white">← AI Agent Squad OS</Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[.25em] text-violet-300">Squad access control</p>
      <h1 className="mt-3 text-3xl font-bold">Enter your invite code</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">Use a valid individual or team invite to unlock the Arena, Mission Map, Multiplayer, and Projects. Codes can be limited by uses and expiration.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label htmlFor="invite-code" className="block text-sm font-medium text-slate-200">Invite code</label>
        <input id="invite-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} required minLength={20} maxLength={29} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono tracking-wider outline-none focus:border-violet-300/70" />
        {error && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-200">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Checking invite…" : "Unlock Squad OS"}</button>
      </form>
      <p className="mt-5 text-xs leading-5 text-slate-500">Access is validated on the server. Your browser receives an HTTP-only session cookie; the invite itself is never stored in the browser.</p>
    </section>
  </main>;
}
