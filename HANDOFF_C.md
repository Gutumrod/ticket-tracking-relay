# HANDOFF_C.md — QA Tester Report (Agent C)

**Date:** 2026-08-08  
**Tester:** Agent C (QA Tester)  
**Application:** Ticket Tracking Relay MVP  
**Server:** Node.js + Express, port 3000, JSON file persistence  

All tests below were executed against a live running instance. Requests were sent via `curl`; responses are the actual observed outputs (not expected values).

---

## 1. Acceptance Criteria Results

### AC-A1: Create ticket via API — PASS

**Request:**
```bash
curl -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" \
  -d '{"title":"API test","description":"Created from curl","reporter_name":"QA","priority":"High"}'
```

**Observed:** HTTP `201 Created`. Response body:
```json
{"id":"TCK-1001","title":"API test","description":"Created from curl","reporter_name":"QA","priority":"High","status":"REPORTED","handler_notes":"","created_at":"2026-08-08T14:23:54.238Z","updated_at":"2026-08-08T14:23:54.238Z"}
```
ID is `TCK-1001` (auto-incremented from 1000). Full ticket JSON returned.

**UI verification (code review):** `submitTicket()` in `app.js` POSTs to `/api/tickets`, on success shows `#success-banner` with `#new-ticket-id` set to `ticket.id`. Confirmed in source.

---

### AC-A2: Default priority when not specified — PASS

**Request:**
```bash
curl -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" \
  -d '{"title":"Default priority","description":"No priority field","reporter_name":"QA"}'
```

**Observed:** HTTP `201 Created`. Response:
```json
{"id":"TCK-1002","title":"Default priority","description":"No priority field","reporter_name":"QA","priority":"Medium","status":"REPORTED",...}
```
`priority` is `"Medium"` as expected.

---

### AC-A3: Empty/missing required fields — PASS

**Request:**
```bash
curl -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" \
  -d '{"title":"","description":"","reporter_name":""}'
```

**Observed:** HTTP `400 Bad Request`. Response:
```json
{"error":"Validation failed","errors":{"reporter_name":"Reporter name is required.","title":"Issue title is required.","description":"Description is required."}}
```

**UI verification (code review):** `submitTicket()` catches 400, calls `setFieldErrors()` which sets red text on `.field-error` elements. Confirmed in source.

---

### AC-A4: New ticket has status REPORTED — PASS

**Observed:** Every POST `/api/tickets` response includes `"status":"REPORTED"`. Confirmed across all test ticket creations (TCK-1001 through TCK-1007).

---

### AC-A5: created_at and updated_at are ISO strings, initially identical — PASS

**Observed:** For TCK-1001:
```json
"created_at":"2026-08-08T14:23:54.238Z","updated_at":"2026-08-08T14:23:54.238Z"
```
Both are valid ISO 8601 strings and identical at creation time. After a status update, `updated_at` changes (confirmed in AC-D1).

---

### AC-B1: Track view shows full ticket details — PASS

**Request:**
```bash
curl -s http://localhost:3000/api/tickets/TCK-1001
```

**Observed:** HTTP `200 OK`. Full ticket JSON returned with all fields.

**UI verification (code review):** `renderTicketCard()` in `app.js` renders: ticket ID, title, reporter name, created/updated timestamps, priority badge (with color class), status badge, 5-step progress indicator, description box, and handler notes box. All elements confirmed in source code.

---

### AC-B2: Search for missing ID — PASS

**Request:**
```bash
curl -s http://localhost:3000/api/tickets/TCK-999999
```

**Observed:** HTTP `404 Not Found`. Response: `{"error":"Ticket not found"}`

**UI verification (code review):** `searchTicket()` catches any error, shows `#track-error` with text "Ticket ID not found. Please verify your ID." in red (`.error-callout` class with `--danger` color). Confirmed in source.

---

### AC-B3: Updated status visible in Track view after dashboard update — PASS

**API verification:**
1. Created TCK-1001 (status REPORTED).
2. PATCHed TCK-1001 to RECEIVED, then IN_PROGRESS.
3. GET `/api/tickets/TCK-1001` returned `"status":"IN_PROGRESS"` with updated `handler_notes` and `updated_at`.

**UI verification (code review):** `updateStatus()` calls PATCH, then `loadDashboard()` which refreshes `tickets` array. Navigating to Track view and searching calls `requestJson("/api/tickets/:id")` which fetches fresh data from server. The rendered card shows current status and notes. Confirmed in source.

