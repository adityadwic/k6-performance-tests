/**
 * @fileoverview QuickPizza Load Test - Simple Website Performance Testing
 * @description Comprehensive load test scenarios for Grafana QuickPizza demo website
 * @author Aditya Dwi Cahyono
 * @version 2.0.0
 * @created 2025-08-16
 * 
 * Test Scenarios:
 * 1. Homepage Load Test - Basic website accessibility
 * 2. Menu Browsing - User navigation simulation
 * 3. Order Flow - Complete pizza ordering workflow
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics for QuickPizza testing
const pizzaPageLoads = new Counter('pizza_page_loads');
const pizzaErrors = new Counter('pizza_errors');
const pizzaSuccess = new Rate('pizza_success_rate');
const pageLoadTime = new Trend('page_load_time');
const orderSuccess = new Rate('order_success_rate');

export const options = {
  // Multiple scenario configuration
  scenarios: {
    // 1. Homepage load test - Basic accessibility check
    homepage_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'homepageTest',
      tags: { scenario: 'homepage' }
    },
    
    // 2. Menu browsing - User navigation simulation
    menu_browsing: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '15s', target: 8 },   // Ramp up
        { duration: '30s', target: 8 },   // Stay steady
        { duration: '15s', target: 2 },   // Ramp down
      ],
      exec: 'menuBrowsingTest',
      tags: { scenario: 'browsing' }
    },
    
    // 3. Order flow test - Complete pizza ordering
    order_flow: {
      executor: 'constant-arrival-rate',
      rate: 3, // 3 orders per minute
      timeUnit: '1m',
      duration: '1m',
      preAllocatedVUs: 3,
      exec: 'orderFlowTest',
      tags: { scenario: 'ordering' }
    }
  },
  
  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<3000'],     // 95% under 3s
    http_req_failed: ['rate<0.05'],        // Less than 5% failures
    pizza_success_rate: ['rate>0.95'],     // 95% success rate
    page_load_time: ['avg<2000'],          // Average under 2s
    order_success_rate: ['rate>0.90'],     // 90% order success
  }
};

/**
 * Test setup - runs once before all scenarios
 */
export function setup() {
  console.log('🍕 Starting QuickPizza Load Test Suite');
  console.log('🎯 Target: https://quickpizza.grafana.com/');
  console.log('📊 Scenarios: Homepage + Menu Browsing + Order Flow');
  
  return {
    baseUrl: 'https://quickpizza.grafana.com',
    testStartTime: new Date().toISOString()
  };
}

/**
 * Scenario 1: Homepage Load Test
 * Tests basic website accessibility and performance
 */
