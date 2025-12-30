const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic authentication middleware
const basicAuth = (req, res, next) => {
  // Skip authentication if credentials are not configured
  if (!process.env.DASHBOARD_USERNAME || !process.env.DASHBOARD_PASSWORD) {
    console.warn('WARNING: Dashboard is running without authentication. Set DASHBOARD_USERNAME and DASHBOARD_PASSWORD to enable authentication.');
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
    return res.status(401).send('Authentication required');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username === process.env.DASHBOARD_USERNAME && password === process.env.DASHBOARD_PASSWORD) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
  return res.status(401).send('Invalid credentials');
};

// Apply authentication to all routes
app.use(basicAuth);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.listen(PORT, () => {
  console.log(`TTT Help Desk dashboard running on http://localhost:${PORT}`);
});
