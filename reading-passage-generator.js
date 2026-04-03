const { buildAnalytics } = require('./examel-config');
const fs = require('fs');

function generateReadingPassagePages(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme) {

function renderContentBlock(ws) {
  if (!ws.content) return '';
  var parsed;
  try { parsed = typeof ws.content === 'string' ? JSON.parse(ws.content) : ws.content; } catch(e) { return ''; }
  var html = '<div style="background:white;border-radius:20px;padding:28px 32px;margin-bottom:28px;border:1px solid #EDE8DF;box-shadow:0 2px 8px rgba(0,0,0,0.04);">';
  if (parsed.learning_objective) { html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Learning Objective</div><p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:20px;">' + parsed.learning_objective + '</p>'; }
  if (parsed.story_intro) { html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">About This Activity</div><p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:20px;font-style:italic;">' + parsed.story_intro + '</p>'; }
  if (parsed.teacher_note) { html += '<div style="background:#F4F1FF;border-radius:12px;padding:16px 20px;margin-bottom:20px;border-left:4px solid #6C5CE7;"><div style="font-size:12px;font-weight:700;color:#6C5CE7;margin-bottom:6px;font-family:Outfit,sans-serif;">Teacher Tip</div><p style="font-size:14px;color:#4A4458;line-height:1.7;margin:0;">' + parsed.teacher_note + '</p></div>'; }
  if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) { html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Sample Questions</div>'; parsed.questions.slice(0,3).forEach(function(q,i){ var t=q.question||q.text||q; if(typeof t==='string'){html+='<div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;"><span style="background:#EDE8DF;color:#6B6475;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">'+(q.number||i+1)+'</span><p style="font-size:14px;color:#3D3347;line-height:1.7;margin:0;">'+t+'</p></div>';}}); if(parsed.questions.length>3){html+='<p style="font-size:13px;color:#A89FAE;margin-top:8px;">+ '+(parsed.questions.length-3)+' more questions in the full worksheet</p>';} }
  if (parsed.passage) { var preview=parsed.passage.length>300?parsed.passage.substring(0,300)+'...':parsed.passage; html+='<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Reading Passage Preview</div><div style="background:#FFFAF0;border-radius:12px;padding:20px;border:1px solid #EDE8DF;margin-bottom:16px;"><p style="font-size:15px;color:#3D3347;line-height:1.9;margin:0;">'+preview+'</p></div>'; if(parsed.passage.length>300){html+='<p style="font-size:13px;color:#A89FAE;">Download the full worksheet to read the complete passage and answer comprehension questions.</p>';} }
  if (parsed.pairs && Array.isArray(parsed.pairs) && parsed.pairs.length > 0) { html += '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:12px;font-family:Outfit,sans-serif;">Vocabulary Words</div>'; parsed.pairs.forEach(function(p){html+='<div style="display:flex;gap:12px;margin-bottom:10px;align-items:baseline;"><span style="font-weight:800;font-size:14px;color:#1A1420;font-family:Outfit,sans-serif;min-width:120px;">'+(p.word||'')+'</span><span style="font-size:14px;color:#6B6475;line-height:1.6;">'+(p.definition||'')+'</span></div>';}); }
  if (parsed.student_instructions) { html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #EDE8DF;"><p style="font-size:13px;color:#6B6475;line-height:1.7;margin:0;"><strong style="color:#1A1420;">Instructions:</strong> ' + parsed.student_instructions + '</p></div>'; }
  html += '</div>';
  return html;
}


  const passagePages = worksheets.filter(ws => ws.format === 'reading-passage');
  console.log(`Found ${passagePages.length} reading passage pages to generate`);

  for (const ws of passagePages) {
    const dir = `/opt/examel/examel-pages/reading-passages/grade-${ws.grade}/${ws.slug}`;
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
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ws.title} | Free Printable Reading Comprehension Passage with Answer Key | Examel</title>
  <meta name="description" content="Free printable Grade ${ws.grade} reading comprehension passage about ${topicName}. ${themeName} theme. 6 comprehension questions with answer key. Download PDF instantly.">
  <link rel="canonical" href="https://examel.com/reading-passages/grade-${ws.grade}/${ws.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${ws.title} | Free Printable Reading Passage | Examel">
  <meta property="og:description" content="Free printable Grade ${ws.grade} reading comprehension passage with 6 questions and answer key. Download PDF free.">
  <meta property="og:image" content="${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}">
  <meta property="og:url" content="https://examel.com/reading-passages/grade-${ws.grade}/${ws.slug}/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"EducationalResource","name":"${ws.title}","description":"Free printable Grade ${ws.grade} reading comprehension passage about ${topicName} — 6 questions with answer key","educationalLevel":"Grade ${ws.grade}","subject":"${capitalize(ws.subject)}","teaches":"${topicName}","keywords":"Grade ${ws.grade} ${capitalize(ws.subject)} reading passage, ${topicName} reading comprehension, free printable reading worksheet","url":"https://examel.com/reading-passages/grade-${ws.grade}/${ws.slug}/","thumbnailUrl":"${ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`}","provider":{"@type":"Organization","name":"Examel","url":"https://examel.com"},"isAccessibleForFree":true}</script>
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
    <a href="/free-reading-passages/">Free Reading Passages</a><span>›</span>
    <a href="/free-reading-passages/grade-${ws.grade}/">Grade ${ws.grade}</a><span>›</span>
    ${ws.title}
  </div>
  <div class="ws-hero">
    <h1>${ws.title}</h1>
    <p>Printable reading comprehension passage — download and print instantly</p>
    <div class="badges">
      <span class="badge">Grade ${ws.grade}</span>
      <span class="badge">${topicName}</span>
      <span class="badge">${themeName} Theme</span>
      <span class="badge">Nonfiction</span>
      <span class="badge">6 Questions</span>
    </div>
  </div>
  <div class="ws-container">
    <div class="download-box">
      <h2>Ready to Print — 3 Pages</h2>
      <p>Grade ${ws.grade} nonfiction reading passage about ${topicName}. ${themeName} theme. 6 comprehension questions covering main idea, inference, vocabulary, text evidence and more. Answer key included${ccssText}.</p>
      <a href="${downloadUrl}" class="btn" download>⬇ Download Reading Passage</a>
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
          <p class="preview-label">Page 1 — Reading Passage</p>
          <a href="${ws.preview_p1_url}" target="_blank">
            <img src="${ws.preview_p1_url}"
              alt="Free Grade ${ws.grade} reading passage — ${formatTopic(ws.topic)} — ${formatTheme(ws.theme)} theme — Common Core ${ws.ccss_standard}"
              loading="lazy" width="850" height="1100"
              class="preview-img">
          </a>
        </div>
        <div>
          <p class="preview-label">Page 2 — Answer Key</p>
          <a href="${ws.preview_p2_url}" target="_blank">
            <img src="${ws.preview_p2_url}"
              alt="Answer key — Grade ${ws.grade} reading passage — ${formatTopic(ws.topic)} — teacher and parent use only"
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
      <div class="feature-item"><span class="check">✓</span> 130-160 word nonfiction reading passage</div>
      <div class="feature-item"><span class="check">✓</span> ${themeName} theme to keep kids engaged</div>
      <div class="feature-item"><span class="check">✓</span> 6 comprehension questions — multiple skill types</div>
      <div class="feature-item"><span class="check">✓</span> Question types: Main Idea, Vocabulary, Inference, Text Evidence, Cause and Effect, Author's Purpose</div>
      <div class="feature-item"><span class="check">✓</span> 3 answer lines per question</div>
      <div class="feature-item"><span class="check">✓</span> Answer key on page 3</div>
      <div class="feature-item"><span class="check">✓</span> Print-ready PDF — Letter size — 3 pages</div>
    </div>
    ${renderContentBlock(ws)}
    <div class="seo-text">
      <h3>About this Grade ${ws.grade} Reading Comprehension Passage</h3>
      <p>This printable reading comprehension passage is designed for Grade ${ws.grade} students. The ${themeName} theme makes reading engaging while students build essential comprehension skills. Six questions cover a range of reading strategies including main idea, text evidence, vocabulary in context, inference, cause and effect, and author's purpose${ccssText}.</p>
    </div>
    <div class="nav-links">
      <a href="/free-reading-passages/grade-${ws.grade}/">← All Grade ${ws.grade} Reading Passages</a>
      <a href="/free-reading-passages/">← All Reading Passages</a>
      <a href="https://examel.com">← Examel Home</a>
    </div>
  </div>
  ${siteFooter}
</body>
</html>`;

    fs.writeFileSync(`${dir}/index.html`, html);
  }

  console.log(`✓ ${passagePages.length} reading passage pages generated`);
  return passagePages;
}

module.exports = { generateReadingPassagePages };
