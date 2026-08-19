const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "..", "users.json");
const SCRYPT_KEYLEN = 64;

function ensureUsersFile() {
  if (fs.existsSync(DATA_FILE)) return;

  const username = process.env.HANDLER_USERNAME || "handler";
  const password = process.env.HANDLER_PASSWORD || crypto.randomBytes(12).toString("base64url");
  const { hash, salt } = hashPassword(password);

  writeUsers([{ id: "USR-1", username, passwordHash: hash, passwordSalt: salt, roles: ["handler"] }]);

  if (!process.env.HANDLER_PASSWORD) {
    console.log(`Generated handler password (save this, it won't be shown again): ${password}`);
  }
}

function readUsers() {
  ensureUsersFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read users.json", error);
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const actual = Buffer.from(hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function findUserByUsername(username) {
  return readUsers().find((user) => user.username === username);
}

module.exports = { ensureUsersFile, findUserByUsername, verifyPassword };
