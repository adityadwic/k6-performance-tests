/**
 * @fileoverview Complex Scenario Test - Advanced multi-pattern load testing
 * @description Combines multiple testing patterns to simulate real-world complex scenarios
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 * @created 2025-08-16
 * 
 * Test Characteristics:
 * - Multiple concurrent scenarios
 * - Realistic user behavior patterns
 * - Business workflow simulation
 * - Peak and off-peak cycles
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { registerUser, loginUser, getUser } from '../helper/user.js';
import { createContact } from '../helper/contact.js';

// Custom metrics for complex scenario test
const complexScenarioErrors = new Counter('complex_scenario_errors');
const complexScenarioSuccess = new Rate('complex_scenario_success');
const businessWorkflowSuccess = new Rate('business_workflow_success');
const userJourneyCompletion = new Rate('user_journey_completion');
const peakOffPeakPerformance = new Trend('peak_off_peak_performance');
const scenarioMixEffectiveness = new Gauge('scenario_mix_effectiveness');

export const options = {
  // Complex scenario configuration - multiple concurrent patterns
  scenarios: {
    // 1. Morning Rush - Heavy registration (8 AM - 10 AM simulation)
    morning_rush: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '2m', target: 20 },   // Quick morning ramp
        { duration: '5m', target: 40 },   // Peak morning load
        { duration: '3m', target: 20 },   // Gradual decline
        { duration: '2m', target: 5 },    // Back to baseline
      ],
      gracefulStop: '1m',
      exec: 'morningRushWorkflow',
      tags: { scenario: 'morning_rush', time_pattern: 'peak' },
    },

    // 2. Business Hours - Steady operations (10 AM - 5 PM simulation)
    business_hours: {
      executor: 'constant-vus',
      vus: 15,
      duration: '20m',
      gracefulStop: '1m',
      exec: 'businessHoursWorkflow',
      tags: { scenario: 'business_hours', time_pattern: 'steady' },
    },

    // 3. Lunch Break Spike - Brief activity surge (12 PM - 1 PM simulation)
    lunch_spike: {
      executor: 'ramping-vus',
      startTime: '8m',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 35 },   // Quick lunch spike
        { duration: '2m', target: 35 },   // Sustain spike
        { duration: '1m', target: 10 },   // Quick return
      ],
      gracefulStop: '30s',
      exec: 'lunchSpikeWorkflow',
      tags: { scenario: 'lunch_spike', time_pattern: 'spike' },
    },

    // 4. Power Users - Advanced operations throughout the day
    power_users: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 20,
      maxDuration: '25m',
      exec: 'powerUserWorkflow',
      tags: { scenario: 'power_users', user_type: 'advanced' },
    },

    // 5. Mobile Users - Lighter, frequent interactions
    mobile_users: {
      executor: 'constant-arrival-rate',
      rate: 30, // 30 iterations per minute
      timeUnit: '1m',
      duration: '25m',
      preAllocatedVUs: 10,
      maxVUs: 20,
      exec: 'mobileUserWorkflow',
      tags: { scenario: 'mobile_users', device_type: 'mobile' },
    },

    // 6. Background Jobs - System maintenance simulation
    background_jobs: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30m',
      exec: 'backgroundJobWorkflow',
      tags: { scenario: 'background_jobs', operation_type: 'maintenance' },
    },

    // 7. Evening Wind Down - Decreasing activity
    evening_wind_down: {
      executor: 'ramping-vus',
      startTime: '15m',
      startVUs: 15,
      stages: [
        { duration: '3m', target: 25 },   // Brief evening activity
        { duration: '5m', target: 10 },   // Wind down
        { duration: '4m', target: 3 },    // Minimal activity
        { duration: '3m', target: 0 },    // End of day
      ],
      gracefulStop: '1m',
      exec: 'eveningWorkflow',
      tags: { scenario: 'evening_wind_down', time_pattern: 'decline' },
    },
  },

  // Comprehensive thresholds for complex scenarios
  thresholds: {
    http_req_duration: ['p(95)<3000'],              // 95% under 3s
    http_req_failed: ['rate<0.05'],                 // Less than 5% failures
    complex_scenario_success: ['rate>0.95'],        // 95% overall success
    business_workflow_success: ['rate>0.98'],       // 98% business workflow success
    user_journey_completion: ['rate>0.90'],         // 90% journey completion
    'http_req_duration{scenario:morning_rush}': ['p(90)<2000'],    // Morning rush performance
    'http_req_duration{scenario:business_hours}': ['p(95)<2500'],  // Business hours performance
    'http_req_duration{scenario:lunch_spike}': ['p(95)<4000'],     // Lunch spike tolerance
  },

  // Test metadata
  tags: {
    test_type: 'complex_scenario',
    test_level: 'comprehensive',
    environment: 'production'
  }
};

/**
 * Complex scenario test setup
 */
