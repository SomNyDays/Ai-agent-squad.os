"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRightLeft, CheckCircle2, ClipboardList, GitBranch, ShieldCheck, Sparkles } from "lucide-react";

type Department = "Research" | "Strategy" | "Engineering" | "Quality";
type TaskStatus = "Queued" | "In progress" | "In review" | "Complete";
type Task = { id: number; title: string; detail: string; department: Department; status: TaskStatus; history: string[]; created_at?: string; updated_at?: string };
type Action = "handoff" | "review" | "approve" | "revise";
const departments: Department[] = ["Research", "Strategy", "Engineering", "Quality"];
const agents: Record<Department, string> = { Research: "PIXEL", Strategy: "NOVA", Engineering: "BYTE", Quality: "TANK" };
const routing: Record<Department, Department> = { Research: "Strategy", Strategy: "Engineering", Engineering: "Quality", Quality: "Research" };
const initialTasks: Task[] = [
  { id: 1, title: "Map the buyer landscape", detail: "Identify likely customer segments and evidence needed before outreach.", department: "Research", status: "In progress", history: ["Demo task assigned to PIXEL (Research)."] },
  { id: 2, title: "Review mission architecture", detail: "Check handoff rules, error recovery, and release checkpoints.", department: "Engineering", status: "In review", history: ["Demo task assigned to BYTE (Engineering).", "Submitted to TANK (Quality) for review."] },
];

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [filter, setFilter] = useState<"All" | TaskStatus>("All");
  const [notice, setNotice] = useState("Connecting to your project workspace…");
  const [persistent, setPersistent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === "All" || task.status === filter), [tasks, filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;
        if (response.ok) {
          setTasks(data.tasks ?? []);
          setPersistent(true);
          setNotice("PERSISTENT WORKSPACE ONLINE · Changes are saved to Supabase.");
        } else if (response.status === 401) {
          setPersistent(false);
          setNotice("DEMO MODE · Sign in to save tasks across sessions. Demo actions stay in this browser session.");
        } else {
          setNotice(data.error || "Workspace unavailable. Showing demo tasks.");
        }
      } catch {
        if (!cancelled) setNotice("API unavailable. Showing demo tasks; your changes will not persist.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addTask = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setNotice("Add a task title before creating a project item."); return; }
    if (busy) return;
    setBusy(true);
    const cleanDetail = detail.trim() || "No additional brief supplied.";
    try {
      if (persistent) {
        const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: cleanTitle, detail: cleanDetail }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not save task.");
        setTasks((current) => [data.task, ...current]);
        setNotice("Task saved and routed to PIXEL (Research).");
      } else {
        const id = Math.max(0, ...tasks.map((task) => task.id)) + 1;
        setTasks((current) => [{ id, title: cleanTitle, detail: cleanDetail, department: "Research", status: "Queued", history: ["Demo task created and routed to PIXEL (Research)."] }, ...current]);
        setNotice("Demo task created locally. Sign in to enable persistent storage.");
      }
      setTitle(""); setDetail("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Task creation failed.");
    } finally { setBusy(false); }
  };

  const updateTask = async (id: number, action: Action) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.status === "Complete" || busy) return;
    if (action === "approve" && (task.department !== "Quality" || task.status !== "In review")) {
      setNotice("For the quality gate, submit the task to TANK (Quality) before approving it.");
      return;
    }
    setBusy(true);
    try {
      if (persistent) {
        const response = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Task update failed.");
        setTasks((current) => current.map((item) => item.id === id ? data.task : item));
        setNotice(`Task #${id} saved · ${action.toUpperCase()}.`);
        return;
      }
      let department = task.department;
      let status = task.status;
      let message = "";
      if (action === "handoff") {
        department = routing[task.department];
        status = department === "Quality" ? "In review" : "In progress";
        message = `Handoff: ${agents[task.department]} → ${agents[department]} (${task.department} → ${department}).`;
      } else if (action === "review") {
        department = "Quality"; status = "In review";
        message = "Submitted to TANK (Quality) for independent review.";
      } else if (action === "approve") {
        status = "Complete"; message = "Quality gate passed. Marked complete by human operator.";
      } else {
        department = "Engineering"; status = "In progress";
        message = "Revision requested; returned to BYTE (Engineering).";
      }
      setTasks((current) => current.map((item) => item.id === id ? { ...item, department, status, history: [...item.history, message].slice(-100) } : item));
      setNotice(`Demo task #${id} updated locally. Sign in to persist changes.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Task update failed.");
    } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#080b12] text-slate-100">
    <div className="mx-auto max-w-6xl px-5 py-7 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-violet-200 hover:text-white"><ArrowLeft size={16}/> Squad home</Link>
        <div className="flex items-center gap-2 text-xs text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300"/> {persistent ? "PERSISTENT WORKSPACE" : "PROJECT WORKSPACE"}</div>
      </header>
      <section className="py-10">
        <p className="text-xs font-semibold uppercase tracking-[.3em] text-violet-300">Mission control // Human governed</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Project Command Center</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-400">Create work items, route them between specialist departments, request revisions, and inspect the handoff history. Signed-in workspaces save task state to Supabase; demo mode is local only.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[{label:"OPEN TASKS",value:tasks.filter(t=>t.status!=="Complete").length},{label:"IN REVIEW",value:tasks.filter(t=>t.status==="In review").length},{label:"COMPLETED",value:tasks.filter(t=>t.status==="Complete").length},{label:"DEPARTMENTS",value:departments.length}].map(item=><div key={item.label} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs tracking-wider text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-semibold">{item.value}</p></div>)}
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="h-fit rounded-2xl border border-white/10 bg-[#101625] p-5">
          <div className="mb-5 flex items-center gap-2"><Sparkles className="text-violet-300" size={19}/><h2 className="font-semibold">Create a work item</h2></div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400" htmlFor="task-title">TASK TITLE</label>
          <input id="task-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={160} placeholder="e.g. Validate launch checklist" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-violet-300/60"/>
          <label className="mb-2 mt-4 block text-xs font-semibold tracking-wider text-slate-400" htmlFor="task-detail">PROJECT BRIEF</label>
          <textarea id="task-detail" value={detail} onChange={e=>setDetail(e.target.value)} maxLength={5000} placeholder="Goal, constraints, deliverables, and acceptance criteria..." rows={4} className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-violet-300/60"/>
          <button disabled={busy || loading} onClick={addTask} className="mt-4 w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold hover:bg-violet-400 disabled:opacity-50">{busy ? "Saving…" : "＋ Create and route to Research"}</button>
          <div className="mt-6 rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100"><GitBranch size={16}/> Routing map</div>
            {departments.map(dept=><div key={dept} className="flex items-center gap-2 py-1.5 text-sm"><span className="w-24 text-slate-300">{dept}</span><span className="text-slate-600">→</span><span className="text-cyan-200">{routing[dept]}</span><span className="ml-auto text-xs text-slate-500">{agents[dept]}</span></div>)}
            <p className="mt-3 text-xs leading-5 text-slate-500">Department handoffs are rule-based in this release. Real AI assignment requires a connected model/tool execution layer.</p>
          </div>
        </div>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ClipboardList size={19} className="text-violet-300"/><h2 className="font-semibold">Project queue</h2></div>
            <select aria-label="Filter tasks" value={filter} onChange={e=>setFilter(e.target.value as "All" | TaskStatus)} className="rounded-lg border border-white/10 bg-[#101625] px-3 py-2 text-sm"><option>All</option><option>Queued</option><option>In progress</option><option>In review</option><option>Complete</option></select>
          </div>
          <p role="status" aria-live="polite" className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">{loading ? "Loading workspace…" : notice}</p>
          <div className="grid gap-4">
            {visibleTasks.map(task=><article key={task.id} className="rounded-2xl border border-white/10 bg-[#101625] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs text-slate-500">TASK #{task.id} · {agents[task.department]}</p><h3 className="mt-1 text-lg font-semibold">{task.title}</h3></div>
                <span className={"rounded-full border px-3 py-1 text-xs "+(task.status==="Complete"?"border-emerald-300/20 text-emerald-200":task.status==="In review"?"border-amber-300/20 text-amber-200":"border-violet-300/20 text-violet-200")}>{task.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{task.detail}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="rounded-lg bg-white/5 px-2.5 py-1.5">Department: {task.department}</span><span className="rounded-lg bg-white/5 px-2.5 py-1.5">Owner: {agents[task.department]}</span></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={busy || task.status==="Complete"} onClick={()=>updateTask(task.id,"handoff")} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300/20 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-300/10 disabled:opacity-40"><ArrowRightLeft size={14}/> Handoff</button>
                <button disabled={busy || task.status==="Complete"} onClick={()=>updateTask(task.id,"review")} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/20 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-300/10 disabled:opacity-40"><ShieldCheck size={14}/> Request review</button>
                <button disabled={busy || task.status==="Complete"} onClick={()=>updateTask(task.id,"revise")} className="rounded-lg border border-rose-300/20 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-300/10 disabled:opacity-40">↶ Return for revision</button>
                <button disabled={busy || task.status==="Complete"} onClick={()=>updateTask(task.id,"approve")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-300/10 disabled:opacity-40"><CheckCircle2 size={14}/> Approve complete</button>
              </div>
              <details className="mt-4 border-t border-white/10 pt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-400">Audit trail · {task.history.length} events</summary><ol className="mt-3 grid gap-2">{task.history.map((event,i)=><li key={i} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="text-violet-300">{String(i+1).padStart(2,"0")}</span><span>{event}</span></li>)}</ol></details>
            </article>)}
            {!loading && visibleTasks.length===0&&<div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No tasks match this filter.</div>}
          </div>
        </div>
      </section>
      <footer className="mt-10 flex items-center gap-2 border-t border-white/10 py-6 text-xs text-slate-500"><ShieldCheck size={14}/> Human approval stays in control. External outreach and phone calls are not enabled by this project workflow.</footer>
    </div>
  </main>;
}