---

### AC-C1: Dashboard lists all tickets newest first — PASS

**Request:**
```bash
curl -s http://localhost:3000/api/tickets
```

**Observed:** Returns array sorted by `created_at` descending. TCK-1002 (created 14:23:55) appears before TCK-1001 (created 14:23:54). Confirmed across all subsequent tests with 7 tickets — order is consistently newest first.

---

### AC-C2: Status filter — PASS

**Request:**
```bash
curl -s "http://localhost:3000/api/tickets?status=REPORTED"
```

**Observed:** HTTP `200 OK`. Returns only tickets with `status === "REPORTED"`. Verified: 5 REPORTED tickets returned, excluding IN_PROGRESS and RECEIVED tickets.

**UI verification (code review):** `filteredTickets()` in `app.js` filters by `ticket.status === status` from dropdown. Confirmed in source.

---

### AC-C3: Priority filter — PASS

**Request:**
```bash
curl -s "http://localhost:3000/api/tickets?priority=High"
```

**Observed:** HTTP `200 OK`. Returns only tickets with `priority === "High"`. Verified: returns only High priority tickets.

**UI verification (code review):** `filteredTickets()` filters by `ticket.priority === priority` from dropdown. Confirmed in source.

---

### AC-C4: Dashboard summary counts match actual data — PASS

**Verification (after creating 7 tickets with various statuses):**

| Metric | API Filter Count | Frontend Logic |
|--------|-----------------|----------------|
| Total | 7 | `allTickets.length` → 7 ✓ |
| Reported | 5 | `filter(status === "REPORTED")` → 5 ✓ |
| Received | 0 | `filter(status === "RECEIVED")` → 0 ✓ |
| In Progress | 2 | `filter(status === "IN_PROGRESS")` → 2 ✓ |
| Done | 0 | `filter(status === "DONE")` → 0 ✓ |

API filter counts verified via `curl -s "http://localhost:3000/api/tickets?status=X" | python -c "import sys,json; print(len(json.load(sys.stdin)))"`.

Frontend `updateMetrics()` in `app.js` uses the same filter logic against the `tickets` array loaded from `GET /api/tickets`. Logic confirmed correct in source code.

---

### AC-D1: REPORTED → RECEIVED transition — PASS

**Request:**
```bash
curl -s -i -X PATCH http://localhost:3000/api/tickets/TCK-1001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"RECEIVED","handler_notes":"Acknowledged."}'
```

**Observed:** HTTP `200 OK`. Response:
```json
{"id":"TCK-1001","status":"RECEIVED","handler_notes":"Acknowledged.","updated_at":"2026-08-08T14:24:07.353Z",...}
```
Status changed to RECEIVED. `updated_at` changed from `14:23:54.238Z` to `14:24:07.353Z`. `handler_notes` set to `"Acknowledged."`.

---

### AC-D2: RECEIVED → IN_PROGRESS transition — PASS

**Request:**
```bash
curl -s -i -X PATCH http://localhost:3000/api/tickets/TCK-1001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS","handler_notes":"Working on it"}'
```

**Observed:** HTTP `200 OK`. Status became `"IN_PROGRESS"`, notes updated.

---

### AC-D3: IN_PROGRESS → DONE transition — PASS

**Request:**
```bash
curl -s -i -X PATCH http://localhost:3000/api/tickets/TCK-1001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE","handler_notes":"Completed"}'
```

**Observed:** HTTP `200 OK`. Status became `"DONE"`, notes updated.

---

### AC-D4: DONE → CLOSED transition — PASS

**Request:**
```bash
curl -s -i -X PATCH http://localhost:3000/api/tickets/TCK-1001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"CLOSED","handler_notes":"Closing ticket"}'
```

**Observed:** HTTP `200 OK`. Status became `"CLOSED"`, notes updated.

---

### AC-D5: Invalid status transition rejected — PASS

**Request (against fresh REPORTED ticket TCK-1003):**
```bash
curl -s -i -X PATCH http://localhost:3000/api/tickets/TCK-1003/status \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE","handler_notes":"Invalid direct jump."}'
```

**Observed:** HTTP `400 Bad Request`. Response:
```json
{"error":"Invalid status transition","current_status":"REPORTED","allowed_statuses":["RECEIVED","CLOSED"]}
```

