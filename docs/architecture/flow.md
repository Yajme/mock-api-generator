# Backend Request Flow

This document describes the **actual runtime flow** of the backend as implemented today, including authorization and validation layers.

## High-level flow

```mermaid
flowchart TD
    Client --> Express[Express app]

    Express -->|/api/*| Log[logRequest]
    Log --> Internal[internalOnly]
    Internal --> Rate[apiRateLimiter]
    Rate --> ApiRouter[/api router/]
    ApiRouter --> Send[sendResponse]
    Send --> NotFound[notFoundHandler]
    NotFound --> Error[errorHandler]

    Express -->|/mock/*| ApiKey[authenticate (x-api-key)]
    ApiKey --> MockRouter[/mock router/]
    MockRouter --> Send

    ApiRouter -->|/api/v0/schema, /api/v0/endpoint| Jwt[authenticateJwt]
    Jwt --> Controllers[Controllers]
    ApiRouter -->|/api/v0/auth*, /api/v0/user/key/create| Controllers

    Controllers --> Services[Service layer]
    Services --> DB[(Postgres/Supabase)]
    Controllers -->|res.locals.*| Send
```

## Authorization layers

1. **`internalOnly` middleware**  
   Applied to **all** `/api/*` routes. Requires `x-internal-secret` header to match `INTERNAL_SECRET`.

2. **`authenticateJwt` middleware**  
   Applied **per route** for:
   - `GET /api/v0/schema`
   - `GET /api/v0/schema/:schemaName`
   - `POST /api/v0/schema/create`
   - `POST /api/v0/endpoint`  

   It validates `Authorization: Bearer <jwt>` and sets `req.user`.

3. **`authenticate` middleware**  
   Applied to all `/mock/*` routes. Requires `x-api-key` and loads `req.userId` + `req.permissions`.

## Validation flow

There are two validation paths in the codebase:

1. **Controller-level Zod validation (active today)**  
   Some controllers call Zod schemas directly using `safeParse`:

   - `createUserSchema` uses `createSchemaValidationSchema`
   - `createEndpoint` uses `createEndpointSchema`

   On failure, they throw `InvalidDataError` which maps to a `422` response.

2. **`validate(schema)` middleware (available but not wired)**  
   A generic middleware exists that runs `schema.parse(req.body)` and returns a structured `400` response with field errors. It is **not currently attached** to any route handlers.

## How schema validation works

Schemas are defined with Zod in `backend/src/schema/`:

- **`authSchema.ts`** describes login/register payloads.
- **`userSchema.ts`** describes profile update/deletion payloads.
- **`mockDataSchema.ts`** validates schema fields:
  - Each field must have `name`, `fakerType`, and optional `options`.
  - `fakerType` must exist in the allowed faker list.
  - `is_preset` and `owner_id` are cross-validated:
    - preset schemas **must not** include `owner_id`
    - non-preset schemas **must** include `owner_id`
- **`endpointSchema.ts`** validates endpoint creation:
  - `name` and `schemaId` required
  - `version` must match `v<number>`
  - `ttlSeconds` and `count` are validated and defaulted

> **Note:** `createEndpoint` maps `ttlSecond` from the request to `ttlSeconds` internally.

## Response flow

Controllers set `res.locals.status`, `res.locals.message`, and `res.locals.data` before calling `next()`.

- **`sendResponse`** only emits a response when `res.locals.data` is truthy.  
  If no data is set, the request falls through to `notFoundHandler` (404).
- **`errorHandler`** formats all thrown errors and supports Zod errors explicitly.
