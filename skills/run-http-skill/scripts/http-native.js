/**
 * HTTP Request Module (Native Node.js)
 * Uses built-in https/http modules instead of axios
 * Fallback when axios is not available
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Send HTTP request using native Node.js modules
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

    return new Promise((resolve, reject) => {
        // Parse URL
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return resolve({
                success: false,
                status: 0,
                statusText: 'Invalid URL',
                data: null,
                error: `Invalid URL: ${url}`
            });
        }

        // Prepare headers
        const requestHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'zero-test/1.0',
            ...headers
        };

        if (token && !requestHeaders['Authorization']) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }

        // Prepare body
        let bodyData = null;
        if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
            if (typeof body === 'string') {
                try {
                    bodyData = JSON.stringify(JSON.parse(body));
                } catch (e) {
                    bodyData = body;
                    requestHeaders['Content-Type'] = 'text/plain';
                }
            } else if (typeof body === 'object') {
                bodyData = JSON.stringify(body);
            }
        }

        if (bodyData) {
            requestHeaders['Content-Length'] = Buffer.byteLength(bodyData);
        }

        // Choose protocol
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        // Request options
        const requestOptions = {
            method: method.toUpperCase(),
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            headers: requestHeaders,
            timeout: timeout
        };

        // Make request
        const req = protocol.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                let responseData;
                try {
                    responseData = JSON.parse(data);
                } catch (e) {
                    responseData = data;
                }

                resolve({
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    data: responseData,
                    headers: res.headers
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                success: false,
                status: 0,
                statusText: 'Connection Error',
                data: null,
                error: error.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                status: 0,
                statusText: 'Timeout',
                data: null,
                error: `Request timeout after ${timeout}ms`
            });
        });

        if (bodyData) {
            req.write(bodyData);
        }

        req.end();
    });
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
