import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';
let dbInstance;
let clientInstance;
let initialized;
export function db() {
  if (!dbInstance) {
    const url = process.env.TURSO_DATABASE_URL || 'file:./local.db';
    if (process.env.VERCEL && url.startsWith('file:')) throw new Error('TURSO_DATABASE_URL must be remote in Vercel');
    clientInstance = createClient({url, ...(process.env.TURSO_AUTH_TOKEN ? {authToken:process.env.TURSO_AUTH_TOKEN} : {})});
    dbInstance = drizzle(clientInstance, {schema});
  }
  return dbInstance;
}
export async function initializeDatabase() {
  if (!initialized) initialized = (async () => {
    db();
    // CREATE IF NOT EXISTS runs on startup, so fresh Turso databases work without CLI migrations.
    await clientInstance.executeMultiple(`
      CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT '');
      CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS likes (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS likes_unique ON likes(user_id, post_id);
      CREATE INDEX IF NOT EXISTS posts_user_idx ON posts(user_id);
      CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id);
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);
    `);
  })().catch(e=>{ initialized=null; throw e; });
  return initialized;
}
