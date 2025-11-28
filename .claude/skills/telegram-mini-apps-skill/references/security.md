# Data Validation and Security Guide

## Server-Side Validation (Node.js)

```javascript
const crypto = require('crypto');

function validateInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;
  
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}
```

## Security Best Practices

1. **Always validate initData on server**
   - Never trust initDataUnsafe for sensitive operations
   - Use initData string for server-side verification

2. **Use HTTPS only**
   - Encrypt all communication between client and server

3. **Check data freshness**
   ```javascript
   function isDataFresh(authDate, maxAgeSeconds = 86400) {
     const age = Math.floor(Date.now() / 1000) - authDate;
     return age <= maxAgeSeconds;
   }
   ```

4. **Store secrets securely**
   - Use SecureStorage for sensitive data
   - Never expose bot token in client code

5. **Minimize permissions**
   - Only expose necessary API endpoints
   - Validate user authorization for each request

## Express.js Middleware

```javascript
function validateTelegram(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  
  if (!initData || !validateInitData(initData, BOT_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = JSON.parse(
    new URLSearchParams(initData).get('user')
  );
  req.user = user;
  next();
}

app.use('/api', validateTelegram);
```

See scripts/validation-utils.js for complete implementation.
