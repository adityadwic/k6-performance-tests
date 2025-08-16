/**
 * @fileoverview Smoke Test - Validates that script works and system performs under minimal load
 * @description Quick validation test with minimal virtual users to verify basic functionality
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Characteristics:
 * - Minimal load (1-2 VUs)
 * - Short duration (30s-2m)
 * - Basic functionality validation
 * - Quick feedback on system health
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { registerUser, loginUser } from '../helper/user.js';
import { createContact } from '../helper/contact.js';

// Custom metrics for smoke test
const smokeTestErrors = new Counter('smoke_test_errors');
const smokeTestSuccess = new Rate('smoke_test_success');
const smokeTestDuration = new Trend('smoke_test_duration');

export const options = {
  // Smoke test configuration - minimal load
  vus: 2,              // Only 2 virtual users
  duration: '1m',      // Short 1-minute test
  
  // Conservative thresholds for smoke test
  thresholds: {
    http_req_duration: ['p(95)<1000'],     // 95% of requests under 1s
    http_req_failed: ['rate<0.1'],         // Less than 10% failures allowed
    smoke_test_success: ['rate>0.95'],     // 95% success rate
    smoke_test_errors: ['count<5'],        // Maximum 5 errors
  },
  
  // Tags for test identification
  tags: {
    test_type: 'smoke',
    test_level: 'basic',
    environment: 'dev'
  }
};

/**
 * Smoke test setup - runs once before test execution
 */
export function setup() {
  console.log('🔥 Starting Smoke Test - Basic System Validation');
  console.log('📊 Test Configuration:');
  console.log('   • Virtual Users: 2');
  console.log('   • Duration: 1 minute');
  console.log('   • Purpose: Validate basic functionality');
  
  return {
    testStartTime: new Date().toISOString(),
    baseUrl: 'https://contact.do.my.id'
  };
}

/**
 * Main smoke test function - validates core system functionality
 */
export default function(data) {
  const testStart = new Date();
  let testPassed = true;
  
  try {
    // Test 1: Basic API Health Check
    console.log('🔍 Testing API health...');
    const healthResponse = http.get(`${data.baseUrl}/ping`);
    
    const healthCheck = check(healthResponse, {
      'API is healthy': (r) => r.status === 200,
      'Health response time OK': (r) => r.timings.duration < 500,
    });
    
    if (!healthCheck) {
      smokeTestErrors.add(1);
      testPassed = false;
      console.error('❌ API health check failed');
    } else {
      console.log('✅ API health check passed');
    }
    
    sleep(1);
    
    // Test 2: User Registration Flow
    console.log('🔍 Testing user registration...');
    const uniqueId = `smoke_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    const testUser = {
      username: `smoketest_${uniqueId}`,
      password: 'smoketest123',
      name: `Smoke Test User ${uniqueId}`
    };
    
    const registerResponse = registerUser(testUser);
    const registrationCheck = check(registerResponse, {
      'User registration successful': (r) => r && r.status === 200,
      'Registration response has data': (r) => r && r.json && r.json().data,
    });
    
    if (!registrationCheck) {
      smokeTestErrors.add(1);
      testPassed = false;
      console.error('❌ User registration failed');
    } else {
      console.log('✅ User registration passed');
    }
    
    sleep(1);
    
    // Test 3: User Login Flow
    console.log('🔍 Testing user login...');
    const loginResponse = loginUser({
      username: testUser.username,
      password: testUser.password
    });
    
    const loginCheck = check(loginResponse, {
      'User login successful': (r) => r && r.status === 200,
      'Login response has token': (r) => r && r.json && r.json().data && r.json().data.token,
    });
    
    if (!loginCheck) {
      smokeTestErrors.add(1);
      testPassed = false;
      console.error('❌ User login failed');
    } else {
      console.log('✅ User login passed');
      
      // Test 4: Contact Creation (if login successful)
      if (loginResponse && loginResponse.json && loginResponse.json().data) {
        console.log('🔍 Testing contact creation...');
        const token = loginResponse.json().data.token;
        
        const contactResponse = createContact({
          first_name: 'Smoke',
          last_name: 'Test',
          email: `smoke.test.${uniqueId}@example.com`,
          phone: '081234567890'
        }, token);
        
        const contactCheck = check(contactResponse, {
          'Contact creation successful': (r) => r && r.status === 200,
          'Contact response has data': (r) => r && r.json && r.json().data,
        });
        
        if (!contactCheck) {
          smokeTestErrors.add(1);
          testPassed = false;
          console.error('❌ Contact creation failed');
        } else {
          console.log('✅ Contact creation passed');
        }
      }
    }
    
    // Record test results
    const testDuration = new Date() - testStart;
    smokeTestDuration.add(testDuration);
    smokeTestSuccess.add(testPassed ? 1 : 0);
    
    if (testPassed) {
      console.log('🎉 All smoke tests passed - System is healthy!');
    } else {
      console.log('⚠️ Some smoke tests failed - System needs attention');
    }
    
  } catch (error) {
    console.error('💥 Smoke test error:', error.message);
    smokeTestErrors.add(1);
    smokeTestSuccess.add(0);
  }
  
  // Short sleep between iterations
  sleep(2);
}

/**
 * Smoke test teardown - runs once after test completion
 */
export function teardown(data) {
  console.log('🏁 Smoke Test Complete');
  console.log('📈 Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log('   • Purpose: Basic system validation completed');
  console.log('💡 Next steps: Run load tests if smoke test passes');
}