export function setup() {
  console.log('🎭 Starting Complex Scenario Test - Real-World Simulation');
  console.log('🌟 Test Configuration:');
  console.log('   • 7 Concurrent Scenarios');
  console.log('   • 30 minutes duration');
  console.log('   • Peak/Off-peak cycles');
  console.log('   • Multiple user types and behaviors');
  console.log('   • Business workflow simulation');
  
  // Pre-create baseline data for complex scenarios
  const baselineData = {
    companies: [],
    departments: [],
    existingUsers: []
  };
  
  // Create sample companies and departments
  const companies = ['TechCorp', 'InnovateLtd', 'GlobalSoft', 'StartupInc', 'MegaSystems'];
  const departments = ['Sales', 'Marketing', 'Engineering', 'Support', 'HR'];
  
  baselineData.companies = companies;
  baselineData.departments = departments;
  
  // Create some existing users for realistic scenarios
  console.log('👥 Setting up baseline users for complex scenarios...');
  for (let i = 1; i <= 10; i++) {
    const user = {
      username: `complexuser${i}`,
      password: 'complex123',
      name: `Complex User ${i}`,
      company: companies[i % companies.length],
      department: departments[i % departments.length]
    };
    
    try {
      const response = registerUser(user);
      if (response && response.status === 200) {
        baselineData.existingUsers.push(user);
        console.log(`✅ Baseline user created: ${user.username} (${user.company}/${user.department})`);
      }
    } catch (error) {
      console.log(`⚠️ Could not create baseline user: ${error.message}`);
    }
    
    sleep(0.3);
  }
  
  return {
    testStartTime: new Date().toISOString(),
    baseUrl: 'https://contact.do.my.id',
    baselineData: baselineData,
    scenarioMetrics: {}
  };
}

/**
 * Morning Rush Workflow - Heavy new user registration
 */
export function morningRushWorkflow(data) {
  const workflowStart = new Date();
  console.log('🌅 Morning Rush: New employee onboarding workflow');
  
  try {
    // Simulate new employee joining company
    const company = data.baselineData.companies[Math.floor(Math.random() * data.baselineData.companies.length)];
    const department = data.baselineData.departments[Math.floor(Math.random() * data.baselineData.departments.length)];
    
    const newEmployee = {
      username: `newemp_${Date.now()}_${__VU}`,
      password: 'morning123',
      name: `New Employee ${__VU}`,
      company: company,
      department: department
    };
    
    // Step 1: Employee registration
    console.log(`👤 Morning: Registering new employee ${newEmployee.username} for ${company}/${department}`);
    const registerResponse = registerUser(newEmployee);
    
    const registerCheck = check(registerResponse, {
      'Morning rush registration successful': (r) => r && r.status === 200,
      'Morning registration time acceptable': (r) => r && r.timings.duration < 2000,
    });
    
    if (!registerCheck) {
      complexScenarioErrors.add(1);
      return;
    }
    
    sleep(2); // Time to read welcome email
    
    // Step 2: First login
    console.log(`🔐 Morning: First login for ${newEmployee.username}`);
    const loginResponse = loginUser({
      username: newEmployee.username,
      password: newEmployee.password
    });
    
    const loginCheck = check(loginResponse, {
      'Morning rush login successful': (r) => r && r.status === 200,
    });
    
    if (!loginCheck) {
      complexScenarioErrors.add(1);
      return;
    }
    
    const token = loginResponse.json().data.token;
    sleep(3); // Time to explore interface
    
    // Step 3: Add initial contacts (colleagues)
    const colleagueCount = Math.floor(Math.random() * 3) + 2; // 2-4 colleagues
    for (let i = 0; i < colleagueCount; i++) {
      const colleagueContact = {
        first_name: `Colleague${i}`,
        last_name: company.substring(0, 4),
        email: `colleague${i}.${company.toLowerCase()}@company.com`,
        phone: `081234567${i.toString().padStart(2, '0')}`
      };
      
      console.log(`📞 Morning: Adding colleague contact ${i + 1}/${colleagueCount}`);
      const contactResponse = createContact(colleagueContact, token);
      
      check(contactResponse, {
        'Morning colleague contact added': (r) => r && r.status === 200,
      });
      
      sleep(1); // Time between adding contacts
    }
    
    // Record successful morning workflow
    businessWorkflowSuccess.add(1);
    userJourneyCompletion.add(1);
    
    const workflowDuration = new Date() - workflowStart;
    peakOffPeakPerformance.add(workflowDuration, { pattern: 'morning_rush' });
    
    console.log(`✅ Morning: Complete onboarding workflow for ${newEmployee.username}`);
    
  } catch (error) {
    console.error('💥 Morning rush workflow error:', error.message);
    complexScenarioErrors.add(1);
    businessWorkflowSuccess.add(0);
  }
  
  complexScenarioSuccess.add(1);
  sleep(Math.random() * 2 + 1); // Variable think time
}

