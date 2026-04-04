/**
 * DRILL PAGE GENERATOR — Individual drill pages
 * Uses examel-config for URLs, components, validation, and safe-write.
 */

const fs = require('fs');
const config = require('./examel-config');
const { buildSynonymBlock } = require('./examel-config/components');

function generateDrillPages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme) {
  const drills = worksheets.filter(ws => ws.format === 'drill-grid');
  console.log(`Found ${drills.length} drill pages to generate`);

  for (const ws of drills) {
    const dir = config.getDirPath(ws);
    const url = config.getPageUrl(ws);
    const color = gradeColor(ws.grade);
    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';
    const ccssText = ws.ccss_standard ? ` (${ws.ccss_standard})` : '';
    const topicName = formatTopic(ws.topic);
    const themeName = formatTheme(ws.theme);
    const canonicalUrl = `https://examel.com${url}`;
    const thumbUrl = ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ws.title} | Grade ${ws.grade} ${ws.difficulty || 'Standard'} | Free Printable Math Drill | Examel</title>
  <meta name="description" content="Free printable Grade ${ws.grade} ${topicName} math drill. ${ws.difficulty || 'Standard'} level, ${themeName} theme. Answer key included. Download PDF instantly.">
  <link rel="canonical" href="${canonicalUrl}">
  ${config.buildOG({ title: `${ws.title} | Free Math Drill | Examel`, description: `Free printable Grade ${ws.grade} ${topicName} math drill. Timed practice with answer key.`, image: thumbUrl, url: canonicalUrl })}
  ${config.buildSchema({ title: ws.title, description: `Free printable Grade ${ws.grade} ${topicName} math drill with answer key`, grade: ws.grade, subject: 'Math', teaches: topicName, url: canonicalUrl, thumbnail: thumbUrl })}
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
    .features h2{color:${color};margin-bottom:16px;font-size:1.2em;}
    .feature-item{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:14px;color:#636E72;}
    .check{color:#00B894;font-weight:bold;}
    .seo-text{background:white;border-radius:12px;padding:24px;margin-bottom:30px;line-height:1.8;font-size:14px;color:#636E72;}
    .seo-text h2{color:#2D3436;margin-bottom:12px;font-size:16px;}
    .nav-links{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;font-size:13px;}
    .nav-links a{color:${color};text-decoration:none;}
  </style>
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span>›</span>
    <a href="/free-math-drills/">Free Math Drills</a><span>›</span>
    <a href="${config.getDrillTopicUrl(ws.topic)}">Free ${topicName} Drills</a><span>›</span>
    <a href="${config.getDrillGradeUrl(ws.subject, ws.grade)}">Grade ${ws.grade}</a><span>›</span>
    ${ws.title}
  </div>
  <div class="ws-hero">
    <h1>${ws.title}</h1>
    <p>Free printable math drill — download and print instantly</p>
    <div class="badges">
      <span class="badge">Grade ${ws.grade}</span>
      <span class="badge">${topicName}</span>
      <span class="badge">${themeName} Theme</span>
      <span class="badge">${ws.difficulty || 'Standard'} Level</span>
      <span class="badge">Math Drill</span>
    </div>
  </div>
  <div class="ws-container" data-pagefind-body>
    <span data-pagefind-filter="grade" hidden>Grade ${ws.grade}</span>
    <span data-pagefind-filter="subject" hidden>${capitalize(ws.subject)}</span>
    <span data-pagefind-filter="format" hidden>Drill</span>
    <span data-pagefind-meta="topic" hidden>${formatTopic(ws.topic)}</span>
    ${buildSynonymBlock(ws)}
    <div class="download-box">
      <h2>Ready to Print</h2>
      <p>This ${topicName} drill has ${ws.grade <= 2 ? '40' : ws.grade <= 4 ? '48' : '54'} problems for Grade ${ws.grade}. ${themeName} theme. Answer key included.</p>
      <a href="${downloadUrl}" class="btn" download>⬇ Download Free Math Drill</a>
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #f0f0f0;">
        <p style="font-size:14px;color:#636E72;margin-bottom:12px;">Get new free worksheets every week.</p>
        ${config.buildEmailCapture()}
      </div>
    </div>
    ${config.buildAnswerBadge()}
    ${config.buildContentBlock(ws)}
    ${ws.preview_p1_url ? `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:30px;">
      <h2 style="color:${color};margin-bottom:16px;font-size:1.1em;">Preview</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <p style="font-size:12px;color:#636E72;margin-bottom:8px;">Page 1 — Drill</p>
          <a href="${ws.preview_p1_url}" target="_blank"><img src="${ws.preview_p1_url}" alt="Grade ${ws.grade} ${topicName} drill — ${themeName} theme" loading="lazy" width="850" height="1100" style="width:100%;border-radius:8px;border:1px solid #eee;"></a>
        </div>
        <div>
          <p style="font-size:12px;color:#636E72;margin-bottom:8px;">Page 2 — Answer Key</p>
          <a href="${ws.preview_p2_url}" target="_blank"><img src="${ws.preview_p2_url}" alt="Answer key — Grade ${ws.grade} ${topicName} drill" loading="lazy" width="850" height="1100" style="width:100%;border-radius:8px;border:1px solid #eee;"></a>
        </div>
      </div>
    </div>` : ''}
    <div class="features">
      <h2>What's Included</h2>
      <div class="feature-item"><span class="check">✓</span> ${ws.grade <= 2 ? '40' : ws.grade <= 4 ? '48' : '54'} ${topicName} problems</div>
      <div class="feature-item"><span class="check">✓</span> ${themeName} theme to keep kids motivated</div>
      <div class="feature-item"><span class="check">✓</span> Score, Name, Date and Time fields</div>
      <div class="feature-item"><span class="check">✓</span> Answer key on page 2</div>
      <div class="feature-item"><span class="check">✓</span> Print-ready PDF — Letter size</div>
      <div class="feature-item"><span class="check">✓</span> ${ws.difficulty || 'Standard'} difficulty level</div>
    </div>
    <div class="seo-text">
      <h2>About this Grade ${ws.grade} ${topicName} Drill</h2>
      <p>Free printable ${topicName} drill for Grade ${ws.grade} students. The ${themeName} theme makes fact practice engaging while kids build ${topicName} fluency. Includes answer key and score field — perfect for timed tests${ccssText}.</p>
    </div>
    ${config.buildDrillNavLinks(ws, formatTopic)}
  </div>
  ${siteFooter}
</body>
</html>`;

    config.safeWrite(`${dir}/index.html`, html, 'drill', url, '0.7', 'monthly');
  }

  console.log(`✓ ${drills.length} drill pages generated`);
  const stats = config.getStats();
  if (stats.blocked > 0) console.log(`⚠️  ${stats.blocked} drill pages blocked by validator`);
  return drills;
}

module.exports = { generateDrillPages };
