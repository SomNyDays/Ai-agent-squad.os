# Arena invite-code access

The following routes require a valid invite session: `/arena`, `/mission-map`, `/play`, and `/projects`. Existing multiplayer room codes remain separate and continue to be handled by `/api/rooms` and `/api/rooms/join`.

## 1. Apply the database migration

Run `supabase/arena_invites.sql` in the Supabase SQL editor after configuring the existing project schema. The migration stores only SHA-256 hashes of invite codes. The raw code is returned once when created and cannot be retrieved later.

## 2. Configure server-only environment variables

Set these in the deployment environment and local `.env.local`; do not prefix them with `NEXT_PUBLIC_`:

- `ARENA_ACCESS_SECRET`: a random secret with at least 32 characters, used to sign short-lived access sessions.
- `ARENA_INVITE_ADMIN_SECRET`: a separate strong secret used only to issue invites.
- Keep the existing `SUPABASE_SERVICE_ROLE_KEY` server-only and configured as required by the existing Supabase admin client.

Generate independent secrets with `openssl rand -base64 48`. Never commit secret values or include them in client-side code.

## 3. Issue an invite

Call the server endpoint from a trusted admin terminal or backend. The admin secret must not be placed in a browser app, public page, or client-side environment variable.

```bash
curl -X POST "$APP_URL/api/access/invites" \
  -H "Content-Type: application/json" \
  -H "x-arena-admin-secret: $ARENA_INVITE_ADMIN_SECRET" \
  -d '{"label":"QA player","maxUses":1,"expiresInHours":72}'
```

For a team code, set `maxUses` to the intended number of redemptions. Codes expire after 72 hours by default; `expiresInHours` can be set from 1 to 8760. Copy the returned code immediately. The database stores its hash only.

## Security behavior

- Invite codes contain 20 random characters from an unambiguous alphabet and are compared by hash on the server.
- A database function atomically enforces expiration, revocation, and maximum redemptions to prevent concurrent overuse.
- Successful redemption creates an HTTP-only, SameSite=Lax cookie signed with `ARENA_ACCESS_SECRET`; sessions expire within 8 hours or at the invite expiry, whichever comes first.
- The middleware validates the signature and expiry before serving protected routes. Invite codes and signing secrets are never embedded in client bundles.
- The issuance endpoint is protected by a separate server secret and returns each raw code only once.

Treat invite codes as bearer credentials. Revoke an invite by setting `revoked_at = now()` for its row in `public.arena_invites`; already-issued sessions remain valid until their short expiry. For immediate global revocation, rotate `ARENA_ACCESS_SECRET`.
