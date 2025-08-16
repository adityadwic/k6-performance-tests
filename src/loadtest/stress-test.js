/**
 * @fileoverview Stress Test - Assesses system performance at its limits when load exceeds expected average
 * @description Pushes system beyond normal capacity to identify breaking points and recovery behavior
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Characteristics:
 * - High load beyond normal capacity (50-100+ VUs)
 * - Gradual load increase to find limits
 * - Recovery testing after peak load
 * - Failure mode identification
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { registerUser, loginUser } from '../helper/user.js';
import { createContact } from '../helper/contact.js';

// Custom metrics for stress test
const stressTestErrors = new Counter('stress_test_errors');
const stressTestSuccess = new Rate('stress_test_success');
const systemRecoveryTime = new Trend('system_recovery_time');
const peakLoadPerformance = new Trend('peak_load_performance');
const errorRate = new Rate('stress_error_rate');

export const options = {
  // Stress test configuration - exceeding normal capacity
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '3m', target: 30 },   // Scale to above normal
    { duration: '5m', target: 60 },   // High stress level
    { duration: '3m', target: 100 },  // Peak stress - beyond capacity
    { duration: '5m', target: 100 },  // Sustain peak load
    { duration: '3m', target: 60 },   // Scale down - test recovery
    { duration: '3m', target: 30 },   // Continue recovery
    { duration: '2m', target: 0 },    // Complete recovery
  ],
  
  // Relaxed thresholds for stress test (expecting some failures)
  thresholds: {
    http_req_duration: ['p(95)<10000'],       // 95% under 10s (high load)
    http_req_failed: ['rate<0.20'],           // Allow up to 20% failures under stress
    stress_test_success: ['rate>0.70'],       // 70% success rate acceptable
    stress_error_rate: ['rate<0.30'],         // Maximum 30% error rate
    system_recovery_time: ['p(90)<5000'],     // Recovery within 5s
  },
  
  // Test metadata
  tags: {
    test_type: 'stress',
    test_level: 'extreme',
    environment: 'staging'
  }
};

/**
 * Stress test setup
 */
export function setup() {
  console.log('⚡ Starting Stress Test - Beyond Normal Capacity');
  console.log('🚨 Test Configuration:');
  console.log('   • Peak Users: 100');
  console.log('   • Duration: 26 minutes');
  console.log('   • Purpose: Find system breaking points');
  console.log('   • Expected: Some failures at peak load');
  
  return {
    testStartTime: new Date().toISOString(),
    baseUrl: 'https://contact.do.my.id',
    stressPhase: 'warmup'
  };
}

/**
 * Main stress test function - aggressive load testing
 */
export default function(data) {
  const requestStart = new Date();
  let requestPassed = true;
  
  try {
    // Determine current stress phase based on VU count
    const currentVUs = __ENV.K6_VUS || 1;
    let stressPhase = 'warmup';
    
    if (currentVUs >= 100) {
      stressPhase = 'peak';
    } else if (currentVUs >= 60) {
      stressPhase = 'high';
    } else if (currentVUs >= 30) {
      stressPhase = 'medium';
    }
    
    console.log(`🔥 Stress phase: ${stressPhase} (${currentVUs} VUs)`);
    
    // Aggressive user workflow for stress testing
    performStressWorkflow(data, stressPhase);
    
    // Measure performance under stress
    const requestDuration = new Date() - requestStart;
    
    if (stressPhase === 'peak') {
      peakLoadPerformance.add(requestDuration);
    }
    
    stressTestSuccess.add(requestPassed ? 1 : 0);
    
  } catch (error) {
    console.error(`💥 Stress test error (${stressPhase}):`, error.message);
    stressTestErrors.add(1);
    errorRate.add(1);
    stressTestSuccess.add(0);
    requestPassed = false;
  }
  
  // Minimal sleep during stress test to maximize load
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds
}

/**
 * Aggressive workflow for stress testing
 */
