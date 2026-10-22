"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Entry = {
  screen_name: string;
  total_points: number;
  games_played: number;
  wins: number;
  best_score: number;
  updated_at: string;
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load leaderboard.");
      setEntries(data.leaderboard ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return <main className="min-h-screen bg-[#080b12] px-5 py-8 text-slate-100">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <Link href="/" className="text-sm text-blue-300">← HOME</Link>
        <strong>🏆 SQUAD OS // GLOBAL RANKINGS</strong>
        <Link href="/login" className="rounded-xl border border-violet-300/20 px-4 py-2 text-sm text-violet-200 hover:bg-violet-300/10">Sign in to save scores</Link>
      </header>
      <section className="py-10">
        <p className="text-xs tracking-[.3em] text-violet-300">ALL-TIME SCOREBOARD</p>
        <h1 className="mt-2 text-4xl font-bold">Global Leaderboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Cumulative points earned by each screen name across recorded games. Rankings use total points, then wins, then best single-game score.</p>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#263750] bg-[#0e1727]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-bold">🏅 TOP PLAYERS</h2>
          <button onClick={() => void refresh()} disabled={loading} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">{loading ? "Refreshing…" : "↻ Refresh"}</button>
        </div>
        {error && <p role="alert" className="m-5 rounded-xl border border-rose-300/20 bg-rose-950/30 p-4 text-sm text-rose-200">{error}</p>}
        {loading ? <p className="p-6 text-sm text-slate-400">Loading rankings…</p> : !error && entries.length === 0 ? <div className="p-8 text-center"><p className="text-lg font-semibold">First run, first record.</p><p className="mt-2 text-sm text-slate-400">Finish a game to claim the first spot on the board.</p><Link href="/arena" className="mt-5 inline-flex rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold">Enter the Arena</Link></div> : !error && <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-black/20 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Rank</th><th className="px-5 py-4">Screen name</th><th className="px-5 py-4 text-right">Total points</th><th className="px-5 py-4 text-right">Games</th><th className="px-5 py-4 text-right">Wins</th><th className="px-5 py-4 text-right">Best game</th></tr></thead>
            <tbody>{entries.map((entry, index) => <tr key={entry.screen_name} className="border-t border-white/5 hover:bg-white/[.025]">
              <td className="px-5 py-4 font-bold text-violet-200">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "#" + (index + 1)}</td>
              <td className="px-5 py-4 font-semibold">{entry.screen_name}</td>
              <td className="px-5 py-4 text-right font-bold tabular-nums text-emerald-200">{entry.total_points.toLocaleString()}</td>
              <td className="px-5 py-4 text-right tabular-nums">{entry.games_played.toLocaleString()}</td>
              <td className="px-5 py-4 text-right tabular-nums">{entry.wins.toLocaleString()}</td>
              <td className="px-5 py-4 text-right tabular-nums">{entry.best_score.toLocaleString()}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
      <footer className="mt-6 flex flex-wrap gap-3 text-sm"><Link href="/arena" className="rounded-xl border border-white/10 px-4 py-3 text-slate-300 hover:border-violet-300/40">Play Agent Battle Arena</Link><Link href="/play" className="rounded-xl border border-white/10 px-4 py-3 text-slate-300 hover:border-violet-300/40">Multiplayer</Link></footer>
    </div>
  </main>;
}
