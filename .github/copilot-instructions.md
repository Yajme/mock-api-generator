# Copilot instructions for this repository

## Build, lint, and test commands

This is a `pnpm` workspace with `backend` and `frontend` packages.

| Task | Command |
| --- | --- |
| Install dependencies | `pnpm install` |
| Run both apps in dev mode | `pnpm dev` |
| Build backend | `pnpm --filter backend build` |
| Start built backend | `pnpm --filter backend start` |
| Build frontend | `pnpm --filter frontend build` |
| Lint frontend | `pnpm --filter frontend lint` |

There is currently no test runner configured in either package, so there is no full-suite or single-test command yet.

## High-level architecture

- Monorepo layout: `backend/` (Express + TypeScript API) and `frontend/` (Vite + React + TypeScript UI).
- Backend entrypoint is `backend/index.ts`. It mounts:
  - `/api` behind `internalOnly` middleware (requires `x-internal-secret` header matching `INTERNAL_SECRET`)
  - `/mock` behind `authenticate` middleware (requires `x-api-key`)
- Versioned API routing is under `backend/src/routes/` (`/api/v0/...`), with controller/service split:
  - Controllers parse request context and populate `res.locals`
  - Services handle DB/data logic
  - `sendResponse` middleware emits a standardized JSON envelope from `res.locals`
- Database is Postgres/Supabase. SQL schema lives in `database/schema.sql` and defines:
  - users, api_keys, schemas, endpoints, snapshots, audit_log
  - endpoint TTL + snapshot restore flow via `restore_expired_endpoints()` scheduled with `pg_cron`
- Frontend is currently the Vite React starter UI with React Compiler enabled in `frontend/vite.config.ts`.

## Key codebase conventions

- TypeScript uses ESM-style imports with explicit `.js` extensions in backend source files (for example `import ... from './x.js'` from `.ts` files). Keep this pattern for new backend modules.
- API success responses are standardized through `res.locals` + `sendResponse`:
  - controllers should set `res.locals.status`, `res.locals.message`, and optional `res.locals.data`, then call `next()`
  - avoid sending ad-hoc JSON directly from controllers when the endpoint participates in this pipeline
- Error handling is centralized:
  - throw typed app errors (`UserError`, `AuthError`, `ForbiddenError`, `NotFoundError`) and pass failures with `next(error)`
  - `errorHandler` shapes error responses
- Request validation conventions are Zod-based:
  - schemas live in `backend/src/schema/`
  - `validate(schema)` middleware parses and strips unknown fields via `schema.parse(req.body)`
  - prefer `z.infer<typeof schema>` types over duplicated request interfaces
- DB access conventions:
  - shared query access uses `connection` (`src/config/database.ts`)
  - multi-statement writes should use `withTransaction(pool, callback)` (`src/utils/transactions.ts`)
- Mock data generation expects schema fields shaped as `{ name, fakerType, options? }` and resolves faker calls dynamically via `fakerType` strings like `internet.email`.
