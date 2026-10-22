import { NextResponse } from "next/server";
import { z } from "zod";
import { getProjectContext } from "@/lib/projects/server";

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  detail: z.string().trim().max(5000).optional().default(""),
});

export async function GET() {
  try {
    const context = await getProjectContext();
    if ("response" in context) return context.response;
    const { data, error } = await context.admin.from("project_tasks")
      .select("id,title,detail,department,status,history,created_at,updated_at")
      .eq("workspace_id", context.workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ tasks: data ?? [], persistent: true });
  } catch (error) {
    console.error("Project task list failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load project tasks." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a task title (up to 160 characters) and a brief (up to 5000 characters)." }, { status: 400 });
  try {
    const context = await getProjectContext();
    if ("response" in context) return context.response;
    const history = [`Task created and routed to PIXEL (Research) by workspace member.`];
    const { data: task, error } = await context.admin.from("project_tasks").insert({
      workspace_id: context.workspaceId, created_by: context.user.id,
      title: parsed.data.title, detail: parsed.data.detail, department: "Research", status: "Queued", history,
    }).select("id,title,detail,department,status,history,created_at,updated_at").single();
    if (error) throw error;
    const { error: eventError } = await context.admin.from("project_task_events").insert({
      task_id: task.id, workspace_id: context.workspaceId, actor_user_id: context.user.id,
      event_type: "task_created", message: history[0],
    });
    if (eventError) console.error("Project audit event write failed:", eventError.message);
    return NextResponse.json({ task, persistent: true }, { status: 201 });
  } catch (error) {
    console.error("Project task creation failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not create project task. Verify the Supabase projects migration is applied." }, { status: 503 });
  }
}
