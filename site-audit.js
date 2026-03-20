const fs = require('fs');
const path = require('path');

const base = '/opt/examel/examel-pages';

// All routes that SHOULD exist
const expected = [
  { url: '/', desc: 'Homepage', priority: 'CRITICAL' },
  { url: '/about/', desc: 'About page', priority: 'HIGH' },
  { url: '/privacy-policy/', desc: 'Privacy Policy', priority: 'HIGH' },
  { url: '/terms/', desc: 'Terms of Use', priority: 'HIGH' },
  { url: '/404.html', desc: '404 page', priority: 'HIGH' },
  { url: '/robots.txt', desc: 'Robots.txt', priority: 'HIGH' },
  { url: '/sitemap.xml', desc: 'Sitemap', priority: 'CRITICAL' },

  // Master hubs
  { url: '/free-worksheets/', desc: 'All Worksheets Hub', priority: 'CRITICAL' },
  { url: '/free-math-worksheets/', desc: 'Math Hub', priority: 'CRITICAL' },
  { url: '/free-english-worksheets/', desc: 'English Hub', priority: 'CRITICAL' },
  { url: '/free-science-worksheets/', desc: 'Science Hub', priority: 'CRITICAL' },
  { url: '/free-math-drills/', desc: 'Drills Hub', priority: 'CRITICAL' },
  { url: '/free-reading-passages/', desc: 'Reading Hub', priority: 'CRITICAL' },
  { url: '/free-math-vocabulary/', desc: 'Vocab Hub', priority: 'HIGH' },
  { url: '/free-english-vocabulary/', desc: 'English Vocab Hub', priority: 'HIGH' },
  { url: '/free-science-vocabulary/', desc: 'Science Vocab Hub', priority: 'HIGH' },
  { url: '/word-searches/', desc: 'Word Searches Hub', priority: 'HIGH' },

  // Grade hubs - worksheets
  ...[1,2,3,4,5,6].map(g => ({ url: `/free-worksheets/grade-${g}/`, desc: `All Worksheets Grade ${g}`, priority: 'HIGH' })),
  ...[1,2,3,4,5,6].map(g => ({ url: `/free-math-worksheets/grade-${g}/`, desc: `Math Grade ${g}`, priority: 'HIGH' })),
  ...[1,2,3,4,5,6].map(g => ({ url: `/free-english-worksheets/grade-${g}/`, desc: `English Grade ${g}`, priority: 'HIGH' })),
  ...[1,2,3,4,5,6].map(g => ({ url: `/free-science-worksheets/grade-${g}/`, desc: `Science Grade ${g}`, priority: 'HIGH' })),
  ...[1,2,3,4,5,6].map(g => ({ url: `/free-reading-passages/grade-${g}/`, desc: `Reading Grade ${g}`, priority: 'MEDIUM' })),

  // Drills
  { url: '/free-multiplication-drills/', desc: 'Multiplication Drills Hub', priority: 'MEDIUM' },
  { url: '/free-division-drills/', desc: 'Division Drills Hub', priority: 'MEDIUM' },
  { url: '/free-addition-drills/', desc: 'Addition Drills Hub', priority: 'MEDIUM' },
  { url: '/free-subtraction-drills/', desc: 'Subtraction Drills Hub', priority: 'MEDIUM' },
  ...[1,2,3,4,5,6].map(g => ({ url: `/drills/math/grade-${g}/`, desc: `Math Drills Grade ${g} Hub`, priority: 'MEDIUM' })),
];

// Check what actually exists
function exists(url) {
  if (url.endsWith('.txt') || url.endsWith('.xml')) {
    return fs.existsSync(path.join(base, url));
  }
  if (url === '/') return fs.existsSync(path.join(base, 'index.html'));
  if (url === '/404.html') return fs.existsSync(path.join(base, '404.html'));
  const clean = url.endsWith('/') ? url.slice(0, -1) : url;
  return fs.existsSync(path.join(base, clean, 'index.html')) ||
         fs.existsSync(path.join(base, clean + '.html'));
}

// Count actual pages
const allFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f === 'index.html') allFiles.push(full.replace(base, '').replace('/index.html', '/'));
  }
}
walk(base);

const worksheetPages = allFiles.filter(f => f.startsWith('/worksheets/')).length;
const drillPages = allFiles.filter(f => f.startsWith('/drills/math/grade') && f.split('/').length > 5).length;
const vocabPages = allFiles.filter(f => f.startsWith('/vocab-match/')).length;
const readingPages = allFiles.filter(f => f.startsWith('/reading-passages/')).length;
const wordSearchPages = allFiles.filter(f => f.startsWith('/word-searches/')).length;
const wrongWordSearch = allFiles.filter(f => f.startsWith('/worksheets/word-search')).length;

