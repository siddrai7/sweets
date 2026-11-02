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
