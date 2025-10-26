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
 * - FIREFLY_TOKEN: Firefly III API token (optional, for server-side auth)
 * - SYNC_API_KEY: Sync API key (optional, for server-side auth)
 */

interface Env {
  BACKEND_URL: string;
  FIREFLY_TOKEN?: string;
  SYNC_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
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
      return new Response(
        JSON.stringify({
          error: 'Backend URL not configured',
          message: 'Please set BACKEND_URL in Cloudflare Pages environment variables',
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
    const targetUrl = `${backendUrl}${url.pathname}${url.search}`;

    console.log('🔄 Proxying request:', {
      from: url.pathname,
      to: targetUrl,
      method: request.method,
    });

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
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
      if (url.pathname.startsWith('/api/v1/') && env.FIREFLY_TOKEN) {
        headers.set('Authorization', `Bearer ${env.FIREFLY_TOKEN}`);
      } else if (url.pathname.startsWith('/api/sync/') && env.SYNC_API_KEY) {
        headers.set('Authorization', `Bearer ${env.SYNC_API_KEY}`);
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
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
    });

    return proxyResponse;
  } catch (error) {
    console.error('❌ Proxy error:', error);

    return new Response(
      JSON.stringify({
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check Cloudflare Pages Functions logs for more information',
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
