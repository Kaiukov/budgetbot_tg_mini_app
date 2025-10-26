# CORS & API Testing Guide

This guide provides multiple methods to test that your CORS configuration is working correctly and the React app can access the backend APIs.

## Quick Test (Browser-Based)

### Method 1: Using the Test Page

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the test page in your browser:
   ```
   http://localhost:3000/test.html
   ```

3. Click "Run Tests" button

4. Check the results:
   - ✅ Green checkmarks = CORS is working correctly
   - ❌ Red X marks = CORS issues detected
   - Look for CORS headers in each test result

### Method 2: Browser Console Test

1. Start the dev server: `npm run dev`
2. Open your app: `http://localhost:3000`
3. Open browser DevTools (F12) and go to Console
4. Run this code:

```javascript
// Test Firefly API
fetch('/api/v1/about', {
  headers: {
    'Authorization': `Bearer ${window.VITE_FIREFLY_TOKEN || 'test'}`
  }
})
.then(res => {
  console.log('Status:', res.status);
  console.log('CORS Headers:', {
    'access-control-allow-origin': res.headers.get('access-control-allow-origin'),
    'access-control-allow-methods': res.headers.get('access-control-allow-methods'),
  });
  return res.json();
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err));

// Test Sync API
fetch('/api/sync/get_accounts_usage', {
  headers: {
    'Authorization': `Bearer ${window.VITE_SYNC_API_KEY || 'test'}`
  }
})
.then(res => {
  console.log('Status:', res.status);
  console.log('CORS Headers:', {
    'access-control-allow-origin': res.headers.get('access-control-allow-origin'),
  });
  return res.json();
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err));
```

## Advanced Testing

### Method 3: Network Tab Analysis

1. Start dev server and open app
2. Open DevTools → Network tab
3. Interact with the app (navigate to Accounts screen, etc.)
4. Look for API calls to `/api/v1/` and `/api/sync/`
5. Click on a request and check Response Headers for:
   - `access-control-allow-origin`
   - `access-control-allow-methods`
   - `access-control-allow-headers`
   - `access-control-allow-credentials`

### Method 4: Command Line (Direct Server Test)

Test the server directly (requires network access to your backend):

```bash
# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -v \
  https://budgetbot-tg-mini-app.kayukov2010.workers.dev/api/v1/about

# Test actual request
curl -X GET \
  -H "Origin: http://localhost:3000" \
  -H "Authorization: Bearer your_token_here" \
  -v \
  https://budgetbot-tg-mini-app.kayukov2010.workers.dev/api/v1/about
```

Look for these headers in the response:
```
< access-control-allow-origin: http://localhost:3000
< access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
< access-control-allow-headers: authorization, content-type
< access-control-allow-credentials: true
```

## What to Look For

### ✅ CORS is Working If:
- Status codes are 200-299 (not 401/403/500)
- Response headers include `access-control-allow-origin`
- No CORS errors in browser console
- API calls complete successfully
- Data is returned from the API

### ❌ CORS Issues If:
- Browser console shows errors like:
  - "CORS policy: No 'Access-Control-Allow-Origin' header"
  - "CORS policy: Response to preflight request doesn't pass"
- Network tab shows failed OPTIONS requests
- API calls fail with network errors
- Missing CORS headers in responses

## Common CORS Error Messages

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| No 'Access-Control-Allow-Origin' header | Server not sending CORS header | Add CORS headers to server response |
| Origin not allowed | Server rejecting your origin | Add your origin to allowed list |
| Preflight request failed | OPTIONS request not handled | Ensure server handles OPTIONS method |
| Credentials not allowed | Cookies/auth blocked by CORS | Set `credentials: 'include'` and server allows credentials |

## Environment-Specific Testing

### Development (Vite Proxy)
- The Vite dev server proxies requests to avoid CORS
- Test at: `http://localhost:3000`
- CORS headers may not be visible in dev mode
- Proxy config in: `vite.config.ts`

### Production (Cloudflare Pages)
- Cloudflare Functions middleware handles CORS
- Test at: `https://budgetbot-tg-mini-app.pages.dev`
- CORS headers should be visible
- Middleware in: `functions/_middleware.ts`

### Direct Backend Testing
- Test the backend server directly
- Requires proper CORS configuration on server
- URL: `https://budgetbot-tg-mini-app.kayukov2010.workers.dev`

## Test Files Created

- `/test.html` - Standalone test page
- `/src/components/ApiTest.tsx` - Test component
- `/src/TestPage.tsx` - Test page entry point
- `/test-cors.cjs` - Node.js test script (requires network access)

## Troubleshooting

### If tests fail in development:
1. Check `.env` file has correct tokens
2. Verify Vite dev server is running
3. Check `vite.config.ts` proxy configuration
4. Look for errors in terminal where dev server is running

### If tests fail in production:
1. Check Cloudflare Pages deployment is live
2. Verify `BACKEND_URL` environment variable is set in Cloudflare
3. Check `functions/_middleware.ts` CORS configuration
4. Look at Cloudflare Pages Functions logs

### If backend server issues:
1. Verify backend server is running and accessible
2. Check backend CORS configuration
3. Ensure allowed origins include your frontend URLs
4. Verify backend handles OPTIONS preflight requests

## Next Steps

After confirming CORS is working:
1. Test with real API tokens (not dummy tokens)
2. Test all critical API endpoints
3. Test in both development and production
4. Test error handling (invalid tokens, network errors)
5. Monitor for CORS issues in production logs
