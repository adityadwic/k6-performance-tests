/**
 * @fileoverview Soak Test - Assesses reliability and performance over extended periods
 * @description Long-duration test to identify memory leaks, degradation, and stability issues
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Characteristics:
 * - Moderate sustained load (20-30 VUs)
 * - Extended duration (30+ minutes)
 * - Memory leak detection
 * - Performance degradation monitoring
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { registerUser, loginUser, getUser } from '../helper/user.js';
import { createContact } from '../helper/contact.js';

// Custom metrics for soak test
const soakTestErrors = new Counter('soak_test_errors');
const soakTestSuccess = new Rate('soak_test_success');
const performanceDegradation = new Trend('performance_degradation');
const memoryLeakIndicator = new Gauge('memory_leak_indicator');
const stabilityScore = new Rate('stability_score');
const longRunningOperations = new Trend('long_running_operations');

export const options = {
  // Soak test configuration - sustained moderate load
  stages: [
    { duration: '5m', target: 10 },   // Gradual ramp up
    { duration: '10m', target: 25 },  // Reach moderate load
    { duration: '60m', target: 25 },  // Sustain load for 1 hour (main soak period)
    { duration: '5m', target: 10 },   // Gradual ramp down
    { duration: '5m', target: 0 },    // Cool down
  ],
  
  // Stability-focused thresholds
  thresholds: {
    http_req_duration: [
      'p(95)<3000',           // 95% under 3s
      'p(99)<5000',           // 99% under 5s
    ],
    http_req_failed: ['rate<0.05'],                    // Less than 5% failures
    soak_test_success: ['rate>0.95'],                  // 95% success rate
    performance_degradation: ['p(90)<4000'],           // No significant degradation
    stability_score: ['rate>0.98'],                    // High stability
    long_running_operations: ['p(95)<10000'],          // Operations complete timely
  },
  
  // Test metadata
  tags: {
    test_type: 'soak',
    test_level: 'endurance',
    environment: 'production'
  }
};

/**
 * Soak test setup
 */
export function setup() {
  console.log('⏱️ Starting Soak Test - Long Duration Reliability Assessment');
  console.log('🔄 Test Configuration:');
  console.log('   • Sustained Users: 25');
  console.log('   • Duration: 85 minutes');
  console.log('   • Purpose: Identify memory leaks and degradation');
  console.log('   • Focus: Long-term stability and reliability');
  
  // Create baseline users for consistent testing
  const baselineUsers = [];
  console.log('👥 Creating baseline users for soak test...');
  
  for (let i = 1; i <= 10; i++) {
    const user = {
      username: `soakuser${i}`,
      password: 'soaktest123',
      name: `Soak Test User ${i}`
    };
    
    try {
      const response = registerUser(user);
      if (response && response.status === 200) {
        baselineUsers.push(user);
        console.log(`✅ Baseline user created: ${user.username}`);
      }
    } catch (error) {
      console.log(`⚠️ Could not create baseline user ${user.username}: ${error.message}`);
    }
    
    sleep(0.5); // Pace the user creation
  }
  
  return {
    testStartTime: new Date().toISOString(),
    baseUrl: 'https://contact.do.my.id',
    baselineUsers: baselineUsers,
    iterationCount: 0,
    performanceBaseline: null
  };
}

/**
 * Main soak test function - sustained moderate load
 */
export default function(data) {
  const iterationStart = new Date();
  let operationPassed = true;
  
  try {
    // Track iteration count for degradation analysis
    data.iterationCount = (data.iterationCount || 0) + 1;
    
    // Determine test phase
    const testPhase = getTestPhase();
    console.log(`🔄 [${testPhase}] Soak iteration ${data.iterationCount}`);
    
    // Perform sustained operations
    const operationResult = performSoakWorkflow(data, testPhase);
    
    // Monitor performance degradation
    const iterationDuration = new Date() - iterationStart;
    
    // Set baseline on early iterations
    if (data.iterationCount <= 10 && !data.performanceBaseline) {
      data.performanceBaseline = iterationDuration;
      console.log(`📊 Performance baseline set: ${data.performanceBaseline}ms`);
    }
    
    // Check for performance degradation
    if (data.performanceBaseline && data.iterationCount > 50) {
      const degradationRatio = iterationDuration / data.performanceBaseline;
      performanceDegradation.add(iterationDuration);
      
      if (degradationRatio > 2.0) {
        console.warn(`⚠️ Performance degradation detected: ${degradationRatio.toFixed(2)}x baseline`);
        memoryLeakIndicator.add(degradationRatio);
      }
    }
    
    // Record stability metrics
    stabilityScore.add(operationResult ? 1 : 0);
    soakTestSuccess.add(operationResult ? 1 : 0);
    longRunningOperations.add(iterationDuration);
    
    // Log periodic status
    if (data.iterationCount % 50 === 0) {
      console.log(`📈 Soak test progress: ${data.iterationCount} iterations completed`);
      console.log(`⏱️ Average duration: ${iterationDuration}ms`);
    }
    
  } catch (error) {
    console.error(`💥 Soak test iteration error:`, error.message);
    soakTestErrors.add(1);
    soakTestSuccess.add(0);
    stabilityScore.add(0);
  }
  
  // Realistic user pacing for sustained load
  sleep(Math.random() * 4 + 2); // 2-6 seconds between operations
}

/**
 * Determine current test phase based on execution time
 */
function getTestPhase() {
  // Simple phase detection based on __ITER (rough approximation)
  const iteration = __ITER;
  
  if (iteration < 50) return 'rampup';
  if (iteration < 150) return 'stabilizing';
  if (iteration < 800) return 'soak'; // Main soak period
  if (iteration < 900) return 'rampdown';
  return 'cooldown';
}

