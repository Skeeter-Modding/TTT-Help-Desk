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
    const headerParts = authHeader.split(' ');
    if (headerParts.length !== 2 || !headerParts[1]) {
      res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
      return res.status(401).send('Invalid credentials');
    }

    const base64Credentials = headerParts[1];
    let credentials;
    
    try {
      credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    } catch (error) {
      res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
      return res.status(401).send('Invalid credentials');
    }

    const colonIndex = credentials.indexOf(':');
    
    if (colonIndex === -1) {
      res.setHeader('WWW-Authenticate', 'Basic realm="TTT Help Desk Dashboard"');
      return res.status(401).send('Invalid credentials');
    }

    const username = credentials.slice(0, colonIndex);
    const password = credentials.slice(colonIndex + 1);

    const expectedUsername = process.env.DASHBOARD_USERNAME;
    const expectedPassword = process.env.DASHBOARD_PASSWORD;

    // Pad strings to same length to prevent timing attacks from length comparison
    const maxUsernameLen = Math.max(username.length, expectedUsername.length);
    const maxPasswordLen = Math.max(password.length, expectedPassword.length);

    const paddedUsername = username.padEnd(maxUsernameLen, '\0');
    const paddedExpectedUsername = expectedUsername.padEnd(maxUsernameLen, '\0');
    const paddedPassword = password.padEnd(maxPasswordLen, '\0');
    const paddedExpectedPassword = expectedPassword.padEnd(maxPasswordLen, '\0');

    // Use constant-time comparison to prevent timing attacks
    const usernameMatch = crypto.timingSafeEqual(
      Buffer.from(paddedUsername),
      Buffer.from(paddedExpectedUsername)
    );
    const passwordMatch = crypto.timingSafeEqual(
      Buffer.from(paddedPassword),
      Buffer.from(paddedExpectedPassword)
    );

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

app.listen(PORT, () => {
  console.log(`TTT Help Desk dashboard running on http://localhost:${PORT}`);
});
