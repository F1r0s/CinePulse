const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel Analytics stub to prevent 404s
app.get('/_vercel/insights/script.js', (req, res) => {
  res.type('application/javascript').send('/* vercel analytics stub */');
});

// API routes
const checkHandler = require('./api/check.js');
const offersHandler = require('./api/offers.js');
const postbackHandler = require('./api/postback.js');

app.all('/api/check', async (req, res) => {
  try {
    await checkHandler(req, res);
  } catch (err) {
    console.error('Error in /api/check:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/offers', async (req, res) => {
  try {
    await offersHandler(req, res);
  } catch (err) {
    console.error('Error in /api/offers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/postback', async (req, res) => {
  try {
    await postbackHandler(req, res);
  } catch (err) {
    console.error('Error in /api/postback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static assets with html extension support (clean URLs like /movies -> movies.html)
app.use(express.static(__dirname, { extensions: ['html'] }));

// Catch-all route for clean URLs fallback or client-side routing
app.get(/.*/, (req, res) => {
  const cleanPath = req.path.replace(/^\/+/, '');
  const htmlCandidate = path.join(__dirname, `${cleanPath}.html`);
  if (cleanPath && fs.existsSync(htmlCandidate)) {
    return res.sendFile(htmlCandidate);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Cine4Life server running at http://${HOST}:${PORT}`);
});
