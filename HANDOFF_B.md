# HANDOFF_B.md - Developer Implementation Handoff

## 1. What Was Built

Built a runnable Issue Reporting and Ticket Tracking MVP in this folder.

Stack and structure:
- `package.json` - Node project with `npm start`.
- `server.js` - Express server on port `3000`, REST API, static file serving, JSON file persistence.
- `tickets.json` - local ticket storage file, initialized as an empty array.
- `public/index.html` - single page web interface.
- `public/styles.css` - responsive styling.
- `public/app.js` - frontend behavior for submit, track, dashboard filters, ticket modal, and status updates.
- `package-lock.json` and `node_modules/` were produced by `npm install`.

Implemented API behavior:
- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id/status`
- `GET /api/health`

Implemented ticket lifecycle enforcement:
- `REPORTED` -> `RECEIVED`, `CLOSED`
- `RECEIVED` -> `IN_PROGRESS`, `REPORTED`
- `IN_PROGRESS` -> `DONE`, `RECEIVED`
- `DONE` -> `CLOSED`, `IN_PROGRESS`
- `CLOSED` -> `IN_PROGRESS`

## 2. Install And Run

From this folder:

```bash
$ npm install
$ npm start
```

Server:
- Port: `3000`
- Web UI: `http://localhost:3000`
- API base: `http://localhost:3000/api`
- Data file: `D:\AI-Workspace\projects\ticket-tracking-relay\tickets.json`

Stop the server with `Ctrl+C`.

## 3. Acceptance Criteria Test Steps

AC-A1:
- Open `http://localhost:3000/#submit`.
- Fill Reporter Name, Issue Title, Priority, and Description.
- Click `Submit Ticket`.
- Confirm success banner shows an ID like `TCK-1001`.
- API check:
```bash
$ curl -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{\"title\":\"API test\",\"description\":\"Created from curl\",\"reporter_name\":\"QA\",\"priority\":\"High\"}"
```
- Expected: HTTP `201` and full ticket JSON.

AC-A2:
```bash
$ curl -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{\"title\":\"Default priority\",\"description\":\"No priority field\",\"reporter_name\":\"QA\"}"
```
- Expected: HTTP `201`, `priority` is `"Medium"`.

AC-A3:
- In the submit form, leave Reporter Name, Issue Title, or Description empty and click `Submit Ticket`.
- Expected: inline red validation messages.
- API check:
```bash
$ curl -i -X POST http://localhost:3000/api/tickets -H "Content-Type: application/json" -d "{\"title\":\"\",\"description\":\"\",\"reporter_name\":\"\"}"
```
- Expected: HTTP `400`.

AC-A4:
- Create any ticket.
- Expected: returned ticket has `status: "REPORTED"`.

AC-A5:
- Create any ticket.
- Expected: `created_at` and `updated_at` are ISO strings and initially identical.

AC-B1:
- Go to `http://localhost:3000/#track`.
- Enter an existing Ticket ID.
- Click `Search`.
- Expected: title, description, reporter name, priority badge, status badge, timestamps, progress indicator, and handler notes render.

AC-B2:
- Search for a missing ID such as `TCK-999999`.
- Expected: red "Ticket ID not found. Please verify your ID." banner.

AC-B3:
- Search a valid ticket in Track view.
- Go to `#dashboard`, click `Manage`, update status.
- Return to Track view and search the same ID again.
- Expected: updated status and notes are visible.

AC-C1:
- Create multiple tickets.
- Open `http://localhost:3000/#dashboard`.
- Expected: table lists all tickets newest first by `created_at`.

AC-C2:
- In dashboard, set Status Filter to `REPORTED`.
- Expected: only tickets with `status === "REPORTED"` are shown.

AC-C3:
- In dashboard, set Priority Filter to `High`.
- Expected: only tickets with `priority === "High"` are shown.

AC-C4:
- Compare dashboard summary cards with ticket states in the table or `GET /api/tickets`.
- Expected: Total, Reported, Received, In Progress, and Done counts match actual data.

AC-D1:
```bash
$ curl -i -X PATCH http://localhost:3000/api/tickets/TCK-1001/status -H "Content-Type: application/json" -d "{\"status\":\"RECEIVED\",\"handler_notes\":\"Acknowledged.\"}"
```
- Use an existing `REPORTED` ticket ID.
- Expected: HTTP `200`, status becomes `RECEIVED`, `updated_at` changes.

AC-D2:
- Patch the same ticket from `RECEIVED` to `IN_PROGRESS`.
- Expected: HTTP `200`.

AC-D3:
- Patch from `IN_PROGRESS` to `DONE`.
- Expected: HTTP `200`.

AC-D4:
- Patch from `DONE` to `CLOSED`.
- Expected: HTTP `200`.

AC-D5:
- UI check: in the Manage modal, only allowed next statuses appear in the dropdown.
- API check against a fresh `REPORTED` ticket:
```bash
$ curl -i -X PATCH http://localhost:3000/api/tickets/TCK-1001/status -H "Content-Type: application/json" -d "{\"status\":\"DONE\",\"handler_notes\":\"Invalid direct jump.\"}"
```
- Expected: HTTP `400`.

AC-D6:
- In dashboard Manage modal, enter handler notes and update status.
- Expected: notes save and appear in both dashboard modal details and Track view.

AC-E1:
- Check `package.json`.
- Expected: `scripts.start` exists and runs `node server.js`.

AC-E2:
```bash
$ npm start
```
- Expected: server starts on port `3000` without errors.

AC-E3:
- Open `http://localhost:3000`.
- Expected: the web interface loads directly.

AC-E4:
- Create a ticket.
- Stop server with `Ctrl+C`.
- Run `npm start` again.
- Open dashboard or inspect `tickets.json`.
- Expected: ticket still exists.

## 4. Deviations

No intentional deviations from the specification.

One implementation detail: `GET /api/health` was added as a small smoke-test endpoint. It does not affect the specified API.

## 5. QA Watchouts

- `tickets.json` is currently initialized empty, so QA should create test tickets before checking dashboard counts.
- Ticket IDs auto-increment from the highest existing `TCK-XXXX` value in `tickets.json`; if QA edits or clears the file, the next ID will reflect that file state.
- Handler notes are replaced on each status update, not appended as a note history, because the specified data model has one `handler_notes` string field and no separate history array.
