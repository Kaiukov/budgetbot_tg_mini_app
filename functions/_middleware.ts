/**
 * Cloudflare Pages Function - API Proxy Middleware
 *
 * This middleware intercepts all /api/* requests and proxies them to the backend.
 * It solves corporate network restrictions and CORS issues by:
 * 1. Routing requests through Cloudflare's edge network
 * 2. Adding proper CORS headers
 * 3. Forwarding authentication headers securely
 *
 * Environment variables required in Cloudflare Pages:
 * - BACKEND_URL: The backend API URL (e.g., https://dev.neon-chuckwalla.ts.net)
 * - VITE_FIREFLY_TOKEN: Firefly III API token (optional, for server-side auth)
 * - VITE_SYNC_API_KEY: Sync API key (optional, for server-side auth)
 */

interface Env {
  BACKEND_URL: string;
  VITE_FIREFLY_TOKEN?: string;
  VITE_SYNC_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  console.log(`[Middleware] Request received for: ${context.request.url}. BACKEND_URL is: ${context.env.BACKEND_URL ? 'SET' : 'NOT SET'}`);
  const { request, env } = context;
  const url = new URL(request.url);

  // Only handle /api/* requests
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  try {
    // Get backend URL from environment
    const backendUrl = env.BACKEND_URL;
    if (!backendUrl) {
      console.error('❌ BACKEND_URL not configured!');
      return new Response(
        JSON.stringify({
          error: 'Backend URL not configured',
          message: 'Please set BACKEND_URL in Cloudflare Pages environment variables',
          path: url.pathname,
          timestamp: new Date().toISOString(),
          hint: 'Visit /api/debug to check configuration',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Construct target URL
    let path = url.pathname;
    if (path.startsWith('/api/sync/')) {
        path = path.substring('/api/sync'.length);
    }
    const targetUrl = `${backendUrl}${path}${url.search}`;

    console.log('🔄 Proxying request:', {
      timestamp: new Date().toISOString(),
      from: url.pathname,
      to: targetUrl,
      method: request.method,
      hasAuth: request.headers.has('Authorization'),
      origin: request.headers.get('origin') || 'none',
    });

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      console.log('✅ CORS preflight request handled:', {
        origin: request.headers.get('origin'),
        method: request.headers.get('access-control-request-method'),
        headers: request.headers.get('access-control-request-headers'),
      });
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Clone headers from original request
    const headers = new Headers(request.headers);

    // If client didn't provide auth header, use server-side tokens
    if (!headers.has('Authorization')) {
      if (url.pathname.startsWith('/api/v1/') && env.VITE_FIREFLY_TOKEN) {
        headers.set('Authorization', `Bearer ${env.VITE_FIREFLY_TOKEN}`);
      } else if (url.pathname.startsWith('/api/sync/') && env.VITE_SYNC_API_KEY) {
        headers.set('Authorization', `Bearer ${env.VITE_SYNC_API_KEY}`);
      }
    }

    // Forward the request to backend
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    const response = await fetch(proxyRequest);

    // Clone response and add CORS headers
    const proxyResponse = new Response(response.body, response);
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('✅ Proxy response:', {
      timestamp: new Date().toISOString(),
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      contentType: proxyResponse.headers.get('content-type'),
      hasBody: !!response.body,
    });

    return proxyResponse;
  } catch (error) {
    console.error('❌ Proxy error:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: url.pathname,
      backendUrl: env.BACKEND_URL,
    });

    return new Response(
      JSON.stringify({
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        path: url.pathname,
        timestamp: new Date().toISOString(),
        details: 'Check Cloudflare Pages Functions logs for more information',
        hint: 'Visit /api/debug to verify backend connectivity',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
