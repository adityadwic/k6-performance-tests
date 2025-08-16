/**
 * Contact Management Helper Functions
 * Provides utility functions for contact-related API operations
 * 
 * @description Contains functions for:
 * - Contact creation
 * - Contact validation
 * - Contact management with logging
 * 
 * @author Aditya Dwi Cahyono
 * @version 1.0.0
 */

import http from 'k6/http';
import { check } from 'k6';

/**
 * Create a new contact
 * @param {string} token - Authentication token
 * @param {Object} contactData - Contact information
 * @param {string} contactData.first_name - Contact's first name
 * @param {string} contactData.last_name - Contact's last name
 * @param {string} contactData.email - Contact's email address
 * @param {string} contactData.phone - Contact's phone number
 * @returns {Object} Result object with response and success status
 */
export function createContact(token, contactData) {
    const response = http.post('http://localhost:3000/api/contacts', JSON.stringify(contactData), {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token
        }
    });

    // Validate contact creation response
    const isSuccessful = check(response, {
        'create contact status is 200': (r) => r.status === 200,
        'create contact response data must not be null': (r) => r.body !== null,
        'create contact response not empty': (r) => r.body.length > 0,
        'create contact contains contact data': (r) => {
            try {
                const body = r.json();
                return body.data && body.data.first_name;
            } catch (e) {
                return false;
            }
        },
    });

    return {
        response: response,
        success: isSuccessful
    };
}

/**
 * Create contact with detailed logging
 * @param {string} token - Authentication token
 * @param {Object} contactData - Contact information
 * @param {string} vuId - Virtual User ID for logging
 * @returns {Object} Result object with response and success status
 */
export function createContactWithLogging(token, contactData, vuId) {
    console.log(`🔄 VU ${vuId} creating contact: ${contactData.first_name} ${contactData.last_name}`);
    const result = createContact(token, contactData);
    
    if (result.success) {
        console.log(`✅ VU ${vuId} successfully created contact: ${contactData.first_name} ${contactData.last_name}`);
        try {
            const body = result.response.json();
            console.log(`📄 Contact ID: ${body.data.id || 'N/A'}`);
        } catch (e) {
            console.log(`📄 Contact created but couldn't parse ID`);
        }
    } else {
        console.log(`❌ VU ${vuId} failed to create contact: ${contactData.first_name} ${contactData.last_name}`);
        console.log(`Response: ${result.response.status} - ${result.response.body}`);
    }
    
    return result;
}