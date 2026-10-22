create table if not exists public.project_task_runs (
  id uuid primary key default gen_random_uuid(),
  task_id bigint not null references public.project_tasks(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department text not null check (department in ('Research','Strategy','Engineering','Quality')),
  agent_name text not null check (char_length(agent_name) between 1 and 80),
  model text not null check (char_length(model) between 1 and 120),
  status text not null check (status in ('succeeded','failed')),
  input_summary text not null default '' check (char_length(input_summary) <= 6000),
  output text not null default '' check (char_length(output) <= 20000),
  error_message text check (error_message is null or char_length(error_message) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists project_task_runs_workspace_created_idx
  on public.project_task_runs(workspace_id, created_at desc);
create index if not exists project_task_runs_task_created_idx
  on public.project_task_runs(task_id, created_at asc);
alter table public.project_task_runs enable row level security;
drop policy if exists "workspace members read project task runs" on public.project_task_runs;
create policy "workspace members read project task runs" on public.project_task_runs
  for select to authenticated using (public.is_workspace_member(workspace_id));
grant select on public.project_task_runs to authenticated;
