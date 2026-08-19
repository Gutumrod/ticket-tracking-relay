// Manual JS port of modules-hub/modules/ticket-tracker v0.1.0 core/id.ts (canonical TS source).
function nextTicketId(existingTickets) {
  const maxId = existingTickets.reduce((max, ticket) => {
    const match = /^TCK-(\d+)$/.exec(ticket.id || "");
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1000);
  return `TCK-${maxId + 1}`;
}

module.exports = { nextTicketId };
