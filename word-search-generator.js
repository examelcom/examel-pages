const { buildAnalytics, buildSynonymBlock } = require('./examel-config');
// This file is injected into generate-pages.js by the build process
// It generates word search pages separately

const fs = require('fs');
const path = require('path');

function generateWordSearchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme) {
  const wordSearches = worksheets.filter(ws => ws.format === 'word-search');
  console.log(`Found ${wordSearches.length} word searches`);

  for (const ws of wordSearches) {
    const dir = `/opt/examel/examel-pages/word-searches/${ws.subject}/grade-${ws.grade}/${ws.slug}`;
    fs.mkdirSync(dir, { recursive: true });
    const color = gradeColor(ws.grade);
    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
    const ccssText = ws.ccss_standard ? ` (${ws.ccss_standard})` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ws.title} | Free Printable Word Search with Answer Key | Examel</title>
  <meta name="description" content="Free printable Grade ${ws.grade} ${capitalize(ws.subject)} word search. ${formatTopic(ws.topic)} with ${formatTheme(ws.theme)} theme. Answer key included. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/word-searches/${ws.subject}/grade-${ws.grade}/${ws.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${ws.title} | Free Printable Word Search | Examel">
  <meta property="og:description" content="Free printable Grade ${ws.grade} ${capitalize(ws.subject)} word search with answer key. Download PDF free.">
  <meta property="og:image" content="${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}">
  <meta property="og:url" content="https://examel.com/word-searches/${ws.subject}/grade-${ws.grade}/${ws.slug}/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"EducationalResource","name":"${ws.title}","description":"Free printable Grade ${ws.grade} ${capitalize(ws.subject)} word search about ${formatTopic(ws.topic)}","educationalLevel":"Grade ${ws.grade}","subject":"${capitalize(ws.subject)}","teaches":"${formatTopic(ws.topic)}","keywords":"Grade ${ws.grade} ${capitalize(ws.subject)} word search, ${formatTopic(ws.topic)} word search, free printable word search","url":"https://examel.com/word-searches/${ws.subject}/grade-${ws.grade}/${ws.slug}/","thumbnailUrl":"${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}","provider":{"@type":"Organization","name":"Examel","url":"https://examel.com"},"isAccessibleForFree":true}</script>
  ${sharedCSS}
  <style>
    .ws-hero{background:${color};color:white;padding:40px 20px;text-align:center;}
    .ws-hero h1{font-size:clamp(20px,3vw,32px);margin-bottom:10px;line-height:1.3;}
    .badges{display:flex;justify-content:center;gap:10px;margin-top:15px;flex-wrap:wrap;}
    .badge{background:rgba(255,255,255,0.2);border-radius:20px;padding:4px 14px;font-size:13px;font-weight:bold;}
    .ws-container{max-width:800px;margin:0 auto;padding:40px 20px;}
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
    .nav-links{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;font-size:13px;}
    .nav-links a{color:${color};text-decoration:none;}
  </style>
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/word-searches/">Word Searches</a><span>›</span>
    ${ws.title}
  </div>
  <div class="ws-hero">
    <h1>${ws.title}</h1>
    <p>Printable word search — download and print instantly</p>
    <div class="badges">
      <span class="badge">${capitalize(ws.subject)}</span>
      <span class="badge">Grade ${ws.grade}</span>
      <span class="badge">${formatTheme(ws.theme)} Theme</span>
      <span class="badge">Word Search</span>
    </div>
  </div>
  <div class="ws-container" data-pagefind-body>
    <span data-pagefind-filter="grade" hidden>Grade ${ws.grade}</span>
    <span data-pagefind-filter="subject" hidden>${capitalize(ws.subject)}</span>
    <span data-pagefind-filter="format" hidden>Word Search</span>
    <span data-pagefind-meta="topic" hidden>${formatTopic(ws.topic)}</span>
    ${buildSynonymBlock(ws)}
    <div class="download-box">
      <h2>Ready to Print</h2>
      <p>This word search covers ${formatTopic(ws.topic)} vocabulary for Grade ${ws.grade} ${capitalize(ws.subject)}. Includes answer key and vocabulary definitions.</p>
      <a href="${downloadUrl}" class="btn" download>⬇ Download Free Word Search</a>
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #f0f0f0;">
        <p style="font-size:14px;color:#636E72;margin-bottom:12px;">Get new free worksheets every week — no spam, unsubscribe anytime.</p>
        <div class="klaviyo-form-X45k9d"></div>
        <script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/VruXqp/klaviyo.js?company_id=VruXqp"></script>
      </div>
    </div>
    ${ws.preview_p1_url ? `
    <div class="preview-section">
      <h3>📄 Worksheet Preview</h3>
      <div class="preview-grid">
        <div>
          <p class="preview-label">Page 1 — Word Search</p>
          <a href="${ws.preview_p1_url}" target="_blank">
            <img src="${ws.preview_p1_url}"
              alt="Free Grade ${ws.grade} ${capitalize(ws.subject)} word search worksheet — ${formatTopic(ws.topic)} — Common Core ${ws.ccss_standard}"
              loading="lazy" width="850" height="1100"
              class="preview-img">
          </a>
        </div>
        <div>
          <p class="preview-label">Page 2 — Answer Key</p>
          <a href="${ws.preview_p2_url}" target="_blank">
            <img src="${ws.preview_p2_url}"
              alt="Answer key — Grade ${ws.grade} ${capitalize(ws.subject)} word search — ${formatTopic(ws.topic)} — teacher and parent use only"
              loading="lazy" width="850" height="1100"
              class="preview-img">
          </a>
        </div>
      </div>
      <p class="preview-note">Click any image to view full size · 2 pages · Print-ready PDF</p>
    </div>
    ` : ''}
    <div class="features">
      <h3>What is included</h3>
      <div class="feature-item"><span class="check">✓</span> 10 curriculum-aligned vocabulary words</div>
      <div class="feature-item"><span class="check">✓</span> ${formatTheme(ws.theme)} theme to keep kids engaged</div>
      <div class="feature-item"><span class="check">✓</span> Answer key with highlighted solution grid</div>
      <div class="feature-item"><span class="check">✓</span> Vocabulary definitions on answer key page</div>
      <div class="feature-item"><span class="check">✓</span> Print-ready PDF — Letter size</div>
    </div>
    <div class="seo-text">
      <h3>About this Grade ${ws.grade} ${capitalize(ws.subject)} Word Search</h3>
      <p>Printable word search for Grade ${ws.grade} ${capitalize(ws.subject)} covering ${formatTopic(ws.topic)}. The ${formatTheme(ws.theme)} theme makes it engaging while kids practice important vocabulary. Includes answer key with highlighted words and definitions${ccssText}.</p>
    </div>
    <div class="nav-links">
      <a href="/word-searches/">← All Word Searches</a>
      <a href="https://examel.com">← Examel Home</a>
    </div>
  </div>
  ${siteFooter}
</body>
</html>`;

    fs.writeFileSync(`${dir}/index.html`, html);
  }
  console.log(`✓ ${wordSearches.length} word search pages generated`);
  return wordSearches;
}

module.exports = { generateWordSearchPages };
