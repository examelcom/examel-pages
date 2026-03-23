/**
 * EXAMEL SHARED COMPONENTS — Single source for all reusable HTML blocks
 * Every generator imports from here. Change once, applies everywhere.
 */

const { getDrillTopicUrl, getDrillGradeUrl, sanitize } = require('./urls');

// ── ANSWER BADGE ──
function buildAnswerBadge() {
  return `<div style="max-width:680px;margin:0 auto 20px;padding:16px 24px;background:white;border-radius:16px;display:flex;align-items:center;gap:14px;border:1px solid #E0D8EC;box-shadow:0 2px 8px rgba(0,0,0,0.04);"><span style="font-size:28px;">✓</span><div><strong style="font-family:Outfit,sans-serif;font-size:14px;color:#1A1420;">Every Answer Verified</strong><p style="font-size:13px;color:#6B6475;margin:0;line-height:1.5;">All worksheets checked by our AI verification system. No wrong answers — guaranteed.</p></div></div>`;
}

// ── EMAIL CAPTURE (Klaviyo) ──
function buildEmailCapture() {
  return `<div class="klaviyo-form-X45k9d"></div>
<script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/VruXqp/klaviyo.js?company_id=VruXqp"></script>`;
}

// ── SCHEMA.ORG ──
function buildSchema(data) {
  const schema = {
    "@context": "https://schema.org",
    "@type": data.type || "EducationalResource",
    "name": (data.title || '').replace(/"/g, '\\"'),
    "description": (data.description || '').replace(/"/g, '\\"').substring(0, 200),
    "url": data.url || 'https://examel.com',
    "publisher": { "@type": "Organization", "name": "Examel", "url": "https://examel.com" }
  };
  if (data.grade) schema.educationalLevel = "Grade " + data.grade;
  if (data.subject) schema.subject = data.subject;
  if (data.teaches) schema.teaches = data.teaches;
  if (data.thumbnail) schema.thumbnailUrl = data.thumbnail;
  if (data.isFree !== false) schema.isAccessibleForFree = true;
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// ── OG TAGS ──
function buildOG(data) {
  return `<meta property="og:type" content="website">
  <meta property="og:title" content="${(data.title || '').replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${(data.description || '').replace(/"/g, '&quot;').substring(0, 200)}">
  <meta property="og:image" content="${data.image || 'https://examel.com/og-default.png'}">
  <meta property="og:url" content="${data.url || 'https://examel.com'}">`;
}

// ── CONTENT BLOCK (renders ws.content JSON) ──
function buildContentBlock(ws) {
  if (!ws.content) return '';
  try {
    const p = typeof ws.content === 'string' ? JSON.parse(ws.content) : ws.content;
    let h = '<div style="background:white;border-radius:12px;padding:24px;margin-bottom:20px;">';
    
    if (p.learning_objective) {
      h += `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:8px;font-family:Outfit,sans-serif;">Learning Objective</div>`;
      h += `<p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:16px;">${p.learning_objective}</p>`;
    }
    if (p.story_intro) {
      h += `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:8px;font-family:Outfit,sans-serif;">About This Activity</div>`;
      h += `<p style="font-size:15px;color:#3D3347;line-height:1.8;font-style:italic;margin-bottom:16px;">${p.story_intro}</p>`;
    }
    if (p.teacher_note) {
      h += `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:8px;font-family:Outfit,sans-serif;">Teacher Tip</div>`;
      h += `<p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:16px;">${p.teacher_note}</p>`;
    }
    if (p.questions && p.questions.length > 0) {
      const shown = p.questions.slice(0, 3);
      const remaining = p.questions.length - shown.length;
      h += `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6C5CE7;margin-bottom:8px;font-family:Outfit,sans-serif;">Sample Questions</div>`;
      h += '<ul style="font-size:14px;color:#4A3F55;line-height:1.8;padding-left:20px;margin-bottom:8px;">';
      shown.forEach(q => { h += `<li>${q.question || q}</li>`; });
      h += '</ul>';
      if (remaining > 0) h += `<p style="font-size:13px;color:#6B6475;font-style:italic;">...plus ${remaining} more questions in the full worksheet</p>`;
    }
    if (p.student_instructions) {
      h += `<p style="font-size:13px;color:#6B6475;margin-top:12px;border-top:1px solid #f0f0f0;padding-top:12px;"><strong>Instructions:</strong> ${p.student_instructions}</p>`;
    }
    if (p.ccss_standard) {
      h += `<p style="font-size:13px;color:#6B6475;margin-top:8px;"><strong>Standard:</strong> ${p.ccss_standard}</p>`;
    }
    h += '</div>';
    return h;
  } catch(e) { return ''; }
}

// ── NAV LINKS FOR DRILL PAGES ──
function buildDrillNavLinks(ws, formatTopic) {
  const topicName = formatTopic ? formatTopic(ws.topic) : ws.topic;
  const subject = sanitize(ws.subject);
  return `<div class="nav-links">
    <a href="${getDrillGradeUrl(subject, ws.grade)}">← All Grade ${ws.grade} Math Drills</a>
    <a href="${getDrillTopicUrl(ws.topic)}">← All ${topicName} Drills</a>
    <a href="/free-math-drills/">← All Math Drills</a>
    <a href="https://examel.com">← Examel Home</a>
  </div>`;
}

module.exports = {
  buildAnswerBadge,
  buildEmailCapture,
  buildSchema,
  buildOG,
  buildContentBlock,
  buildDrillNavLinks
};
