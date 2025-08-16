/**
 * @fileoverview QuickPizza Load Test - Simple performance testing
 * @description Simple load test for Grafana QuickPizza demo website
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Configuration:
 * - 10 Virtual Users (VUs)
 * - 10 seconds duration
 * - Simple HTTP GET requests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics for QuickPizza test
const pizzaLoadErrors = new Counter('pizza_load_errors');
const pizzaLoadSuccess = new Rate('pizza_load_success');
const pizzaResponseTime = new Trend('pizza_response_time');

export const options = {
  // Simple load test configuration
  vus: 10,        // 10 virtual users
  duration: '10s', // 10 seconds duration
  
  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<2000'],     // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],         // Less than 10% failures
    pizza_load_success: ['rate>0.9'],      // 90% success rate
  },

  // Test metadata
  tags: {
    test_type: 'simple_load',
    target: 'quickpizza_demo',
    environment: 'external'
  }
};

/**
 * Setup function - runs once before test starts
 */
export function setup() {
  console.log('🍕 Starting QuickPizza Load Test');
  console.log('🎯 Target: https://quickpizza.grafana.com/');
  console.log('👥 Virtual Users: 10');
  console.log('⏱️  Duration: 10 seconds');
  console.log('📊 Expected Load: ~100 requests total');
  
  return {
    baseUrl: 'https://quickpizza.grafana.com',
    testStartTime: new Date().toISOString()
  };
}

/**
 * Main test function - runs for each VU iteration
 */
export default function(data) {
  const startTime = new Date();
  
  // Step 1: Load main page
  console.log(`🏠 VU ${__VU}: Loading QuickPizza homepage`);
  const homeResponse = http.get(data.baseUrl, {
    headers: {
      'User-Agent': 'k6-load-test/1.0.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    tags: { page: 'homepage' }
  });
  
  // Check homepage response
  const homeCheck = check(homeResponse, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loads within 3s': (r) => r.timings.duration < 3000,
    'Homepage contains pizza content': (r) => r.body && r.body.includes('pizza'),
    'Homepage has valid response': (r) => r.body && r.body.length > 0,
  }, { page: 'homepage' });
  
  if (!homeCheck) {
    pizzaLoadErrors.add(1);
    console.log(`❌ VU ${__VU}: Homepage load failed`);
  } else {
    console.log(`✅ VU ${__VU}: Homepage loaded successfully (${homeResponse.timings.duration.toFixed(0)}ms)`);
    pizzaLoadSuccess.add(1);
  }
  
  // Record response time
  pizzaResponseTime.add(homeResponse.timings.duration);
  
  // Simulate user reading time
  sleep(Math.random() * 2 + 1); // 1-3 seconds
  
  // Step 2: Try to load some common resources (if they exist)
  const resourcePaths = [
    '/api/health',
    '/favicon.ico',
    '/static/css',
    '/assets',
    '/manifest.json'
  ];
  
  // Try one random resource
  const randomPath = resourcePaths[Math.floor(Math.random() * resourcePaths.length)];
  console.log(`📄 VU ${__VU}: Attempting to load resource: ${randomPath}`);
  
  const resourceResponse = http.get(`${data.baseUrl}${randomPath}`, {
    headers: {
      'User-Agent': 'k6-load-test/1.0.0',
      'Referer': data.baseUrl,
    },
    tags: { page: 'resource', resource: randomPath }
  });
  
  // Check resource response (more lenient)
  check(resourceResponse, {
    'Resource responds': (r) => r.status >= 200 && r.status < 500,
  }, { page: 'resource' });
  
  // Log resource attempt
  if (resourceResponse.status === 200) {
    console.log(`✅ VU ${__VU}: Resource ${randomPath} loaded (${resourceResponse.timings.duration.toFixed(0)}ms)`);
  } else {
    console.log(`⚠️  VU ${__VU}: Resource ${randomPath} returned ${resourceResponse.status}`);
  }
  
  // Brief pause between iterations
  sleep(0.5);
  
  // Calculate total iteration time
  const iterationTime = new Date() - startTime;
  console.log(`⏱️  VU ${__VU}: Iteration completed in ${iterationTime}ms`);
}

/**
 * Teardown function - runs once after test completes
 */
export function teardown(data) {
  console.log('🏁 QuickPizza Load Test Complete');
  console.log('📊 Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log(`   • Target: ${data.baseUrl}`);
  console.log(`   • Configuration: 10 VUs × 10s = ~100 total requests`);
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   • Check test results above for performance metrics');
  console.log('   • Review response times and error rates');
  console.log('   • Scale up VUs or duration for stress testing');
  console.log('   • Enable web dashboard with: K6_WEB_DASHBOARD=true k6 run script.js');
}
