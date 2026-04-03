/**
 * FORMAT HUB GENERATOR
 * Generates all format-specific hub pages:
 *   - /free-math-drills/ + /free-{topic}-drills/
 *   - /drills/math/grade-{N}/
 *   - /free-{subject}-vocabulary/
 *   - /free-reading-passages/ + /free-reading-passages/grade-{N}/
 *   - /word-searches/
 *   - /free-worksheets/ (master hub)
 * Usage: called from generate-pages.js orchestrator
 */

'use strict';
const fs = require('fs');
const { buildSchema, buildOG, buildCharSVG, buildAnalytics} = require('./examel-config');

const favicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E`;

function generateFormatHubs(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const { gradeColor, capitalize, formatTopic, formatTheme, subjectColor, worksheetCard } = helpers;

  const drillPages   = worksheets.filter(w => w.format === 'drill-grid');
  const vocabPages   = worksheets.filter(w => w.format === 'vocab-match');
  const readingPages = worksheets.filter(w => w.format === 'reading-passage');
  const wsPages      = worksheets.filter(w => w.format === 'word-search');
  const allPublished = worksheets;
  const GRADES       = [1, 2, 3, 4, 5, 6];

  // ── 1. DRILL MAIN HUB: /free-math-drills/ ────────────────────────────────
  const drillTopics = ['multiplication', 'division', 'addition', 'subtraction'];
  const drillIcons  = { multiplication: '✖', division: '➗', addition: '➕', subtraction: '➖' };

  fs.mkdirSync('/opt/examel/examel-pages/free-math-drills', { recursive: true });
  fs.writeFileSync('/opt/examel/examel-pages/free-math-drills/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Math Drills for Kids | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable math drills for Grades 1-6. Multiplication, division, addition and subtraction drills with answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/free-math-drills/">
  ${buildOG({ title: 'Free Math Drills for Kids | Grades 1-6 | Examel', description: 'Free printable math drills for Grades 1-6. Multiplication, division, addition and subtraction drills with answer keys.', url: 'https://examel.com/free-math-drills/' })}
  ${buildSchema({ type: 'CollectionPage', title: 'Free Math Drills for Kids', description: 'Free printable math drills for Grades 1-6. Multiplication, division, addition and subtraction drills with answer keys.', url: 'https://examel.com/free-math-drills/' })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free Math Drills</div>
  <div style="background:#1C1526;border-top:5px solid #DC2626;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Printable Drills</div>
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:#DC2626;">Math Drills</span> for Kids</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${drillPages.length || 500}+ printable math drills for Grades 1–6. Build fact fluency fast. Timed practice with answer keys included.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#DC2626;font-weight:700;">✓</span> Answer keys included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#DC2626;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#DC2626;font-weight:700;">✓</span> CCSS aligned</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${buildCharSVG('drill')}</div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(220,38,38,0.12) 0%,transparent 60%);pointer-events:none;"></div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
    ${drillTopics.map(t => `<a href="/free-${t}-drills/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid #DC2626;display:block;">
      <span style="font-size:36px;margin-bottom:12px;display:block;">${drillIcons[t]}</span>
      <div style="font-size:18px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">${capitalize(t)}</div>
      <div style="font-size:13px;color:#A89FAE;margin-bottom:12px;">Grades 1–6</div>
      <div style="font-size:13px;color:#DC2626;font-weight:700;font-family:'Outfit',sans-serif;">Browse Drills →</div>
    </a>`).join('')}
  </div>
  <div class="grid">${drillPages.slice(0, 12).map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);

  // ── 2. DRILL TOPIC HUBS: /free-{topic}-drills/ ───────────────────────────
  for (const topic of drillTopics) {
    const topicDir    = `/opt/examel/examel-pages/free-${topic}-drills`;
    const topicDrills = drillPages.filter(d => (d.topic || '').toLowerCase().includes(topic));
    const canonUrl    = `https://examel.com/free-${topic}-drills/`;
    fs.mkdirSync(topicDir, { recursive: true });
    fs.writeFileSync(`${topicDir}/index.html`, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${capitalize(topic)} Drills | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable ${topic} drills for Grades 1-6. Build ${topic} fact fluency with timed practice sheets. Answer keys included. Download PDF instantly.">
  <link rel="canonical" href="${canonUrl}">
  ${buildOG({ title: `Free ${capitalize(topic)} Drills | Grades 1-6 | Examel`, description: `Free printable ${topic} drills for Grades 1-6. Build ${topic} fact fluency with timed practice. Answer keys included.`, url: canonUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free ${capitalize(topic)} Drills`, description: `Free printable ${topic} drills for Grades 1-6. Answer keys included.`, url: canonUrl })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span><a href="/free-math-drills/">Math Drills</a><span>›</span>${capitalize(topic)} Drills</div>
  <div style="background:#1C1526;border-top:5px solid #DC2626;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free <span style="color:#DC2626;">${capitalize(topic)} Drills</span></h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${topicDrills.length || 100}+ free printable ${topic} drills for Grades 1–6. Build fact fluency with timed practice. Answer keys included.</p>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;">${buildCharSVG('drill')}</div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;">Grade:</span>
      ${GRADES.map(g => {
        const cnt = topicDrills.filter(d => d.grade === g).length;
        return `<a href="/drills/math/grade-${g}/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;">${cnt} Grade ${g}</a>`;
      }).join('')}
    </div>
  </div>
  <div class="grid">${topicDrills.slice(0, 12).map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);
  }

  // ── 3. DRILLS GRADE HUBS: /drills/math/grade-{N}/ ────────────────────────
  for (const g of GRADES) {
    const gradeDir    = `/opt/examel/examel-pages/drills/math/grade-${g}`;
    const gradeDrills = drillPages.filter(d => d.grade === g);
    const canonUrl    = `https://examel.com/drills/math/grade-${g}/`;
    fs.mkdirSync(gradeDir, { recursive: true });
    fs.writeFileSync(`${gradeDir}/index.html`, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Grade ${g} Math Drills | Examel</title>
  <meta name="description" content="Free printable Grade ${g} math drills. Addition, subtraction, multiplication and division practice with answer keys. Download PDF instantly.">
  <link rel="canonical" href="${canonUrl}">
  ${buildOG({ title: `Free Grade ${g} Math Drills | Examel`, description: `Free printable Grade ${g} math drills with answer keys. Download PDF instantly.`, url: canonUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free Grade ${g} Math Drills`, description: `Free printable Grade ${g} math drills with answer keys.`, url: canonUrl })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span><a href="/free-math-drills/">Math Drills</a><span>›</span>Grade ${g}</div>
  <div style="background:#1C1526;border-top:5px solid #DC2626;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free Grade ${g} <span style="color:#DC2626;">Math Drills</span></h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${gradeDrills.length}+ free Grade ${g} math drills. Build fact fluency with timed practice. Answer keys included.</p>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;">${buildCharSVG('drill')}</div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;">Grade:</span>
      ${GRADES.map(gr => `<a href="/drills/math/grade-${gr}/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid ${gr===g?'#DC2626':'#EDE8DF'};background:${gr===g?'#DC2626':'white'};color:${gr===g?'white':'#6B6475'};">Grade ${gr}</a>`).join('')}
    </div>
  </div>
  <div class="grid">${gradeDrills.map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);
  }
  console.log('✓ Drill hub pages generated');

  // ── 4. VOCAB HUBS: /free-{subject}-vocabulary/ ───────────────────────────
  for (const subj of ['math', 'english', 'science']) {
    const subjVocab = vocabPages.filter(v => v.subject === subj);
    const subjColor = subjectColor(subj);
    const canonUrl  = `https://examel.com/free-${subj}-vocabulary/`;
    const dir       = `/opt/examel/examel-pages/free-${subj}-vocabulary`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/index.html`, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${capitalize(subj)} Vocabulary Worksheets | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable ${subj} vocabulary match worksheets for Grades 1-6. Match words to definitions with answer keys. Download PDF instantly.">
  <link rel="canonical" href="${canonUrl}">
  ${buildOG({ title: `Free ${capitalize(subj)} Vocabulary Worksheets | Examel`, description: `Free printable ${subj} vocabulary match worksheets for Grades 1-6. Answer keys included.`, url: canonUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free ${capitalize(subj)} Vocabulary Worksheets`, description: `Free printable ${subj} vocabulary match worksheets for Grades 1-6. Answer keys included.`, url: canonUrl })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free ${capitalize(subj)} Vocabulary</div>
  <div style="background:#1C1526;border-top:5px solid ${subjColor};padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:48px 180px 44px 48px;position:relative;z-index:2;">
      <h1 style="font-size:clamp(24px,3.5vw,42px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:12px;font-family:'Outfit',sans-serif;">Free <span style="color:${subjColor}">${capitalize(subj)} Vocabulary</span> Worksheets</h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);max-width:500px;line-height:1.75;margin-bottom:20px;">${subjVocab.length || 200}+ free printable ${subj} vocabulary match worksheets for Grades 1–6. Match words to definitions. Answer keys included.</p>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;">${buildCharSVG(subj)}</div>
  </div>
  <div class="grid">${subjVocab.slice(0, 12).map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);
  }
  console.log('✓ Vocab hub pages generated');

  // ── 5. READING HUBS: /free-reading-passages/ + grade pages ───────────────
  fs.mkdirSync('/opt/examel/examel-pages/free-reading-passages', { recursive: true });
  fs.writeFileSync('/opt/examel/examel-pages/free-reading-passages/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Reading Comprehension Passages | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable reading comprehension passages for Grades 1-6. Nonfiction passages with 6 comprehension questions and answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/free-reading-passages/">
  ${buildOG({ title: 'Free Reading Comprehension Passages | Grades 1-6 | Examel', description: 'Free printable reading comprehension passages for Grades 1-6. Nonfiction passages with 6 comprehension questions and answer keys.', url: 'https://examel.com/free-reading-passages/' })}
  ${buildSchema({ type: 'CollectionPage', title: 'Free Reading Comprehension Passages', description: 'Free printable reading comprehension passages for Grades 1-6. Nonfiction passages with comprehension questions and answer keys.', url: 'https://examel.com/free-reading-passages/' })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span> Free Reading Passages</div>
  <div style="background:#1C1526;border-top:5px solid #0891B2;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:#0891B2;">Reading Comprehension</span> Passages</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${readingPages.length || 200}+ free printable reading passages for Grades 1–6. Nonfiction passages with 6 comprehension questions and answer keys included.</p>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;">${buildCharSVG('english')}</div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${GRADES.map(g => {
      const cnt = readingPages.filter(p => p.grade === g).length;
      return `<a href="/free-reading-passages/grade-${g}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid #0891B2;display:block;">
        <span style="font-size:36px;margin-bottom:12px;display:block;">📖</span>
        <div style="font-size:22px;font-weight:800;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">Grade ${g}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${cnt || 0} passages</div>
        <div style="font-size:14px;color:#0891B2;font-weight:700;">Browse Grade ${g} →</div>
      </a>`;
    }).join('')}
  </div>
  <div class="grid">${readingPages.slice(0, 12).map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);

  for (const g of GRADES) {
    const gradeDir   = `/opt/examel/examel-pages/free-reading-passages/grade-${g}`;
    const gradePasses = readingPages.filter(p => p.grade === g);
    const canonUrl   = `https://examel.com/free-reading-passages/grade-${g}/`;
    fs.mkdirSync(gradeDir, { recursive: true });
    fs.writeFileSync(`${gradeDir}/index.html`, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Grade ${g} Reading Comprehension Passages | Examel</title>
  <meta name="description" content="Free printable Grade ${g} reading comprehension passages. Nonfiction with 6 questions and answer keys. Download PDF instantly.">
  <link rel="canonical" href="${canonUrl}">
  ${buildOG({ title: `Free Grade ${g} Reading Comprehension Passages | Examel`, description: `Free printable Grade ${g} reading comprehension passages. Nonfiction with 6 questions and answer keys.`, url: canonUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free Grade ${g} Reading Comprehension Passages`, description: `Free printable Grade ${g} reading comprehension passages with answer keys.`, url: canonUrl })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span>›</span><a href="/free-reading-passages/">Reading Passages</a><span>›</span>Grade ${g}</div>
  <div class="hero">
    <h1>Free Grade ${g} <span>Reading Passages</span></h1>
    <p>${gradePasses.length || 30}+ free printable Grade ${g} nonfiction reading passages with comprehension questions and answer keys.</p>
  </div>
  <div class="grid">${gradePasses.slice(0, 12).map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);
  }
  console.log('✓ Reading hub pages generated');

  // ── 6. WORD SEARCH HUB: /word-searches/ ──────────────────────────────────
  fs.mkdirSync('/opt/examel/examel-pages/word-searches', { recursive: true });
  fs.writeFileSync('/opt/examel/examel-pages/word-searches/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Word Search Worksheets for Kids | Grades 1-6 | Examel</title>
  <meta name="description" content="Free printable word search worksheets for Grades 1-6. Math, English and Science word searches with answer keys. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/word-searches/">
  ${buildOG({ title: 'Free Word Search Worksheets for Kids | Grades 1-6 | Examel', description: 'Free printable word search worksheets for Grades 1-6. Math, English and Science word searches with answer keys.', url: 'https://examel.com/word-searches/' })}
  ${buildSchema({ type: 'CollectionPage', title: 'Free Word Search Worksheets for Kids', description: 'Free printable word search worksheets for Grades 1-6. Math, English and Science word searches with answer keys.', url: 'https://examel.com/word-searches/' })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span class="sep">›</span> Free Word Searches</div>
  <div style="background:#1C1526;border-top:5px solid #D97706;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">Free <span style="color:#D97706;">Word Search</span> Worksheets</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${wsPages.length || 200}+ free printable word searches for Grades 1–6. Math, English and Science vocabulary. Answer keys included.</p>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;">${buildCharSVG('science')}</div>
  </div>
  </div>
  <div class="grid">${wsPages.slice(0, 12).map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);
  console.log('✓ Word search hub generated');

  // ── 7. FREE-WORKSHEETS MASTER HUB: /free-worksheets/ ─────────────────────
  fs.mkdirSync('/opt/examel/examel-pages/free-worksheets', { recursive: true });
  fs.writeFileSync('/opt/examel/examel-pages/free-worksheets/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">${favicon}
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Printable Worksheets for Kids | All Grades | Examel</title>
  <meta name="description" content="Browse all ${allPublished.length}+ free printable worksheets for Grades 1-6. Math, English, Science and more. Common Core aligned. Answer keys included.">
  <link rel="canonical" href="https://examel.com/free-worksheets/">
  ${buildOG({ title: 'Free Printable Worksheets for Kids | All Grades | Examel', description: `Browse all ${allPublished.length}+ free printable worksheets for Grades 1-6. Common Core aligned. Answer keys included.`, url: 'https://examel.com/free-worksheets/' })}
  ${buildSchema({ type: 'CollectionPage', title: 'Free Printable Worksheets for Kids', description: `Browse all free printable worksheets for Grades 1-6. Math, English, Science and more. Common Core aligned. Answer keys included.`, url: 'https://examel.com/free-worksheets/' })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb"><a href="https://examel.com">Home</a><span class="sep">›</span> All Free Worksheets</div>
  <div style="background:#1C1526;border-top:5px solid #6C5CE7;padding:0 20px;position:relative;overflow:hidden;">
    <div style="max-width:1100px;margin:0 auto;padding:52px 180px 48px 48px;position:relative;z-index:2;">
      <h1 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:white;letter-spacing:-1.5px;line-height:1.1;margin-bottom:14px;font-family:'Outfit',sans-serif;">All Free <span style="color:#6C5CE7;">Worksheets</span> for Kids</h1>
      <p style="font-size:16px;color:rgba(255,255,255,0.5);max-width:520px;line-height:1.75;margin-bottom:24px;">${allPublished.length}+ free printable worksheets for Grades 1–6. Math, English, Science and more. Common Core aligned. Answer keys included.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> Answer keys included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> Answer key included</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> CCSS aligned</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);"><span style="color:#6C5CE7;font-weight:700;">✓</span> No login needed</div>
      </div>
    </div>
    <div style="position:absolute;right:60px;bottom:-10px;opacity:0.92;">${buildCharSVG('math')}</div>
  </div>
  <div style="background:white;border-bottom:1px solid #EDE8DF;padding:14px 24px;">
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:14px;font-weight:700;color:#A89FAE;">Browse by subject:</span>
      <a href="/free-math-worksheets/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;background:#7C3AED;color:white;">Math</a>
      <a href="/free-english-worksheets/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;">English</a>
      <a href="/free-science-worksheets/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;">Science</a>
      <a href="/free-math-drills/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;">Drills</a>
      <a href="/free-reading-passages/" style="font-size:14px;font-weight:700;text-decoration:none;padding:6px 16px;border-radius:100px;border:2px solid #EDE8DF;color:#6B6475;">Reading</a>
    </div>
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${GRADES.map(g => {
      const cnt = allPublished.filter(w => w.grade === g).length;
      return `<a href="/free-worksheets/grade-${g}/" style="background:white;border-radius:20px;padding:28px 20px;text-decoration:none;color:#1A1420;text-align:center;border:1px solid #EDE8DF;border-top:4px solid #6C5CE7;display:block;">
        <div style="font-size:32px;font-weight:900;color:#6C5CE7;margin-bottom:4px;font-family:'Outfit',sans-serif;">${g}</div>
        <div style="font-size:16px;font-weight:700;color:#1A1420;margin-bottom:4px;font-family:'Outfit',sans-serif;">Grade ${g}</div>
        <div style="font-size:14px;color:#A89FAE;margin-bottom:14px;">${cnt}+ worksheets</div>
        <div style="font-size:14px;color:#6C5CE7;font-weight:700;">Browse Grade ${g} →</div>
      </a>`;
    }).join('')}
  </div>
  <div style="max-width:1100px;margin:0 auto;padding:32px 20px 16px;">
    <h2 style="font-size:24px;font-weight:800;color:#1A1420;letter-spacing:-0.5px;margin-bottom:20px;font-family:'Outfit',sans-serif;">Latest Worksheets</h2>
  </div>
  <div class="grid" style="padding-top:0;">${allPublished.slice(0, 12).map(worksheetCard).join('')}</div>
  ${siteFooter}
</body></html>`);
  console.log('✓ Free worksheets master hub generated');
}

module.exports = { generateFormatHubs };
