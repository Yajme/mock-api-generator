# Backend API Reference (v0)

This document covers the **implemented** backend endpoints. Routes that are stubbed or return no response have been excluded except where noted.

## Base paths

- Internal API: `/api/v0`
- Mock API: `/mock` (no functional endpoints currently return a response; not documented here)

## Common headers

All `/api/v0` routes are protected by the internal gateway:

| Header | Required | Description |
|---|---|---|
| `x-internal-secret` | Yes | Must match `INTERNAL_SECRET` on the server |

Additional authorization applies per endpoint (listed below).

## Success response envelope

Endpoints that set `res.locals.data` respond through `sendResponse`:

```json
{
  "success": true,
  "status": 200,
  "message": "Human readable message",
  "data": {},
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

## Error response shapes

**General errors** (from `errorHandler`):

```json
{
  "error": "Something went wrong",
  "success": false,
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

**Validation errors** (Zod or `validate` middleware):

```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "data": [
    { "field": "email", "message": "Invalid email" }
  ],
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

---

## `POST /api/v0/auth/register`

Registers a user.

**Authorization**

- `x-internal-secret` (required)

**Request body**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SuperSecret123"
}
```

**Response**

> **Note:** This handler does not set `res.locals.data`. Because `sendResponse` only emits a response when `data` is present, successful requests currently fall through to the `notFoundHandler` and return a 404.

**Possible errors**

| Code | When | Shape |
|---|---|---|
| `400` | Missing required fields | General error |
| `403` | Username or email already exists | General error |
| `403` | Missing/invalid `x-internal-secret` | General error |
| `429` | Rate limit exceeded | General error |

---

## `POST /api/v0/auth/login`

Authenticates a user and returns a JWT.

**Authorization**

- `x-internal-secret` (required)

**Request body**

```json
{
  "email": "john@example.com",
  "password": "SuperSecret123"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "status": 200,
  "message": "User logged in",
  "data": {
    "token": "<jwt>"
  },
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

**Possible errors**

| Code | When | Shape |
|---|---|---|
| `400` | Missing email/password | General error |
| `401` | Invalid password | General error |
| `403` | Missing/invalid `x-internal-secret` | General error |
| `404` | User not found | General error |
| `429` | Rate limit exceeded | General error |

---

## `POST /api/v0/auth/logout`

Logs out a user (server-side no-op).

**Authorization**

- `x-internal-secret` (required)

**Request body**

None.

**Response**

> **Note:** This handler sets `res.locals.data = null`, which is treated as "no data". The request currently falls through to `notFoundHandler` and returns a 404.

**Possible errors**

| Code | When | Shape |
|---|---|---|
| `403` | Missing/invalid `x-internal-secret` | General error |
| `429` | Rate limit exceeded | General error |

---

## `POST /api/v0/user/key/create`

Creates an API key for a user.

**Authorization**

- `x-internal-secret` (required)

**Request body**

```json
{
  "user_id": "7b1b7f3e-70f6-4f4d-9d09-1a3b8a9f6f0a",
  "permissions": "read"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "status": 201,
  "message": "API Key created",
  "data": {
    "api_key": "<raw_api_key>"
  },
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

**Possible errors**

| Code | When | Shape |
|---|---|---|
| `400` | Missing `user_id` or `permissions` | General error |
| `403` | Missing/invalid `x-internal-secret` | General error |
| `429` | Rate limit exceeded | General error |

---

## `GET /api/v0/schema`

Returns schemas owned by the authenticated user, plus preset schemas.

**Authorization**

- `x-internal-secret` (required)
- `Authorization: Bearer <jwt>` (required)

**Query parameters**

| Name | Required | Description |
|---|---|---|
| `filter` | No | Filter value |
| `filterBy` | No | Must be `"name"` when used |

> **Note:** If either `filter` or `filterBy` is provided, both are required.

**Response** `200 OK`

```json
{
  "success": true,
  "status": 200,
  "message": "Schema Successfully retrieved",
  "data": {
    "schemas": [
      {
        "id": "0de94f7f-9ad2-4b86-9f7c-2e72d1fe1b5c",
        "name": "User",
        "is_preset": false,
        "fields": [
          { "name": "email", "fakerType": "internet.email" }
        ],
        "owner_id": "7b1b7f3e-70f6-4f4d-9d09-1a3b8a9f6f0a"
      }
    ]
  },
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

**Possible errors**

| Code | When | Shape |
|---|---|---|
| `401` | Missing or invalid JWT | General error |
| `403` | Missing/invalid `x-internal-secret` | General error |
| `404` | No schema found or user ID missing | General error |
| `422` | `filter`/`filterBy` invalid | General error |
| `429` | Rate limit exceeded | General error |

---

## `GET /api/v0/schema/:schemaName`

Currently behaves the same as `GET /api/v0/schema`.

> **Note:** The path parameter is not used by the handler. Use `filter` and `filterBy=name` instead.

**Authorization**

- `x-internal-secret` (required)
- `Authorization: Bearer <jwt>` (required)

**Response**

Same as `GET /api/v0/schema`.

---

## `POST /api/v0/schema/create`

Creates a schema definition used for mock data generation.

**Authorization**

- `x-internal-secret` (required)
- `Authorization: Bearer <jwt>` (required)

**Request body**

```json
{
  "schemaName": "User",
  "is_preset": false,
  "fields": [
    { "name": "email", "fakerType": "internet.email" },
    { "name": "firstName", "fakerType": "person.firstName" }
  ]
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "status": 201,
  "message": "Schema Created Successfully",
  "data": {
    "userSchema": {
      "id": "0de94f7f-9ad2-4b86-9f7c-2e72d1fe1b5c",
      "name": "User",
      "is_preset": false,
      "fields": [
        { "name": "email", "fakerType": "internet.email" },
        { "name": "firstName", "fakerType": "person.firstName" }
      ],
      "owner_id": "7b1b7f3e-70f6-4f4d-9d09-1a3b8a9f6f0a"
    }
  },
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

**Possible errors**

| Code | When | Shape |
|---|---|---|
| `401` | Missing or invalid JWT | General error |
| `403` | Missing/invalid `x-internal-secret` | General error |
| `422` | Schema validation failed | General error |
| `429` | Rate limit exceeded | General error |

> **Note:** Because this route requires a JWT and always sets `owner_id`, `is_preset=true` currently fails validation.

---

## `POST /api/v0/endpoint`

Creates a mock endpoint and caches generated data.

**Authorization**

- `x-internal-secret` (required)
- `Authorization: Bearer <jwt>` (required)

**Request body**

```json
{
  "endpoint": "users",
  "schemaId": "0de94f7f-9ad2-4b86-9f7c-2e72d1fe1b5c",
  "version": "v1",
  "count": 10,
  "ttlSecond": 3600
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "status": 200,
  "message": "Endpoint Successfully Created",
  "data": {
    "userEndpoint": {
      "id": "2de84a2f-5f5c-4a5c-9a0e-1f1d7a6e0f21",
      "owner_id": "7b1b7f3e-70f6-4f4d-9d09-1a3b8a9f6f0a",
      "schema_id": "0de94f7f-9ad2-4b86-9f7c-2e72d1fe1b5c",
      "name": "users",
      "version": "vv1",
      "cached_data": [],
      "ttl_seconds": 3600,
      "ttl_expires_at": "2026-05-31T09:00:00.000Z"
    }
  },
  "timestamp": "2026-05-31T08:00:00.000Z"
}
```

**Possible errors**

| Code | When | Shape |
|---|---|---|
| `401` | Missing or invalid JWT | General error |
| `403` | Missing/invalid `x-internal-secret` | General error |
| `404` | Missing endpoint name or schema not found | General error |
| `422` | Request body validation failed | General error |
| `429` | Rate limit exceeded | General error |

> **Note:** The request field is `ttlSecond` (singular). It is mapped to `ttlSeconds` internally.

> **Note:** The service prefixes the version with `"v"` when storing, so a request with `"version": "v1"` currently stores `"vv1"`.
