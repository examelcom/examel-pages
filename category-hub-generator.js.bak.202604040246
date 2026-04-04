/**
 * CATEGORY HUB GENERATOR
 * Generates:
 *   - Category pages   → /free-{subject}-worksheets/grade-{N}/
 *   - Subject hub pages → /free-{subject}-worksheets/
 *   - Grade hub pages   → /free-worksheets/grade-{N}/
 * Usage: called from generate-pages.js orchestrator
 */

'use strict';
const fs = require('fs');
const {
  buildSchema, buildOG, buildCharSVG, buildAnswerBadge, buildEmailCapture, buildAnalytics, buildFAQSchema, getGradeFAQs, buildBreadcrumbSchema} = require('./examel-config');

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

function generateCategoryHubs(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const { gradeColor, capitalize, formatTopic, formatTheme, subjectColor, worksheetCard } = helpers;

  const wsOnly    = worksheets.filter(w => !w.format || w.format === 'worksheet' || (w.format && w.format.startsWith('game-')));
  const subjects  = [...new Set(wsOnly.map(w => w.subject.toLowerCase()))];
  const grades    = [...new Set(wsOnly.map(w => w.grade))].sort((a, b) => a - b);
  const allGrades = [...new Set(worksheets.map(w => w.grade))].sort((a, b) => a - b);

  const favicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">`;

  // ── 1. CATEGORY PAGES: /free-{subject}-worksheets/grade-{N}/ ──────────────
  let catCount = 0;
  for (const subject of subjects) {
    for (const grade of grades) {
      const filtered = wsOnly.filter(w => w.subject.toLowerCase() === subject && w.grade === grade);
      if (filtered.length === 0) continue;
      const color = subjectColor(subject);
      const dir   = `/opt/examel/examel-pages/free-${subject}-worksheets/grade-${grade}`;
      fs.mkdirSync(dir, { recursive: true });
      const canonicalUrl = `https://examel.com/free-${subject}-worksheets/grade-${grade}/`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Grade ${grade} ${capitalize(subject)} Worksheets | Printable PDF | Examel</title>
  <meta name="description" content="Free printable Grade ${grade} ${capitalize(subject)} worksheets. ${filtered.length}+ worksheets with fun themes. Download PDF instantly. Answer keys included. No signup required.">
  <link rel="canonical" href="${canonicalUrl}">
  ${buildOG({ title: `Free Grade ${grade} ${capitalize(subject)} Worksheets | Examel`, description: `Free printable Grade ${grade} ${capitalize(subject)} worksheets with fun themes. Download PDF instantly. Answer keys included.`, url: canonicalUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free Grade ${grade} ${capitalize(subject)} Worksheets`, description: `Free printable Grade ${grade} ${capitalize(subject)} worksheets. Fun themes, answer keys included.`, url: canonicalUrl })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/free-${subject}-worksheets/">Free ${capitalize(subject)} Worksheets</a><span>›</span>
    Grade ${grade}
  </div>
  <div style="background:#1C1526;border-top:5px solid ${color};padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Worksheets</div>
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Grade ${grade} <span style="color:${color}">${capitalize(subject)}</span> Worksheets</h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${filtered.length}+ printable Grade ${grade} ${capitalize(subject)} worksheets. Fun themes, answer keys included. Download PDF instantly.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${color};font-weight:700;">✓</span> Answer keys included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${color};font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${color};font-weight:700;">✓</span> CCSS aligned</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${buildCharSVG(subject)}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(108,92,231,0.15) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;font-family:'Outfit',sans-serif;">Grade:</span>
      ${grades.filter(g => wsOnly.some(w => w.subject.toLowerCase() === subject && w.grade === g)).map(g => `<a href="/free-${subject}-worksheets/grade-${g}/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid ${g === grade ? color : '#EDE8DF'};background:${g === grade ? color : 'white'};color:${g === grade ? 'white' : '#6B6475'};font-family:'Outfit',sans-serif;">Grade ${g}</a>`).join('')}
    </div>
  </div>
  <div class="grid">
    ${filtered.map(worksheetCard).join('')}
  </div>
  ${siteFooter}
</body>
</html>`;
      fs.writeFileSync(`${dir}/index.html`, html);
      catCount++;
    }
  }
  console.log(`✓ Category pages — ${catCount} pages generated`);

  // ── 2. SUBJECT HUB PAGES: /free-{subject}-worksheets/ ────────────────────
  const subjectMeta = {
    math:    { icon: '➕', desc: 'Addition, subtraction, multiplication, fractions, geometry and more.' },
    english: { icon: '📖', desc: 'Reading comprehension, vocabulary, grammar and writing.' },
    science: { icon: '🔬', desc: 'Solar system, ecosystems, plants, animals and more.' }
  };

  for (const subject of subjects) {
    const filtered = wsOnly.filter(w => w.subject.toLowerCase() === subject);
    const dir      = `/opt/examel/examel-pages/free-${subject}-worksheets`;
    fs.mkdirSync(dir, { recursive: true });
    const meta          = subjectMeta[subject] || { icon: '📝', desc: `Free ${subject} worksheets for K-8.` };
    const color         = subjectColor(subject);
    const recent        = filtered.slice(0, 12);
    const canonicalUrl  = `https://examel.com/free-${subject}-worksheets/`;
    const edu           = SUBJECT_EDUCATION[subject] || {};
    const subjectIcon   = subject === 'math' ? '📐' : subject === 'english' ? '📖' : subject === 'science' ? '🔬' : '📄';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${capitalize(subject)} Worksheets for Kids | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable ${capitalize(subject)} worksheets for Grades 1-6. ${filtered.length}+ worksheets with fun themes kids love. Download PDF instantly. Answer keys included.">
  <link rel="canonical" href="${canonicalUrl}">
  ${buildOG({ title: `Free ${capitalize(subject)} Worksheets for Kids | Examel`, description: `Free printable ${capitalize(subject)} worksheets for Grades 1-6. Fun themes, answer keys included. Download PDF instantly.`, url: canonicalUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free ${capitalize(subject)} Worksheets for Kids`, description: `Free printable ${capitalize(subject)} worksheets for Grades 1-6. Fun themes, answer keys included.`, url: canonicalUrl })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    Free ${capitalize(subject)} Worksheets
  </div>
  <div style="background:#1C1526;border-top:5px solid ${color};padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Worksheets</div>
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:${color}">${capitalize(subject)}</span> Worksheets for Kids</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${filtered.length}+ printable ${capitalize(subject)} worksheets for Grades 1–6. ${meta.desc} Fun themes, answer keys included. Instant PDF download.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${color};font-weight:700;">✓</span> Answer keys included</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${color};font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${color};font-weight:700;">✓</span> Common Core aligned</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;"><span style="color:${color};font-weight:700;">✓</span> No login needed</div>
      </div>
    </div>
    <div style="position:absolute;right:80px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${buildCharSVG(subject)}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(108,92,231,0.15) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:16px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:13px;font-weight:700;color:#A89FAE;font-family:'Outfit',sans-serif;">Browse by grade:</span>
      ${grades.map(g => {
        const count = wsOnly.filter(w => w.subject.toLowerCase() === subject && w.grade === g).length;
        if (count === 0) return '';
        return `<a href="/free-${subject}-worksheets/grade-${g}/" style="font-size:13px;font-weight:700;color:#6B6475;text-decoration:none;padding:5px 14px;border-radius:100px;border:2px solid #EDE8DF;font-family:'Outfit',sans-serif;">Grade ${g} <span style="opacity:0.5;">(${count})</span></a>`;
      }).join('')}
    </div>
  </div>
  ${buildAnswerBadge()}
  <div style="max-width:680px;margin:24px auto;padding:0 20px;">
    <div style="background:white;border-radius:20px;padding:32px;border:1px solid #EDE8DF;">
      <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:12px;">About Our ${capitalize(subject)} Worksheets</h2>
      <p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:14px;">${edu.intro || ''}</p>
      <p style="font-size:14px;color:#6B6475;line-height:1.7;margin-bottom:14px;">${edu.skills || ''}</p>
      <p style="font-size:14px;color:#6B6475;line-height:1.7;">${edu.whyItMatters || ''}</p>
    </div>
  </div>
  ${buildEmailCapture()}
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${grades.map(g => {
      const count = wsOnly.filter(w => w.subject.toLowerCase() === subject && w.grade === g).length;
      if (count === 0) return '';
      return `<a href="/free-${subject}-worksheets/grade-${g}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid ${color};display:block;">
        <span style="font-size:36px;margin-bottom:12px;display:block;">${subjectIcon}</span>
        <div style="font-size:22px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">Grade ${g}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${count} free worksheets</div>
        <div style="font-size:14px;color:${color};font-weight:700;font-family:'Outfit',sans-serif;">Browse Grade ${g} →</div>
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
  console.log(`✓ Subject hub pages — ${subjects.length} pages generated`);

  // ── 3. GRADE HUB PAGES: /free-worksheets/grade-{N}/ ─────────────────────
  const allSubjects = [...new Set(worksheets.map(w => w.subject.toLowerCase()))];
  fs.mkdirSync('/opt/examel/examel-pages/free-worksheets', { recursive: true });

  for (const grade of allGrades) {
    const filtered = worksheets.filter(w => w.grade === grade && (!w.format || w.format === 'worksheet' || (w.format && w.format.startsWith('game-'))));
    if (filtered.length === 0) continue;
    const color        = gradeColor(grade);
    const dir          = `/opt/examel/examel-pages/free-worksheets/grade-${grade}`;
    const canonicalUrl = `https://examel.com/free-worksheets/grade-${grade}/`;
    fs.mkdirSync(dir, { recursive: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Grade ${grade} Worksheets | Math, English, Science | Examel</title>
  <meta name="description" content="Free printable Grade ${grade} worksheets for Math, English and Science. ${filtered.length}+ worksheets with fun themes. Download PDF instantly. Answer keys included.">
  <link rel="canonical" href="${canonicalUrl}">
  ${buildOG({ title: `Free Grade ${grade} Worksheets | Math, English, Science | Examel`, description: `Free printable Grade ${grade} worksheets for Math, English and Science. Fun themes, answer keys included.`, url: canonicalUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free Grade ${grade} Worksheets`, description: `Free printable Grade ${grade} worksheets for Math, English and Science. Fun themes, answer keys included.`, url: canonicalUrl })}
  ${buildFAQSchema(getGradeFAQs(grade))}
  ${buildBreadcrumbSchema([{name:'Home',url:'https://examel.com'},{name:'Worksheets',url:'https://examel.com/free-worksheets/'},{name:'Grade '+grade,url:canonicalUrl}])}
  ${sharedCSS}
${buildAnalytics()}
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
    <p>${filtered.length}+ printable Grade ${grade} worksheets for Math, English and Science. Fun themes, answer keys included.</p>
  </div>
  <div class="hub-grid">
    ${allSubjects.map(s => {
      const count = worksheets.filter(w => w.subject.toLowerCase() === s && w.grade === grade && (!w.format || w.format === 'worksheet' || (w.format && w.format.startsWith('game-')))).length;
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
  <div style="max-width:780px;margin:0 auto;padding:32px 20px 48px;">
    <h2 style="font-family:Outfit,sans-serif;font-size:22px;font-weight:800;color:#1A1420;margin-bottom:20px;">Frequently Asked Questions</h2>
    ${getGradeFAQs(grade).map(f => `<div style="margin-bottom:20px;"><h3 style="font-family:Outfit,sans-serif;font-size:16px;font-weight:700;color:#1A1420;margin-bottom:8px;">${f.question}</h3><p style="font-size:14px;color:#6B6475;line-height:1.8;">${f.answer}</p></div>`).join('')}
  </div>
  ${siteFooter}
</body>
</html>`;
    fs.writeFileSync(`${dir}/index.html`, html);
  }
  console.log(`✓ Grade hub pages — ${allGrades.length} pages generated`);
}

module.exports = { generateCategoryHubs };
