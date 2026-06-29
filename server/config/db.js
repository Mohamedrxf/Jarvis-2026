const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB] Error opening database:', err.message);
  } else {
    console.log('[DB] Connected to SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('[DB] Error creating users table:', err.message);
    } else {
      console.log('[DB] Users table ready.');
    }
  });

  const conversationsSql = `
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  db.run(conversationsSql, (err) => {
    if (err) {
      console.error('[DB] Error creating conversations table:', err.message);
    } else {
      console.log('[DB] Conversations table ready.');
    }
  });

  const messagesSql = `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `;

  db.run(messagesSql, (err) => {
    if (err) {
      console.error('[DB] Error creating messages table:', err.message);
    } else {
      console.log('[DB] Messages table ready.');
    }
  });

  const memoriesSql = `
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      source TEXT DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  db.run(memoriesSql, (err) => {
    if (err) {
      console.error('[DB] Error creating memories table:', err.message);
    } else {
      console.log('[DB] Memories table ready.');
    }
  });

  const memoryHistorySql = `
    CREATE TABLE IF NOT EXISTS memory_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_content TEXT,
      new_content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  db.run(memoryHistorySql, (err) => {
    if (err) {
      console.error('[DB] Error creating memory_history table:', err.message);
    } else {
      console.log('[DB] Memory history table ready.');
    }
  });

  const memoriesIndexSql = `
    CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id)
  `;

  db.run(memoriesIndexSql, (err) => {
    if (err) {
      console.error('[DB] Error creating memories index:', err.message);
    }
  });
}

module.exports = db;
