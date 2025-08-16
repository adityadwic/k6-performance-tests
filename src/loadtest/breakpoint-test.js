/**
 * @fileoverview Breakpoint Test - Gradually increases load to identify system capacity limits
 * @description Finds the exact point where system performance degrades or fails
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Characteristics:
 * - Gradual load increase (step-by-step)
 * - Performance monitoring at each level
 * - Capacity limit identification
 * - Breaking point determination
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { registerUser, loginUser } from '../helper/user.js';
import { createContact } from '../helper/contact.js';

// Custom metrics for breakpoint test
const breakpointErrors = new Counter('breakpoint_test_errors');
const breakpointSuccess = new Rate('breakpoint_test_success');
const performanceAtLevel = new Trend('performance_at_load_level');
const capacityUtilization = new Gauge('capacity_utilization');
const systemBreakpoint = new Gauge('system_breakpoint_indicator');
const throughputByLevel = new Rate('throughput_by_level');

export const options = {
  // Breakpoint test configuration - gradual increase to find limits
  stages: [
    // Gradual steps to find breaking point
    { duration: '3m', target: 10 },   // Level 1: Baseline
    { duration: '3m', target: 20 },   // Level 2: Light load
    { duration: '3m', target: 35 },   // Level 3: Moderate load
    { duration: '3m', target: 50 },   // Level 4: Heavy load
    { duration: '3m', target: 70 },   // Level 5: High load
    { duration: '3m', target: 100 },  // Level 6: Very high load
    { duration: '3m', target: 150 },  // Level 7: Extreme load
    { duration: '3m', target: 200 },  // Level 8: Maximum load
    { duration: '3m', target: 300 },  // Level 9: Beyond capacity
    { duration: '2m', target: 0 },    // Recovery
  ],
  
  // Progressive thresholds to identify breakpoint
  thresholds: {
    http_req_duration: ['p(95)<20000'],        // Very relaxed for breakpoint test
    http_req_failed: ['rate<0.70'],            // Allow high failure at breakpoint
    breakpoint_test_success: ['rate>0.30'],    // Minimum survival rate
    performance_at_load_level: ['p(90)<30000'], // Track degradation
  },
  
  // Test metadata
  tags: {
    test_type: 'breakpoint',
    test_level: 'capacity',
    environment: 'staging'
  }
};

/**
 * Breakpoint test setup
 */
export function setup() {
  console.log('📈 Starting Breakpoint Test - System Capacity Identification');
  console.log('🎯 Test Configuration:');
  console.log('   • Load Levels: 10 → 20 → 35 → 50 → 70 → 100 → 150 → 200 → 300 VUs');
  console.log('   • Step Duration: 3 minutes each');
  console.log('   • Purpose: Find exact capacity limits');
  console.log('   • Goal: Identify system breaking point');
  
  // Baseline performance measurement
  console.log('📊 Measuring baseline performance...');
  const baselineStart = new Date();
  
  try {
    const healthResponse = http.get('https://contact.do.my.id/ping');
    const baselineTime = new Date() - baselineStart;
    
    if (healthResponse.status === 200) {
      console.log(`✅ Baseline response time: ${baselineTime}ms`);
    }
  } catch (error) {
    console.warn('⚠️ Could not establish baseline');
  }
  
  return {
    testStartTime: new Date().toISOString(),
    baseUrl: 'https://contact.do.my.id',
    loadLevels: [],
    performanceData: {},
    breakpointIdentified: false,
    currentLevel: 0
  };
}

/**
 * Main breakpoint test function - step-by-step capacity testing
 */
