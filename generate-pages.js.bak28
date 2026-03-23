require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const path = require("path");
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { generateWordSearchPages } = require('./word-search-generator.js');
const { generateDrillPagesV2 } = require('./drill-generator-v2.js');
const { generateDrillPages } = require("./drill-generator.js");
const { generateVocabMatchPages } = require('./vocab-match-generator.js');
const { generateReadingPassagePages } = require('./reading-passage-generator.js');
const { getPedagogicalLinks } = require('./linking-engine.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const gradeColor = (grade) => grade <= 2 ? '#FF6B6B' : grade <= 4 ? '#6C5CE7' : '#0984E3';
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s) => s.split(' ').map(capitalize).join(' ');
const formatTopic = (t) => titleCase(t.replace(/-/g, ' '));
const formatTheme = (t) => titleCase(t.replace(/-/g, ' '));

// ── FILTER FLAGS ──────────────────────────────────────────────────────────
// Usage: node generate-pages.js --filter format=worksheet
//        node generate-pages.js --filter subject=math,grade=3
//        node generate-pages.js  (no filter = full build)
const FILTER = {};
const filterIdx = process.argv.indexOf('--filter');
if (filterIdx !== -1 && process.argv[filterIdx + 1]) {
  const pairs = process.argv[filterIdx + 1].split(',');
  pairs.forEach(pair => {
    const [k, v] = pair.trim().split('=');
    if (k && v) FILTER[k.trim()] = v.trim().toLowerCase();
  });
  console.log('🔍 Filter active:', JSON.stringify(FILTER));
}
function shouldRun(section) {
  if (!Object.keys(FILTER).length) return true;
  const fmt = FILTER.format;
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
    case 'sitemap':          return true;
    default:                 return true;
  }
}

// ── DRILL INTENT URL MAP (fixes broken drill links) ──────────────────────
const DRILL_INTENT_MAP = {
  'addition': '/free-math-drills/addition/',
  'single-digit-addition': '/free-math-drills/addition/single-digit-addition/',
  'addition-within-10': '/free-math-drills/addition/addition-within-10/',
  'addition-within-20': '/free-math-drills/addition/addition-within-20/',
  'doubles-facts': '/free-math-drills/addition/doubles-facts/',
  'adding-three-numbers': '/free-math-drills/addition/adding-three-numbers/',
  'adding-multiples-of-10': '/free-math-drills/addition/adding-multiples-of-10/',
  'addition-no-regrouping': '/free-math-drills/addition/addition-no-regrouping/',
  'addition-with-regrouping': '/free-math-drills/addition/addition-with-regrouping/',
  '3-digit-addition': '/free-math-drills/addition/3-digit-addition/',
  'subtraction': '/free-math-drills/subtraction/',
  'single-digit-subtraction': '/free-math-drills/subtraction/single-digit-subtraction/',
  'subtraction-within-10': '/free-math-drills/subtraction/subtraction-within-10/',
  'subtraction-within-20': '/free-math-drills/subtraction/subtraction-within-20/',
  'subtracting-multiples-of-10': '/free-math-drills/subtraction/subtracting-multiples-of-10/',
  'subtraction-no-borrowing': '/free-math-drills/subtraction/subtraction-no-borrowing/',
  'subtraction-with-borrowing': '/free-math-drills/subtraction/subtraction-with-borrowing/',
  '3-digit-subtraction': '/free-math-drills/subtraction/3-digit-subtraction/',
  'mixed-add-subtract': '/free-math-drills/subtraction/mixed-add-subtract/',
  'multiplication': '/free-math-drills/multiplication/',
  'multiplication-facts-0-12': '/free-math-drills/multiplication/multiplication-facts-0-12/',
  '2-digit-by-1-digit': '/free-math-drills/multiplication/2-digit-by-1-digit/',
  '2-digit-by-2-digit': '/free-math-drills/multiplication/2-digit-by-2-digit/',
  'multiplying-by-10-100': '/free-math-drills/multiplication/multiplying-by-10-100/',
  'mixed-mult-division': '/free-math-drills/multiplication/mixed-mult-division/',
  'times-table-2': '/free-math-drills/multiplication/times-table-2/',
  'times-table-3': '/free-math-drills/multiplication/times-table-3/',
  'times-table-4': '/free-math-drills/multiplication/times-table-4/',
  'times-table-5': '/free-math-drills/multiplication/times-table-5/',
  'times-table-6': '/free-math-drills/multiplication/times-table-6/',
  'times-table-7': '/free-math-drills/multiplication/times-table-7/',
  'times-table-8': '/free-math-drills/multiplication/times-table-8/',
  'times-table-9': '/free-math-drills/multiplication/times-table-9/',
  'times-table-10': '/free-math-drills/multiplication/times-table-10/',
  'times-table-11': '/free-math-drills/multiplication/times-table-11/',
  'times-table-12': '/free-math-drills/multiplication/times-table-12/',
  'division': '/free-math-drills/division/',
  'basic-division-facts': '/free-math-drills/division/basic-division-facts/',
  'division-by-2': '/free-math-drills/division/division-by-2/',
  'division-by-5': '/free-math-drills/division/division-by-5/',
  'division-by-10': '/free-math-drills/division/division-by-10/',
  'division-with-remainders': '/free-math-drills/division/division-with-remainders/',
  'dividing-by-10-100': '/free-math-drills/division/dividing-by-10-100/',
  'long-division-2-digit-divisor': '/free-math-drills/division/long-division-2-digit-divisor/',
  'mad-minute-addition': '/free-math-drills/mixed/mad-minute-addition/',
  'mad-minute-multiplication': '/free-math-drills/mixed/mad-minute-multiplication/',
  'mixed-all-operations': '/free-math-drills/mixed/mixed-all-operations/'
};

function getCardUrl(ws) {
  if (ws.format === 'drill-grid') { const intentUrl = DRILL_INTENT_MAP[(ws.topic || '').toLowerCase().replace(/ /g, '-')]; return intentUrl || '/free-math-drills/'; }
  if (ws.format === 'word-search') return '/word-searches/';
  if (ws.format === 'vocab-match') return `/vocab-match/${ws.subject}/grade-${ws.grade}/${ws.slug}/`;
  if (ws.format === 'reading-passage') return `/reading-passages/grade-${ws.grade}/${ws.slug}/`;
  return `/worksheets/${ws.slug}/`;
}

function subjectColor(subject) {
  const map = { math:'#7C3AED', english:'#DB2777', science:'#059669', 'drill-grid':'#DC2626', reading:'#0891B2', vocab:'#D97706' };
  return map[subject?.toLowerCase()] || '#6C5CE7';
}
function subjectEmoji(subject) {
  const map = { math:'📐', english:'📖', science:'🔬', 'drill-grid':'⚡', reading:'📚', vocab:'💬' };
  return map[subject?.toLowerCase()] || '📄';
}
function worksheetCard(ws) {
  const color = subjectColor(ws.format === 'drill-grid' ? 'drill-grid' : ws.subject);
  const url = getCardUrl(ws);
  const subjectLabel = capitalize(ws.subject);
  const thumb = ws.preview_p1_url
    ? `<img src="${ws.preview_p1_url}" alt="${ws.title}" class="ws-card-thumb" loading="lazy">`
    : `<div class="ws-card-thumb-placeholder" style="background:linear-gradient(135deg,${color}18 0%,${color}08 100%);border-top:4px solid ${color}"><span style="font-size:28px;opacity:0.25;font-weight:900;color:${color};letter-spacing:-1px">${subjectLabel}</span></div>`;
  return `
    <a href="${url}" class="ws-card">
      ${thumb}
      <div class="ws-card-body">
        <div class="ws-card-badge" style="background:${color}">${capitalize(ws.subject)} · Grade ${ws.grade}</div>
        <h3>${ws.title}</h3>
        <p>${formatTopic(ws.topic)} · ${formatTheme(ws.theme)} theme</p>
        <span class="ws-card-btn">Download Free →</span>
      </div>
    </a>`;
}

