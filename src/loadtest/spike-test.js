/**
 * @fileoverview Spike Test - Validates behavior and survival under sudden, massive load increases
 * @description Tests system response to sudden traffic spikes and recovery behavior
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Characteristics:
 * - Sudden massive load spikes (0 to 200+ VUs instantly)
 * - Short duration high intensity bursts
 * - Recovery behavior testing
 * - Auto-scaling validation
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { registerUser, loginUser } from '../helper/user.js';
import { createContact } from '../helper/contact.js';

// Custom metrics for spike test
const spikeTestErrors = new Counter('spike_test_errors');
const spikeTestSuccess = new Rate('spike_test_success');
const spikeSurvivalRate = new Rate('spike_survival_rate');
const recoveryTime = new Trend('spike_recovery_time');
const peakLoadHandling = new Rate('peak_load_handling');
const systemOverload = new Gauge('system_overload_indicator');

export const options = {
  // Spike test configuration - sudden massive load
  stages: [
    { duration: '1m', target: 5 },     // Normal baseline
    { duration: '30s', target: 200 },  // SPIKE! Instant massive load
    { duration: '2m', target: 200 },   // Sustain spike
    { duration: '30s', target: 5 },    // Rapid recovery
    { duration: '1m', target: 5 },     // Recovery stabilization
    { duration: '30s', target: 150 },  // Second spike (smaller)
    { duration: '1m', target: 150 },   // Sustain second spike
    { duration: '30s', target: 0 },    // Complete recovery
  ],
  
  // Survival-focused thresholds (expect high failure during spikes)
  thresholds: {
    http_req_duration: ['p(95)<15000'],        // 95% under 15s (very relaxed for spikes)
    http_req_failed: ['rate<0.50'],            // Allow up to 50% failures during spike
    spike_survival_rate: ['rate>0.50'],        // System survives at least 50% of spike
    peak_load_handling: ['rate>0.30'],         // Handle at least 30% of peak load
    spike_recovery_time: ['p(90)<10000'],      // Recovery within 10s
  },
  
  // Test metadata
  tags: {
    test_type: 'spike',
    test_level: 'extreme',
    environment: 'staging'
  }
};

/**
 * Spike test setup
 */
export function setup() {
  console.log('⚡ Starting Spike Test - Sudden Massive Load Simulation');
  console.log('🚨 Test Configuration:');
  console.log('   • Primary Spike: 5 → 200 VUs in 30 seconds');
  console.log('   • Secondary Spike: 5 → 150 VUs in 30 seconds');
  console.log('   • Duration: 8 minutes total');
  console.log('   • Purpose: Validate system survival under sudden load');
  console.log('   • Expected: High failure rates during spikes');
  
  // Test initial system health
  console.log('🔍 Testing baseline system health...');
  const healthResponse = http.get('https://contact.do.my.id/ping');
  
  if (healthResponse.status === 200) {
    console.log('✅ System healthy - ready for spike test');
  } else {
    console.warn('⚠️ System may be unhealthy - proceeding with caution');
  }
  
  return {
    testStartTime: new Date().toISOString(),
    baseUrl: 'https://contact.do.my.id',
    spikeEvents: [],
    recoveryEvents: []
  };
}

/**
 * Main spike test function - survival under extreme sudden load
 */
