/**
 * SITEMAP GENERATOR
 * Scans filesystem and writes sitemap.xml
 * Usage: called from generate-pages.js, or standalone:
 *   node sitemap-generator.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const BASE_URL  = 'https://examel.com';
const PAGES_DIR = '/opt/examel/examel-pages';
const OUT_FILE  = PAGES_DIR + '/sitemap.xml';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'downloads', 'thumbnails', 'examel-config']);

function getPriority(rel) {
  if (rel === '/')                                              return ['1.0', 'daily'];
  if (rel.match(/^\/free-[^/]+-worksheets\/$/))                return ['0.9', 'daily'];
  if (rel.match(/^\/free-[^/]+-worksheets\/grade-/))           return ['0.85', 'daily'];
  if (rel.match(/^\/free-[^/]+-worksheets\/[^/]+\/$/))         return ['0.85', 'daily'];
  if (rel.match(/^\/free-(math-drills|reading-passages|.*-vocabulary)/)) return ['0.9', 'daily'];
  if (rel.match(/^\/free-worksheets/))                         return ['0.85', 'daily'];
  if (rel.match(/^\/(about|terms|privacy)/))                   return ['0.3', 'monthly'];
  if (rel.startsWith('/worksheets/'))                          return ['0.7', 'monthly'];
  if (rel.startsWith('/drills/'))                              return ['0.7', 'monthly'];
  if (rel.startsWith('/vocab-match/'))                         return ['0.75', 'monthly'];
  if (rel.startsWith('/reading-passages/'))                    return ['0.8', 'monthly'];
  if (rel.startsWith('/word-searches/'))                       return ['0.7', 'monthly'];
  return ['0.7', 'monthly'];
}

function scanPages(dir) {
  const urls = [];
  function walk(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch(e) { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name)) continue;
      const full = path.join(current, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (e.name !== 'index.html') continue;
      const raw = '/' + full.replace(PAGES_DIR + '/', '').replace('/index.html', '') + '/';
      const rel = (raw === '//' || raw === '/index.html/') ? '/' : raw;
      const [priority, freq] = getPriority(rel);
      urls.push({ rel, priority, freq });
    }
  }
  walk(dir);
  return urls;
}

function generateSitemap() {
  const urls = scanPages(PAGES_DIR);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE_URL}${u.rel}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(OUT_FILE, xml);
  console.log(`✓ Sitemap — ${urls.length} URLs → sitemap.xml`);
  return urls;
}

module.exports = { generateSitemap };

// Standalone
if (require.main === module) generateSitemap();
