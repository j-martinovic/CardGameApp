// users.js — user account storage for the game server.
// Uses Node's built-in SQLite driver (node:sqlite, Node 22.5+) so there are no
// native dependencies. Passwords are hashed with scrypt — never stored or
// returned in plain text.

import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(join(DATA_DIR, 'users.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name     TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    logged_in     INTEGER NOT NULL DEFAULT 0
  )
`);

// ── Password hashing ──────────────────────────────────────────────────────────

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

// ── Public API (shapes match what the frontend expects) ───────────────────────

// The JSON sent to the client. Deliberately excludes the password hash.
function toJson(row) {
  return {
    id: row.id,
    userName: row.user_name,
    email: row.email,
    loggedIn: Boolean(row.logged_in),
  };
}

export function createUser({ userName, password, email }) {
  const stmt = db.prepare(
    'INSERT INTO users (user_name, email, password_hash, logged_in) VALUES (?, ?, ?, 1)'
  );
  const { lastInsertRowid } = stmt.run(userName, email, hashPassword(password));
  return toJson(db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid));
}

export function login({ userName, password }) {
  const row = db.prepare('SELECT * FROM users WHERE user_name = ?').get(userName);
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  db.prepare('UPDATE users SET logged_in = 1 WHERE id = ?').run(row.id);
  return toJson({ ...row, logged_in: 1 });
}

export function logout(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row) return false;
  db.prepare('UPDATE users SET logged_in = 0 WHERE id = ?').run(row.id);
  return true;
}

// Used by the one-off Flask migration; harmless to keep.
export function upsertMigratedUser({ userName, email, passwordHash }) {
  db.prepare(
    `INSERT INTO users (user_name, email, password_hash, logged_in) VALUES (?, ?, ?, 0)
     ON CONFLICT(user_name) DO NOTHING`
  ).run(userName, email, passwordHash);
}