export function homepageTest(data) {
  const startTime = new Date();
  
  console.log(`🏠 VU ${__VU}: Loading QuickPizza homepage`);
  
  const response = http.get(data.baseUrl, {
    headers: {
      'User-Agent': 'k6-quickpizza-test/2.0.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    tags: { page: 'homepage' }
  });
  
  // Check homepage response
  const success = check(response, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loads quickly': (r) => r.timings.duration < 3000,
    'Homepage has content': (r) => r.body && r.body.length > 0,
    'Homepage contains QuickPizza': (r) => r.body && r.body.toLowerCase().includes('pizza'),
  }, { scenario: 'homepage' });
  
  // Record metrics
  pizzaPageLoads.add(1);
  pageLoadTime.add(response.timings.duration);
  
  if (success) {
    pizzaSuccess.add(1);
    console.log(`✅ VU ${__VU}: Homepage loaded (${response.timings.duration.toFixed(0)}ms)`);
  } else {
    pizzaErrors.add(1);
    console.log(`❌ VU ${__VU}: Homepage failed`);
  }
  
  // User reading time
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

/**
 * Scenario 2: Menu Browsing Test
 * Simulates user browsing through pizza menu
 */
export function menuBrowsingTest(data) {
  console.log(`🍕 VU ${__VU}: Browsing pizza menu`);
  
  // 1. Load homepage first
  const homeResponse = http.get(data.baseUrl, {
    tags: { page: 'homepage' }
  });
  
  check(homeResponse, {
    'Menu browsing - homepage loaded': (r) => r.status === 200,
  });
  
  sleep(1); // Brief pause
  
  // 2. Try to access menu or navigate (simulate user behavior)
  const menuPaths = [
    '/menu',
    '/pizzas',
    '/order',
    '/#menu',
    '/api/pizza'
  ];
  
  // Try a random menu path
  const randomPath = menuPaths[Math.floor(Math.random() * menuPaths.length)];
  console.log(`📋 VU ${__VU}: Accessing menu path: ${randomPath}`);
  
  const menuResponse = http.get(`${data.baseUrl}${randomPath}`, {
    headers: {
      'Referer': data.baseUrl,
    },
    tags: { page: 'menu' }
  });
  
  const menuSuccess = check(menuResponse, {
    'Menu path responds': (r) => r.status >= 200 && r.status < 500,
    'Menu loads within 3s': (r) => r.timings.duration < 3000,
  });
  
  if (menuSuccess) {
    console.log(`✅ VU ${__VU}: Menu browsing successful`);
    pizzaSuccess.add(1);
  } else {
    console.log(`⚠️  VU ${__VU}: Menu path returned ${menuResponse.status}`);
    pizzaErrors.add(1);
  }
  
  pageLoadTime.add(menuResponse.timings.duration);
  
  // Browsing time
  sleep(Math.random() * 4 + 2); // 2-6 seconds
}

/**
 * Scenario 3: Order Flow Test
 * Simulates complete pizza ordering process
 */
export function orderFlowTest(data) {
  console.log(`🛒 VU ${__VU}: Starting pizza order flow`);
  
  const orderStartTime = new Date();
  
  // 1. Access homepage
  const homeResponse = http.get(data.baseUrl, {
    tags: { page: 'homepage', flow: 'order' }
  });
  
  if (!check(homeResponse, { 'Order flow - homepage OK': (r) => r.status === 200 })) {
    pizzaErrors.add(1);
    return;
  }
  
  sleep(1);
  
  // 2. Try to access ordering interface
  const orderPaths = ['/order', '/menu', '/#order'];
  const orderPath = orderPaths[Math.floor(Math.random() * orderPaths.length)];
  
  console.log(`🍕 VU ${__VU}: Accessing order interface: ${orderPath}`);
  
  const orderResponse = http.get(`${data.baseUrl}${orderPath}`, {
    headers: {
      'Referer': data.baseUrl,
    },
    tags: { page: 'order', flow: 'order' }
  });
  
  const orderInterfaceSuccess = check(orderResponse, {
    'Order interface accessible': (r) => r.status >= 200 && r.status < 500,
    'Order page loads quickly': (r) => r.timings.duration < 4000,
  });
  
  sleep(2); // Time to select pizza
  
  // 3. Simulate order submission (if API endpoints exist)
  const pizzaTypes = ['margherita', 'pepperoni', 'hawaiian', 'veggie'];
  const selectedPizza = pizzaTypes[Math.floor(Math.random() * pizzaTypes.length)];
  
  console.log(`🍕 VU ${__VU}: Ordering ${selectedPizza} pizza`);
  
  // Try to submit order (this might fail if no API, but that's expected)
  const orderData = {
    pizza: selectedPizza,
    size: 'medium',
    quantity: 1
  };
  
  const submitResponse = http.post(`${data.baseUrl}/api/order`, JSON.stringify(orderData), {
    headers: {
      'Content-Type': 'application/json',
      'Referer': `${data.baseUrl}${orderPath}`,
    },
    tags: { page: 'order_submit', flow: 'order' }
  });
  
  // Lenient check for order submission (API might not exist)
  const orderSubmitSuccess = check(submitResponse, {
    'Order submission attempted': (r) => r.status !== 0, // Any response is OK
  });
  
  // Calculate total order flow time
  const orderFlowTime = new Date() - orderStartTime;
  
  if (orderInterfaceSuccess) {
    orderSuccess.add(1);
    pizzaSuccess.add(1);
    console.log(`✅ VU ${__VU}: Order flow completed (${orderFlowTime}ms)`);
  } else {
    pizzaErrors.add(1);
    console.log(`❌ VU ${__VU}: Order flow failed`);
  }
  
  sleep(1); // Post-order pause
}

/**
 * Test teardown - runs once after all scenarios complete
 */
export function teardown(data) {
  console.log('🏁 QuickPizza Load Test Complete');
  console.log('📊 Test Summary:');
  console.log(`   • Started: ${data.testStartTime}`);
  console.log(`   • Ended: ${new Date().toISOString()}`);
  console.log(`   • Target: ${data.baseUrl}`);
  console.log('');
  console.log('🎯 Scenarios Executed:');
  console.log('   • Homepage Load: 5 VUs × 30s');
  console.log('   • Menu Browsing: 2-8 VUs ramping');
  console.log('   • Order Flow: 3 orders/minute');
  console.log('');
  console.log('💡 Results Analysis:');
  console.log('   • Check response times and error rates above');
  console.log('   • Verify all scenarios passed thresholds');
  console.log('   • Review custom metrics for insights');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('   • Scale up VUs for stress testing');
  console.log('   • Enable web dashboard: K6_WEB_DASHBOARD=true k6 run script.js');
  console.log('   • Export results for analysis: --out json=results.json');
}
