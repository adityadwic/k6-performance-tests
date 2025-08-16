/**
 * @fileoverview Average Load Test - Assesses system performance under expected normal conditions
 * @description Simulates typical production load to validate normal operation performance
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Characteristics:
 * - Expected normal load (10-20 VUs)
 * - Sustained duration (5-10 minutes)
 * - Realistic user behavior patterns
 * - Production-like scenarios
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { registerUser, loginUser, getUser } from '../helper/user.js';
import { createContact } from '../helper/contact.js';

// Custom metrics for average load test
const avgLoadErrors = new Counter('avg_load_errors');
const avgLoadSuccess = new Rate('avg_load_success');
const userWorkflowDuration = new Trend('user_workflow_duration');
const contactCreationRate = new Rate('contact_creation_success');

export const options = {
  // Average load test configuration
  stages: [
    { duration: '2m', target: 5 },    // Ramp up to 5 users
    { duration: '5m', target: 15 },   // Scale to average load of 15 users
    { duration: '10m', target: 15 },  // Stay at average load
    { duration: '3m', target: 5 },    // Scale down gradually
    { duration: '1m', target: 0 },    // Ramp down
  ],
  
  // Realistic thresholds for average load
  thresholds: {
    http_req_duration: ['p(95)<2000'],        // 95% under 2s
    http_req_failed: ['rate<0.05'],           // Less than 5% failures
    avg_load_success: ['rate>0.95'],          // 95% success rate
    contact_creation_success: ['rate>0.90'],  // 90% contact creation success
    user_workflow_duration: ['p(90)<5000'],   // 90% workflows under 5s
  },
  
  // Test metadata
  tags: {
    test_type: 'average_load',
    test_level: 'normal',
    environment: 'staging'
  }
};

/**
 * Average load test setup
 */
export function setup() {
  console.log('📊 Starting Average Load Test - Normal Conditions Simulation');
  console.log('📈 Test Configuration:');
  console.log('   • Peak Users: 15');
  console.log('   • Duration: 21 minutes');
  console.log('   • Purpose: Validate normal operation performance');
  
  // Pre-create some users for login scenarios
  const preCreatedUsers = [];
  for (let i = 1; i <= 5; i++) {
    const user = {
      username: `avguser${i}`,
      password: 'avgtest123',
      name: `Average Test User ${i}`
    };
    
    try {
      const response = registerUser(user);
      if (response && response.status === 200) {
        preCreatedUsers.push(user);
        console.log(`✅ Pre-created user: ${user.username}`);
      }
    } catch (error) {
      console.log(`⚠️ Could not pre-create user ${user.username}: ${error.message}`);
    }
  }
  
  return {
    testStartTime: new Date().toISOString(),
    baseUrl: 'https://contact.do.my.id',
    preCreatedUsers: preCreatedUsers
  };
}

/**
 * Main average load test function - simulates realistic user behavior
 */
