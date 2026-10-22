-- Move membership-check helpers out of the exposed public schema.
-- These helpers intentionally use SECURITY DEFINER to inspect membership rows
-- without recursive RLS evaluation. Keep them non-exposed and auth-scoped.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.is_workspace_member(uuid) set schema private;
alter function public.is_room_member(uuid) set schema private;

revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.is_room_member(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function private.is_room_member(uuid) to authenticated, service_role;

drop policy if exists "workspace member reads" on public.workspaces;
create policy "workspace member reads" on public.workspaces
  for select to authenticated using (private.is_workspace_member(id));

drop policy if exists "member list reads" on public.workspace_members;
create policy "member list reads" on public.workspace_members
  for select to authenticated
  using (user_id = auth.uid() or private.is_workspace_member(workspace_id));

drop policy if exists "room members read rooms" on public.game_rooms;
create policy "room members read rooms" on public.game_rooms
  for select to authenticated using (private.is_room_member(id));

drop policy if exists "room members read players" on public.game_players;
create policy "room members read players" on public.game_players
  for select to authenticated using (private.is_room_member(room_id));

drop policy if exists "room members read events" on public.game_events;
create policy "room members read events" on public.game_events
  for select to authenticated using (private.is_room_member(room_id));
