/**
 * ELA DATAMUSE WORKSHEET PAGE GENERATOR
 * Generates individual HTML pages for ela-rhyming, ela-synonym, ela-antonym worksheets
 * → /worksheets/ela-rhyming-grade2-happy-animals/
 *
 * Called from generate-pages.js:
 *   const { generateElaPages } = require('./ela-worksheet-generator.js');
 *   generateElaPages(worksheets, sharedCSS, siteHeader, siteFooter, helpers);
 *
 * Architecture: standalone generator, matches existing generator pattern exactly.
 * Never modifies worksheet-generator.js or any existing file.
 */

'use strict';

const fs = require('fs');
const {
  getDirPath, getPageUrl, getGradeHubUrl, getSubjectHubUrl,
  buildSchema, buildOG, buildCharSVG, buildAnalytics, buildSynonymBlock } = require('./examel-config');

const ELA_FORMATS = ['ela-rhyming', 'ela-synonym', 'ela-antonym'];

const FORMAT_LABELS = {
  'ela-rhyming': 'Rhyming Words',
  'ela-synonym': 'Synonyms',
  'ela-antonym': 'Antonyms',
};

const FORMAT_DESCRIPTIONS = {
  'ela-rhyming': 'Practice identifying rhyming words with this fun printable worksheet.',
  'ela-synonym': 'Practice matching synonyms — words with similar meanings — in this printable worksheet.',
  'ela-antonym': 'Practice matching antonyms — words with opposite meanings — in this printable worksheet.',
};

const FORMAT_CCSS = {
  'ela-rhyming': 'CCSS.ELA-LITERACY.RF.K.2A',
  'ela-synonym': 'CCSS.ELA-LITERACY.L.3.5C',
  'ela-antonym': 'CCSS.ELA-LITERACY.L.3.5B',
};

function subjectColorLight() {
  return '#FDF2F8'; // ELA pink-light
}

