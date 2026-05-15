/**
 * Timestamp formatting utilities
 */

/**
 * Format timestamp according to configuration
 * @param {Date|string} date - Date object or ISO string
 * @param {object} config - Timestamp configuration
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(date, config) {
    const d = date instanceof Date ? date : new Date(date);

    if (!config || !config.format) {
        return d.toISOString();
    }

    switch (config.format) {
        case 'iso':
            if (config.includeMilliseconds) {
                return d.toISOString();
            } else {
                return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
            }

        case 'locale':
            const locale = config.customFormat?.locale || 'en-US';
            const options = config.customFormat?.options || {};
            return d.toLocaleString(locale, options);

        case 'custom':
            if (config.customFormat?.pattern) {
                // Simple pattern replacement (basic implementation)
                return formatCustomPattern(d, config.customFormat.pattern);
            } else {
                return d.toLocaleString(
                    config.customFormat?.locale || 'en-US',
                    config.customFormat?.options || {}
                );
            }

        default:
            return d.toISOString();
    }
}

/**
 * Format custom pattern (basic implementation)
 * @param {Date} date - Date object
 * @param {string} pattern - Pattern string
 * @returns {string} Formatted string
 */
function formatCustomPattern(date, pattern) {
    // Basic pattern replacement - can be extended
    return pattern
        .replace(/yyyy/g, date.getFullYear())
        .replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'))
        .replace(/dd/g, String(date.getDate()).padStart(2, '0'))
        .replace(/HH/g, String(date.getHours()).padStart(2, '0'))
        .replace(/mm/g, String(date.getMinutes()).padStart(2, '0'))
        .replace(/ss/g, String(date.getSeconds()).padStart(2, '0'));
}

/**
 * Get current timestamp formatted according to config
 * @param {object} config - Timestamp configuration
 * @returns {string} Formatted current timestamp
 */
function getCurrentTimestamp(config) {
    return formatTimestamp(new Date(), config);
}

module.exports = {
    formatTimestamp,
    getCurrentTimestamp
};