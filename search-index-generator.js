/**
 * SEARCH INDEX GENERATOR
 * Scans all generated pages and builds search-index.json
 * Run at deploy time — after generate-pages.js, before git push
 *
 * Usage: node search-index-generator.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const PAGES_DIR = '/opt/examel/examel-pages';
const OUT_FILE  = PAGES_DIR + '/search-index.json';
const SKIP_DIRS = new Set(['.git', 'node_modules', 'downloads', 'thumbnails', 'examel-config']);
const SKIP_PATHS = new Set(['/privacy-policy', '/terms', '/about', '/browse']);

function extractMeta(html, filePath) {
  const rel = filePath.replace(PAGES_DIR, '').replace('/index.html', '') || '/';

  // Skip utility pages
  if (SKIP_PATHS.has(rel)) return null;

  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' | Examel', '').replace(' | Free Printable Worksheet', '').trim() : '';
  if (!title) return null;

  // Extract description
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  const description = descMatch ? descMatch[1] : '';

  // Detect format from URL
  let format = 'worksheet';
  if (rel.includes('/drills/') || rel.includes('/free-math-drills') || rel.includes('-drills')) format = 'drill';
  if (rel.includes('/vocab-match/') || rel.includes('-vocabulary')) format = 'vocabulary';
  if (rel.includes('/reading-passages/') || rel.includes('/free-reading')) format = 'reading';
  if (rel.includes('/word-searches/')) format = 'word-search';

  // Detect grade from URL
  const gradeMatch = rel.match(/grade-(\d)/);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : null;

  // Detect subject from URL
  let subject = null;
  if (rel.includes('/math') || rel.includes('-math')) subject = 'math';
  else if (rel.includes('/english') || rel.includes('-english')) subject = 'english';
  else if (rel.includes('/science') || rel.includes('-science')) subject = 'science';

  // Detect if hub page (skip individual pages for cleaner results on hubs)
  const depth = rel.split('/').filter(Boolean).length;
  const isHub = depth <= 2;

  // Build searchable keywords
  const keywords = [title, description, subject, format, grade ? 'grade ' + grade : ''].filter(Boolean).join(' ').toLowerCase();

  // Skip individual drill/vocab/reading/word-search pages — only index hubs + worksheets
  // This keeps index lean at 30k+ pages (drills/vocab/reading found via their hub pages)
  if (!isHub) {
    if (rel.startsWith('/drills/')) return null;
    if (rel.startsWith('/vocab-match/')) return null;
    if (rel.startsWith('/reading-passages/') && rel.split('/').filter(Boolean).length > 2) return null;
    if (rel.startsWith('/word-searches/') && rel.split('/').filter(Boolean).length > 2) return null;
  }

  return { title, url: rel, format, grade, subject, isHub, keywords };
}

function scanPages() {
  const index = [];

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch(e) { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (e.name !== 'index.html') continue;
      try {
        const html = fs.readFileSync(full, 'utf8');
        const meta = extractMeta(html, full);
        if (meta) index.push(meta);
      } catch(e) {}
    }
  }

  walk(PAGES_DIR);
  return index;
}

function generateIndex() {
  console.log('Building search index...');
  const index = scanPages();

  // Sort: hubs first, then by grade, then alphabetically
  index.sort((a, b) => {
    if (a.isHub && !b.isHub) return -1;
    if (!a.isHub && b.isHub) return 1;
    if (a.grade && b.grade) return a.grade - b.grade;
    return a.title.localeCompare(b.title);
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(index));
  const sizeKB = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`✓ Search index — ${index.length} pages → search-index.json (${sizeKB}KB)`);
  return index.length;
}

module.exports = { generateIndex };
if (require.main === module) generateIndex();