export default function(data) {
  const requestStart = new Date();
  let requestSurvived = true;
  
  try {
    // Determine current phase based on VU count and timing
    const currentVUs = __ENV.K6_VUS || 1;
    const spikePhase = determineSpikePhase(currentVUs);
    
    console.log(`⚡ [${spikePhase}] Spike test with ${currentVUs} VUs`);
    
    // Perform operations based on spike phase
    const operationResult = performSpikeWorkflow(data, spikePhase, currentVUs);
    
    // Record survival metrics
    if (spikePhase === 'primary_spike' || spikePhase === 'secondary_spike') {
      spikeSurvivalRate.add(operationResult ? 1 : 0);
      peakLoadHandling.add(operationResult ? 1 : 0);
      
      if (!operationResult) {
        systemOverload.add(1);
      }
    }
    
    // Measure recovery if we're in recovery phase
    if (spikePhase === 'recovery' || spikePhase === 'stabilization') {
      const recoveryStart = new Date();
      
      // Quick health check for recovery measurement
      const healthResponse = http.get(`${data.baseUrl}/ping`);
      const isRecovered = check(healthResponse, {
        'System recovering from spike': (r) => r.status === 200,
        'Recovery response time': (r) => r.timings.duration < 5000,
      });
      
      if (isRecovered) {
        const recoveryDuration = new Date() - recoveryStart;
        recoveryTime.add(recoveryDuration);
        console.log(`🏥 [${spikePhase}] Recovery time: ${recoveryDuration}ms`);
      }
    }
    
    spikeTestSuccess.add(operationResult ? 1 : 0);
    
  } catch (error) {
    console.error(`💥 Spike test error (${spikePhase}):`, error.message);
    spikeTestErrors.add(1);
    spikeTestSuccess.add(0);
    requestSurvived = false;
    
    // In spike phases, errors are more expected
    if (spikePhase.includes('spike')) {
      console.log(`⚠️ [${spikePhase}] Expected error during spike load: ${error.message}`);
    }
  }
  
  // Minimal sleep during spikes to maximize load
  const sleepTime = getSpikePhaseDelay(spikePhase);
  sleep(sleepTime);
}

/**
 * Determine current spike phase based on VU count
 */
function determineSpikePhase(currentVUs) {
  if (currentVUs >= 200) {
    return 'primary_spike';
  } else if (currentVUs >= 150) {
    return 'secondary_spike';
  } else if (currentVUs >= 50) {
    return 'recovery';
  } else if (currentVUs >= 10) {
    return 'stabilization';
  } else {
    return 'baseline';
  }
}

/**
 * Get appropriate delay based on spike phase
 */
function getSpikePhaseDelay(spikePhase) {
  switch (spikePhase) {
    case 'primary_spike':
    case 'secondary_spike':
      return Math.random() * 0.2 + 0.1; // 0.1-0.3s - maximum load
    case 'recovery':
      return Math.random() * 1 + 0.5;   // 0.5-1.5s - recovering
    case 'stabilization':
      return Math.random() * 2 + 1;     // 1-3s - stabilizing
    default:
      return Math.random() * 3 + 2;     // 2-5s - normal
  }
}

/**
 * Spike-focused workflow
 */
function performSpikeWorkflow(data, spikePhase, currentVUs) {
  try {
    // Rapid operations during spike phases
    if (spikePhase === 'primary_spike' || spikePhase === 'secondary_spike') {
      return performRapidFireOperations(data, spikePhase);
    }
    
    // Gentler operations during recovery
    if (spikePhase === 'recovery' || spikePhase === 'stabilization') {
      return performRecoveryOperations(data, spikePhase);
    }
    
    // Normal operations during baseline
    return performBaselineOperations(data, spikePhase);
    
  } catch (error) {
    console.error(`💥 Spike workflow error in ${spikePhase}:`, error.message);
    return false;
  }
}

/**
 * Rapid-fire operations for spike phases
 */
function performRapidFireOperations(data, spikePhase) {
  const uniqueId = `spike_${__VU}_${__ITER}_${Date.now()}`;
  const spikeUser = {
    username: `spikeuser_${uniqueId}`,
    password: 'spike123',
    name: `Spike User ${uniqueId}`
  };
  
  console.log(`🔥 [${spikePhase}] Rapid operation for: ${spikeUser.username}`);
  
  try {
    // Ultra-fast registration attempt
    const registerResponse = registerUser(spikeUser);
    
    const registerCheck = check(registerResponse, {
      'Spike registration survived': (r) => r && r.status === 200,
      'Registration under spike load': (r) => r && r.timings.duration < 10000, // Very relaxed
    }, { spike_phase: spikePhase });
    
    if (!registerCheck) {
      console.log(`💥 [${spikePhase}] Registration failed (expected under spike): ${spikeUser.username}`);
      return false;
    }
    
    console.log(`🎯 [${spikePhase}] Registration survived spike: ${spikeUser.username}`);
    
    // Quick login attempt (no sleep)
    const loginResponse = loginUser({
      username: spikeUser.username,
      password: spikeUser.password
    });
    
    const loginCheck = check(loginResponse, {
      'Spike login survived': (r) => r && r.status === 200,
      'Login under spike load': (r) => r && r.timings.duration < 15000,
    }, { spike_phase: spikePhase });
    
    if (!loginCheck) {
      console.log(`💥 [${spikePhase}] Login failed during spike: ${spikeUser.username}`);
      return false;
    }
    
    console.log(`🚀 [${spikePhase}] Full workflow survived spike: ${spikeUser.username}`);
    return true;
    
  } catch (error) {
    console.log(`💥 [${spikePhase}] Rapid operation failed: ${error.message}`);
    return false;
  }
}

