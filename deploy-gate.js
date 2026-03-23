/**
 * DEPLOY GATE — 7-step validation before any git push
 * Usage: node deploy-gate.js
 *        node deploy-gate.js --force   (logs but does not block)
 *
 * Exit 0 = all checks passed, safe to push
 * Exit 1 = one or more checks failed, deploy blocked
 *
 * Called by deploy.sh between post-build-inject and git push.
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const PAGES_DIR  = '/opt/examel/examel-pages';
const SITEMAP    = PAGES_DIR + '/sitemap.xml';
const FORCE      = process.argv.includes('--force');
const SAMPLE_SIZE = 100;
const LINK_SAMPLE = 200;
const MIN_SIZE   = 1024;        // 1KB
const MAX_SIZE   = 512000;      // 500KB

let passed = 0;
let failed = 0;
const failures = [];

function pass(step, msg) {
  console.log(`✅ [${step}] ${msg}`);
  passed++;
}

function fail(step, msg) {
  console.log(`🔴 [${step}] ${msg}`);
  failures.push(`[${step}] ${msg}`);
  failed++;
}

function warn(step, msg) {
  console.log(`🟡 [${step}] ${msg}`);
}

// ── COLLECT ALL HTML PAGES ────────────────────────────────────────────────
function getAllPages() {
  const pages = [];
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch(e) { return; }
    for (const e of entries) {
      if (['node_modules', '.git', 'downloads', 'thumbnails', 'examel-config'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (e.name === 'index.html') pages.push(full);
    }
  }
  walk(PAGES_DIR);
  return pages;
}

// ── SAMPLE — pick N random items from array ───────────────────────────────
function sample(arr, n) {
  if (arr.length <= n) return arr;
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// ── STEP 1: SCHEMA VALIDATION ─────────────────────────────────────────────
function checkSchema(pages) {
  const sampled = sample(pages, SAMPLE_SIZE);
  let missing = 0;
  for (const p of sampled) {
    const html = fs.readFileSync(p, 'utf8');
    if (!html.includes('application/ld+json')) missing++;
  }
  if (missing === 0) {
    pass('1-SCHEMA', `All ${sampled.length} sampled pages have schema.org`);
  } else {
    fail('1-SCHEMA', `${missing}/${sampled.length} sampled pages missing schema.org`);
  }
}

// ── STEP 2: HTML VALIDATION ───────────────────────────────────────────────
function checkHTML(pages) {
  const sampled = sample(pages, SAMPLE_SIZE);
  let bad = 0;
  const issues = [];
  for (const p of sampled) {
    const html = fs.readFileSync(p, 'utf8');
    if (!html.includes('<!DOCTYPE html>')) { bad++; issues.push('missing DOCTYPE: ' + p); continue; }
    if (!html.includes('<title>'))          { bad++; issues.push('missing title: ' + p); continue; }
    if (!html.includes('</html>'))          { bad++; issues.push('missing </html>: ' + p); continue; }
    if (!html.includes('examel'))           { bad++; issues.push('missing brand: ' + p); continue; }
  }
  if (bad === 0) {
    pass('2-HTML', `All ${sampled.length} sampled pages have valid HTML structure`);
  } else {
    fail('2-HTML', `${bad}/${sampled.length} pages have HTML issues. First: ${issues[0]}`);
  }
}

// ── STEP 3: INTERNAL LINK CHECK ───────────────────────────────────────────
function checkLinks(pages) {
  const sampled = sample(pages, Math.min(LINK_SAMPLE, pages.length));
  let broken = 0;
  const brokenLinks = [];

  for (const p of sampled) {
    const html = fs.readFileSync(p, 'utf8');
    // Extract internal href links
    const matches = html.matchAll(/href="(\/[^"#?]+)"/g);
    for (const m of matches) {
      const href = m[1];
      // Skip external-looking paths and anchors
      if (href.startsWith('//')) continue;
      // Convert URL path to filesystem path
      const fsPath = path.join(PAGES_DIR, href, 'index.html');
      if (!fs.existsSync(fsPath)) {
        broken++;
        if (brokenLinks.length < 5) brokenLinks.push(href);
      }
    }
  }

  if (broken === 0) {
    pass('3-LINKS', `Zero broken internal links in ${sampled.length} sampled pages`);
  } else {
    fail('3-LINKS', `${broken} broken internal links found. Examples: ${brokenLinks.join(', ')}`);
  }
}

// ── STEP 4: DIFF CHECK ────────────────────────────────────────────────────
// Skipped at current scale (<20k pages). Add in Phase 6 at 20k+ pages.
function checkDiff() {
  warn('4-DIFF', 'Skipped — enabled at 20k+ pages (Phase 6)');
}

// ── STEP 5: ANSWER VERIFICATION ───────────────────────────────────────────
function checkAnswers(pages) {
  const worksheetPages = pages.filter(p => p.includes('/worksheets/'));
  const sampled = sample(worksheetPages, Math.min(SAMPLE_SIZE, worksheetPages.length));
  if (sampled.length === 0) {
    warn('5-ANSWERS', 'No worksheet pages found to check');
    return;
  }
  let missing = 0;
  for (const p of sampled) {
    const html = fs.readFileSync(p, 'utf8');
    if (!html.includes('Every Answer Verified') && !html.includes('answer key')) missing++;
  }
  if (missing === 0) {
    pass('5-ANSWERS', `Answer verification badge present in ${sampled.length} sampled worksheet pages`);
  } else {
    fail('5-ANSWERS', `${missing}/${sampled.length} worksheet pages missing answer verification`);
  }
}

// ── STEP 6: SIZE CHECK ────────────────────────────────────────────────────
function checkSizes(pages) {
  const sampled = sample(pages, SAMPLE_SIZE);
  let tooSmall = 0;
  let tooBig   = 0;
  const issues = [];

  for (const p of sampled) {
    const size = fs.statSync(p).size;
    if (size < MIN_SIZE) {
      tooSmall++;
      if (issues.length < 3) issues.push(`too small (${size}b): ${p}`);
    }
    if (size > MAX_SIZE) {
      tooBig++;
      if (issues.length < 3) issues.push(`too big (${Math.round(size/1024)}KB): ${p}`);
    }
  }

  if (tooSmall === 0 && tooBig === 0) {
    pass('6-SIZE', `All ${sampled.length} sampled pages within size bounds (1KB–500KB)`);
  } else {
    fail('6-SIZE', `${tooSmall} too small, ${tooBig} too big. Examples: ${issues[0]}`);
  }
}

// ── STEP 7: SITEMAP VALIDATION ────────────────────────────────────────────
function checkSitemap(pages) {
  if (!fs.existsSync(SITEMAP)) {
    fail('7-SITEMAP', 'sitemap.xml not found');
    return;
  }

  const sitemapContent = fs.readFileSync(SITEMAP, 'utf8');
  const sitemapCount   = (sitemapContent.match(/<loc>/g) || []).length;
  const fsCount        = pages.length;

  // Allow small variance (homepage, static pages not in pages array)
  const delta = Math.abs(sitemapCount - fsCount);
  const tolerance = 20;

  if (delta <= tolerance) {
    pass('7-SITEMAP', `Sitemap ${sitemapCount} URLs ≈ filesystem ${fsCount} pages (delta: ${delta})`);
  } else {
    fail('7-SITEMAP', `Sitemap/filesystem mismatch: sitemap=${sitemapCount}, filesystem=${fsCount}, delta=${delta}`);
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────
function main() {
  console.log('');
  console.log('🔒 DEPLOY GATE');
  console.log(`   ${new Date().toISOString()}`);
  if (FORCE) console.log('   ⚠️  --force flag active — failures will log but not block');
  console.log('');

  const pages = getAllPages();
  console.log(`   Found ${pages.length} pages to validate\n`);

  if (pages.length === 0) {
    console.log('🔴 BLOCKED: No pages found — something is very wrong');
    process.exit(1);
  }

  checkSchema(pages);
  checkHTML(pages);
  checkLinks(pages);
  checkDiff();
  checkAnswers(pages);
  checkSizes(pages);
  checkSitemap(pages);

  console.log('');
  console.log(`   Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✅ DEPLOY GATE PASSED — safe to push\n');
    process.exit(0);
  }

  if (FORCE) {
    console.log('⚠️  DEPLOY GATE FAILED but --force active');
    console.log('   Failures:');
    failures.forEach(f => console.log('   ' + f));
    console.log('   Proceeding with forced deploy — review failures post-deploy\n');
    process.exit(0);
  }

  console.log('🔴 DEPLOY GATE BLOCKED');
  console.log('   Failures:');
  failures.forEach(f => console.log('   ' + f));
  console.log('   Fix issues or use --force to override\n');
  process.exit(1);
}

main();