export default function(data) {
  const iterationStart = new Date();
  let operationSuccessful = true;
  
  try {
    // Determine current load level
    const currentVUs = __ENV.K6_VUS || 1;
    const loadLevel = determineLoadLevel(currentVUs);
    
    console.log(`📈 [Level ${loadLevel}] Breakpoint test with ${currentVUs} VUs`);
    
    // Update current level tracking
    if (loadLevel !== data.currentLevel) {
      data.currentLevel = loadLevel;
      console.log(`🔄 Entering Load Level ${loadLevel} (${currentVUs} VUs)`);
      
      // Initialize performance tracking for this level
      data.performanceData[loadLevel] = {
        startTime: new Date(),
        successCount: 0,
        errorCount: 0,
        responseTimes: []
      };
    }
    
    // Perform operations and measure performance
    const operationResult = performBreakpointWorkflow(data, loadLevel, currentVUs);
    
    // Record performance data for this level
    const iterationDuration = new Date() - iterationStart;
    performanceAtLevel.add(iterationDuration, { load_level: loadLevel });
    
    // Update level-specific metrics
    if (data.performanceData[loadLevel]) {
      if (operationResult) {
        data.performanceData[loadLevel].successCount++;
      } else {
        data.performanceData[loadLevel].errorCount++;
      }
      data.performanceData[loadLevel].responseTimes.push(iterationDuration);
    }
    
    // Check for breaking point indicators
    checkBreakpointIndicators(data, loadLevel, operationResult, iterationDuration);
    
    // Record overall metrics
    breakpointSuccess.add(operationResult ? 1 : 0);
    throughputByLevel.add(operationResult ? 1 : 0, { load_level: loadLevel });
    
    // Calculate capacity utilization
    const maxExpectedVUs = 100; // Assume 100 VUs is expected capacity
    const utilization = Math.min(currentVUs / maxExpectedVUs, 2.0); // Cap at 200%
    capacityUtilization.add(utilization);
    
  } catch (error) {
    console.error(`💥 Breakpoint test error at level ${data.currentLevel}:`, error.message);
    breakpointErrors.add(1);
    breakpointSuccess.add(0);
    operationSuccessful = false;
  }
  
  // Variable sleep based on load level
  const sleepTime = getBreakpointSleepTime(data.currentLevel);
  sleep(sleepTime);
}

/**
 * Determine current load level based on VU count
 */
function determineLoadLevel(currentVUs) {
  if (currentVUs <= 10) return 1;
  if (currentVUs <= 20) return 2;
  if (currentVUs <= 35) return 3;
  if (currentVUs <= 50) return 4;
  if (currentVUs <= 70) return 5;
  if (currentVUs <= 100) return 6;
  if (currentVUs <= 150) return 7;
  if (currentVUs <= 200) return 8;
  if (currentVUs <= 300) return 9;
  return 10; // Beyond test levels
}

/**
 * Get appropriate sleep time for load level
 */
function getBreakpointSleepTime(loadLevel) {
  // Decrease sleep time as load increases to maximize pressure
  switch (loadLevel) {
    case 1:
    case 2: return Math.random() * 3 + 2;    // 2-5s - comfortable
    case 3:
    case 4: return Math.random() * 2 + 1;    // 1-3s - moderate
    case 5:
    case 6: return Math.random() * 1 + 0.5;  // 0.5-1.5s - aggressive
    case 7:
    case 8: return Math.random() * 0.5 + 0.2; // 0.2-0.7s - very aggressive
    default: return Math.random() * 0.3 + 0.1; // 0.1-0.4s - maximum pressure
  }
}

/**
 * Check for breaking point indicators
 */
