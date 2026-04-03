'use strict';
/**
* ga4-inject.js — Ensures all pages have GA4 analytics
* Called by deploy.sh after umami-inject.js, before deploy-gate
* Only touches pages missing the tag — safe to run repeatedly
*/

const fs   = require('fs');
const path = require('path');

const PAGES_DIR = path.resolve(__dirname);
const GA4_ID = 'G-QJ7DF8JRPV';
const GA4_TAG = `<!-- GA4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${GA4_ID}");</script>`;

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
                if (html.includes(GA4_ID)) {
                    skipped++;
                } else if (html.includes('</head>')) {
                    const updated = html.replace('</head>', GA4_TAG + '\n</head>');
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
console.log(`GA4 inject: ${injected} added, ${skipped} already had it, ${errors} errors`);

if (errors > 0) process.exit(1);
