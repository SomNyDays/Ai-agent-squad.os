"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRightLeft, CheckCircle2, ClipboardList, GitBranch, ShieldCheck, Sparkles } from "lucide-react";

type Department = "Research" | "Strategy" | "Engineering" | "Quality";
type TaskStatus = "Queued" | "In progress" | "In review" | "Complete";
type Task = { id: number; title: string; detail: string; department: Department; status: TaskStatus; history: string[] };

const departments: Department[] = ["Research", "Strategy", "Engineering", "Quality"];
const agents: Record<Department, string> = { Research: "PIXEL", Strategy: "NOVA", Engineering: "BYTE", Quality: "TANK" };
const routing: Record<Department, Department> = { Research: "Strategy", Strategy: "Engineering", Engineering: "Quality", Quality: "Research" };
const initialTasks: Task[] = [
  { id: 1, title: "Map the buyer landscape", detail: "Identify likely customer segments and evidence needed before outreach.", department: "Research", status: "In progress", history: ["Task created and assigned to PIXEL (Research)."] },
  { id: 2, title: "Review mission architecture", detail: "Check handoff rules, error recovery, and release checkpoints.", department: "Engineering", status: "In review", history: ["Task created and assigned to BYTE (Engineering).", "Submitted to TANK (Quality) for review."] },
];

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [filter, setFilter] = useState<"All" | TaskStatus>("All");
  const [notice, setNotice] = useState("Local workspace ready. Actions are tracked in this browser session.");
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === "All" || task.status === filter), [tasks, filter]);
  const addTask = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setNotice("Add a task title before creating a project item."); return; }
    const id = Math.max(0, ...tasks.map((task) => task.id)) + 1;
    const task: Task = { id, title: cleanTitle, detail: detail.trim() || "No additional brief supplied.", department: "Research", status: "Queued", history: ["Task created and routed to PIXEL (Research)."] };
    setTasks((current) => [task, ...current]);
    setTitle(""); setDetail(""); setNotice("Task created and routed to Research.");
  };
  const updateTask = (id: number, action: "handoff" | "review" | "approve" | "revise") => {
    setTasks((current) => current.map((task) => {
      if (task.id !== id) return task;
      let next: Task = { ...task, history: [...task.history] };
      if (action === "handoff") {
        const target = routing[task.department];
        next = { ...next, department: target, status: target === "Quality" ? "In review" : "In progress", history: [...next.history, `Handoff: ${agents[task.department]} → ${agents[target]} (${task.department} → ${target}).`] };
        setNotice(`Task #${id} handed to ${target}.`);
      } else if (action === "review") {
        next = { ...next, department: "Quality", status: "In review", history: [...next.history, "Submitted to TANK (Quality) for independent review."] };
        setNotice(`Task #${id} submitted for quality review.`);
      } else if (action === "approve") {
        next = { ...next, status: "Complete", history: [...next.history, "Quality gate passed. Marked complete by human operator."] };
        setNotice(`Task #${id} approved and marked complete.`);
      } else {
        next = { ...next, department: routing.Quality, status: "In progress", history: [...next.history, `Revision requested; returned to ${agents[routing.Quality]} (${routing.Quality}).`] };
        setNotice(`Task #${id} returned for revision.`);
      }
      return next;
    }));
  };
  return <main className="min-h-screen bg-[#080b12] text-slate-100">
    <div className="mx-auto max-w-6xl px-5 py-7 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-violet-200 hover:text-white"><ArrowLeft size={16}/> Squad home</Link>
        <div className="flex items-center gap-2 text-xs text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300"/> WORKSPACE ONLINE</div>
      </header>
      <section className="py-10">
        <p className="text-xs font-semibold uppercase tracking-[.3em] text-violet-300">Mission control // Human governed</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Project Command Center</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-400">Create work items, route them between specialist departments, request revisions, and keep a visible handoff history. This first version runs locally in your browser; it does not claim to execute autonomous AI work or persist data to a server.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[{label:"OPEN TASKS",value:tasks.filter(t=>t.status!=="Complete").length},{label:"IN REVIEW",value:tasks.filter(t=>t.status==="In review").length},{label:"COMPLETED",value:tasks.filter(t=>t.status==="Complete").length},{label:"DEPARTMENTS",value:departments.length}].map(item=><div key={item.label} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs tracking-wider text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-semibold">{item.value}</p></div>)}
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="h-fit rounded-2xl border border-white/10 bg-[#101625] p-5">
          <div className="mb-5 flex items-center gap-2"><Sparkles className="text-violet-300" size={19}/><h2 className="font-semibold">Create a work item</h2></div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400" htmlFor="task-title">TASK TITLE</label>
          <input id="task-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Validate launch checklist" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-violet-300/60"/>
          <label className="mb-2 mt-4 block text-xs font-semibold tracking-wider text-slate-400" htmlFor="task-detail">PROJECT BRIEF</label>
          <textarea id="task-detail" value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Goal, constraints, deliverables, and acceptance criteria..." rows={4} className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-violet-300/60"/>
          <button onClick={addTask} className="mt-4 w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold hover:bg-violet-400">＋ Create and route to Research</button>
          <div className="mt-6 rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100"><GitBranch size={16}/> Routing map</div>
            {departments.map((dept,i)=><div key={dept} className="flex items-center gap-2 py-1.5 text-sm"><span className="w-24 text-slate-300">{dept}</span><span className="text-slate-600">→</span><span className="text-cyan-200">{routing[dept]}</span><span className="ml-auto text-xs text-slate-500">{agents[dept]}</span></div>)}
            <p className="mt-3 text-xs leading-5 text-slate-500">Routing is a deterministic prototype. Real AI assignment needs connected model/tool execution and server-side authorization.</p>
          </div>
        </div>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ClipboardList size={19} className="text-violet-300"/><h2 className="font-semibold">Project queue</h2></div>
            <select aria-label="Filter tasks" value={filter} onChange={e=>setFilter(e.target.value as "All" | TaskStatus)} className="rounded-lg border border-white/10 bg-[#101625] px-3 py-2 text-sm"><option>All</option><option>Queued</option><option>In progress</option><option>In review</option><option>Complete</option></select>
          </div>
          <p role="status" className="mb-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs text-slate-400">{notice}</p>
          <div className="grid gap-4">
            {visibleTasks.map(task=><article key={task.id} className="rounded-2xl border border-white/10 bg-[#101625] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs text-slate-500">TASK #{task.id} · {agents[task.department]}</p><h3 className="mt-1 text-lg font-semibold">{task.title}</h3></div>
                <span className={"rounded-full border px-3 py-1 text-xs "+(task.status==="Complete"?"border-emerald-300/20 text-emerald-200":task.status==="In review"?"border-amber-300/20 text-amber-200":"border-violet-300/20 text-violet-200")}>{task.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{task.detail}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="rounded-lg bg-white/5 px-2.5 py-1.5">Department: {task.department}</span><span className="rounded-lg bg-white/5 px-2.5 py-1.5">Owner: {agents[task.department]}</span></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={task.status==="Complete"} onClick={()=>updateTask(task.id,"handoff")} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300/20 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-300/10 disabled:opacity-40"><ArrowRightLeft size={14}/> Handoff</button>
                <button disabled={task.status==="Complete"} onClick={()=>updateTask(task.id,"review")} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/20 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-300/10 disabled:opacity-40"><ShieldCheck size={14}/> Request review</button>
                <button disabled={task.status==="Complete"} onClick={()=>updateTask(task.id,"revise")} className="rounded-lg border border-rose-300/20 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-300/10 disabled:opacity-40">↶ Return for revision</button>
                <button disabled={task.status==="Complete"} onClick={()=>updateTask(task.id,"approve")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-300/10 disabled:opacity-40"><CheckCircle2 size={14}/> Approve complete</button>
              </div>
              <details className="mt-4 border-t border-white/10 pt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-400">Audit trail · {task.history.length} events</summary><ol className="mt-3 grid gap-2">{task.history.map((event,i)=><li key={i} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="text-violet-300">{String(i+1).padStart(2,"0")}</span><span>{event}</span></li>)}</ol></details>
            </article>)}
            {visibleTasks.length===0&&<div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No tasks match this filter.</div>}
          </div>
        </div>
      </section>
      <footer className="mt-10 flex items-center gap-2 border-t border-white/10 py-6 text-xs text-slate-500"><ShieldCheck size={14}/> Human approval stays in control. Live integrations, persistent storage, and external outreach are not enabled by this prototype.</footer>
    </div>
  </main>;
}
