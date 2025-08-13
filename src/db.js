import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.join(process.cwd(), 'db', 'soulmatesketch.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  tier TEXT NOT NULL,
  addons TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent TEXT,
  photo_path TEXT,
  quiz_answers TEXT DEFAULT '{}',
  result_image_path TEXT,
  result_pdf_path TEXT,
  share_token TEXT
);
`);

export function getDb() { return db; }
