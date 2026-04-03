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
    .breadcrumb{max-width:860px;margin:18px auto 0;padding:0 20px;font-size:15px;color:#A89FAE;display:flex;align-items:center;flex-wrap:wrap;gap:4px;}
    .breadcrumb a{color:#6C5CE7;text-decoration:none;font-weight:500;}
    .breadcrumb a:hover{opacity:0.7;}
    .breadcrumb .sep{opacity:0.3;margin:0 2px;}
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
    .ws-card-btn{font-size:12px;font-weight:700;color:#6C5CE7;}
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
    .site-footer a:hover{color:#6C5CE7;}
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
  </style>`;

const siteHeader = `
  <header class="site-header">
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
    <div class="site-search" id="siteSearch">
      <input type="text" class="site-search-input" id="searchInput" placeholder="Search worksheets, drills, topics..." autocomplete="off" aria-label="Search">
      <button class="site-search-btn" onclick="var q=document.getElementById('searchInput').value.trim();if(q.length>1)window.location.href='/browse/?q='+encodeURIComponent(q);" aria-label="Search">🔍</button>
      <div class="site-search-results" id="searchResults"></div>
    </div>
    <nav>
      <a href="/free-worksheets/">Worksheets</a>
      <a href="/free-math-drills/">Drills</a>
      <a href="/free-reading-passages/">Reading</a>
      <a href="/free-math-vocabulary/">Vocabulary</a>
      <a href="/free-games/">Games</a>
      <a href="/planners/">Planners</a>
      <a href="/browse/">Browse All</a>
    </nav>
    <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </header>
  <nav class="mobile-nav" id="mobileNav">
    <div style="padding:8px 4px 12px;">
      <input type="text" id="mobileSearchInput" placeholder="Search worksheets..." autocomplete="off" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:white;font-size:15px;font-family:inherit;outline:none;">
      <div id="mobileSearchResults" style="margin-top:8px;"></div>
    </div>
    <a href="/free-worksheets/">Worksheets</a>
    <a href="/free-math-drills/">Drills</a>
    <a href="/free-reading-passages/">Reading</a>
    <a href="/free-math-vocabulary/">Vocabulary</a>
    <a href="/free-games/">Games</a>
      <a href="/planners/">Planners</a>
    <a href="/browse/">Browse All</a>
  </nav>
  <script>
  (function(){
    var idx = null;
    function loadIndex(cb) {
      if (idx) return cb(idx);
      fetch('/search-index.json').then(function(r){return r.json();}).then(function(d){idx=d;cb(idx);}).catch(function(){idx=[];cb([]);});
    }
    function search(q, data) {
      if (!q || q.length < 2) return [];
      var terms = q.toLowerCase().split(' ').filter(Boolean);
      return data.filter(function(p) {
        var k = p.k || '';
        return terms.every(function(t){ return k.includes(t); });
      }).slice(0, 8);
    }
    function renderResults(results, container) {
      if (!results.length) { container.innerHTML = '<div style="padding:12px 16px;color:#A89FAE;font-size:13px;">No results found</div>'; return; }
      container.innerHTML = results.map(function(p) {
        var badge = p.g ? 'Grade '+p.g : (p.f || '');
        var color = p.s==='math'?'#7C3AED':p.s==='english'?'#DB2777':p.s==='science'?'#059669':'#6C5CE7';
        return '<a href="'+p.u+'" style="display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;color:#1A1420;border-bottom:1px solid #F0EDE8;transition:background 0.15s;" onmouseover="this.style.background='#F4F1FF'" onmouseout="this.style.background=''">'+
          '<span style="background:'+color+';color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;white-space:nowrap;flex-shrink:0;">'+badge+'</span>'+
          '<span style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+p.t+'</span>'+
          '</a>';
      }).join('');
    }
    function setupSearch(inputId, resultsId) {
      var input = document.getElementById(inputId);
      var results = document.getElementById(resultsId);
      if (!input || !results) return;
      var timer;
      input.addEventListener('input', function() {
        clearTimeout(timer);
        var q = input.value.trim();
        if (!q || q.length < 2) { results.style.display='none'; return; }
        timer = setTimeout(function() {
          loadIndex(function(data) {
            var found = search(q, data);
            renderResults(found, results);
            results.style.display = 'block';
          });
        }, 200);
      });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { results.style.display='none'; input.value=''; }
        if (e.key === 'Enter' && input.value.trim().length > 1) {
          window.location.href = '/browse/?q='+encodeURIComponent(input.value.trim());
        }
      });
      document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !results.contains(e.target)) results.style.display='none';
      });
    }
    document.addEventListener('DOMContentLoaded', function() {
      setupSearch('searchInput', 'searchResults');
      setupSearch('mobileSearchInput', 'mobileSearchResults');
    });
  })();
  </script>`;

const siteFooter = `
  <footer class="site-footer">
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
      .select('id,slug,grade,subject,topic,theme,title,pdf_url,preview_image_url,pinterest_image_url,preview_p1_url,preview_p2_url,status,format,difficulty,ccss_standard,seo_description,target_keyword,content,created_at')
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
