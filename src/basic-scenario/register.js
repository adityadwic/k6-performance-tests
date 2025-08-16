/**
 * User Registration Performance Test
 * Tests the complete user registration workflow
 * 
 * @description This test performs:
 * 1. User registration
 * 2. User authentication
 * 3. User data retrieval
 * 
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 */

import { sleep, fail } from 'k6';
import { registerUser, loginUser, getUser } from '../helper/user.js';

// Performance test configuration
export const options = {
    vus: 10,
    duration: '10s',
    thresholds: {
        'http_req_duration': ['p(95) < 500'],
        'http_req_failed': ['rate < 0.05'],
        'checks': ['rate > 0.95']
    }
};

/**
 * Main test function - Complete user registration workflow
 */
export default function() {
    // Generate unique user identifier
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const uniqueID = `${timestamp}-${randomId}`;
    
    // User registration data
    const userData = {
        username: `testuser_${uniqueID}`,
        password: 'securePassword123',
        name: 'Test User Portfolio'
    };
    
    // Step 1: Register new user
    console.log(`🔄 Registering user: ${userData.username}`);
    const registerResponse = registerUser(userData);

    if (registerResponse.status !== 200) {
        console.log(`❌ Registration failed for: ${userData.username}`);
        fail(`Registration failed for user-${uniqueID}`);
    }

    console.log(`✅ User registered successfully: ${userData.username}`);

    // Step 2: Authenticate the registered user
    const credentials = {
        username: userData.username,
        password: userData.password,
    };

    console.log(`🔄 Authenticating user: ${credentials.username}`);
    const loginResponse = loginUser(credentials);

    if (loginResponse.status !== 200) {
        console.log(`❌ Authentication failed for: ${credentials.username}`);
        fail(`Authentication failed for user-${uniqueID}`);
    }

    console.log(`✅ User authenticated successfully: ${credentials.username}`);

    // Extract authentication token
    const loginData = loginResponse.json();
    const authToken = loginData.data.token;

    // Step 3: Retrieve user information
    console.log(`🔄 Retrieving user data for: ${credentials.username}`);
    const userResponse = getUser(authToken);

    if (userResponse.status !== 200) {
        console.log(`❌ Failed to retrieve user data for: ${credentials.username}`);
        fail(`User data retrieval failed for user-${uniqueID}`);
    }

    console.log(`✅ Complete workflow successful for: ${userData.username}`);
    
    // Verify retrieved user data
    const userData_retrieved = userResponse.json();
    console.log(`👤 Verified user: ${userData_retrieved.data.username}`);
    
    // Realistic delay between test iterations
    sleep(1);
}
