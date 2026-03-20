require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { generateWordSearchPages } = require('./word-search-generator.js');
const { generateDrillPages } = require('./drill-generator.js');
const { generateVocabMatchPages } = require('./vocab-match-generator.js');
const { generateReadingPassagePages } = require('./reading-passage-generator.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const gradeColor = (grade) => grade <= 2 ? '#FF6B6B' : grade <= 4 ? '#6C5CE7' : '#0984E3';
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s) => s.split(' ').map(capitalize).join(' ');
const formatTopic = (t) => titleCase(t.replace(/-/g, ' '));
const formatTheme = (t) => titleCase(t.replace(/-/g, ' '));

function getCardUrl(ws) {
  if (ws.format === 'drill-grid') return `/drills/${ws.subject}/grade-${ws.grade}/${ws.slug}/`;
  if (ws.format === 'word-search') return `/word-searches/${ws.subject}/grade-${ws.grade}/${ws.slug}/`;
  if (ws.format === 'vocab-match') return `/vocab-match/${ws.subject}/grade-${ws.grade}/${ws.slug}/`;
  if (ws.format === 'reading-passage') return `/reading-passages/grade-${ws.grade}/${ws.slug}/`;
  return `/worksheets/${ws.slug}/`;
}

function worksheetCard(ws) {
  const color = gradeColor(ws.grade);
  const url = getCardUrl(ws);
  const thumb = ws.preview_image_url ? `<img src="${ws.preview_image_url}" alt="${ws.title}" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0;margin:-20px -20px 12px -20px;width:calc(100% + 40px);">` : '';
  return `
    <a href="${url}" class="ws-card" style="border-top:3px solid ${color};padding-top:${ws.preview_image_url?'0':'20px'}">
      ${thumb}
      <div class="ws-card-badge" style="background:${color}">${capitalize(ws.subject)} · Grade ${ws.grade}</div>
      <h3>${ws.title}</h3>
      <p>${formatTopic(ws.topic)} · ${formatTheme(ws.theme)} theme</p>
      <span class="ws-card-btn" style="color:${color}">Download Free →</span>
    </a>`;
}

