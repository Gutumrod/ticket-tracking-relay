# Ticket Tracking Relay

Issue reporting and ticket tracking MVP. Reporters submit tickets and track status by ID; handlers work them through a fixed lifecycle (`REPORTED` → `RECEIVED` → `IN_PROGRESS` → `DONE` → `CLOSED`) from a dashboard.

Stack: Node.js + Express, static HTML/CSS/vanilla JS frontend, data persisted to local `tickets.json`/`users.json` files. No database, no external services.

## Run it

```bash
npm install
npm start
```

Serves both the API and the frontend at `http://localhost:3000`. The handler dashboard requires login — on first run, a handler account is seeded and its password printed once to the console. Set `HANDLER_USERNAME`/`HANDLER_PASSWORD` env vars to choose your own instead of the generated one.

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/tickets` | Create a ticket (public) |
| `GET` | `/api/tickets` | List tickets (`?status=`, `?priority=`) — handler login required |
| `GET` | `/api/tickets/:id` | Get one ticket (public — reporter tracking) |
| `PATCH` | `/api/tickets/:id/status` | Transition status + set handler notes — handler login required |
| `POST` | `/api/auth/login` | Log in as handler (`{username, password}`) |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/auth/me` | Current session, or `401` |
| `GET` | `/api/health` | Health check |

Full data model, status transition rules, and acceptance criteria: [HANDOFF_A.md](HANDOFF_A.md).

## Status

Functional MVP — all acceptance criteria QA-verified, see [HANDOFF_C2.md](HANDOFF_C2.md). Not production-ready:

- **Sessions are in-memory.** Logging in survives a page reload, not a server restart; no idle expiry yet.
- **Storage doesn't scale.** `tickets.json`/`users.json` are read and rewritten in full on every write, no locking — fine for a demo, not for concurrent load.
- No automated test suite (QA was manual `curl` verification, see `HANDOFF_C*.md`), no deploy config.

See `docs/products/registry.yaml` in the platform repo for current commercial status.
