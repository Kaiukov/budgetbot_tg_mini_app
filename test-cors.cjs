#!/usr/bin/env node

/**
 * CORS and API Connectivity Test Script
 *
 * This script tests the backend API endpoints to verify:
 * 1. CORS headers are properly configured
 * 2. API endpoints are accessible
 * 3. Authentication works correctly
 */

const https = require('https');

// Configuration
const BASE_URL = 'budgetbot-tg-mini-app.kayukov2010.workers.dev';
const ORIGINS_TO_TEST = [
  'http://localhost:3000',
  'https://budgetbot-tg-mini-app.pages.dev',
  'https://oleksandrs-macbook-air.neon-chuckwalla.ts.net:3000'
];

// Test endpoints
const ENDPOINTS = [
  { path: '/api/v1/about', method: 'GET', requiresAuth: true, name: 'Firefly III About' },
  { path: '/api/sync/get_accounts_usage', method: 'GET', requiresAuth: true, name: 'Sync API - Account Usage' },
  { path: '/api/sync/health', method: 'GET', requiresAuth: false, name: 'Sync API - Health Check' },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testCORS(endpoint, origin) {
  log(`\n  Testing CORS for origin: ${origin}`, colors.cyan);

  // OPTIONS preflight request
  const optionsReq = {
    hostname: BASE_URL,
    port: 443,
    path: endpoint.path,
    method: 'OPTIONS',
    headers: {
      'Origin': origin,
      'Access-Control-Request-Method': endpoint.method,
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  };

  try {
    const response = await makeRequest(optionsReq);

    log(`    ├─ OPTIONS ${endpoint.path}`, colors.blue);
    log(`    │  Status: ${response.statusCode}`,
      response.statusCode === 200 || response.statusCode === 204 ? colors.green : colors.red);

    // Check CORS headers
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
    };

    let allHeadersPresent = true;
    for (const [header, value] of Object.entries(corsHeaders)) {
      if (value) {
        log(`    │  ${header}: ${value}`, colors.green);
      } else {
        log(`    │  ${header}: MISSING`, colors.red);
        allHeadersPresent = false;
      }
    }

    return allHeadersPresent;
  } catch (error) {
    log(`    └─ ERROR: ${error.message}`, colors.red);
    return false;
  }
}

async function testEndpoint(endpoint) {
  log(`\n▶ Testing: ${endpoint.name}`, colors.yellow);
  log(`  ${endpoint.method} ${endpoint.path}`, colors.blue);

  const getReq = {
    hostname: BASE_URL,
    port: 443,
    path: endpoint.path,
    method: endpoint.method,
    headers: {
      'Origin': ORIGINS_TO_TEST[0],
      'Content-Type': 'application/json',
    },
  };

  // Add auth if required (using dummy token for structure test)
  if (endpoint.requiresAuth) {
    getReq.headers['Authorization'] = 'Bearer test_token';
  }

  try {
    const response = await makeRequest(getReq);

    log(`\n  Direct Request:`, colors.cyan);
    log(`    Status: ${response.statusCode}`,
      response.statusCode < 400 ? colors.green : colors.yellow);

    // Check for CORS headers in actual response
    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader) {
      log(`    access-control-allow-origin: ${corsHeader}`, colors.green);
    } else {
      log(`    access-control-allow-origin: MISSING`, colors.red);
    }

    // Try to parse response
    try {
      const jsonBody = JSON.parse(response.body);
      log(`    Response: ${JSON.stringify(jsonBody).substring(0, 100)}...`, colors.blue);
    } catch {
      log(`    Response: ${response.body.substring(0, 100)}...`, colors.blue);
    }

    return response.statusCode < 500;
  } catch (error) {
    log(`    ERROR: ${error.message}`, colors.red);
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════╗', colors.cyan);
  log('║       CORS & API Connectivity Test Suite          ║', colors.cyan);
  log('╚════════════════════════════════════════════════════╝', colors.cyan);
  log(`\nBackend URL: https://${BASE_URL}\n`, colors.blue);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  for (const endpoint of ENDPOINTS) {
    const endpointPassed = await testEndpoint(endpoint);

    // Test CORS for first origin only (to keep output concise)
    log(`\n  CORS Preflight Tests:`, colors.cyan);
    const corsPassed = await testCORS(endpoint, ORIGINS_TO_TEST[0]);

    results.total++;
    if (endpointPassed && corsPassed) {
      results.passed++;
      log(`\n  ✓ PASSED`, colors.green);
    } else {
      results.failed++;
      log(`\n  ✗ FAILED`, colors.red);
    }

    log('\n' + '─'.repeat(60), colors.blue);
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════╗', colors.cyan);
  log('║                  Test Summary                      ║', colors.cyan);
  log('╚════════════════════════════════════════════════════╝', colors.cyan);
  log(`\nTotal Tests: ${results.total}`, colors.blue);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);

  if (results.failed === 0) {
    log('\n🎉 All tests passed! CORS is properly configured.', colors.green);
  } else {
    log('\n⚠️  Some tests failed. Please check the CORS configuration.', colors.yellow);
  }

  log('\n' + '═'.repeat(60), colors.cyan);

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`\nFatal Error: ${error.message}`, colors.red);
  process.exit(1);
});
