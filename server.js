const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { createCredentialStoreAdapter } = require("./modules/auth/credential-store-adapter");
const { requireUser } = require("./modules/auth/context");
const { requireRole } = require("./modules/auth/guards");
const { AuthError } = require("./modules/auth/error");
const { ensureUsersFile, findUserByUsername, verifyPassword } = require("./lib/users");
const { createJsonFileStore } = require("./modules/ticket-tracker/json-file-store");
const { createTicketRoutes } = require("./modules/ticket-tracker/routes");

const app = express();
const PORT = 3000;
const SESSION_COOKIE = "session_id";
const sessions = new Map(); // sessionId -> { userId, username, roles }

const ticketStore = createJsonFileStore(path.join(__dirname, "tickets.json"));
const tickets = createTicketRoutes(ticketStore);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(";").reduce((acc, pair) => {
    const index = pair.indexOf("=");
    if (index === -1) return acc;
    acc[pair.slice(0, index).trim()] = decodeURIComponent(pair.slice(index + 1).trim());
    return acc;
  }, {});
}

function setSessionCookie(res, sessionId) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function getSessionId(req) {
  return parseCookies(req)[SESSION_COOKIE];
}

const authProvider = createCredentialStoreAdapter({
  verify: async (sessionId) => {
    const session = sessionId && sessions.get(sessionId);
    return session ? { userId: session.userId, roles: session.roles } : null;
  }
});

async function requireHandler(req) {
  const context = await requireUser(authProvider, { credential: getSessionId(req) });
  return requireRole(context, "handler");
}

function withHandlerAuth(handler) {
  return async (req, res) => {
    try {
      await requireHandler(req);
    } catch (error) {
      if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
      return res.status(500).json({ error: "Internal error" });
    }
    return handler(req, res);
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const username = cleanString(req.body && req.body.username);
  const password = typeof (req.body && req.body.password) === "string" ? req.body.password : "";
  const user = findUserByUsername(username);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { userId: user.id, username: user.username, roles: user.roles });
  setSessionCookie(res, sessionId);
  return res.json({ ok: true });
});

app.post("/api/auth/logout", (req, res) => {
  const sessionId = getSessionId(req);
  if (sessionId) sessions.delete(sessionId);
  clearSessionCookie(res);
  return res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const context = await requireUser(authProvider, { credential: getSessionId(req) });
    const session = sessions.get(getSessionId(req));
    return res.json({ userId: context.userId, username: session.username, roles: context.roles });
  } catch (error) {
    if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: "Internal error" });
  }
});

// Reporter-facing routes — no login required.
app.post("/api/tickets", tickets.createTicket);
app.get("/api/tickets/:id", tickets.getTicket);

// Handler dashboard routes — login required.
app.get("/api/tickets", withHandlerAuth(tickets.listTickets));
app.patch("/api/tickets/:id/status", withHandlerAuth(tickets.updateStatus));

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON body" });
  }
  return next(err);
});

ensureUsersFile();
app.listen(PORT, () => {
  console.log(`Ticket Tracker MVP running at http://localhost:${PORT}`);
});
