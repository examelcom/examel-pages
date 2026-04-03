require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const examelConfig = require('./examel-config');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const titleCase = (s) => s ? s.split('-').map(capitalize).join(' ') : '';

// URL routing via examelConfig — single source of truth
function getCardUrl(ws) { return examelConfig.getCardUrl(ws); }

function subjectColor(subject, format) {
  if (format === 'drill-grid') return '#DC2626';
  const map = { math:'#7C3AED', english:'#DB2777', science:'#059669', reading:'#0891B2', vocab:'#D97706' };
  return map[subject?.toLowerCase()] || '#6C5CE7';
}

function worksheetCard(ws) {
  const color = subjectColor(ws.subject, ws.format);
  const url = getCardUrl(ws);
  const thumb = ws.preview_p1_url
    ? `<img src="${ws.preview_p1_url}" alt="${ws.title}" class="ws-card-thumb" loading="lazy">`
    : `<div class="ws-card-thumb-placeholder" style="background:linear-gradient(135deg,${color}18 0%,${color}08 100%);border-top:4px solid ${color}"><span style="font-size:28px;opacity:0.25;font-weight:900;color:${color};letter-spacing:-1px">${capitalize(ws.subject)}</span></div>`;
  return `<a href="${url}" class="ws-card">
    ${thumb}
    <div class="ws-card-body">
      <div class="ws-card-badge" style="background:${color}">${capitalize(ws.subject)} · Grade ${ws.grade}</div>
      <h3>${ws.title}</h3>
      <p>${titleCase(ws.topic)} · ${titleCase(ws.theme)} theme</p>
      <span class="ws-card-btn">Download Free →</span>
    </div>
  </a>`;
}

const logoSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg"><rect width="72" height="72" rx="16" fill="#6C5CE7"/><rect x="15" y="15" width="9" height="42" rx="2.5" fill="white"/><rect x="15" y="15" width="15" height="9" rx="2.5" fill="white"/><rect x="15" y="31.5" width="24" height="9" rx="2.5" fill="white"/><rect x="15" y="48" width="33" height="9" rx="2.5" fill="white"/></svg>`;

