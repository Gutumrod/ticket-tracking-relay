// Manual JS port of modules-hub/modules/auth v0.1.0 core/error.ts (canonical TS source).
class AuthError extends Error {
  constructor({ message, code, status, cause }) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status ?? (code === "UNAUTHENTICATED" || code === "INVALID_SESSION" ? 401 : 403);
    this.cause = cause;
  }
}

module.exports = { AuthError };
