# Ticket Tracking Relay

Issue reporting and ticket tracking MVP. Reporters submit tickets and track status by ID; handlers work them through a fixed lifecycle (`REPORTED` → `RECEIVED` → `IN_PROGRESS` → `DONE` → `CLOSED`) from a dashboard.

Stack: Node.js + Express, static HTML/CSS/vanilla JS frontend, data persisted to a local `tickets.json` file. No database, no external services.

## Run it

```bash
npm install
npm start
```

Serves both the API and the frontend at `http://localhost:3000`.

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/tickets` | Create a ticket |
| `GET` | `/api/tickets` | List tickets (`?status=`, `?priority=`) |
| `GET` | `/api/tickets/:id` | Get one ticket |
| `PATCH` | `/api/tickets/:id/status` | Transition status + set handler notes |
| `GET` | `/api/health` | Health check |

Full data model, status transition rules, and acceptance criteria: [HANDOFF_A.md](HANDOFF_A.md).

## Status

Functional MVP — all acceptance criteria QA-verified, see [HANDOFF_C2.md](HANDOFF_C2.md). Not production-ready:

- **No authentication.** The handler dashboard (`PATCH /api/tickets/:id/status`) is open to anyone who reaches it — no login, no per-tenant isolation.
- **Storage doesn't scale.** `tickets.json` is read and rewritten in full on every write, no locking — fine for a demo, not for concurrent load.
- No automated test suite (QA was manual `curl` verification, see `HANDOFF_C*.md`), no deploy config.

See `docs/products/registry.yaml` in the platform repo for current commercial status.
