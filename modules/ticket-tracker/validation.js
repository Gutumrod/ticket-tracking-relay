// Manual JS port of modules-hub/modules/ticket-tracker v0.1.0 core/validation.ts (canonical TS source).
const { PRIORITIES, isPriority } = require("./constants");

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateCreatePayload(body) {
  const errors = {};
  const reporter_name = cleanString(body.reporter_name);
  const title = cleanString(body.title);
  const description = cleanString(body.description);
  const priority = cleanString(body.priority) || "Medium";

  if (!reporter_name) errors.reporter_name = "Reporter name is required.";
  if (!title) errors.title = "Issue title is required.";
  if (title.length > 100) errors.title = "Issue title must be 100 characters or fewer.";
  if (!description) errors.description = "Description is required.";
  if (!isPriority(priority)) errors.priority = `Priority must be one of: ${PRIORITIES.join(", ")}.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { reporter_name, title, description, priority } };
}

module.exports = { cleanString, validateCreatePayload };
