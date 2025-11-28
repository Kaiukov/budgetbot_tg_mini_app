/**
 * Telegram Mini App - Validation Utilities
 * Server-side validation for initData
 */

const crypto = require('crypto');

/**
 * Validate Telegram Mini App initData signature
 * @param {string} initData - Raw initData query string
 * @param {string} botToken - Telegram bot token
 * @returns {boolean} - True if valid, false otherwise
 */
function validateInitData(initData, botToken) {
  try {
    // Parse query string
    const params = new URLSearchParams(initData);
    
    // Extract hash
    const hash = params.get('hash');
    if (!hash) return false;
    
    // Remove hash from params
    params.delete('hash');
    
    // Sort parameters alphabetically
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Create signature
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Compare hashes
    return calculatedHash === hash;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

/**
 * Extract and parse user data from initData
 * @param {string} initData - Raw initData query string
 * @returns {object|null} - Parsed user object or null
 */
function extractUserData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    
    if (!userJson) return null;
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error extracting user data:', error);
    return null;
  }
}

/**
 * Check if initData is fresh (not too old)
 * @param {number} authDate - Unix timestamp from initData.auth_date
 * @param {number} maxAgeSeconds - Maximum age in seconds (default: 24 hours)
 * @returns {boolean} - True if data is fresh, false if expired
 */
function isDataFresh(authDate, maxAgeSeconds = 86400) {
  if (!authDate) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const age = currentTime - authDate;
  
  return age <= maxAgeSeconds;
}

/**
 * Parse initData and extract all fields
 * @param {string} initData - Raw initData query string
 * @returns {object} - Parsed initData object
 */
function parseInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const data = {};
    
    for (const [key, value] of params) {
      if (key === 'user' || key === 'chat') {
        data[key] = JSON.parse(value);
      } else if (key === 'auth_date') {
        data[key] = parseInt(value);
      } else {
        data[key] = value;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing initData:', error);
    return null;
  }
}

/**
 * Complete initData validation with all checks
 * @param {string} initData - Raw initData query string
 * @param {string} botToken - Telegram bot token
 * @param {number} maxAgeSeconds - Maximum age in seconds
 * @returns {object} - { valid: boolean, user: object|null, error: string|null }
 */
function validateAndExtract(initData, botToken, maxAgeSeconds = 86400) {
  // Check if initData exists
  if (!initData) {
    return { valid: false, user: null, error: 'No initData provided' };
  }
  
  // Validate signature
  if (!validateInitData(initData, botToken)) {
    return { valid: false, user: null, error: 'Invalid signature' };
  }
  
  // Parse data
  const parsedData = parseInitData(initData);
  if (!parsedData) {
    return { valid: false, user: null, error: 'Failed to parse initData' };
  }
  
  // Check freshness
  if (!isDataFresh(parsedData.auth_date, maxAgeSeconds)) {
    return { valid: false, user: null, error: 'Data expired' };
  }
  
  // Check user exists
  if (!parsedData.user) {
    return { valid: false, user: null, error: 'No user data' };
  }
  
  return { 
    valid: true, 
    user: parsedData.user, 
    data: parsedData,
    error: null 
  };
}

/**
 * Express.js middleware for Telegram Mini App authentication
 */
function telegramAuthMiddleware(botToken, maxAgeSeconds = 86400) {
  return (req, res, next) => {
    const initData = req.headers['x-telegram-init-data'];
    
    const validation = validateAndExtract(initData, botToken, maxAgeSeconds);
    
    if (!validation.valid) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: validation.error 
      });
    }
    
    // Attach user to request
    req.user = validation.user;
    req.initData = validation.data;
    
    next();
  };
}

// Export functions
module.exports = {
  validateInitData,
  extractUserData,
  isDataFresh,
  parseInitData,
  validateAndExtract,
  telegramAuthMiddleware
};

// Usage example:
/*
const express = require('express');
const { telegramAuthMiddleware } = require('./validation-utils');

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;

// Apply middleware to protected routes
app.use('/api/protected', telegramAuthMiddleware(BOT_TOKEN));

app.get('/api/protected/user', (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000);
*/
