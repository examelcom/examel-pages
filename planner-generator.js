/**
 * PLANNER GENERATOR
 * Generates individual planner pages → /planners/[slug]/
 * Also generates a /planners/ hub page.
 * Usage: called from generate-pages.js orchestrator
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const { buildSchema, buildOG, buildAnalytics} = require('./examel-config');

const BASE = '/opt/examel/examel-pages';

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function titleCase(s)   { return s ? s.split(' ').map(capitalize).join(' ') : ''; }
function formatTopic(t) { return t ? titleCase(t.replace(/-/g, ' ')) : ''; }

function plannerTypeLabel(ws) {
  const t = (ws.title + ' ' + (ws.topic || '')).toLowerCase();
  if (t.includes('chore'))    return 'Chore Chart';
  if (t.includes('habit'))    return 'Habit Tracker';
  if (t.includes('meal'))     return 'Meal Planner';
  if (t.includes('morning'))  return 'Morning Routine';
  if (t.includes('routine'))  return 'Daily Routine';
  if (t.includes('cleaning')) return 'Cleaning Schedule';
  if (t.includes('reward'))   return 'Reward Chart';
  if (t.includes('goal'))     return 'Goal Planner';
  if (t.includes('weekly'))   return 'Weekly Planner';
  if (t.includes('daily'))    return 'Daily Planner';
  if (t.includes('student'))  return 'Student Planner';
  if (t.includes('reading'))  return 'Reading Log';
  if (t.includes('wellness')) return 'Wellness Tracker';
  return 'Printable Planner';
}

function plannerCard(ws) {
  const url  = `/planners/${ws.slug}/`;
  const type = plannerTypeLabel(ws);
  const thumb = ws.preview_p1_url
    ? `<img src="${ws.preview_p1_url}" alt="${ws.title}" class="ws-card-thumb" loading="lazy">`
    : `<div class="ws-card-thumb-placeholder" style="background:linear-gradient(135deg,#F4F1FF 0%,#EDE8DF 100%);border-top:4px solid #6C5CE7"><span style="font-size:28px;opacity:0.25;font-weight:900;color:#6C5CE7;">${type.charAt(0)}</span></div>`;
  return `
    <a href="${url}" class="ws-card">
      ${thumb}
      <div class="ws-card-body">
        <div class="ws-card-badge" style="background:#6C5CE7">${type}</div>
        <h3>${ws.title}</h3>
        <p>${formatTopic(ws.topic)}</p>
        <span class="ws-card-btn">View Planner →</span>
      </div>
    </a>`;
}

function generatePlannerPages(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const planners = worksheets.filter(w => w.format === 'planner');
  if (!planners.length) { console.log('  ⚠️  No planner worksheets found — skipping planner pages (will generate once planners publish)'); return; }

  let count = 0;

  for (const ws of planners) {
    const dir = path.join(BASE, 'planners', ws.slug);
    fs.mkdirSync(dir, { recursive: true });

    const type         = plannerTypeLabel(ws);
    const downloadUrl  = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
    const canonicalUrl = `https://examel.com/planners/${ws.slug}/`;

    const related = planners.filter(p =>
      p.slug !== ws.slug && plannerTypeLabel(p) === type
    ).slice(0, 3);

    const relatedHtml = related.length
      ? `<div class="related"><h3 class="related-title">More ${type}s</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">${related.map(plannerCard).join('')}</div></div>`
      : '';

    const schemaHtml = buildSchema({
      type: 'EducationalResource',
      title: ws.title,
      description: `Free printable ${type}: ${ws.title}. Instant PDF download. No signup required.`,
      url: canonicalUrl,
      grade: 0,
      subject: 'Planner',
      teaches: type,
      thumbnail: ws.preview_p1_url || `https://examel.com/thumbnails/${ws.slug}.png`,
      isFree: true,
    });

    const ogHtml = buildOG({
      title: `${ws.title} — Free Printable ${type} | Examel`,
      description: `Free printable ${type}. Instant PDF download. No signup required. Print at home or school.`,
      image: ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`,
      url: canonicalUrl,
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${ws.title} — Free Printable ${type} | Examel</title>
  <meta name="description" content="Free printable ${type}: ${ws.title}. Instant PDF download. No signup required. Print at home or school.">
  <link rel="canonical" href="${canonicalUrl}">
  ${ogHtml}
  ${schemaHtml}
  ${sharedCSS}
  <style>
    .ws-hero{background:#1C1526;padding:52px 20px 44px;text-align:center;}
    .ws-hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(108,92,231,0.25);color:#A78BFA;padding:5px 14px;border-radius:100px;font-size:12px;font-weight:700;margin-bottom:16px;letter-spacing:0.5px;}
    .ws-hero h1{font-family:'Outfit',sans-serif;font-size:clamp(22px,3.5vw,36px);font-weight:800;color:white;letter-spacing:-0.5px;margin-bottom:10px;line-height:1.2;}
    .ws-hero p{color:rgba(255,255,255,0.55);font-size:15px;max-width:520px;margin:0 auto;}
    .ws-layout{max-width:860px;margin:0 auto;padding:40px 20px 64px;display:grid;grid-template-columns:1fr 320px;gap:32px;}
    .ws-preview img{width:100%;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.12);border:1px solid #EDE8DF;}
    .ws-preview-placeholder{width:100%;aspect-ratio:8.5/11;background:linear-gradient(135deg,#F4F1FF,#EDE8DF);border-radius:16px;border:2px dashed #6C5CE730;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;color:#6C5CE7;opacity:0.3;}
    .ws-sidebar{display:flex;flex-direction:column;gap:20px;}
    .ws-download-card{background:white;border-radius:20px;padding:28px;border:1px solid #EDE8DF;box-shadow:0 4px 20px rgba(0,0,0,0.06);}
    .ws-download-card h2{font-family:'Outfit',sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:8px;}
    .ws-download-card p{font-size:13px;color:#6B6475;margin-bottom:20px;line-height:1.6;}
    .btn-download{display:block;background:#6C5CE7;color:white;text-align:center;padding:15px 24px;border-radius:14px;text-decoration:none;font-family:'Outfit',sans-serif;font-weight:800;font-size:16px;transition:all 0.2s;}
    .btn-download:hover{background:#5A4BD1;transform:translateY(-2px);box-shadow:0 8px 24px rgba(108,92,231,0.3);}
    .ws-meta-card{background:white;border-radius:16px;padding:20px;border:1px solid #EDE8DF;}
    .ws-meta-card h3{font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;color:#A89FAE;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;}
    .ws-meta-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F5F3FF;font-size:14px;}
    .ws-meta-row:last-child{border-bottom:none;}
    .ws-meta-label{color:#6B6475;font-weight:500;}
    .ws-meta-value{color:#1A1420;font-weight:700;}
    .features{background:white;border-radius:16px;padding:20px;border:1px solid #EDE8DF;}
    .features h3{font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;color:#A89FAE;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;}
    .features ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;}
    .features li{font-size:13px;color:#4A4458;padding-left:20px;position:relative;}
    .features li::before{content:'✓';position:absolute;left:0;color:#6C5CE7;font-weight:700;}
    .related{max-width:860px;margin:0 auto;padding:0 20px 64px;}
    .related-title{font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;color:#1A1420;margin-bottom:20px;}
    @media(max-width:700px){.ws-layout{grid-template-columns:1fr;}.ws-sidebar{order:-1;}}
  </style>
${buildAnalytics()}
</head>
<body>
${siteHeader}
<div style="max-width:860px;margin:16px auto 0;padding:0 20px;font-size:14px;color:#A89FAE;display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
  <a href="/" style="color:#6C5CE7;text-decoration:none;font-weight:500;">Home</a>
  <span style="opacity:0.4;">/</span>
  <a href="/planners/" style="color:#6C5CE7;text-decoration:none;font-weight:500;">Planners</a>
  <span style="opacity:0.4;">/</span>
  <span>${ws.title}</span>
</div>
<div class="ws-hero">
  <div class="ws-hero-badge">📋 ${type}</div>
  <h1>${ws.title}</h1>
  <p>Printable ${type.toLowerCase()}. Instant PDF download. No signup required.</p>
</div>
<div class="ws-layout">
  <div class="ws-preview">
    ${ws.preview_p1_url
      ? `<img src="${ws.preview_p1_url}" alt="${ws.title} preview" loading="lazy">`
      : `<div class="ws-preview-placeholder">${type.charAt(0)}</div>`}
  </div>
  <div class="ws-sidebar">
    <div class="ws-download-card">
      <h2>Free Printable PDF</h2>
      <p>Instant download. No signup required. Print at home or school on US Letter paper.</p>
      <a href="${downloadUrl}" class="btn-download" target="_blank" rel="nofollow">⬇ Download Free PDF</a>
    </div>
    <div class="ws-meta-card">
      <h3>Details</h3>
      <div class="ws-meta-row"><span class="ws-meta-label">Type</span><span class="ws-meta-value">${type}</span></div>
      <div class="ws-meta-row"><span class="ws-meta-label">Format</span><span class="ws-meta-value">PDF · US Letter</span></div>
      <div class="ws-meta-row"><span class="ws-meta-label">Pages</span><span class="ws-meta-value">1 page</span></div>
      <div class="ws-meta-row"><span class="ws-meta-label">Cost</span><span class="ws-meta-value" style="color:#059669;">Free</span></div>
    </div>
    <div class="features">
      <h3>Includes</h3>
      <ul>
        <li>Print-ready PDF format</li>
        <li>US Letter size (8.5 × 11 in)</li>
        <li>High resolution — crisp on any printer</li>
        <li>No watermarks or branding clutter</li>
        <li>Free for home and classroom use</li>
      </ul>
    </div>
  </div>
</div>
${relatedHtml}
${siteFooter}
</body></html>`;

    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count++;
  }

  // Hub page
  const hubDir = path.join(BASE, 'planners');
  fs.mkdirSync(hubDir, { recursive: true });

  const byType = {};
  for (const p of planners) {
    const t = plannerTypeLabel(p);
    if (!byType[t]) byType[t] = [];
    byType[t].push(p);
  }

  const filterBtns = Object.entries(byType)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([type, items]) => `<a href="/planners/?type=${encodeURIComponent(type)}" class="filter-btn">${type} (${items.length})</a>`)
    .join('\n');

  const hubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Printable Planners for Kids & Families — Examel</title>
  <meta name="description" content="Free printable planners for kids and families. Chore charts, habit trackers, meal planners, morning routines, weekly planners and more. Instant PDF download.">
  <link rel="canonical" href="https://examel.com/planners/">
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
${siteHeader}
<div class="hero">
  <h1>Free Printable <span>Planners</span></h1>
  <p>${planners.length} printable planners — chore charts, habit trackers, meal planners, morning routines and more. Instant PDF download, no signup required.</p>
</div>
<div class="filter-bar">
  <a href="/planners/" class="filter-btn active">All Planners (${planners.length})</a>
  ${filterBtns}
</div>
<div class="grid">
  ${planners.map(plannerCard).join('\n')}
</div>
${siteFooter}
</body></html>`;

  fs.writeFileSync(path.join(hubDir, 'index.html'), hubHtml);
  console.log(`  ✅ Planners: ${count} individual pages + 1 hub page (/planners/)`);
}

module.exports = { generatePlannerPages };