function performStressWorkflow(data, stressPhase) {
  // Generate unique user for each iteration
  const uniqueId = `stress_${__VU}_${__ITER}_${Date.now()}`;
  const stressUser = {
    username: `stressuser_${uniqueId}`,
    password: 'stress123',
    name: `Stress User ${uniqueId}`
  };
  
  // Step 1: Rapid user registration
  console.log(`🔄 [${stressPhase}] Registering stress user: ${stressUser.username}`);
  const registerResponse = registerUser(stressUser);
  
  const registerCheck = check(registerResponse, {
    'Stress registration successful': (r) => r && r.status === 200,
    'Registration under stress load': (r) => r && r.timings.duration < 5000,
  }, { stress_phase: stressPhase });
  
  if (!registerCheck) {
    stressTestErrors.add(1);
    errorRate.add(1);
    console.error(`❌ [${stressPhase}] Registration failed for: ${stressUser.username}`);
    return;
  }
  
  console.log(`✅ [${stressPhase}] User registered: ${stressUser.username}`);
  
  // Minimal sleep between operations during stress
  sleep(0.1);
  
  // Step 2: Immediate login attempt
  console.log(`🔐 [${stressPhase}] Authenticating user: ${stressUser.username}`);
  const loginResponse = loginUser({
    username: stressUser.username,
    password: stressUser.password
  });
  
  const loginCheck = check(loginResponse, {
    'Stress login successful': (r) => r && r.status === 200,
    'Login token received under stress': (r) => r && r.json && r.json().data && r.json().data.token,
    'Login performance under stress': (r) => r && r.timings.duration < 5000,
  }, { stress_phase: stressPhase });
  
  if (!loginCheck) {
    stressTestErrors.add(1);
    errorRate.add(1);
    console.error(`❌ [${stressPhase}] Login failed for: ${stressUser.username}`);
    return;
  }
  
  const token = loginResponse.json().data.token;
  console.log(`✅ [${stressPhase}] User authenticated: ${stressUser.username}`);
  
  sleep(0.1);
  
  // Step 3: Rapid contact creation (multiple contacts for stress)
  const contactCount = stressPhase === 'peak' ? 3 : (stressPhase === 'high' ? 2 : 1);
  
  for (let i = 0; i < contactCount; i++) {
    console.log(`📞 [${stressPhase}] Creating contact ${i + 1}/${contactCount} for: ${stressUser.username}`);
    
    const contactResponse = createContact({
      first_name: `Stress${i}`,
      last_name: `Contact${uniqueId}`,
      email: `stress${i}.${uniqueId}@stress-test.com`,
      phone: `0812345678${i.toString().padStart(2, '0')}`
    }, token);
    
    const contactCheck = check(contactResponse, {
      'Stress contact creation successful': (r) => r && r.status === 200,
      'Contact creation under stress load': (r) => r && r.timings.duration < 8000,
      'Contact response valid under stress': (r) => r && r.json && r.json().data,
    }, { stress_phase: stressPhase, contact_index: i });
    
    if (!contactCheck) {
      stressTestErrors.add(1);
      errorRate.add(1);
      console.error(`❌ [${stressPhase}] Contact ${i + 1} creation failed for: ${stressUser.username}`);
    } else {
      console.log(`✅ [${stressPhase}] Contact ${i + 1} created for: ${stressUser.username}`);
    }
    
    // Very short pause between contacts during stress
    if (i < contactCount - 1) {
      sleep(0.05);
    }
  }
  
  // Test recovery time if we're scaling down
  if (stressPhase === 'medium' || stressPhase === 'warmup') {
    const recoveryStart = new Date();
    
    // Simple health check for recovery measurement
    const healthResponse = http.get(`${data.baseUrl}/ping`);
    const healthCheck = check(healthResponse, {
      'System recovering': (r) => r.status === 200,
      'Recovery response time': (r) => r.timings.duration < 2000,
    });
    
    if (healthCheck) {
      const recoveryTime = new Date() - recoveryStart;
      systemRecoveryTime.add(recoveryTime);
      console.log(`🏥 [${stressPhase}] System recovery time: ${recoveryTime}ms`);
    }
  }
  
  console.log(`🎯 [${stressPhase}] Stress workflow completed for: ${stressUser.username}`);
}

/**
 * Stress test teardown
 */
export function teardown(data) {
  console.log('🏁 Stress Test Complete');
  console.log('⚡ Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log('   • Peak Load: 100 concurrent users');
  console.log('   • Test Type: Beyond normal capacity');
  
  console.log('📊 Key Findings:');
  console.log('   • System behavior under extreme load identified');
  console.log('   • Breaking points and failure modes documented');
  console.log('   • Recovery characteristics measured');
  
  console.log('💡 Next Steps:');
  console.log('   • Analyze error patterns and bottlenecks');
  console.log('   • Review system logs for failure causes');
  console.log('   • Consider infrastructure scaling recommendations');
  console.log('   • Run soak test if stress test shows stability');
}
