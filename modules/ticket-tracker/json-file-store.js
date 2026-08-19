// Manual JS port of modules-hub/modules/ticket-tracker v0.1.0 store/json-file-store.ts (canonical TS source).
const fs = require("fs");
const { ALLOWED_TRANSITIONS, isStatus } = require("./constants");
const { nextTicketId } = require("./id");

function createJsonFileStore(filePath) {
  function ensureFile() {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]\n", "utf8");
    }
  }

  function readAll() {
    ensureFile();
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeAll(tickets) {
    fs.writeFileSync(filePath, `${JSON.stringify(tickets, null, 2)}\n`, "utf8");
  }

  return {
    async list(filter) {
      let tickets = readAll();
      if (filter && filter.status) tickets = tickets.filter((t) => t.status === filter.status);
      if (filter && filter.priority) tickets = tickets.filter((t) => t.priority === filter.priority);
      return [...tickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async get(id) {
      return readAll().find((t) => t.id === id) || null;
    },

    async create(data) {
      const tickets = readAll();
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
      writeAll(tickets);
      return ticket;
    },

    async updateStatus(id, patch) {
      const tickets = readAll();
      const index = tickets.findIndex((t) => t.id === id);
      if (index === -1) return { ok: false, reason: "NOT_FOUND" };

      const current = tickets[index];
      const allowed = ALLOWED_TRANSITIONS[current.status] || [];
      if (!isStatus(patch.status) || !allowed.includes(patch.status)) {
        return { ok: false, reason: "INVALID_TRANSITION", current_status: current.status, allowed_statuses: allowed };
      }

      const updated = {
        ...current,
        status: patch.status,
        handler_notes: patch.handler_notes,
        updated_at: new Date().toISOString()
      };
      tickets[index] = updated;
      writeAll(tickets);
      return { ok: true, ticket: updated };
    }
  };
}

module.exports = { createJsonFileStore };
