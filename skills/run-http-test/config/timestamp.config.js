module.exports = {
    // Timestamp configuration
    timestamp: {
        // Format for timestamps in reports (ISO, locale, custom)
        // Options: 'iso' (ISO 8601), 'locale' (localized), 'custom' (use customFormat)
        format: 'iso',

        // Custom timestamp format when format='custom'
        // Uses JavaScript Date.toLocaleString options or custom pattern
        customFormat: {
            locale: 'zh-CN',
            options: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            }
        },

        // Whether to show timezone information
        showTimezone: true,

        // Whether to include milliseconds in ISO format
        includeMilliseconds: false
    },

    // Report configuration
    report: {
        // Whether to include timestamp in report header
        includeTimestamp: true,

        // Whether to include timestamp for each test case
        includeTestTimestamps: true
    }
};