async function generate() {
  console.log('Fetching data from Supabase...');

  const [freshRes, countsRes] = await Promise.all([
    supabase.from('worksheets').select('id,title,slug,subject,grade,topic,theme,format,preview_p1_url,pdf_url').eq('status','published').order('created_at', { ascending: false }).limit(6),
    supabase.from('worksheets').select('subject,format').eq('status','published')
  ]);

  const fresh = freshRes.data || [];
  const all = countsRes.data || [];

  const totalCount = all.length;
  const mathCount = all.filter(w => w.subject === 'math' && w.format === 'worksheet').length;
  const englishCount = all.filter(w => w.subject === 'english').length;
  const scienceCount = all.filter(w => w.subject === 'science').length;
  const drillCount = all.filter(w => w.format === 'drill-grid').length;

  const YEAR = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Printable Worksheets for Kids | Grades 1–6 | Examel</title>
  <meta name="description" content="Free printable Math, English and Science worksheets for Grades 1–6. Common Core aligned. Themes kids love — space, dinosaurs, pirates and more. Answer key included. Download PDF instantly, no login needed.">
  <link rel="canonical" href="https://examel.com/">
  <meta property="og:title" content="Free Printable Worksheets for Kids | Examel">
  <meta property="og:description" content="Free themed worksheets for Grades 1–6. Math, English, Science. Common Core aligned. Instant PDF download.">
  <meta property="og:url" content="https://examel.com/">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Examel","url":"https://examel.com","description":"Free printable worksheets for Grades 1-6","potentialAction":{"@type":"SearchAction","target":"https://examel.com/free-worksheets/?q={search_term_string}","query-input":"required name=search_term_string"}}</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:'DM Sans',system-ui,sans-serif;background:#FAF8F3;color:#1A1420;-webkit-font-smoothing:antialiased;}
    h1,h2,h3,h4,button,.btn,.nav-link,.logo-text,.subject-name,.grade-num,.step-num,.trust-label,.section-label{font-family:'Outfit',sans-serif;}

    /* NAV */
    .site-header{background:#1C1526;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:200;border-bottom:1px solid rgba(255,255,255,0.06);box-shadow:0 4px 24px rgba(0,0,0,0.18);}
    .site-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
    .logo-text{font-size:20px;font-weight:800;letter-spacing:-1px;color:white;}
    .logo-text span{color:#6C5CE7;}
    .site-header nav{display:flex;align-items:center;gap:2px;}
    .site-header nav a{color:rgba(255,255,255,0.6);text-decoration:none;font-size:13px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all 0.2s;}
    .site-header nav a:hover{color:white;background:rgba(108,92,231,0.2);}
    .mobile-menu-btn{display:none;background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;}
    .mobile-menu-btn span{display:block;width:22px;height:2px;background:rgba(255,255,255,0.8);margin:4px 0;border-radius:2px;}
    .mobile-nav{display:none;position:absolute;top:64px;left:0;right:0;background:#1C1526;border-bottom:2px solid #6C5CE7;padding:16px 20px;z-index:199;flex-direction:column;gap:4px;}
    .mobile-nav a{color:rgba(255,255,255,0.7);text-decoration:none;font-size:15px;font-weight:600;padding:10px 14px;border-radius:10px;display:block;font-family:'Outfit',sans-serif;}
    .mobile-nav.open{display:flex;}

    /* HERO */
    .hero{background:#1C1526;padding:72px 24px 64px;overflow:hidden;position:relative;}
    .hero-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 420px;gap:48px;align-items:center;}
    .hero-label{display:inline-flex;align-items:center;gap:8px;background:rgba(108,92,231,0.2);border:1px solid rgba(108,92,231,0.4);color:#A78BFA;font-size:12px;font-weight:700;padding:5px 14px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;}
    .hero h1{font-size:clamp(34px,4.5vw,58px);font-weight:900;color:white;letter-spacing:-2px;line-height:1.1;margin-bottom:20px;}
    .hero h1 span{color:#6C5CE7;}
    .hero-sub{font-size:17px;color:rgba(255,255,255,0.5);line-height:1.75;margin-bottom:32px;max-width:480px;}
    .hero-ctas{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px;}
    .btn-primary{background:#6C5CE7;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;transition:all 0.2s;display:inline-block;font-family:'Outfit',sans-serif;}
    .btn-primary:hover{background:#5A4BD1;transform:translateY(-2px);box-shadow:0 8px 24px rgba(108,92,231,0.4);}
    .btn-ghost{background:transparent;color:rgba(255,255,255,0.7);padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;border:2px solid rgba(255,255,255,0.15);transition:all 0.2s;display:inline-block;font-family:'Outfit',sans-serif;}
    .btn-ghost:hover{border-color:rgba(108,92,231,0.6);color:white;}
    .trust-strip{display:flex;gap:20px;flex-wrap:wrap;}
    .trust-item{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;}
    .trust-check{width:16px;height:16px;background:rgba(108,92,231,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#A78BFA;font-weight:700;flex-shrink:0;}

    /* GRADE PICKER in hero */
    .grade-picker{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;backdrop-filter:blur(10px);}
    .grade-picker-label{font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;font-family:'Outfit',sans-serif;}
    .grade-pills{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;}
    .grade-pill{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);text-decoration:none;padding:14px 8px;border-radius:12px;text-align:center;transition:all 0.2s;font-family:'Outfit',sans-serif;}
    .grade-pill:hover{background:#6C5CE7;border-color:#6C5CE7;color:white;transform:translateY(-2px);}
    .grade-num{font-size:22px;font-weight:800;display:block;letter-spacing:-0.5px;}
    .grade-sub{font-size:10px;opacity:0.6;margin-top:2px;}
    .subject-pills{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
    .subject-pill{text-decoration:none;padding:10px 12px;border-radius:10px;display:flex;align-items:center;gap:8px;transition:all 0.2s;border:1px solid rgba(255,255,255,0.08);}
    .subject-pill:hover{transform:translateY(-1px);}
    .subject-name{font-size:13px;font-weight:700;color:white;}

    /* TRUST BAR */
    .trust-bar{background:white;border-bottom:1px solid #EDE8DF;padding:16px 24px;}
    .trust-bar-inner{max-width:1100px;margin:0 auto;display:flex;justify-content:center;gap:32px;flex-wrap:wrap;}
    .trust-stat{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#4A4458;}
    .trust-stat-num{font-family:'Outfit',sans-serif;font-weight:800;color:#6C5CE7;font-size:15px;}

    /* SECTIONS */
    .section{padding:64px 24px;}
    .section-inner{max-width:1100px;margin:0 auto;}
    .section-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:12px;}
    .section-label{font-size:11px;font-weight:700;color:#A89FAE;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
    .section-title{font-size:clamp(22px,3vw,32px);font-weight:800;color:#1A1420;letter-spacing:-0.8px;}
    .section-link{font-size:14px;font-weight:700;color:#6C5CE7;text-decoration:none;}
    .section-link:hover{text-decoration:underline;}

    /* SUBJECT CARDS */
    .subjects-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
    .subject-card{background:white;border-radius:24px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;position:relative;overflow:hidden;}
    .subject-card::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;}
    .subject-card:hover{transform:translateY(-6px);box-shadow:0 12px 40px rgba(108,92,231,0.14);}
    .subject-char{font-size:48px;margin-bottom:12px;display:block;}
    .subject-card h3{font-size:18px;font-weight:800;margin-bottom:4px;letter-spacing:-0.3px;}
    .subject-card .count{font-size:12px;color:#A89FAE;margin-bottom:16px;}
    .subject-card .topics{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;}
    .subject-card .topic-pill{font-size:10px;font-weight:600;padding:3px 8px;border-radius:100px;}
    .subject-card .browse{font-size:13px;font-weight:700;font-family:'Outfit',sans-serif;}

    /* WORKSHEET CARDS */
    .ws-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
    .ws-card{background:white;border-radius:20px;overflow:hidden;text-decoration:none;color:#1A1420;display:block;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .ws-card:hover{transform:translateY(-5px);box-shadow:0 8px 32px rgba(108,92,231,0.14);}
    .ws-card-thumb{width:100%;height:160px;object-fit:cover;object-position:top;display:block;border-bottom:1px solid #EDE8DF;}
    .ws-card-thumb-placeholder{width:100%;height:160px;display:flex;align-items:center;justify-content:center;}
    .ws-card-body{padding:16px 18px 18px;}
    .ws-card-badge{display:inline-block;color:white;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;margin-bottom:10px;}
    .ws-card h3{font-size:14px;margin-bottom:5px;line-height:1.5;font-weight:700;}
    .ws-card p{font-size:12px;color:#A89FAE;margin-bottom:12px;}
    .ws-card-btn{font-size:12px;font-weight:700;color:#6C5CE7;font-family:'Outfit',sans-serif;}

    /* HOW IT WORKS */
    .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
    .how-card{background:white;border-radius:20px;padding:32px 24px;border:1px solid #EDE8DF;text-align:center;}
    .step-num{width:40px;height:40px;background:#6C5CE7;color:white;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;margin:0 auto 16px;}
    .how-card h3{font-size:17px;font-weight:700;margin-bottom:10px;letter-spacing:-0.3px;}
    .how-card p{font-size:14px;color:#6B6475;line-height:1.7;}

    /* WHY EXAMEL */
    .why-section{background:#F4F1FF;}
    .why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
    .why-card{background:white;border-radius:20px;padding:28px;border:1px solid #EDE8DF;}
    .why-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:14px;background:#F4F1FF;}
    .why-card h3{font-size:16px;font-weight:700;margin-bottom:8px;letter-spacing:-0.2px;}
    .why-card p{font-size:14px;color:#6B6475;line-height:1.7;}

    /* GRADE NAVIGATOR */
    .grades-section{background:#1C1526;}
    .grades-section .section-label{color:rgba(255,255,255,0.3);}
    .grades-section .section-title{color:white;}
    .grades-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;}
    .grade-card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px 12px;text-decoration:none;text-align:center;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);}
    .grade-card:hover{background:#6C5CE7;border-color:#6C5CE7;transform:translateY(-4px);}
    .grade-card .g-num{font-size:32px;font-weight:900;color:white;letter-spacing:-1px;font-family:'Outfit',sans-serif;}
    .grade-card .g-label{font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;}
    .grade-card .g-count{font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;}

    /* EMAIL CAPTURE */
    .email-section{background:#1C1526;padding:64px 24px;}
    .email-inner{max-width:560px;margin:0 auto;text-align:center;}
    .email-inner h2{font-size:clamp(24px,3vw,36px);font-weight:800;color:white;letter-spacing:-1px;margin-bottom:12px;}
    .email-inner p{color:rgba(255,255,255,0.45);margin-bottom:28px;font-size:16px;line-height:1.7;}
    .email-form{display:flex;gap:10px;flex-wrap:wrap;}
    .email-input{flex:1;min-width:220px;padding:14px 18px;border:2px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);border-radius:12px;font-size:15px;color:white;outline:none;font-family:'DM Sans',sans-serif;}
    .email-input::placeholder{color:rgba(255,255,255,0.3);}
    .email-input:focus{border-color:#6C5CE7;}
    .email-btn{background:#6C5CE7;color:white;border:none;padding:14px 24px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;transition:all 0.2s;}
    .email-btn:hover{background:#5A4BD1;}
    .email-note{font-size:12px;color:rgba(255,255,255,0.25);margin-top:12px;}
    .email-msg{display:none;margin-top:14px;padding:10px 16px;border-radius:10px;font-size:14px;}

    /* FOOTER */
    .site-footer{padding:52px 20px 28px;background:#1C1526;border-top:3px solid #6C5CE7;}
    .footer-inner{max-width:1100px;margin:0 auto;}
    .footer-logo{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:36px;}
    .footer-motto{font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:1.5px;margin-top:2px;}
    .footer-grid{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;margin-bottom:36px;}
    .footer-col{display:flex;flex-direction:column;gap:10px;min-width:130px;}
    .footer-heading{font-size:10px;font-weight:800;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;font-family:'Outfit',sans-serif;}
    .site-footer a{color:rgba(255,255,255,0.5);text-decoration:none;font-size:13px;transition:color 0.2s;font-weight:500;}
    .site-footer a:hover{color:#6C5CE7;}
    .footer-bottom{text-align:center;font-size:12px;color:rgba(255,255,255,0.2);border-top:1px solid rgba(255,255,255,0.07);padding-top:24px;}

    /* RESPONSIVE */
    @media(max-width:1024px){.subjects-grid{grid-template-columns:repeat(2,1fr);}.grades-grid{grid-template-columns:repeat(3,1fr);}.hero-inner{grid-template-columns:1fr;}.grade-picker{display:none;}}
    @media(max-width:768px){.site-header nav{display:none;}.mobile-menu-btn{display:block;}.how-grid{grid-template-columns:1fr;}.why-grid{grid-template-columns:1fr;}.subjects-grid{grid-template-columns:repeat(2,1fr);}.trust-bar-inner{gap:16px;}.hero-ctas{flex-direction:column;align-items:flex-start;}}
    @media(max-width:480px){.subjects-grid{grid-template-columns:1fr;}.grades-grid{grid-template-columns:repeat(2,1fr);}.ws-grid{grid-template-columns:1fr;}}
  </style>
${buildAnalytics()}
</head>
<body>

<header class="site-header">
  <a href="https://examel.com" class="site-logo">
    ${logoSVG(30)}
    <span class="logo-text">examel<span>·</span></span>
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
  <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</header>
<nav class="mobile-nav" id="mobileNav">
  <a href="/free-math-worksheets/">Math</a>
  <a href="/free-english-worksheets/">English</a>
  <a href="/free-science-worksheets/">Science</a>
  <a href="/free-math-drills/">Drills</a>
  <a href="/free-reading-passages/">Reading</a>
  <a href="/free-math-vocabulary/">Vocabulary</a>
  <a href="/word-searches/">Word Searches</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-inner">
    <div>
      <div class="hero-label">✓ Free · No login · Instant PDF</div>
      <h1>Worksheets Your Kids<br><span>Actually Want</span><br>to Do</h1>
      <p class="hero-sub">Themed printables for Grades 1–6. Math, English and Science. Common Core aligned. Answer key on every page.</p>
      <div class="hero-ctas">
        <a href="/free-math-worksheets/" class="btn-primary">Browse Math Worksheets →</a>
        <a href="/free-worksheets/grade-3/" class="btn-ghost">Browse by Grade</a>
      </div>
      <div class="trust-strip">
        <div class="trust-item"><div class="trust-check">✓</div>${totalCount.toLocaleString()}+ worksheets</div>
        <div class="trust-item"><div class="trust-check">✓</div>Free forever</div>
        <div class="trust-item"><div class="trust-check">✓</div>Answer key included</div>
        <div class="trust-item"><div class="trust-check">✓</div>CCSS aligned</div>
      </div>
    </div>
    <div class="grade-picker">
      <div class="grade-picker-label">Find by Grade</div>
      <div class="grade-pills">
        <a href="/free-worksheets/grade-1/" class="grade-pill"><span class="grade-num">1</span><span class="grade-sub">Grade</span></a>
        <a href="/free-worksheets/grade-2/" class="grade-pill"><span class="grade-num">2</span><span class="grade-sub">Grade</span></a>
        <a href="/free-worksheets/grade-3/" class="grade-pill"><span class="grade-num">3</span><span class="grade-sub">Grade</span></a>
        <a href="/free-worksheets/grade-4/" class="grade-pill"><span class="grade-num">4</span><span class="grade-sub">Grade</span></a>
        <a href="/free-worksheets/grade-5/" class="grade-pill"><span class="grade-num">5</span><span class="grade-sub">Grade</span></a>
        <a href="/free-worksheets/grade-6/" class="grade-pill"><span class="grade-num">6</span><span class="grade-sub">Grade</span></a>
      </div>
      <div class="subject-pills">
        <a href="/free-math-worksheets/" class="subject-pill" style="background:rgba(124,58,237,0.12);border-color:rgba(124,58,237,0.2);"><span style="font-size:20px;">📐</span><span class="subject-name">Math</span></a>
        <a href="/free-english-worksheets/" class="subject-pill" style="background:rgba(219,39,119,0.12);border-color:rgba(219,39,119,0.2);"><span style="font-size:20px;">📖</span><span class="subject-name">English</span></a>
        <a href="/free-science-worksheets/" class="subject-pill" style="background:rgba(5,150,105,0.12);border-color:rgba(5,150,105,0.2);"><span style="font-size:20px;">🔬</span><span class="subject-name">Science</span></a>
        <a href="/free-math-drills/" class="subject-pill" style="background:rgba(220,38,38,0.12);border-color:rgba(220,38,38,0.2);"><span style="font-size:20px;">⚡</span><span class="subject-name">Drills</span></a>
      </div>
    </div>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <div class="trust-bar-inner">
    <div class="trust-stat"><span class="trust-stat-num">${totalCount.toLocaleString()}+</span> free worksheets</div>
    <div class="trust-stat"><span class="trust-stat-num">Grades 1–6</span> all covered</div>
    <div class="trust-stat"><span class="trust-stat-num">CCSS</span> aligned</div>
    <div class="trust-stat"><span class="trust-stat-num">Daily</span> new worksheets</div>
    <div class="trust-stat"><span class="trust-stat-num">Free</span> forever</div>
  </div>
</div>

<!-- SUBJECTS -->
<section class="section" style="background:#FAF8F3;">
  <div class="section-inner">
    <div class="section-header">
      <div>
        <div class="section-label">Browse by subject</div>
        <h2 class="section-title">Math, English and Science</h2>
      </div>
    </div>
    <div class="subjects-grid">
      <a href="/free-math-worksheets/" class="subject-card" style="border-top-color:#7C3AED;">
        <span class="subject-char">📐</span>
        <h3 style="color:#7C3AED;">Math</h3>
        <p class="count">${mathCount}+ worksheets · Grades 1–6</p>
        <div class="topics">
          <span class="topic-pill" style="background:#F4F1FF;color:#7C3AED;">Addition</span>
          <span class="topic-pill" style="background:#F4F1FF;color:#7C3AED;">Multiplication</span>
          <span class="topic-pill" style="background:#F4F1FF;color:#7C3AED;">Fractions</span>
        </div>
        <span class="browse" style="color:#7C3AED;">Browse Math →</span>
      </a>
      <a href="/free-english-worksheets/" class="subject-card" style="border-top-color:#DB2777;">
        <span class="subject-char">📖</span>
        <h3 style="color:#DB2777;">English</h3>
        <p class="count">${englishCount}+ worksheets · Grades 1–6</p>
        <div class="topics">
          <span class="topic-pill" style="background:#FDF2F8;color:#DB2777;">Reading</span>
          <span class="topic-pill" style="background:#FDF2F8;color:#DB2777;">Grammar</span>
          <span class="topic-pill" style="background:#FDF2F8;color:#DB2777;">Writing</span>
        </div>
        <span class="browse" style="color:#DB2777;">Browse English →</span>
      </a>
      <a href="/free-science-worksheets/" class="subject-card" style="border-top-color:#059669;">
        <span class="subject-char">🔬</span>
        <h3 style="color:#059669;">Science</h3>
        <p class="count">${scienceCount}+ worksheets · Grades 1–6</p>
        <div class="topics">
          <span class="topic-pill" style="background:#ECFDF5;color:#059669;">Ecosystems</span>
          <span class="topic-pill" style="background:#ECFDF5;color:#059669;">Forces</span>
          <span class="topic-pill" style="background:#ECFDF5;color:#059669;">Matter</span>
        </div>
        <span class="browse" style="color:#059669;">Browse Science →</span>
      </a>
      <a href="/free-math-drills/" class="subject-card" style="border-top-color:#DC2626;">
        <span class="subject-char">⚡</span>
        <h3 style="color:#DC2626;">Math Drills</h3>
        <p class="count">${drillCount}+ drills · Grades 1–6</p>
        <div class="topics">
          <span class="topic-pill" style="background:#FEF2F2;color:#DC2626;">Speed practice</span>
          <span class="topic-pill" style="background:#FEF2F2;color:#DC2626;">Timed drills</span>
        </div>
        <span class="browse" style="color:#DC2626;">Browse Drills →</span>
      </a>
    </div>
  </div>
</section>

<!-- FRESH THIS WEEK -->
<section class="section" style="background:white;">
  <div class="section-inner">
    <div class="section-header">
      <div>
        <div class="section-label">Just added</div>
        <h2 class="section-title">Fresh This Week</h2>
      </div>
      <a href="/free-worksheets/" class="section-link">Browse all ${totalCount.toLocaleString()}+ worksheets →</a>
    </div>
    <div class="ws-grid">
      ${fresh.map(ws => worksheetCard(ws)).join('\n')}
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="section" style="background:#FAF8F3;">
  <div class="section-inner">
    <div class="section-header">
      <div>
        <div class="section-label">Simple process</div>
        <h2 class="section-title">How It Works</h2>
      </div>
    </div>
    <div class="how-grid">
      <div class="how-card">
        <div class="step-num">1</div>
        <h3>Choose a worksheet</h3>
        <p>Pick a grade, subject, and theme your child loves — space, dinosaurs, pirates, sports and hundreds more.</p>
      </div>
      <div class="how-card">
        <div class="step-num">2</div>
        <h3>Download instantly</h3>
        <p>One click. Instant PDF. No login required. No account. No subscription. Just download and go.</p>
      </div>
      <div class="how-card">
        <div class="step-num">3</div>
        <h3>Print and learn</h3>
        <p>Print at home or school. Name field, date field, and the full answer key included on every worksheet.</p>
      </div>
    </div>
  </div>
</section>

<!-- WHY EXAMEL -->
<section class="section why-section">
  <div class="section-inner">
    <div class="section-header">
      <div>
        <div class="section-label">Why parents and teachers choose us</div>
        <h2 class="section-title">What Makes Examel Different</h2>
      </div>
    </div>
    <div class="why-grid">
      <div class="why-card">
        <div class="why-icon">🎨</div>
        <h3>Themes that actually engage kids</h3>
        <p>Space shuttles. Pirate treasure. Dinosaur adventures. The theme is woven into every question — not just the title. Kids stay focused because the story pulls them in.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">📐</div>
        <h3>Common Core aligned</h3>
        <p>Every worksheet is tagged to CCSS standards. Grade-appropriate difficulty. Teacher-reviewed. Used in classrooms and homes across the USA.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">✓</div>
        <h3>Answer key on every worksheet</h3>
        <p>Teachers and parents can check work instantly. Full solutions on every single worksheet, on a separate answer key page. No guessing.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">⚡</div>
        <h3>New worksheets every day</h3>
        <p>Hundreds of new worksheets generated every night. Fresh themes, new topics, growing daily. Always something new to explore.</p>
      </div>
    </div>
  </div>
</section>

<!-- GRADE NAVIGATOR -->
<section class="section grades-section">
  <div class="section-inner">
    <div class="section-header">
      <div>
        <div class="section-label">Find your level</div>
        <h2 class="section-title">Browse by Grade</h2>
      </div>
    </div>
    <div class="grades-grid">
      <a href="/free-worksheets/grade-1/" class="grade-card"><div class="g-num">1</div><div class="g-label">Grade One</div><div class="g-count">Math · English · Science</div></a>
      <a href="/free-worksheets/grade-2/" class="grade-card"><div class="g-num">2</div><div class="g-label">Grade Two</div><div class="g-count">Math · English · Science</div></a>
      <a href="/free-worksheets/grade-3/" class="grade-card"><div class="g-num">3</div><div class="g-label">Grade Three</div><div class="g-count">Math · English · Science</div></a>
      <a href="/free-worksheets/grade-4/" class="grade-card"><div class="g-num">4</div><div class="g-label">Grade Four</div><div class="g-count">Math · English · Science</div></a>
      <a href="/free-worksheets/grade-5/" class="grade-card"><div class="g-num">5</div><div class="g-label">Grade Five</div><div class="g-count">Math · English · Science</div></a>
      <a href="/free-worksheets/grade-6/" class="grade-card"><div class="g-num">6</div><div class="g-label">Grade Six</div><div class="g-count">Math · English · Science</div></a>
    </div>
  </div>
</section>

<!-- EMAIL CAPTURE -->
<section class="email-section">
  <div class="email-inner">
    <h2>Get new worksheets every week</h2>
    <p>New themed printables added daily. Subscribe free and get the best ones delivered to your inbox every week.</p>
    <div class="email-form">
      <input type="email" class="email-input" id="emailInput" placeholder="Your email address">
      <button class="email-btn" onclick="examelSubscribe()">Subscribe Free</button>
    </div>
    <div class="email-msg" id="emailMsg"></div>
    <p class="email-note">No spam. Unsubscribe anytime.</p>
  </div>
</section>

<!-- FOOTER -->
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-logo">
      ${logoSVG(34)}
      <div>
        <div style="font-size:20px;font-weight:800;letter-spacing:-1px;color:white;font-family:'Outfit',sans-serif;">examel<span style="color:#6C5CE7;">·</span></div>
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
    <div class="footer-bottom">© ${YEAR} Examel · Free K-8 Printable Worksheets · Every exam. Every grade.</div>
  </div>
</footer>

<script>
function toggleMobileMenu(){document.getElementById('mobileNav').classList.toggle('open');}
function examelSubscribe(){
  var email=document.getElementById('emailInput').value.trim();
  var msg=document.getElementById('emailMsg');
  if(!email||!email.includes('@')){msg.style.display='block';msg.style.background='#FFF5F5';msg.style.color='#D63031';msg.textContent='Please enter a valid email address.';return;}
  fetch('https://manage.klaviyo.com/api/subscribe',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'email_address='+encodeURIComponent(email)})
  .then(function(r){msg.style.display='block';if(r.ok||r.status===200||r.status===201){msg.style.background='#F0FDF4';msg.style.color='#43A047';msg.textContent='You are in! Check your email to confirm.';}else{msg.style.background='#FFF5F5';msg.style.color='#D63031';msg.textContent='Something went wrong. Please try again.';}})
  .catch(function(){msg.style.display='block';msg.style.background='#FFF5F5';msg.style.color='#D63031';msg.textContent='Something went wrong. Please try again.';});
}
</script>
</body>
</html>`;

  fs.writeFileSync('/opt/examel/examel-pages/index.html', html);
  console.log(`Homepage generated — ${totalCount} worksheets, ${fresh.length} fresh cards`);
}

generate().catch(console.error);
