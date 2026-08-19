// Manual JS port of modules-hub/modules/ticket-tracker v0.1.0 routes.ts (canonical TS source).
const { PRIORITIES, STATUSES, isPriority, isStatus } = require("./constants");
const { cleanString, validateCreatePayload } = require("./validation");

function createTicketRoutes(store) {
  return {
    async createTicket(req, res) {
      const result = validateCreatePayload(req.body || {});
      if (!result.ok) return res.status(400).json({ error: "Validation failed", errors: result.errors });
      const ticket = await store.create(result.data);
      return res.status(201).json(ticket);
    },

    async listTickets(req, res) {
      const status = cleanString(req.query.status);
      const priority = cleanString(req.query.priority);
      if (status && !isStatus(status)) {
        return res.status(400).json({ error: `Invalid status filter. Must be one of: ${STATUSES.join(", ")}.` });
      }
      if (priority && !isPriority(priority)) {
        return res.status(400).json({ error: `Invalid priority filter. Must be one of: ${PRIORITIES.join(", ")}.` });
      }
      const tickets = await store.list({ status: status || undefined, priority: priority || undefined });
      return res.json(tickets);
    },

    async getTicket(req, res) {
      const id = cleanString(req.params.id).toUpperCase();
      const ticket = await store.get(id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      return res.json(ticket);
    },

    async updateStatus(req, res) {
      const id = cleanString(req.params.id).toUpperCase();
      const body = req.body || {};
      const status = cleanString(body.status);
      const handler_notes = cleanString(body.handler_notes);

      if (!isStatus(status)) return res.status(400).json({ error: "Invalid target status" });

      const result = await store.updateStatus(id, { status, handler_notes });
      if (!result.ok) {
        if (result.reason === "NOT_FOUND") return res.status(404).json({ error: "Ticket not found" });
        return res.status(400).json({
          error: "Invalid status transition",
          current_status: result.current_status,
          allowed_statuses: result.allowed_statuses
        });
      }
      return res.json(result.ticket);
    }
  };
}

module.exports = { createTicketRoutes };