const sharedCSS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:'DM Sans',system-ui,sans-serif;background:#FAF8F3;color:#1A1420;-webkit-font-smoothing:antialiased;}
    h1,h2,h3,h4,.site-logo-text,.filter-btn,.ws-card-btn,.hub-card h3,.hero h1,.footer-heading{font-family:'Outfit',sans-serif;}
    /* ── NAV ── */
    .site-header{background:#1C1526;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:200;border-bottom:1px solid rgba(255,255,255,0.06);box-shadow:0 4px 24px rgba(0,0,0,0.18);}
    .site-logo{display:flex;align-items:center;gap:10px;text-decoration:none;transition:transform 0.2s;}
    .site-logo:hover{transform:translateY(-1px);}
    .site-logo-text{font-size:20px;font-weight:800;letter-spacing:-1px;color:white;}
    .site-logo-text span{color:#6C5CE7;}
    .site-header nav{display:flex;align-items:center;gap:2px;}
    .site-header nav a{color:rgba(255,255,255,0.6);text-decoration:none;font-size:13px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all 0.2s;letter-spacing:0.1px;}
    .site-header nav a:hover{color:white;background:rgba(108,92,231,0.2);}
    /* ── BREADCRUMB ── */
    .breadcrumb{max-width:860px;margin:18px auto 0;padding:0 20px;font-size:15px;color:#A89FAE;display:flex;align-items:center;flex-wrap:wrap;gap:4px;}
    .breadcrumb a{color:#6C5CE7;text-decoration:none;font-weight:500;transition:opacity 0.2s;}
    .breadcrumb a:hover{opacity:0.7;}
    .breadcrumb .sep{opacity:0.3;margin:0 2px;}
    /* ── HUB HERO ── */
    .hero{padding:64px 20px 56px;text-align:center;background:#FAF8F3;}
    .hero h1{font-size:clamp(26px,4vw,44px);margin-bottom:14px;color:#1A1420;font-weight:800;letter-spacing:-1.5px;line-height:1.15;}
    .hero h1 span{color:#6C5CE7;}
    .hero p{font-size:17px;color:#6B6475;max-width:580px;margin:0 auto;line-height:1.75;}
    /* ── FILTER ── */
    .filter-bar{max-width:1100px;margin:0 auto 32px;padding:0 20px;display:flex;gap:10px;flex-wrap:wrap;}
    .filter-btn{padding:8px 20px;border-radius:100px;text-decoration:none;font-size:13px;font-weight:700;border:2px solid #EDE8DF;color:#6B6475;background:white;transition:all 0.2s;cursor:pointer;}
    .filter-btn:hover,.filter-btn.active{background:#6C5CE7;color:white;border-color:#6C5CE7;box-shadow:0 4px 16px rgba(108,92,231,0.3);}
    /* ── GRID ── */
    .grid{max-width:1100px;margin:0 auto;padding:0 20px 64px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
    /* ── CARDS ── */
    .ws-card{background:white;border-radius:20px;overflow:hidden;text-decoration:none;color:#1A1420;display:block;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .ws-card:hover{transform:translateY(-5px);box-shadow:0 8px 32px rgba(108,92,231,0.14),0 2px 8px rgba(0,0,0,0.04);}
    .ws-card-thumb{width:100%;height:160px;object-fit:cover;object-position:top;display:block;border-bottom:1px solid #EDE8DF;}
    .ws-card-thumb-placeholder{width:100%;height:160px;background:linear-gradient(135deg,#F4F1FF 0%,#EDE8DF 100%);display:flex;align-items:center;justify-content:center;font-size:32px;}
    .ws-card-body{padding:16px 18px 18px;}
    .ws-card-badge{display:inline-block;color:white;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;margin-bottom:10px;letter-spacing:0.3px;}
    .ws-card h3{font-size:14px;margin-bottom:5px;line-height:1.5;font-weight:700;color:#1A1420;}
    .ws-card p{font-size:12px;color:#A89FAE;margin-bottom:12px;line-height:1.5;}
    .ws-card-btn{font-size:12px;font-weight:700;color:#6C5CE7;}
    /* ── HUB ── */
    .hub-grid{max-width:1100px;margin:0 auto;padding:0 20px 64px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
    .hub-card{background:white;border-radius:24px;padding:36px 20px;text-decoration:none;color:#1A1420;text-align:center;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .hub-card:hover{transform:translateY(-5px);box-shadow:0 8px 32px rgba(108,92,231,0.14),0 2px 8px rgba(0,0,0,0.04);}
    .hub-card .hub-icon{font-size:40px;margin-bottom:14px;display:block;}
    .hub-card h3{font-size:17px;margin-bottom:6px;font-weight:700;}
    .hub-card p{font-size:13px;color:#6B6475;line-height:1.6;}
    /* ── FOOTER ── */
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
    .footer-chars{display:flex;justify-content:center;gap:8px;margin-bottom:28px;opacity:0.6;}
    .mobile-menu-btn{display:none;background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;transition:background 0.2s;}
    .mobile-menu-btn:hover{background:rgba(108,92,231,0.2);}
    .mobile-menu-btn span{display:block;width:22px;height:2px;background:rgba(255,255,255,0.8);margin:4px 0;border-radius:2px;transition:all 0.3s;}
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
  <script>function toggleMobileMenu(){var n=document.getElementById('mobileNav');n.classList.toggle('open');}</script>`;

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
      <div class="footer-bottom">© 2026 Examel · Free K-8 Printable Worksheets · Every exam. Every grade.</div>
    </div>
  </footer>`;


// ── ITEMS 1-7: Educational content, email capture, answer badge ──────────
const SUBJECT_EDUCATION = {
  math: {
    intro: 'Our math worksheets help students in Grades 1-6 build strong foundational skills aligned to Common Core State Standards. From basic addition to fractions and multi-step word problems, every worksheet reinforces a specific skill with real practice.',
    skills: 'Skills covered include number sense, operations, algebraic thinking, measurement, geometry, and data analysis. Each worksheet includes an answer key.',
    whyItMatters: 'Math confidence builds when students practice the right skill at the right difficulty level. Our worksheets are organized by grade, topic, and difficulty.'
  },
  english: {
    intro: 'Our English Language Arts worksheets cover reading, writing, grammar, and vocabulary for Grades 1-6. Every worksheet aligns to Common Core ELA standards.',
    skills: 'Skills covered include reading comprehension, parts of speech, sentence structure, vocabulary building, spelling, writing prompts, and phonics.',
    whyItMatters: 'Strong readers and writers are made through consistent practice. Our worksheets progress from sight words in early grades to complex reading passages in upper grades.'
  },
  science: {
    intro: 'Our science worksheets introduce students in Grades 1-6 to the natural world through engaging, standards-aligned activities spanning life science, earth science, and physical science.',
    skills: 'Skills covered include observation, classification, the scientific method, ecosystems, weather, matter, forces, and the human body.',
    whyItMatters: 'Our worksheets use verified facts from trusted sources — NASA, USDA, USGS, and NOAA — to make learning accurate and engaging.'
  }
};

const TOPIC_EDUCATION = {
  'math|multiplication': { intro: 'Multiplication is one of the most important math skills. Our worksheets cover basic facts (times tables 2-12), multi-digit multiplication, word problems, and real-world applications.', ccss: 'CCSS 3.OA.A.1-C.7, 4.OA.A, 5.NBT.B.5', progression: 'Single-digit facts → times tables → multi-digit multiplication.' },
  'math|addition': { intro: 'Addition is the foundation of all math learning. Our worksheets progress from single-digit facts through multi-digit addition with regrouping and word problems.', ccss: 'CCSS 1.OA.C.6, 2.OA.B.2, 2.NBT.B.5-9, 3.NBT.A.2', progression: 'Adding within 10 → within 20 → 2-digit and 3-digit with regrouping.' },
  'math|subtraction': { intro: 'Subtraction prepares students for multiplication and division. Our worksheets cover basic facts, borrowing/regrouping, multi-digit subtraction, and word problems.', ccss: 'CCSS 1.OA.C.6, 2.OA.B.2, 2.NBT.B.5-9, 3.NBT.A.2', progression: 'Within 10 → within 20 → multi-digit with borrowing.' },
  'math|fractions': { intro: 'Fractions are a critical Grade 3-5 skill. Our worksheets cover identifying, equivalent, comparing, adding, subtracting, and word problems.', ccss: 'CCSS 3.NF.A.1-3, 4.NF.A-C, 5.NF.A-B', progression: 'Identifying → comparing → operations with like and unlike denominators.' },
  'math|division': { intro: 'Division completes the four basic operations. Our worksheets cover basic facts, long division, remainders, and word problems.', ccss: 'CCSS 3.OA.A.2-4, 4.NBT.B.6, 5.NBT.B.6', progression: 'Basic facts → division within 100 → long division.' },
  'english|reading comprehension': { intro: 'Reading comprehension builds every ELA skill at once. Our passages include grade-appropriate nonfiction text with questions on main idea, inference, vocabulary, and text evidence.', ccss: 'CCSS ELA RI.1-6, RL.1-6', progression: 'Short passages with recall → longer passages with inferential questions.' },
  'english|parts of speech': { intro: 'Parts of speech are the foundation of grammar mastery. Our worksheets cover nouns, verbs, adjectives, adverbs, pronouns, prepositions, and conjunctions.', ccss: 'CCSS Language L.1-6.1', progression: 'Identifying nouns/verbs → adjectives/adverbs → using in writing.' },
  'science|ecosystems': { intro: 'Ecosystems teach how living things interact. Our worksheets cover habitats, food chains, producers/consumers, adaptations, and energy flow.', ccss: 'NGSS + Common Core literacy for science', progression: 'Basic needs → habitats and food chains → complex interactions.' }
};

const answerBadge = `<div style="max-width:680px;margin:0 auto 32px;padding:16px 24px;background:white;border-radius:16px;display:flex;align-items:center;gap:14px;border:1px solid #E0D8EC;box-shadow:0 2px 8px rgba(0,0,0,0.04);"><span style="font-size:28px;">✓</span><div><strong style="font-family:Outfit,sans-serif;font-size:14px;color:#1A1420;">Every Answer Verified</strong><p style="font-size:13px;color:#6B6475;margin:0;line-height:1.5;">All worksheets checked by our AI verification system. No wrong answers — guaranteed.</p></div></div>`;

const emailCaptureBlock = `<div style="max-width:680px;margin:0 auto 48px;padding:36px 32px;background:linear-gradient(135deg,#F4F1FF 0%,#EDE8DF 100%);border-radius:24px;text-align:center;border:1px solid #E0D8EC;"><h3 style="font-family:Outfit,sans-serif;font-size:22px;font-weight:800;color:#1A1420;margin-bottom:8px;">Get 5 Free Worksheets Every Week</h3><p style="font-size:15px;color:#6B6475;margin-bottom:20px;line-height:1.6;">Join parents and teachers. Free worksheet pack every Friday — no spam, unsubscribe anytime.</p><p style="font-size:12px;color:#A89FAE;margin-top:14px;">✓ Answer-verified  •  ✓ Printable PDFs  •  ✓ 100% free</p></div>`;


// ── CONTENT DISPLAY — renders worksheet content as visible HTML for SEO ──
function renderContentBlock(ws) {
  if (!ws.content) return '';
  let parsed;
  try {
    parsed = typeof ws.content === 'string' ? JSON.parse(ws.content) : ws.content;
  } catch(e) { return ''; }

  const fmt = ws.format || 'worksheet';
  let html = '<div style="background:white;border-radius:20px;padding:28px 32px;margin-bottom:28px;border:1px solid #EDE8DF;box-shadow:0 2px 8px rgba(0,0,0,0.04);">';

  // Learning objective (worksheets)
  if (parsed.learning_objective) {
    html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Learning Objective</div>';
    html += '<p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:20px;">' + parsed.learning_objective + '</p>';
  }

  // Story intro (drills, vocab, reading)
  if (parsed.story_intro) {
    html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">About This Activity</div>';
    html += '<p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:20px;font-style:italic;">' + parsed.story_intro + '</p>';
  }

  // Teacher note (worksheets)
  if (parsed.teacher_note) {
    html += '<div style="background:#F4F1FF;border-radius:12px;padding:16px 20px;margin-bottom:20px;border-left:4px solid #6C5CE7;">';
    html += '<div style="font-size:12px;font-weight:700;color:#6C5CE7;margin-bottom:6px;font-family:Outfit,sans-serif;">Teacher Tip</div>';
    html += '<p style="font-size:14px;color:#4A4458;line-height:1.7;margin:0;">' + parsed.teacher_note + '</p>';
    html += '</div>';
  }

  // Questions preview (worksheets — show first 3)
  if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Sample Questions</div>';
    var shown = parsed.questions.slice(0, 3);
    shown.forEach(function(q, i) {
      var qText = q.question || q.text || q;
      if (typeof qText === 'string') {
        html += '<div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">';
        html += '<span style="background:#EDE8DF;color:#6B6475;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">' + (q.number || i+1) + '</span>';
        html += '<p style="font-size:14px;color:#3D3347;line-height:1.7;margin:0;">' + qText + '</p>';
        html += '</div>';
      }
    });
    if (parsed.questions.length > 3) {
      html += '<p style="font-size:13px;color:#A89FAE;margin-top:8px;">+ ' + (parsed.questions.length - 3) + ' more questions in the full worksheet</p>';
    }
  }

  // Reading passage (show first 300 chars)
  if (parsed.passage) {
    html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Reading Passage Preview</div>';
    var preview = parsed.passage.length > 300 ? parsed.passage.substring(0, 300) + '...' : parsed.passage;
    html += '<div style="background:#FFFAF0;border-radius:12px;padding:20px;border:1px solid #EDE8DF;margin-bottom:16px;">';
    html += '<p style="font-size:15px;color:#3D3347;line-height:1.9;margin:0;">' + preview + '</p>';
    html += '</div>';
    if (parsed.passage.length > 300) {
      html += '<p style="font-size:13px;color:#A89FAE;">Download the full worksheet to read the complete passage and answer comprehension questions.</p>';
    }
  }

  // Vocab pairs (show all — they are the content)
  if (parsed.pairs && Array.isArray(parsed.pairs) && parsed.pairs.length > 0) {
    html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Vocabulary Words</div>';
    parsed.pairs.forEach(function(p) {
      html += '<div style="display:flex;gap:12px;margin-bottom:10px;align-items:baseline;">';
      html += '<span style="font-weight:800;font-size:14px;color:#1A1420;font-family:Outfit,sans-serif;min-width:120px;">' + (p.word || '') + '</span>';
      html += '<span style="font-size:14px;color:#6B6475;line-height:1.6;">' + (p.definition || '') + '</span>';
      html += '</div>';
    });
  }

  // Student instructions
  if (parsed.student_instructions) {
    html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #EDE8DF;">';
    html += '<p style="font-size:13px;color:#6B6475;line-height:1.7;margin:0;"><strong style="color:#1A1420;">Instructions:</strong> ' + parsed.student_instructions + '</p>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function getCharSVG(subject) {
  if(subject==='math') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(108,92,231,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#6C5CE7"/><path d="M16 96 Q60 86 104 96 L108 124 Q60 134 12 124 Z" fill="#7C6CF7"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="60" cy="68" rx="38" ry="42" fill="#C8874A"/><ellipse cx="60" cy="32" rx="40" ry="22" fill="#1A0A00"/><circle cx="38" cy="36" r="14" fill="#1A0A00"/><circle cx="60" cy="28" r="16" fill="#1A0A00"/><circle cx="82" cy="36" r="14" fill="#1A0A00"/><path d="M26 42 Q20 62 24 82" fill="#1A0A00"/><path d="M94 42 Q100 62 96 82" fill="#1A0A00"/><path d="M80,30 Q90,20 96,28 Q90,26 88,32 Z" fill="#FF85A1"/><path d="M96,28 Q106,20 110,30 Q104,28 102,34 Z" fill="#FF6B8E"/><circle cx="96" cy="30" r="6" fill="#FF85A1"/><circle cx="48" cy="66" r="14" fill="white"/><circle cx="72" cy="66" r="14" fill="white"/><circle cx="49" cy="67" r="10" fill="#3D1F00"/><circle cx="73" cy="67" r="10" fill="#3D1F00"/><circle cx="53" cy="62" r="5" fill="white"/><circle cx="77" cy="62" r="5" fill="white"/><circle cx="49" cy="68" r="3.5" fill="#0A0500"/><circle cx="73" cy="68" r="3.5" fill="#0A0500"/><path d="M38 54 Q48 48 58 53" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M62 53 Q72 48 82 54" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><circle cx="66" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><path d="M46 88 Q60 100 74 88" stroke="#C05030" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="80" r="10" fill="#FF9999" opacity="0.2"/><circle cx="80" cy="80" r="10" fill="#FF9999" opacity="0.2"/></svg>';
  if(subject==='english'||subject==='reading'||subject==='vocab') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(8,145,178,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#0891B2"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="60" cy="68" rx="40" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="30" rx="38" ry="22" fill="#6B3A2A"/><ellipse cx="26" cy="52" rx="13" ry="20" fill="#6B3A2A"/><ellipse cx="94" cy="52" rx="13" ry="20" fill="#6B3A2A"/><circle cx="48" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><circle cx="72" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><path d="M63 66 Q62 64 61 66" stroke="#4A3728" stroke-width="3" fill="none"/><circle cx="48" cy="66" r="10" fill="white"/><circle cx="72" cy="66" r="10" fill="white"/><circle cx="49" cy="67" r="7" fill="#3A2010"/><circle cx="73" cy="67" r="7" fill="#3A2010"/><circle cx="52" cy="63" r="3.5" fill="white"/><circle cx="76" cy="63" r="3.5" fill="white"/><circle cx="49" cy="68" r="2.5" fill="#0A0500"/><circle cx="73" cy="68" r="2.5" fill="#0A0500"/><path d="M50 88 Q60 98 70 88" stroke="#C06050" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/><circle cx="84" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/></svg>';
  if(subject==='science') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(5,150,105,0.12)"/><rect x="18" y="70" width="84" height="54" rx="18" fill="#F8F8F8"/><rect x="30" y="76" width="60" height="28" rx="12" fill="#0D9488"/><ellipse cx="34" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="86" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="60" cy="66" rx="42" ry="46" fill="#7B3F0E"/><ellipse cx="60" cy="26" rx="42" ry="24" fill="#0A0500"/><circle cx="32" cy="28" r="22" fill="#0A0500"/><circle cx="88" cy="28" r="22" fill="#0A0500"/><ellipse cx="32" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="88" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="32" cy="49" rx="9" ry="4" fill="#FBBF24"/><ellipse cx="88" cy="49" rx="9" ry="4" fill="#FBBF24"/><rect x="20" y="54" width="14" height="52" rx="7" fill="#0A0500"/><rect x="86" y="54" width="14" height="52" rx="7" fill="#0A0500"/><circle cx="27" cy="95" r="6" fill="#F59E0B" stroke="#0A0500" stroke-width="1.5"/><circle cx="93" cy="95" r="6" fill="#10B981" stroke="#0A0500" stroke-width="1.5"/><circle cx="48" cy="64" r="16" fill="white"/><circle cx="72" cy="64" r="16" fill="white"/><circle cx="49" cy="65" r="11" fill="#1A0500"/><circle cx="73" cy="65" r="11" fill="#1A0500"/><circle cx="53" cy="60" r="5.5" fill="white"/><circle cx="77" cy="60" r="5.5" fill="white"/><circle cx="49" cy="66" r="4" fill="#050100"/><circle cx="73" cy="66" r="4" fill="#050100"/><ellipse cx="48" cy="78" rx="10" ry="8" fill="#C05030" opacity="0.9"/><ellipse cx="48" cy="78" rx="7" ry="5" fill="white" opacity="0.9"/><circle cx="36" cy="72" r="12" fill="#FF8C69" opacity="0.25"/><circle cx="84" cy="72" r="12" fill="#FF8C69" opacity="0.25"/></svg>';
  return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="108" rx="36" ry="8" fill="rgba(239,68,68,0.12)"/><rect x="22" y="74" width="80" height="60" rx="18" fill="#EF4444"/><ellipse cx="62" cy="70" rx="10" ry="9" fill="#FDBCB4"/><ellipse cx="60" cy="46" rx="42" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="10" rx="40" ry="22" fill="#3D1F00"/><path d="M22 18 Q46 2 96 6 Q108 12 112 24" fill="#3D1F00"/><rect x="22" y="10" width="76" height="13" rx="6.5" fill="#EF4444"/><circle cx="44" cy="44" r="14" fill="white"/><circle cx="76" cy="44" r="14" fill="white"/><circle cx="45" cy="45" r="9" fill="#3D1F00"/><circle cx="77" cy="45" r="9" fill="#3D1F00"/><circle cx="48" cy="41" r="4.5" fill="white"/><circle cx="80" cy="41" r="4.5" fill="white"/><circle cx="45" cy="46" r="3" fill="#0A0500"/><circle cx="77" cy="46" r="3" fill="#0A0500"/><path d="M40 66 Q60 84 80 66" stroke="#C06050" stroke-width="3" fill="#FF9999" stroke-linecap="round"/><path d="M44 68 Q60 78 76 68" fill="white"/><circle cx="28" cy="58" r="11" fill="#FF9999" opacity="0.25"/><circle cx="92" cy="58" r="11" fill="#FF9999" opacity="0.25"/></svg>';
}

async function generatePages() {
  console.log('Fetching worksheets from Supabase...');

  // Paginated fetch — Supabase limits to 1000 rows per request
  let worksheets = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    let q = supabase
      .from('worksheets')
      .select('id,slug,grade,subject,topic,theme,title,pdf_url,preview_image_url,pinterest_image_url,preview_p1_url,preview_p2_url,status,format,difficulty,ccss_standard,seo_description,target_keyword,content')
      .eq('status', 'published');
    if (FILTER.format) q = q.eq('format', FILTER.format);
    if (FILTER.subject) q = q.eq('subject', FILTER.subject);
    if (FILTER.grade) q = q.eq('grade', parseInt(FILTER.grade));
    q = q.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, error } = await q;
    if (error) { console.error('Supabase error:', error.message); process.exit(1); }
    worksheets = worksheets.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Found ${worksheets.length} worksheets`);

  // ── SHARED VARIABLES (available to all sections regardless of filter) ──
  const subjects = [...new Set(worksheets.map(w => w.subject.toLowerCase()))];
  const grades = [...new Set(worksheets.map(w => w.grade))].sort((a,b) => a-b);
  const allPublished = worksheets;
  const topicMap = {};

  if (shouldRun('worksheets')) { // ── 1. INDIVIDUAL WORKSHEET PAGES ──────────────────────────────────────────
  for (const ws of worksheets.filter(w => !w.format || w.format === 'worksheet')) {
    const dir = `/opt/examel/examel-pages/worksheets/${ws.slug}`;
    fs.mkdirSync(dir, { recursive: true });
    const color = subjectColor(ws.subject);
    const subjectColorLight = (function(s){const m={math:'#F5F3FF',english:'#FDF2F8',science:'#ECFDF5','drill-grid':'#FEF2F2',reading:'#E0F2FE',vocab:'#FFFBEB'};return m[s]||'#F4F1FF';})(ws.subject);
    const charSVG = (function(s){
      if(s==='math') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(108,92,231,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#6C5CE7"/><path d="M16 96 Q60 86 104 96 L108 124 Q60 134 12 124 Z" fill="#7C6CF7"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="60" cy="68" rx="38" ry="42" fill="#C8874A"/><ellipse cx="60" cy="32" rx="40" ry="22" fill="#1A0A00"/><circle cx="38" cy="36" r="14" fill="#1A0A00"/><circle cx="60" cy="28" r="16" fill="#1A0A00"/><circle cx="82" cy="36" r="14" fill="#1A0A00"/><path d="M26 42 Q20 62 24 82" fill="#1A0A00"/><path d="M94 42 Q100 62 96 82" fill="#1A0A00"/><path d="M80,30 Q90,20 96,28 Q90,26 88,32 Z" fill="#FF85A1"/><path d="M96,28 Q106,20 110,30 Q104,28 102,34 Z" fill="#FF6B8E"/><circle cx="96" cy="30" r="6" fill="#FF85A1"/><circle cx="48" cy="66" r="14" fill="white"/><circle cx="72" cy="66" r="14" fill="white"/><circle cx="49" cy="67" r="10" fill="#3D1F00"/><circle cx="73" cy="67" r="10" fill="#3D1F00"/><circle cx="53" cy="62" r="5" fill="white"/><circle cx="77" cy="62" r="5" fill="white"/><circle cx="49" cy="68" r="3.5" fill="#0A0500"/><circle cx="73" cy="68" r="3.5" fill="#0A0500"/><path d="M38 54 Q48 48 58 53" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M62 53 Q72 48 82 54" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><circle cx="66" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><path d="M46 88 Q60 100 74 88" stroke="#C05030" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="80" r="10" fill="#FF9999" opacity="0.2"/><circle cx="80" cy="80" r="10" fill="#FF9999" opacity="0.2"/></svg>';
      if(s==='english'||s==='reading'||s==='vocab') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(8,145,178,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#0891B2"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="60" cy="68" rx="40" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="30" rx="38" ry="22" fill="#6B3A2A"/><ellipse cx="26" cy="52" rx="13" ry="20" fill="#6B3A2A"/><ellipse cx="94" cy="52" rx="13" ry="20" fill="#6B3A2A"/><circle cx="48" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><circle cx="72" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><path d="M63 66 Q62 64 61 66" stroke="#4A3728" stroke-width="3" fill="none"/><circle cx="48" cy="66" r="10" fill="white"/><circle cx="72" cy="66" r="10" fill="white"/><circle cx="49" cy="67" r="7" fill="#3A2010"/><circle cx="73" cy="67" r="7" fill="#3A2010"/><circle cx="52" cy="63" r="3.5" fill="white"/><circle cx="76" cy="63" r="3.5" fill="white"/><circle cx="49" cy="68" r="2.5" fill="#0A0500"/><circle cx="73" cy="68" r="2.5" fill="#0A0500"/><path d="M50 88 Q60 98 70 88" stroke="#C06050" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/><circle cx="84" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/></svg>';
      if(s==='science') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(5,150,105,0.12)"/><rect x="18" y="70" width="84" height="54" rx="18" fill="#F8F8F8"/><rect x="30" y="76" width="60" height="28" rx="12" fill="#0D9488"/><ellipse cx="34" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="86" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="60" cy="66" rx="42" ry="46" fill="#7B3F0E"/><ellipse cx="60" cy="26" rx="42" ry="24" fill="#0A0500"/><circle cx="32" cy="28" r="22" fill="#0A0500"/><circle cx="88" cy="28" r="22" fill="#0A0500"/><ellipse cx="32" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="88" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="32" cy="49" rx="9" ry="4" fill="#FBBF24"/><ellipse cx="88" cy="49" rx="9" ry="4" fill="#FBBF24"/><rect x="20" y="54" width="14" height="52" rx="7" fill="#0A0500"/><rect x="86" y="54" width="14" height="52" rx="7" fill="#0A0500"/><circle cx="27" cy="95" r="6" fill="#F59E0B" stroke="#0A0500" stroke-width="1.5"/><circle cx="93" cy="95" r="6" fill="#10B981" stroke="#0A0500" stroke-width="1.5"/><circle cx="48" cy="64" r="16" fill="white"/><circle cx="72" cy="64" r="16" fill="white"/><circle cx="49" cy="65" r="11" fill="#1A0500"/><circle cx="73" cy="65" r="11" fill="#1A0500"/><circle cx="53" cy="60" r="5.5" fill="white"/><circle cx="77" cy="60" r="5.5" fill="white"/><circle cx="49" cy="66" r="4" fill="#050100"/><circle cx="73" cy="66" r="4" fill="#050100"/><ellipse cx="48" cy="78" rx="10" ry="8" fill="#C05030" opacity="0.9"/><ellipse cx="48" cy="78" rx="7" ry="5" fill="white" opacity="0.9"/><circle cx="36" cy="72" r="12" fill="#FF8C69" opacity="0.25"/><circle cx="84" cy="72" r="12" fill="#FF8C69" opacity="0.25"/></svg>';
      return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="108" rx="36" ry="8" fill="rgba(239,68,68,0.12)"/><rect x="22" y="74" width="80" height="60" rx="18" fill="#EF4444"/><ellipse cx="62" cy="70" rx="10" ry="9" fill="#FDBCB4"/><ellipse cx="60" cy="46" rx="42" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="10" rx="40" ry="22" fill="#3D1F00"/><path d="M22 18 Q46 2 96 6 Q108 12 112 24" fill="#3D1F00"/><rect x="22" y="10" width="76" height="13" rx="6.5" fill="#EF4444"/><circle cx="44" cy="44" r="14" fill="white"/><circle cx="76" cy="44" r="14" fill="white"/><circle cx="45" cy="45" r="9" fill="#3D1F00"/><circle cx="77" cy="45" r="9" fill="#3D1F00"/><circle cx="48" cy="41" r="4.5" fill="white"/><circle cx="80" cy="41" r="4.5" fill="white"/><circle cx="45" cy="46" r="3" fill="#0A0500"/><circle cx="77" cy="46" r="3" fill="#0A0500"/><path d="M40 66 Q60 84 80 66" stroke="#C06050" stroke-width="3" fill="#FF9999" stroke-linecap="round"/><path d="M44 68 Q60 78 76 68" fill="white"/><circle cx="28" cy="58" r="11" fill="#FF9999" opacity="0.25"/><circle cx="92" cy="58" r="11" fill="#FF9999" opacity="0.25"/></svg>';
    })(ws.subject);
    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
    const related = worksheets.filter(w => w.subject === ws.subject && w.grade === ws.grade && w.slug !== ws.slug && (!w.format || w.format === 'worksheet')).slice(0, 3);
    const sameTopicDiffTheme = worksheets.filter(w => w.topic === ws.topic && w.theme !== ws.theme && w.slug !== ws.slug).slice(0, 3);
    const sameThemeDiffSubject = worksheets.filter(w => w.theme === ws.theme && w.subject !== ws.subject && w.grade === ws.grade && w.slug !== ws.slug).slice(0, 3);

    // Session 3: Pedagogical linking engine
    const pedLinks = getPedagogicalLinks(ws, worksheets.filter(w => w.format !== "drill-grid" && w.format !== "word-search"));
    const pedLinksHtml = pedLinks.length > 0
      ? '<div class="related"><h3 class="related-title">Related Worksheets</h3><div style="display:flex;flex-direction:column;gap:8px;">'
        + pedLinks.map(l => '<a href="' + l.url + '" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8f6ff;border-radius:10px;text-decoration:none;color:#1C1526;font-size:14px;font-weight:500;"><span style="color:#6C5CE7;font-weight:700;font-size:12px;">&#8594;</span> ' + l.text + '</a>').join('')
        + '</div></div>'
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Grade ${ws.grade} ${formatTopic(ws.topic)} ${capitalize(ws.subject)} Worksheet — ${formatTheme(ws.theme)} | Examel</title>
  <meta name="description" content="${ws.seo_description || `Free ${ws.target_keyword || ws.subject + " worksheet for Grade " + ws.grade}. ${formatTopic(ws.topic)} practice with ${formatTheme(ws.theme)} theme. Printable PDF with answer key. No signup required.`}">
  <link rel="canonical" href="https://examel.com/worksheets/${ws.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${ws.title} | Free Printable Worksheet | Examel">
  <meta property="og:description" content="Free printable Grade ${ws.grade} ${capitalize(ws.subject)} worksheet about ${formatTopic(ws.topic)}. Answer key included. Download PDF free.">
  <meta property="og:image" content="${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}">
  <meta property="og:url" content="https://examel.com/worksheets/${ws.slug}/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"EducationalResource","name":"${ws.title}","description":"Free printable Grade ${ws.grade} ${ws.subject} worksheet about ${formatTopic(ws.topic)} — 8 questions with answer key","educationalLevel":"Grade ${ws.grade}","subject":"${capitalize(ws.subject)}","teaches":"${formatTopic(ws.topic)}","keywords":"Grade ${ws.grade} ${capitalize(ws.subject)} worksheet, ${formatTopic(ws.topic)} worksheet, free printable","url":"https://examel.com/worksheets/${ws.slug}/","isAccessibleForFree":true,"inLanguage":"en","typicalAgeRange":"5-14","thumbnailUrl":"${ws.preview_p1_url || `https://examel.com/thumbnails/${ws.slug}.png`}","author":{"@type":"Organization","name":"Examel Education Team","url":"https://examel.com"}${ws.ccss_standard ? `,"educationalAlignment":{"@type":"AlignmentObject","alignmentType":"teaches","educationalFramework":"Common Core State Standards","targetName":"${ws.ccss_standard}"}` : ""},"provider":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  ${sharedCSS}
  <style>
    :root{
      --subject:${color};
      --subject-light:${subjectColorLight};
    }
    /* ── WS PAGE ── */
    .ws-hero{background:#1C1526;color:white;padding:0 20px;text-align:center;position:relative;overflow:hidden;border-top:5px solid var(--subject);}
    .ws-hero-inner{max-width:860px;margin:0 auto;padding:52px 120px 48px 48px;position:relative;z-index:2;text-align:left;}
    .ws-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 0%,rgba(108,92,231,0.18) 0%,transparent 65%);pointer-events:none;}
    .ws-hero::after{content:'';position:absolute;top:-40px;right:-20px;width:220px;height:220px;background:radial-gradient(circle,var(--subject) 0%,transparent 70%);opacity:0.07;pointer-events:none;}
    .ws-hero-char{position:absolute;right:48px;bottom:-10px;opacity:0.92;pointer-events:none;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.2));}
    .ws-hero h1{font-size:clamp(22px,3.2vw,34px);margin-bottom:12px;line-height:1.22;font-weight:800;letter-spacing:-0.8px;}
    .ws-hero-sub{font-size:14px;opacity:0.55;margin-bottom:20px;font-weight:500;max-width:520px;}
    .ws-badges{display:flex;justify-content:flex-start;gap:8px;flex-wrap:wrap;}
    .ws-badge{background:var(--subject);border-radius:100px;padding:5px 16px;font-size:12px;font-weight:700;letter-spacing:0.3px;color:white;}
    /* ── CONTAINER ── */
    .ws-container{max-width:780px;margin:0 auto;padding:32px 20px 60px;}
    /* ── PREVIEW FIRST ── */
    .preview-desk{background:#FDF8EE;border-radius:24px;padding:36px 32px;margin-bottom:28px;border:1px solid #EDE8DF;}
    .preview-desk-title{font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A89FAE;text-align:center;margin-bottom:24px;}
    .preview-desk-images{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
    .preview-paper{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.1),0 2px 8px rgba(0,0,0,0.06);border:1px solid #EDE8DF;cursor:pointer;transition:transform 0.3s,box-shadow 0.3s;}
    .preview-paper:first-child{transform:rotate(-1deg);}
    .preview-paper:last-child{transform:rotate(1deg);}
    .preview-paper:hover{transform:rotate(0deg) translateY(-4px);box-shadow:0 16px 56px rgba(0,0,0,0.15);}
    .preview-paper img{width:100%;height:320px;object-fit:cover;object-position:top;display:block;}
    .preview-paper-label{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(28,21,38,0.85));color:white;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:20px 14px 12px;}
    .preview-paper-pin{position:absolute;top:10px;right:10px;background:#E60023;color:white;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;text-decoration:none;opacity:0;transition:opacity 0.2s;}
    .preview-paper:hover .preview-paper-pin{opacity:1;}
    .preview-note{font-size:11px;color:#B2BEC3;text-align:center;margin-top:16px;}
    /* ── DOWNLOAD BOX ── */
    .download-box{background:white;border-radius:24px;padding:32px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .download-box-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A89FAE;margin-bottom:8px;}
    .download-box-desc{color:#6B6475;margin-bottom:24px;line-height:1.75;font-size:15px;}
    .btn-download{background:#6C5CE7;color:white;padding:18px 32px;border-radius:14px;text-decoration:none;font-weight:800;font-size:16px;display:block;text-align:center;transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);letter-spacing:-0.3px;margin-bottom:16px;box-shadow:0 4px 20px rgba(108,92,231,0.35);position:relative;overflow:hidden;}
    .btn-download:hover{background:#5A4BD1;transform:translateY(-2px) scale(1.01);box-shadow:0 8px 32px rgba(108,92,231,0.5);}
    .btn-download:active{transform:scale(0.99);}
    .btn-download-sub{display:flex;gap:12px;justify-content:center;margin-bottom:20px;}
    .btn-sub{background:#F4F1FF;color:#6C5CE7;padding:11px 0;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;text-align:center;transition:all 0.2s;flex:1;max-width:160px;}
    .btn-sub:hover{background:#6C5CE7;color:white;}
    .share-divider{border:none;border-top:1px solid #F0EDE8;margin:18px 0;}
    .share-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}
    .share-label{font-size:11px;font-weight:700;color:#A89FAE;letter-spacing:1px;text-transform:uppercase;}
    .share-icons{display:flex;gap:8px;}
    .share-icon{width:36px;height:36px;border-radius:50%;border:1.5px solid #EDE8DF;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:15px;transition:all 0.2s;color:#6B6475;}
    .share-icon:hover{border-color:#6C5CE7;background:#F4F1FF;transform:scale(1.1);}
    .trust-strip{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;padding-top:14px;}
    .trust-item{font-size:12px;color:#059669;font-weight:700;display:flex;align-items:center;gap:5px;}
    .whisper{font-size:11px;color:#B2BEC3;text-align:center;margin-top:10px;font-style:italic;}
    /* ── INFO STRIP ── */
    .info-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}
    .info-chip{text-align:center;padding:16px 12px;}
    .info-chip .lbl{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A89FAE;display:block;margin-bottom:6px;}
    .info-chip .val{font-size:16px;font-weight:800;color:#1A1420;}
    /* ── INCLUDED ── */
    .included-box{background:var(--subject-light);border-radius:20px;padding:28px;margin-bottom:28px;border:1px solid rgba(108,92,231,0.08);}
    .included-title{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--subject);margin-bottom:16px;}
    .included-item{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;font-size:14px;color:#1A1420;font-weight:500;line-height:1.5;}
    .check{color:var(--subject);font-size:16px;font-weight:900;flex-shrink:0;margin-top:1px;}
    .ccss-badge{display:inline-block;background:#1C1526;color:white;font-size:11px;font-weight:700;padding:5px 14px;border-radius:8px;letter-spacing:0.5px;margin-top:10px;}
    /* ── RELATED ── */
    .related{margin-bottom:28px;}
    .related-title{font-size:20px;margin-bottom:16px;color:#1A1420;font-weight:800;letter-spacing:-0.5px;}
    .related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;}
    /* ── EMAIL ── */
    .email-section{background:#1C1526;border-radius:24px;padding:36px 32px;margin-bottom:28px;text-align:center;position:relative;overflow:hidden;}
    .email-section::before{content:'';position:absolute;top:-60px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,#6C5CE7 0%,transparent 70%);opacity:0.12;}
    .email-char{position:absolute;right:20px;bottom:0;opacity:0.85;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.2));}
    .email-section h3{color:white;font-size:20px;font-weight:800;margin-bottom:8px;letter-spacing:-0.5px;position:relative;z-index:2;}
    .email-section p{color:rgba(255,255,255,0.45);font-size:14px;margin-bottom:22px;position:relative;z-index:2;}
    .email-form{display:flex;gap:10px;flex-wrap:wrap;position:relative;z-index:2;}
    .email-input{flex:1;min-width:200px;padding:15px 18px;border-radius:12px;border:none;font-size:15px;font-family:inherit;outline:none;background:rgba(255,255,255,0.08);color:white;border:1px solid rgba(255,255,255,0.12);}
    .email-input::placeholder{color:rgba(255,255,255,0.3);}
    .email-input:focus{background:rgba(255,255,255,0.12);border-color:rgba(108,92,231,0.5);}
    .email-submit{background:#6C5CE7;color:white;border:none;padding:15px 24px;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.2s;box-shadow:0 4px 16px rgba(108,92,231,0.4);}
    .email-submit:hover{background:#5A4BD1;transform:translateY(-1px);}
    .email-note{font-size:11px;color:rgba(255,255,255,0.25);margin-top:12px;position:relative;z-index:2;}
    /* ── SEO ── */
    .seo-prose{padding:0 4px;margin-bottom:28px;line-height:1.85;font-size:14px;color:#6B6475;}
    .seo-prose h3{color:#1A1420;margin-bottom:14px;font-size:18px;font-weight:800;letter-spacing:-0.3px;}
    /* ── NAV LINKS ── */
    .nav-links{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px;font-size:13px;}
    .nav-links a{color:#6C5CE7;text-decoration:none;font-weight:600;}
    .nav-links a:hover{text-decoration:underline;}
    /* ── STICKY BAR ── */
    .sticky-bar{position:fixed;bottom:0;left:0;right:0;background:#1C1526;border-top:2px solid #6C5CE7;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:300;transform:translateY(100%);transition:transform 0.3s ease;box-shadow:0 -4px 24px rgba(0,0,0,0.25);}
    .sticky-bar.visible{transform:translateY(0);}
    .sticky-bar-title{color:rgba(255,255,255,0.8);font-size:13px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .sticky-bar-btn{background:#6C5CE7;color:white;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:800;font-size:13px;white-space:nowrap;flex-shrink:0;box-shadow:0 4px 12px rgba(108,92,231,0.4);}
    @keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(80px) rotate(360deg);opacity:0;}}
    .confetti-piece{position:absolute;width:8px;height:8px;border-radius:2px;pointer-events:none;animation:confetti-fall 0.8s ease-out forwards;}
    @media(max-width:640px){
      .preview-desk-images{grid-template-columns:1fr;}
      .preview-paper:first-child,.preview-paper:last-child{transform:none;}
      .btn-download-sub{flex-wrap:wrap;}
      .ws-hero-char{display:none;}
      .email-char{display:none;}
      .info-strip{grid-template-columns:repeat(3,1fr);}
      .share-row{flex-direction:column;align-items:flex-start;gap:12px;}
      .sticky-bar-title{display:none;}
    }
  </style>
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span class="sep">›</span>
    <a href="/free-${ws.subject.toLowerCase()}-worksheets/">Free ${capitalize(ws.subject)} Worksheets</a><span class="sep">›</span>
    <a href="/free-${ws.subject.toLowerCase()}-worksheets/grade-${ws.grade}/">Grade ${ws.grade}</a><span class="sep">›</span>
    <span>${ws.title}</span>
  </div>

  <div class="ws-hero">
    <div class="ws-hero-inner">
      <h1>${ws.title}</h1>
      <p class="ws-hero-sub">Free printable worksheet — download and print instantly</p>
      <div class="ws-badges">
        <span class="ws-badge">${capitalize(ws.subject)}</span>
        <span class="ws-badge">Grade ${ws.grade}</span>
        <span class="ws-badge">${formatTheme(ws.theme)} Theme</span>
      </div>
    </div>
    <div class="ws-hero-char">
      ${charSVG}
    </div>
  </div>

  <div class="ws-container">

    ${ws.preview_p1_url ? `
    <div class="preview-desk">
      <div class="preview-desk-title">What's inside this worksheet</div>
      <div class="preview-desk-images">
        <div class="preview-paper">
          <a href="${ws.preview_p1_url}" target="_blank">
            <img src="${ws.preview_p1_url}" alt="Grade ${ws.grade} ${capitalize(ws.subject)} worksheet preview — ${formatTopic(ws.topic)}" loading="lazy">
          </a>
          <div class="preview-paper-label">Questions</div>
          <a href="https://pinterest.com/pin/create/button/?url=https://examel.com/worksheets/${ws.slug}/&media=${encodeURIComponent(ws.pinterest_image_url||ws.preview_p1_url||'')}&description=${encodeURIComponent(ws.title+' — Free Grade '+ws.grade+' '+ws.subject+' worksheet. Download free at examel.com')}" target="_blank" class="preview-paper-pin">📌 Pin</a>
        </div>
        ${ws.preview_p2_url ? `
        <div class="preview-paper">
          <a href="${ws.preview_p2_url}" target="_blank">
            <img src="${ws.preview_p2_url}" alt="Answer key — Grade ${ws.grade} ${capitalize(ws.subject)} worksheet" loading="lazy">
          </a>
          <div class="preview-paper-label">Answer Key · Teacher Use</div>
          <a href="https://pinterest.com/pin/create/button/?url=https://examel.com/worksheets/${ws.slug}/&media=${encodeURIComponent(ws.pinterest_image_url||ws.preview_p1_url||'')}&description=${encodeURIComponent(ws.title+' — Free Grade '+ws.grade+' '+ws.subject+' worksheet. Download free at examel.com')}" target="_blank" class="preview-paper-pin">📌 Pin</a>
        </div>` : ''}
      </div>
      <p class="preview-note">Click any image to view full size · US Letter · Instant download</p>
    </div>
    ` : ''}

    <div class="download-box" id="downloadBox">
      <div class="download-box-label">Ready to print</div>
      <p class="download-box-desc">8 questions with a ${formatTheme(ws.theme)} theme plus a full answer key. Perfect for Grade ${ws.grade} ${capitalize(ws.subject)}.</p>
      <a href="${downloadUrl}" class="btn-download" id="dlBtn" download onclick="handleDownload(this)">⬇ Download Free Worksheet</a>
      <div class="btn-download-sub">
        <a href="${downloadUrl}" target="_blank" class="btn-sub">🖨 Print</a>
        <a href="${downloadUrl}" target="_blank" class="btn-sub">👁 Open PDF</a>
        <a href="#" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='✓ Copied!';setTimeout(()=>this.textContent='🔗 Copy Link',2000);return false;" class="btn-sub">🔗 Copy Link</a>
      </div>
      <hr class="share-divider">
      <div class="share-row">
        <span class="share-label">Share</span>
        <div class="share-icons">
          <a href="https://pinterest.com/pin/create/button/?url=https://examel.com/worksheets/${ws.slug}/&media=${encodeURIComponent(ws.pinterest_image_url||ws.preview_image_url||'')}&description=${encodeURIComponent(ws.title+' — Free Grade '+ws.grade+' '+ws.subject+' worksheet #freeworksheets #homeschool')}" target="_blank" class="share-icon" title="Pinterest">📌</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=https://examel.com/worksheets/${ws.slug}/" target="_blank" class="share-icon" title="Facebook">📘</a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Free Grade '+ws.grade+' '+ws.subject+' worksheet: '+ws.title)}&url=https://examel.com/worksheets/${ws.slug}/" target="_blank" class="share-icon" title="Twitter">🐦</a>
          <a href="mailto:?subject=${encodeURIComponent('Free worksheet: '+ws.title)}&body=${encodeURIComponent('Check out this free worksheet: https://examel.com/worksheets/'+ws.slug+'/')}" class="share-icon" title="Email">📧</a>
        </div>
      </div>
      <div class="trust-strip">
        <span class="trust-item">✓ Free forever</span>
        <span class="trust-item">✓ No login required</span>
        <span class="trust-item">✓ Instant PDF</span>
      </div>
      <p class="whisper">psst — 8 questions on this one. You've got this ⭐</p>
    </div>

    <div class="info-strip">
      <div class="info-chip"><span class="lbl">Subject</span><span class="val">${capitalize(ws.subject)}</span></div>
      <div class="info-chip"><span class="lbl">Grade</span><span class="val">Grade ${ws.grade}</span></div>
      <div class="info-chip"><span class="lbl">Topic</span><span class="val">${formatTopic(ws.topic)}</span></div>
    </div>

    <div style="text-align:center;margin:12px 0 0;font-size:13px;color:#8b7fa8;font-weight:500;">Created by Examel Education Team · Aligned to Common Core State Standards</div>

    <div class="included-box">
      <div class="included-title">What is included</div>
      <div class="included-item"><span class="check">✓</span> 8 curriculum-aligned questions</div>
      <div class="included-item"><span class="check">✓</span> Full answer key for parents and teachers</div>
      <div class="included-item"><span class="check">✓</span> ${formatTheme(ws.theme)} theme to keep kids engaged</div>
      <div class="included-item"><span class="check">✓</span> Print-ready PDF — US Letter size</div>
      <div class="included-item"><span class="check">✓</span> Name, date, and score fields included</div>
      ${ws.ccss_standard ? `<div style="margin-top:6px;"><span class="ccss-badge">CCSS: ${ws.ccss_standard}</span></div>` : ''}
    </div>

    <div style="background:white;border-radius:20px;padding:28px;margin-bottom:28px;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:16px;font-family:Outfit,sans-serif;">How to Use This Worksheet</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
        <div style="display:flex;align-items:flex-start;gap:12px;"><span style="background:#6C5CE7;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;">1</span><div><div style="font-weight:700;font-size:14px;color:#1A1420;margin-bottom:2px;">Print</div><div style="font-size:13px;color:#6B6475;line-height:1.5;">Download the PDF and print on US Letter paper.</div></div></div>
        <div style="display:flex;align-items:flex-start;gap:12px;"><span style="background:#6C5CE7;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;">2</span><div><div style="font-weight:700;font-size:14px;color:#1A1420;margin-bottom:2px;">Review</div><div style="font-size:13px;color:#6B6475;line-height:1.5;">Read through the questions with your child or student.</div></div></div>
        <div style="display:flex;align-items:flex-start;gap:12px;"><span style="background:#6C5CE7;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;">3</span><div><div style="font-weight:700;font-size:14px;color:#1A1420;margin-bottom:2px;">Complete</div><div style="font-size:13px;color:#6B6475;line-height:1.5;">Let them work independently. Use the answer key to check.</div></div></div>
        <div style="display:flex;align-items:flex-start;gap:12px;"><span style="background:#6C5CE7;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;">4</span><div><div style="font-weight:700;font-size:14px;color:#1A1420;margin-bottom:2px;">Extend</div><div style="font-size:13px;color:#6B6475;line-height:1.5;">Try a related worksheet to reinforce the skill.</div></div></div>
      </div>
    </div>

    ${renderContentBlock(ws)}

    ${pedLinksHtml}

    <div class="email-section">
      <div class="email-char">
        <svg width="100" height="128" viewBox="0 0 70 90" xmlns="http://www.w3.org/2000/svg" opacity="0.8">
          <ellipse cx="35" cy="62" rx="22" ry="6" fill="rgba(108,92,231,0.2)"/>
          <rect x="14" y="44" width="44" height="30" rx="10" fill="#6C5CE7"/>
          <ellipse cx="35" cy="38" rx="24" ry="26" fill="#C8874A"/>
          <ellipse cx="35" cy="16" rx="24" ry="14" fill="#1A0A00"/>
          <ellipse cx="18" cy="26" rx="10" ry="16" fill="#1A0A00"/>
          <ellipse cx="52" cy="26" rx="10" ry="16" fill="#1A0A00"/>
          <circle cx="26" cy="38" r="9" fill="white"/><circle cx="44" cy="38" r="9" fill="white"/>
          <circle cx="27" cy="39" r="6" fill="#3D1F00"/><circle cx="45" cy="39" r="6" fill="#3D1F00"/>
          <circle cx="29" cy="36" r="3" fill="white"/><circle cx="47" cy="36" r="3" fill="white"/>
          <path d="M28 48 Q35 56 42 48" stroke="#C05030" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <rect x="2" y="56" width="20" height="14" rx="3" fill="white" opacity="0.9"/>
          <line x1="4" y1="60" x2="20" y2="60" stroke="#DDD" stroke-width="1"/>
          <line x1="4" y1="64" x2="20" y2="64" stroke="#DDD" stroke-width="1"/>
          <line x1="4" y1="68" x2="14" y2="68" stroke="#DDD" stroke-width="1"/>
        </svg>
      </div>
      <h3>📬 Get Free Worksheets Every Week</h3>
      <p>New themed worksheets added daily. Free for parents and teachers.</p>
      <div class="klaviyo-form-X45k9d"></div>
      <script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/VruXqp/klaviyo.js?company_id=VruXqp"></script>
      <p class="email-note">No spam. Unsubscribe anytime.</p>
    </div>

    <div class="seo-prose">
      <h3>About this ${capitalize(ws.subject)} worksheet for Grade ${ws.grade}</h3>
      <p>This free printable ${capitalize(ws.subject)} worksheet is designed for Grade ${ws.grade} students and covers ${formatTopic(ws.topic)}. The ${formatTheme(ws.theme)} theme keeps kids engaged while they practice essential ${capitalize(ws.subject)} skills. Every worksheet includes a full answer key making it easy for parents and teachers to check work instantly. Aligned to Common Core State Standards (CCSS) for Grade ${ws.grade} ${capitalize(ws.subject)}. Print-ready at US Letter size. No login required — download and print in seconds.</p>
    </div>

    ${sameThemeDiffSubject.length > 0 ? `
    <div class="related">
      <h3 class="related-title">More ${formatTheme(ws.theme)} Theme Worksheets</h3>
      <div class="related-grid">${sameThemeDiffSubject.map(worksheetCard).join('')}</div>
    </div>` : ''}

    <div style="background:#1C1526;border-radius:20px;padding:28px 32px;margin-bottom:28px;color:white;">
      <div style="font-size:16px;font-weight:800;margin-bottom:10px;font-family:Outfit,sans-serif;">About Examel</div>
      <p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.8;margin:0;">Examel provides 10,000+ free printable worksheets for Grades 1–6, aligned to Common Core State Standards. Every worksheet is reviewed for accuracy and includes a full answer key. New worksheets added weekly across Math, English, and Science. Built by educators for parents, teachers, and homeschool families.</p>
    </div>

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
      var bar=document.getElementById('stickyBar');
      var box=document.getElementById('downloadBox');
      if(!bar||!box)return;
      var obs=new IntersectionObserver(function(e){bar.classList.toggle('visible',!e[0].isIntersecting);},{threshold:0});
      obs.observe(box);
    })();
    function handleDownload(btn){
      var orig=btn.innerHTML;
      btn.innerHTML='⏳ Preparing your worksheet...';
      btn.style.background='#5A4BD1';
      // confetti
      for(var i=0;i<12;i++){
        var c=document.createElement('div');
        c.className='confetti-piece';
        c.style.left=(30+Math.random()*40)+'%';
        c.style.top='0px';
        c.style.background=['#6C5CE7','#F9A825','#FF85A1','#10B981','#EF4444'][Math.floor(Math.random()*5)];
        c.style.animationDelay=(Math.random()*0.4)+'s';
        c.style.transform='rotate('+(Math.random()*360)+'deg)';
        btn.parentNode.appendChild(c);
        setTimeout(function(el){el.remove();},1200,c);
      }
      setTimeout(function(){
        btn.innerHTML='✓ Worksheet ready!';
        btn.style.background='#059669';
        setTimeout(function(){btn.innerHTML=orig;btn.style.background='';},3000);
      },1500);
    }
  </script>
  ${siteFooter}
</body>
</html>`;
    fs.writeFileSync(`${dir}/index.html`, html);

  }
  console.log(`✓ ${worksheets.length} individual pages generated`);
  } // end worksheets

  if (shouldRun('category')) { // ── 2. CATEGORY PAGES ──────────────────────────────────────────────────────
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
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Grade ${grade} ${capitalize(subject)} Worksheets | Examel">
  <meta property="og:description" content="Free printable Grade ${grade} ${capitalize(subject)} worksheets with fun themes. Download PDF instantly. Answer keys included.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-${subject}-worksheets/grade-${grade}/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/free-${subject}-worksheets/">Free ${capitalize(subject)} Worksheets</a><span>›</span>
    Grade ${grade}
  </div>
  <div style="background:#1C1526;border-top:5px solid ${subjectColor(subject)};padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Worksheets</div>
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Grade ${grade} <span style="color:${subjectColor(subject)}">${capitalize(subject)}</span> Worksheets</h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${filtered.length}+ free printable Grade ${grade} ${capitalize(subject)} worksheets. Fun themes, answer keys included. Download PDF instantly.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${subjectColor(subject)};font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${subjectColor(subject)};font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${subjectColor(subject)};font-weight:700;">✓</span> CCSS aligned</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG(subject)}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(108,92,231,0.15) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;font-family:'Outfit',sans-serif;">Grade:</span>
      ${grades.map(g => `<a href="/free-${subject}-worksheets/grade-${g}/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid ${g === grade ? subjectColor(subject) : '#EDE8DF'};background:${g === grade ? subjectColor(subject) : 'white'};color:${g === grade ? 'white' : '#6B6475'};font-family:'Outfit',sans-serif;">Grade ${g}</a>`).join('')}
    </div>
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
  } // end category

  if (shouldRun('subject-hub')) { // ── 3. SUBJECT HUB PAGES ─────────────────────────────────────────────────
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
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free ${capitalize(subject)} Worksheets for Kids","description":"Free printable ${capitalize(subject)} worksheets for Grades 1-6. Fun themes, answer keys included.","url":"https://examel.com/free-${subject}-worksheets/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free ${capitalize(subject)} Worksheets for Kids | Examel">
  <meta property="og:description" content="Free printable ${capitalize(subject)} worksheets for Grades 1-6. Fun themes, answer keys included. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-${subject}-worksheets/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    Free ${capitalize(subject)} Worksheets
  </div>
  <div style="background:#1C1526;border-top:5px solid ${subjectColor(subject)};padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Worksheets</div>
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:${subjectColor(subject)}">${capitalize(subject)}</span> Worksheets for Kids</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${filtered.length}+ free printable ${capitalize(subject)} worksheets for Grades 1–6. ${meta.desc} Fun themes, answer keys included. Instant PDF download.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${subjectColor(subject)};font-weight:700;">✓</span> Free forever</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${subjectColor(subject)};font-weight:700;">✓</span> Answer key included</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${subjectColor(subject)};font-weight:700;">✓</span> Common Core aligned</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${subjectColor(subject)};font-weight:700;">✓</span> No login needed</div>
      </div>
    </div>
    <div style="position:absolute;right:80px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG(subject)}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(108,92,231,0.15) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:16px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:#A89FAE;font-family:'Outfit',sans-serif;">Browse by grade:</span>
      ${grades.map(g => {
        const count = worksheets.filter(w => w.subject.toLowerCase() === subject && w.grade === g).length;
        if(count===0) return '';
        return `<a href="/free-${subject}-worksheets/grade-${g}/" style="font-size:13px;font-weight:700;color:#6B6475;text-decoration:none;padding:5px 14px;border-radius:100px;border:2px solid #EDE8DF;transition:all 0.2s;font-family:'Outfit',sans-serif;" onmouseover="this.style.background='${subjectColor(subject)}';this.style.color='white';this.style.borderColor='${subjectColor(subject)}'" onmouseout="this.style.background='';this.style.color='#6B6475';this.style.borderColor='#EDE8DF'">Grade ${g} <span style="opacity:0.5;">(${count})</span></a>`;
      }).join('')}
    </div>
  </div>
  ${answerBadge}
  <div style="max-width:680px;margin:24px auto;padding:0 20px;">
    <div style="background:white;border-radius:20px;padding:32px;border:1px solid #EDE8DF;">
      <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:12px;">About Our ${capitalize(subject)} Worksheets</h2>
      <p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:14px;">${SUBJECT_EDUCATION[subject]?.intro || ''}</p>
      <p style="font-size:14px;color:#6B6475;line-height:1.7;margin-bottom:14px;">${SUBJECT_EDUCATION[subject]?.skills || ''}</p>
      <p style="font-size:14px;color:#6B6475;line-height:1.7;">${SUBJECT_EDUCATION[subject]?.whyItMatters || ''}</p>
    </div>
  </div>
  ${emailCaptureBlock}
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${grades.map(g => {
      const count = worksheets.filter(w => w.subject.toLowerCase() === subject && w.grade === g).length;
      if (count === 0) return '';
      const subjectIcon = subject==='math' ? '📐' : subject==='english' ? '📖' : subject==='science' ? '🔬' : '📄';
      return `<a href="/free-${subject}-worksheets/grade-${g}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid ${subjectColor(subject)};display:block;transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <span style="font-size:36px;margin-bottom:12px;display:block;">${subjectIcon}</span>
        <div style="font-size:22px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">Grade ${g}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${count} free worksheets</div>
        <div style="font-size:14px;color:${subjectColor(subject)};font-weight:700;font-family:'Outfit',sans-serif;">Browse Grade ${g} →</div>
      </a>`;
    }).join('')}
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:48px 20px 20px;">
    <div style="font-size:11px;font-weight:700;color:#A89FAE;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-family:'Outfit',sans-serif;">Just added</div>
    <div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <h2 style="font-size:28px;font-weight:800;color:#1A1420;letter-spacing:-0.5px;font-family:'Outfit',sans-serif;">Latest ${capitalize(subject)} Worksheets</h2>
      <a href="/free-${subject}-worksheets/" style="font-size:14px;font-weight:700;color:#6C5CE7;text-decoration:none;font-family:'Outfit',sans-serif;">Browse all ${filtered.length}+ →</a>
    </div>
  </div>
  <div class="grid">
    ${recent.map(worksheetCard).join('')}
  </div>
  ${siteFooter}
</body>
</html>`;
    fs.writeFileSync(`${dir}/index.html`, html);
  }
  console.log(`✓ Subject hub pages generated`);
  } // end subject-hub

  if (shouldRun('grade-hub')) { // ── 4. GRADE HUB PAGES ───────────────────────────────────────────────────
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
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free Grade ${grade} Worksheets","description":"Free printable Grade ${grade} worksheets for Math, English and Science. Fun themes, answer keys included.","url":"https://examel.com/free-worksheets/grade-${grade}/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Grade ${grade} Worksheets | Math, English, Science | Examel">
  <meta property="og:description" content="Free printable Grade ${grade} worksheets for Math, English and Science. Fun themes, answer keys included. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-worksheets/grade-${grade}/">
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
  } // end grade-hub

  // ── WORD SEARCH PAGES
  const wordSearches = generateWordSearchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);

  // ── VOCAB MATCH PAGES
  const vocabMatchPages = generateVocabMatchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);

  // ── READING PASSAGE PAGES
  const readingPassagePages = generateReadingPassagePages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);

  // ── DRILL PAGES
  const drillPages = generateDrillPagesV2(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme, subjectColor, worksheetCard, getCharSVG);
  const allDrills = drillPages;


  // Generate individual drill pages (old generator — produces per-drill pages with schema, OG, badge, content)
  const individualDrillPages = generateDrillPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme);


  if (shouldRun('drill-hub')) { // ── DRILL HUB PAGES ──────────────────────────────────────────────────────
  const drillTopics = ['multiplication', 'division', 'addition', 'subtraction'];
  const drillIcons = { multiplication: '✖', division: '➗', addition: '➕', subtraction: '➖' };

  // Main hub: /free-math-drills/
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
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free Math Drills for Kids","description":"Free printable math drills for Grades 1-6. Multiplication, division, addition and subtraction drills with answer keys.","url":"https://examel.com/free-math-drills/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Math Drills for Kids | Grades 1-6 | Examel">
  <meta property="og:description" content="Free printable math drills for Grades 1-6. Multiplication, division, addition and subtraction drills with answer keys. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-math-drills/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free Math Drills</div>
  <div style="background:#1C1526;border-top:5px solid #DC2626;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Drills</div>
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:#DC2626;">Math Drills</span> for Kids</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${allDrills.length || 500}+ free printable math drills for Grades 1–6. Build fact fluency fast. Timed practice with answer keys included.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:#DC2626;font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:#DC2626;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:#DC2626;font-weight:700;">✓</span> CCSS aligned</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG('drill')}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(220,38,38,0.12) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
    ${drillTopics.map(t => `<a href="/free-${t}-drills/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid #DC2626;display:block;">
      <span style="font-size:36px;margin-bottom:12px;display:block;">${drillIcons[t]}</span>
      <div style="font-size:18px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">${t.charAt(0).toUpperCase()+t.slice(1)}</div>
      <div style="font-size:13px;color:#A89FAE;margin-bottom:12px;">Grades 1–6</div>
      <div style="font-size:13px;color:#DC2626;font-weight:700;font-family:'Outfit',sans-serif;">Browse Drills →</div>
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
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free ${topic.charAt(0).toUpperCase()+topic.slice(1)} Drills","description":"Free printable ${topic} drills for Grades 1-6. Build ${topic} fact fluency with timed practice. Answer keys included.","url":"https://examel.com/free-${topic}-drills/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free ${topic.charAt(0).toUpperCase()+topic.slice(1)} Drills | Grades 1-6 | Examel">
  <meta property="og:description" content="Free printable ${topic} drills for Grades 1-6. Build ${topic} fact fluency with timed practice sheets. Answer keys included.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-${topic}-drills/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span><a href="/free-math-drills/">Math Drills</a><span>›</span>${topic.charAt(0).toUpperCase()+topic.slice(1)} Drills</div>
  <div style="background:#1C1526;border-top:5px solid #DC2626;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Math Drills</div>
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free <span style="color:#DC2626;">${topic.charAt(0).toUpperCase()+topic.slice(1)} Drills</span></h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${topicDrills.length || 100}+ free printable ${topic} drills for Grades 1–6. Build fact fluency with timed practice. Answer keys included.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:#DC2626;font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:#DC2626;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:#DC2626;font-weight:700;">✓</span> CCSS aligned</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG('drill')}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(220,38,38,0.12) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;font-family:'Outfit',sans-serif;">Grade:</span>
      ${[1,2,3,4,5,6].map(g => {
        const count = topicDrills.filter(d => d.grade === g).length;
        return `<a href="/drills/math/grade-${g}/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;font-family:'Outfit',sans-serif;">${count||0} Grade ${g} drills</a>`;
      }).join('')}
    </div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${[1,2,3,4,5,6].map(g => {
      const count = topicDrills.filter(d => d.grade === g).length;
      return `<a href="/drills/math/grade-${g}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid #DC2626;display:block;">
        <span style="font-size:36px;margin-bottom:12px;display:block;">⚡</span>
        <div style="font-size:22px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">Grade ${g}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${count||0} ${topic} drills</div>
        <div style="font-size:14px;color:#DC2626;font-weight:700;font-family:'Outfit',sans-serif;">Browse Grade ${g} →</div>
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
  } // end drill-hub

  if (shouldRun('vocab-hub')) { // ── VOCAB MATCH HUB PAGES
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
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free ${capitalize(subj)} Vocabulary Worksheets","description":"Free printable ${subj} vocabulary match worksheets for Grades 1-6. Match words to definitions with answer keys.","url":"https://examel.com/free-${subj}-vocabulary/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free ${capitalize(subj)} Vocabulary Worksheets | Grades 1-6 | Examel">
  <meta property="og:description" content="Free printable ${subj} vocabulary match worksheets for Grades 1-6. Match words to definitions with answer keys. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-${subj}-vocabulary/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free ${capitalize(subj)} Vocabulary</div>
  <div style="background:#1C1526;border-top:5px solid ${subjColor};padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Vocabulary Worksheets</div>
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free <span style="color:${subjColor}">${capitalize(subj)} Vocabulary</span> Worksheets</h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${subjVocab.length || 200}+ free printable ${subj} vocabulary match worksheets for Grades 1–6. Match words to definitions. Answer keys included.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:${subjColor};font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:${subjColor};font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:${subjColor};font-weight:700;">✓</span> No login needed</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG(subj)}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(108,92,231,0.12) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 16px;">
    <div style="font-size:11px;font-weight:700;color:#A89FAE;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-family:'Outfit',sans-serif;">Just added</div>
    <div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
      <h2 style="font-size:24px;font-weight:800;color:#1A1420;letter-spacing:-0.5px;font-family:'Outfit',sans-serif;">Latest ${capitalize(subj)} Vocabulary</h2>
    </div>
  </div>
  <div class="grid" style="padding-top:0;">
    ${subjVocab.slice(0,12).map(ws => worksheetCard(ws)).join('')}
  </div>
  ${siteFooter}
</body></html>`;
    fs.writeFileSync(subjDir + '/index.html', subjHTML);
  }
  console.log('✓ Vocab match hub pages generated');
  } // end vocab-hub

  if (shouldRun('reading-hub')) { // ── READING PASSAGE HUB PAGES
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
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free Reading Comprehension Passages","description":"Free printable reading comprehension passages for Grades 1-6. Nonfiction passages with 6 comprehension questions and answer keys.","url":"https://examel.com/free-reading-passages/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Reading Comprehension Passages | Grades 1-6 | Examel">
  <meta property="og:description" content="Free printable reading comprehension passages for Grades 1-6. Nonfiction passages with 6 comprehension questions and answer keys. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-reading-passages/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free Reading Passages</div>
  <div style="background:#1C1526;border-top:5px solid #0891B2;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Reading Comprehension</div>
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:#0891B2;">Reading Comprehension</span> Passages</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${readingPassagePages.length || 200}+ free printable reading passages for Grades 1–6. Nonfiction passages with 6 comprehension questions and answer keys included.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#0891B2;font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#0891B2;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#0891B2;font-weight:700;">✓</span> CCSS aligned</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#0891B2;font-weight:700;">✓</span> No login needed</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG('english')}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(8,145,178,0.12) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${rpGrades.map(g => {
      const count = readingPassagePages.filter(p => p.grade === g).length;
      return `<a href="/free-reading-passages/grade-${g}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid #0891B2;display:block;">
        <span style="font-size:36px;margin-bottom:12px;display:block;">📖</span>
        <div style="font-size:22px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">Grade ${g}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${count||0} passages</div>
        <div style="font-size:14px;color:#0891B2;font-weight:700;font-family:'Outfit',sans-serif;">Browse Grade ${g} →</div>
      </a>`;
    }).join('')}
  </div>
  <div class="hub-grid" style="display:none;">
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
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free Grade ${g} Reading Comprehension Passages","description":"Free printable Grade ${g} reading comprehension passages. Nonfiction with 6 questions and answer keys.","url":"https://examel.com/free-reading-passages/grade-${g}/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Grade ${g} Reading Comprehension Passages | Examel">
  <meta property="og:description" content="Free printable Grade ${g} reading comprehension passages. Nonfiction with 6 questions and answer keys. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-reading-passages/grade-${g}/">
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
  } // end reading-hub

  if (shouldRun('free-ws-hub')) { // ── FREE-WORKSHEETS MASTER HUB ────────────────────────────────────────
  const fwDir = '/opt/examel/examel-pages/free-worksheets';
  fs.mkdirSync(fwDir, { recursive: true });
  const fwHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Printable Worksheets for Kids | All Grades | Examel</title>
  <meta name="description" content="Browse all ${allPublished.length}+ free printable worksheets for Grades 1-6. Math, English, Science and more. Common Core aligned. Answer keys included.">
  <link rel="canonical" href="https://examel.com/free-worksheets/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free Printable Worksheets for Kids","description":"Browse all free printable worksheets for Grades 1-6. Math, English, Science and more. Common Core aligned. Answer keys included.","url":"https://examel.com/free-worksheets/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Printable Worksheets for Kids | All Grades | Examel">
  <meta property="og:description" content="Browse all free printable worksheets for Grades 1-6. Math, English, Science and more. Common Core aligned. Answer keys included.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-worksheets/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span class="sep">›</span> All Free Worksheets</div>
  <div style="background:#1C1526;border-top:5px solid #6C5CE7;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Worksheets</div>
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">All Free <span style="color:#6C5CE7;">Worksheets</span> for Kids</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${allPublished.length}+ free printable worksheets for Grades 1–6. Math, English, Science and more. Common Core aligned. Answer keys included.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> CCSS aligned</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> No login needed</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG('math')}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(108,92,231,0.15) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;font-family:'Outfit',sans-serif;">Browse by subject:</span>
      <a href="/free-math-worksheets/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;background:#7C3AED;color:white;font-family:'Outfit',sans-serif;">Math</a>
      <a href="/free-english-worksheets/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;font-family:'Outfit',sans-serif;">English</a>
      <a href="/free-science-worksheets/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;font-family:'Outfit',sans-serif;">Science</a>
      <a href="/free-math-drills/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;font-family:'Outfit',sans-serif;">Drills</a>
      <a href="/free-reading-passages/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;font-family:'Outfit',sans-serif;">Reading</a>
    </div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${[1,2,3,4,5,6].map(g => {
      const count = allPublished.filter(w => w.grade === g).length;
      return `<a href="/free-worksheets/grade-${g}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid #6C5CE7;display:block;">
        <div style="font-size:32px;font-weight:900;color:#6C5CE7;margin-bottom:4px;font-family:'Outfit',sans-serif;">${g}</div>
        <div style="font-size:16px;font-weight:700;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">Grade ${g}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${count}+ worksheets</div>
        <div style="font-size:14px;color:#6C5CE7;font-weight:700;font-family:'Outfit',sans-serif;">Browse Grade ${g} →</div>
      </a>`;
    }).join('')}
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 16px;">
    <div style="font-size:11px;font-weight:700;color:#A89FAE;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-family:'Outfit',sans-serif;">Just added</div>
    <h2 style="font-size:24px;font-weight:800;color:#1A1420;letter-spacing:-0.5px;margin-bottom:20px;font-family:'Outfit',sans-serif;">Latest Worksheets</h2>
  </div>
  <div class="grid" style="padding-top:0;">
    ${allPublished.slice(0,12).map(ws => worksheetCard(ws)).join('')}
  </div>
  ${siteFooter}
</body></html>`;
  fs.writeFileSync(fwDir + '/index.html', fwHTML);
  console.log('✓ Free worksheets master hub generated');
  } // end free-ws-hub

  if (shouldRun('word-search-hub')) { // ── WORD SEARCHES HUB ───────────────────────────────────────────────────
  const wsHubDir = '/opt/examel/examel-pages/word-searches';
  fs.mkdirSync(wsHubDir, { recursive: true });
  const allWordSearches = wordSearches;
  const wsHubHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Word Search Worksheets for Kids | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable word search worksheets for Grades 1-6. Math, English and Science word searches with answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/word-searches/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free Word Search Worksheets for Kids","description":"Free printable word search worksheets for Grades 1-6. Math, English and Science word searches with answer keys.","url":"https://examel.com/word-searches/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Word Search Worksheets for Kids | Grades 1-6 | Examel">
  <meta property="og:description" content="Free printable word search worksheets for Grades 1-6. Math, English and Science word searches with answer keys. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/word-searches/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span class="sep">›</span> Free Word Searches</div>
  <div style="background:#1C1526;border-top:5px solid #D97706;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Word Searches</div>
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:#D97706;">Word Search</span> Worksheets</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${allWordSearches.length || 200}+ free printable word searches for Grades 1–6. Math, English and Science vocabulary. Answer keys included.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#D97706;font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#D97706;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#D97706;font-weight:700;">✓</span> No login needed</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG('science')}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(217,119,6,0.12) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${['math','english','science'].map(subj => {
      const count = allWordSearches.filter(w => w.subject === subj).length;
      const color = subj==='math'?'#7C3AED':subj==='english'?'#DB2777':'#059669';
      const icon = subj==='math'?'📐':subj==='english'?'📖':'🔬';
      return `<a href="/word-searches/${subj}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid ${color};display:block;">
        <span style="font-size:36px;margin-bottom:12px;display:block;">${icon}</span>
        <div style="font-size:20px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">${subj.charAt(0).toUpperCase()+subj.slice(1)}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${count||0} word searches</div>
        <div style="font-size:14px;color:${color};font-weight:700;font-family:'Outfit',sans-serif;">Browse →</div>
      </a>`;
    }).join('')}
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 16px;">
    <div style="font-size:11px;font-weight:700;color:#A89FAE;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-family:'Outfit',sans-serif;">Just added</div>
    <h2 style="font-size:24px;font-weight:800;color:#1A1420;letter-spacing:-0.5px;margin-bottom:20px;font-family:'Outfit',sans-serif;">Latest Word Searches</h2>
  </div>
  <div class="grid" style="padding-top:0;">
    ${allWordSearches.slice(0,12).map(ws => worksheetCard(ws)).join('')}
  </div>
  ${siteFooter}
</body></html>`;
  fs.writeFileSync(wsHubDir + '/index.html', wsHubHTML);
  console.log('✓ Word searches hub generated');
  } // end word-search-hub

  if (shouldRun('drills-grade-hub')) { // ── DRILLS GRADE HUB PAGES ──────────────────────────────────────────────
  for (const g of [1,2,3,4,5,6]) {
    const gradeDir = `/opt/examel/examel-pages/drills/math/grade-${g}`;
    fs.mkdirSync(gradeDir, { recursive: true });
    const gradeDrills = allDrills.filter(d => d.grade === g);
    const gradeHubHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Grade ${g} Math Drills | Examel</title>
  <meta name="description" content="Free printable Grade ${g} math drills. Addition, subtraction, multiplication and division practice with answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/drills/math/grade-${g}/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free Grade ${g} Math Drills","description":"Free printable Grade ${g} math drills. Addition, subtraction, multiplication and division practice with answer keys.","url":"https://examel.com/drills/math/grade-${g}/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Grade ${g} Math Drills | Examel">
  <meta property="og:description" content="Free printable Grade ${g} math drills. Addition, subtraction, multiplication and division practice with answer keys. Download PDF instantly.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/drills/math/grade-${g}/">
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span><a href="/free-math-drills/">Math Drills</a><span>›</span>Grade ${g}</div>
  <div style="background:#1C1526;border-top:5px solid #DC2626;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Math Drills</div>
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Grade ${g} <span style="color:#DC2626;">Math Drills</span></h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${gradeDrills.length}+ free Grade ${g} math drills. Build fact fluency with timed practice. Answer keys included.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#DC2626;font-weight:700;">✓</span> Free forever</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#DC2626;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#DC2626;font-weight:700;">✓</span> CCSS aligned</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${getCharSVG('drill')}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(220,38,38,0.12) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;font-family:'Outfit',sans-serif;">Grade:</span>
      ${[1,2,3,4,5,6].map(gr => `<a href="/drills/math/grade-${gr}/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid ${gr===g?'#DC2626':'#EDE8DF'};background:${gr===g?'#DC2626':'white'};color:${gr===g?'white':'#6B6475'};font-family:'Outfit',sans-serif;">Grade ${gr}</a>`).join('')}
    </div>
  </div>
  <div class="grid">
    ${gradeDrills.map(ws => worksheetCard(ws)).join('')}
  </div>
  ${siteFooter}
</body></html>`;
    fs.writeFileSync(gradeDir + '/index.html', gradeHubHTML);
  }
  console.log('✓ Drills grade hub pages generated');
  } // end drills-grade-hub


  if (shouldRun('topic-hub')) { // ── TOPIC HUB PAGES ──────────────────────────────────────────────────────
  for (const ws of worksheets) {
    const subj = (ws.subject || '').toLowerCase();
    const topic = (ws.topic || '').toLowerCase().replace(/ /g, '-');
    const key = subj + '|' + topic;
    if (!topicMap[key]) topicMap[key] = { subject: subj, topic, worksheets: [] };
    topicMap[key].worksheets.push(ws);
  }

  let topicHubCount = 0;
  for (const [key, data] of Object.entries(topicMap)) {
    if (data.worksheets.length < 3) continue;
    const subj = data.subject;
    const topic = data.topic;
    const topicDisplay = formatTopic(topic);
    const topicSlug = topic.replace(/ /g, '-');
    const eduKey = subj + '|' + topic.replace(/-/g, ' ');
    const edu = TOPIC_EDUCATION[eduKey] || { intro: 'Practice ' + topicDisplay.toLowerCase() + ' with our free printable worksheets for Grades 1-6. Each worksheet includes an answer key aligned to Common Core standards.', ccss: '', progression: '' };

    const byGrade = {};
    for (const ws of data.worksheets) {
      if (!byGrade[ws.grade]) byGrade[ws.grade] = [];
      byGrade[ws.grade].push(ws);
    }
    const gradesAvailable = Object.keys(byGrade).sort((a,b) => a-b);
    const totalCount = data.worksheets.length;

    const relatedTopics = Object.values(topicMap)
      .filter(t => t.subject === subj && t.topic !== topic && t.worksheets.length >= 3)
      .sort((a, b) => b.worksheets.length - a.worksheets.length)
      .slice(0, 6);

    const dir = '/opt/examel/examel-pages/free-' + subj + '-worksheets/' + topicSlug;
    fs.mkdirSync(dir, { recursive: true });

    const topicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${topicDisplay} Worksheets | Grades ${gradesAvailable[0]}-${gradesAvailable[gradesAvailable.length-1]} | Printable PDF | Examel</title>
  <meta name="description" content="Free printable ${topicDisplay.toLowerCase()} worksheets for Grades ${gradesAvailable[0]}-${gradesAvailable[gradesAvailable.length-1]}. ${totalCount}+ worksheets with answer keys. Download PDF instantly. Common Core aligned.">
  <link rel="canonical" href="https://examel.com/free-${subj}-worksheets/${topicSlug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free ${topicDisplay} Worksheets | Examel">
  <meta property="og:description" content="${totalCount}+ free printable ${topicDisplay.toLowerCase()} worksheets with answer keys.">
  <meta property="og:image" content="https://examel.com/og-default.png">
  <meta property="og:url" content="https://examel.com/free-${subj}-worksheets/${topicSlug}/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Free ${topicDisplay} Worksheets","description":"${totalCount}+ free ${topicDisplay.toLowerCase()} worksheets","url":"https://examel.com/free-${subj}-worksheets/${topicSlug}/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}</script>
  ${sharedCSS}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span class="sep">›</span><a href="/free-${subj}-worksheets/">Free ${capitalize(subj)} Worksheets</a><span class="sep">›</span>${topicDisplay}</div>
  <div class="hero"><h1>Free <span>${topicDisplay}</span> Worksheets</h1><p>${totalCount}+ free printable ${topicDisplay.toLowerCase()} worksheets for Grades ${gradesAvailable[0]}-${gradesAvailable[gradesAvailable.length-1]}. Answer keys included. Common Core aligned.</p></div>
  ${answerBadge}
  <div style="max-width:680px;margin:0 auto 40px;padding:0 20px;"><div style="background:white;border-radius:20px;padding:32px;border:1px solid #EDE8DF;">
    <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:12px;">About ${topicDisplay} Practice</h2>
    <p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:14px;">${edu.intro}</p>
    ${edu.ccss ? '<p style="font-size:14px;color:#6B6475;line-height:1.7;margin-bottom:14px;"><strong>Standards:</strong> ' + edu.ccss + '</p>' : ''}
    ${edu.progression ? '<p style="font-size:14px;color:#6B6475;line-height:1.7;"><strong>Skill progression:</strong> ' + edu.progression + '</p>' : ''}
  </div></div>
  ${emailCaptureBlock}
  <div style="max-width:1100px;margin:0 auto 32px;padding:0 20px;"><h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;text-align:center;">Browse by Grade</h2></div>
  <div class="hub-grid">${gradesAvailable.map(g => {
    const count = byGrade[g] ? byGrade[g].length : 0;
    return '<a href="/free-' + subj + '-worksheets/grade-' + g + '/" class="hub-card" style="border-top:3px solid ' + gradeColor(parseInt(g)) + '"><span class="hub-icon">📄</span><h3>Grade ' + g + '</h3><p>' + count + ' worksheets</p></a>';
  }).join('')}</div>
  <div style="max-width:1100px;margin:32px auto 0;padding:0 20px;"><h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;">Latest ${topicDisplay} Worksheets</h2></div>
  <div class="grid">${data.worksheets.slice(0, 12).map(worksheetCard).join('')}</div>
  ${relatedTopics.length > 0 ? '<div style="max-width:680px;margin:48px auto 0;padding:0 20px;"><h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;text-align:center;">Related ' + capitalize(subj) + ' Topics</h2><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">' + relatedTopics.map(rt => '<a href="/free-' + subj + '-worksheets/' + rt.topic.replace(/ /g, '-') + '/" style="padding:10px 20px;background:white;border:2px solid #EDE8DF;border-radius:100px;text-decoration:none;color:#1A1420;font-size:14px;font-weight:600;font-family:Outfit,sans-serif;">' + formatTopic(rt.topic) + ' (' + rt.worksheets.length + ')</a>').join('') + '</div></div>' : ''}
  <div style="max-width:680px;margin:40px auto;padding:0 20px;text-align:center;"><a href="/free-${subj}-worksheets/" style="color:#6C5CE7;text-decoration:none;font-weight:700;font-family:Outfit,sans-serif;font-size:15px;">← All ${capitalize(subj)} Worksheets</a></div>
  ${siteFooter}
</body></html>`;

    fs.writeFileSync(dir + '/index.html', topicHtml);
    topicHubCount++;
  }
  console.log('✓ ' + topicHubCount + ' topic hub pages generated');
  } // end topic-hub

  // Add topic hub URLs to sitemap array (will be picked up below)
  const topicHubUrls = Object.entries(topicMap)
    .filter(([k, d]) => d.worksheets.length >= 3)
    .map(([k, d]) => ({ url: '/free-' + d.subject + '-worksheets/' + d.topic.replace(/ /g, '-') + '/', priority: '0.85', freq: 'daily' }));


  // ── 5. SITEMAP (filesystem-based — only includes pages that actually exist) ──
  const baseUrl = 'https://examel.com';
  const sitemapUrls = [];
  
  // Scan filesystem for all index.html pages
  function scanPages(dir, depth) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name === '.git' || e.name === 'node_modules' || e.name === 'downloads' || e.name === 'thumbnails') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) scanPages(full, depth + 1);
        else if (e.name === 'index.html') {
          const rel = '/' + full.replace('/opt/examel/examel-pages/', '').replace('/index.html', '') + '/';
          // Assign priority based on page type
          let priority = '0.7';
          let freq = 'monthly';
          if (rel === '//') { priority = '1.0'; freq = 'daily'; } // homepage
          else if (rel.match(/^\/free-[^/]+-worksheets\/$/)) { priority = '0.9'; freq = 'daily'; } // subject hubs
          else if (rel.match(/^\/free-[^/]+-worksheets\/grade-/)) { priority = '0.85'; freq = 'daily'; } // grade pages
          else if (rel.match(/^\/free-[^/]+-worksheets\/[^/]+\/$/)) { priority = '0.85'; freq = 'daily'; } // topic hubs
          else if (rel.match(/^\/free-(math-drills|reading-passages|.*-vocabulary)/)) { priority = '0.9'; freq = 'daily'; } // format hubs
          else if (rel.match(/^\/free-worksheets/)) { priority = '0.85'; freq = 'daily'; } // master hub
          else if (rel.startsWith('/about/') || rel.startsWith('/terms/') || rel.startsWith('/privacy')) { priority = '0.3'; freq = 'monthly'; }
          else if (rel.startsWith('/worksheets/')) { priority = '0.7'; freq = 'monthly'; }
          else if (rel.startsWith('/drills/')) { priority = '0.7'; freq = 'monthly'; }
          else if (rel.startsWith('/vocab-match/')) { priority = '0.75'; freq = 'monthly'; }
          else if (rel.startsWith('/reading-passages/')) { priority = '0.8'; freq = 'monthly'; }
          else if (rel.startsWith('/word-searches/')) { priority = '0.7'; freq = 'monthly'; }
          
          const url = (rel === '//' || rel === '/index.html/') ? '/' : rel;
          sitemapUrls.push({ url, priority, freq });
        }
      }
    } catch(e) {}
  }
  scanPages('/opt/examel/examel-pages', 0);

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
