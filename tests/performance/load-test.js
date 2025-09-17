/**
 * K6 Load Testing Script for CloudIDE
 * Tests application performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'], // Error rate should be less than 5%
    error_rate: ['rate<0.05'],
    response_time: ['p(95)<2000'],
  },
};

// Base URL from environment variable
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'TestPass123!' },
  { email: 'test2@example.com', password: 'TestPass123!' },
  { email: 'test3@example.com', password: 'TestPass123!' },
];

export function setup() {
  // Setup code - run once before the test
  console.log(`Starting load test against: ${BASE_URL}`);

  // Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
  });

  return { baseUrl: BASE_URL };
}

export default function (data) {
  const testUser = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Test scenarios with different weights
  const scenarios = [
    { weight: 40, func: () => testHomePage(data.baseUrl) },
    { weight: 30, func: () => testAPIEndpoints(data.baseUrl) },
    { weight: 20, func: () => testFileOperations(data.baseUrl) },
    { weight: 10, func: () => testWebSocketConnection(data.baseUrl) },
  ];

  // Select scenario based on weight
  const random = Math.random() * 100;
  let cumulativeWeight = 0;

  for (const scenario of scenarios) {
    cumulativeWeight += scenario.weight;
    if (random <= cumulativeWeight) {
      scenario.func();
      break;
    }
  }

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

function testHomePage(baseUrl) {
  const startTime = Date.now();

  const response = http.get(`${baseUrl}/`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'K6 Load Test',
    },
  });

  const duration = Date.now() - startTime;
  responseTime.add(duration);
  requestCount.add(1);

  const isSuccess = check(response, {
    'home page status is 200': (r) => r.status === 200,
    'home page contains CloudIDE': (r) => r.body.includes('CloudIDE'),
    'response time < 3s': (r) => r.timings.duration < 3000,
  });

  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testAPIEndpoints(baseUrl) {
  const apiEndpoints = [
    '/api/status',
    '/api/health',
    '/health',
  ];

  for (const endpoint of apiEndpoints) {
    const startTime = Date.now();

    const response = http.get(`${baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'K6 Load Test',
      },
    });

    const duration = Date.now() - startTime;
    responseTime.add(duration);
    requestCount.add(1);

    const isSuccess = check(response, {
      [`${endpoint} status is 200 or 404`]: (r) => r.status === 200 || r.status === 404,
      [`${endpoint} response time < 2s`]: (r) => r.timings.duration < 2000,
    });

    if (!isSuccess) {
      errorRate.add(1);
    }

    sleep(0.5);
  }
}

function testFileOperations(baseUrl) {
  // Simulate file operations (these might not exist yet, but test the endpoints)
  const fileOperations = [
    { method: 'GET', url: '/api/files' },
    { method: 'GET', url: '/api/projects' },
    { method: 'POST', url: '/api/files', data: { name: 'test.txt', content: 'test content' } },
  ];

  for (const operation of fileOperations) {
    const startTime = Date.now();

    let response;
    if (operation.method === 'GET') {
      response = http.get(`${baseUrl}${operation.url}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'K6 Load Test',
        },
      });
    } else if (operation.method === 'POST') {
      response = http.post(`${baseUrl}${operation.url}`, JSON.stringify(operation.data), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'K6 Load Test',
        },
      });
    }

    const duration = Date.now() - startTime;
    responseTime.add(duration);
    requestCount.add(1);

    const isSuccess = check(response, {
      [`${operation.method} ${operation.url} response time < 3s`]: (r) => r.timings.duration < 3000,
      [`${operation.method} ${operation.url} not server error`]: (r) => r.status < 500,
    });

    if (!isSuccess) {
      errorRate.add(1);
    }

    sleep(1);
  }
}

function testWebSocketConnection(baseUrl) {
  // Test WebSocket endpoint availability
  const wsUrl = baseUrl.replace('http', 'ws') + '/ws';

  const startTime = Date.now();

  // Since k6 doesn't have full WebSocket support, we'll test the HTTP upgrade
  const response = http.get(wsUrl, {
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket',
      'User-Agent': 'K6 Load Test',
    },
  });

  const duration = Date.now() - startTime;
  responseTime.add(duration);
  requestCount.add(1);

  const isSuccess = check(response, {
    'WebSocket endpoint responds': (r) => r.status !== 0,
    'WebSocket response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (!isSuccess) {
    errorRate.add(1);
  }
}

export function teardown(data) {
  // Cleanup code - run once after the test
  console.log(`Load test completed against: ${data.baseUrl}`);

  // Final health check
  const healthResponse = http.get(`${data.baseUrl}/health`);
  check(healthResponse, {
    'final health check status is 200': (r) => r.status === 200,
  });
}