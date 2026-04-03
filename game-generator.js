/**
 * GAME GENERATOR
 * Generates individual game worksheet pages → /games/[slug]/
 * Also generates a /free-games/ hub page.
 * Usage: called from generate-pages.js orchestrator
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { buildSchema, buildOG, buildCharSVG } = require('./examel-config');

const BASE = '/opt/examel/examel-pages';

const GAME_META = {
  'game-matching':       { label: 'Matching',         emoji: '🔗', desc: 'Match each term to its definition by drawing lines.' },
  'game-truefalse':      { label: 'True / False',      emoji: '✅', desc: 'Read each statement and decide if it is true or false.' },
  'game-fillinblank':    { label: 'Fill in the Blank', emoji: '✏️', desc: 'Complete each sentence by filling in the missing word.' },
  'game-multiplechoice': { label: 'Multiple Choice',   emoji: '🔘', desc: 'Choose the correct answer from four options.' },
  'game-oddoneout':      { label: 'Odd One Out',       emoji: '🎯', desc: 'Find the item that does not belong in each group.' },
  'game-bingo':          { label: 'Bingo',             emoji: '🎲', desc: 'Play bingo with vocabulary and key concepts.' },
  'game-vocabmatch':     { label: 'Vocab Match',       emoji: '📖', desc: 'Match vocabulary words to their meanings.' },
  'game-categorysort':   { label: 'Category Sort',     emoji: '🗂️', desc: 'Sort items into the correct category columns.' },
  'game-flashcards':     { label: 'Flashcards',        emoji: '🃏', desc: 'Print and cut out flashcards to study key terms.' },
  'game-whoami':         { label: 'Who Am I?',         emoji: '🕵️', desc: 'Read the clues and guess the mystery subject.' },
  'game-riddles':        { label: 'Riddles',           emoji: '🧩', desc: 'Solve fun riddles related to the topic.' },
  'game-wordsearch':     { label: 'Word Search',       emoji: '🔍', desc: 'Find hidden words in the letter grid.' },
  'game-timeline':       { label: 'Timeline',          emoji: '📅', desc: 'Order events in the correct chronological sequence.' },
  'game-crossword':      { label: 'Crossword',         emoji: '📰', desc: 'Complete the crossword using the clues provided.' },
  'game-wouldyourather': { label: 'Would You Rather',  emoji: '🤔', desc: 'Discuss fun dilemmas and explain your reasoning.' },
  // ── Curriculum Engines (tier 5) ──
  'game-place-value':    { label: 'Place Value',       emoji: '🔢', desc: 'Practice place value with hundreds charts, base-10 blocks, expanded form, and more.' },
  'game-multiplication': { label: 'Multiplication',    emoji: '✖️', desc: 'Master multiplication with times tables, arrays, fact families, and word problems.' },
  'game-phonics':        { label: 'Phonics',           emoji: '🔤', desc: 'Build reading skills with CVC words, blends, digraphs, sight words, and rhyming.' },
  'game-reading-comp':   { label: 'Reading Comp',      emoji: '📖', desc: 'Strengthen comprehension with main idea, inference, text evidence, and more.' },
  'game-geometry':       { label: 'Geometry',          emoji: '📐', desc: 'Explore shapes, perimeter, area, angles, symmetry, and coordinate grids.' },
  'game-measurement':    { label: 'Measurement',       emoji: '📏', desc: 'Practice length, weight, time, money, temperature, and unit conversion.' },
  'game-graphing':       { label: 'Graphing & Data',   emoji: '📊', desc: 'Read and create bar graphs, tally charts, line graphs, pie charts, and more.' },
  'game-patterns':       { label: 'Patterns',          emoji: '🔁', desc: 'Identify and extend patterns, skip count, complete function tables, and find rules.' },
  'game-seasonal':       { label: 'Seasonal',          emoji: '🎃', desc: 'Holiday and seasonal worksheets including word searches, writing prompts, and math review.' },
};

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function titleCase(s)   { return s ? s.split(' ').map(capitalize).join(' ') : ''; }
function formatTopic(t) { return t ? titleCase(t.replace(/-/g, ' ')) : ''; }

function subjectColor(s) {
  const m = { math:'#7C3AED', english:'#DB2777', science:'#059669', social_studies:'#0891B2', reading:'#0891B2' };
  return m[s] || '#6C5CE7';
}

function gameCard(ws) {
  const meta  = GAME_META[ws.format] || { label: ws.format, emoji: '🎮', desc: '' };
  const color = subjectColor(ws.subject);
  const url   = `/games/${ws.slug}/`;
  const thumb = ws.preview_p1_url
    ? `<img src="${ws.preview_p1_url}" alt="${ws.title}" class="ws-card-thumb" loading="lazy">`
    : `<div class="ws-card-thumb-placeholder" style="background:linear-gradient(135deg,${color}18 0%,${color}08 100%);border-top:4px solid ${color}"><span style="font-size:32px;">${meta.emoji}</span></div>`;
  return `
    <a href="${url}" class="ws-card">
      ${thumb}
      <div class="ws-card-body">
        <div class="ws-card-badge" style="background:${color}">${capitalize(ws.subject)} · ${meta.label}</div>
        <h3>${ws.title}</h3>
        <p>${formatTopic(ws.topic)}</p>
        <span class="ws-card-btn">Download Free →</span>
      </div>
    </a>`;
}

function generateGamePages(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const games = worksheets.filter(w => w.format && w.format.startsWith('game-'));
  if (!games.length) { console.log('  ⚠️  No game worksheets found — skipping game pages'); return; }

  let count = 0;

  for (const ws of games) {
    const dir = path.join(BASE, 'games', ws.slug);
    fs.mkdirSync(dir, { recursive: true });

    const meta        = GAME_META[ws.format] || { label: ws.format, emoji: '🎮', desc: '' };
    const color       = subjectColor(ws.subject);
    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
    const canonicalUrl = `https://examel.com/games/${ws.slug}/`;
    const charSVG     = buildCharSVG(ws.subject);

    const related = games.filter(g =>
      g.slug !== ws.slug && (g.subject === ws.subject || g.topic === ws.topic)
    ).slice(0, 3);

    const relatedHtml = related.length
      ? `<div class="related"><h3 class="related-title">More Like This</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">${related.map(gameCard).join('')}</div></div>`
      : '';

    const schemaHtml = buildSchema({
      type: 'EducationalResource',
      title: ws.title,
      description: `Free printable ${meta.label} about ${formatTopic(ws.topic)}. ${meta.desc} Download PDF free.`,
      url: canonicalUrl,
      grade: ws.grade || 0,
      subject: capitalize(ws.subject),
      teaches: formatTopic(ws.topic),
      thumbnail: ws.preview_p1_url || `https://examel.com/thumbnails/${ws.slug}.png`,
      isFree: true,
    });

    const ogHtml = buildOG({
      title: `${ws.title} — Free Printable ${meta.label} Worksheet | Examel`,
      description: `Free printable ${meta.label} about ${formatTopic(ws.topic)}. ${meta.desc} No signup required.`,
      image: ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`,
      url: canonicalUrl,
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${ws.title} — Free Printable ${meta.label} Worksheet | Examel</title>
  <meta name="description" content="Free printable ${meta.label} about ${formatTopic(ws.topic)}. ${meta.desc} No signup required. Instant PDF download.">
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
    .ws-preview-placeholder{width:100%;aspect-ratio:8.5/11;background:linear-gradient(135deg,${color}12,${color}06);border-radius:16px;border:2px dashed ${color}30;display:flex;align-items:center;justify-content:center;font-size:64px;}
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
    .ws-char{text-align:center;padding:20px;background:white;border-radius:16px;border:1px solid #EDE8DF;}
    .related{max-width:860px;margin:0 auto;padding:0 20px 64px;}
    .related-title{font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;color:#1A1420;margin-bottom:20px;}
    @media(max-width:700px){.ws-layout{grid-template-columns:1fr;}.ws-sidebar{order:-1;}}
  </style>
</head>
<body>
${siteHeader}
<div style="max-width:860px;margin:16px auto 0;padding:0 20px;font-size:14px;color:#A89FAE;display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
  <a href="/" style="color:#6C5CE7;text-decoration:none;font-weight:500;">Home</a>
  <span style="opacity:0.4;">/</span>
  <a href="/free-games/" style="color:#6C5CE7;text-decoration:none;font-weight:500;">Games</a>
  <span style="opacity:0.4;">/</span>
  <span>${ws.title}</span>
</div>
<div class="ws-hero">
  <div class="ws-hero-badge">${meta.emoji} ${meta.label}</div>
  <h1>${ws.title}</h1>
  <p>${meta.desc}</p>
</div>
<div class="ws-layout">
  <div class="ws-preview">
    ${ws.preview_p1_url
      ? `<img src="${ws.preview_p1_url}" alt="${ws.title} preview" loading="lazy">`
      : `<div class="ws-preview-placeholder">${meta.emoji}</div>`}
  </div>
  <div class="ws-sidebar">
    <div class="ws-download-card">
      <h2>Free Printable PDF</h2>
      <p>Instant download. No signup required. Print at home or school.</p>
      <a href="${downloadUrl}" class="btn-download" target="_blank" rel="nofollow">⬇ Download Free PDF</a>
    </div>
    <div class="ws-meta-card">
      <h3>Details</h3>
      <div class="ws-meta-row"><span class="ws-meta-label">Type</span><span class="ws-meta-value">${meta.label}</span></div>
      <div class="ws-meta-row"><span class="ws-meta-label">Subject</span><span class="ws-meta-value">${capitalize(ws.subject)}</span></div>
      <div class="ws-meta-row"><span class="ws-meta-label">Topic</span><span class="ws-meta-value">${formatTopic(ws.topic)}</span></div>
      ${ws.grade ? `<div class="ws-meta-row"><span class="ws-meta-label">Grade</span><span class="ws-meta-value">Grade ${ws.grade}</span></div>` : ''}
      <div class="ws-meta-row"><span class="ws-meta-label">Format</span><span class="ws-meta-value">PDF · US Letter</span></div>
      <div class="ws-meta-row"><span class="ws-meta-label">Cost</span><span class="ws-meta-value" style="color:#059669;">Free</span></div>
    </div>
    <div class="ws-char">${charSVG}</div>
  </div>
</div>
${relatedHtml}
${siteFooter}
</body></html>`;

    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count++;
  }

  // Hub page
  const hubDir = path.join(BASE, 'free-games');
  fs.mkdirSync(hubDir, { recursive: true });

  const byFormat = {};
  for (const g of games) {
    if (!byFormat[g.format]) byFormat[g.format] = [];
    byFormat[g.format].push(g);
  }

  const filterBtns = Object.keys(byFormat).map(fmt => {
    const meta = GAME_META[fmt] || { label: fmt, emoji: '🎮' };
    return `<a href="/free-games/?type=${fmt}" class="filter-btn">${meta.emoji} ${meta.label} (${byFormat[fmt].length})</a>`;
  }).join('\n');

  const hubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Printable Game Worksheets for Kids — Examel</title>
  <meta name="description" content="Free printable game worksheets for K-8. Matching, true/false, fill-in-blank, multiple choice, bingo and more. Instant PDF download. No signup required.">
  <link rel="canonical" href="https://examel.com/free-games/">
  ${sharedCSS}
</head>
<body>
${siteHeader}
<div class="hero">
  <h1>Free Printable <span>Game Worksheets</span></h1>
  <p>${games.length} printable games — matching, true/false, multiple choice, bingo, and more. Free PDF download, no signup required.</p>
</div>
<div class="filter-bar">
  <a href="/free-games/" class="filter-btn active">All Games (${games.length})</a>
  ${filterBtns}
</div>
<div class="grid">
  ${games.map(gameCard).join('\n')}
</div>
${siteFooter}
</body></html>`;

  fs.writeFileSync(path.join(hubDir, 'index.html'), hubHtml);
  console.log(`  ✅ Games: ${count} individual pages + 1 hub page (/free-games/)`);
}

module.exports = { generateGamePages };
