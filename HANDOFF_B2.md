# HANDOFF_B2.md - Agent B Bug Fix Pass

**Date:** 2026-08-08
**Scope:** Bug #1 only - malformed JSON request bodies returned Express HTML error pages with stack traces.

## 1. What Changed

**File:** `server.js`

Added one Express error-handling middleware after the existing route/404 middleware and before server startup.

Behavior added:
- If `express.json()` raises a malformed JSON parse error, the server now returns HTTP `400`.
- Response body is JSON: `{"error":"Malformed JSON body"}`.
- Response `Content-Type` is `application/json; charset=utf-8`.
- Internal file paths and stack traces are no longer leaked for this error case.

No route handlers, validation logic, status transitions, persistence logic, frontend files, dependencies, or package scripts were changed.

## 2. Verification Commands And Actual Results

I ran the server locally with:

```bash
node server.js
```

Then verified the same malformed JSON cases from `HANDOFF_C.md`.

### POST malformed JSON

Command:

```bash
curl -s -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{bad json}"
```

Actual result:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 31
ETag: W/"1f-mmbNKNr5+JE5unTdzNmIUtedyt8"
Date: Sat, 08 Aug 2026 14:29:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Malformed JSON body"}
```

### PATCH malformed JSON

Command:

```bash
curl -s -i -X PATCH http://localhost:3000/api/tickets/TCK-1002/status -H "Content-Type: application/json" -d "{bad json}"
```

Actual result:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 31
ETag: W/"1f-mmbNKNr5+JE5unTdzNmIUtedyt8"
Date: Sat, 08 Aug 2026 14:29:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Malformed JSON body"}
```

Result: Bug #1 fixed. Both malformed JSON requests now return clean JSON errors and no HTML stack trace.
