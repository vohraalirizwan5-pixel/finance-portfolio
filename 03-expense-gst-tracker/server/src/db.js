// SQLite database using Node's built-in driver, so no database server to install.
import { DatabaseSync } from 'node:sqlite';

export function openDb(file = process.env.DB_FILE || 'data.db') {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date         TEXT NOT NULL,            -- YYYY-MM-DD
      vendor       TEXT NOT NULL,
      category     TEXT NOT NULL,
      description  TEXT NOT NULL DEFAULT '',
      taxable      REAL NOT NULL,            -- amount before GST
      gst_rate     REAL NOT NULL,            -- 0, 5, 18, 40
      gst_amount   REAL NOT NULL,
      total        REAL NOT NULL,
      payment_mode TEXT NOT NULL DEFAULT 'UPI',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
  `);
  return db;
}
