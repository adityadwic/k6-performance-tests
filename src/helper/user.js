/**
 * User Management Helper Functions
 * Provides utility functions for user-related API operations
 * 
 * @description Contains functions for:
 * - User registration
 * - User authentication
 * - User data retrieval
 * 
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 */

import http from 'k6/http';
import { check } from 'k6';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Unique username
 * @param {string} userData.password - User password
 * @param {string} userData.name - User's full name
 * @returns {Object} HTTP response from registration endpoint
 */
export function registerUser(userData) {
    const response = http.post('http://localhost:3000/api/users', JSON.stringify(userData), {
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
    });
    
    // Validate registration response
    check(response, {
        'Register status must be 200': (r) => r.status === 200,
        'Register response data must not be null': (r) => r.body !== null,
        'Register response not empty': (r) => r.body.length > 0,
    });

    // Log errors for debugging
    if (response.status !== 200) {
        console.log(`Registration Error - Status: ${response.status}, Body: ${response.body}`);
    }

    return response;
}

/**
 * Authenticate user login
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 * @returns {Object} HTTP response containing authentication token
 */
export function loginUser(credentials) {
    const response = http.post('http://localhost:3000/api/users/login', JSON.stringify(credentials), {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    // Validate login response
    check(response, {
        'Login response status must be 200': (r) => r.status === 200,
        'Login response data must not be null': (r) => r.body !== null,
        'Login response not empty': (r) => r.body.length > 0,
    });

    return response;
}

/**
 * Get current user information
 * @param {string} token - Authentication token
 * @returns {Object} HTTP response containing user data
 */
export function getUser(token) {
    // Try primary endpoint first
    let response = http.get('http://localhost:3000/api/users/current', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token
        }
    });

    // Fallback to alternative endpoint if primary fails
    if (response.status !== 200) {
        response = http.get('http://localhost:3000/api/users/me', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
    }

    // Validate user data response
    check(response, {
        'get user status is 200': (r) => r.status === 200,
        'get user response data must not null': (r) => r.body !== null,
        'get user response not empty': (r) => r.body.length > 0,
    });

    return response;
}

