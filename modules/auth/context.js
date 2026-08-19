// Manual JS port of modules-hub/modules/auth v0.1.0 core/context.ts (canonical TS source).
// Trimmed to this app's needs: raw identity is always our own { userId, roles } shape,
// so the generic multi-source metadata normalizer isn't ported.
const { AuthError } = require("./error");

async function getCurrentUser(provider, options) {
  let rawIdentity;
  try {
    rawIdentity = await provider.resolve(options && options.credential);
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError({
      message: "Identity provider failed to resolve credential",
      code: "INVALID_SESSION",
      status: 401,
      cause: error
    });
  }

  if (rawIdentity == null) return null;

  return Object.freeze({
    userId: rawIdentity.userId,
    roles: Object.freeze([...(rawIdentity.roles || [])])
  });
}

async function requireUser(provider, options) {
  const context = await getCurrentUser(provider, options);
  if (!context) {
    throw new AuthError({ message: "Authenticated user required", code: "UNAUTHENTICATED", status: 401 });
  }
  return context;
}

module.exports = { getCurrentUser, requireUser };
