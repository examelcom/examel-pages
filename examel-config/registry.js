/**
 * EXAMEL BUILD REGISTRY — Tracks every page written during a build
 * Sitemap built from registry. Linking-engine checks against registry.
 * No page exists unless it's registered.
 */

const fs = require('fs');
const path = require('path');

const _pages = new Set();
const _pageData = []; // {url, priority, freq}

function registerPage(url, priority, freq) {
  const clean = url.replace(/\/+$/, '/');
  _pages.add(clean);
  _pageData.push({ url: clean, priority: priority || '0.7', freq: freq || 'monthly' });
}

function isRegistered(url) {
  return _pages.has(url) || _pages.has(url.replace(/\/+$/, '/'));
}

function getRegistry() {
  return new Set(_pages);
}

function getPageCount() {
  return _pages.size;
}

// Scan filesystem and register all existing pages (for use before build)
function registerExistingPages(baseDir) {
  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name === '.git' || e.name === 'node_modules' || e.name === 'examel-config') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name === 'index.html') {
          const relRaw = full.replace(baseDir + '/', '').replace('/index.html', '');
          const rel = relRaw === '' ? '/' : '/' + relRaw + '/';
          _pages.add(rel);
        }
      }
    } catch(e) {}
  }
  walk(baseDir);
}

function buildSitemap(baseUrl) {
  const urls = _pageData.map(p => `  <url>
    <loc>${baseUrl}${p.url === '/' ? '' : p.url}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function clear() {
  _pages.clear();
  _pageData.length = 0;
}

module.exports = {
  registerPage,
  isRegistered,
  getRegistry,
  getPageCount,
  registerExistingPages,
  buildSitemap,
  clear
};
