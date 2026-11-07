# Sweets Platform

Online ordering + ERP for a sweets business.

| App        | Path          | Stack                                     | Port | Users                  |
| ---------- | ------------- | ----------------------------------------- | ---- | ---------------------- |
| Storefront | `apps/web`    | Next.js 16 (App Router, ISR) + Tailwind 4 | 3000 | Customers              |
| ERP panel  | `apps/erp`    | Next.js 16 + TanStack Query + Tailwind 4  | 3001 | Admins, staff, vendors |
| API        | `apps/api`    | NestJS 11 + Prisma 7 + PostgreSQL         | 4000 | All clients            |
| Mobile     | `apps/mobile` | Expo (Phase 3, not scaffolded yet)        | —    | Customers              |

Shared packages: `@sweets/types` (zod schemas + types), `@sweets/api-client` (typed fetch client),
`@sweets/tsconfig`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design and the reasoning behind it.

## Getting started

Requirements: Node 22+, pnpm 11+, PostgreSQL 15+ (Docker or a local install).

```bash
pnpm install

# 1. Database — either Docker…
pnpm db:up
# …or point apps/api/.env DATABASE_URL at an existing Postgres.

# 2. Env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/erp/.env.example apps/erp/.env.local

# 3. Schema + sample data (admin user, categories, sweets, stock, a vendor)
pnpm db:migrate
pnpm db:seed

# 4. Run everything
pnpm dev
```

- Storefront: http://localhost:3000
- ERP: http://localhost:3001, sign in as `admin@example.com` / `ChangeMe123!` (from `SEED_ADMIN_*`)
- API docs (Swagger): http://localhost:4000/api/docs

## Common commands

| Command                               | What it does                                              |
| ------------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                            | Runs API, storefront and ERP in watch mode                |
| `pnpm build`                          | Production build of everything                            |
| `pnpm typecheck`                      | Type-checks every package                                 |
| `pnpm db:migrate`                     | Creates/applies a migration after editing `schema.prisma` |
| `pnpm db:seed`                        | Re-seeds sample data (idempotent)                         |
| `pnpm --filter @sweets/api db:studio` | Opens Prisma Studio to browse the DB                      |

## Deploying (Coolify)

The three apps run on a Hostinger VPS under [Coolify](https://coolify.io) as three resources from this one repo. Each has its own Dockerfile and builds from the repo root, so every resource uses base directory `/`.

| Resource | Dockerfile location    | Port | Watch paths                  | Build variables                                                        |
| -------- | ---------------------- | ---- | ---------------------------- | ---------------------------------------------------------------------- |
| API      | `/apps/api/Dockerfile` | 4000 | `apps/api/**`, `packages/**` | none                                                                   |
| Web      | `/apps/web/Dockerfile` | 3000 | `apps/web/**`, `packages/**` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME` |
| ERP      | `/apps/erp/Dockerfile` | 3001 | `apps/erp/**`, `packages/**` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STOREFRONT_URL`                    |

- `NEXT_PUBLIC_*` values are baked in at build time, so changing one needs a redeploy.
- **API:** the container runs `prisma migrate deploy` before it starts. With Neon, set `DATABASE_URL` to the pooled URL and `DIRECT_URL` to the same URL without `-pooler`, because migrations need a direct connection. Health check path is `/api/v1/health`.
- **Web:** set `API_URL` (runtime) to the API's public URL, or to an internal one to skip the round trip through the proxy. Set the same `REVALIDATE_SECRET` on the API and the web app, and point the API's `STOREFRONT_REVALIDATE_URL` at `https://<shop domain>/api/revalidate`.
- Deploy the API first. The web build prerenders catalog pages from it, and without it they start empty and fill in within a minute.
- `REDIS_URL` is optional and unused for now, so no Redis is needed yet.
