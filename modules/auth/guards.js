// Manual JS port of modules-hub/modules/auth v0.1.0 core/guards.ts (canonical TS source).
// Only requireRole is ported — this app has one role ("handler"), nothing to check
// permission/tenant guards against.
const { AuthError } = require("./error");

function requireRole(context, requiredRole) {
  if (!context || typeof context.userId !== "string" || context.userId.trim().length === 0) {
    throw new AuthError({ message: "Authentication context required", code: "UNAUTHENTICATED", status: 401 });
  }

  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const roles = context.roles || [];
  const isAuthorized = required.some((role) => roles.includes(role));

  if (!isAuthorized) {
    throw new AuthError({
      message: `Required role(s) missing: ${required.join(", ")}`,
      code: "FORBIDDEN",
      status: 403
    });
  }

  return context;
}

module.exports = { requireRole };
