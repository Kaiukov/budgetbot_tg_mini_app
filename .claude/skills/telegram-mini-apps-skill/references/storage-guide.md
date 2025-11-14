# Data Validation and Security Guide

## InitData Validation

InitData is a query string that contains user information and should be validated on the server.

### What is initData?

```javascript
const initData = tg.initData;
// Raw string like:
// "query_id=AAHdF6IQ...&user=%7B%22id%22%3A..."
// Use this for server validation
```

### What is initDataUnsafe?

```javascript
const initDataUnsafe = tg.initDataUnsafe;
// Parsed object for UI only, can be forged on client
// Example:
{
  user: {
    id: 123456,
    first_name: "John",
    username: "john_doe",
    is_premium: false
  },
  auth_date: 1234567890,
  hash: "abcdef123456"
}
```

## Server-Side Validation (Node.js)

### Step-by-Step Validation

```javascript
const crypto = require('crypto');

function validateInitData(initData, botToken) {
  // 1. Parse the query string
  const params = new URLSearchParams(initData);
  
  // 2. Extract hash
  const hash = params.get('hash');
  if (!hash) return false;
  
  // 3. Remove hash from params
  params.delete('hash');
  
  // 4. Sort remaining params alphabetically
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // 5. Create secret key from bot token
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  // 6. Create signature
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // 7. Compare hashes
  return calculatedHash === hash;
}

// Usage
const isValid = validateInitData(
  req.headers['x-telegram-init-data'],
  process.env.BOT_TOKEN
);

if (isValid) {
  // Proceed with authenticated request
} else {
  // Reject request
  res.status(401).send('Invalid data');
}
```

### Python Validation

```python
import hmac
import hashlib
from urllib.parse import parse_qs

def validate_init_data(init_data: str, bot_token: str) -> bool:
    # Parse query string
    params = parse_qs(init_data)
    
    # Extract hash
    hash_value = params.get('hash', [None])[0]
    if not hash_value:
        return False
    
    # Remove hash from params
    params_copy = {k: v[0] for k, v in params.items() if k != 'hash'}
    
    # Sort and create check string
    data_check_string = '\n'.join(
        f"{k}={v}" for k, v in sorted(params_copy.items())
    )
    
    # Create secret key
    secret_key = hmac.new(
        b'WebAppData',
        bot_token.encode(),
        hashlib.sha256
    ).digest()
    
    # Create signature
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Compare
    return calculated_hash == hash_value

# Usage
is_valid = validate_init_data(
    request.headers.get('X-Telegram-Init-Data'),
    os.getenv('BOT_TOKEN')
)
```

## Data Freshness Check

```javascript
function checkDataFreshness(authDate, maxAgeSeconds = 86400) {
  // maxAgeSeconds = 24 hours by default
  const currentTime = Math.floor(Date.now() / 1000);
  const age = currentTime - authDate;
  
  return age <= maxAgeSeconds;
}

// Usage
const initDataUnsafe = tg.initDataUnsafe;
if (!checkDataFreshness(initDataUnsafe.auth_date, 3600)) {
  console.warn('Data is older than 1 hour');
}
```

## Extracting User Data

```javascript
function extractUserData(initData) {
  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  
  if (!userJson) return null;
  
  return JSON.parse(decodeURIComponent(userJson));
}

// Usage
const userData = extractUserData(tg.initData);
console.log(userData.id, userData.first_name);
```

## Security Best Practices

### 1. Never Trust Client Data

```javascript
// ❌ WRONG - Trusting client data
if (tg.initDataUnsafe.user.is_premium) {
  grantPremiumFeatures();
}

// ✅ CORRECT - Validating on server
const response = await fetch('/api/check-premium', {
  headers: {
    'X-Telegram-Init-Data': tg.initData
  }
});
const { isPremium } = await response.json();
if (isPremium) {
  grantPremiumFeatures();
}
```

### 2. Validate on Server

```javascript
// Express.js middleware
app.use((req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  
  if (!initData || !validateInitData(initData, BOT_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userData = extractUserData(initData);
  req.user = userData;
  next();
});
```

### 3. Use HTTPS Only

```javascript
// Always verify connection is secure
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  console.error('Insecure connection detected');
  location.href = 'https:' + location.href.substring(location.protocol.length);
}
```

### 4. Store Sensitive Data Securely

```javascript
// ❌ WRONG - Storing in LocalStorage
localStorage.setItem('apiToken', token);

// ✅ CORRECT - Using SecureStorage
tg.SecureStorage.setItem('apiToken', token, (error) => {
  if (!error) {
    console.log('Token stored securely');
  }
});
```

### 5. Minimal Permissions

```javascript
// ❌ WRONG - Exposing all endpoints
app.get('/api/user/:id', (req, res) => {
  // Any user can fetch any user's data
  res.json(getUserData(req.params.id));
});

// ✅ CORRECT - Checking ownership
app.get('/api/user/:id', (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(getUserData(req.params.id));
});
```

## Common Security Pitfalls

### Pitfall 1: Using initDataUnsafe for Critical Decisions

```javascript
// ❌ WRONG
if (tg.initDataUnsafe.user.id === 123) {
  // User could fake this
}

// ✅ CORRECT
// Validate server-side
```

### Pitfall 2: Not Checking Data Freshness

```javascript
// ❌ WRONG
const user = tg.initDataUnsafe.user;  // Could be very old

// ✅ CORRECT
if (!checkDataFreshness(tg.initDataUnsafe.auth_date)) {
  console.error('Data is too old');
}
```

### Pitfall 3: Exposing Bot Token

```javascript
// ❌ NEVER DO THIS
const token = 'YOUR_BOT_TOKEN';  // In client-side code!

// ✅ CORRECT - Token only on server
```

### Pitfall 4: Not Using SecureStorage for Secrets

```javascript
// ❌ WRONG
localStorage.setItem('sessionToken', token);

// ✅ CORRECT
tg.SecureStorage.setItem('sessionToken', token);
```

## Recommended Security Headers

```javascript
// On your server, set security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

## Complete Example

```javascript
// Client
const response = await fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': tg.initData  // Send raw initData
  },
  body: JSON.stringify({ action: 'save', data: {...} })
});

// Server
app.post('/api/data', (req, res) => {
  const initData = req.headers['x-telegram-init-data'];
  
  // 1. Validate signature
  if (!validateInitData(initData, BOT_TOKEN)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Extract user data
  const user = extractUserData(initData);
  
  // 3. Check freshness
  if (!checkDataFreshness(user.auth_date)) {
    return res.status(401).json({ error: 'Data expired' });
  }
  
  // 4. Process request
  const result = processUserAction(user.id, req.body);
  res.json(result);
});
```