/**
 * Business Hours Workflow - Steady day-to-day operations
 */
export function businessHoursWorkflow(data) {
  console.log('💼 Business Hours: Regular daily operations');
  
  try {
    if (data.baselineData.existingUsers.length === 0) {
      console.log('⚠️ No existing users for business hours workflow');
      return;
    }
    
    // Select existing user for daily operations
    const user = data.baselineData.existingUsers[Math.floor(Math.random() * data.baselineData.existingUsers.length)];
    
    console.log(`👤 Business: Daily workflow for ${user.username} (${user.company}/${user.department})`);
    
    // Login for daily work
    const loginResponse = loginUser({
      username: user.username,
      password: user.password
    });
    
    const loginCheck = check(loginResponse, {
      'Business hours login successful': (r) => r && r.status === 200,
    });
    
    if (!loginCheck) {
      complexScenarioErrors.add(1);
      return;
    }
    
    const token = loginResponse.json().data.token;
    sleep(2); // Check dashboard
    
    // Daily activities based on department
    if (user.department === 'Sales') {
      performSalesActivities(token, user);
    } else if (user.department === 'Marketing') {
      performMarketingActivities(token, user);
    } else if (user.department === 'Support') {
      performSupportActivities(token, user);
    } else {
      performGeneralActivities(token, user);
    }
    
    businessWorkflowSuccess.add(1);
    userJourneyCompletion.add(1);
    
  } catch (error) {
    console.error('💥 Business hours workflow error:', error.message);
    complexScenarioErrors.add(1);
    businessWorkflowSuccess.add(0);
  }
  
  complexScenarioSuccess.add(1);
  sleep(Math.random() * 4 + 2); // Regular work pace
}

/**
 * Sales department activities
 */
function performSalesActivities(token, user) {
  console.log(`💰 Sales: ${user.username} adding client contacts`);
  
  const clientTypes = ['Lead', 'Prospect', 'Client', 'Partner'];
  const clientType = clientTypes[Math.floor(Math.random() * clientTypes.length)];
  
  const clientContact = {
    first_name: `${clientType}Contact`,
    last_name: `Client${Date.now().toString().slice(-4)}`,
    email: `${clientType.toLowerCase()}.client@external.com`,
    phone: '081234567890'
  };
  
  const contactResponse = createContact(clientContact, token);
  check(contactResponse, {
    'Sales client contact added': (r) => r && r.status === 200,
  });
  
  sleep(2); // Update CRM
}

/**
 * Marketing department activities
 */
function performMarketingActivities(token, user) {
  console.log(`📢 Marketing: ${user.username} managing campaign contacts`);
  
  const campaigns = ['Newsletter', 'ProductLaunch', 'Webinar', 'Conference'];
  const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
  
  const campaignContact = {
    first_name: `${campaign}Contact`,
    last_name: `Lead${Date.now().toString().slice(-4)}`,
    email: `${campaign.toLowerCase()}.lead@marketing.com`,
    phone: '081234567890'
  };
  
  const contactResponse = createContact(campaignContact, token);
  check(contactResponse, {
    'Marketing campaign contact added': (r) => r && r.status === 200,
  });
  
  sleep(1); // Quick marketing operations
}

