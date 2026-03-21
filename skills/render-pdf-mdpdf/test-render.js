#!/usr/bin/env node
/**
 * Test script for render-pdf-mdpdf skill
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
    console.log('============================================================');
    console.log('render-pdf-mdpdf Skill Test');
    console.log('============================================================\n');

    const skillDir = __dirname;
    const examplesDir = path.join(skillDir, 'examples');
    const outputDir = path.join(skillDir, 'output');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Test 1: Basic conversion
    console.log('[Test 1] Basic markdown to PDF conversion');
    console.log('Input: examples/sample.md');
    console.log('Output: output/sample-basic.pdf\n');

    await runRender(path.join(examplesDir, 'sample.md'), path.join(outputDir, 'sample-basic.pdf'));

    // Test 2: With custom CSS
    console.log('\n[Test 2] With custom CSS');
    console.log('Input: examples/sample.md');
    console.log('CSS: examples/custom-style.css');
    console.log('Output: output/sample-custom.pdf\n');

    await runRender(
        path.join(examplesDir, 'sample.md'),
        path.join(outputDir, 'sample-custom.pdf'),
        path.join(examplesDir, 'custom-style.css')
    );

    // Test 3: String conversion
    console.log('\n[Test 3] Direct string conversion');
    console.log('Output: output/sample-string.pdf\n');

    // Create a temp markdown file for string test
    const tempMd = path.join(outputDir, 'temp-string-test.md');
    fs.writeFileSync(tempMd, '# Quick Test\n\nThis is a **test** document.\n\n- Item 1\n- Item 2\n- Item 3\n');

    await runRender(tempMd, path.join(outputDir, 'sample-string.pdf'));

    // Clean up
    fs.unlinkSync(tempMd);

    console.log('\n============================================================');
    console.log('All tests completed!');
    console.log('============================================================');
    console.log(`\nOutput directory: ${outputDir}\n`);

    // Open first PDF
    openPdf(path.join(outputDir, 'sample-basic.pdf'));
}

function runRender(input, output, css) {
    return new Promise((resolve, reject) => {
        const args = [path.join(__dirname, 'scripts/render.js'), input, output];
        if (css) {
            args.push('--css', css);
        }

        const child = spawn('node', args, {
            cwd: __dirname,
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Render failed with code ${code}`));
            }
        });
    });
}

function openPdf(filePath) {
    const platform = process.platform;
    let command;

    if (platform === 'win32') {
        command = 'start';
    } else if (platform === 'darwin') {
        command = 'open';
    } else {
        command = 'xdg-open';
    }

    console.log('Opening PDF...');
    spawn(command, [filePath], {
        detached: true,
        stdio: 'ignore',
        shell: true
    });
}

test().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
