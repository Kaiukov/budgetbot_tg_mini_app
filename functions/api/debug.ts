/**
 * Debug endpoint to verify Cloudflare Pages Functions are working
 * and environment variables are configured correctly
 */

interface Env {
  BACKEND_URL?: string;
  FIREFLY_TOKEN?: string;
  SYNC_API_KEY?: string;
}

interface BackendTestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  error?: string;
  responseTime?: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);

  // Test backend connectivity
  const backendTests: Record<string, BackendTestResult> = {};

  if (env.BACKEND_URL) {
    // Test 1: Basic connectivity to backend
    try {
      const startTime = Date.now();
      const testResponse = await fetch(env.BACKEND_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      const responseTime = Date.now() - startTime;

      backendTests.basicConnectivity = {
        success: testResponse.ok,
        status: testResponse.status,
        statusText: testResponse.statusText,
        responseTime,
        headers: Object.fromEntries(testResponse.headers.entries()),
      };
    } catch (error) {
      backendTests.basicConnectivity = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 2: Firefly API endpoint
    if (env.FIREFLY_TOKEN) {
      try {
        const startTime = Date.now();
        const fireflyResponse = await fetch(`${env.BACKEND_URL}/api/v1/about`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${env.FIREFLY_TOKEN}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
        const responseTime = Date.now() - startTime;

        let responseData;
        try {
          responseData = await fireflyResponse.json();
        } catch {
          responseData = 'Could not parse JSON response';
        }

        backendTests.fireflyAPI = {
          success: fireflyResponse.ok,
          status: fireflyResponse.status,
          statusText: fireflyResponse.statusText,
          responseTime,
          headers: Object.fromEntries(fireflyResponse.headers.entries()),
        };

        if (fireflyResponse.ok && typeof responseData === 'object') {
          backendTests.fireflyAPI = {
            ...backendTests.fireflyAPI,
            // @ts-ignore - we know this is the Firefly response
            version: responseData.data?.version,
          };
        }
      } catch (error) {
        backendTests.fireflyAPI = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Test 3: Sync API endpoint
    if (env.SYNC_API_KEY) {
      try {
        const startTime = Date.now();
        const syncResponse = await fetch(`${env.BACKEND_URL}/api/sync/get_accounts_usage`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${env.SYNC_API_KEY}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
        const responseTime = Date.now() - startTime;

        backendTests.syncAPI = {
          success: syncResponse.ok,
          status: syncResponse.status,
          statusText: syncResponse.statusText,
          responseTime,
          headers: Object.fromEntries(syncResponse.headers.entries()),
        };
      } catch (error) {
        backendTests.syncAPI = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }

  // Build comprehensive debug response
  const debugInfo = {
    success: true,
    message: 'Cloudflare Pages Functions are working',
    timestamp: new Date().toISOString(),

    environment: {
      BACKEND_URL: env.BACKEND_URL || 'NOT SET ⚠️',
      FIREFLY_TOKEN: env.FIREFLY_TOKEN ? '✓ Configured' : '✗ Not set',
      SYNC_API_KEY: env.SYNC_API_KEY ? '✓ Configured' : '✗ Not set',
    },

    backendTests: Object.keys(backendTests).length > 0 ? backendTests : {
      note: 'No backend tests run - BACKEND_URL not configured',
    },

    request: {
      url: url.href,
      method: request.method,
      origin: request.headers.get('origin') || 'No origin header',
      userAgent: request.headers.get('user-agent') || 'No user agent',
      referer: request.headers.get('referer') || 'No referer',
      cfRay: request.headers.get('cf-ray') || 'Not available',
      cfConnectingIP: request.headers.get('cf-connecting-ip') || 'Not available',
      allHeaders: Object.fromEntries(request.headers.entries()),
    },

    diagnostics: {
      configurationStatus: !env.BACKEND_URL
        ? '❌ CRITICAL: BACKEND_URL not set. The middleware proxy will not work!'
        : '✓ Configuration looks good',

      recommendations: [
        !env.BACKEND_URL && 'Set BACKEND_URL in Cloudflare Pages environment variables',
        !env.FIREFLY_TOKEN && 'Consider setting FIREFLY_TOKEN for server-side auth',
        !env.SYNC_API_KEY && 'Consider setting SYNC_API_KEY for server-side auth',
      ].filter(Boolean),

      nextSteps: env.BACKEND_URL
        ? [
            'Test the middleware by making a request to /api/v1/about',
            'Check browser DevTools Network tab for CORS headers',
            'View Cloudflare Pages Functions logs for detailed errors',
          ]
        : [
            'Go to Cloudflare Pages dashboard',
            'Navigate to Settings → Environment variables',
            'Add BACKEND_URL with value: https://dev.neon-chuckwalla.ts.net',
            'Redeploy the application',
          ],
    },
  };

  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