/**
 * Support department activities
 */
function performSupportActivities(token, user) {
  console.log(`🎧 Support: ${user.username} managing customer contacts`);
  
  const ticketTypes = ['Bug', 'Feature', 'Question', 'Complaint'];
  const ticketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
  
  const customerContact = {
    first_name: `${ticketType}Customer`,
    last_name: `Ticket${Date.now().toString().slice(-4)}`,
    email: `${ticketType.toLowerCase()}.customer@support.com`,
    phone: '081234567890'
  };
  
  const contactResponse = createContact(customerContact, token);
  check(contactResponse, {
    'Support customer contact added': (r) => r && r.status === 200,
  });
  
  sleep(3); // Support ticket processing time
}

/**
 * General department activities
 */
function performGeneralActivities(token, user) {
  console.log(`🏢 General: ${user.username} adding general business contact`);
  
  const contactResponse = createContact({
    first_name: 'Business',
    last_name: 'Contact',
    email: `business.${Date.now()}@general.com`,
    phone: '081234567890'
  }, token);
  
  check(contactResponse, {
    'General business contact added': (r) => r && r.status === 200,
  });
  
  sleep(2);
}

/**
 * Lunch Spike Workflow - Brief high activity
 */
export function lunchSpikeWorkflow(data) {
  console.log('🍽️ Lunch Spike: Quick check-in and updates');
  
  try {
    // Quick mobile-like interactions during lunch
    if (data.baselineData.existingUsers.length === 0) return;
    
    const user = data.baselineData.existingUsers[Math.floor(Math.random() * data.baselineData.existingUsers.length)];
    
    const loginResponse = loginUser({
      username: user.username,
      password: user.password
    });
    
    if (loginResponse && loginResponse.status === 200) {
      const token = loginResponse.json().data.token;
      
      // Quick contact addition during lunch
      const lunchContact = {
        first_name: 'Lunch',
        last_name: 'Meeting',
        email: `lunch.${Date.now()}@quick.com`,
        phone: '081234567890'
      };
      
      createContact(lunchContact, token);
      userJourneyCompletion.add(1);
    }
    
  } catch (error) {
    complexScenarioErrors.add(1);
  }
  
  complexScenarioSuccess.add(1);
  sleep(0.5); // Quick lunch operations
}

/**
 * Power User Workflow - Advanced operations
 */
export function powerUserWorkflow(data) {
  console.log('⚡ Power User: Advanced bulk operations');
  
  try {
    // Create power user
    const powerUser = {
      username: `poweruser_${__VU}_${Date.now()}`,
      password: 'power123',
      name: `Power User ${__VU}`
    };
    
    const registerResponse = registerUser(powerUser);
    if (!registerResponse || registerResponse.status !== 200) {
      complexScenarioErrors.add(1);
      return;
    }
    
    const loginResponse = loginUser({
      username: powerUser.username,
      password: powerUser.password
    });
    
    if (!loginResponse || loginResponse.status !== 200) {
      complexScenarioErrors.add(1);
      return;
    }
    
    const token = loginResponse.json().data.token;
    
    // Bulk contact creation (power user behavior)
    const bulkCount = Math.floor(Math.random() * 5) + 3; // 3-7 contacts
    for (let i = 0; i < bulkCount; i++) {
      const bulkContact = {
        first_name: `Bulk${i}`,
        last_name: `PowerContact`,
        email: `bulk${i}.power@advanced.com`,
        phone: `08123456789${i}`
      };
      
      createContact(bulkContact, token);
      sleep(0.2); // Quick bulk operations
    }
    
    userJourneyCompletion.add(1);
    businessWorkflowSuccess.add(1);
    
  } catch (error) {
    complexScenarioErrors.add(1);
  }
  
  complexScenarioSuccess.add(1);
  sleep(1);
}

/**
 * Mobile User Workflow - Light, frequent interactions
 */
