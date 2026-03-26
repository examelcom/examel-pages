'use strict';
/**
 * umami-inject.js — Ensures all pages have Umami analytics
 * Called by deploy.sh Step 3d, after all generators, before deploy-gate
 * Only touches pages missing the script — safe to run repeatedly
 */

const fs   = require('fs');
const path = require('path');

const PAGES_DIR = path.resolve(__dirname);
const UMAMI_TAG = '<script defer src="https://cloud.umami.is/script.js" data-website-id="a6b927e1-8ee1-445f-ae65-d50931867d37"></script>';

let injected = 0;
let skipped = 0;
let errors = 0;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules') {
            walk(full);
        } else if (entry.name === 'index.html') {
            try {
                const html = fs.readFileSync(full, 'utf8');
                if (html.includes('umami')) {
                    skipped++;
                } else if (html.includes('</head>')) {
                    const updated = html.replace('</head>', UMAMI_TAG + '\n</head>');
                    fs.writeFileSync(full, updated);
                    injected++;
                } else {
                    errors++;
                    console.log('⚠️  No </head> found: ' + full);
                }
            } catch (e) {
                errors++;
                console.log('⚠️  Error: ' + full + ' — ' + e.message);
            }
        }
    }
}

walk(PAGES_DIR);
console.log(`Umami inject: ${injected} added, ${skipped} already had it, ${errors} errors`);

if (errors > 0) process.exit(1);
