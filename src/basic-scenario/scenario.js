/**
 * K6 Performance Test Scenario
 * Multi-scenario load testing for User Registration and Contact Creation
 * 
 * @description This file contains performance testing scenarios for:
 * 1. User Registration - Tests user signup functionality under load
 * 2. Contact Creation - Tests contact creation with authenticated users
 * 
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 */

import { registerUser, loginUser } from "../helper/user.js";
import { createContact } from "../helper/contact.js";
import { sleep } from "k6";
import execution from "k6/execution";
import { Counter } from "k6/metrics";

// Performance test configuration
export const options = {
    // Performance thresholds for success criteria
    thresholds: {
        'user_registration_success': ['count >= 95'],
        'user_registration_errors': ['count <= 5'],
        'contact_creation_success': ['count >= 45'],
        'http_req_duration': ['p(95) < 500'],
        'http_req_failed': ['rate < 0.05']
    },
    
    // Test scenarios configuration
    scenarios: {
        userRegistration: {
            exec: 'userRegistration',
            executor: 'shared-iterations',
            vus: 5,
            iterations: 100,
            maxDuration: '30s',
            gracefulStop: '10s'
        },
        contactCreation: {
            exec: 'contactCreation', 
            executor: 'constant-vus',
            vus: 5,
            duration: '30s',
            gracefulStop: '10s'
        }
    }
};

// Custom metrics for monitoring
const userRegistrationSuccess = new Counter("user_registration_success");
const userRegistrationErrors = new Counter("user_registration_errors");
const contactCreationSuccess = new Counter("contact_creation_success");

/**
 * User Registration Scenario
 * Tests the user registration endpoint under concurrent load
 */
export function userRegistration() {
    // Generate unique user identifier to prevent conflicts
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 100000);
    const vuId = execution.vu.idInTest;
    const iterationId = execution.scenario.iterationInTest;
    const uniqueID = `${timestamp}-${randomNum}-${vuId}-${iterationId}`;
    
    // User registration payload
    const registerRequest = {
        username: `user-${uniqueID}`,
        password: 'rahasia',
        name: 'Test User'
    };

    console.log(`🔄 Registering user: ${registerRequest.username}`);
    const response = registerUser(registerRequest);

    // Track registration results
    if (response.status === 200) {
        console.log(`✅ User registered successfully: ${registerRequest.username}`);
        userRegistrationSuccess.add(1);
    } else {
        console.log(`❌ Registration failed: ${registerRequest.username} - Status: ${response.status}`);
        userRegistrationErrors.add(1);
    }
}

/**
 * Contact Creation Scenario
 * Tests contact creation functionality with pre-existing users
 */
export function contactCreation() {
    // Use pre-existing test users for contact creation
    const username = `contoh${execution.vu.idInInstance}`;
    const loginRequest = {
        username: username,
        password: 'rahasia'
    };

    console.log(`🔄 Authenticating user: ${username}`);
    const loginResponse = loginUser(loginRequest);
    
    if (loginResponse.status === 200) {
        const token = loginResponse.json().data.token;
        
        // Generate unique contact data
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const contactRequest = {
            first_name: `Contact-${timestamp}`,
            last_name: `Test-${randomNum}`,
            email: `contact-${timestamp}-${randomNum}@example.com`,
            phone: `+62${Math.floor(Math.random() * 1000000000)}`
        };

        console.log(`🔄 Creating contact for user: ${username}`);
        const result = createContact(token, contactRequest);
        
        if (result.success) {
            console.log(`✅ Contact created successfully for: ${username}`);
            contactCreationSuccess.add(1);
        } else {
            console.log(`❌ Contact creation failed for: ${username}`);
        }
    } else {
        console.log(`❌ Authentication failed for user: ${username}`);
    }
    
    // Add realistic delay between requests
    sleep(1);
}
