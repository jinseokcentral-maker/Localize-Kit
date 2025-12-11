# Backend Business Logic Outline

## Scope / Assumptions

- Supabase used as primary DB and auth; current client-side access has RLS disabled (dev). For production, plan to place a backend/API layer in front of Supabase and re-enable RLS.
- Frontend already collects auth session (Supabase auth) and bootstraps profiles.
- Domain: projects, translations, webhooks, API keys/usage, subscriptions, audit logs.

## Core Flows

### 1) Auth & Session

- Supabase auth (email magic link + Google OAuth).
- Backend should validate JWT (Supabase) on every request.
- Future: issue backend session cookie after verifying Supabase JWT if needed.

### 2) User Profile Bootstrap

- On authenticated entry:
  1. Read `profiles` by `auth.uid`.
  2. If missing, upsert `{ id, email, plan: "free", ... }`.
  3. Return profile to frontend; cache minimal fields in store.
- Backend responsibility: enforce one-profile-per-user and ownership checks.

### 3) Projects & Membership

- Entities: `projects`, `team_members`.
- Access: owner/editor/viewer roles.
- Core ops:
  - Create project (owner = auth.uid, slug unique).
  - List projects where user is owner or member.
  - Update project metadata (owner/editor).
  - Invite member (editor+), accept/join, remove member.

### 4) Translations & History

- Entities: `translations`, `translation_history`.
- Core ops:
  - CRUD translations scoped by project.
  - Store values as JSONB per locale.
  - Record history entries on changes (who/when/prev/new).

### 5) Delivery API Keys & Usage

- Entities: `api_keys`, `api_usage`.
- Core ops:
  - Create/revoke API key per project (hash + prefix stored).
  - Track monthly usage (request_count, month/year).
  - Enforce quota per plan (e.g., free/pro/team).

### 6) Webhooks

- Entities: `webhooks`, `webhook_events`, `webhook_deliveries`.
- Core ops:
  - Manage endpoints per project, events subscribed.
  - Enqueue events on translation changes.
  - Delivery worker: retry with backoff, store status/response/error, max attempts.

### 7) Subscriptions / Billing

- Entity: `subscriptions`.
- Core ops:
  - Sync with billing provider (Stripe) via webhooks.
  - Update `plan`, `status`, `current_period_end`, etc.
  - Gate quotas/limits by plan (projects, requests, members, webhooks).

### 8) Audit Logs (Team/Pro)

- Entity: `audit_logs`.
- Record project-scoped actions (create/update/delete, member invite, webhook changes).
- Store metadata (old/new values) for traceability.

## API Surface (suggested)

- `POST /projects`, `GET /projects`, `PATCH /projects/:id`
- `POST /projects/:id/members`, `DELETE /projects/:id/members/:userId`
- `GET /projects/:id/translations`, `POST /projects/:id/translations`, `PATCH /translations/:id`
- `POST /projects/:id/api-keys`, `DELETE /api-keys/:id`, `GET /projects/:id/api-usage`
- `POST /projects/:id/webhooks`, `GET /projects/:id/webhooks`, `PATCH /webhooks/:id`
- `GET /subscriptions/me`, `POST /billing/webhook` (Stripe)
- `GET /projects/:id/audit-logs`

## Security / RLS Plan

- Current dev: RLS disabled for ease of browser Supabase usage.
- Target prod: Re-enable RLS; enforce access through backend:
  - RLS policies: owner/editor/viewer via `has_project_access(project_id, role)`.
  - Backend: service role with fine-grained checks; never expose service key to client.

## Operational Notes

- Use background workers for webhook delivery and usage aggregation.
- Rate limit Delivery API per plan; update `api_usage`.
- Log errors and deliveries for debugging; expose limited logs to users.

## Next Steps

- Re-enable RLS in staging/prod with backend proxy in place.
- Implement REST (or GraphQL) service layer enforcing project-role checks.
- Add tests for project membership, translation CRUD, webhook delivery, and plan quotas.