function generateElaPages(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const { gradeColor, capitalize, formatTopic, formatTheme, subjectColor, worksheetCard, getPedagogicalLinks } = helpers;

  const elaWs = worksheets.filter(w => ELA_FORMATS.includes(w.format));

  if (elaWs.length === 0) {
    console.log('[ela-generator] No ELA Datamuse worksheets found — skipping');
    return;
  }

  console.log(`[ela-generator] Generating ${elaWs.length} ELA pages...`);
  let count = 0;

  for (const ws of elaWs) {
    try {
      const dir = getDirPath(ws);
      fs.mkdirSync(dir, { recursive: true });

      const color = subjectColor('english');
      const colorLight = subjectColorLight();
      const charSVG = buildCharSVG('english');
      const formatLabel = FORMAT_LABELS[ws.format] || 'ELA';
      const formatDesc = FORMAT_DESCRIPTIONS[ws.format] || '';
      const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
      const canonicalUrl = 'https://examel.com' + getPageUrl(ws);
      const subjectHubUrl = getSubjectHubUrl('english');
      const gradeHubUrl = getGradeHubUrl('english', ws.grade);
      const topicWord = ws.topic || '';

      // Related worksheets — same word, different format
      const sameWordDiffFormat = worksheets.filter(w =>
        w.topic === ws.topic &&
        w.format !== ws.format &&
        ELA_FORMATS.includes(w.format) &&
        w.slug !== ws.slug
      ).slice(0, 3);

      // Pedagogical links
      const pedLinks = getPedagogicalLinks(ws, worksheets.filter(w =>
        w.format !== 'drill-grid' && w.format !== 'word-search'
      ));
      const pedLinksHtml = pedLinks.length > 0
        ? '<div class="related"><h3 class="related-title">Related Worksheets</h3><div style="display:flex;flex-direction:column;gap:8px;">'
          + pedLinks.map(l => `<a href="${l.url}" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8f6ff;border-radius:10px;text-decoration:none;color:#1C1526;font-size:14px;font-weight:500;"><span style="color:#6C5CE7;font-weight:700;font-size:12px;">&#8594;</span> ${l.text}</a>`).join('')
          + '</div></div>'
        : '';

      // Same word, different format links
      const sameWordHtml = sameWordDiffFormat.length > 0
        ? `<div class="related" style="margin-bottom:28px;">
            <h3 class="related-title">More "${capitalize(topicWord)}" Worksheets</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${sameWordDiffFormat.map(w =>
                `<a href="${getPageUrl(w)}" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fff0f8;border-radius:10px;text-decoration:none;color:#1C1526;font-size:14px;font-weight:500;">
                  <span style="color:#6C5CE7;font-weight:700;font-size:12px;">&#8594;</span>
                  ${FORMAT_LABELS[w.format] || w.format} — Grade ${w.grade}
                </a>`
              ).join('')}
            </div>
          </div>`
        : '';

      const schemaHtml = buildSchema({
        type: 'EducationalResource',
        title: ws.title,
        description: `Free printable Grade ${ws.grade} ${formatLabel} worksheet for the word "${topicWord}" — ${formatDesc}`,
        url: canonicalUrl,
        grade: ws.grade,
        subject: 'English Language Arts',
        teaches: `${formatLabel} — ${topicWord}`,
        thumbnail: ws.preview_p1_url || `https://examel.com/thumbnails/${ws.slug}.png`,
        isFree: true
      });

      const ogHtml = buildOG({
        title: `${ws.title} | Free Printable ELA Worksheet | Examel`,
        description: `Free printable Grade ${ws.grade} ${formatLabel} worksheet — "${topicWord}". ${formatDesc} Answer key included. No signup required.`,
        image: ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`,
        url: canonicalUrl
      });

      const seoDescription = ws.seo_description ||
        `Free Grade ${ws.grade} ${formatLabel} worksheet about the word "${topicWord}" with ${formatTheme(ws.theme)} theme. ${formatDesc} Printable PDF with answer key. No signup required.`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Grade ${ws.grade} ${formatLabel} Worksheet — "${capitalize(topicWord)}" | Examel</title>
  <meta name="description" content="${seoDescription}">
  <link rel="canonical" href="${canonicalUrl}">
  ${ogHtml}
  ${schemaHtml}
  ${sharedCSS}
  <style>
    :root{ --subject:${color}; --subject-light:${colorLight}; }
    .ws-hero{background:#1C1526;color:white;padding:0 20px;text-align:center;position:relative;overflow:hidden;border-top:5px solid var(--subject);}
    .ws-hero-inner{max-width:860px;margin:0 auto;padding:52px 120px 48px 48px;position:relative;z-index:2;text-align:left;}
    .ws-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 0%,rgba(108,92,231,0.18) 0%,transparent 65%);pointer-events:none;}
    .ws-hero-char{position:absolute;right:48px;bottom:-10px;opacity:0.92;pointer-events:none;}
    .ws-hero h1{font-size:clamp(22px,3.2vw,34px);margin-bottom:12px;line-height:1.22;font-weight:800;letter-spacing:-0.8px;}
    .ws-hero-sub{font-size:14px;opacity:0.55;margin-bottom:20px;font-weight:500;}
    .ws-badges{display:flex;justify-content:flex-start;gap:8px;flex-wrap:wrap;}
    .ws-badge{background:var(--subject);border-radius:100px;padding:5px 16px;font-size:12px;font-weight:700;letter-spacing:0.3px;color:white;}
    .ws-container{max-width:780px;margin:0 auto;padding:32px 20px 60px;}
    .word-spotlight{background:var(--subject-light);border-radius:20px;padding:28px;margin-bottom:28px;border:1px solid rgba(108,92,231,0.08);text-align:center;}
    .word-spotlight-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--subject);margin-bottom:12px;}
    .word-spotlight-word{font-size:48px;font-weight:800;color:#1A1420;letter-spacing:-1px;}
    .word-spotlight-format{font-size:14px;color:#6B6475;margin-top:8px;}
    .download-box{background:white;border-radius:24px;padding:32px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .download-box-desc{color:#6B6475;margin-bottom:24px;line-height:1.75;font-size:15px;}
    .btn-download{background:#6C5CE7;color:white;padding:18px 32px;border-radius:14px;text-decoration:none;font-weight:800;font-size:16px;display:block;text-align:center;transition:all 0.2s;letter-spacing:-0.3px;margin-bottom:16px;box-shadow:0 4px 20px rgba(108,92,231,0.35);}
    .btn-download:hover{background:#5A4BD1;transform:translateY(-2px);}
    .info-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}
    .info-chip{text-align:center;padding:16px 12px;}
    .info-chip .lbl{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A89FAE;display:block;margin-bottom:6px;}
    .info-chip .val{font-size:16px;font-weight:800;color:#1A1420;}
    .included-box{background:var(--subject-light);border-radius:20px;padding:28px;margin-bottom:28px;border:1px solid rgba(108,92,231,0.08);}
    .included-title{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--subject);margin-bottom:16px;}
    .included-item{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;font-size:14px;color:#1A1420;font-weight:500;line-height:1.5;}
    .check{color:var(--subject);font-size:16px;font-weight:900;flex-shrink:0;margin-top:1px;}
    .related{margin-bottom:28px;}
    .related-title{font-size:20px;margin-bottom:16px;color:#1A1420;font-weight:800;letter-spacing:-0.5px;}
    .seo-prose{padding:0 4px;margin-bottom:28px;line-height:1.85;font-size:14px;color:#6B6475;}
    .seo-prose h2{color:#1A1420;margin-bottom:14px;font-size:18px;font-weight:800;letter-spacing:-0.3px;}
    .breadcrumb{max-width:860px;margin:18px auto 0;padding:0 20px;font-size:15px;color:#A89FAE;display:flex;align-items:center;flex-wrap:wrap;gap:4px;}
    .breadcrumb a{color:#6C5CE7;text-decoration:none;font-weight:500;}
    .breadcrumb .sep{opacity:0.3;margin:0 2px;}
    .ccss-badge{display:inline-block;background:#1C1526;color:white;font-size:11px;font-weight:700;padding:5px 14px;border-radius:8px;letter-spacing:0.5px;margin-top:10px;}
    @media(max-width:640px){
      .ws-hero-char{display:none;}
      .info-strip{grid-template-columns:repeat(3,1fr);}
    }
  </style>
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span class="sep">›</span>
    <a href="${subjectHubUrl}">Free English Worksheets</a><span class="sep">›</span>
    <a href="${gradeHubUrl}">Grade ${ws.grade}</a><span class="sep">›</span>
    <a href="/free-english-worksheets/${ws.format}/">Free ${formatLabel} Worksheets</a><span class="sep">›</span>
    <span>${ws.title}</span>
  </div>

  <div class="ws-hero">
    <div class="ws-hero-inner">
      <h1>${ws.title}</h1>
      <p class="ws-hero-sub">Printable ${formatLabel} worksheet — download and print instantly</p>
      <div class="ws-badges">
        <span class="ws-badge">English</span>
        <span class="ws-badge">Grade ${ws.grade}</span>
        <span class="ws-badge">${formatLabel}</span>
        <span class="ws-badge">${formatTheme(ws.theme)} Theme</span>
      </div>
    </div>
    <div class="ws-hero-char">${charSVG}</div>
  </div>

  <div class="ws-container" data-pagefind-body>
    <span data-pagefind-filter="grade" hidden>Grade ${ws.grade}</span>
    <span data-pagefind-filter="subject" hidden>English</span>
    <span data-pagefind-filter="format" hidden>Worksheet</span>
    <span data-pagefind-meta="topic" hidden>${formatTopic(ws.topic)}</span>
    ${buildSynonymBlock(ws)}

    <div class="word-spotlight">
      <div class="word-spotlight-label">${formatLabel} Worksheet</div>
      <div class="word-spotlight-word">${topicWord}</div>
      <div class="word-spotlight-format">${formatDesc}</div>
      <span class="ccss-badge">${FORMAT_CCSS[ws.format] || 'ELA-LITERACY'}</span>
    </div>

    <div class="info-strip">
      <div class="info-chip"><span class="lbl">Grade</span><span class="val">${ws.grade}</span></div>
      <div class="info-chip"><span class="lbl">Subject</span><span class="val">ELA</span></div>
      <div class="info-chip"><span class="lbl">Questions</span><span class="val">8</span></div>
    </div>

    <div class="download-box">
      <div class="download-box-desc">
        Help Grade ${ws.grade} students practice <strong>${formatLabel.toLowerCase()}</strong> with this printable worksheet
        featuring the word <strong>"${topicWord}"</strong>. Includes 8 multiple choice questions with a
        ${formatTheme(ws.theme)} theme and a complete answer key.
      </div>
      <a href="${downloadUrl}" class="btn-download" download>
        ⬇ Download PDF Worksheet
      </a>
      <div style="text-align:center;font-size:12px;color:#A89FAE;margin-top:8px;">
        ✓ Free &nbsp;·&nbsp; ✓ No signup &nbsp;·&nbsp; ✓ Answer key included &nbsp;·&nbsp; ✓ Print ready
      </div>
    </div>

    <div class="included-box">
      <div class="included-title">What's Included</div>
      <div class="included-item"><span class="check">✓</span><div>8 multiple choice ${formatLabel.toLowerCase()} questions featuring the word "<strong>${topicWord}</strong>"</div></div>
      <div class="included-item"><span class="check">✓</span><div>Engaging ${formatTheme(ws.theme)} theme to keep students motivated</div></div>
      <div class="included-item"><span class="check">✓</span><div>Complete answer key for teachers and parents</div></div>
      <div class="included-item"><span class="check">✓</span><div>Aligned to ${FORMAT_CCSS[ws.format] || 'Common Core ELA Standards'}</div></div>
      <div class="included-item"><span class="check">✓</span><div>Print-ready PDF — Letter size, works on any printer</div></div>
    </div>

    ${sameWordHtml}
    ${pedLinksHtml}

    <div class="seo-prose">
      <h2>Grade ${ws.grade} ${formatLabel} Worksheet — "${capitalize(topicWord)}"</h2>
      <p>
        This free printable ${formatLabel.toLowerCase()} worksheet is designed for Grade ${ws.grade} students
        working on vocabulary and word relationship skills. Students practice identifying
        ${ws.format === 'ela-rhyming' ? `words that rhyme with "<strong>${topicWord}</strong>"` :
          ws.format === 'ela-synonym' ? `words that mean the same as "<strong>${topicWord}</strong>" (synonyms)` :
          `words that mean the opposite of "<strong>${topicWord}</strong>" (antonyms)`}
        through 8 engaging multiple choice questions set in a fun ${formatTheme(ws.theme)} adventure.
      </p>
      <p style="margin-top:12px;">
        ${ws.format === 'ela-rhyming' ?
          `Rhyming skills are foundational for early readers. Recognizing word families and sound patterns helps Grade ${ws.grade} students decode new words, improve spelling, and develop phonemic awareness.` :
          ws.format === 'ela-synonym' ?
          `Building synonym vocabulary helps Grade ${ws.grade} students write with more variety and precision. Understanding that words can have similar meanings strengthens reading comprehension and expressive writing skills.` :
          `Understanding antonyms — words with opposite meanings — helps Grade ${ws.grade} students build stronger vocabulary and comprehension skills. Recognizing opposites improves reading fluency and writing clarity.`
        }
      </p>
    </div>

  </div>
  ${siteFooter}
</body>
</html>`;

      const filePath = dir + '/index.html';
      fs.writeFileSync(filePath, html, 'utf8');
      count++;

    } catch (err) {
      console.error(`[ela-generator] ERROR: ${ws.slug} — ${err.message}`);
    }
  }

  console.log(`[ela-generator] ✅ Generated ${count} ELA pages`);
}

module.exports = { generateElaPages };
