# Backend Service Overview

This backend is a **mock API generator service**. It manages users, issues API keys, allows authenticated users to define data schemas, and creates mock endpoints with cached data generated from those schemas.

## What the backend currently provides

- **User authentication** via JWT (`/api/v0/auth/login`)
- **API key issuance** for users (`/api/v0/user/key/create`)
- **Schema management** for faker-driven data generation (`/api/v0/schema`, `/api/v0/schema/create`)
- **Mock endpoint creation** that stores generated data (`/api/v0/endpoint`)

> **Note:** There is no implemented endpoint that serves the cached mock data yet. The `/mock` route is protected by API keys but does not currently return a response for any path.

## Stack and libraries

| Area | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Web framework | Express 5 |
| Database | PostgreSQL (Supabase) via `pg` |
| Auth | `jsonwebtoken` (JWT), `bcryptjs` (password hashing) |
| Validation | `zod` |
| Mock data | `@faker-js/faker` |
| Env config | `dotenv` |
| Dev runner | `tsx` |

## How the service is structured

- **Entry point**: `backend/index.ts`
- **Routing**: `/api` → versioned routes (`/api/v0/...`)
- **Controllers**: Parse inputs and populate `res.locals`
- **Services**: Encapsulate DB access and core logic
- **Middleware**:
  - `internalOnly` protects `/api` with `x-internal-secret`
  - `authenticateJwt` protects selected routes with JWT
  - `authenticate` protects `/mock` with `x-api-key`
  - `sendResponse` formats successful JSON responses
  - `errorHandler` formats failures

## Key data concepts

- **Schema**: A list of fields with `{ name, fakerType, options? }` used to generate mock rows.
- **Endpoint**: A stored definition with cached data and TTL for later serving.
