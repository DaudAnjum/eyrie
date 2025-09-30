// src/lib/db.ts
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "admins.db");

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Open database
const db = new Database(dbPath);

// Create admins table if not exists
db.prepare(
  `CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run();

// Helper to insert admin if not exists
function seedAdmin(username: string, plainPassword: string) {
  const existing = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);
  if (!existing) {
    const hash = bcrypt.hashSync(plainPassword, 10);
    db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hash);
  }
}

// Seed your two admins
seedAdmin("admin1", "Impetus@123");
seedAdmin("admin2", "Eyrie*987");

export default db;
