const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "tickets.json");

const PRIORITIES = new Set(["Low", "Medium", "High"]);
const STATUSES = new Set(["REPORTED", "RECEIVED", "IN_PROGRESS", "DONE", "CLOSED"]);
const ALLOWED_TRANSITIONS = {
  REPORTED: ["RECEIVED", "CLOSED"],
  RECEIVED: ["IN_PROGRESS", "REPORTED"],
  IN_PROGRESS: ["DONE", "RECEIVED"],
  DONE: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"]
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]\n", "utf8");
  }
}

function readTickets() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read tickets.json", error);
    return [];
  }
}

function writeTickets(tickets) {
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(tickets, null, 2)}\n`, "utf8");
}

function nextTicketId(tickets) {
  const maxId = tickets.reduce((max, ticket) => {
    const match = /^TCK-(\d+)$/.exec(ticket.id || "");
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1000);
  return `TCK-${maxId + 1}`;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateCreatePayload(body) {
  const errors = {};
  const reporterName = cleanString(body.reporter_name);
  const title = cleanString(body.title);
  const description = cleanString(body.description);
  const priority = cleanString(body.priority) || "Medium";

  if (!reporterName) errors.reporter_name = "Reporter name is required.";
  if (!title) errors.title = "Issue title is required.";
  if (title.length > 100) errors.title = "Issue title must be 100 characters or fewer.";
  if (!description) errors.description = "Description is required.";
  if (!PRIORITIES.has(priority)) errors.priority = "Priority must be Low, Medium, or High.";

  return {
    errors,
    data: { reporter_name: reporterName, title, description, priority }
  };
}

function sortNewestFirst(tickets) {
  return [...tickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/tickets", (req, res) => {
  const { errors, data } = validateCreatePayload(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: "Validation failed", errors });
  }

  const tickets = readTickets();
  const now = new Date().toISOString();
  const ticket = {
    id: nextTicketId(tickets),
    title: data.title,
    description: data.description,
    reporter_name: data.reporter_name,
    priority: data.priority,
    status: "REPORTED",
    handler_notes: "",
    created_at: now,
    updated_at: now
  };

  tickets.push(ticket);
  writeTickets(tickets);
  return res.status(201).json(ticket);
});

app.get("/api/tickets", (req, res) => {
  const status = cleanString(req.query.status);
  const priority = cleanString(req.query.priority);

  if (status && !STATUSES.has(status)) {
    return res.status(400).json({ error: "Invalid status filter" });
  }
  if (priority && !PRIORITIES.has(priority)) {
    return res.status(400).json({ error: "Invalid priority filter" });
  }

  let tickets = readTickets();
  if (status) tickets = tickets.filter((ticket) => ticket.status === status);
  if (priority) tickets = tickets.filter((ticket) => ticket.priority === priority);
  return res.json(sortNewestFirst(tickets));
});

app.get("/api/tickets/:id", (req, res) => {
  const ticketId = cleanString(req.params.id).toUpperCase();
  const ticket = readTickets().find((item) => item.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  return res.json(ticket);
});

app.patch("/api/tickets/:id/status", (req, res) => {
  const ticketId = cleanString(req.params.id).toUpperCase();
  const targetStatus = cleanString(req.body && req.body.status);
  const handlerNotes = cleanString(req.body && req.body.handler_notes);

  if (!STATUSES.has(targetStatus)) {
    return res.status(400).json({ error: "Invalid target status" });
  }

  const tickets = readTickets();
  const index = tickets.findIndex((item) => item.id === ticketId);
  if (index === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const current = tickets[index];
  const allowed = ALLOWED_TRANSITIONS[current.status] || [];
  if (!allowed.includes(targetStatus)) {
    return res.status(400).json({
      error: "Invalid status transition",
      current_status: current.status,
      allowed_statuses: allowed
    });
  }

  const updated = {
    ...current,
    status: targetStatus,
    handler_notes: handlerNotes,
    updated_at: new Date().toISOString()
  };
  tickets[index] = updated;
  writeTickets(tickets);
  return res.json(updated);
});

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

ensureDataFile();
app.listen(PORT, () => {
  console.log(`Ticket Tracker MVP running at http://localhost:${PORT}`);
});
