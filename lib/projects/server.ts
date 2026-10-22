import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getProjectContext() {
  const auth = await createSupabaseServerClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return { response: Response.json({ error: "Sign in to use your persistent project workspace." }, { status: 401 }) } as const;
  const admin = createSupabaseAdminClient();
  const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "Personal";
  const { data: workspaceId, error: workspaceError } = await admin.rpc("ensure_personal_workspace", {
    p_user_id: user.id,
    p_name: String(displayName).slice(0, 80) + "'s Workspace",
  });
  if (workspaceError || !workspaceId) {
    console.error("Project workspace lookup failed:", workspaceError?.message || "missing workspace id");
    return { response: Response.json({ error: "Project workspace unavailable. Apply the Supabase setup and projects migration." }, { status: 503 }) } as const;
  }
  return { user, admin, workspaceId } as const;
}
