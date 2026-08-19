// Manual JS port of modules-hub/modules/ticket-tracker v0.1.0 core/constants.ts (canonical TS source).
const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["REPORTED", "RECEIVED", "IN_PROGRESS", "DONE", "CLOSED"];
const ALLOWED_TRANSITIONS = {
  REPORTED: ["RECEIVED", "CLOSED"],
  RECEIVED: ["IN_PROGRESS", "REPORTED"],
  IN_PROGRESS: ["DONE", "RECEIVED"],
  DONE: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"]
};

function isPriority(value) {
  return PRIORITIES.includes(value);
}

function isStatus(value) {
  return STATUSES.includes(value);
}

module.exports = { PRIORITIES, STATUSES, ALLOWED_TRANSITIONS, isPriority, isStatus };