/**
 * Sustained workflow for soak testing
 */
function performSoakWorkflow(data, testPhase) {
  try {
    // Mix of operations to simulate real usage patterns
    const operationType = Math.random();
    
    if (operationType < 0.4) {
      // 40% - Use existing baseline users (simulates returning users)
      return performBaselineUserWorkflow(data, testPhase);
    } else if (operationType < 0.7) {
      // 30% - Create new users (simulates growth)
      return performNewUserWorkflow(data, testPhase);
    } else {
      // 30% - Read-heavy operations (simulates browsing)
      return performReadOnlyWorkflow(data, testPhase);
    }
    
  } catch (error) {
    console.error(`💥 Soak workflow error in ${testPhase}:`, error.message);
    return false;
  }
}

/**
 * Baseline user workflow for consistency
 */
function performBaselineUserWorkflow(data, testPhase) {
  if (data.baselineUsers.length === 0) {
    console.log('⚠️ No baseline users available');
    return false;
  }
  
  // Select random baseline user
  const user = data.baselineUsers[Math.floor(Math.random() * data.baselineUsers.length)];
  console.log(`👤 [${testPhase}] Using baseline user: ${user.username}`);
  
  // Login
  const loginResponse = loginUser({
    username: user.username,
    password: user.password
  });
  
  const loginCheck = check(loginResponse, {
    'Baseline user login successful': (r) => r && r.status === 200,
    'Login response time acceptable': (r) => r && r.timings.duration < 3000,
  }, { test_phase: testPhase, user_type: 'baseline' });
  
  if (!loginCheck) {
    soakTestErrors.add(1);
    return false;
  }
  
  const token = loginResponse.json().data.token;
  sleep(1);
  
  // Create contact
  const contactResponse = createContact({
    first_name: 'Soak',
    last_name: 'Contact',
    email: `soak.${Date.now()}@soak-test.com`,
    phone: '081234567890'
  }, token);
  
  const contactCheck = check(contactResponse, {
    'Baseline contact creation successful': (r) => r && r.status === 200,
    'Contact creation time acceptable': (r) => r && r.timings.duration < 5000,
  }, { test_phase: testPhase, operation: 'contact_create' });
  
  if (!contactCheck) {
    soakTestErrors.add(1);
    return false;
  }
  
  console.log(`✅ [${testPhase}] Baseline workflow completed for: ${user.username}`);
  return true;
}

/**
 * New user workflow for growth simulation
 */
function performNewUserWorkflow(data, testPhase) {
  const uniqueId = `soak_${data.iterationCount}_${Date.now()}`;
  const newUser = {
    username: `soaktest_${uniqueId}`,
    password: 'soaktest123',
    name: `Soak Test User ${uniqueId}`
  };
  
  console.log(`👤 [${testPhase}] Creating new user: ${newUser.username}`);
  
  // Register
  const registerResponse = registerUser(newUser);
  const registerCheck = check(registerResponse, {
    'New user registration successful': (r) => r && r.status === 200,
    'Registration time acceptable': (r) => r && r.timings.duration < 3000,
  }, { test_phase: testPhase, user_type: 'new' });
  
  if (!registerCheck) {
    soakTestErrors.add(1);
    return false;
  }
  
  sleep(1);
  
  // Login
  const loginResponse = loginUser({
    username: newUser.username,
    password: newUser.password
  });
  
  const loginCheck = check(loginResponse, {
    'New user login successful': (r) => r && r.status === 200,
  }, { test_phase: testPhase });
  
  if (!loginCheck) {
    soakTestErrors.add(1);
    return false;
  }
  
  console.log(`✅ [${testPhase}] New user workflow completed for: ${newUser.username}`);
  return true;
}

/**
 * Read-only workflow for browsing simulation
 */
function performReadOnlyWorkflow(data, testPhase) {
  if (data.baselineUsers.length === 0) {
    return false;
  }
  
  const user = data.baselineUsers[Math.floor(Math.random() * data.baselineUsers.length)];
  console.log(`👀 [${testPhase}] Read-only operations for: ${user.username}`);
  
  // Login
  const loginResponse = loginUser({
    username: user.username,
    password: user.password
  });
  
  if (!loginResponse || loginResponse.status !== 200) {
    soakTestErrors.add(1);
    return false;
  }
  
  const token = loginResponse.json().data.token;
  sleep(1);
  
  // Get user data (read operation)
  const userResponse = getUser(user.username, token);
  const userCheck = check(userResponse, {
    'User data retrieval successful': (r) => r && r.status === 200,
    'Read operation time acceptable': (r) => r && r.timings.duration < 2000,
  }, { test_phase: testPhase, operation: 'read' });
  
  if (!userCheck) {
    soakTestErrors.add(1);
    return false;
  }
  
  console.log(`✅ [${testPhase}] Read-only workflow completed for: ${user.username}`);
  return true;
}

/**
 * Soak test teardown
 */
export function teardown(data) {
  console.log('🏁 Soak Test Complete');
  console.log('⏱️ Long Duration Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log(`   • Total Iterations: ${data.iterationCount}`);
  console.log(`   • Baseline Users: ${data.baselineUsers.length}`);
  console.log(`   • Duration: 85 minutes sustained load`);
  
  console.log('📊 Stability Analysis:');
  console.log('   • Memory leak indicators monitored');
  console.log('   • Performance degradation tracked');
  console.log('   • Long-term reliability assessed');
  
  console.log('💡 Recommendations:');
  console.log('   • Review performance degradation metrics');
  console.log('   • Check for memory leak patterns');
  console.log('   • Analyze stability score trends');
  console.log('   • Consider resource optimization if degradation detected');
}