const sharedCSS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:'Inter',system-ui,sans-serif;color:#1A1A2E;background:#FAFAF7;-webkit-font-smoothing:antialiased;}
    /* NAV */
    .site-header{background:#1A1A2E;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(0,0,0,0.15);}
    .site-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
    .site-logo-text{font-size:20px;font-weight:800;letter-spacing:-1px;color:white;}
    .site-logo-text span{color:#6C5CE7;}
    .site-header nav{display:flex;align-items:center;gap:4px;}
    .site-header nav a{color:rgba(255,255,255,0.75);text-decoration:none;font-size:13px;font-weight:600;padding:6px 10px;border-radius:6px;transition:all 0.2s;}
    .site-header nav a:hover{color:white;background:rgba(108,92,231,0.2);}
    /* BREADCRUMB */
    .breadcrumb{max-width:1100px;margin:16px auto;padding:0 20px;font-size:13px;color:#636E72;}
    .breadcrumb a{color:#6C5CE7;text-decoration:none;}
    .breadcrumb a:hover{text-decoration:underline;}
    .breadcrumb span{margin:0 6px;opacity:0.4;}
    /* HERO (hub/category pages) */
    .hero{padding:60px 20px;text-align:center;background:#FAFAF7;}
    .hero h1{font-size:clamp(26px,4vw,44px);margin-bottom:14px;color:#1A1A2E;font-weight:800;letter-spacing:-1px;line-height:1.15;}
    .hero h1 span{color:#6C5CE7;}
    .hero p{font-size:17px;color:#636E72;max-width:600px;margin:0 auto;line-height:1.7;}
    /* FILTER */
    .filter-bar{max-width:1100px;margin:0 auto 30px;padding:0 20px;display:flex;gap:10px;flex-wrap:wrap;}
    .filter-btn{padding:8px 18px;border-radius:100px;text-decoration:none;font-size:13px;font-weight:700;border:2px solid #DFE6E9;color:#636E72;background:white;transition:all 0.2s;}
    .filter-btn:hover,.filter-btn.active{background:#6C5CE7;color:white;border-color:#6C5CE7;}
    /* GRID */
    .grid{max-width:1100px;margin:0 auto;padding:0 20px 60px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
    /* CARDS */
    .ws-card{background:white;border-radius:16px;padding:20px;text-decoration:none;color:#1A1A2E;display:block;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 2px 12px rgba(108,92,231,0.07);}
    .ws-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(108,92,231,0.13);}
    .ws-card-badge{display:inline-block;color:white;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;margin-bottom:10px;letter-spacing:0.3px;}
    .ws-card h3{font-size:14px;margin-bottom:6px;line-height:1.5;font-weight:700;}
    .ws-card p{font-size:12px;color:#636E72;margin-bottom:12px;}
    .ws-card-btn{font-size:12px;font-weight:700;color:#6C5CE7;}
    /* HUB */
    .hub-grid{max-width:1100px;margin:0 auto;padding:0 20px 60px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
    .hub-card{background:white;border-radius:20px;padding:32px 20px;text-decoration:none;color:#1A1A2E;text-align:center;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 2px 12px rgba(108,92,231,0.07);}
    .hub-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(108,92,231,0.13);}
    .hub-card .hub-icon{font-size:40px;margin-bottom:14px;display:block;}
    .hub-card h3{font-size:17px;margin-bottom:4px;font-weight:700;}
    .hub-card p{font-size:13px;color:#636E72;}
    /* PREVIEW */
    .preview-section{background:white;border-radius:20px;padding:32px;margin-bottom:24px;box-shadow:0 2px 12px rgba(108,92,231,0.07);}
    .preview-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;}
    .preview-section-title{font-size:16px;color:#1A1A2E;font-weight:800;letter-spacing:-0.3px;}
    .preview-badge{background:#F0EDFF;color:#6C5CE7;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:0.5px;}
    .preview-label{font-size:11px;font-weight:700;color:#636E72;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;}
    .preview-teacher-badge{background:#FFF5F5;color:#D63031;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:0.5px;display:inline-block;margin-bottom:10px;}
    .preview-img-wrap{position:relative;overflow:hidden;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12),2px 2px 0 rgba(0,0,0,0.04);transition:transform 0.3s,box-shadow 0.3s;cursor:pointer;}
    .preview-img-wrap:hover{transform:rotate(-0.5deg) scale(1.01);box-shadow:0 16px 48px rgba(0,0,0,0.18),2px 2px 0 rgba(0,0,0,0.04);}
    .preview-img{width:100%;display:block;border-radius:12px;}
    .preview-pin-btn{position:absolute;top:12px;right:12px;background:#E60023;color:white;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;opacity:0;transition:opacity 0.2s;display:flex;align-items:center;gap:5px;}
    .preview-img-wrap:hover .preview-pin-btn{opacity:1;}
    .preview-note{font-size:12px;color:#B2BEC3;text-align:center;margin-top:20px;}
    /* FOOTER */
    .site-footer{padding:48px 20px 24px;background:#1A1A2E;border-top:3px solid #6C5CE7;margin-top:60px;}
    .footer-grid{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;max-width:1100px;margin-left:auto;margin-right:auto;}
    .footer-col{display:flex;flex-direction:column;gap:10px;min-width:130px;}
    .footer-heading{font-size:10px;font-weight:800;color:#FFFFFF;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;}
    .site-footer a{color:rgba(255,255,255,0.5);text-decoration:none;font-size:13px;transition:color 0.2s;}
    .site-footer a:hover{color:#6C5CE7;}
    .footer-bottom{text-align:center;font-size:12px;color:rgba(255,255,255,0.25);border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;max-width:1100px;margin:0 auto;}
    .footer-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:32px;}
    .footer-motto{font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:1px;}
    @media(max-width:768px){
      .site-header nav{display:none;}
      .hub-grid{grid-template-columns:repeat(2,1fr);}
      .grid{grid-template-columns:repeat(2,1fr);}
    }
    @media(max-width:480px){
      .grid{grid-template-columns:1fr;}
    }
  </style>`;

const siteHeader = `
  <header class="site-header">
    <a href="https://examel.com" class="site-logo">
      <svg width="28" height="28" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="16" fill="#6C5CE7"/>
        <rect x="15" y="15" width="9" height="42" rx="2.5" fill="white"/>
        <rect x="15" y="15" width="15" height="9" rx="2.5" fill="white"/>
        <rect x="15" y="31.5" width="24" height="9" rx="2.5" fill="white"/>
        <rect x="15" y="48" width="33" height="9" rx="2.5" fill="white"/>
      </svg>
      <span class="site-logo-text">examel<span>·</span></span>
    </a>
    <nav>
      <a href="/free-math-worksheets/">Math</a>
      <a href="/free-english-worksheets/">English</a>
      <a href="/free-science-worksheets/">Science</a>
      <a href="/free-math-drills/">Drills</a>
      <a href="/free-reading-passages/">Reading</a>
      <a href="/free-math-vocabulary/">Vocabulary</a>
      <a href="/word-searches/">Word Searches</a>
    </nav>
  </header>`;

const siteFooter = `
  <footer class="site-footer">
    <div class="footer-logo">
      <svg width="32" height="32" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="16" fill="#6C5CE7"/>
        <rect x="15" y="15" width="9" height="42" rx="2.5" fill="white"/>
        <rect x="15" y="15" width="15" height="9" rx="2.5" fill="white"/>
        <rect x="15" y="31.5" width="24" height="9" rx="2.5" fill="white"/>
        <rect x="15" y="48" width="33" height="9" rx="2.5" fill="white"/>
      </svg>
      <div>
        <div style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:white;">examel<span style="color:#6C5CE7;">·</span></div>
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
        <a href="/word-searches/">Word Searches</a>
        <a href="/free-math-vocabulary/">Vocabulary</a>
        <a href="/free-reading-passages/">Reading Passages</a>
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
        <a href="https://examel.com/privacy-policy/">Privacy Policy</a>
      </div>
    </div>
    <div class="footer-bottom">© 2026 Examel · Free K-8 Printable Worksheets · Every exam. Every grade.</div>
  </footer>`;

async function generatePages() {
  console.log('Fetching worksheets from Supabase...');

  const { data: worksheets, error } = await supabase
    .from('worksheets')
    .select('id,slug,grade,subject,topic,theme,title,pdf_url,preview_image_url,pinterest_image_url,preview_p1_url,preview_p2_url,status,format,difficulty,ccss_standard')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  console.log(`Found ${worksheets.length} worksheets`);

  // ── 1. INDIVIDUAL WORKSHEET PAGES ─────────────────────────────────────────
  for (const ws of worksheets.filter(w => !w.format || w.format === 'worksheet')) {
    const dir = `/opt/examel/examel-pages/worksheets/${ws.slug}`;
    fs.mkdirSync(dir, { recursive: true });
    const color = gradeColor(ws.grade);
    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
    const related = worksheets.filter(w => w.subject === ws.subject && w.grade === ws.grade && w.slug !== ws.slug && (!w.format || w.format === 'worksheet')).slice(0, 4);
    const sameTopicDiffTheme = worksheets.filter(w => w.topic === ws.topic && w.theme !== ws.theme && w.slug !== ws.slug).slice(0, 4);
    const sameThemeDiffSubject = worksheets.filter(w => w.theme === ws.theme && w.subject !== ws.subject && w.grade === ws.grade && w.slug !== ws.slug).slice(0, 3);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ws.title} | ${ws.difficulty && ws.difficulty !== "standard" ? ws.difficulty.charAt(0).toUpperCase() + ws.difficulty.slice(1) + " " : ""}Free Printable Worksheet with Answer Key | Examel</title>
  <meta name="description" content="Free printable ${ws.subject} worksheet for Grade ${ws.grade}. ${formatTopic(ws.topic)} with ${formatTheme(ws.theme)} theme. Download PDF instantly. Answer key included.">
  <link rel="canonical" href="https://examel.com/worksheets/${ws.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${ws.title} | Free Printable Worksheet | Examel">
  <meta property="og:description" content="Free printable Grade ${ws.grade} ${capitalize(ws.subject)} worksheet about ${formatTopic(ws.topic)}. Answer key included. Download PDF free.">
  <meta property="og:image" content="${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}">
  <meta property="og:url" content="https://examel.com/worksheets/${ws.slug}/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"EducationalResource","name":"${ws.title}","description":"Free printable Grade ${ws.grade} ${ws.subject} worksheet about ${formatTopic(ws.topic)} — 8 questions with answer key","educationalLevel":"Grade ${ws.grade}","subject":"${capitalize(ws.subject)}","teaches":"${formatTopic(ws.topic)}","keywords":"Grade ${ws.grade} ${capitalize(ws.subject)} worksheet, ${formatTopic(ws.topic)} worksheet, free printable ${capitalize(ws.subject)} worksheet","url":"https://examel.com/worksheets/${ws.slug}/","thumbnailUrl":"${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}","provider":{"@type":"Organization","name":"Examel","url":"https://examel.com"},"isAccessibleForFree":true}</script>
  ${sharedCSS}
  <style>
    /* WS PAGE */
    .ws-hero{background:#1A1A2E;color:white;padding:56px 20px 48px;text-align:center;position:relative;overflow:hidden;border-top:4px solid ${color};}
    .ws-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 60% 0%,rgba(108,92,231,0.15) 0%,transparent 70%);pointer-events:none;}
    .ws-hero h1{font-size:clamp(22px,3.5vw,36px);margin-bottom:12px;line-height:1.25;font-weight:800;letter-spacing:-0.5px;position:relative;}
    .ws-hero p{font-size:15px;opacity:0.6;position:relative;margin-bottom:20px;}
    .badges{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;position:relative;}
    .badge{background:${color};border-radius:100px;padding:5px 16px;font-size:12px;font-weight:700;letter-spacing:0.3px;}
    .ws-container{max-width:800px;margin:0 auto;padding:32px 20px 60px;}
    /* INFO STRIP */
    .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
    .info-card{background:white;border-radius:16px;padding:18px 16px;text-align:center;box-shadow:0 2px 12px rgba(108,92,231,0.07);}
    .info-card .label{font-size:10px;color:#B2BEC3;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;display:block;}
    .info-card .value{font-size:15px;font-weight:800;color:#1A1A2E;}
    /* DOWNLOAD BOX */
    .download-box{background:white;border-radius:20px;padding:32px;margin-bottom:24px;box-shadow:0 2px 12px rgba(108,92,231,0.07);}
    .download-box-title{font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#B2BEC3;margin-bottom:8px;}
    .download-box-desc{color:#636E72;margin-bottom:24px;line-height:1.7;font-size:15px;}
    .btn-primary{background:#6C5CE7;color:white;padding:18px 32px;border-radius:12px;text-decoration:none;font-weight:800;font-size:16px;display:block;text-align:center;transition:all 0.2s;letter-spacing:-0.3px;margin-bottom:16px;}
    .btn-primary:hover{background:#5a4bd1;transform:translateY(-1px);box-shadow:0 8px 24px rgba(108,92,231,0.35);}
    .btn-secondary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;}
    .btn-secondary{background:#F0EDFF;color:#6C5CE7;padding:12px 8px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;text-align:center;transition:all 0.2s;display:block;}
    .btn-secondary:hover{background:#6C5CE7;color:white;}
    .share-divider{border:none;border-top:1px solid #F0EDFF;margin:20px 0;}
    .share-label{font-size:11px;font-weight:700;color:#B2BEC3;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;}
    .share-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;}
    .share-btn{padding:10px 8px;border-radius:10px;text-decoration:none;font-weight:700;font-size:12px;text-align:center;transition:all 0.2s;display:block;}
    .share-btn:hover{transform:translateY(-1px);opacity:0.9;}
    .share-pinterest{background:#E60023;color:white;}
    .share-facebook{background:#1877F2;color:white;}
    .share-twitter{background:#1A1A2E;color:white;}
    .share-email{background:#F0EDFF;color:#6C5CE7;}
    .trust-strip{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;padding-top:4px;}
    .trust-item{font-size:12px;color:#00B894;font-weight:700;display:flex;align-items:center;gap:5px;}
    /* FEATURES */
    .features{background:#F0EDFF;border-radius:20px;padding:28px;margin-bottom:24px;}
    .features-title{font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:16px;}
    .feature-item{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;font-size:14px;color:#1A1A2E;font-weight:500;}
    .check{color:#6C5CE7;font-size:16px;font-weight:800;flex-shrink:0;margin-top:1px;}
    .ccss-badge{display:inline-block;background:#1A1A2E;color:white;font-size:11px;font-weight:700;padding:4px 12px;border-radius:6px;letter-spacing:0.5px;margin-top:8px;}
    /* EMAIL CAPTURE */
    .email-section{background:#1A1A2E;border-radius:20px;padding:32px;margin-bottom:24px;text-align:center;}
    .email-section h3{color:white;font-size:18px;font-weight:800;margin-bottom:8px;letter-spacing:-0.3px;}
    .email-section p{color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:20px;}
    .email-form{display:flex;gap:10px;flex-wrap:wrap;}
    .email-input{flex:1;min-width:200px;padding:14px 18px;border-radius:10px;border:none;font-size:15px;font-family:inherit;outline:none;}
    .email-submit{background:#6C5CE7;color:white;border:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.2s;}
    .email-submit:hover{background:#5a4bd1;}
    .email-note{font-size:12px;color:rgba(255,255,255,0.3);margin-top:12px;}
    /* SEO */
    .seo-text{background:white;border-radius:20px;padding:28px;margin-bottom:24px;line-height:1.8;font-size:14px;color:#636E72;box-shadow:0 2px 12px rgba(108,92,231,0.07);}
    .seo-text h3{color:#1A1A2E;margin-bottom:14px;font-size:17px;font-weight:800;}
    /* RELATED */
    .related{margin-bottom:24px;}
    .related-title{font-size:18px;margin-bottom:16px;color:#1A1A2E;font-weight:800;letter-spacing:-0.3px;}
    /* NAV LINKS */
    .nav-links{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;font-size:13px;}
    .nav-links a{color:#6C5CE7;text-decoration:none;font-weight:600;}
    .nav-links a:hover{text-decoration:underline;}
    /* STICKY BAR */
    .sticky-bar{position:fixed;bottom:0;left:0;right:0;background:#1A1A2E;border-top:2px solid #6C5CE7;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:200;transform:translateY(100%);transition:transform 0.3s ease;box-shadow:0 -4px 24px rgba(0,0,0,0.2);}
    .sticky-bar.visible{transform:translateY(0);}
    .sticky-bar-title{color:white;font-size:13px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .sticky-bar-btn{background:#6C5CE7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:800;font-size:13px;white-space:nowrap;flex-shrink:0;}
    @media(max-width:600px){
      .btn-secondary-row{grid-template-columns:repeat(3,1fr);}
      .share-row{grid-template-columns:repeat(2,1fr);}
      .info-grid{grid-template-columns:repeat(3,1fr);}
      .sticky-bar-title{display:none;}
    }
  </style>
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/free-${ws.subject.toLowerCase()}-worksheets/">Free ${capitalize(ws.subject)} Worksheets</a><span>›</span>
    <a href="/free-${ws.subject.toLowerCase()}-worksheets/grade-${ws.grade}/">Grade ${ws.grade}</a><span>›</span>
    ${ws.title}
  </div>
  <div class="ws-hero">
    <h1>${ws.title}</h1>
    <p>Free printable worksheet — download and print instantly</p>
    <div class="badges">
      <span class="badge">${capitalize(ws.subject)}</span>
      <span class="badge">Grade ${ws.grade}</span>
      <span class="badge">${formatTheme(ws.theme)} Theme</span>
    </div>
  </div>
  <div class="ws-container">
    <div class="info-grid">
      <div class="info-card"><span class="label">SUBJECT</span><span class="value">${capitalize(ws.subject)}</span></div>
      <div class="info-card"><span class="label">GRADE</span><span class="value">Grade ${ws.grade}</span></div>
      <div class="info-card"><span class="label">TOPIC</span><span class="value">${formatTopic(ws.topic)}</span></div>
    </div>
    <div class="download-box">
      <div class="download-box-title">Ready to Print</div>
      <p class="download-box-desc">This worksheet includes 8 questions with a ${formatTheme(ws.theme)} theme plus a full answer key. Perfect for Grade ${ws.grade} ${capitalize(ws.subject)}.</p>
      <a href="${downloadUrl}" class="btn-primary" download>⬇ Download Free Worksheet</a>
      <div class="btn-secondary-row">
        <a href="${downloadUrl}" target="_blank" class="btn-secondary">🖨️ Print</a>
        <a href="${downloadUrl}" target="_blank" class="btn-secondary">👁️ Open PDF</a>
        <a href="#" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='✓ Copied!';setTimeout(()=>this.textContent='🔗 Copy Link',2000);return false;" class="btn-secondary">🔗 Copy Link</a>
      </div>
      <hr class="share-divider">
      <div class="share-label">Share this worksheet</div>
      <div class="share-row">
        <a href="https://pinterest.com/pin/create/button/?url=https://examel.com/worksheets/${ws.slug}/&media=${ws.pinterest_image_url || ws.preview_image_url || ''}&description=${encodeURIComponent ? encodeURIComponent(ws.title + ' — Free Grade ' + ws.grade + ' ' + ws.subject + ' worksheet. Answer key included. Download free at examel.com #freeworksheets #homeschool #teachers') : ''}" target="_blank" class="share-btn share-pinterest">📌 Pinterest</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://examel.com/worksheets/${ws.slug}/" target="_blank" class="share-btn share-facebook">📘 Facebook</a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent ? encodeURIComponent('Free Grade ' + ws.grade + ' ' + ws.subject + ' worksheet — ' + ws.title + ' Download free at examel.com') : ''}&url=https://examel.com/worksheets/${ws.slug}/" target="_blank" class="share-btn share-twitter">🐦 Twitter</a>
        <a href="mailto:?subject=${encodeURIComponent ? encodeURIComponent('Free worksheet: ' + ws.title) : ''}&body=${encodeURIComponent ? encodeURIComponent('Check out this free worksheet from Examel: https://examel.com/worksheets/' + ws.slug + '/') : ''}" class="share-btn share-email">📧 Email</a>
      </div>
      <div class="trust-strip">
        <span class="trust-item">✓ Free forever</span>
        <span class="trust-item">✓ No login required</span>
        <span class="trust-item">✓ Instant PDF</span>
      </div>
    </div>
    ${ws.preview_p1_url ? `
    <div class="preview-section">
      <div class="preview-section-header">
        <span class="preview-section-title">📄 Worksheet Preview</span>
        <span class="preview-badge">Print Preview</span>
      </div>
      <div style="margin-bottom:24px;">
        <p class="preview-label">Page 1 — Questions</p>
        <div class="preview-img-wrap">
          <a href="${ws.preview_p1_url}" target="_blank">
            <img src="${ws.preview_p1_url}"
              alt="Free Grade ${ws.grade} ${capitalize(ws.subject)} worksheet — ${formatTopic(ws.topic)} — ${formatTheme(ws.theme)} theme — Common Core ${ws.ccss_standard}"
              loading="lazy" width="1700" height="2200"
              class="preview-img">
          </a>
          <a href="https://pinterest.com/pin/create/button/?url=https://examel.com/worksheets/${ws.slug}/&media=${ws.pinterest_image_url || ws.preview_p1_url}&description=${ws.title} — Free Grade ${ws.grade} ${capitalize(ws.subject)} worksheet. Download free at examel.com"
            target="_blank" class="preview-pin-btn">📌 Save to Pinterest</a>
        </div>
      </div>
      <div>
        <p class="preview-teacher-badge">Teacher / Parent Use Only</p>
        <p class="preview-label">Page 2 — Answer Key</p>
        <div class="preview-img-wrap">
          <a href="${ws.preview_p2_url}" target="_blank">
            <img src="${ws.preview_p2_url}"
              alt="Answer key — Grade ${ws.grade} ${capitalize(ws.subject)} worksheet — ${formatTopic(ws.topic)} — teacher and parent use only"
              loading="lazy" width="1700" height="2200"
              class="preview-img">
          </a>
          <a href="https://pinterest.com/pin/create/button/?url=https://examel.com/worksheets/${ws.slug}/&media=${ws.pinterest_image_url || ws.preview_p1_url}&description=${ws.title} — Free Grade ${ws.grade} ${capitalize(ws.subject)} worksheet. Download free at examel.com"
            target="_blank" class="preview-pin-btn">📌 Save to Pinterest</a>
        </div>
      </div>
      <p class="preview-note">Click any image to view full size · 2 pages · US Letter · Instant download</p>
    </div>
    ` : ''}
    <div class="features">
      <div class="features-title">What is included</div>
      <div class="feature-item"><span class="check">✓</span> 8 curriculum-aligned questions</div>
      <div class="feature-item"><span class="check">✓</span> Full answer key for parents and teachers</div>
      <div class="feature-item"><span class="check">✓</span> ${formatTheme(ws.theme)} theme to keep kids engaged</div>
      <div class="feature-item"><span class="check">✓</span> Print-ready PDF — US Letter size</div>
      <div class="feature-item"><span class="check">✓</span> Name, date, and score fields included</div>
      ${ws.ccss_standard ? `<div style="margin-top:4px;"><span class="ccss-badge">CCSS: ${ws.ccss_standard}</span></div>` : ''}
    </div>
    <div class="email-section">
      <h3>📬 Get Free Worksheets Every Week</h3>
      <p>New themed worksheets added daily. Join thousands of parents and teachers.</p>
      <form action="https://app.kit.com/forms/9220999/subscriptions" method="POST" target="kit-iframe-ws" style="display:flex;gap:10px;flex-wrap:wrap;">
        <input type="email" name="email_address" placeholder="Your email address" required class="email-input">
        <button type="submit" class="email-submit">Get Free Worksheets →</button>
      </form>
      <iframe name="kit-iframe-ws" style="display:none;"></iframe>
      <p class="email-note">No spam. Unsubscribe anytime.</p>
    </div>
    <div class="seo-text">
      <h3>About this ${capitalize(ws.subject)} worksheet for Grade ${ws.grade}</h3>
      <p>This free printable ${capitalize(ws.subject)} worksheet is designed for Grade ${ws.grade} students and covers ${formatTopic(ws.topic)}. The ${formatTheme(ws.theme)} theme keeps kids engaged while they practice essential ${capitalize(ws.subject)} skills. Every worksheet includes a full answer key making it easy for parents and teachers to check work instantly.</p>
      <p>Aligned to Common Core State Standards (CCSS) for Grade ${ws.grade} ${capitalize(ws.subject)}. Print-ready at US Letter size with name, date, and score fields included. No login or account required — download and print in seconds.</p>
    </div>
    ${related.length > 0 ? `
    <div class="related">
      <h3 class="related-title">More Grade ${ws.grade} ${capitalize(ws.subject)} Worksheets</h3>
      <div class="grid" style="padding:0;margin:0 0 20px;">
        ${related.map(worksheetCard).join('')}
      </div>
    </div>` : ''}
    ${sameTopicDiffTheme.length > 0 ? `
    <div class="related">
      <h3 class="related-title">More ${formatTopic(ws.topic)} Worksheets</h3>
      <div class="grid" style="padding:0;margin:0 0 20px;">
        ${sameTopicDiffTheme.map(worksheetCard).join('')}
      </div>
    </div>` : ''}
    ${sameThemeDiffSubject.length > 0 ? `
    <div class="related">
      <h3 class="related-title">More ${formatTheme(ws.theme)} Theme Worksheets</h3>
      <div class="grid" style="padding:0;margin:0 0 20px;">
        ${sameThemeDiffSubject.map(worksheetCard).join('')}
      </div>
    </div>` : ''}
    <div class="nav-links">
      <a href="/free-${ws.subject.toLowerCase()}-worksheets/grade-${ws.grade}/">← All Grade ${ws.grade} ${capitalize(ws.subject)} Worksheets</a>
      <a href="/free-${ws.subject.toLowerCase()}-worksheets/">← All ${capitalize(ws.subject)} Worksheets</a>
      <a href="/free-worksheets/grade-${ws.grade}/">← All Grade ${ws.grade} Worksheets</a>
    </div>
  </div>
  <div class="sticky-bar" id="stickyBar">
    <span class="sticky-bar-title">${ws.title}</span>
    <a href="${downloadUrl}" class="sticky-bar-btn" download>⬇ Download Free</a>
  </div>
  <script>
    (function(){
      var bar = document.getElementById('stickyBar');
      var box = document.querySelector('.download-box');
      if(!bar||!box) return;
      var observer = new IntersectionObserver(function(entries){
        bar.classList.toggle('visible', !entries[0].isIntersecting);
      },{threshold:0});
      observer.observe(box);
    })();
  </script>
  ${siteFooter}
</body>
</html>`;
    fs.writeFileSync(`${dir}/index.html`, html);
  }
  console.log(`✓ ${worksheets.length} individual pages generated`);

  // ── 2. CATEGORY PAGES (subject + grade) ───────────────────────────────────
  const subjects = [...new Set(worksheets.map(w => w.subject.toLowerCase()))];
  const grades = [...new Set(worksheets.map(w => w.grade))].sort((a,b) => a-b);

  for (const subject of subjects) {
    for (const grade of grades) {
      const filtered = worksheets.filter(w => w.subject.toLowerCase() === subject && w.grade === grade);
      if (filtered.length === 0) continue;
      const color = gradeColor(grade);
      const dir = `/opt/examel/examel-pages/free-${subject}-worksheets/grade-${grade}`;
      fs.mkdirSync(dir, { recursive: true });

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Grade ${grade} ${capitalize(subject)} Worksheets | Printable PDF | Examel</title>
  <meta name="description" content="Free printable Grade ${grade} ${capitalize(subject)} worksheets. ${filtered.length}+ worksheets with fun themes. Download PDF instantly. Answer keys included. No signup required.">
  <link rel="canonical" href="https://examel.com/free-${subject}-worksheets/grade-${grade}/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/free-${subject}-worksheets/">Free ${capitalize(subject)} Worksheets</a><span>›</span>
    Grade ${grade}
  </div>
  <div class="hero">
    <h1>Free Grade ${grade} <span>${capitalize(subject)} Worksheets</span></h1>
    <p>${filtered.length}+ free printable Grade ${grade} ${capitalize(subject)} worksheets. Fun themes, answer keys included. Download PDF instantly.</p>
  </div>
  <div class="filter-bar">
    ${grades.map(g => `<a href="/free-${subject}-worksheets/grade-${g}/" class="filter-btn ${g === grade ? 'active' : ''}">Grade ${g}</a>`).join('')}
  </div>
  <div class="grid">
    ${filtered.map(worksheetCard).join('')}
  </div>
  ${siteFooter}
</body>
</html>`;
      fs.writeFileSync(`${dir}/index.html`, html);
    }
  }
  console.log(`✓ Category pages generated`);

  // ── 3. SUBJECT HUB PAGES ──────────────────────────────────────────────────
  const subjectMeta = {
    math: { icon: '➕', desc: 'Addition, subtraction, multiplication, fractions, geometry and more.' },
    english: { icon: '📖', desc: 'Reading comprehension, vocabulary, grammar and writing.' },
    science: { icon: '🔬', desc: 'Solar system, ecosystems, plants, animals and more.' }
  };

  for (const subject of subjects) {
    const filtered = worksheets.filter(w => w.subject.toLowerCase() === subject);
    const dir = `/opt/examel/examel-pages/free-${subject}-worksheets`;
    fs.mkdirSync(dir, { recursive: true });
    const meta = subjectMeta[subject] || { icon: '📝', desc: `Free ${subject} worksheets for K-8.` };
    const recent = filtered.slice(0, 12);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${capitalize(subject)} Worksheets for Kids | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable ${capitalize(subject)} worksheets for Grades 1-6. ${filtered.length}+ worksheets with fun themes kids love. Download PDF instantly. Answer keys included.">
  <link rel="canonical" href="https://examel.com/free-${subject}-worksheets/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    Free ${capitalize(subject)} Worksheets
  </div>
  <div class="hero">
    <h1>Free <span>${capitalize(subject)} Worksheets</span> for Kids</h1>
    <p>${filtered.length}+ free printable ${capitalize(subject)} worksheets for Grades 1-6. ${meta.desc} Fun themes, answer keys included.</p>
  </div>
  <div class="hub-grid">
    ${grades.map(g => {
      const count = worksheets.filter(w => w.subject.toLowerCase() === subject && w.grade === g).length;
      if (count === 0) return '';
      return `<a href="/free-${subject}-worksheets/grade-${g}/" class="hub-card" style="border-top:3px solid ${gradeColor(g)}">
        <span class="hub-icon">📄</span>
        <h3>Grade ${g}</h3>
        <p>${count} worksheets</p>
      </a>`;
    }).join('')}
  </div>
  <h2 style="text-align:center;max-width:1100px;margin:0 auto 20px;padding:0 20px;font-size:22px;">Latest ${capitalize(subject)} Worksheets</h2>
  <div class="grid">
    ${recent.map(worksheetCard).join('')}
  </div>
  ${siteFooter}
</body>
</html>`;
    fs.writeFileSync(`${dir}/index.html`, html);
  }
  console.log(`✓ Subject hub pages generated`);

  // ── 4. GRADE HUB PAGES ────────────────────────────────────────────────────
  const gradeDir = `/opt/examel/examel-pages/free-worksheets`;
  fs.mkdirSync(gradeDir, { recursive: true });

  for (const grade of grades) {
    const filtered = worksheets.filter(w => w.grade === grade);
    if (filtered.length === 0) continue;
    const dir = `/opt/examel/examel-pages/free-worksheets/grade-${grade}`;
    fs.mkdirSync(dir, { recursive: true });
    const color = gradeColor(grade);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Grade ${grade} Worksheets | Math, English, Science | Examel</title>
  <meta name="description" content="Free printable Grade ${grade} worksheets for Math, English and Science. ${filtered.length}+ worksheets with fun themes. Download PDF instantly. Answer keys included.">
  <link rel="canonical" href="https://examel.com/free-worksheets/grade-${grade}/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/free-worksheets/">Free Worksheets</a><span>›</span>
    Grade ${grade}
  </div>
  <div class="hero">
    <h1>Free <span>Grade ${grade} Worksheets</span></h1>
    <p>${filtered.length}+ free printable Grade ${grade} worksheets for Math, English and Science. Fun themes, answer keys included.</p>
  </div>
  <div class="hub-grid">
    ${subjects.map(s => {
      const count = worksheets.filter(w => w.subject.toLowerCase() === s && w.grade === grade).length;
      if (count === 0) return '';
      const icons = { math: '➕', english: '📖', science: '🔬' };
      return `<a href="/free-${s}-worksheets/grade-${grade}/" class="hub-card" style="border-top:3px solid ${color}">
        <span class="hub-icon">${icons[s] || '📝'}</span>
        <h3>${capitalize(s)}</h3>
        <p>${count} worksheets</p>
      </a>`;
    }).join('')}
  </div>
  <div class="grid">
    ${filtered.slice(0, 12).map(worksheetCard).join('')}
  </div>
  ${siteFooter}
</body>
</html>`;
    fs.writeFileSync(`${dir}/index.html`, html);
  }
  console.log(`✓ Grade hub pages generated`);

  // ── WORD SEARCH PAGES
  const wordSearches = generateWordSearchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);

  // ── VOCAB MATCH PAGES
  const vocabMatchPages = generateVocabMatchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);

  // ── READING PASSAGE PAGES
  const readingPassagePages = generateReadingPassagePages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);

  // ── DRILL PAGES
  const drillPages = generateDrillPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);


  // ── DRILL HUB PAGES ───────────────────────────────────────────────────────
  const drillTopics = ['multiplication', 'division', 'addition', 'subtraction'];
  const drillIcons = { multiplication: '✖', division: '➗', addition: '➕', subtraction: '➖' };

  // Main hub: /free-math-drills/
  const allDrills = drillPages;
  const mainDrillDir = '/opt/examel/examel-pages/free-math-drills';
  fs.mkdirSync(mainDrillDir, { recursive: true });
  const mainDrillHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Math Drills for Kids | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable math drills for Grades 1-6. Multiplication, division, addition and subtraction drills with answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/free-math-drills/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free Math Drills</div>
  <div class="hero">
    <h1>Free <span>Math Drills</span> for Kids</h1>
    <p>${allDrills.length || '500'}+ free printable math drills for Grades 1-6. Build fact fluency with timed practice. Answer keys included.</p>
  </div>
  <div class="hub-grid">
    ${drillTopics.map(t => `<a href="/free-${t}-drills/" class="hub-card" style="border-top:3px solid #6C5CE7;">
      <span class="hub-icon">${drillIcons[t]}</span>
      <h3>${t.charAt(0).toUpperCase()+t.slice(1)} Drills</h3>
      <p>Grades 1-6</p>
    </a>`).join('')}
  </div>
  ${siteFooter}
</body></html>`;
  fs.writeFileSync(mainDrillDir + '/index.html', mainDrillHTML);

  // Topic hubs: /free-multiplication-drills/ etc
  for (const topic of drillTopics) {
    const topicDir = `/opt/examel/examel-pages/free-${topic}-drills`;
    fs.mkdirSync(topicDir, { recursive: true });
    const topicDrills = allDrills.filter(d => d.topic === topic);
    const topicHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${topic.charAt(0).toUpperCase()+topic.slice(1)} Drills | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable ${topic} drills for Grades 1-6. Build ${topic} fact fluency with timed practice sheets. Answer keys included. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/free-${topic}-drills/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span><a href="/free-math-drills/">Math Drills</a><span>›</span>${topic.charAt(0).toUpperCase()+topic.slice(1)} Drills</div>
  <div class="hero">
    <h1>Free <span>${topic.charAt(0).toUpperCase()+topic.slice(1)} Drills</span></h1>
    <p>${topicDrills.length || '100'}+ free printable ${topic} drills for Grades 1-6. Timed practice with answer keys.</p>
  </div>
  <div class="hub-grid">
    ${[1,2,3,4,5,6].map(g => {
      const count = topicDrills.filter(d => d.grade === g).length;
      return `<a href="/drills/math/grade-${g}/" class="hub-card" style="border-top:3px solid ${gradeColor(g)};">
        <span class="hub-icon">📄</span>
        <h3>Grade ${g}</h3>
        <p>${count || '50'}+ drills</p>
      </a>`;
    }).join('')}
  </div>
  <div class="grid">
    ${topicDrills.slice(0,12).map(ws => worksheetCard(ws)).join('')}
  </div>
  ${siteFooter}
</body></html>`;
    fs.writeFileSync(topicDir + '/index.html', topicHTML);
  }
  console.log('✓ Drill hub pages generated');

  // ── VOCAB MATCH HUB PAGES
  const vocabSubjects = ['math', 'english', 'science'];
  for (const subj of vocabSubjects) {
    const subjDir = `/opt/examel/examel-pages/free-${subj}-vocabulary`;
    fs.mkdirSync(subjDir, { recursive: true });
    const subjVocab = vocabMatchPages.filter(v => v.subject === subj);
    const subjColor = subj === 'math' ? '#6C5CE7' : subj === 'english' ? '#00B894' : '#0984E3';
    const subjHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${capitalize(subj)} Vocabulary Worksheets | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable ${subj} vocabulary match worksheets for Grades 1-6. Match words to definitions with answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/free-${subj}-vocabulary/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free ${capitalize(subj)} Vocabulary</div>
  <div class="hero">
    <h1>Free <span>${capitalize(subj)} Vocabulary</span> Worksheets</h1>
    <p>${subjVocab.length || '200'}+ free printable ${subj} vocabulary match worksheets for Grades 1-6. Match words to definitions with answer keys.</p>
  </div>
  <div class="grid">
    ${subjVocab.slice(0,12).map(ws => worksheetCard(ws)).join('')}
  </div>
  ${siteFooter}
</body></html>`;
    fs.writeFileSync(subjDir + '/index.html', subjHTML);
  }
  console.log('✓ Vocab match hub pages generated');

  // ── READING PASSAGE HUB PAGES
  const rpGrades = [1,2,3,4,5,6];
  const rpMainDir = '/opt/examel/examel-pages/free-reading-passages';
  fs.mkdirSync(rpMainDir, { recursive: true });
  const rpMainHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Reading Comprehension Passages | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable reading comprehension passages for Grades 1-6. Nonfiction passages with 6 comprehension questions and answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/free-reading-passages/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free Reading Passages</div>
  <div class="hero">
    <h1>Free <span>Reading Comprehension</span> Passages</h1>
    <p>${readingPassagePages.length || '200'}+ free printable reading passages for Grades 1-6. Nonfiction passages with 6 comprehension questions and answer keys.</p>
  </div>
  <div class="hub-grid">
    ${rpGrades.map(g => {
      const count = readingPassagePages.filter(p => p.grade === g).length;
      return `<a href="/free-reading-passages/grade-${g}/" class="hub-card" style="border-top:3px solid ${gradeColor(g)};">
        <span class="hub-icon">📖</span>
        <h3>Grade ${g}</h3>
        <p>${count || '30'}+ passages</p>
      </a>`;
    }).join('')}
  </div>
  ${siteFooter}
</body></html>`;
  fs.writeFileSync(rpMainDir + '/index.html', rpMainHTML);

  // Grade hub pages
  for (const g of rpGrades) {
    const gradeDir = `/opt/examel/examel-pages/free-reading-passages/grade-${g}`;
    fs.mkdirSync(gradeDir, { recursive: true });
    const gradePasses = readingPassagePages.filter(p => p.grade === g);
    const gradeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Grade ${g} Reading Comprehension Passages | Examel</title>
  <meta name="description" content="Free printable Grade ${g} reading comprehension passages. Nonfiction with 6 questions and answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/free-reading-passages/grade-${g}/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span><a href="/free-reading-passages/">Reading Passages</a><span>›</span>Grade ${g}</div>
  <div class="hero">
    <h1>Free Grade ${g} <span>Reading Passages</span></h1>
    <p>${gradePasses.length || '30'}+ free printable Grade ${g} nonfiction reading passages with comprehension questions and answer keys.</p>
  </div>
  <div class="grid">
    ${gradePasses.slice(0,12).map(ws => worksheetCard(ws)).join('')}
  </div>
  ${siteFooter}
</body></html>`;
    fs.writeFileSync(gradeDir + '/index.html', gradeHTML);
  }
  console.log('✓ Reading passage hub pages generated');

  // ── 5. SITEMAP ────────────────────────────────────────────────────────────
  const baseUrl = 'https://examel.com';
  const sitemapUrls = [
    { url: '/', priority: '1.0', freq: 'daily' },
    ...subjects.map(s => ({ url: `/free-${s}-worksheets/`, priority: '0.9', freq: 'daily' })),
    ...subjects.flatMap(s => grades.map(g => ({ url: `/free-${s}-worksheets/grade-${g}/`, priority: '0.85', freq: 'daily' }))),
    ...grades.map(g => ({ url: `/free-worksheets/grade-${g}/`, priority: '0.85', freq: 'daily' })),
    ...worksheets.filter(ws => !ws.format || ws.format === 'worksheet').map(ws => ({ url: `/worksheets/${ws.slug}/`, priority: '0.7', freq: 'monthly' })),
    ...wordSearches.map(ws => ({ url: `/word-searches/${ws.subject}/grade-${ws.grade}/${ws.slug}/`, priority: '0.75', freq: 'monthly' })),
    ...drillPages.map(ws => ({ url: `/drills/${ws.subject}/grade-${ws.grade}/${ws.slug}/`, priority: '0.75', freq: 'monthly' })),
    ...vocabMatchPages.map(ws => ({ url: `/vocab-match/${ws.subject}/grade-${ws.grade}/${ws.slug}/`, priority: '0.75', freq: 'monthly' })),
    ...vocabSubjects.map(s => ({ url: `/free-${s}-vocabulary/`, priority: '0.85', freq: 'daily' })),
    ...readingPassagePages.map(ws => ({ url: `/reading-passages/grade-${ws.grade}/${ws.slug}/`, priority: '0.8', freq: 'monthly' })),
    { url: '/free-reading-passages/', priority: '0.9', freq: 'daily' },
    ...rpGrades.map(g => ({ url: `/free-reading-passages/grade-${g}/`, priority: '0.85', freq: 'daily' })),
    { url: '/free-math-drills/', priority: '0.9', freq: 'daily' },
    ...drillTopics.map(t => ({ url: `/free-${t}-drills/`, priority: '0.85', freq: 'daily' }))
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${baseUrl}${u.url}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync('/opt/examel/examel-pages/sitemap.xml', sitemap);
  console.log(`✓ Sitemap generated — ${sitemapUrls.length} URLs`);
  console.log(`\nDone — ${worksheets.length} individual + category + hub pages`);
}

generatePages().catch(console.error);
