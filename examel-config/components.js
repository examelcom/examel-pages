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
  buildCharSVG,
  buildAnswerBadge,
  buildEmailCapture,
  buildSchema,
  buildOG,
  buildContentBlock,
  buildDrillNavLinks
};

// ── CHARACTER SVGs (Maya=math, Leo=english/reading/vocab, Zoe=science, Max=default) ──
function buildCharSVG(subject) {
  if (subject === 'math') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(108,92,231,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#6C5CE7"/><path d="M16 96 Q60 86 104 96 L108 124 Q60 134 12 124 Z" fill="#7C6CF7"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="60" cy="68" rx="38" ry="42" fill="#C8874A"/><ellipse cx="60" cy="32" rx="40" ry="22" fill="#1A0A00"/><circle cx="38" cy="36" r="14" fill="#1A0A00"/><circle cx="60" cy="28" r="16" fill="#1A0A00"/><circle cx="82" cy="36" r="14" fill="#1A0A00"/><path d="M26 42 Q20 62 24 82" fill="#1A0A00"/><path d="M94 42 Q100 62 96 82" fill="#1A0A00"/><path d="M80,30 Q90,20 96,28 Q90,26 88,32 Z" fill="#FF85A1"/><path d="M96,28 Q106,20 110,30 Q104,28 102,34 Z" fill="#FF6B8E"/><circle cx="96" cy="30" r="6" fill="#FF85A1"/><circle cx="48" cy="66" r="14" fill="white"/><circle cx="72" cy="66" r="14" fill="white"/><circle cx="49" cy="67" r="10" fill="#3D1F00"/><circle cx="73" cy="67" r="10" fill="#3D1F00"/><circle cx="53" cy="62" r="5" fill="white"/><circle cx="77" cy="62" r="5" fill="white"/><circle cx="49" cy="68" r="3.5" fill="#0A0500"/><circle cx="73" cy="68" r="3.5" fill="#0A0500"/><path d="M38 54 Q48 48 58 53" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M62 53 Q72 48 82 54" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><circle cx="66" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><path d="M46 88 Q60 100 74 88" stroke="#C05030" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="80" r="10" fill="#FF9999" opacity="0.2"/><circle cx="80" cy="80" r="10" fill="#FF9999" opacity="0.2"/></svg>';
  if (subject === 'english' || subject === 'reading' || subject === 'vocab') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(8,145,178,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#0891B2"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="60" cy="68" rx="40" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="30" rx="38" ry="22" fill="#6B3A2A"/><ellipse cx="26" cy="52" rx="13" ry="20" fill="#6B3A2A"/><ellipse cx="94" cy="52" rx="13" ry="20" fill="#6B3A2A"/><circle cx="48" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><circle cx="72" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><path d="M63 66 Q62 64 61 66" stroke="#4A3728" stroke-width="3" fill="none"/><circle cx="48" cy="66" r="10" fill="white"/><circle cx="72" cy="66" r="10" fill="white"/><circle cx="49" cy="67" r="7" fill="#3A2010"/><circle cx="73" cy="67" r="7" fill="#3A2010"/><circle cx="52" cy="63" r="3.5" fill="white"/><circle cx="76" cy="63" r="3.5" fill="white"/><circle cx="49" cy="68" r="2.5" fill="#0A0500"/><circle cx="73" cy="68" r="2.5" fill="#0A0500"/><path d="M50 88 Q60 98 70 88" stroke="#C06050" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/><circle cx="84" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/></svg>';
  if (subject === 'science') return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(5,150,105,0.12)"/><rect x="18" y="70" width="84" height="54" rx="18" fill="#F8F8F8"/><rect x="30" y="76" width="60" height="28" rx="12" fill="#0D9488"/><ellipse cx="34" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="86" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="60" cy="66" rx="42" ry="46" fill="#7B3F0E"/><ellipse cx="60" cy="26" rx="42" ry="24" fill="#0A0500"/><circle cx="32" cy="28" r="22" fill="#0A0500"/><circle cx="88" cy="28" r="22" fill="#0A0500"/><ellipse cx="32" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="88" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="32" cy="49" rx="9" ry="4" fill="#FBBF24"/><ellipse cx="88" cy="49" rx="9" ry="4" fill="#FBBF24"/><rect x="20" y="54" width="14" height="52" rx="7" fill="#0A0500"/><rect x="86" y="54" width="14" height="52" rx="7" fill="#0A0500"/><circle cx="27" cy="95" r="6" fill="#F59E0B" stroke="#0A0500" stroke-width="1.5"/><circle cx="93" cy="95" r="6" fill="#10B981" stroke="#0A0500" stroke-width="1.5"/><circle cx="48" cy="64" r="16" fill="white"/><circle cx="72" cy="64" r="16" fill="white"/><circle cx="49" cy="65" r="11" fill="#1A0500"/><circle cx="73" cy="65" r="11" fill="#1A0500"/><circle cx="53" cy="60" r="5.5" fill="white"/><circle cx="77" cy="60" r="5.5" fill="white"/><circle cx="49" cy="66" r="4" fill="#050100"/><circle cx="73" cy="66" r="4" fill="#050100"/><ellipse cx="48" cy="78" rx="10" ry="8" fill="#C05030" opacity="0.9"/><ellipse cx="48" cy="78" rx="7" ry="5" fill="white" opacity="0.9"/><circle cx="36" cy="72" r="12" fill="#FF8C69" opacity="0.25"/><circle cx="84" cy="72" r="12" fill="#FF8C69" opacity="0.25"/></svg>';
  // Max — default/drill
  return '<svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="108" rx="36" ry="8" fill="rgba(239,68,68,0.12)"/><rect x="22" y="74" width="80" height="60" rx="18" fill="#EF4444"/><ellipse cx="62" cy="70" rx="10" ry="9" fill="#FDBCB4"/><ellipse cx="60" cy="46" rx="42" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="10" rx="40" ry="22" fill="#3D1F00"/><path d="M22 18 Q46 2 96 6 Q108 12 112 24" fill="#3D1F00"/><rect x="22" y="10" width="76" height="13" rx="6.5" fill="#EF4444"/><circle cx="44" cy="44" r="14" fill="white"/><circle cx="76" cy="44" r="14" fill="white"/><circle cx="45" cy="45" r="9" fill="#3D1F00"/><circle cx="77" cy="45" r="9" fill="#3D1F00"/><circle cx="48" cy="41" r="4.5" fill="white"/><circle cx="80" cy="41" r="4.5" fill="white"/><circle cx="45" cy="46" r="3" fill="#0A0500"/><circle cx="77" cy="46" r="3" fill="#0A0500"/><path d="M40 66 Q60 84 80 66" stroke="#C06050" stroke-width="3" fill="#FF9999" stroke-linecap="round"/><path d="M44 68 Q60 78 76 68" fill="white"/><circle cx="28" cy="58" r="11" fill="#FF9999" opacity="0.25"/><circle cx="92" cy="58" r="11" fill="#FF9999" opacity="0.25"/></svg>';
}