/**
 * Recovery operations to test system healing
 */
function performRecoveryOperations(data, spikePhase) {
  const uniqueId = `recovery_${__VU}_${Date.now()}`;
  const recoveryUser = {
    username: `recoveryuser_${uniqueId}`,
    password: 'recovery123',
    name: `Recovery User ${uniqueId}`
  };
  
  console.log(`🏥 [${spikePhase}] Recovery operation for: ${recoveryUser.username}`);
  
  try {
    // Test if system is recovering
    const registerResponse = registerUser(recoveryUser);
    
    const registerCheck = check(registerResponse, {
      'Recovery registration successful': (r) => r && r.status === 200,
      'Recovery performance improving': (r) => r && r.timings.duration < 5000,
    }, { spike_phase: spikePhase });
    
    if (!registerCheck) {
      console.log(`⚠️ [${spikePhase}] System still recovering: ${recoveryUser.username}`);
      return false;
    }
    
    sleep(0.5); // Small pause during recovery
    
    const loginResponse = loginUser({
      username: recoveryUser.username,
      password: recoveryUser.password
    });
    
    const loginCheck = check(loginResponse, {
      'Recovery login successful': (r) => r && r.status === 200,
    }, { spike_phase: spikePhase });
    
    if (loginCheck) {
      console.log(`✅ [${spikePhase}] System recovery confirmed: ${recoveryUser.username}`);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.log(`💥 [${spikePhase}] Recovery operation failed: ${error.message}`);
    return false;
  }
}

/**
 * Baseline operations for normal phases
 */
function performBaselineOperations(data, spikePhase) {
  const uniqueId = `baseline_${__VU}_${Date.now()}`;
  const baselineUser = {
    username: `baselineuser_${uniqueId}`,
    password: 'baseline123',
    name: `Baseline User ${uniqueId}`
  };
  
  console.log(`📊 [${spikePhase}] Baseline operation for: ${baselineUser.username}`);
  
  try {
    const registerResponse = registerUser(baselineUser);
    const loginResponse = loginUser({
      username: baselineUser.username,
      password: baselineUser.password
    });
    
    const success = check(registerResponse, { 'Baseline register OK': (r) => r && r.status === 200 }) &&
                   check(loginResponse, { 'Baseline login OK': (r) => r && r.status === 200 });
    
    if (success) {
      console.log(`✅ [${spikePhase}] Baseline operation successful: ${baselineUser.username}`);
    }
    
    return success;
    
  } catch (error) {
    console.log(`💥 [${spikePhase}] Baseline operation failed: ${error.message}`);
    return false;
  }
}

/**
 * Spike test teardown
 */
export function teardown(data) {
  console.log('🏁 Spike Test Complete');
  console.log('⚡ Sudden Load Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log('   • Primary Spike: 5 → 200 VUs');
  console.log('   • Secondary Spike: 5 → 150 VUs');
  
  console.log('📊 Spike Test Analysis:');
  console.log('   • System survival under sudden load measured');
  console.log('   • Recovery behavior documented');
  console.log('   • Auto-scaling effectiveness tested');
  console.log('   • Failure modes during spikes identified');
  
  console.log('💡 Key Insights:');
  console.log('   • Review spike survival rates');
  console.log('   • Analyze recovery time patterns');
  console.log('   • Check for auto-scaling triggers');
  console.log('   • Consider circuit breaker implementations');
  console.log('   • Plan capacity for traffic spikes');
}
