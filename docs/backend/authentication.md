## /api/v1/auth

Brief description of what this endpoint does.

**`POST /api/v1/auth`**

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ Yes | email registered by the user |
| `password` | string | ✅ Yes | password the user made |

### Request Example
```json
{
  "email": "johndoe@123mail.com",
  "password" : "password123johndoe"
}
```

### Response — `200 OK`
```json
{
  "status": "success",
  "data": {}
}
```

### Errors
| Status | Code | Description |
|--------|------|-------------|
| `400` | `ERROR_CODE` | Description |