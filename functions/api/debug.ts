/**
 * Debug endpoint to verify Cloudflare Pages Functions are working
 * and environment variables are configured correctly
 */

interface Env {
  BACKEND_URL?: string;
  FIREFLY_TOKEN?: string;
  SYNC_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Cloudflare Pages Functions are working',
      timestamp: new Date().toISOString(),
      environment: {
        BACKEND_URL: env.BACKEND_URL || 'NOT SET',
        FIREFLY_TOKEN: env.FIREFLY_TOKEN ? '✓ Configured' : '✗ Not set',
        SYNC_API_KEY: env.SYNC_API_KEY ? '✓ Configured' : '✗ Not set',
      },
      request: {
        url: url.href,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      },
      note: 'If BACKEND_URL is NOT SET, the proxy middleware will not work. Please configure it in Cloudflare Pages dashboard.',
    }, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
