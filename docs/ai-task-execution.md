# AI task execution

This release adds a server-side, authenticated specialist execution endpoint.

## Setup

1. Apply `supabase/setup.sql` to the Supabase project if it has not already been applied.
2. Apply `supabase/projects.sql`.
3. Apply `supabase/agent_execution.sql`.
4. Configure `OPENAI_API_KEY` as a server-side environment secret. Optionally set `OPENAI_MODEL`; the default is `gpt-4.1-mini`.
5. Deploy the application and sign in with an account that can access the project workspace.

Never expose `OPENAI_API_KEY` through a `NEXT_PUBLIC_*` variable or send it to the browser.

## Execute one specialist step

Send an authenticated `POST /api/projects/{taskId}/execute`. An optional JSON body may contain `{"instruction":"Focus on launch risks" }`.

The current department chooses the specialist: Research / PIXEL, Strategy / NOVA, Engineering / BYTE, Quality / TANK. The API calls the OpenAI Responses API on the server, stores successful and provider-failed runs in `project_task_runs`, records a task event, and routes successful work to the next department. A Quality run stays in review; AI output never marks a task complete. A human must still use the existing approval action.

The endpoint uses a 50-second request timeout, bounded input/output, and no provider-side response storage. It does not grant the model access to tools, the filesystem, phone calls, email, or external outreach. The model must not be treated as having performed an action it could not actually perform.

## Operational notes

- Model usage may incur provider charges; protect the endpoint with authenticated workspace access and configure provider spending limits.
- Apply migrations before testing; otherwise run persistence will fail.
- This endpoint executes one department per request. Multi-step orchestration, retries, concurrency-safe claims, task-run UI, and tool permissions remain follow-up work.
- The route and migration should be tested in CI and against a non-production Supabase workspace before production use.
