const fs = require('fs');

function generateVocabMatchPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme) {
  const vocabPages = worksheets.filter(ws => ws.format === 'vocab-match');
  console.log(`Found ${vocabPages.length} vocab match pages to generate`);

  for (const ws of vocabPages) {
    const dir = `/opt/examel/examel-pages/vocab-match/${ws.subject}/grade-${ws.grade}/${ws.slug}`;
    fs.mkdirSync(dir, { recursive: true });
    const color = gradeColor(ws.grade);
    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
    const topicName = formatTopic(ws.topic);
    const themeName = formatTheme(ws.theme);
    const ccssText = ws.ccss_standard ? ` (${ws.ccss_standard})` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ws.title} | Free Printable Vocabulary Worksheet with Answer Key | Examel</title>
  <meta name="description" content="Free printable Grade ${ws.grade} ${topicName} vocabulary match worksheet. ${themeName} theme. Answer key included. Students match words to definitions. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/vocab-match/${ws.subject}/grade-${ws.grade}/${ws.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${ws.title} | Free Printable Vocabulary Worksheet | Examel">
  <meta property="og:description" content="Free printable Grade ${ws.grade} ${capitalize(ws.subject)} vocabulary match worksheet. Answer key included. Download PDF free.">
  <meta property="og:image" content="${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}">
  <meta property="og:url" content="https://examel.com/vocab-match/${ws.subject}/grade-${ws.grade}/${ws.slug}/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"EducationalResource","name":"${ws.title}","description":"Free printable Grade ${ws.grade} ${topicName} vocabulary match worksheet — match words to definitions","educationalLevel":"Grade ${ws.grade}","subject":"${capitalize(ws.subject)}","teaches":"${topicName}","keywords":"Grade ${ws.grade} ${capitalize(ws.subject)} vocabulary match, ${topicName} vocabulary worksheet, free printable vocabulary","url":"https://examel.com/vocab-match/${ws.subject}/grade-${ws.grade}/${ws.slug}/","thumbnailUrl":"${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}","provider":{"@type":"Organization","name":"Examel","url":"https://examel.com"},"isAccessibleForFree":true}</script>
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
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/free-${ws.subject}-vocabulary/">Free ${capitalize(ws.subject)} Vocabulary</a><span>›</span>
    <a href="/vocab-match/${ws.subject}/grade-${ws.grade}/">Grade ${ws.grade}</a><span>›</span>
    ${ws.title}
  </div>
  <div class="ws-hero">
    <h1>${ws.title}</h1>
    <p>Free printable vocabulary match worksheet — download and print instantly</p>
    <div class="badges">
      <span class="badge">Grade ${ws.grade}</span>
      <span class="badge">${topicName}</span>
      <span class="badge">${themeName} Theme</span>
      <span class="badge">Vocabulary Match</span>
      <span class="badge">${capitalize(ws.subject)}</span>
    </div>
  </div>
  <div class="ws-container">
    <div class="download-box">
      <h2>Ready to Print</h2>
      <p>Match 8 key ${topicName} vocabulary words to their definitions. ${themeName} theme keeps kids engaged. Answer key included${ccssText}.</p>
      <a href="${downloadUrl}" class="btn" download>⬇ Download Free Vocabulary Worksheet</a>
    </div>
    <div class="features">
      <h3>What is included</h3>
      <div class="feature-item"><span class="check">✓</span> 8 key ${topicName} vocabulary words</div>
      <div class="feature-item"><span class="check">✓</span> Scrambled definitions to match</div>
      <div class="feature-item"><span class="check">✓</span> ${themeName} theme to keep kids motivated</div>
      <div class="feature-item"><span class="check">✓</span> Bonus challenge — write sentences using vocabulary</div>
      <div class="feature-item"><span class="check">✓</span> Answer key on page 2</div>
      <div class="feature-item"><span class="check">✓</span> Print-ready PDF — Letter size</div>
      <div class="feature-item"><span class="check">✓</span> ${ws.difficulty || 'Standard'} difficulty level</div>
    </div>
    <div class="seo-text">
      <h3>About this Grade ${ws.grade} ${topicName} Vocabulary Worksheet</h3>
      <p>This free printable vocabulary match worksheet helps Grade ${ws.grade} ${capitalize(ws.subject)} students learn key ${topicName} terms. The ${themeName} theme makes vocabulary practice engaging while students build academic language skills. Includes answer key and bonus writing challenge${ccssText}.</p>
    </div>
    <div class="nav-links">
      <a href="/vocab-match/${ws.subject}/grade-${ws.grade}/">← All Grade ${ws.grade} ${capitalize(ws.subject)} Vocabulary</a>
      <a href="/free-${ws.subject}-vocabulary/">← All ${capitalize(ws.subject)} Vocabulary</a>
      <a href="https://examel.com">← Examel Home</a>
    </div>
  </div>
  ${siteFooter}
</body>
</html>`;

    fs.writeFileSync(`${dir}/index.html`, html);
  }

  console.log(`✓ ${vocabPages.length} vocab match pages generated`);
  return vocabPages;
}

module.exports = { generateVocabMatchPages };
