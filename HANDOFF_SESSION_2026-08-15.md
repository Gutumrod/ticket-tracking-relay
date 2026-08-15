# Session Handoff — 2026-08-15

**Scope:** Sell-readiness check on `ticket-tracking-relay`, plus follow-on work it triggered in two sibling repos. Nothing in this repo's source was changed except adding `README.md` — the login work below is planned and approved, not yet implemented.

---

## 1. What was checked

Sell-readiness review of this MVP. Functionally solid — every acceptance criterion in `HANDOFF_A.md` is QA-verified (`HANDOFF_C.md`, `HANDOFF_C2.md`), frontend consistently escapes user input, no XSS. Three real gaps found:

1. **No authentication on the Handler Dashboard.** `GET /api/tickets` (list) and `PATCH /api/tickets/:id/status` are open to anyone — no login, no per-tenant isolation. This is the one gap that actually blocks selling it.
2. **Storage won't hold up under real load.** `tickets.json` is read/rewritten in full on every write, no locking.
3. Missing the basics buyers check: no README (fixed this session), no tests-as-code (QA was manual `curl`), no deploy story.

## 2. Work done this session (other repos)

### `modules-hub` (`D:/AI-Workspace/projects/modules-hub`)

The existing `auth-supabase` module is intentionally locked to Supabase Auth (see its own `DESIGN.md` Non-Goals) — no module in the hub could serve a project like this one with zero Supabase and a plain JSON file store. Built a new module to fill that gap via a 3-agent relay (AGY architect → Codex builder → Qwen QA, independently re-run rather than trusting the builder's self-report):

- **`modules/auth`** (`@module-hub/auth`, v0.1.0) — data/login-agnostic auth helper. Generic `IdentityProvider<TCredential, TRawIdentity>` core (zero SDK/env imports), normalized `AuthContext`/`AuthError`, RBAC guards (`requireRole`, `requirePermission`, `requireTenantMembership`). Ships 3 adapters: `supabase-adapter` (parity/migration path from `auth-supabase`), `credential-store-adapter` (any host-injected `verify()` callback — DB, JSON file, memory), `jwt-adapter` (host-injected token verification, no signing keys touched).
- 30/30 tests passing, typecheck clean, independently verified zero env/SDK leakage in `core/`.
- One design flaw caught on manual re-audit (not by the QA agent): adapter-specific types (`SupabaseAuthClient`, `SupabaseUser`, `CredentialStoreAdapterOptions`, `JwtAdapterOptions`) were living in `core/types.ts` instead of each adapter's own file — contradicted the module's own "core has zero adapter knowledge" claim, even though there was no runtime coupling. Fixed: each type now lives in and is exported from its owning adapter file.
- Commits: `08fba46` (add module), `43d1bfa` (type-ownership fix). **Not pushed.**

### `saas-product-hub` (`D:/AI-Workspace/projects/saas-product-hub`)

`docs/products/registry.yaml`'s `tracking` entry (this product) claimed `deployment_model: shared_runtime` on Project B with `notification`/`audit-log` modules wired in, `commercial_status: beta`. None of that exists in this repo. Corrected to `source_product` / `prototype`, noted what's actually planned-but-not-wired.

- Commit: `e1b8169`. **Not pushed.**

### This repo

- Added `README.md` (run instructions, API table, honest status section). Commit: `aa4f871`. **Not pushed.**

## 3. Approved plan — NOT YET IMPLEMENTED

Full plan is saved locally at `C:\Users\Win10\.claude\plans\bubbly-exploring-axolotl.md` (Claude Code plan file, this machine only) — reproduced in full below so it's usable without that file.

**Goal:** wire `modules-hub/modules/auth`'s credential-store-adapter path into this app to add real login on the Handler Dashboard, leaving reporter-facing flows (submit/track ticket) open with no login.

**Key constraint:** `modules-hub/modules/auth` is TypeScript; this app is zero-build plain JS (`npm start` → `node server.js` directly, no `tsc`, no bundler). Decision made: **hand-port only the pieces actually used** (core context/guards/error + credential-store-adapter) into plain `.js` files in this repo, rather than adding a TypeScript build step. `modules-hub/modules/auth/**` stays untouched — this is a derived copy, not an edit to the original, per `modules-hub/INDEX.md`'s copy-only rule.

### Approach

**1. Ported auth core — `lib/auth/`** (new, plain JS, CommonJS to match `server.js`'s `require()` style, each file headed with a comment noting it's a manual port of `modules-hub/modules/auth` v0.1.0 pointing at the canonical TS source)
- `lib/auth/error.js` — `AuthError` class
- `lib/auth/guards.js` — `requireRole` only (this app has one role, `handler`; permission/tenant guards not ported, nothing to check them against)
- `lib/auth/context.js` — `getCurrentUser`, `requireUser`, trimmed of the generic multi-shape metadata normalizer (raw identity here is always `{ userId, roles }` from our own session lookup)
- `lib/auth/credential-store-adapter.js` — `createCredentialStoreAdapter(options)`, near-verbatim port (~10 lines)

Call `requireUser(provider, { credential })` / `requireRole(context, 'handler')` directly per-request inside route handlers — **not** a shared `createAuthHelpers()` singleton (the QA pass on the module flagged that its cached-context pattern is unsafe to share across requests in a long-lived server process).

**2. User store — `lib/users.js`** (mirrors the existing `tickets.json` pattern: `ensureDataFile`/`readTickets`/`writeTickets` in `server.js`)
- `users.json` (new, **must be gitignored** — contains password hashes) — array of `{ id, username, passwordHash, passwordSalt, roles: ["handler"] }`
- `ensureUsersFile()` — first run: seed one handler account from `process.env.HANDLER_USERNAME` (default `"handler"`) / `process.env.HANDLER_PASSWORD` (if unset, generate random via `crypto.randomBytes`, print once to console — never hardcode a default password in source)
- `hashPassword`/`verifyPassword` — Node's built-in `crypto.scryptSync` + `crypto.timingSafeEqual`. No new dependency (no bcrypt).
- `findUserByUsername`

**3. Session store** — in-memory `Map` (`sessionId -> {userId, username, roles}`) inside `server.js`, ids via `crypto.randomUUID()`. Cookie hand-parsed/set (no `cookie-parser` dependency — single-value parse is trivial). `httpOnly`, `sameSite=Lax`; `secure` flag skipped for local dev (prod TODO, no HTTPS story yet). No idle expiry for v1 (known limitation, not built now).

**4. New routes — `server.js`**
- `POST /api/auth/login` — `{username, password}` → verify → session + `Set-Cookie` → `{ok:true}`. Failure: `401 {"error":"Invalid credentials"}` (generic — don't reveal whether username existed).
- `POST /api/auth/logout` — delete session, clear cookie.
- `GET /api/auth/me` — resolves session cookie via `getCurrentUser`; `{userId, username, roles}` or `401`. Frontend uses this to check auth state on load.

**5. Gate two routes:** `GET /api/tickets` (list) and `PATCH /api/tickets/:id/status` — wrap with `requireUser` + `requireRole(context, 'handler')`, `AuthError` → `error.status` + `{error: error.message}`. Leave `POST /api/tickets` and `GET /api/tickets/:id` public (confirmed via exploration: the dashboard's Manage modal uses the already-loaded list, never re-fetches by id — so `GET /api/tickets/:id` is purely the reporter tracking endpoint).

**6. Frontend — `public/index.html` + `public/app.js`** (reuses existing view-switching: `showView()` toggles `.hidden` on `.view` sections via `handleRoute()`/`location.hash`, `[data-nav]` links get `.active`)
- Add `<section id="login-view" class="view hidden">` with username/password form, wired like `submitTicket()` (a `requestJson()` POST + inline error).
- In `showView()`: when `name === "dashboard"`, call `GET /api/auth/me` first; `401` → redirect to `#login` instead of loading the dashboard.
- Successful login → redirect to `#dashboard`.
- Logout control in dashboard view → `POST /api/auth/logout` → redirect to `#submit`.
- No changes to `#submit-view`/`#track-view`.

### Files touched (when implemented)

New: `lib/auth/error.js`, `lib/auth/guards.js`, `lib/auth/context.js`, `lib/auth/credential-store-adapter.js`, `lib/users.js`, `.gitignore` (+`users.json`)
Modified: `server.js`, `public/index.html`, `public/app.js`, `README.md` (document `HANDLER_USERNAME`/`HANDLER_PASSWORD`)
Untouched: `modules-hub/modules/auth/**`, `tickets.json`/ticket lifecycle logic, reporter-facing routes

### Verification checklist (run after implementing)

1. `npm start` → console prints a generated handler password if `HANDLER_PASSWORD` unset.
2. Reporter flow unaffected: submit via `#submit`, track via `#track` — no login prompt.
3. `GET /api/tickets` and `PATCH /api/tickets/:id/status` without a session cookie → `401`.
4. Visit `#dashboard` while logged out → redirected to `#login`.
5. Log in with seeded credentials → dashboard loads, status transitions work. Re-verify the existing malformed-JSON regression from `HANDOFF_C2.md` still passes (`curl -i -X PATCH .../status -d "{bad json}"` → `400` JSON) — new middleware shouldn't affect it.
6. Log out → next dashboard visit redirects to login.
7. Wrong password → `401` generic "Invalid credentials", no username-exists hint.

---

## 4. Next step

Resume by implementing the plan above (or re-run `EnterPlanMode`/reference `bubbly-exploring-axolotl.md` if working from the same machine). Nothing is blocking — plan was fully approved, just paused mid-session.