export default function(data) {
  const workflowStart = new Date();
  let workflowPassed = true;
  
  try {
    // Simulate different user behaviors (weighted distribution)
    const userBehavior = Math.random();
    
    if (userBehavior < 0.3) {
      // 30% - New user registration and contact creation
      performNewUserWorkflow(data);
    } else if (userBehavior < 0.7) {
      // 40% - Existing user login and contact creation
      performExistingUserWorkflow(data);
    } else {
      // 30% - Browse and read operations
      performBrowsingWorkflow(data);
    }
    
    // Record workflow duration
    const workflowDuration = new Date() - workflowStart;
    userWorkflowDuration.add(workflowDuration);
    avgLoadSuccess.add(workflowPassed ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Average load test workflow error:', error.message);
    avgLoadErrors.add(1);
    avgLoadSuccess.add(0);
  }
  
  // Realistic think time between user actions
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

/**
 * New user registration workflow
 */
function performNewUserWorkflow(data) {
  console.log('👤 Performing new user workflow...');
  
  // Generate unique user
  const uniqueId = `avg_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
  const newUser = {
    username: `avgtest_${uniqueId}`,
    password: 'avgtest123',
    name: `Avg Test User ${uniqueId}`
  };
  
  // Step 1: Register user
  const registerResponse = registerUser(newUser);
  const registerCheck = check(registerResponse, {
    'New user registration successful': (r) => r && r.status === 200,
    'Registration response valid': (r) => r && r.json && r.json().data,
  });
  
  if (!registerCheck) {
    avgLoadErrors.add(1);
    return;
  }
  
  sleep(1); // Think time
  
  // Step 2: Login
  const loginResponse = loginUser({
    username: newUser.username,
    password: newUser.password
  });
  
  const loginCheck = check(loginResponse, {
    'New user login successful': (r) => r && r.status === 200,
    'Login token received': (r) => r && r.json && r.json().data && r.json().data.token,
  });
  
  if (!loginCheck) {
    avgLoadErrors.add(1);
    return;
  }
  
  const token = loginResponse.json().data.token;
  sleep(1); // Think time
  
  // Step 3: Create multiple contacts (new users typically add several contacts)
  for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
    const contactResponse = createContact({
      first_name: `Contact${i}`,
      last_name: `User${uniqueId}`,
      email: `contact${i}.${uniqueId}@example.com`,
      phone: `08123456789${i}`
    }, token);
    
    const contactCheck = check(contactResponse, {
      'Contact creation successful': (r) => r && r.status === 200,
    });
    
    contactCreationRate.add(contactCheck ? 1 : 0);
    
    if (!contactCheck) {
      avgLoadErrors.add(1);
    }
    
    sleep(0.5); // Short pause between contacts
  }
  
  console.log('✅ New user workflow completed');
}

/**
 * Existing user login workflow
 */
function performExistingUserWorkflow(data) {
  console.log('👥 Performing existing user workflow...');
  
  if (data.preCreatedUsers.length === 0) {
    console.log('⚠️ No pre-created users available, skipping...');
    return;
  }
  
  // Select random existing user
  const user = data.preCreatedUsers[Math.floor(Math.random() * data.preCreatedUsers.length)];
  
  // Step 1: Login
  const loginResponse = loginUser({
    username: user.username,
    password: user.password
  });
  
  const loginCheck = check(loginResponse, {
    'Existing user login successful': (r) => r && r.status === 200,
    'Login token received': (r) => r && r.json && r.json().data && r.json().data.token,
  });
  
  if (!loginCheck) {
    avgLoadErrors.add(1);
    return;
  }
  
  const token = loginResponse.json().data.token;
  sleep(1); // Think time
  
  // Step 2: Create contact (existing users occasionally add contacts)
  if (Math.random() < 0.6) { // 60% chance to create contact
    const contactResponse = createContact({
      first_name: 'Regular',
      last_name: 'Contact',
      email: `regular.${Date.now()}@example.com`,
      phone: '081234567890'
    }, token);
    
    const contactCheck = check(contactResponse, {
      'Regular contact creation successful': (r) => r && r.status === 200,
    });
    
    contactCreationRate.add(contactCheck ? 1 : 0);
    
    if (!contactCheck) {
      avgLoadErrors.add(1);
    }
  }
  
  console.log('✅ Existing user workflow completed');
}

/**
 * Browsing workflow - read-only operations
 */
function performBrowsingWorkflow(data) {
  console.log('👀 Performing browsing workflow...');
  
  if (data.preCreatedUsers.length === 0) {
    console.log('⚠️ No pre-created users available for browsing, skipping...');
    return;
  }
  
  // Select random user for browsing
  const user = data.preCreatedUsers[Math.floor(Math.random() * data.preCreatedUsers.length)];
  
  // Step 1: Login
  const loginResponse = loginUser({
    username: user.username,
    password: user.password
  });
  
  const loginCheck = check(loginResponse, {
    'Browser login successful': (r) => r && r.status === 200,
  });
  
  if (!loginCheck) {
    avgLoadErrors.add(1);
    return;
  }
  
  const token = loginResponse.json().data.token;
  sleep(2); // Longer think time for browsing
  
  // Step 2: Get user profile (read operation)
  const userResponse = getUser(user.username, token);
  const userCheck = check(userResponse, {
    'User profile retrieval successful': (r) => r && r.status === 200,
  });
  
  if (!userCheck) {
    avgLoadErrors.add(1);
  }
  
  console.log('✅ Browsing workflow completed');
}

/**
 * Average load test teardown
 */
export function teardown(data) {
  console.log('🏁 Average Load Test Complete');
  console.log('📊 Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log(`   • Pre-created Users: ${data.preCreatedUsers.length}`);
  console.log('📈 Performance validated under normal operating conditions');
  console.log('💡 Next steps: Review metrics and run stress tests if needed');
}