// Build HTML report
const rows = expected.map(e => {
  const ok = exists(e.url);
  return `<tr class="${ok ? 'ok' : 'missing'}">
    <td><code>${e.url}</code></td>
    <td>${e.desc}</td>
    <td><span class="priority ${e.priority.toLowerCase()}">${e.priority}</span></td>
    <td><span class="status">${ok ? '✅ EXISTS' : '❌ MISSING'}</span></td>
  </tr>`;
}).join('');

const missing = expected.filter(e => !exists(e.url));
const critical = missing.filter(e => e.priority === 'CRITICAL');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Examel Site Audit — ${new Date().toLocaleDateString()}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:system-ui,sans-serif;background:#0F0A1A;color:#E0D8F0;padding:24px;}
h1{font-size:24px;font-weight:800;color:white;margin-bottom:4px;}
.meta{font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:32px;}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:32px;}
.stat{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;}
.stat-num{font-size:28px;font-weight:800;color:#6C5CE7;font-family:system-ui;}
.stat-label{font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;}
.stat.warn .stat-num{color:#F59E0B;}
.stat.danger .stat-num{color:#EF4444;}
.section-title{font-size:16px;font-weight:700;color:white;margin-bottom:12px;margin-top:32px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{text-align:left;padding:10px 12px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-weight:600;font-size:11px;letter-spacing:1px;text-transform:uppercase;}
td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05);}
tr.ok{background:rgba(16,185,129,0.03);}
tr.missing{background:rgba(239,68,68,0.06);}
tr.missing td:first-child code{color:#F87171;}
code{font-size:12px;color:#A78BFA;font-family:monospace;}
.priority{padding:2px 8px;border-radius:100px;font-size:11px;font-weight:700;}
.priority.critical{background:rgba(239,68,68,0.2);color:#F87171;}
.priority.high{background:rgba(245,158,11,0.2);color:#FCD34D;}
.priority.medium{background:rgba(99,102,241,0.2);color:#A5B4FC;}
.status{font-size:12px;font-weight:700;}
.alert{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px;margin-bottom:24px;}
.alert h3{color:#F87171;font-size:14px;margin-bottom:8px;}
.alert ul{list-style:none;padding:0;}
.alert li{font-size:13px;color:#FCA5A5;padding:3px 0;}
.alert li::before{content:'→ ';color:#EF4444;}
</style>
</head>
<body>
<h1>Examel Site Audit</h1>
<div class="meta">Generated: ${new Date().toISOString()} · examel.com</div>

${critical.length > 0 ? `<div class="alert">
<h3>⚠️ ${critical.length} CRITICAL issues need fixing NOW</h3>
<ul>${critical.map(c => `<li>${c.url} — ${c.desc}</li>`).join('')}</ul>
</div>` : '<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:16px;margin-bottom:24px;color:#6EE7B7;font-weight:700;">✅ No critical issues</div>'}

<div class="stats">
  <div class="stat"><div class="stat-num">${allFiles.length}</div><div class="stat-label">Total pages</div></div>
  <div class="stat"><div class="stat-num">${worksheetPages}</div><div class="stat-label">Worksheet pages</div></div>
  <div class="stat"><div class="stat-num">${drillPages}</div><div class="stat-label">Drill pages</div></div>
  <div class="stat"><div class="stat-num">${vocabPages}</div><div class="stat-label">Vocab pages</div></div>
  <div class="stat"><div class="stat-num">${readingPages}</div><div class="stat-label">Reading pages</div></div>
  <div class="stat"><div class="stat-num">${wordSearchPages}</div><div class="stat-label">Word search pages</div></div>
  <div class="stat ${wrongWordSearch > 0 ? 'danger' : 'ok'}"><div class="stat-num">${wrongWordSearch}</div><div class="stat-label">Wrong URL word searches</div></div>
  <div class="stat ${missing.length > 0 ? 'warn' : 'ok'}"><div class="stat-num">${missing.length}</div><div class="stat-label">Missing pages</div></div>
</div>

<div class="section-title">Route Status — All Expected Pages</div>
<table>
<thead><tr><th>URL</th><th>Description</th><th>Priority</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body>
</html>`;

fs.writeFileSync(path.join(base, 'site-audit.html'), html);
console.log('Audit complete');
console.log(`Total pages: ${allFiles.length}`);
console.log(`Missing: ${missing.length}`);
console.log(`Critical missing: ${critical.length}`);
console.log(`Wrong URL word searches: ${wrongWordSearch}`);
missing.forEach(m => console.log(`  ❌ ${m.priority} — ${m.url}`));