**UI verification (code review):** `openManageModal()` populates `#status-transition` dropdown with only `transitions[selectedTicket.status]` values. For REPORTED, only `["RECEIVED","CLOSED"]` appear. Confirmed in source.

---

### AC-D6: Handler notes save and appear in both dashboard and Track view — PASS

**API verification:**
1. PATCH TCK-1001 with `"handler_notes":"Reopen"` → response includes `"handler_notes":"Reopen"`.
2. GET `/api/tickets/TCK-1001` → returns `"handler_notes":"Reopen"`.

**UI verification (code review):** `updateStatus()` sends `handler_notes` from `#handler-notes` textarea. Modal detail (`#modal-detail`) shows "Current Handler Notes". Track view `renderTicketCard()` renders `handler_notes` in `.notes-box`. Confirmed in source.

---

### AC-E1: package.json has scripts.start — PASS

**Observed:** `package.json` contains:
```json
"scripts": { "start": "node server.js" }
```

---

### AC-E2: Server starts on port 3000 — PASS

**Observed:** `npm start` / `node server.js` starts without errors. `GET /api/health` returns `{"ok":true}` on port 3000.

---

### AC-E3: Web interface loads — PASS

**Request:** `curl -s -i http://localhost:3000/`

**Observed:** HTTP `200 OK`, `Content-Type: text/html; charset=UTF-8`. Full HTML page returned with all three views (Submit, Track, Dashboard), manage dialog, and script includes. All static assets (`/app.js`, `/styles.css`) return HTTP 200.

---

### AC-E4: Data persists across server restart — PASS

**Procedure:**
1. Created 7 tickets via API.
2. Stopped server (killed process).
3. Confirmed server stopped (health endpoint unreachable).
4. Restarted server with `node server.js`.
5. `GET /api/tickets` returned all 7 tickets with correct IDs, statuses, and notes.

---

## 2. Edge Case Results

### Edge-1: Empty reporter_name only — PASS

**Request:** `POST /api/tickets` with `reporter_name: ""`, valid title and description.
**Observed:** HTTP `400`, `{"error":"Validation failed","errors":{"reporter_name":"Reporter name is required."}}`

---

### Edge-2: Title field completely absent from POST body — PASS

**Request:** `POST /api/tickets` with body `{"description":"...","reporter_name":"QA","priority":"Medium"}` (no `title` key).
**Observed:** HTTP `400`, `{"error":"Validation failed","errors":{"title":"Issue title is required."}}`

---

### Edge-3: Invalid priority value ("Critical") — PASS

**Request:** `POST /api/tickets` with `"priority":"Critical"`.
**Observed:** HTTP `400`, `{"error":"Validation failed","errors":{"priority":"Priority must be Low, Medium, or High."}}`

---

### Edge-4: Attempt to set initial status via POST — PASS

**Request:** `POST /api/tickets` with `"status":"DONE"` in body.
**Observed:** HTTP `201`. Response has `"status":"REPORTED"`. The `status` field from the request body is ignored; server always sets `REPORTED`.

---

### Edge-5: Title exceeding 100 characters — PASS

**Request:** `POST /api/tickets` with title of 101 'x' characters.
**Observed:** HTTP `400`, `{"error":"Validation failed","errors":{"title":"Issue title must be 100 characters or fewer."}}`

---

### Edge-6: Whitespace trimming on all fields — PASS

**Request:** `POST /api/tickets` with `"title":"  Spaced  "`, `"reporter_name":"  Spaced Name  "`, `"priority":"  High  "`.
**Observed:** HTTP `201`. Response has `"title":"Spaced"`, `"reporter_name":"Spaced Name"`, `"priority":"High"`. All fields trimmed correctly.

---

### Edge-7: Requesting a non-existent ticket ID — PASS

**Request:** `GET /api/tickets/TCK-999999`
**Observed:** HTTP `404`, `{"error":"Ticket not found"}`

---

### Edge-8: PATCH non-existent ticket — PASS

**Request:** `PATCH /api/tickets/TCK-999999/status` with valid status body.
**Observed:** HTTP `404`, `{"error":"Ticket not found"}`

---

### Edge-9: PATCH with invalid/garbage status value — PASS

**Request:** `PATCH /api/tickets/TCK-1002/status` with `"status":"GARBAGE"`.
**Observed:** HTTP `400`, `{"error":"Invalid target status"}`

