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
      importance_score REAL DEFAULT 0.5,
      last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      access_count INTEGER DEFAULT 0,
      decay_rate REAL DEFAULT 0.01,
      embedding BLOB,
      embedding_model TEXT,
      embedding_updated_at DATETIME,
      cluster_id INTEGER,
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

  // Add embedding columns to existing memories table if they don't exist
  const alterMemoriesSql = `
    ALTER TABLE memories ADD COLUMN embedding BLOB;
    ALTER TABLE memories ADD COLUMN embedding_model TEXT;
    ALTER TABLE memories ADD COLUMN embedding_updated_at DATETIME;
    ALTER TABLE memories ADD COLUMN cluster_id INTEGER;
  `;

  db.run(alterMemoriesSql, (err) => {
    if (err) {
      // Columns might already exist, which is fine
      if (!err.message.includes('duplicate column name')) {
        console.error('[DB] Error altering memories table:', err.message);
      }
    } else {
      console.log('[DB] Memories table altered with semantic columns.');
    }
  });

  // Create indexes for semantic features
  const semanticIndexesSql = `
    CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories(embedding);
    CREATE INDEX IF NOT EXISTS idx_memories_cluster ON memories(cluster_id);
    CREATE INDEX IF NOT EXISTS idx_memories_model ON memories(embedding_model);
  `;

  db.run(semanticIndexesSql, (err) => {
    if (err) {
      console.error('[DB] Error creating semantic indexes:', err.message);
    }
  });

  const memoryClustersSql = `
    CREATE TABLE IF NOT EXISTS memory_clusters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  db.run(memoryClustersSql, (err) => {
    if (err) {
      console.error('[DB] Error creating memory_clusters table:', err.message);
    } else {
      console.log('[DB] Memory clusters table ready.');
    }
  });

  const memoryRelationshipsSql = `
    CREATE TABLE IF NOT EXISTS memory_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      source_memory_id INTEGER NOT NULL,
      target_memory_id INTEGER NOT NULL,
      relationship_type TEXT NOT NULL,
      strength REAL DEFAULT 0.5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (source_memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (target_memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      UNIQUE(user_id, source_memory_id, target_memory_id)
    )
  `;

  db.run(memoryRelationshipsSql, (err) => {
    if (err) {
      console.error('[DB] Error creating memory_relationships table:', err.message);
    } else {
      console.log('[DB] Memory relationships table ready.');
    }
  });

  const relationshipsIndexSql = `
    CREATE INDEX IF NOT EXISTS idx_memory_relationships_user_id ON memory_relationships(user_id);
    CREATE INDEX IF NOT EXISTS idx_memory_relationships_source ON memory_relationships(source_memory_id);
    CREATE INDEX IF NOT EXISTS idx_memory_relationships_target ON memory_relationships(target_memory_id);
  `;

  db.run(relationshipsIndexSql, (err) => {
    if (err) {
      console.error('[DB] Error creating relationships indexes:', err.message);
    }
  });

  // Knowledge Graph Foundation - Phase 4.5A
  const knowledgeEdgesSql = `
    CREATE TABLE IF NOT EXISTS knowledge_edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_memory_id INTEGER NOT NULL,
      target_memory_id INTEGER NOT NULL,
      relation_type TEXT NOT NULL,
      confidence REAL DEFAULT 0.5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (target_memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      UNIQUE(source_memory_id, target_memory_id, relation_type)
    )
  `;

  db.run(knowledgeEdgesSql, (err) => {
    if (err) {
      console.error('[DB] Error creating knowledge_edges table:', err.message);
    } else {
      console.log('[DB] Knowledge edges table ready.');

      // Create indexes after table is created
      const knowledgeEdgesIndexSql = `
        CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_edges(source_memory_id);
        CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_edges(target_memory_id);
        CREATE INDEX IF NOT EXISTS idx_knowledge_edges_relation_type ON knowledge_edges(relation_type);
      `;

      db.run(knowledgeEdgesIndexSql, (err) => {
        if (err) {
          console.error('[DB] Error creating knowledge_edges indexes:', err.message);
        }
      });
    }
  });

  db.run(memoriesIndexSql, (err) => {
    if (err) {
      console.error('[DB] Error creating memories index:', err.message);
    }
  });
}

module.exports = db;
