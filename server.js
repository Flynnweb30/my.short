const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint to retrieve all links from the persistent SQLite database
app.get('/api/links', (req, res) => {
  db.all(`SELECT * FROM links`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint to handle real visitor click telemetry and update persistent storage
app.post('/api/track/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const { timestamp, referrer, userAgent } = req.body;

  db.get(`SELECT * FROM links WHERE shortCode = ?`, [shortCode], (err, link) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!link) {
      return res.status(404).json({ error: 'Short link not found.' });
    }

    const newClicks = link.clicks + 1;

    db.run(`UPDATE links SET clicks = ? WHERE shortCode = ?`, [newClicks, shortCode], function(updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }

      const logId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const logTimestamp = timestamp || new Date().toISOString();
      const logReferrer = referrer || 'direct';
      const logUserAgent = userAgent || 'unknown';

      db.run(
        `INSERT INTO telemetry_logs (id, shortCode, timestamp, referrer, userAgent, ipAddress) VALUES (?, ?, ?, ?, ?, ?)`,
        [logId, shortCode, logTimestamp, logReferrer, logUserAgent, ipAddress],
        (logErr) => {
          if (logErr) {
            console.error('Failed to save telemetry log:', logErr.message);
          }
        }
      );

      console.log(`[Persistent Telemetry] Code: /${shortCode} | Total Clicks: ${newClicks}`);

      res.json({
        success: true,
        clicks: newClicks,
        message: 'Visitor telemetry successfully recorded in persistent database.'
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Telemetry tracking server with persistent database is active on port ${PORT}`);
});