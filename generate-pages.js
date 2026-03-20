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
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,sans-serif;color:#2D3436;background:#F8F7FF;}
    .site-header{background:#6C5CE7;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;}
    .site-header a{color:white;text-decoration:none;font-weight:bold;font-size:1.1em;}
    .site-header nav a{margin-left:16px;font-size:13px;opacity:0.9;font-weight:600;}
    .site-logo{font-size:22px!important;font-weight:900!important;opacity:1!important;letter-spacing:-0.5px;}
    .breadcrumb{max-width:1100px;margin:16px auto;padding:0 20px;font-size:13px;color:#636E72;}
    .breadcrumb a{color:#6C5CE7;text-decoration:none;}
    .breadcrumb span{margin:0 6px;}
    .hero{padding:50px 20px;text-align:center;}
    .hero h1{font-size:clamp(24px,4vw,42px);margin-bottom:14px;color:#2D3436;}
    .hero h1 span{color:#6C5CE7;}
    .hero p{font-size:17px;color:#636E72;max-width:600px;margin:0 auto;}
    .filter-bar{max-width:1100px;margin:0 auto 30px;padding:0 20px;display:flex;gap:10px;flex-wrap:wrap;}
    .filter-btn{padding:8px 18px;border-radius:100px;text-decoration:none;font-size:14px;font-weight:bold;border:2px solid #DFE6E9;color:#636E72;background:white;transition:all 0.2s;}
    .filter-btn:hover,.filter-btn.active{background:#6C5CE7;color:white;border-color:#6C5CE7;}
    .grid{max-width:1100px;margin:0 auto;padding:0 20px 60px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
    .ws-card{background:white;border-radius:12px;padding:20px;text-decoration:none;color:#2D3436;display:block;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.06);}
    .ws-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.1);}
    .ws-card-badge{display:inline-block;color:white;padding:3px 10px;border-radius:100px;font-size:12px;font-weight:bold;margin-bottom:10px;}
    .ws-card h3{font-size:15px;margin-bottom:6px;line-height:1.4;}
    .ws-card p{font-size:13px;color:#636E72;margin-bottom:12px;}
    .ws-card-btn{font-size:13px;font-weight:bold;}
    .hub-grid{max-width:1100px;margin:0 auto;padding:0 20px 60px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
    .hub-card{background:white;border-radius:16px;padding:28px 20px;text-decoration:none;color:#2D3436;text-align:center;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.06);}
    .hub-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.1);}
    .hub-card .hub-icon{font-size:40px;margin-bottom:12px;display:block;}
    .hub-card h3{font-size:17px;margin-bottom:4px;}
    .hub-card p{font-size:13px;color:#636E72;}
    .site-footer{padding:40px 20px 20px;background:#2D3436;border-top:4px solid #6C5CE7;}
    .footer-grid{display:flex;gap:40px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;}
    .footer-col{display:flex;flex-direction:column;gap:8px;min-width:120px;}
    .footer-heading{font-size:11px;font-weight:800;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
    .site-footer a{color:#B2BEC3;text-decoration:none;font-size:13px;transition:color 0.2s;}
    .site-footer a:hover{color:#6C5CE7;}
    .footer-bottom{text-align:center;font-size:12px;color:#636E72;border-top:1px solid #444;padding-top:16px;}
    @media(max-width:600px){.hub-grid{grid-template-columns:repeat(2,1fr);}}
  </style>`;

const siteHeader = `
  <header class="site-header">
    <a href="https://examel.com" class="site-logo">Examel</a>
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
    <div class="footer-bottom">© 2026 Examel · Free K-8 Printable Worksheets · examel.com</div>
  </footer>`;

async function generatePages() {
  console.log('Fetching worksheets from Supabase...');

  const { data: worksheets, error } = await supabase
    .from('worksheets')
    .select('id,slug,grade,subject,topic,theme,title,pdf_url,preview_image_url,pinterest_image_url,status,format,difficulty,ccss_standard')
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
    .ws-hero{background:${color};color:white;padding:40px 20px;text-align:center;}
    .ws-hero h1{font-size:clamp(20px,3vw,32px);margin-bottom:10px;line-height:1.3;}
    .ws-hero p{font-size:15px;opacity:0.9;}
    .badges{display:flex;justify-content:center;gap:10px;margin-top:15px;flex-wrap:wrap;}
    .badge{background:rgba(255,255,255,0.2);border-radius:20px;padding:4px 14px;font-size:13px;font-weight:bold;}
    .ws-container{max-width:800px;margin:0 auto;padding:40px 20px;}
    .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:30px;}
    .info-card{background:white;border-radius:12px;padding:20px;text-align:center;}
    .info-card .label{font-size:11px;color:#B2BEC3;font-weight:bold;letter-spacing:0.5px;margin-bottom:5px;display:block;}
    .info-card .value{font-size:1em;font-weight:bold;}
    .download-box{background:white;border-radius:16px;padding:30px;text-align:center;margin-bottom:30px;border:2px solid ${color};}
    .download-box h2{color:${color};margin-bottom:10px;font-size:1.3em;}
    .download-box p{color:#636E72;margin-bottom:20px;line-height:1.6;font-size:15px;}
    .btn{background:${color};color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1em;display:inline-block;}
    .features{background:white;border-radius:12px;padding:24px;margin-bottom:30px;}
    .features h3{color:${color};margin-bottom:16px;}
    .feature-item{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:14px;color:#636E72;}
    .check{color:#00B894;font-weight:bold;}
    .seo-text{background:white;border-radius:12px;padding:24px;margin-bottom:30px;line-height:1.8;font-size:14px;color:#636E72;}
    .seo-text h3{color:#2D3436;margin-bottom:12px;font-size:16px;}
    .related h3{font-size:18px;margin-bottom:16px;color:#2D3436;}
    .nav-links{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;font-size:13px;}
    .nav-links a{color:${color};text-decoration:none;}
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
      <h2>Ready to Print</h2>
      <p>This worksheet includes 8 questions with a ${formatTheme(ws.theme)} theme plus a full answer key. Perfect for Grade ${ws.grade} ${capitalize(ws.subject)}. Print in seconds.</p>
      <a href="${downloadUrl}" class="btn" download>⬇ Download Free Worksheet</a>
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #f0f0f0;">
        <p style="font-size:14px;color:#636E72;margin-bottom:12px;">Get new free worksheets every week — no spam, unsubscribe anytime.</p>
        <div style="min-width:400px;width:100%;overflow:hidden;"><script async data-uid="9b92245d90" src="https://examel.kit.com/9b92245d90/index.js"></script></div>
      </div>
    </div>
    <div class="features">
      <h3>What is included</h3>
      <div class="feature-item"><span class="check">✓</span> 8 curriculum-aligned questions</div>
      <div class="feature-item"><span class="check">✓</span> Full answer key for parents and teachers</div>
      <div class="feature-item"><span class="check">✓</span> ${formatTheme(ws.theme)} theme to keep kids engaged</div>
      <div class="feature-item"><span class="check">✓</span> Print-ready PDF — Letter size</div>
      <div class="feature-item"><span class="check">✓</span> Name, date, and score fields included</div>
    </div>
    <div class="seo-text">
      <h3>About this ${capitalize(ws.subject)} worksheet for Grade ${ws.grade}</h3>
      <p>This free printable ${capitalize(ws.subject)} worksheet is designed for Grade ${ws.grade} students and covers ${formatTopic(ws.topic)}. The ${formatTheme(ws.theme)} theme keeps kids engaged while they practice essential ${capitalize(ws.subject)} skills. Every worksheet includes a full answer key on page 2, making it easy for parents and teachers to check work instantly.</p>
      <p>This worksheet is curriculum-aligned to Ontario, UK, and Australian Grade ${ws.grade} ${capitalize(ws.subject)} standards. It is print-ready at Letter size and includes fields for the student's name, date, and score.</p>
    </div>
    ${related.length > 0 ? `
    <div class="related">
      <h3>More Grade ${ws.grade} ${capitalize(ws.subject)} Worksheets</h3>
      <div class="grid" style="padding:0;margin:0 0 20px;">
        ${related.map(worksheetCard).join('')}
      </div>
    </div>` : ''}
    ${sameTopicDiffTheme.length > 0 ? `
    <div class="related">
      <h3>More ${formatTopic(ws.topic)} Worksheets</h3>
      <div class="grid" style="padding:0;margin:0 0 20px;">
        ${sameTopicDiffTheme.map(worksheetCard).join('')}
      </div>
    </div>` : ''}
    ${sameThemeDiffSubject.length > 0 ? `
    <div class="related">
      <h3>More ${formatTheme(ws.theme)} Theme Worksheets</h3>
      <div class="grid" style="padding:0;margin:0 0 20px;">
        ${sameThemeDiffSubject.map(worksheetCard).join('')}
      </div>
    </div>` : ''}
    <div class="nav-links">
      <a href="/free-${ws.subject.toLowerCase()}-worksheets/grade-${ws.grade}/">← All Grade ${ws.grade} ${capitalize(ws.subject)} Worksheets</a>
      <a href="/free-${ws.subject.toLowerCase()}-worksheets/">← All ${capitalize(ws.subject)} Worksheets</a>
      <a href="/free-worksheets/grade-${ws.grade}/">← All Grade ${ws.grade} Worksheets</a>
      <a href="https://examel.com">← Examel Home</a>
    </div>
  </div>
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