function checkBreakpointIndicators(data, loadLevel, operationResult, responseTime) {
  // Define breaking point criteria
  const levelData = data.performanceData[loadLevel];
  if (!levelData) return;
  
  const totalOperations = levelData.successCount + levelData.errorCount;
  if (totalOperations < 10) return; // Need some data first
  
  const errorRate = levelData.errorCount / totalOperations;
  const avgResponseTime = levelData.responseTimes.reduce((a, b) => a + b, 0) / levelData.responseTimes.length;
  
  // Breaking point indicators
  const highErrorRate = errorRate > 0.5;           // > 50% errors
  const slowResponse = avgResponseTime > 10000;    // > 10s average
  const systemFailure = errorRate > 0.8;           // > 80% errors
  
  if (systemFailure && !data.breakpointIdentified) {
    console.log(`🚨 BREAKING POINT IDENTIFIED at Level ${loadLevel} (${__ENV.K6_VUS} VUs)`);
    console.log(`📊 Metrics: Error Rate: ${(errorRate * 100).toFixed(1)}%, Avg Response: ${avgResponseTime.toFixed(0)}ms`);
    data.breakpointIdentified = true;
    systemBreakpoint.add(loadLevel);
  } else if (highErrorRate || slowResponse) {
    console.log(`⚠️ Performance degradation at Level ${loadLevel}: Error Rate: ${(errorRate * 100).toFixed(1)}%, Avg Response: ${avgResponseTime.toFixed(0)}ms`);
  }
  
  // Log level performance every 20 operations
  if (totalOperations % 20 === 0) {
    console.log(`📈 Level ${loadLevel} Status: ${levelData.successCount} success, ${levelData.errorCount} errors, ${avgResponseTime.toFixed(0)}ms avg`);
  }
}

/**
 * Breakpoint-focused workflow
 */
function performBreakpointWorkflow(data, loadLevel, currentVUs) {
  try {
    // Adjust operation complexity based on load level
    if (loadLevel <= 3) {
      return performCompleteWorkflow(data, loadLevel);
    } else if (loadLevel <= 6) {
      return performReducedWorkflow(data, loadLevel);
    } else {
      return performMinimalWorkflow(data, loadLevel);
    }
    
  } catch (error) {
    console.error(`💥 Breakpoint workflow error at level ${loadLevel}:`, error.message);
    return false;
  }
}

/**
 * Complete workflow for lower load levels
 */
function performCompleteWorkflow(data, loadLevel) {
  const uniqueId = `bp${loadLevel}_${__VU}_${__ITER}_${Date.now()}`;
  const testUser = {
    username: `bpuser_${uniqueId}`,
    password: 'breakpoint123',
    name: `Breakpoint User L${loadLevel} ${uniqueId}`
  };
  
  console.log(`🔧 [Level ${loadLevel}] Complete workflow for: ${testUser.username}`);
  
  // Full workflow: Register + Login + Create Contact
  const registerResponse = registerUser(testUser);
  const registerCheck = check(registerResponse, {
    'Breakpoint registration successful': (r) => r && r.status === 200,
    'Registration response time OK': (r) => r && r.timings.duration < 5000,
  }, { load_level: loadLevel, workflow: 'complete' });
  
  if (!registerCheck) {
    console.log(`❌ [Level ${loadLevel}] Registration failed: ${testUser.username}`);
    return false;
  }
  
  sleep(0.5);
  
  const loginResponse = loginUser({
    username: testUser.username,
    password: testUser.password
  });
  
  const loginCheck = check(loginResponse, {
    'Breakpoint login successful': (r) => r && r.status === 200,
    'Login response time OK': (r) => r && r.timings.duration < 5000,
  }, { load_level: loadLevel });
  
  if (!loginCheck) {
    console.log(`❌ [Level ${loadLevel}] Login failed: ${testUser.username}`);
    return false;
  }
  
  const token = loginResponse.json().data.token;
  sleep(0.5);
  
  const contactResponse = createContact({
    first_name: `BP${loadLevel}`,
    last_name: `Contact`,
    email: `bp${loadLevel}.${uniqueId}@breakpoint.com`,
    phone: '081234567890'
  }, token);
  
  const contactCheck = check(contactResponse, {
    'Breakpoint contact creation successful': (r) => r && r.status === 200,
  }, { load_level: loadLevel });
  
  if (contactCheck) {
    console.log(`✅ [Level ${loadLevel}] Complete workflow successful: ${testUser.username}`);
    return true;
  }
  
  return false;
}

