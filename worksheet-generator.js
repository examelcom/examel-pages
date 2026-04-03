/**
 * WORKSHEET GENERATOR
 * Generates individual worksheet pages → /worksheets/[slug]/
 * Usage: called from generate-pages.js orchestrator
 */

'use strict';
const fs = require('fs');
const {
  getDirPath, getPageUrl, getGradeHubUrl, getSubjectHubUrl,
  buildSchema, buildOG, buildCharSVG, buildContentBlock, buildAnalytics} = require('./examel-config');

function subjectColorLight(s) {
  const m = { math:'#F5F3FF', english:'#FDF2F8', science:'#ECFDF5', 'drill-grid':'#FEF2F2', reading:'#E0F2FE', vocab:'#FFFBEB' };
  return m[s] || '#F4F1FF';
}

function generateWorksheetPages(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const { gradeColor, capitalize, formatTopic, formatTheme, subjectColor, worksheetCard, getPedagogicalLinks } = helpers;

  const wsOnly = worksheets.filter(w => !w.format || w.format === 'worksheet' || (w.format && w.format.startsWith('game-')));
  let count = 0;

  for (const ws of wsOnly) {
    const dir = getDirPath(ws);
    fs.mkdirSync(dir, { recursive: true });

    const color     = subjectColor(ws.subject);
    const colorLight = subjectColorLight(ws.subject);
    const charSVG   = buildCharSVG(ws.subject);
    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') ? ws.pdf_url : 'https://examel.com';

    const sameThemeDiffSubject = worksheets.filter(w =>
      w.theme === ws.theme && w.subject !== ws.subject &&
      w.grade === ws.grade && w.slug !== ws.slug
    ).slice(0, 3);

    const pedLinks = getPedagogicalLinks(ws, worksheets.filter(w => w.format !== 'drill-grid' && w.format !== 'word-search'));
    const pedLinksHtml = pedLinks.length > 0
      ? '<div class="related"><h3 class="related-title">Related Worksheets</h3><div style="display:flex;flex-direction:column;gap:8px;">'
        + pedLinks.map(l => `<a href="${l.url}" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8f6ff;border-radius:10px;text-decoration:none;color:#1C1526;font-size:14px;font-weight:500;"><span style="color:#6C5CE7;font-weight:700;font-size:12px;">&#8594;</span> ${l.text}</a>`).join('')
        + '</div></div>'
      : '';

    const canonicalUrl = 'https://examel.com' + getPageUrl(ws);
    const subjectHubUrl = getSubjectHubUrl(ws.subject);
    const gradeHubUrl   = getGradeHubUrl(ws.subject, ws.grade);

    const schemaHtml = buildSchema({
      type: 'EducationalResource',
      title: ws.title,
      description: `Free printable Grade ${ws.grade} ${ws.subject} worksheet about ${formatTopic(ws.topic)} — 8 questions with answer key`,
      url: canonicalUrl,
      grade: ws.grade,
      subject: capitalize(ws.subject),
      teaches: formatTopic(ws.topic),
      thumbnail: ws.preview_p1_url || `https://examel.com/thumbnails/${ws.slug}.png`,
      isFree: true
    });

    const ogHtml = buildOG({
      title: `${ws.title} | Free Printable Worksheet | Examel`,
      description: `Free printable Grade ${ws.grade} ${capitalize(ws.subject)} worksheet about ${formatTopic(ws.topic)}. Answer key included. Download PDF free.`,
      image: ws.pinterest_image_url || ws.preview_image_url || `https://examel.com/thumbnails/${ws.slug}.png`,
      url: canonicalUrl
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Free Grade ${ws.grade} ${formatTopic(ws.topic)} ${capitalize(ws.subject)} Worksheet — ${formatTheme(ws.theme)} | Examel</title>
  <meta name="description" content="${ws.seo_description || `Free ${ws.target_keyword || ws.subject + ' worksheet for Grade ' + ws.grade}. ${formatTopic(ws.topic)} practice with ${formatTheme(ws.theme)} theme. Printable PDF with answer key. No signup required.`}">
  <link rel="canonical" href="${canonicalUrl}">
  ${ogHtml}
  ${schemaHtml}
  ${sharedCSS}
  <style>
    :root{ --subject:${color}; --subject-light:${colorLight}; }
    .ws-hero{background:#1C1526;color:white;padding:0 20px;text-align:center;position:relative;overflow:hidden;border-top:5px solid var(--subject);}
    .ws-hero-inner{max-width:860px;margin:0 auto;padding:52px 120px 48px 48px;position:relative;z-index:2;text-align:left;}
    .ws-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 0%,rgba(108,92,231,0.18) 0%,transparent 65%);pointer-events:none;}
    .ws-hero-char{position:absolute;right:48px;bottom:-10px;opacity:0.92;pointer-events:none;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.2));}
    .ws-hero h1{font-size:clamp(22px,3.2vw,34px);margin-bottom:12px;line-height:1.22;font-weight:800;letter-spacing:-0.8px;}
    .ws-hero-sub{font-size:14px;opacity:0.55;margin-bottom:20px;font-weight:500;max-width:520px;}
    .ws-badges{display:flex;justify-content:flex-start;gap:8px;flex-wrap:wrap;}
    .ws-badge{background:var(--subject);border-radius:100px;padding:5px 16px;font-size:12px;font-weight:700;letter-spacing:0.3px;color:white;}
    .ws-container{max-width:780px;margin:0 auto;padding:32px 20px 60px;}
    .preview-desk{background:#FDF8EE;border-radius:24px;padding:36px 32px;margin-bottom:28px;border:1px solid #EDE8DF;}
    .preview-desk-title{font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A89FAE;text-align:center;margin-bottom:24px;}
    .preview-desk-images{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
    .preview-paper{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.1),0 2px 8px rgba(0,0,0,0.06);border:1px solid #EDE8DF;cursor:pointer;transition:transform 0.3s,box-shadow 0.3s;}
    .preview-paper:first-child{transform:rotate(-1deg);}
    .preview-paper:last-child{transform:rotate(1deg);}
    .preview-paper:hover{transform:rotate(0deg) translateY(-4px);box-shadow:0 16px 56px rgba(0,0,0,0.15);}
    .preview-paper img{width:100%;height:320px;object-fit:cover;object-position:top;display:block;}
    .preview-paper-label{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(28,21,38,0.85));color:white;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:20px 14px 12px;}
    .download-box{background:white;border-radius:24px;padding:32px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);border:1px solid #EDE8DF;}
    .download-box-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A89FAE;margin-bottom:8px;}
    .download-box-desc{color:#6B6475;margin-bottom:24px;line-height:1.75;font-size:15px;}
    .btn-download{background:#6C5CE7;color:white;padding:18px 32px;border-radius:14px;text-decoration:none;font-weight:800;font-size:16px;display:block;text-align:center;transition:all 0.2s;letter-spacing:-0.3px;margin-bottom:16px;box-shadow:0 4px 20px rgba(108,92,231,0.35);}
    .btn-download:hover{background:#5A4BD1;transform:translateY(-2px) scale(1.01);}
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
    .info-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}
    .info-chip{text-align:center;padding:16px 12px;}
    .info-chip .lbl{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A89FAE;display:block;margin-bottom:6px;}
    .info-chip .val{font-size:16px;font-weight:800;color:#1A1420;}
    .included-box{background:var(--subject-light);border-radius:20px;padding:28px;margin-bottom:28px;border:1px solid rgba(108,92,231,0.08);}
    .included-title{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--subject);margin-bottom:16px;}
    .included-item{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;font-size:14px;color:#1A1420;font-weight:500;line-height:1.5;}
    .check{color:var(--subject);font-size:16px;font-weight:900;flex-shrink:0;margin-top:1px;}
    .ccss-badge{display:inline-block;background:#1C1526;color:white;font-size:11px;font-weight:700;padding:5px 14px;border-radius:8px;letter-spacing:0.5px;margin-top:10px;}
    .related{margin-bottom:28px;}
    .related-title{font-size:20px;margin-bottom:16px;color:#1A1420;font-weight:800;letter-spacing:-0.5px;}
    .related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;}
    .email-section{background:#1C1526;border-radius:24px;padding:36px 32px;margin-bottom:28px;text-align:center;position:relative;overflow:hidden;}
    .email-section h3{color:white;font-size:20px;font-weight:800;margin-bottom:8px;position:relative;z-index:2;}
    .email-section p{color:rgba(255,255,255,0.45);font-size:14px;margin-bottom:22px;position:relative;z-index:2;}
    .email-note{font-size:11px;color:rgba(255,255,255,0.25);margin-top:12px;position:relative;z-index:2;}
    .seo-prose{padding:0 4px;margin-bottom:28px;line-height:1.85;font-size:14px;color:#6B6475;}
    .seo-prose h3{color:#1A1420;margin-bottom:14px;font-size:18px;font-weight:800;letter-spacing:-0.3px;}
    .nav-links{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px;font-size:13px;}
    .nav-links a{color:#6C5CE7;text-decoration:none;font-weight:600;}
    .nav-links a:hover{text-decoration:underline;}
    .sticky-bar{position:fixed;bottom:0;left:0;right:0;background:#1C1526;border-top:2px solid #6C5CE7;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:300;transform:translateY(100%);transition:transform 0.3s ease;}
    .sticky-bar.visible{transform:translateY(0);}
    .sticky-bar-title{color:rgba(255,255,255,0.8);font-size:13px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .sticky-bar-btn{background:#6C5CE7;color:white;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:800;font-size:13px;white-space:nowrap;flex-shrink:0;}
    @keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(80px) rotate(360deg);opacity:0;}}
    .confetti-piece{position:absolute;width:8px;height:8px;border-radius:2px;pointer-events:none;animation:confetti-fall 0.8s ease-out forwards;}
    .breadcrumb{max-width:860px;margin:18px auto 0;padding:0 20px;font-size:15px;color:#A89FAE;display:flex;align-items:center;flex-wrap:wrap;gap:4px;}
    .breadcrumb a{color:#6C5CE7;text-decoration:none;font-weight:500;}
    .breadcrumb .sep{opacity:0.3;margin:0 2px;}
    @media(max-width:640px){
      .preview-desk-images{grid-template-columns:1fr;}
      .preview-paper:first-child,.preview-paper:last-child{transform:none;}
      .ws-hero-char{display:none;}
      .info-strip{grid-template-columns:repeat(3,1fr);}
      .sticky-bar-title{display:none;}
    }
  </style>
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span class="sep">›</span>
    <a href="${subjectHubUrl}">Free ${capitalize(ws.subject)} Worksheets</a><span class="sep">›</span>
    <a href="${gradeHubUrl}">Grade ${ws.grade}</a><span class="sep">›</span>
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
    <div class="ws-hero-char">${charSVG}</div>
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
        </div>
        ${ws.preview_p2_url ? `
        <div class="preview-paper">
          <a href="${ws.preview_p2_url}" target="_blank">
            <img src="${ws.preview_p2_url}" alt="Answer key — Grade ${ws.grade} ${capitalize(ws.subject)} worksheet" loading="lazy">
          </a>
          <div class="preview-paper-label">Answer Key · Teacher Use</div>
        </div>` : ''}
      </div>
      <p style="font-size:11px;color:#B2BEC3;text-align:center;margin-top:16px;">Click any image to view full size · US Letter · Instant download</p>
    </div>` : ''}

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
          <a href="https://pinterest.com/pin/create/button/?url=${canonicalUrl}&media=${encodeURIComponent(ws.pinterest_image_url||ws.preview_image_url||'')}&description=${encodeURIComponent(ws.title+' — Free Grade '+ws.grade+' '+ws.subject+' worksheet #freeworksheets #homeschool')}" target="_blank" class="share-icon" title="Pinterest">📌</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${canonicalUrl}" target="_blank" class="share-icon" title="Facebook">📘</a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Free Grade '+ws.grade+' '+ws.subject+' worksheet: '+ws.title)}&url=${canonicalUrl}" target="_blank" class="share-icon" title="Twitter">🐦</a>
          <a href="mailto:?subject=${encodeURIComponent('Free worksheet: '+ws.title)}&body=${encodeURIComponent('Check out this free worksheet: '+canonicalUrl)}" class="share-icon" title="Email">📧</a>
        </div>
      </div>
      <div class="trust-strip">
        <span class="trust-item">✓ Free forever</span>
        <span class="trust-item">✓ No login required</span>
        <span class="trust-item">✓ Instant PDF</span>
      </div>
    </div>

    <div class="info-strip">
      <div class="info-chip"><span class="lbl">Subject</span><span class="val">${capitalize(ws.subject)}</span></div>
      <div class="info-chip"><span class="lbl">Grade</span><span class="val">Grade ${ws.grade}</span></div>
      <div class="info-chip"><span class="lbl">Topic</span><span class="val">${formatTopic(ws.topic)}</span></div>
    </div>

    <div style="text-align:center;margin:12px 0 16px;font-size:13px;color:#8b7fa8;font-weight:500;">Created by Examel Education Team · Aligned to Common Core State Standards</div>

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

    ${buildContentBlock(ws)}
    ${pedLinksHtml}

    <div class="email-section">
      <h3>📬 Get Free Worksheets Every Week</h3>
      <p>New themed worksheets added daily. Free for parents and teachers.</p>
      <div class="klaviyo-form-X45k9d"></div>
      <script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/VruXqp/klaviyo.js?company_id=VruXqp"></script>
      <p class="email-note">No spam. Unsubscribe anytime.</p>
    </div>

    <div class="seo-prose">
      <h3>About this ${capitalize(ws.subject)} worksheet for Grade ${ws.grade}</h3>
      ${ws.seo_description ? `<p>${ws.seo_description}</p>` : ''}
      <p>This free printable ${capitalize(ws.subject)} worksheet is designed for Grade ${ws.grade} students and covers ${formatTopic(ws.topic)}. The ${formatTheme(ws.theme)} theme keeps kids engaged while they practice essential ${capitalize(ws.subject)} skills. Every worksheet includes a full answer key making it easy for parents and teachers to check work instantly. Aligned to Common Core State Standards (CCSS) for Grade ${ws.grade} ${capitalize(ws.subject)}. Print-ready at US Letter size. No login required — download and print in seconds.</p>
      <p style="font-size:12px;color:#A89FAE;margin-top:12px;">Last updated: ${ws.created_at ? new Date(ws.created_at).toLocaleDateString('en-US', {month:'long', year:'numeric'}) : new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}</p>
    </div>

    ${sameThemeDiffSubject.length > 0 ? `
    <div class="related">
      <h3 class="related-title">More ${formatTheme(ws.theme)} Theme Worksheets</h3>
      <div class="related-grid">${sameThemeDiffSubject.map(w => worksheetCard(w)).join('')}</div>
    </div>` : ''}

    <div style="background:#1C1526;border-radius:20px;padding:28px 32px;margin-bottom:28px;color:white;">
      <div style="font-size:16px;font-weight:800;margin-bottom:10px;font-family:Outfit,sans-serif;">About Examel</div>
      <p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.8;margin:0;">Examel provides 10,000+ free printable worksheets for Grades 1–6, aligned to Common Core State Standards. Every worksheet is reviewed for accuracy and includes a full answer key. New worksheets added weekly across Math, English, and Science. Built by educators for parents, teachers, and homeschool families.</p>
    </div>

    <div class="nav-links">
      <a href="${gradeHubUrl}">← All Grade ${ws.grade} ${capitalize(ws.subject)} Worksheets</a>
      <a href="${subjectHubUrl}">← All ${capitalize(ws.subject)} Worksheets</a>
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
    count++;
  }
  console.log(`✓ Worksheet pages — ${count} individual pages generated`);
  return count;
}

module.exports = { generateWorksheetPages };
