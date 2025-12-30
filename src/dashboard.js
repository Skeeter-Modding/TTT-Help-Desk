const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

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

  try {
    const base64Credentials = authHeader.split(' ')[1];
    if (!base64Credentials) {
      res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
      return res.status(401).send('Invalid credentials');
    }

    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const colonIndex = credentials.indexOf(':');
    
    if (colonIndex === -1) {
      res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
      return res.status(401).send('Invalid credentials');
    }

    const username = credentials.slice(0, colonIndex);
    const password = credentials.slice(colonIndex + 1);

    // Use constant-time comparison to prevent timing attacks
    const expectedUsername = process.env.DASHBOARD_USERNAME;
    const expectedPassword = process.env.DASHBOARD_PASSWORD;

    const usernameMatch = username.length === expectedUsername.length &&
      crypto.timingSafeEqual(Buffer.from(username), Buffer.from(expectedUsername));
    const passwordMatch = password.length === expectedPassword.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));

    if (usernameMatch && passwordMatch) {
      return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
    return res.status(401).send('Invalid credentials');
  } catch (error) {
    res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
    return res.status(401).send('Invalid credentials');
  }
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
