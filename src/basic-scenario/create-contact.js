/**
 * Contact Creation Performance Test
 * Tests contact creation functionality with authenticated users
 * 
 * @description This test performs:
 * 1. User authentication
 * 2. Contact creation with predefined data
 * 3. Performance validation under load
 * 
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 */

import { sleep } from 'k6';
import execution from "k6/execution";
import { loginUser } from "../helper/user.js";
import { createContactWithLogging } from "../helper/contact.js";

// Performance test configuration
export const options = {
    vus: 10,
    duration: '30s',
    thresholds: {
        'http_req_duration': ['p(95) < 500'],
        'http_req_failed': ['rate < 0.05'],
        'checks': ['rate > 0.95']
    }
};

/**
 * Setup function - Generate test contact data
 * @returns {Array} Array of contact data objects
 */
export function setup() {
    const totalContacts = Number(__ENV.TOTAL_CONTACTS) || 20;
    const contactData = [];

    for (let i = 1; i <= totalContacts; i++) {
        contactData.push({
            "first_name": "TestContact",
            "last_name": `Number-${i}`,
            "email": `testcontact${i}@portfolio.com`,
            "phone": `+62${Math.floor(Math.random() * 1000000000)}`
        });
    }
    
    console.log(`📋 Generated ${contactData.length} test contacts`);
    return contactData;
}

/**
 * Get authentication token for contact creation
 * @returns {string|null} Authentication token or null if failed
 */
export function getAuthToken() {
    const username = `contoh${execution.vu.idInInstance}`;
    const credentials = {
        username: username,
        password: 'rahasia',
    };

    console.log(`🔄 Authenticating user: ${username}`);
    const loginResponse = loginUser(credentials);

    if (loginResponse.status !== 200) {
        console.log(`❌ Authentication failed for user: ${username}`);
        return null;
    }

    console.log(`✅ User authenticated successfully: ${username}`);
    const loginData = loginResponse.json();
    return loginData.data.token;
}

/**
 * Main test function - Create contacts with authenticated users
 * @param {Array} contactData - Array of contact data from setup
 */
export default function(contactData) {
    const authToken = getAuthToken();
    
    if (!authToken) {
        console.log(`VU ${execution.vu.idInInstance} - Authentication failed, skipping contact creation`);
        return;
    }

    // Each VU creates contacts based on its instance
    const vuIndex = execution.vu.idInInstance - 1;
    const contact = contactData[vuIndex % contactData.length];
    
    if (contact) {
        // Add unique identifier to avoid conflicts
        const timestamp = Date.now();
        const uniqueContact = {
            ...contact,
            first_name: `${contact.first_name}-${timestamp}`,
            email: `${timestamp}-${contact.email}`
        };
        
        const result = createContactWithLogging(authToken, uniqueContact, execution.vu.idInInstance);
        
        if (!result.success) {
            console.log(`VU ${execution.vu.idInInstance} failed to create contact`);
        }
    } else {
        console.log(`⚠️ VU ${execution.vu.idInInstance} - No contact data available`);
    }
    
    // Realistic delay between operations
    sleep(1);
}

/**
 * Teardown function - Clean up after test completion
 * @param {Array} contactData - Contact data used in test
 */
export function teardown(contactData) {
    console.log(`🏁 Test completed - Processed ${contactData.length} contact templates`);
}