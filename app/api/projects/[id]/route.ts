import { NextResponse } from "next/server";
import { z } from "zod";
import { getProjectContext } from "@/lib/projects/server";

const actionSchema = z.object({ action: z.enum(["handoff", "review", "approve", "revise"]) });
type Department = "Research" | "Strategy" | "Engineering" | "Quality";
type TaskStatus = "Queued" | "In progress" | "In review" | "Complete";
const nextDepartment: Record<Department, Department> = { Research: "Strategy", Strategy: "Engineering", Engineering: "Quality", Quality: "Research" };
const agentName: Record<Department, string> = { Research: "PIXEL", Strategy: "NOVA", Engineering: "BYTE", Quality: "TANK" };

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unsupported project action." }, { status: 400 });
  try {
    const context = await getProjectContext();
    if ("response" in context) return context.response;
    const { data: task, error: readError } = await context.admin.from("project_tasks")
      .select("id,department,status,history").eq("id", id).eq("workspace_id", context.workspaceId).maybeSingle();
    if (readError) throw readError;
    if (!task) return NextResponse.json({ error: "Task not found in your workspace." }, { status: 404 });
    if (task.status === "Complete") return NextResponse.json({ error: "Completed tasks are locked." }, { status: 409 });

    const currentDepartment = task.department as Department;
    let department = currentDepartment;
    let status: TaskStatus = task.status as TaskStatus;
    let message = "";
    switch (parsed.data.action) {
      case "handoff":
        department = nextDepartment[currentDepartment];
        status = department === "Quality" ? "In review" : "In progress";
        message = `Handoff: ${agentName[currentDepartment]} → ${agentName[department]} (${currentDepartment} → ${department}).`;
        break;
      case "review":
        department = "Quality"; status = "In review";
        message = "Submitted to TANK (Quality) for independent review.";
        break;
      case "approve":
        if (currentDepartment !== "Quality" || status !== "In review") {
          return NextResponse.json({ error: "Send the task to Quality review before approving it." }, { status: 409 });
        }
        status = "Complete"; message = "Quality gate passed. Marked complete by human operator.";
        break;
      case "revise":
        department = "Engineering"; status = "In progress";
        message = "Revision requested; returned to BYTE (Engineering).";
        break;
    }
    const history = [...(Array.isArray(task.history) ? task.history : []), message].slice(-100);
    const { data: updated, error: updateError } = await context.admin.from("project_tasks")
      .update({ department, status, history, updated_at: new Date().toISOString() })
      .eq("id", id).eq("workspace_id", context.workspaceId)
      .select("id,title,detail,department,status,history,created_at,updated_at").single();
    if (updateError) throw updateError;
    const { error: eventError } = await context.admin.from("project_task_events").insert({
      task_id: id, workspace_id: context.workspaceId, actor_user_id: context.user.id,
      event_type: parsed.data.action, message, metadata: { fromDepartment: currentDepartment, toDepartment: department, status },
    });
    if (eventError) console.error("Project audit event write failed:", eventError.message);
    return NextResponse.json({ task: updated, persistent: true });
  } catch (error) {
    console.error("Project task update failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not update project task." }, { status: 503 });
  }
}