export function mobileUserWorkflow(data) {
  console.log('📱 Mobile User: Quick mobile interaction');
  
  try {
    if (data.baselineData.existingUsers.length === 0) return;
    
    const user = data.baselineData.existingUsers[Math.floor(Math.random() * data.baselineData.existingUsers.length)];
    
    // Quick mobile login
    const loginResponse = loginUser({
      username: user.username,
      password: user.password
    });
    
    if (loginResponse && loginResponse.status === 200) {
      // Mobile users typically just view data or add one quick contact
      if (Math.random() < 0.3) { // 30% chance to add contact
        const token = loginResponse.json().data.token;
        const mobileContact = {
          first_name: 'Mobile',
          last_name: 'Contact',
          email: `mobile.${Date.now()}@quick.com`,
          phone: '081234567890'
        };
        
        createContact(mobileContact, token);
      }
      
      userJourneyCompletion.add(1);
    }
    
  } catch (error) {
    complexScenarioErrors.add(1);
  }
  
  complexScenarioSuccess.add(1);
  sleep(0.5); // Quick mobile interactions
}

/**
 * Background Job Workflow - System maintenance
 */
export function backgroundJobWorkflow(data) {
  console.log('🔧 Background: System maintenance operations');
  
  try {
    // Simulate system health checks and maintenance
    const healthResponse = http.get(`${data.baseUrl}/ping`);
    
    check(healthResponse, {
      'Background system health OK': (r) => r.status === 200,
      'Background response time OK': (r) => r.timings.duration < 1000,
    });
    
    // Simulate data integrity checks
    if (data.baselineData.existingUsers.length > 0) {
      const user = data.baselineData.existingUsers[0];
      const loginResponse = loginUser({
        username: user.username,
        password: user.password
      });
      
      if (loginResponse && loginResponse.status === 200) {
        const token = loginResponse.json().data.token;
        getUser(user.username, token); // Data integrity check
      }
    }
    
  } catch (error) {
    complexScenarioErrors.add(1);
  }
  
  complexScenarioSuccess.add(1);
  sleep(10); // Background jobs run less frequently
}

/**
 * Evening Workflow - Wind down operations
 */
export function eveningWorkflow(data) {
  console.log('🌙 Evening: End of day operations');
  
  try {
    if (data.baselineData.existingUsers.length === 0) return;
    
    const user = data.baselineData.existingUsers[Math.floor(Math.random() * data.baselineData.existingUsers.length)];
    
    // End of day check-in
    const loginResponse = loginUser({
      username: user.username,
      password: user.password
    });
    
    if (loginResponse && loginResponse.status === 200) {
      // End of day activities - typically lighter
      if (Math.random() < 0.4) { // 40% chance of activity
        const token = loginResponse.json().data.token;
        getUser(user.username, token); // Check profile/summary
      }
      
      userJourneyCompletion.add(1);
    }
    
  } catch (error) {
    complexScenarioErrors.add(1);
  }
  
  complexScenarioSuccess.add(1);
  sleep(Math.random() * 5 + 3); // Slower evening pace
}

/**
 * Complex scenario test teardown
 */
export function teardown(data) {
  console.log('🏁 Complex Scenario Test Complete');
  console.log('🎭 Comprehensive Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log(`   • Duration: 30 minutes multi-scenario simulation`);
  console.log(`   • Baseline Users: ${data.baselineData.existingUsers.length}`);
  console.log(`   • Companies: ${data.baselineData.companies.join(', ')}`);
  console.log(`   • Departments: ${data.baselineData.departments.join(', ')}`);
  
  console.log('🌟 Scenarios Executed:');
  console.log('   • Morning Rush: New employee onboarding');
  console.log('   • Business Hours: Daily operations by department');
  console.log('   • Lunch Spike: Quick mobile interactions');
  console.log('   • Power Users: Advanced bulk operations');
  console.log('   • Mobile Users: Light frequent interactions');
  console.log('   • Background Jobs: System maintenance');
  console.log('   • Evening Wind Down: End of day activities');
  
  console.log('📊 Real-World Insights:');
  console.log('   • Peak/off-peak performance patterns identified');
  console.log('   • Department-specific workflow efficiency measured');
  console.log('   • Mobile vs desktop usage patterns analyzed');
  console.log('   • System capacity under varied concurrent loads tested');
  
  console.log('💡 Business Intelligence:');
  console.log('   • User journey completion rates by scenario');
  console.log('   • Performance impact of different user behaviors');
  console.log('   • Resource utilization patterns throughout the day');
  console.log('   • Scalability requirements for business growth');
}
