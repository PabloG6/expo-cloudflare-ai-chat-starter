# Nexus Starter Kit

Cloudflare + Better Auth + tRPC + Cloudflare Agents + Expo starter monorepo.

## What this starter includes

- Better Auth on Cloudflare Worker (`apps/auth-worker`) with Google OAuth and JWT plugin
- tRPC API Worker (`apps/api`) with public and protected procedures
- One authenticated Cloudflare Agent (`agents/assistant`) mounted at `/agents/chat/:sessionId`
- Expo mobile demo app (`apps/mobile`) with:
  - `Sign in with Google`
  - `Fetch server date` button calling `system.now` tRPC procedure
- Shared workspace packages:
  - `packages/db` (Drizzle schema + migrations)
  - `packages/auth` (shared Better Auth factory)
  - `packages/shared` (shared runtime symbols/types)

## Prerequisites

- Node.js 20+
- pnpm 10+
- Postgres locally (or remote)
- Cloudflare account for deployment

## Google OAuth setup

Create Google OAuth credentials (Web application) and add these redirect URLs:

- `http://localhost:8393/api/auth/callback/google`
- `nexus://`

Use the generated client ID/secret as worker secrets.

## Environment setup

Copy values from `.env.example` and set worker/mobile env vars.

### `apps/auth-worker/.dev.vars`

```txt
BETTER_AUTH_SECRET=replace-me
AUTH_ORIGIN=http://localhost:8393
GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dropoff
```

### `apps/api/.dev.vars`

```txt
BETTER_AUTH_SECRET=replace-me
AUTH_ORIGIN=http://localhost:8393
GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dropoff
```

### `agents/assistant/.dev.vars`

```txt
BETTER_AUTH_SECRET=replace-me
AUTH_ORIGIN=http://localhost:8393
GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dropoff
OPENROUTER_API_KEY=
OPEN_ROUTER_MODEL=z-ai/glm-4.7-flash
```

### `apps/mobile/.env`

```txt
EXPO_PUBLIC_AUTH_URL=http://localhost:8393
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_ASSISTANT_URL=http://localhost:8788
```

## Secrets for deployed workers

Run in each worker directory as needed:

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put OPENROUTER_API_KEY
```

## Local startup order

From `/Users/pepperpotpoppins/nodejs/nexus/templates/nexus-starter`:

```bash
pnpm install
pnpm db:push
pnpm dev:auth
pnpm dev:api
pnpm dev:assistant
pnpm dev:mobile
```

## API surface

- Auth Worker:
  - `GET|POST /api/auth/*`
  - `GET /api/session`
- tRPC (`/api/trpc`):
  - `health`
  - `system.now`
  - `auth.me` (protected)
  - `tasks.list` (protected)
  - `tasks.create` (protected)
  - `tasks.patchStatus` (protected)
- Agent:
  - `/agents/chat/:sessionId` where `sessionId = <userId>:YYYY-MM-DD`
  - Requires Bearer JWT from Better Auth
