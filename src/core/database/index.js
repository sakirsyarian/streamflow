/**
 * Database Connection
 * Centralized database management
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'db', 'streamflow.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar_path TEXT,
      user_role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Videos table
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      duration REAL,
      resolution TEXT,
      thumbnail_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Migration: Add missing columns to videos table
  db.all("PRAGMA table_info(videos)", [], (err, columns) => {
    if (err) return;
    const columnNames = columns.map(c => c.name);
    
    if (!columnNames.includes('filename')) {
      db.run("ALTER TABLE videos ADD COLUMN filename TEXT DEFAULT ''", (err) => {
        if (!err) console.log('Migration: Added filename column to videos table');
      });
    }
    if (!columnNames.includes('file_size')) {
      db.run("ALTER TABLE videos ADD COLUMN file_size INTEGER", (err) => {
        if (!err) console.log('Migration: Added file_size column to videos table');
      });
    }
    if (!columnNames.includes('duration')) {
      db.run("ALTER TABLE videos ADD COLUMN duration REAL", (err) => {
        if (!err) console.log('Migration: Added duration column to videos table');
      });
    }
    if (!columnNames.includes('resolution')) {
      db.run("ALTER TABLE videos ADD COLUMN resolution TEXT", (err) => {
        if (!err) console.log('Migration: Added resolution column to videos table');
      });
    }
    if (!columnNames.includes('thumbnail_path')) {
      db.run("ALTER TABLE videos ADD COLUMN thumbnail_path TEXT", (err) => {
        if (!err) console.log('Migration: Added thumbnail_path column to videos table');
      });
    }
  });

  // Streams table
  db.run(`
    CREATE TABLE IF NOT EXISTS streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      video_id INTEGER,
      title TEXT NOT NULL,
      rtmp_url TEXT NOT NULL,
      stream_key TEXT NOT NULL,
      platform TEXT,
      status TEXT DEFAULT 'idle',
      loop_video INTEGER DEFAULT 1,
      scheduled_time DATETIME,
      duration_minutes INTEGER,
      bitrate INTEGER DEFAULT 2500,
      fps INTEGER DEFAULT 30,
      resolution TEXT DEFAULT '1280x720',
      orientation TEXT DEFAULT 'horizontal',
      pid INTEGER,
      started_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (video_id) REFERENCES videos(id)
    )
  `);

  // Playlists table
  db.run(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Playlist videos table
  db.run(`
    CREATE TABLE IF NOT EXISTS playlist_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL,
      video_id INTEGER NOT NULL,
      position INTEGER DEFAULT 0,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id),
      FOREIGN KEY (video_id) REFERENCES videos(id)
    )
  `);

  // Stream history table
  db.run(`
    CREATE TABLE IF NOT EXISTS stream_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stream_id INTEGER,
      video_id INTEGER,
      title TEXT,
      platform TEXT,
      status TEXT,
      start_time DATETIME,
      end_time DATETIME,
      duration_seconds INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

/**
 * Check if any users exist in database
 */
function checkIfUsersExist() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count > 0);
    });
  });
}

/**
 * Promisified db.run
 */
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Promisified db.get
 */
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Promisified db.all
 */
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  checkIfUsersExist
};
