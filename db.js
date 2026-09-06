const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize tables for persistent storage
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    shortCode TEXT UNIQUE,
    originalUrl TEXT,
    clicks INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS telemetry_logs (
    id TEXT PRIMARY KEY,
    shortCode TEXT,
    timestamp TEXT,
    referrer TEXT,
    userAgent TEXT,
    ipAddress TEXT
  )`);

  // Insert default demo record if table is empty
  db.get(`SELECT COUNT(*) as count FROM links`, (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO links (id, shortCode, originalUrl, clicks) VALUES (?, ?, ?, ?)`,
        ['1', 'demo-link', 'https://example.com', 124]);
    }
  });
});

module.exports = db;