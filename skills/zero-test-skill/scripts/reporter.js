/**
 * Test Report Generator
 * Generates Markdown and PDF reports from test results
 */

const fs = require('fs');
const path = require('path');
const mdpdf = require('mdpdf');

/**
 * Generate test report
 * @param {object} summary - Test run summary
 * @param {string} outputFile - Output file path (without extension)
 * @param {string} stylesheet - Path to custom CSS stylesheet
 * @returns {Promise<string>} Path to generated PDF
 */
async function generateReport(summary, outputFile, stylesheet) {
    // Create Markdown content
    const markdown = generateMarkdown(summary);

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save markdown file
    const markdownFile = `${outputFile}.md`;
    fs.writeFileSync(markdownFile, markdown, 'utf-8');

    // Convert to PDF
    const pdfFile = await convertToPdf(markdownFile, `${outputFile}.pdf`, stylesheet);

    return pdfFile;
}

/**
 * Generate markdown from test summary
 * @param {object} summary - Test run summary
 * @returns {string} Markdown content
 */
function generateMarkdown(summary) {
    const lines = [];

    lines.push('# Test Report');
    lines.push('');
    lines.push(`**Date:** ${new Date().toISOString()}`);
    lines.push(`**Total Tests:** ${summary.total}`);
    lines.push(`**Passed:** ${summary.passed}`);
    lines.push(`**Failed:** ${summary.failed}`);
    lines.push(`**Skipped:** ${summary.skipped}`);
    lines.push('');

    if (summary.total > 0) {
        const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
        lines.push(`**Pass Rate:** ${passRate}%`);
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('# Test Details');
    lines.push('');

    // Add each test result
    const { formatTestResult, formatSummary } = require('./runner');
    lines.push(formatSummary(summary));
    lines.push('');

    for (const result of summary.results) {
        lines.push(formatTestResult(result));
    }

    return lines.join('\n');
}

/**
 * Convert markdown to PDF using mdpdf
 * @param {string} markdownFile - Path to markdown file
 * @param {string} pdfFile - Path to output PDF file
 * @param {string} stylesheet - Path to custom CSS stylesheet
 * @returns {Promise<string>} Path to generated PDF file
 */
async function convertToPdf(markdownFile, pdfFile, stylesheet) {
    const options = {
        source: markdownFile,
        destination: pdfFile,
        pdf: {
            format: 'A4',
            orientation: 'portrait',
            quality: '100',
            border: {
                top: '10mm',
                left: '10mm',
                bottom: '10mm',
                right: '10mm'
            },
            header: {
                height: '15mm',
                contents: '<div style="text-align: center;">Test Report</div>'
            },
            footer: {
                height: '15mm',
                contents: '<div style="text-align: center; font-size: 10px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
            }
        },
        styles: stylesheet
    };

    try {
        const result = await mdpdf.convert(options);
        return result;
    } catch (error) {
        console.error('PDF conversion error:', error);
        throw error;
    }
}

/**
 * Generate and save report to a specific directory
 * @param {object} summary - Test run summary
 * @param {string} outputDir - Output directory
 * @param {string} reportName - Name of the report file (without extension)
 * @param {string} stylesheet - Path to custom CSS stylesheet
 * @returns {Promise<object>} Object with paths to markdown and pdf
 */
async function saveReport(summary, outputDir, reportName, stylesheet) {
    const outputFile = path.join(outputDir, reportName);
    const pdfFile = await generateReport(summary, outputFile, stylesheet);

    return {
        markdown: `${outputFile}.md`,
        pdf: pdfFile
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
    generateReport,
    generateMarkdown,
    saveReport,
    getDefaultStylesheet
};
