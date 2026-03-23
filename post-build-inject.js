'use strict';

/**
 * post-build-inject.js
 * CHG-2026-0324-005
 *
 * Adds schema.org + OG tags to hub pages that don't generate them natively.
 * Runs after generate-pages.js and generate-homepage.js, before health monitor.
 *
 * Strategy:
 *   - Walk all index.html files under examel-pages/
 *   - Skip pages that already have schema + OG (worksheet/drill individual pages)
 *   - For any page missing either: extract title + meta description from existing HTML
 *   - Inject using examelConfig.buildSchema() + buildOG()
 *   - Write back in-place
 *   - Exit 0 on success, exit 1 if any write fails
 *
 * Called by: deploy.sh Step 3b
 * Do not modify deploy.sh to change this file's path — it expects:
 *   /opt/examel/examel-pages/post-build-inject.js
 */

const fs   = require('fs');
const path = require('path');
const examelConfig = require('./examel-config');

const PAGES_DIR   = path.resolve(__dirname);
const BASE_URL    = 'https://examel.com';
const DEFAULT_IMG = 'https://examel.com/og-default.png';

const SKIP_PATTERNS = [
  /^\/worksheets\/[^/]+\/$/,
  /^\/drills\/math\/grade-\d+\/[^/]+\/$/,
  /^\/vocab-match\/[^/]+\/[^/]+\/$/,
  /^\/reading-passages\/[^/]+\/[^/]+\/$/,
];

function toUrlPath(filePath) {
  const rel = path.relative(PAGES_DIR, filePath);
  const dir = path.dirname(rel);
  return '/' + dir.replace(/\\/g, '/') + '/';
}

function shouldSkip(urlPath) {
  if (urlPath === '/') return true;
  return SKIP_PATTERNS.some(re => re.test(urlPath));
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return '';
  return m[1].replace(/\s+/g, ' ').trim();
}

function extractDescription(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)
            || html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
  if (!m) return '';
  return m[1].replace(/\s+/g, ' ').trim();
}

function hasSchema(html) {
  return html.includes('application/ld+json');
}

function hasOG(html) {
  return html.includes('og:title');
}

function inject(html, urlPath) {
  const url         = BASE_URL + urlPath;
  const title       = extractTitle(html);
  const description = extractDescription(html);
  const data = { title, description, url, image: DEFAULT_IMG };

  let toInject = '';
  if (!hasSchema(html)) toInject += '\n  ' + examelConfig.buildSchema(data);
  if (!hasOG(html))     toInject += '\n  ' + examelConfig.buildOG(data);
  if (!toInject) return { html, changed: false };

  const injected = html.replace('</head>', toInject + '\n</head>');
  if (injected === html) return { html, changed: false, error: 'no </head> tag found' };
  return { html: injected, changed: true };
}

function collectFiles(dir, results = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, results);
    else if (entry.name === 'index.html') results.push(full);
  }
  return results;
}

function run() {
  console.log('▶ post-build-inject.js starting...');
  const files = collectFiles(PAGES_DIR);
  console.log(`  Found ${files.length} index.html files`);

  let checked = 0, injected = 0, skipped = 0, errors = 0;
  const errorList = [];

  for (const filePath of files) {
    const urlPath = toUrlPath(filePath);
    if (shouldSkip(urlPath)) { skipped++; continue; }
    checked++;

    let html;
    try { html = fs.readFileSync(filePath, 'utf8'); }
    catch (err) { errors++; errorList.push(`READ FAIL: ${urlPath} — ${err.message}`); continue; }

    if (hasSchema(html) && hasOG(html)) continue;

    const result = inject(html, urlPath);
    if (result.error) { errors++; errorList.push(`INJECT FAIL: ${urlPath} — ${result.error}`); continue; }
    if (!result.changed) continue;

    try { fs.writeFileSync(filePath, result.html, 'utf8'); injected++; console.log(`  ✅ injected: ${urlPath}`); }
    catch (err) { errors++; errorList.push(`WRITE FAIL: ${urlPath} — ${err.message}`); }
  }

  console.log('');
  console.log(`  Files scanned:     ${files.length}`);
  console.log(`  Skipped:           ${skipped} (individual content pages)`);
  console.log(`  Hub pages checked: ${checked}`);
  console.log(`  Injected:          ${injected}`);
  console.log(`  Errors:            ${errors}`);

  if (errorList.length) { console.log('\n  ERRORS:'); errorList.forEach(e => console.log('    ' + e)); }

  if (errors > 0) { console.log('\n❌ post-build-inject.js completed with errors'); process.exit(1); }
  console.log('\n✅ post-build-inject.js complete');
  process.exit(0);
}

run();
