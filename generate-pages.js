/**
 * GENERATE PAGES — Thin Orchestrator
 * Coordinates all page generators. Does NOT generate pages itself.
 * Each generator is independent and can be run with --filter flags.
 *
 * Usage:
 *   node generate-pages.js                          # full build
 *   node generate-pages.js --filter format=worksheet
 *   node generate-pages.js --filter subject=math
 *   node generate-pages.js --filter grade=3
 */

'use strict';
require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const path = require('path');
const fs   = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ── EXISTING GENERATORS (individual pages per format) ──
const { generateWordSearchPages }    = require('./word-search-generator.js');
const { generateDrillPagesV2 }       = require('./drill-generator-v2.js');
const { generateDrillPages }         = require('./drill-generator.js');
const { generateVocabMatchPages }    = require('./vocab-match-generator.js');
const { generateReadingPassagePages }= require('./reading-passage-generator.js');
const { getPedagogicalLinks }        = require('./linking-engine.js');

// ── NEW GENERATORS (GAP 3 split) ──
const { generateWorksheetPages } = require('./worksheet-generator.js');
const { generateCategoryHubs }   = require('./category-hub-generator.js');
const { generateTopicHubs }      = require('./topic-hub-generator.js');
const { generateFormatHubs }     = require('./format-hub-generator.js');
const { generateSitemap }        = require('./sitemap-generator.js');
const { generateGamePages }    = require('./game-generator.js');
const { generatePlannerPages } = require('./planner-generator.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ── HELPERS ───────────────────────────────────────────────────────────────
const gradeColor   = (grade) => grade <= 2 ? '#FF6B6B' : grade <= 4 ? '#6C5CE7' : '#0984E3';
const capitalize   = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const titleCase    = (s) => s ? s.split(' ').map(capitalize).join(' ') : '';
const formatTopic  = (t) => t ? titleCase(t.replace(/-/g, ' ')) : '';
const formatTheme  = (t) => t ? titleCase(t.replace(/-/g, ' ')) : '';

function subjectColor(subject) {
  const m = { math:'#7C3AED', english:'#DB2777', science:'#059669', 'drill-grid':'#DC2626', reading:'#0891B2', vocab:'#D97706' };
  return m[subject?.toLowerCase()] || '#6C5CE7';
}
function subjectEmoji(subject) {
  const m = { math:'📐', english:'📖', science:'🔬', 'drill-grid':'⚡', reading:'📚', vocab:'💬' };
  return m[subject?.toLowerCase()] || '📄';
}

const { getCardUrl, buildCharSVG } = require('./examel-config');

function worksheetCard(ws) {
  const color        = subjectColor(ws.format === 'drill-grid' ? 'drill-grid' : ws.subject);
  const url          = getCardUrl(ws);
  const subjectLabel = capitalize(ws.subject);
  const thumb        = ws.preview_p1_url
    ? `<img src="${ws.preview_p1_url}" alt="${ws.title}" class="ws-card-thumb" loading="lazy">`
    : `<div class="ws-card-thumb-placeholder" style="background:linear-gradient(135deg,${color}18 0%,${color}08 100%);border-top:4px solid ${color}"><span style="font-size:28px;opacity:0.25;font-weight:900;color:${color};letter-spacing:-1px">${subjectLabel}</span></div>`;
  return `
    <a href="${url}" class="ws-card">
      ${thumb}
      <div class="ws-card-body">
        <div class="ws-card-badge" style="background:${color}">${capitalize(ws.subject)} · Grade ${ws.grade}</div>
        <h3>${ws.title}</h3>
        <p>${formatTopic(ws.topic)} · ${formatTheme(ws.theme)} theme</p>
        <span class="ws-card-btn">View Worksheet →</span>
      </div>
    </a>`;
}

// ── FILTER FLAGS ──────────────────────────────────────────────────────────
const FILTER = {};
const filterIdx = process.argv.indexOf('--filter');
if (filterIdx !== -1 && process.argv[filterIdx + 1]) {
  process.argv[filterIdx + 1].split(',').forEach(pair => {
    const [k, v] = pair.trim().split('=');
    if (k && v) FILTER[k.trim()] = v.trim().toLowerCase();
  });
  console.log('🔍 Filter active:', JSON.stringify(FILTER));
}
function shouldRun(section) {
  if (!Object.keys(FILTER).length) return true;
  const fmt  = FILTER.format;
  const subj = FILTER.subject;
  switch (section) {
    case 'worksheets':       return !fmt || fmt === 'worksheet';
    case 'category':         return !fmt || fmt === 'worksheet';
    case 'subject-hub':      return !fmt || fmt === 'worksheet';
    case 'grade-hub':        return !fmt || fmt === 'worksheet';
    case 'topic-hub':        return !fmt || fmt === 'worksheet';
    case 'drill-hub':        return !fmt || fmt === 'drill-grid';
    case 'vocab-hub':        return !fmt || fmt === 'vocab-match';
    case 'reading-hub':      return !fmt || fmt === 'reading-passage';
    case 'free-ws-hub':      return !fmt || fmt === 'worksheet';
    case 'word-search-hub':  return !fmt || fmt === 'word-search';
    case 'drills-grade-hub': return !fmt || fmt === 'drill-grid';
    case 'format-hubs':      return true;
    case 'sitemap':          return true;
    default:                 return true;
  }
}

// ── SHARED CSS / HEADER / FOOTER ──────────────────────────────────────────
const sharedCSS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:'DM Sans',system-ui,sans-serif;background:#FAF8F3;color:#1A1420;-webkit-font-smoothing:antialiased;}
    h1,h2,h3,h4,.site-logo-text,.filter-btn,.ws-card-btn,.hub-card h3,.hero h1,.footer-heading{font-family:'Outfit',sans-serif;}
    .site-header{background:#1C1526;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:200;border-bottom:1px solid rgba(255,255,255,0.06);box-shadow:0 4px 24px rgba(0,0,0,0.18);}
    .site-logo{display:flex;align-items:center;gap:10px;text-decoration:none;transition:transform 0.2s;}
    .site-logo:hover{transform:translateY(-1px);}
    .site-logo-text{font-size:20px;font-weight:800;letter-spacing:-1px;color:white;}
    .site-logo-text span{color:#6C5CE7;}
    .site-header nav{display:flex;align-items:center;gap:2px;}
    .site-header nav a{color:rgba(255,255,255,0.6);text-decoration:none;font-size:13px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all 0.2s;}
    .site-header nav a:hover{color:white;background:rgba(108,92,231,0.2);}
    :root{--color-brand:#6C5CE7;--color-brand-text:#4A3BBF;}
    .breadcrumb{max-width:860px;margin:18px auto 0;padding:0 20px;font-size:14px;color:#A89FAE;}
    .breadcrumb ol{list-style:none;padding:0;margin:0;display:flex;align-items:center;flex-wrap:wrap;gap:0;}
    .breadcrumb li{display:flex;align-items:center;}
    .breadcrumb a{color:var(--color-brand-text);text-decoration:none;font-weight:500;}
    .breadcrumb a:hover{text-decoration:underline;opacity:0.85;}
    .breadcrumb [aria-current=page]{color:#6B6475;font-weight:400;}
    .breadcrumb .sep{opacity:0.35;margin:0 6px;font-size:12px;}
    .hero{padding:64px 20px 56px;text-align:center;background:#FAF8F3;}
    .hero h1{font-size:clamp(26px,4vw,44px);margin-bottom:14px;color:#1A1420;font-weight:800;letter-spacing:-1.5px;line-height:1.15;}
    .hero h1 span{color:#6C5CE7;}
    .hero p{font-size:17px;color:#6B6475;max-width:580px;margin:0 auto;line-height:1.75;}
    .filter-bar{max-width:1100px;margin:0 auto 32px;padding:0 20px;display:flex;gap:10px;flex-wrap:wrap;}
    .filter-btn{padding:8px 20px;border-radius:100px;text-decoration:none;font-size:13px;font-weight:700;border:2px solid #EDE8DF;color:#6B6475;background:white;transition:all 0.2s;}
    .filter-btn:hover,.filter-btn.active{background:#6C5CE7;color:white;border-color:#6C5CE7;}
    .grid{max-width:1100px;margin:0 auto;padding:0 20px 64px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
    .ws-card{background:white;border-radius:20px;overflow:hidden;text-decoration:none;color:#1A1420;display:block;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .ws-card:hover{transform:translateY(-5px);box-shadow:0 8px 32px rgba(108,92,231,0.14),0 2px 8px rgba(0,0,0,0.04);}
    .ws-card-thumb{width:100%;height:160px;object-fit:cover;object-position:top;display:block;border-bottom:1px solid #EDE8DF;}
    .ws-card-thumb-placeholder{width:100%;height:160px;background:linear-gradient(135deg,#F4F1FF 0%,#EDE8DF 100%);display:flex;align-items:center;justify-content:center;font-size:32px;}
    .ws-card-body{padding:16px 18px 18px;}
    .ws-card-badge{display:inline-block;color:white;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;margin-bottom:10px;}
    .ws-card h3{font-size:14px;margin-bottom:5px;line-height:1.5;font-weight:700;color:#1A1420;}
    .ws-card p{font-size:12px;color:#A89FAE;margin-bottom:12px;line-height:1.5;}
    .ws-card-btn{font-size:12px;font-weight:700;color:#4A3BBF;}
    .hub-grid{max-width:1100px;margin:0 auto;padding:0 20px 64px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
    .hub-card{background:white;border-radius:24px;padding:36px 20px;text-decoration:none;color:#1A1420;text-align:center;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .hub-card:hover{transform:translateY(-5px);box-shadow:0 8px 32px rgba(108,92,231,0.14),0 2px 8px rgba(0,0,0,0.04);}
    .hub-card .hub-icon{font-size:40px;margin-bottom:14px;display:block;}
    .hub-card h3{font-size:17px;margin-bottom:6px;font-weight:700;}
    .hub-card p{font-size:13px;color:#6B6475;line-height:1.6;}
    .site-footer{padding:52px 20px 28px;background:#1C1526;border-top:3px solid #6C5CE7;margin-top:64px;}
    .footer-inner{max-width:1100px;margin:0 auto;}
    .footer-logo{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:36px;}
    .footer-motto{font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:1.5px;margin-top:2px;}
    .footer-grid{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;margin-bottom:36px;}
    .footer-col{display:flex;flex-direction:column;gap:10px;min-width:130px;}
    .footer-heading{font-size:10px;font-weight:800;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;}
    .site-footer a{color:rgba(255,255,255,0.5);text-decoration:none;font-size:15px;transition:color 0.2s;font-weight:500;}
    .site-footer a:hover{color:#4A3BBF;}
    .footer-bottom{text-align:center;font-size:14px;color:rgba(255,255,255,0.2);border-top:1px solid rgba(255,255,255,0.07);padding-top:24px;}
    .mobile-menu-btn{display:none;background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;}
    /* ── SEARCH ── */
    .site-search{position:relative;flex:1;max-width:420px;margin:0 16px;}
    .site-search-input{width:100%;padding:9px 16px;border-radius:100px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.08);color:white;font-size:14px;font-family:inherit;outline:none;transition:all 0.2s;}
    .site-search-input::placeholder{color:rgba(255,255,255,0.35);}
    .site-search-input:focus{background:rgba(255,255,255,0.12);border-color:rgba(108,92,231,0.6);box-shadow:0 0 0 3px rgba(108,92,231,0.15);}
    .site-search-results{display:none;position:absolute;top:calc(100% + 8px);left:0;right:0;background:white;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);z-index:999;overflow:hidden;max-height:400px;overflow-y:auto;}
    .site-search-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:#6C5CE7;border:none;border-radius:100px;width:32px;height:32px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;}
    .site-search-btn:hover{background:#5A4BD1;}
    .site-search{position:relative;flex:1;max-width:420px;margin:0 16px;}
    .mobile-nav{display:none;position:absolute;top:64px;left:0;right:0;background:#1C1526;border-bottom:2px solid #6C5CE7;padding:16px 20px;z-index:199;flex-direction:column;gap:4px;}
    .mobile-nav a{color:rgba(255,255,255,0.7);text-decoration:none;font-size:15px;font-weight:600;padding:10px 14px;border-radius:10px;transition:all 0.2s;font-family:'Outfit',sans-serif;}
    .mobile-nav a:hover{color:white;background:rgba(108,92,231,0.2);}
    .mobile-nav.open{display:flex;}
    @media(max-width:768px){
      .site-header nav{display:none;}
      .mobile-menu-btn{display:block;}
      .hub-grid{grid-template-columns:repeat(2,1fr);}
      .grid{grid-template-columns:repeat(2,1fr);}
    }
    @media(max-width:480px){
      .grid{grid-template-columns:1fr;}
      .hub-grid{grid-template-columns:1fr;}
    }

    /* ── MEGA MENU ── */
    .mega-nav{display:flex;align-items:center;gap:0;}
    .mega-nav-item{position:relative;}
    .mega-nav-link{color:rgba(255,255,255,0.6);text-decoration:none;font-size:13px;font-weight:600;padding:7px 10px;border-radius:8px;transition:all 0.2s;display:inline-block;}
    .mega-nav-link:hover{color:white;background:rgba(108,92,231,0.2);}
    .mega-nav-toggle{background:none;border:none;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;padding:7px 4px 7px 2px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all 0.2s;}
    .mega-nav-toggle:hover{color:white;}
    .mega-nav-toggle svg{vertical-align:middle;margin-left:1px;transition:transform 0.2s;}
    .mega-panel{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(8px);background:white;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.06);z-index:300;opacity:0;visibility:hidden;transition:opacity 0.2s 0.12s,visibility 0s 0.35s,transform 0.2s 0.12s;min-width:520px;padding:24px 28px;}
    .mega-nav-item:hover>.mega-panel,.mega-nav-item:focus-within>.mega-panel{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);transition:opacity 0.2s 0.12s,visibility 0s 0s,transform 0.2s 0.12s;}
    .mega-nav-toggle[aria-expanded="true"]+.mega-panel{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);transition:opacity 0.2s,visibility 0s,transform 0.2s;}
    .mega-nav-toggle[aria-expanded="true"] svg{transform:rotate(180deg);}
    .mega-panel-inner{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
    .mega-col-heading{font-size:13px;font-weight:800;margin-bottom:10px;font-family:'Outfit',sans-serif;letter-spacing:-0.2px;}
    .mega-panel a{display:block;font-size:13px;color:#4A3F55;text-decoration:none;padding:4px 0;transition:color 0.15s;font-weight:500;}
    .mega-panel a:hover{color:#6C5CE7;}
    .mega-see-all{font-weight:700 !important;margin-top:6px;font-size:12px !important;}
    .mega-grades-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;min-width:360px;}
    .mega-grade-card{display:flex;flex-direction:column;align-items:center;padding:16px 12px;border-radius:12px;text-decoration:none;color:#1A1420;border:1px solid #EDE8DF;transition:all 0.2s;}
    .mega-grade-card:hover{background:#6C5CE7;color:white;border-color:#6C5CE7;transform:translateY(-2px);}
    .mega-grade-num{font-size:24px;font-weight:900;font-family:'Outfit',sans-serif;letter-spacing:-0.5px;}
    .mega-grade-label{font-size:10px;color:#A89FAE;margin-top:2px;}
    .mega-grade-card:hover .mega-grade-label{color:rgba(255,255,255,0.7);}
    /* Mobile accordion */
    .mobile-accordion{border-top:1px solid rgba(255,255,255,0.08);}
    .mobile-acc-trigger{width:100%;background:none;border:none;color:rgba(255,255,255,0.7);font-size:15px;font-weight:600;padding:12px 14px;text-align:left;cursor:pointer;font-family:'Outfit',sans-serif;display:flex;justify-content:space-between;align-items:center;}
    .mobile-acc-trigger:hover{color:white;}
    .mobile-acc-trigger::after{content:'▸';transition:transform 0.2s;}
    .mobile-acc-trigger.open::after{transform:rotate(90deg);}
    .mobile-acc-panel{display:none;padding:0 14px 12px;}
    .mobile-acc-panel.open{display:block;}
    .mobile-acc-panel a{display:block;color:rgba(255,255,255,0.5);text-decoration:none;font-size:14px;padding:6px 12px;border-radius:6px;transition:all 0.15s;}
    .mobile-acc-panel a:hover{color:white;background:rgba(108,92,231,0.15);}
    .mobile-acc-heading{font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1px;text-transform:uppercase;padding:10px 12px 4px;font-family:'Outfit',sans-serif;}
    @media(max-width:900px){.mega-nav{display:none;}}
    @media(min-width:901px){.mobile-accordion{display:none;}}
  </style>`;

const siteHeader = `
  <header class="site-header" data-pagefind-ignore>
    <a href="https://examel.com" class="site-logo">
      <svg width="30" height="30" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="16" fill="#6C5CE7"/>
        <rect x="15" y="15" width="9" height="42" rx="2.5" fill="white"/>
        <rect x="15" y="15" width="15" height="9" rx="2.5" fill="white"/>
        <rect x="15" y="31.5" width="24" height="9" rx="2.5" fill="white"/>
        <rect x="15" y="48" width="33" height="9" rx="2.5" fill="white"/>
      </svg>
      <span class="site-logo-text">examel<span>·</span></span>
    </a>
    <nav class="mega-nav" aria-label="Main navigation">
      <div class="mega-nav-item">
        <a href="/free-worksheets/" class="mega-nav-link">Subjects</a><button class="mega-nav-toggle" aria-expanded="false" aria-label="Subjects submenu"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
        <div class="mega-panel">
          <div class="mega-panel-inner">
            <div class="mega-col">
              <div class="mega-col-heading" style="color:#7C3AED;">📐 Math</div>
              <a href="/free-math-worksheets/addition/">Addition</a>
              <a href="/free-math-worksheets/subtraction/">Subtraction</a>
              <a href="/free-math-worksheets/multiplication/">Multiplication</a>
              <a href="/free-math-worksheets/division/">Division</a>
              <a href="/free-math-worksheets/fractions/">Fractions</a>
              <a href="/free-math-worksheets/place-value/">Place Value</a>
              <a href="/free-math-worksheets/word-problems/">Word Problems</a>
              <a href="/free-math-worksheets/" class="mega-see-all" style="color:#7C3AED;">All 66 Math topics →</a>
            </div>
            <div class="mega-col">
              <div class="mega-col-heading" style="color:#DB2777;">📖 English</div>
              <a href="/free-english-worksheets/reading-comprehension/">Reading Comp.</a>
              <a href="/free-english-worksheets/vocabulary/">Vocabulary</a>
              <a href="/free-english-worksheets/singular-plural-nouns/">Nouns</a>
              <a href="/free-english-worksheets/adjectives-basic/">Adjectives</a>
              <a href="/free-english-worksheets/action-verbs/">Verbs</a>
              <a href="/free-english-worksheets/text-structure/">Text Structure</a>
              <a href="/free-english-worksheets/" class="mega-see-all" style="color:#DB2777;">All 24 English topics →</a>
            </div>
            <div class="mega-col">
              <div class="mega-col-heading" style="color:#059669;">🔬 Science</div>
              <a href="/free-science-worksheets/ecosystems/">Ecosystems</a>
              <a href="/free-science-worksheets/human-body/">Human Body</a>
              <a href="/free-science-worksheets/matter/">Matter</a>
              <a href="/free-science-worksheets/cells/">Cells</a>
              <a href="/free-science-worksheets/gravity/">Gravity</a>
              <a href="/free-science-worksheets/" class="mega-see-all" style="color:#059669;">All Science →</a>
              <div class="mega-col-heading" style="color:#D97706;margin-top:14px;">🌍 Social Studies</div>
              <a href="/free-social_studies-worksheets/">All Social Studies →</a>
            </div>
          </div>
        </div>
      </div>
      <div class="mega-nav-item">
        <a href="/free-worksheets/" class="mega-nav-link">Grades</a><button class="mega-nav-toggle" aria-expanded="false" aria-label="Grades submenu"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
        <div class="mega-panel">
          <div class="mega-grades-grid">
            <a href="/free-worksheets/grade-1/" class="mega-grade-card"><span class="mega-grade-num">1</span><span class="mega-grade-label">Grade</span></a>
            <a href="/free-worksheets/grade-2/" class="mega-grade-card"><span class="mega-grade-num">2</span><span class="mega-grade-label">Grade</span></a>
            <a href="/free-worksheets/grade-3/" class="mega-grade-card"><span class="mega-grade-num">3</span><span class="mega-grade-label">Grade</span></a>
            <a href="/free-worksheets/grade-4/" class="mega-grade-card"><span class="mega-grade-num">4</span><span class="mega-grade-label">Grade</span></a>
            <a href="/free-worksheets/grade-5/" class="mega-grade-card"><span class="mega-grade-num">5</span><span class="mega-grade-label">Grade</span></a>
            <a href="/free-worksheets/grade-6/" class="mega-grade-card"><span class="mega-grade-num">6</span><span class="mega-grade-label">Grade</span></a>
            <a href="/free-worksheets/grade-7/" class="mega-grade-card"><span class="mega-grade-num">7</span><span class="mega-grade-label">Grade</span></a>
            <a href="/free-worksheets/grade-8/" class="mega-grade-card"><span class="mega-grade-num">8</span><span class="mega-grade-label">Grade</span></a>
          </div>
        </div>
      </div>
      <div class="mega-nav-item">
        <a href="/browse/" class="mega-nav-link">Browse</a><button class="mega-nav-toggle" aria-expanded="false" aria-label="Browse submenu"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
        <div class="mega-panel">
          <div class="mega-panel-inner">
            <div class="mega-col">
              <div class="mega-col-heading">By Format</div>
              <a href="/free-worksheets/">📝 Worksheets</a>
              <a href="/free-math-drills/">⚡ Practice Drills</a>
              <a href="/free-games/">🎮 Games</a>
              <a href="/planners/">📅 Planners</a>
              <a href="/free-reading-passages/">📚 Reading Passages</a>
              <a href="/free-math-vocabulary/">💬 Vocabulary</a>
            </div>
            <div class="mega-col">
              <div class="mega-col-heading">Drills by Topic</div>
              <a href="/free-math-drills/addition/">Addition Drills</a>
              <a href="/free-math-drills/subtraction/">Subtraction Drills</a>
              <a href="/free-math-drills/multiplication/">Multiplication Drills</a>
              <a href="/free-math-drills/division/">Division Drills</a>
              <a href="/free-math-drills/mixed/">Mixed Drills</a>
            </div>
            <div class="mega-col">
              <div class="mega-col-heading">Quick Links</div>
              <a href="/free-worksheets/">All Worksheets</a>
              <a href="/browse/">Browse Everything</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <div class="site-search" id="siteSearch">
      <input type="text" class="site-search-input" id="searchInput" placeholder="Search worksheets, drills, topics..." autocomplete="off" aria-label="Search">
      <button class="site-search-btn" onclick="var q=document.getElementById('searchInput').value.trim();if(q.length>1)window.location.href='/browse/?q='+encodeURIComponent(q);" aria-label="Search">🔍</button>
      <div class="site-search-results" id="searchResults"></div>
    </div>
    <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </header>
  <nav class="mobile-nav" id="mobileNav" data-pagefind-ignore>
    <div style="padding:8px 4px 12px;">
      <input type="text" id="mobileSearchInput" placeholder="Search worksheets..." autocomplete="off" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:white;font-size:15px;font-family:inherit;outline:none;">
      <div id="mobileSearchResults" style="margin-top:8px;"></div>
    </div>
    <div class="mobile-accordion">
      <button class="mobile-acc-trigger" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open');">Subjects</button>
      <div class="mobile-acc-panel">
        <div class="mobile-acc-heading" style="color:#7C3AED;">Math</div>
        <a href="/free-math-worksheets/">All Math</a>
        <a href="/free-math-worksheets/addition/">Addition</a>
        <a href="/free-math-worksheets/multiplication/">Multiplication</a>
        <a href="/free-math-worksheets/fractions/">Fractions</a>
        <a href="/free-math-worksheets/word-problems/">Word Problems</a>
        <div class="mobile-acc-heading" style="color:#DB2777;">English</div>
        <a href="/free-english-worksheets/">All English</a>
        <a href="/free-english-worksheets/reading-comprehension/">Reading</a>
        <a href="/free-english-worksheets/vocabulary/">Vocabulary</a>
        <div class="mobile-acc-heading" style="color:#059669;">Science</div>
        <a href="/free-science-worksheets/">All Science</a>
        <a href="/free-social_studies-worksheets/">Social Studies</a>
      </div>
    </div>
    <div class="mobile-accordion">
      <button class="mobile-acc-trigger" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open');">Grades</button>
      <div class="mobile-acc-panel">
        <a href="/free-worksheets/grade-1/">Grade 1</a>
        <a href="/free-worksheets/grade-2/">Grade 2</a>
        <a href="/free-worksheets/grade-3/">Grade 3</a>
        <a href="/free-worksheets/grade-4/">Grade 4</a>
        <a href="/free-worksheets/grade-5/">Grade 5</a>
        <a href="/free-worksheets/grade-6/">Grade 6</a>
        <a href="/free-worksheets/grade-7/">Grade 7</a>
        <a href="/free-worksheets/grade-8/">Grade 8</a>
      </div>
    </div>
    <div class="mobile-accordion">
      <button class="mobile-acc-trigger" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open');">Browse</button>
      <div class="mobile-acc-panel">
        <a href="/free-worksheets/">Worksheets</a>
        <a href="/free-math-drills/">Drills</a>
        <a href="/free-games/">Games</a>
        <a href="/planners/">Planners</a>
        <a href="/free-reading-passages/">Reading</a>
        <a href="/free-math-vocabulary/">Vocabulary</a>
      </div>
    </div>
  </nav>
  <script>
  function toggleMobileMenu(){document.getElementById('mobileNav').classList.toggle('open');}
  (function(){
    // Mega menu toggle (WAI disclosure pattern)
    document.querySelectorAll('.mega-nav-toggle').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var expanded=btn.getAttribute('aria-expanded')==='true';
        document.querySelectorAll('.mega-nav-toggle').forEach(function(b){b.setAttribute('aria-expanded','false');});
        if(!expanded){btn.setAttribute('aria-expanded','true');}
      });
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'){document.querySelectorAll('.mega-nav-toggle').forEach(function(b){b.setAttribute('aria-expanded','false');});}
    });
    document.addEventListener('click',function(e){
      if(!e.target.closest('.mega-nav-item')){document.querySelectorAll('.mega-nav-toggle').forEach(function(b){b.setAttribute('aria-expanded','false');});}
    });

    // ── PAGEFIND SEARCH ──
    var pf=null;
    var gradeMap={'1st':'1','2nd':'2','3rd':'3','4th':'4','5th':'5','6th':'6','7th':'7','8th':'8','first':'1','second':'2','third':'3','fourth':'4','fifth':'5','sixth':'6','seventh':'7','eighth':'8','kindergarten':'k','kinder':'k'};

    function normalizeQuery(q){
      q=q.toLowerCase().trim();
      // "3rd grade math" → "grade 3 math"
      q=q.replace(/(\d+)(?:st|nd|rd|th)\s*grade/gi,function(_,n){return 'grade '+n;});
      // "first grade" → "grade 1"
      for(var word in gradeMap){
        var re=new RegExp(word+'\\s+grade','gi');
        q=q.replace(re,'grade '+gradeMap[word]);
        re=new RegExp('grade\\s+'+word,'gi');
        q=q.replace(re,'grade '+gradeMap[word]);
      }
      return q;
    }

    async function initPagefind(){
      if(pf)return pf;
      try{
        pf=await import('/pagefind/pagefind.js');
        await pf.options({excerptLength:15});
        return pf;
      }catch(e){console.warn('Pagefind not available, falling back to JSON search');return null;}
    }

    async function doSearch(q){
      var engine=await initPagefind();
      if(!engine){return doFallbackSearch(q);}
      var results=await engine.search(normalizeQuery(q));
      if(!results||!results.results)return[];
      var items=await Promise.all(results.results.slice(0,8).map(function(r){return r.data();}));
      return items.map(function(item){
        var grade=item.filters&&item.filters.grade?item.filters.grade[0]:'';
        var subject=item.filters&&item.filters.subject?item.filters.subject[0]:'';
        var format=item.filters&&item.filters.format?item.filters.format[0]:'';
        return{t:item.meta&&item.meta.title||'',u:item.url||'',g:grade,s:subject.toLowerCase(),f:format};
      });
    }

    // Fallback to old JSON search if Pagefind unavailable
    var fallbackIdx=null;
    function doFallbackSearch(q){
      return new Promise(function(resolve){
        if(fallbackIdx){resolve(searchJSON(q,fallbackIdx));return;}
        fetch('/search-index.json').then(function(r){return r.json();}).then(function(d){fallbackIdx=d;resolve(searchJSON(q,d));}).catch(function(){resolve([]);});
      });
    }
    function searchJSON(q,data){
      var terms=q.toLowerCase().split(' ').filter(Boolean);
      return data.filter(function(p){var k=p.k||'';return terms.every(function(t){return k.includes(t);});}).slice(0,8);
    }

    function renderResults(results,container){
      if(!results.length){container.innerHTML='<div style="padding:14px 16px;color:#A89FAE;font-size:13px;">No results found. Try a different term.</div>';return;}
      container.innerHTML=results.map(function(p){
        var badge=p.g||(p.f||'');
        var color=p.s==='math'?'#7C3AED':p.s==='english'?'#DB2777':p.s==='science'?'#059669':'#6C5CE7';
        return '<a href="'+p.u+'" style="display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;color:#1A1420;border-bottom:1px solid #F0EDE8;transition:background 0.15s;" onmouseover="this.style.background=\'#F4F1FF\'" onmouseout="this.style.background=\'\'"><span style="background:'+color+';color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;white-space:nowrap;flex-shrink:0;">'+badge+'</span><span style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+p.t+'</span></a>';
      }).join('');
    }

    function setupSearch(inputId,resultsId){
      var input=document.getElementById(inputId);
      var results=document.getElementById(resultsId);
      if(!input||!results)return;
      var timer;
      // Preload Pagefind on first focus
      input.addEventListener('focus',function(){initPagefind();},{once:true});
      input.addEventListener('input',function(){
        clearTimeout(timer);
        var q=input.value.trim();
        if(!q||q.length<2){results.style.display='none';return;}
        timer=setTimeout(async function(){
          var found=await doSearch(q);
          renderResults(found,results);
          results.style.display='block';
        },200);
      });
      input.addEventListener('keydown',function(e){
        if(e.key==='Escape'){results.style.display='none';input.value='';}
        if(e.key==='Enter'&&input.value.trim().length>1){window.location.href='/browse/?q='+encodeURIComponent(input.value.trim());}
      });
      document.addEventListener('click',function(e){
        if(!input.contains(e.target)&&!results.contains(e.target))results.style.display='none';
      });
    }
    document.addEventListener('DOMContentLoaded',function(){
      setupSearch('searchInput','searchResults');
      setupSearch('mobileSearchInput','mobileSearchResults');
    });
  })();
  </script>`



const siteFooter = `
  <footer class="site-footer" data-pagefind-ignore>
    <div class="footer-inner">
      <div class="footer-logo">
        <svg width="34" height="34" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
          <rect width="72" height="72" rx="16" fill="#6C5CE7"/>
          <rect x="15" y="15" width="9" height="42" rx="2.5" fill="white"/>
          <rect x="15" y="15" width="15" height="9" rx="2.5" fill="white"/>
          <rect x="15" y="31.5" width="24" height="9" rx="2.5" fill="white"/>
          <rect x="15" y="48" width="33" height="9" rx="2.5" fill="white"/>
        </svg>
        <div>
          <div style="font-size:20px;font-weight:800;letter-spacing:-1px;color:white;">examel<span style="color:#6C5CE7;">·</span></div>
          <div class="footer-motto">Know more. Score more.</div>
        </div>
      </div>
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-heading">Worksheets</div>
          <a href="/free-math-worksheets/">Math</a>
          <a href="/free-english-worksheets/">English</a>
          <a href="/free-science-worksheets/">Science</a>
        </div>
        <div class="footer-col">
          <div class="footer-heading">Practice</div>
          <a href="/free-math-drills/">Math Drills</a>
          <a href="/free-games/">Games</a>
      <a href="/planners/">Planners</a>
          <a href="/free-math-vocabulary/">Vocabulary</a>
          <a href="/free-reading-passages/">Reading</a>
        </div>
        <div class="footer-col">
          <div class="footer-heading">By Grade</div>
          <a href="/free-worksheets/grade-1/">Grade 1</a>
          <a href="/free-worksheets/grade-2/">Grade 2</a>
          <a href="/free-worksheets/grade-3/">Grade 3</a>
          <a href="/free-worksheets/grade-4/">Grade 4</a>
          <a href="/free-worksheets/grade-5/">Grade 5</a>
          <a href="/free-worksheets/grade-6/">Grade 6</a>
        </div>
        <div class="footer-col">
          <div class="footer-heading">Examel</div>
          <a href="https://examel.com">Home</a>
          <a href="/about/">About</a>
          <a href="/privacy-policy/">Privacy Policy</a>
          <a href="/terms/">Terms of Use</a>
        </div>
      </div>
      <div class="footer-bottom">© 2026 Examel · K-8 Printable Worksheets, Games & Planners · Every exam. Every grade.</div>
    </div>
  </footer>`;

// ── HELPERS BUNDLE (passed to all generators) ─────────────────────────────
const helpers = {
  gradeColor, capitalize, titleCase, formatTopic, formatTheme,
  subjectColor, subjectEmoji, worksheetCard, getPedagogicalLinks
};

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching worksheets from Supabase...');

  let worksheets = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    let q = supabase
      .from('worksheets')
      .select('id,slug,grade,subject,topic,theme,title,pdf_url,preview_image_url,pinterest_image_url,preview_p1_url,preview_p2_url,status,format,difficulty,ccss_standard,seo_description,target_keyword,content,pedagogical_intro,teacher_tip,created_at')
      .eq('status', 'published');
    if (FILTER.format)  q = q.eq('format', FILTER.format);
    if (FILTER.subject) q = q.eq('subject', FILTER.subject);
    if (FILTER.grade)   q = q.eq('grade', parseInt(FILTER.grade));
    q = q.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, error } = await q;
    if (error) { console.error('Supabase error:', error.message); process.exit(1); }
    worksheets = worksheets.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Found ${worksheets.length} worksheets`);

  // ── FORMAT-SPECIFIC INDIVIDUAL PAGES (existing generators) ───────────────
  generateWordSearchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);
  generateVocabMatchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);
  generateReadingPassagePages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);
  generateDrillPagesV2(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme, subjectColor, worksheetCard, buildCharSVG);
  generateDrillPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);

  // ── NEW GENERATORS (GAP 3) ────────────────────────────────────────────────
  if (shouldRun('worksheets'))  generateWorksheetPages(worksheets, sharedCSS, siteHeader, siteFooter, helpers);
  if (shouldRun('category'))    generateCategoryHubs(worksheets, sharedCSS, siteHeader, siteFooter, helpers);
  if (shouldRun('topic-hub'))   generateTopicHubs(worksheets, sharedCSS, siteHeader, siteFooter, helpers);
  if (shouldRun('games'))    generateGamePages(worksheets, sharedCSS, siteHeader, siteFooter, helpers);
  if (shouldRun('planners')) generatePlannerPages(worksheets, sharedCSS, siteHeader, siteFooter, helpers);
  if (shouldRun('format-hubs')) generateFormatHubs(worksheets, sharedCSS, siteHeader, siteFooter, helpers);

  // ── SITEMAP ───────────────────────────────────────────────────────────────
  generateSitemap();

  console.log(`\nDone — ${worksheets.length} worksheets processed`);
}

main().catch(console.error);