---

### Edge-10: PATCH with missing status field — PASS

**Request:** `PATCH /api/tickets/TCK-1002/status` with `{"handler_notes":"no status field"}`.
**Observed:** HTTP `400`, `{"error":"Invalid target status"}` (empty string after cleanString → not in STATUSES set).

---

### Edge-11: PATCH with empty body object — PASS

**Request:** `PATCH /api/tickets/TCK-1002/status` with `{}`.
**Observed:** HTTP `400`, `{"error":"Invalid target status"}`

---

### Edge-12: Invalid transition: REPORTED → DONE (skip states) — PASS

**Request:** `PATCH /api/tickets/TCK-1003/status` with `"status":"DONE"` (TCK-1003 was REPORTED).
**Observed:** HTTP `400`, `{"error":"Invalid status transition","current_status":"REPORTED","allowed_statuses":["RECEIVED","CLOSED"]}`

---

### Edge-13: Invalid transition: CLOSED → REPORTED (backwards not allowed) — PASS

**Request:** `PATCH /api/tickets/TCK-1001/status` with `"status":"REPORTED"` (TCK-1001 was CLOSED).
**Observed:** HTTP `400`, `{"error":"Invalid status transition","current_status":"CLOSED","allowed_statuses":["IN_PROGRESS"]}`

---

### Edge-14: Valid transition: CLOSED → IN_PROGRESS (reopen) — PASS

**Request:** `PATCH /api/tickets/TCK-1001/status` with `"status":"IN_PROGRESS"` (TCK-1001 was CLOSED).
**Observed:** HTTP `200`, status became `"IN_PROGRESS"`.

---

### Edge-15: Valid transition: RECEIVED → REPORTED (send back) — PASS

**Verified by code review:** `ALLOWED_TRANSITIONS.RECEIVED` includes `"REPORTED"`. Consistent with spec in HANDOFF_B.md.

---

### Edge-16: Valid transition: DONE → IN_PROGRESS (reopen from done) — PASS

**Verified by code review:** `ALLOWED_TRANSITIONS.DONE` includes `"IN_PROGRESS"`. Consistent with spec in HANDOFF_B.md.

---

### Edge-17: Lowercase ticket ID in URL — PASS

**Request:** `GET /api/tickets/tck-1002` (lowercase).
**Observed:** HTTP `200 OK`. Server uppercases the ID via `.toUpperCase()` and finds the ticket.

---

### Edge-18: Invalid status filter value — PASS

**Request:** `GET /api/tickets?status=GARBAGE`
**Observed:** HTTP `400`, `{"error":"Invalid status filter"}`

---

### Edge-19: Invalid priority filter value — PASS

**Request:** `GET /api/tickets?priority=GARBAGE`
**Observed:** HTTP `400`, `{"error":"Invalid priority filter"}`

---

### Edge-20: Combined status + priority filter — PASS

**Request:** `GET /api/tickets?status=REPORTED&priority=Medium`
**Observed:** HTTP `200`. Returns only tickets matching both filters. Verified: returned 2 tickets that are both REPORTED and Medium.

---

### Edge-21: POST with no body at all — PASS

**Request:** `POST /api/tickets` with `Content-Type: application/json` but no body.
**Observed:** HTTP `400`, `{"error":"Validation failed","errors":{"reporter_name":"Reporter name is required.","title":"Issue title is required.","description":"Description is required."}}`

---

### Edge-22: POST without Content-Type header — PASS (acceptable behavior)

**Request:** `POST /api/tickets` with JSON body but no `Content-Type` header.
**Observed:** HTTP `400` with validation errors. Express does not parse the body without the correct content-type, so `req.body` is undefined → all fields empty → validation fails. This is acceptable — the API correctly rejects the request.

---

### Edge-23: POST with wrong Content-Type (text/plain) — PASS (acceptable behavior)

**Request:** `POST /api/tickets` with `Content-Type: text/plain` and text body.
**Observed:** HTTP `400` with validation errors. Same behavior as Edge-22 — body not parsed as JSON. Acceptable.

---

### Edge-24: Non-existent API route — PASS

**Request:** `GET /api/nonexistent`
**Observed:** HTTP `404`, `{"error":"API route not found"}`

---

### Edge-25: PATCH without handler_notes field — PASS