/**
 * Reduced workflow for medium load levels
 */
function performReducedWorkflow(data, loadLevel) {
  const uniqueId = `bp${loadLevel}_${__VU}_${Date.now()}`;
  const testUser = {
    username: `bpuser_${uniqueId}`,
    password: 'breakpoint123',
    name: `Breakpoint User L${loadLevel} ${uniqueId}`
  };
  
  console.log(`⚡ [Level ${loadLevel}] Reduced workflow for: ${testUser.username}`);
  
  // Reduced workflow: Register + Login only
  const registerResponse = registerUser(testUser);
  const registerCheck = check(registerResponse, {
    'BP reduced registration successful': (r) => r && r.status === 200,
  }, { load_level: loadLevel, workflow: 'reduced' });
  
  if (!registerCheck) {
    return false;
  }
  
  sleep(0.2);
  
  const loginResponse = loginUser({
    username: testUser.username,
    password: testUser.password
  });
  
  const loginCheck = check(loginResponse, {
    'BP reduced login successful': (r) => r && r.status === 200,
  }, { load_level: loadLevel });
  
  if (loginCheck) {
    console.log(`✅ [Level ${loadLevel}] Reduced workflow successful: ${testUser.username}`);
    return true;
  }
  
  return false;
}

/**
 * Minimal workflow for high load levels
 */
function performMinimalWorkflow(data, loadLevel) {
  const uniqueId = `bp${loadLevel}_${__VU}_${Date.now()}`;
  const testUser = {
    username: `bpuser_${uniqueId}`,
    password: 'breakpoint123',
    name: `Breakpoint User L${loadLevel} ${uniqueId}`
  };
  
  console.log(`🏃 [Level ${loadLevel}] Minimal workflow for: ${testUser.username}`);
  
  // Minimal workflow: Registration only
  const registerResponse = registerUser(testUser);
  const registerCheck = check(registerResponse, {
    'BP minimal registration successful': (r) => r && r.status === 200,
  }, { load_level: loadLevel, workflow: 'minimal' });
  
  if (registerCheck) {
    console.log(`✅ [Level ${loadLevel}] Minimal workflow successful: ${testUser.username}`);
    return true;
  }
  
  console.log(`❌ [Level ${loadLevel}] Minimal workflow failed: ${testUser.username}`);
  return false;
}

/**
 * Breakpoint test teardown
 */
export function teardown(data) {
  console.log('🏁 Breakpoint Test Complete');
  console.log('📈 Capacity Analysis Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log(`   • Load Levels Tested: ${Object.keys(data.performanceData).length}`);
  console.log(`   • Breaking Point Identified: ${data.breakpointIdentified ? 'YES' : 'NO'}`);
  
  console.log('📊 Performance by Load Level:');
  Object.keys(data.performanceData).forEach(level => {
    const levelData = data.performanceData[level];
    const total = levelData.successCount + levelData.errorCount;
    const errorRate = total > 0 ? (levelData.errorCount / total * 100).toFixed(1) : 0;
    const avgTime = levelData.responseTimes.length > 0 ? 
      (levelData.responseTimes.reduce((a, b) => a + b, 0) / levelData.responseTimes.length).toFixed(0) : 0;
    
    console.log(`   • Level ${level}: ${levelData.successCount}/${total} success (${errorRate}% errors), ${avgTime}ms avg`);
  });
  
  console.log('💡 Capacity Recommendations:');
  if (data.breakpointIdentified) {
    console.log('   • System breaking point identified - review infrastructure capacity');
    console.log('   • Consider horizontal scaling before reaching breaking point');
    console.log('   • Implement auto-scaling triggers based on load levels');
  } else {
    console.log('   • System handled all tested load levels');
    console.log('   • Consider testing higher loads to find actual limits');
    console.log('   • Current capacity appears adequate for tested scenarios');
  }
  console.log('   • Use performance data to set realistic capacity planning');
}
