/**
 * Cloudflare Pages Function - API Proxy Middleware with Cookie Bridging
 *
 * Intercepts /api/* requests and proxies them to the backend server.
 *
 * CRITICAL: Cookie Bridging for Cross-Origin Deployment
 * - Backend (ts.net) sets __Host-session cookie
 * - Frontend (workers.dev) cannot accept cookies from different origin
 * - Solution: middleware extracts session token and issues a new cookie for workers.dev
 *
 * Required Cloudflare Pages environment variables:
 *   BACKEND_URL  — full URL of the backend nginx entry point
 *                  e.g. https://dev-1.neon-chuckwalla.ts.net
 */

const API_PREFIX = '/api/';
const SESSION_COOKIE_NAME = '__Host-session';
const BRIDGED_COOKIE_NAME = 'session';
const SESSION_MAX_AGE = 1800; // 30 minutes (must match backend TELEGRAM_SESSION_TTL_SECONDS)

export function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only intercept /api/* paths
  if (!url.pathname.startsWith(API_PREFIX)) {
    return next();
  }

  const backendUrl = env.BACKEND_URL;
  if (!backendUrl) {
    console.error('[proxy] BACKEND_URL is not configured');
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'internal_error', message: 'Backend not configured' } }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const targetUrl = `${backendUrl.replace(/\/$/, '')}${url.pathname}${url.search}`;

  // Copy request headers
  const forwardedHeaders = new Headers();
  let bridgedSessionToken = null;

  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'connection' || lower === 'keep-alive') {
      continue;
    }
    // Extract bridged session token from our cookie
    if (lower === 'cookie') {
      const match = value.match(new RegExp(`${BRIDGED_COOKIE_NAME}=([^;]+)`));
      if (match) {
        bridgedSessionToken = match[1];
      }
      // Forward original cookie (backend may need other cookies)
      forwardedHeaders.set(key, value);
      continue;
    }
    forwardedHeaders.set(key, value);
  }

  // If we have a bridged session, forward it as the backend session cookie
  if (bridgedSessionToken) {
    const cookieHeader = forwardedHeaders.get('cookie') || '';
    forwardedHeaders.set(
      'cookie',
      `${cookieHeader}; ${SESSION_COOKIE_NAME}=${bridgedSessionToken}`.replace(/^; /, '')
    );
  }

  // Add forwarded headers
  const clientIp =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    '';
  if (clientIp) {
    forwardedHeaders.set('X-Forwarded-For', clientIp);
  }
  forwardedHeaders.set('X-Forwarded-Proto', 'https');

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  return fetch(targetUrl, {
    method,
    headers: forwardedHeaders,
    body: hasBody ? request.body : undefined,
  }).then(backendResponse => {
    // Copy response headers, but handle Set-Cookie specially
    const responseHeaders = new Headers();
    let sessionTokenExtracted = false;

    for (const [key, value] of backendResponse.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === 'set-cookie') {
        // Extract session token from backend's Set-Cookie
        // Format: __Host-session=<token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800
        const sessionMatch = value.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
        if (sessionMatch) {
          sessionTokenExtracted = true;
          // Issue a new cookie for the workers.dev domain
          responseHeaders.append(
            'Set-Cookie',
            `${BRIDGED_COOKIE_NAME}=${sessionMatch[1]}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
          );
        }
        // Skip original Set-Cookie (browser won't accept it from different origin)
        continue;
      }
      responseHeaders.append(key, value);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  }).catch(err => {
    console.error('[proxy] fetch to backend failed:', err);
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'internal_error', message: 'Backend unreachable' } }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  });
}
