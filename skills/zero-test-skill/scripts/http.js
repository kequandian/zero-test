/**
 * HTTP Request Module
 * Uses axios to send HTTP requests
 * Falls back to native implementation if axios is not available
 */

let axios;
try {
    axios = require('axios');
} catch (e) {
    // Fall back to native implementation
    const native = require('./http-native');
    module.exports = native;
    return; // Exit early
}

/**
 * Send HTTP request
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} url - Request URL
 * @param {object} options - Request options
 * @param {string} options.body - Request body (JSON string or object)
 * @param {string} options.token - Authorization token
 * @param {object} options.headers - Additional headers
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @returns {Promise<object>} Response object with status, data, headers
 */
async function sendRequest(method, url, options = {}) {
    const {
        body = null,
        token = null,
        headers = {},
        timeout = 30000
    } = options;

    // Prepare headers
    const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Prepare request config
    const config = {
        method: method.toUpperCase(),
        url: url,
        headers: requestHeaders,
        timeout: timeout,
        validateStatus: () => true // Accept all status codes
    };

    // Add body for POST/PUT
    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
        if (typeof body === 'string') {
            try {
                config.data = JSON.parse(body);
            } catch (e) {
                // If not valid JSON, send as string
                config.data = body;
                requestHeaders['Content-Type'] = 'text/plain';
            }
        } else {
            config.data = body;
        }
    }

    try {
        const response = await axios(config);

        return {
            success: true,
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers
        };
    } catch (error) {
        if (error.response) {
            // Server responded with error status
            return {
                success: false,
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers,
                error: error.message
            };
        } else if (error.request) {
            // Request made but no response
            return {
                success: false,
                status: 0,
                statusText: 'No Response',
                data: null,
                error: 'No response received from server'
            };
        } else {
            // Request setup error
            return {
                success: false,
                status: 0,
                statusText: 'Request Error',
                data: null,
                error: error.message
            };
        }
    }
}

/**
 * Check if response is successful (2xx status or specific API response)
 * @param {object} response - Response object from sendRequest
 * @returns {boolean}
 */
function isSuccessful(response) {
    // Check HTTP status
    if (response.status >= 200 && response.status < 300) {
        return true;
    }

    // Check API-specific response format
    if (response.data) {
        // Common API success patterns
        if (response.data.code === 200 ||
            response.data.code === 0 ||
            response.data.status_code === 0) {
            return true;
        }
    }

    return false;
}

/**
 * Format response for display/logging
 * @param {object} response - Response object from sendRequest
 * @returns {string} Formatted response string
 */
function formatResponse(response) {
    const lines = [];
    lines.push(`Status: ${response.status} ${response.statusText}`);
    lines.push('');

    if (response.data) {
        if (typeof response.data === 'object') {
            lines.push(JSON.stringify(response.data, null, 2));
        } else {
            lines.push(response.data);
        }
    }

    if (response.error) {
        lines.push('');
        lines.push(`Error: ${response.error}`);
    }

    return lines.join('\n');
}

module.exports = {
    sendRequest,
    isSuccessful,
    formatResponse
};