**Request:** `PATCH /api/tickets/TCK-1003/status` with `{"status":"IN_PROGRESS"}` (no `handler_notes` key).
**Observed:** HTTP `200`. Response has `"handler_notes":""` (empty string, since `cleanString(undefined)` returns `""`). Handler notes are replaced, not appended — consistent with HANDOFF_B.md documentation.

---

### Edge-26: Malformed JSON body on POST — **BUG FOUND** (see Bug #1)

**Request:** `POST /api/tickets` with `Content-Type: application/json` and body `{bad json}`.
**Observed:** HTTP `400` but response is an **HTML error page** with a full stack trace (SyntaxError), not a JSON response. Content-Type is `text/html; charset=utf-8`.

---

### Edge-27: Malformed JSON body on PATCH — **BUG FOUND** (see Bug #1)

**Request:** `PATCH /api/tickets/TCK-1002/status` with `Content-Type: application/json` and body `{bad json}`.
**Observed:** Same as Edge-26 — HTTP `400` with HTML error page and stack trace, not JSON.

---

### Edge-28: Dashboard summary counts after status changes — PASS

After multiple ticket creations and status transitions, verified API filter counts match expected values:

| Status | Count | Tickets |
|--------|-------|---------|
| Total | 7 | All |
| REPORTED | 5 | TCK-1002, TCK-1004, TCK-1005, TCK-1006, TCK-1007 |
| RECEIVED | 0 | (TCK-1003 moved to IN_PROGRESS) |
| IN_PROGRESS | 2 | TCK-1001, TCK-1003 |
| DONE | 0 | — |

Frontend `updateMetrics()` function uses identical filter logic. Confirmed correct.

---

## 3. Bugs Found

### Bug #1: Malformed JSON returns HTML error page with stack trace instead of JSON

**Severity:** Low-Medium

**What I did:**
```bash
curl -s -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{bad json}"
```

Also reproduced on PATCH endpoint:
```bash
curl -s -i -X PATCH http://localhost:3000/api/tickets/TCK-1002/status -H "Content-Type: application/json" -d "{bad json}"
```

**What I expected:** HTTP `400` with a JSON error response, e.g. `{"error":"Malformed JSON body"}` or similar, with `Content-Type: application/json`.

**What actually happened:** HTTP `400` with `Content-Type: text/html; charset=utf-8` and a full HTML error page including a stack trace:

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Error</title></head>
<body>
<pre>SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
    at JSON.parse (<anonymous>)
    at parse (D:\AI-Workspace\projects\ticket-tracking-relay\node_modules\body-parser\lib\types\json.js:96:19)
    ...
</pre>
</body>
</html>
```

**Why it matters:** The API returns JSON for all other error cases (validation, not found, invalid transitions), but malformed JSON is an unhandled Express body-parser error that leaks the internal stack trace and file paths. This is an inconsistency in API error handling and a minor information disclosure issue. All other API endpoints return clean JSON errors.

**Root cause:** Express's default JSON body parser (`express.json()`) throws a `SyntaxError` when it encounters malformed JSON with the correct `Content-Type: application/json`. This error is not caught by any custom error-handling middleware — the server has none. Express's default error handler produces an HTML response.

**Fix suggestion:** Add an Express error-handling middleware at the end of `server.js` that catches body-parser errors and returns a JSON response:
```javascript
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Malformed JSON body" });
  }
  next(err);
});
```

---

## 4. Overall Verdict

### **PASS** (with 1 minor bug noted)

All 20 acceptance criteria (AC-A1 through AC-E4) **PASS**.

All 28 edge case tests **PASS** except for the malformed JSON handling (Bug #1), which is a low-medium severity issue that does not affect any documented acceptance criterion.

**Summary:**
- The application is fully functional and meets all acceptance criteria.
- The API correctly handles all specified operations: ticket creation, retrieval, listing, filtering, status transitions, and lifecycle enforcement.
- Data persists across server restarts.
- All validation, transition rules, and edge cases work as specified.
- The frontend code correctly implements all UI behaviors (form validation, ticket display, dashboard, filters, manage modal, status transitions).
- **1 bug found:** Malformed JSON bodies produce an HTML error page with stack trace instead of a JSON error response. This is a minor issue that does not break any acceptance criterion but should be fixed for API consistency and to avoid information disclosure.

**The application is ready for delivery.** The single bug is a non-blocking polish issue.