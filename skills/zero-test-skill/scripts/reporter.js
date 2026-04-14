/**
 * Enhanced Test Report Generator
 * Generates Markdown and PDF reports from test results
 * Supports full Markdown syntax: tables, bold, code blocks, etc.
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate markdown from test summary with full formatting
 * @param {object} summary - Test run summary
 * @param {string} filter - Filter used for test selection (optional)
 * @returns {string} Markdown content with full syntax support
 */
function generateMarkdown(summary, filter = null) {
    const lines = [];

    // Title and metadata
    lines.push('# 📊 Test Report');
    lines.push('');

    // Add filter info if present
    if (filter) {
        lines.push('## 🔍 Filter Applied');
        lines.push('');
        lines.push(`**Filter:** \`${filter}\``);
        lines.push('');
        lines.push('*This report only shows test cases matching the filter.*');
        lines.push('');
        lines.push('---');
        lines.push('');
    }

    lines.push('## 📋 Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| **Date** | ${new Date().toISOString().replace('T', ' ').substring(0, 19)} |`);
    lines.push(`| **Total Tests** | ${summary.total} |`);
    lines.push(`| **✅ Passed** | ${summary.passed} |`);
    lines.push(`| **❌ Failed** | ${summary.failed} |`);
    lines.push(`| **⏭️ Skipped** | ${summary.skipped} |`);

    if (summary.total > 0) {
        const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
        const statusIcon = summary.failed === 0 ? '✅' : '❌';
        lines.push(`| **Pass Rate** | ${statusIcon} **${passRate}%** |`);
    }

    lines.push('');

    if (summary.duration) {
        lines.push(`**⏱️ Duration:** ${summary.duration} seconds`);
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## 📝 Test Details');
    lines.push('');

    // Add each test result with detailed formatting
    const { formatTestResult } = require('./runner');

    if (summary.results && summary.results.length > 0) {
        for (const result of summary.results) {
            lines.push(formatTestResultEnhanced(result));
            lines.push('');
        }
    }

    return lines.join('\n');
}

/**
 * Format a single test result with enhanced Markdown
 * @param {object} result - Test result object
 * @returns {string} Formatted markdown
 */
function formatTestResultEnhanced(result) {
    const lines = [];

    // Test header with status icon
    const statusIcon = result.success ? '✅' : '❌';
    const statusEmoji = result.success ? 'PASSED' : 'FAILED';
    const statusColor = result.success ? '🟢' : '🔴';

    lines.push(`### ${statusIcon} ${result.title}`);
    lines.push('');

    // Test info table
    lines.push('| Property | Value |');
    lines.push('|----------|-------|');
    lines.push(`| **Status** | ${statusEmoji} |`);
    lines.push(`| **Method** | \`${result.method || 'GET'}\` |`);
    lines.push(`| **Status Code** | \`${result.status || 'N/A'}\` |`);
    lines.push(`| **Duration** | ${result.duration || 0} ms |`);
    lines.push('| **Timestamp** | `' + (result.timestamp || new Date().toISOString()) + '` |');
    lines.push('');

    // Request URL
    if (result.url) {
        lines.push('**🔗 Request URL:**');
        lines.push('```');
        lines.push(result.url);
        lines.push('```');
        lines.push('');
    }

    // Request details
    if (result.request) {
        lines.push('**📤 Request Details:**');
        lines.push('');

        if (result.request.method) {
            lines.push(`**Method:** \`${result.request.method}\``);
            lines.push('');
        }

        if (result.request.headers && Object.keys(result.request.headers).length > 0) {
            lines.push('**Headers:**');
            lines.push('```http');
            for (const [key, value] of Object.entries(result.request.headers)) {
                lines.push(`${key}: ${value}`);
            }
            lines.push('```');
            lines.push('');
        }

        if (result.request.body) {
            lines.push('**Body:**');
            lines.push('```json');
            try {
                const body = typeof result.request.body === 'string'
                    ? JSON.parse(result.request.body)
                    : result.request.body;
                lines.push(JSON.stringify(body, null, 2));
            } catch {
                lines.push(result.request.body);
            }
            lines.push('```');
            lines.push('');
        }
    }

    // Response
    if (result.response) {
        lines.push('**📥 Response:**');
        lines.push('');

        // Try to format as JSON
        try {
            const responseObj = typeof result.response === 'string'
                ? JSON.parse(result.response)
                : result.response;

            // Pretty print JSON
            const jsonStr = JSON.stringify(responseObj, null, 2);

            // Check if it's an array or object
            if (Array.isArray(responseObj)) {
                lines.push(`**Response Array (${responseObj.length} items):**`);
            } else if (typeof responseObj === 'object') {
                lines.push(`**Response Object:**`);
            }

            lines.push('```json');
            // Truncate if too long
            if (jsonStr.length > 2000) {
                lines.push(jsonStr.substring(0, 2000));
                lines.push('...');
                lines.push(`*(truncated, total length: ${jsonStr.length} chars)*`);
            } else {
                lines.push(jsonStr);
            }
            lines.push('```');
        } catch {
            // Not JSON, display as text
            lines.push('```');
            const responseStr = String(result.response);
            if (responseStr.length > 2000) {
                lines.push(responseStr.substring(0, 2000));
                lines.push('...');
                lines.push(`*(truncated, total length: ${responseStr.length} chars)*`);
            } else {
                lines.push(responseStr);
            }
            lines.push('```');
        }
        lines.push('');
    }

    // Extracted variables
    if (result.extractedVars && Object.keys(result.extractedVars).length > 0) {
        lines.push('**🔧 Extracted Variables:**');
        lines.push('');
        for (const [varName, value] of Object.entries(result.extractedVars)) {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            // Truncate long values
            const truncatedValue = displayValue.length > 100
                ? displayValue.substring(0, 100) + '...'
                : displayValue;
            lines.push(`- \`${varName}\`: \`${truncatedValue}\``);
        }
        lines.push('');
    }

    // Error details if failed
    if (!result.success && result.error) {
        lines.push('**❌ Error Details:**');
        lines.push('');
        lines.push('```');
        lines.push(result.error);
        lines.push('```');
        lines.push('');
    }

    // Notes if present
    if (result.notes) {
        lines.push('**📝 Notes:**');
        lines.push('');
        lines.push(`> ${result.notes}`);
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Format summary section
 * @param {object} summary - Test summary
 * @returns {string} Formatted summary markdown
 */
function formatSummary(summary) {
    const lines = [];

    lines.push('## 📊 Test Summary');
    lines.push('');
    lines.push('| Metric | Count | Percentage |');
    lines.push('|--------|-------|------------|');

    const total = summary.total || 0;
    const passed = summary.passed || 0;
    const failed = summary.failed || 0;
    const skipped = summary.skipped || 0;

    lines.push(`| **Total** | **${total}** | **100%** |`);
    lines.push(`| ✅ **Passed** | ${passed} | ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}% |`);
    lines.push(`| ❌ **Failed** | ${failed} | ${total > 0 ? ((failed / total) * 100).toFixed(1) : 0}% |`);
    lines.push(`| ⏭️ **Skipped** | ${skipped} | ${total > 0 ? ((skipped / total) * 100).toFixed(1) : 0}% |`);

    if (summary.duration) {
        lines.push(`| ⏱️ **Duration** | ${summary.duration}s | - |`);
    }

    lines.push('');

    // Status badge
    if (total > 0) {
        const passRate = (passed / total) * 100;
        let badge = '';
        if (passRate === 100) {
            badge = '🟢 **ALL TESTS PASSED**';
        } else if (passRate >= 80) {
            badge = '🟡 **MOSTLY PASSED**';
        } else if (passRate >= 50) {
            badge = '🟠 **PARTIALLY PASSED**';
        } else {
            badge = '🔴 **MOSTLY FAILED**';
        }
        lines.push(`**Overall Status:** ${badge}`);
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Generate and save report to a specific directory
 * @param {object} summary - Test run summary
 * @param {string} outputDir - Output directory
 * @param {string} reportName - Name of the report file (without extension)
 * @returns {Promise<object>} Object with paths to markdown
 */
async function saveReport(summary, outputDir, reportName) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, reportName);
    const markdown = generateMarkdown(summary);
    const markdownFile = `${outputFile}.md`;

    fs.writeFileSync(markdownFile, markdown, 'utf-8');

    return {
        markdown: markdownFile
    };
}

/**
 * Get default stylesheet path
 * @param {string} skillDir - Base directory of the skill
 * @returns {string} Path to default stylesheet
 */
function getDefaultStylesheet(skillDir) {
    return path.join(skillDir, 'assets', 'markdown.css');
}

module.exports = {
    generateMarkdown,
    formatTestResultEnhanced,
    formatSummary,
    saveReport,
    getDefaultStylesheet
};
