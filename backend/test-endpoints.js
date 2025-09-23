#!/usr/bin/env node

/**
 * Simple endpoint tester for the Autonomous Agent Backend
 * Run with: node test-endpoints.js
 *
 * Requires the backend server to be running on http://localhost:8081
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:8081';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      data = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(data);
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Autonomous Agent Backend Endpoints\\n');

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      path: '/health'
    },
    {
      name: 'Get Configuration',
      method: 'GET',
      path: '/api/config'
    },
    {
      name: 'Get Core Script',
      method: 'GET',
      path: '/api/script'
    },
    {
      name: 'Get Agent Status',
      method: 'GET',
      path: '/api/agent/status'
    },
    {
      name: 'Get Tools',
      method: 'GET',
      path: '/api/tools'
    },
    {
      name: 'Get Memories',
      method: 'GET',
      path: '/api/memory'
    },
    {
      name: 'Get Agent Runs',
      method: 'GET',
      path: '/api/agent/runs'
    },
    {
      name: 'Get Agent Stats',
      method: 'GET',
      path: '/api/agent/stats'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const result = await makeRequest(test.method, test.path, test.data);

      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ ${test.name} - Status: ${result.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Status: ${result.status}`);
        console.log(`   Error: ${JSON.stringify(result.data, null, 2)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Connection Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\\n🎉 All endpoints are working correctly!');
  } else {
    console.log(`\\n⚠️  ${failed} endpoint(s) need attention.`);
    console.log('\\nMake sure:');
    console.log('1. Backend server is running: npm run dev');
    console.log('2. Database is set up: npm run db:setup');
    console.log('3. Environment variables are configured (.env file)');
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { makeRequest };