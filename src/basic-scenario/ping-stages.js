/**
 * Comprehensive API Performance Testing Suite
 * Multi-scenario testing for different load patterns
 * 
 * @description This suite includes 7 different testing scenarios:
 * 1. Ramping Test - Gradual load increase/decrease
 * 2. Spike Test - Sudden load spikes
 * 3. Stress Test - Maximum load capacity
 * 4. Soak Test - Extended duration testing
 * 5. Load Test - Normal operational load
 * 6. Volume Test - High iteration count
 * 7. Breakpoint Test - Find system limits
 * 
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 */

import http from 'k6/http';
import { sleep, check } from 'k6';

// Comprehensive performance test configuration
export const options = {
    scenarios: {
        // 1. Ramping Test: Gradual load increase and decrease
        ramping_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 10 },  // Ramp up to 10 users
                { duration: '30s', target: 30 },  // Ramp up to 30 users
                { duration: '1m', target: 20 },   // Stabilize at 20 users
                { duration: '20s', target: 0 },   // Ramp down to 0 users
            ],
            exec: 'rampingTest',
        },
        
        // 2. Spike Test: Sudden load increase
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 5,
            stages: [
                { duration: '5s', target: 5 },    // Baseline load
                { duration: '5s', target: 100 },  // Sudden spike
                { duration: '10s', target: 100 }, // Hold spike load
                { duration: '5s', target: 5 },    // Return to baseline
            ],
            exec: 'spikeTest',
        },
        
        // 3. Stress Test: Maximum load capacity
        stress_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '15s', target: 50 },  // Gradual increase
                { duration: '30s', target: 80 },  // Higher load
                { duration: '1m', target: 100 },  // Maximum load
                { duration: '15s', target: 0 },   // Cool down
            ],
            exec: 'stressTest',
        },
        
        // 4. Soak Test: Extended duration with stable load
        soak_test: {
            executor: 'constant-vus',
            vus: 15,
            duration: '3m',
            exec: 'soakTest',
        },
        
        // 5. Load Test: Normal operational load
        load_test: {
            executor: 'constant-vus',
            vus: 25,
            duration: '2m',
            exec: 'loadTest',
        },
        
        // 6. Volume Test: High iteration count with few users
        volume_test: {
            executor: 'per-vu-iterations',
            vus: 5,
            iterations: 200,
            maxDuration: '3m',
            exec: 'volumeTest',
        },
        
        // 7. Breakpoint Test: Find system breaking point
        breakpoint_test: {
            executor: 'ramping-arrival-rate',
            startRate: 10,
            timeUnit: '1s',
            stages: [
                { duration: '30s', target: 10 },  // 10 req/s
                { duration: '30s', target: 50 },  // 50 req/s
                { duration: '30s', target: 100 }, // 100 req/s
                { duration: '30s', target: 200 }, // 200 req/s
                { duration: '30s', target: 300 }, // 300 req/s
            ],
            preAllocatedVUs: 50,
            maxVUs: 100,
            exec: 'breakpointTest',
        },
    },
    
    // Performance thresholds
    thresholds: {
        'http_req_duration': ['p(95) < 500'],   // 95% requests under 500ms
        'http_req_failed': ['rate < 0.1'],      // Error rate under 10%
        'http_reqs': ['rate > 10'],             // Minimum 10 req/s
        'checks': ['rate > 0.95'],              // 95% of checks pass
    },
};

/**
 * Base ping test function
 * @param {string} testType - Type of test being performed
 */
function performPingTest(testType) {
    const response = http.get('http://localhost:3000/ping');
    
    check(response, { 
        [`${testType} - Status is 200`]: (r) => r.status === 200,
        [`${testType} - Response time < 500ms`]: (r) => r.timings.duration < 500,
        [`${testType} - Content is valid`]: (r) => r.body.includes('pong') || r.body.length > 0,
    });
    
    sleep(0.1); // Small delay between requests
}

/**
 * Ramping Test - Gradual load increase and decrease
 */
export function rampingTest() {
    performPingTest('Ramping');
}

/**
 * Spike Test - Sudden load spikes
 */
export function spikeTest() {
    performPingTest('Spike');
}

/**
 * Stress Test - Maximum load capacity testing
 */
export function stressTest() {
    performPingTest('Stress');
}

/**
 * Soak Test - Extended duration testing
 */
export function soakTest() {
    performPingTest('Soak');
}

/**
 * Load Test - Normal operational load
 */
export function loadTest() {
    performPingTest('Load');
}

/**
 * Volume Test - High iteration count
 */
export function volumeTest() {
    performPingTest('Volume');
}

/**
 * Breakpoint Test - Find system limits
 */
export function breakpointTest() {
    performPingTest('Breakpoint');
}
