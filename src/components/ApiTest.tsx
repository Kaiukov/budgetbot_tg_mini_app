import React, { useState } from 'react';
import { fireflyAPI } from '../services/firefly';
import { syncAPI } from '../services/sync';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  statusCode?: number;
  message?: string;
  corsHeaders?: Record<string, string>;
  duration?: number;
}

export const ApiTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const tests = [
    {
      name: 'Firefly III - About',
      endpoint: '/api/v1/about',
      test: async () => {
        const response = await fetch('/api/v1/about', {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_FIREFLY_TOKEN || 'test'}`,
          },
        });
        return response;
      },
    },
    {
      name: 'Sync API - Health',
      endpoint: '/api/sync/health',
      test: async () => {
        const response = await fetch('/api/sync/health');
        return response;
      },
    },
    {
      name: 'Sync API - Account Usage',
      endpoint: '/api/sync/get_accounts_usage',
      test: async () => {
        const response = await fetch('/api/sync/get_accounts_usage', {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SYNC_API_KEY || 'test'}`,
          },
        });
        return response;
      },
    },
  ];

  const runTests = async () => {
    setTesting(true);
    const newResults: TestResult[] = [];

    for (const test of tests) {
      const result: TestResult = {
        name: test.name,
        endpoint: test.endpoint,
        status: 'pending',
      };

      try {
        const startTime = performance.now();
        const response = await test.test();
        const endTime = performance.now();

        result.duration = Math.round(endTime - startTime);
        result.statusCode = response.status;

        // Extract CORS headers
        const corsHeaders: Record<string, string> = {};
        const headerKeys = [
          'access-control-allow-origin',
          'access-control-allow-methods',
          'access-control-allow-headers',
          'access-control-allow-credentials',
        ];

        headerKeys.forEach((key) => {
          const value = response.headers.get(key);
          if (value) {
            corsHeaders[key] = value;
          }
        });

        result.corsHeaders = corsHeaders;

        if (response.ok) {
          result.status = 'success';
          const data = await response.json();
          result.message = `Success: ${JSON.stringify(data).substring(0, 100)}...`;
        } else {
          result.status = 'error';
          const text = await response.text();
          result.message = `HTTP ${response.status}: ${text.substring(0, 100)}`;
        }
      } catch (error) {
        result.status = 'error';
        result.message = error instanceof Error ? error.message : 'Unknown error';
      }

      newResults.push(result);
      setResults([...newResults]);
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>🧪 API & CORS Test Suite</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runTests}
          disabled={testing}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: testing ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
          }}
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              border: `2px solid ${getStatusColor(result.status)}`,
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>
                {getStatusIcon(result.status)}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{result.name}</h3>
                <code style={{ fontSize: '12px', color: '#666' }}>{result.endpoint}</code>
              </div>
            </div>

            {result.statusCode && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Status Code:</strong>{' '}
                <span
                  style={{
                    color: result.statusCode < 400 ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold',
                  }}
                >
                  {result.statusCode}
                </span>
                {result.duration && <span> ({result.duration}ms)</span>}
              </div>
            )}

            {result.message && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Response:</strong>{' '}
                <span style={{ fontSize: '12px', color: '#333' }}>{result.message}</span>
              </div>
            )}

            {result.corsHeaders && Object.keys(result.corsHeaders).length > 0 && (
              <div>
                <strong>CORS Headers:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
                  {Object.entries(result.corsHeaders).map(([key, value]) => (
                    <li key={key}>
                      <code>{key}</code>: <code style={{ color: '#4CAF50' }}>{value}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.status === 'error' && (!result.corsHeaders || Object.keys(result.corsHeaders).length === 0) && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                <strong style={{ color: '#F44336' }}>⚠️ CORS Headers Missing</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                  This might indicate a CORS configuration issue. Check your server settings.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Click "Run Tests" to verify API connectivity and CORS configuration
        </div>
      )}

      {results.length > 0 && !testing && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Summary</h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <strong>Total:</strong> {results.length}
            </div>
            <div style={{ color: '#4CAF50' }}>
              <strong>Passed:</strong> {results.filter((r) => r.status === 'success').length}
            </div>
            <div style={{ color: '#F44336' }}>
              <strong>Failed:</strong> {results.filter((r) => r.status === 'error').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
