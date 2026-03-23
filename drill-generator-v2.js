const fs = require('fs');
const intentMap = require('/opt/examel/pdf-engine/drill-intent-map.js');
const examelConfig = require('./examel-config');

function generateDrillPagesV2(worksheets, sharedCSS, siteHeader, siteFooter, gradeColor, capitalize, formatTopic, formatTheme, subjectColor, worksheetCard, getCharSVG) {

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


  const drills = worksheets.filter(ws => ws.format === 'drill-grid');
  console.log('Drill V2: ' + drills.length + ' drills, ' + intentMap.length + ' intents');

  const baseDir = '/opt/examel/examel-pages/free-math-drills';
  fs.mkdirSync(baseDir, { recursive: true });

  // Group drills by topic
  const drillsByTopic = {};
  drills.forEach(d => {
    const key = d.topic;
    if (!drillsByTopic[key]) drillsByTopic[key] = [];
    drillsByTopic[key].push(d);
  });

  // Also group by operation (for existing drills that match old topic names)
  const topicToOperation = {
    'addition': 'addition', 'subtraction': 'subtraction',
    'multiplication': 'multiplication', 'division': 'division'
  };

  // Match existing drills to intents
  // Current drills use simple topics like "addition", "multiplication"
  // New intents use specific topics like "addition-within-20", "times-table-3"
  // For now, map old topics to their grade+operation intent
  function findIntent(drill) {
    // First try exact topic match
    const exact = intentMap.find(i => i.topic === drill.topic && i.grades.includes(drill.grade));
    if (exact) return exact;
    // Fall back to operation+grade match using simple topic name
    const op = topicToOperation[drill.topic];
    if (op) {
      const gradeMatch = intentMap.find(i => i.operation === op && i.grades.includes(drill.grade) && !i.topic.includes('-'));
      if (gradeMatch) return gradeMatch;
      // Broader: any intent for this operation+grade
      return intentMap.find(i => i.operation === op && i.grades.includes(drill.grade));
    }
    return null;
  }

  // Group drills by intent
  const drillsByIntent = {};
  const unmatchedDrills = [];
  drills.forEach(d => {
    const intent = findIntent(d);
    if (intent) {
      const key = intent.topic;
      if (!drillsByIntent[key]) drillsByIntent[key] = { intent, drills: [] };
      drillsByIntent[key].drills.push(d);
    } else {
      unmatchedDrills.push(d);
    }
  });

  console.log('Matched intents: ' + Object.keys(drillsByIntent).length);
  console.log('Unmatched drills: ' + unmatchedDrills.length);

  // ── GENERATE INTENT PAGES ──
  let intentPagesGenerated = 0;

  Object.values(drillsByIntent).forEach(({ intent, drills: intentDrills }) => {
    const dir = baseDir + '/' + intent.operation + '/' + intent.topic;
    fs.mkdirSync(dir, { recursive: true });

    // Sort by grade then theme
    intentDrills.sort((a, b) => a.grade - b.grade || a.theme.localeCompare(b.theme));

    const gradeList = [...new Set(intentDrills.map(d => d.grade))].sort((a, b) => a - b);
    const gradeText = gradeList.length === 1 ? 'Grade ' + gradeList[0] : 'Grades ' + gradeList[0] + '-' + gradeList[gradeList.length - 1];
    const color = '#DC2626';
    const pageTitle = 'Free ' + intent.skill + ' Drills — Printable PDF with Answer Key';
    const metaDesc = 'Free printable ' + intent.skill.toLowerCase() + ' math drills for ' + gradeText + '. ' + intentDrills.length + '+ themed variations. Timed practice with answer keys. Download PDF instantly. CCSS aligned.';

    // Related intents (same operation, different topic)
    const relatedIntents = Object.values(drillsByIntent)
      .filter(r => r.intent.operation === intent.operation && r.intent.topic !== intent.topic)
      .slice(0, 6);

    // Related worksheets (same grades, math subject)
    const relatedWorksheets = worksheets
      .filter(w => (!w.format || w.format === 'worksheet') && w.subject === 'math' && intent.grades.includes(w.grade))
      .slice(0, 4);

    // FAQ
    const faq = [
      { q: 'How many problems are on each drill?', a: 'Each drill contains 30 problems designed for timed practice. Students typically complete them in 1-3 minutes depending on grade level and skill.' },
      { q: 'Are answer keys included?', a: 'Yes, every drill PDF includes a complete answer key on page 2. Teachers can use the answer key for self-checking or peer grading.' },
      { q: 'What Common Core standard does this cover?', a: 'These drills align with ' + intent.ccss + ': ' + intent.skill + '. They build the computational fluency required by the standard.' },
    ];

    const faqSchema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faq.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
      }))
    });

    const eduSchema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'EducationalResource',
      'name': pageTitle,
      'description': metaDesc,
      'educationalLevel': gradeText,
      'subject': 'Mathematics',
      'teaches': intent.skill,
      'keywords': intent.searchIntent + ', free printable math drills, ' + intent.ccss,
      'url': 'https://examel.com/free-math-drills/' + intent.operation + '/' + intent.topic + '/',
      'isAccessibleForFree': true,
      'provider': { '@type': 'Organization', 'name': 'Examel', 'url': 'https://examel.com' }
    });

    const drillCards = intentDrills.map(d => {
      const downloadUrl = d.pdf_url && d.pdf_url.startsWith('http') ? d.pdf_url : '#';
      const thumbUrl = d.preview_p1_url || d.preview_image_url || '/thumbnails/' + d.slug + '.png';
      const anchorId = (d.theme || 'default').replace(/[^a-z0-9]/g, '-');
      return '<a href="' + examelConfig.getPageUrl(d) + '" class="drill-card" id="' + anchorId + '">' +
        '<div class="drill-thumb">' +
          (d.preview_p1_url ? '<img src="' + thumbUrl + '" alt="' + d.title + '" loading="lazy">' : '<div class="drill-thumb-ph"><span>⚡</span></div>') +
        '</div>' +
        '<div class="drill-body">' +
          '<div class="drill-badge">Grade ' + d.grade + (d.difficulty ? ' · ' + capitalize(d.difficulty) : '') + '</div>' +
          '<h3>' + formatTheme(d.theme) + ' Theme</h3>' +
          '<p>' + d.title + '</p>' +
          '<span class="drill-btn">Download PDF →</span>' +
        '</div>' +
      '</a>';
    }).join('\n');

    const relatedIntentLinks = relatedIntents.map(r =>
      '<a href="/free-math-drills/' + r.intent.operation + '/' + r.intent.topic + '/" class="related-link">' +
        capitalize(r.intent.skill) + ' (' + r.drills.length + ' drills)</a>'
    ).join('\n');

    const relatedWSCards = relatedWorksheets.map(w =>
      '<a href="/worksheets/' + w.slug + '/" class="related-ws">' +
        '<span class="related-ws-badge">' + capitalize(w.subject) + ' · Grade ' + w.grade + '</span>' +
        '<span class="related-ws-title">' + w.title + '</span>' +
      '</a>'
    ).join('\n');

    const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
      '<meta charset="UTF-8">\n' +
      '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Crect width=\'32\' height=\'32\' rx=\'7\' fill=\'%236C5CE7\'/%3E%3Crect x=\'7\' y=\'7\' width=\'4\' height=\'18\' rx=\'1\' fill=\'white\'/%3E%3Crect x=\'7\' y=\'7\' width=\'7\' height=\'4\' rx=\'1\' fill=\'white\'/%3E%3Crect x=\'7\' y=\'14\' width=\'11\' height=\'4\' rx=\'1\' fill=\'white\'/%3E%3Crect x=\'7\' y=\'21\' width=\'15\' height=\'4\' rx=\'1\' fill=\'white\'/%3E%3C/svg%3E">\n' +
      '<meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
      '<title>' + pageTitle + ' | Examel</title>\n' +
      '<meta name="description" content="' + metaDesc + '">\n' +
      '<link rel="canonical" href="https://examel.com/free-math-drills/' + intent.operation + '/' + intent.topic + '/">\n' +
      '<meta property="og:type" content="website">\n' +
      '<meta property="og:title" content="' + pageTitle + '">\n' +
      '<meta property="og:description" content="' + metaDesc + '">\n' +
      '<meta property="og:url" content="https://examel.com/free-math-drills/' + intent.operation + '/' + intent.topic + '/">\n' +
      '<script type="application/ld+json">' + eduSchema + '</script>\n' +
      '<script type="application/ld+json">' + faqSchema + '</script>\n' +
      sharedCSS + '\n' +
      '<style>\n' +
      '.intent-hero{background:#1C1526;border-top:5px solid ' + color + ';padding:0 20px;position:relative;overflow:hidden;}\n' +
      '.intent-hero-inner{max-width:1100px;margin:0 auto;padding:52px 48px;position:relative;z-index:2;}\n' +
      '.intent-hero h1{font-size:clamp(22px,3.2vw,36px);color:white;font-weight:800;letter-spacing:-1px;line-height:1.15;margin-bottom:12px;}\n' +
      '.intent-hero h1 span{color:' + color + ';}\n' +
      '.intent-hero-sub{font-size:15px;color:rgba(255,255,255,0.5);max-width:600px;line-height:1.75;margin-bottom:20px;}\n' +
      '.intent-badges{display:flex;gap:8px;flex-wrap:wrap;}\n' +
      '.intent-badge{background:rgba(255,255,255,0.1);border-radius:100px;padding:5px 16px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);}\n' +
      '.intent-badge.ccss{background:' + color + ';color:white;}\n' +
      '.intent-content{max-width:1100px;margin:0 auto;padding:40px 20px;}\n' +
      '.intent-desc{font-size:16px;line-height:1.8;color:#4A4458;margin-bottom:36px;max-width:720px;}\n' +
      '.intent-count{font-size:14px;font-weight:700;color:#A89FAE;margin-bottom:20px;font-family:"Outfit",sans-serif;letter-spacing:0.5px;}\n' +
      '.drill-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;margin-bottom:48px;}\n' +
      '.drill-card{background:white;border-radius:16px;overflow:hidden;border:1px solid #EDE8DF;transition:transform 0.25s,box-shadow 0.25s;}\n' +
      '.drill-card:target{box-shadow:0 0 0 3px ' + color + ',0 8px 32px rgba(220,38,38,0.15);}\n' +
      '.drill-card:hover{transform:translateY(-4px);box-shadow:0 8px 32px rgba(0,0,0,0.08);}\n' +
      '.drill-thumb img{width:100%;height:140px;object-fit:cover;object-position:top;display:block;border-bottom:1px solid #EDE8DF;}\n' +
      '.drill-thumb-ph{width:100%;height:140px;background:linear-gradient(135deg,#FEF2F2,#FDE8E8);display:flex;align-items:center;justify-content:center;font-size:36px;border-bottom:1px solid #EDE8DF;}\n' +
      '.drill-body{padding:14px 16px 16px;}\n' +
      '.drill-badge{font-size:11px;font-weight:700;color:' + color + ';margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;}\n' +
      '.drill-card h3{font-size:15px;font-weight:700;color:#1A1420;margin-bottom:4px;}\n' +
      '.drill-card p{font-size:12px;color:#A89FAE;margin-bottom:12px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n' +
      '.drill-btn{font-size:13px;font-weight:700;color:' + color + ';text-decoration:none;}\n' +
      '.drill-btn:hover{text-decoration:underline;}\n' +
      '.faq-section{max-width:720px;margin:0 auto 48px;}\n' +
      '.faq-section h2{font-size:22px;font-weight:800;color:#1A1420;margin-bottom:20px;}\n' +
      '.faq-item{background:white;border-radius:12px;padding:20px 24px;margin-bottom:12px;border:1px solid #EDE8DF;}\n' +
      '.faq-item h3{font-size:15px;font-weight:700;color:#1A1420;margin-bottom:8px;}\n' +
      '.faq-item p{font-size:14px;color:#6B6475;line-height:1.7;}\n' +
      '.related-section{max-width:1100px;margin:0 auto 48px;padding:0 20px;}\n' +
      '.related-section h2{font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;}\n' +
      '.related-links{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:32px;}\n' +
      '.related-link{padding:8px 18px;border-radius:100px;background:white;border:1px solid #EDE8DF;font-size:13px;font-weight:600;color:#6B6475;text-decoration:none;transition:all 0.2s;}\n' +
      '.related-link:hover{border-color:' + color + ';color:' + color + ';}\n' +
      '.related-ws{display:block;background:white;border-radius:12px;padding:16px;border:1px solid #EDE8DF;text-decoration:none;transition:transform 0.2s;margin-bottom:8px;}\n' +
      '.related-ws:hover{transform:translateX(4px);}\n' +
      '.related-ws-badge{font-size:11px;font-weight:700;color:#6C5CE7;display:block;margin-bottom:4px;}\n' +
      '.related-ws-title{font-size:14px;font-weight:600;color:#1A1420;}\n' +
      '</style>\n</head>\n<body>\n' +
      siteHeader + '\n' +
      '<div class="breadcrumb">\n' +
        '<a href="https://examel.com">Home</a><span class="sep">›</span>\n' +
        '<a href="/free-math-drills/">Math Drills</a><span class="sep">›</span>\n' +
        '<a href="/free-math-drills/' + intent.operation + '/">' + capitalize(intent.operation) + '</a><span class="sep">›</span>\n' +
        intent.skill + '\n' +
      '</div>\n' +
      '<div class="intent-hero">\n' +
        '<div class="intent-hero-inner">\n' +
          '<h1>Free <span>' + intent.skill + '</span> Drills</h1>\n' +
          '<p class="intent-hero-sub">' + metaDesc + '</p>\n' +
          '<div class="intent-badges">\n' +
            '<span class="intent-badge">' + gradeText + '</span>\n' +
            '<span class="intent-badge">' + intentDrills.length + ' themed drills</span>\n' +
            '<span class="intent-badge">Answer keys included</span>\n' +
            '<span class="intent-badge ccss">' + intent.ccss + '</span>\n' +
          '</div>\n' +
        '</div>\n' +
      '</div>\n' +
      '<div class="intent-content">\n' +
        '<p class="intent-desc">' + intent.description + '</p>\n' +
        '<p class="intent-count">' + intentDrills.length + ' THEMED DRILLS AVAILABLE — PICK YOUR FAVORITE</p>\n' +
        '<div class="drill-grid">\n' + drillCards + '\n</div>\n' +
      '</div>\n' +
      '<div class="faq-section">\n' +
        '<h2>Frequently Asked Questions</h2>\n' +
        faq.map(f => '<div class="faq-item"><h3>' + f.q + '</h3><p>' + f.a + '</p></div>').join('\n') + '\n' +
      '</div>\n' +
      (relatedIntents.length > 0 ? '<div class="related-section">\n' +
        '<h2>More ' + capitalize(intent.operation) + ' Drills</h2>\n' +
        '<div class="related-links">\n' + relatedIntentLinks + '\n</div>\n' +
      '</div>\n' : '') +
      (relatedWorksheets.length > 0 ? '<div class="related-section">\n' +
        '<h2>Related Math Worksheets</h2>\n' + relatedWSCards + '\n' +
      '</div>\n' : '') +
      siteFooter + '\n</body>\n</html>';

    fs.writeFileSync(dir + '/index.html', html);
    intentPagesGenerated++;
  });

  // ── OPERATION HUB PAGES ──
  const operations = ['addition', 'subtraction', 'multiplication', 'division'];
  operations.forEach(op => {
    const opIntents = Object.values(drillsByIntent).filter(d => d.intent.operation === op);
    if (opIntents.length === 0) return;

    const dir = baseDir + '/' + op;
    fs.mkdirSync(dir, { recursive: true });

    const totalDrills = opIntents.reduce((s, d) => s + d.drills.length, 0);
    const opTitle = 'Free ' + capitalize(op) + ' Drills — Printable Math Practice';

    const intentCards = opIntents.map(({ intent, drills: d }) =>
      '<a href="/free-math-drills/' + intent.operation + '/' + intent.topic + '/" class="hub-card">' +
        '<div class="hub-card-count">' + d.length + ' drills</div>' +
        '<h3>' + intent.skill + '</h3>' +
        '<p>' + intent.grades.map(g => 'Grade ' + g).join(', ') + '</p>' +
      '</a>'
    ).join('\n');

    const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
      '<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
      '<title>' + opTitle + ' | Examel</title>\n' +
      '<meta name="description" content="Free printable ' + op + ' math drills for Grades 1-6. ' + totalDrills + '+ themed worksheets with answer keys. Download PDF instantly.">\n' +
      '<link rel="canonical" href="https://examel.com/free-math-drills/' + op + '/">\n' +
      '<script type="application/ld+json">' + JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":"Free " + capitalize(op) + " Drills","description":"Free printable " + op + " math drills for Grades 1-6. " + totalDrills + "+ themed worksheets with answer keys.","url":"https://examel.com/free-math-drills/" + op + "/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}) + '</script>\n' +
      '<meta property="og:type" content="website">\n' +
      '<meta property="og:title" content="Free ' + capitalize(op) + ' Drills | Grades 1-6 | Examel">\n' +
      '<meta property="og:description" content="Free printable ' + op + ' math drills for Grades 1-6. ' + totalDrills + '+ themed worksheets with answer keys.">\n' +
      '<meta property="og:image" content="https://examel.com/og-default.png">\n' +
      '<meta property="og:url" content="https://examel.com/free-math-drills/' + op + '/">\n' +
      sharedCSS + '\n' +
      '<style>\n' +
      '.hub-hero{background:#1C1526;padding:52px 20px;text-align:center;border-top:5px solid #DC2626;}\n' +
      '.hub-hero h1{font-size:clamp(24px,3.5vw,42px);color:white;font-weight:800;margin-bottom:14px;letter-spacing:-1px;}\n' +
      '.hub-hero h1 span{color:#DC2626;}\n' +
      '.hub-hero p{font-size:16px;color:rgba(255,255,255,0.5);max-width:560px;margin:0 auto;line-height:1.7;}\n' +
      '.hub-content{max-width:1100px;margin:0 auto;padding:40px 20px 64px;}\n' +
      '.hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}\n' +
      '.hub-card{background:white;border-radius:16px;padding:24px;border:1px solid #EDE8DF;text-decoration:none;color:#1A1420;transition:transform 0.2s,box-shadow 0.2s;display:block;}\n' +
      '.hub-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.08);}\n' +
      '.hub-card-count{font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}\n' +
      '.hub-card h3{font-size:16px;font-weight:700;margin-bottom:6px;}\n' +
      '.hub-card p{font-size:13px;color:#A89FAE;}\n' +
      '</style>\n</head>\n<body>\n' +
      siteHeader + '\n' +
      '<div class="breadcrumb"><a href="https://examel.com">Home</a><span class="sep">›</span><a href="/free-math-drills/">Math Drills</a><span class="sep">›</span>' + capitalize(op) + '</div>\n' +
      '<div class="hub-hero"><h1>Free <span>' + capitalize(op) + '</span> Drills</h1><p>' + totalDrills + '+ free printable ' + op + ' drills with answer keys. From basic facts to multi-digit computation.</p></div>\n' +
      '<div class="hub-content"><div class="hub-grid">' + intentCards + '</div></div>\n' +
      siteFooter + '\n</body>\n</html>';

    fs.writeFileSync(dir + '/index.html', html);
    intentPagesGenerated++;
  });

  // ── MAIN DRILL HUB ──
  const totalAllDrills = drills.length;
  const mainHubCards = operations.map(op => {
    const opDrills = drills.filter(d => {
      const intent = findIntent(d);
      return intent && intent.operation === op;
    });
    return '<a href="/free-math-drills/' + op + '/" class="hub-card">' +
      '<div class="hub-card-count">' + opDrills.length + ' drills</div>' +
      '<h3>' + capitalize(op) + ' Drills</h3>' +
      '<p>Grades 1-6 · All themes</p>' +
    '</a>';
  }).join('\n');

  const mainHTML = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '<title>Free Math Drills — Printable PDF with Answer Keys | Examel</title>\n' +
    '<meta name="description" content="Free printable math drills for Grades 1-6. ' + totalAllDrills + '+ themed worksheets covering addition, subtraction, multiplication, and division. Download PDF instantly.">\n' +
    '<link rel="canonical" href="https://examel.com/free-math-drills/">\n' +
    '<script type="application/ld+json">' + JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":"Free Math Drills for Kids","description":"Free printable math drills for Grades 1-6. " + totalAllDrills + "+ themed worksheets covering addition, subtraction, multiplication, and division. Answer keys included.","url":"https://examel.com/free-math-drills/","publisher":{"@type":"Organization","name":"Examel","url":"https://examel.com"}}) + '</script>\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:title" content="Free Math Drills for Kids | Grades 1-6 | Examel">\n' +
    '<meta property="og:description" content="Free printable math drills for Grades 1-6. Addition, subtraction, multiplication and division drills with answer keys.">\n' +
    '<meta property="og:image" content="https://examel.com/og-default.png">\n' +
    '<meta property="og:url" content="https://examel.com/free-math-drills/">\n' +
    sharedCSS + '\n' +
    '<style>\n' +
    '.hub-hero{background:#1C1526;padding:52px 20px;text-align:center;border-top:5px solid #DC2626;}\n' +
    '.hub-hero h1{font-size:clamp(24px,3.5vw,42px);color:white;font-weight:800;margin-bottom:14px;letter-spacing:-1px;}\n' +
    '.hub-hero h1 span{color:#DC2626;}\n' +
    '.hub-hero p{font-size:16px;color:rgba(255,255,255,0.5);max-width:560px;margin:0 auto;line-height:1.7;}\n' +
    '.hub-content{max-width:1100px;margin:0 auto;padding:40px 20px 64px;}\n' +
    '.hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}\n' +
    '.hub-card{background:white;border-radius:16px;padding:24px;border:1px solid #EDE8DF;text-decoration:none;color:#1A1420;transition:transform 0.2s,box-shadow 0.2s;display:block;}\n' +
    '.hub-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.08);}\n' +
    '.hub-card-count{font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}\n' +
    '.hub-card h3{font-size:16px;font-weight:700;margin-bottom:6px;}\n' +
    '.hub-card p{font-size:13px;color:#A89FAE;}\n' +
    '</style>\n</head>\n<body>\n' +
    siteHeader + '\n' +
    '<div class="breadcrumb"><a href="https://examel.com">Home</a><span class="sep">›</span>Math Drills</div>\n' +
    '<div class="hub-hero"><h1>Free <span>Math Drills</span></h1><p>' + totalAllDrills + '+ free printable math drills with answer keys. Themed practice sheets for addition, subtraction, multiplication, and division.</p></div>\n' +
    '<div class="hub-content"><div class="hub-grid">' + mainHubCards + '</div></div>\n' +
    siteFooter + '\n</body>\n</html>';

  fs.writeFileSync(baseDir + '/index.html', mainHTML);
  intentPagesGenerated++;

  console.log('Drill V2: ' + intentPagesGenerated + ' pages generated (' + Object.keys(drillsByIntent).length + ' intent + ' + operations.length + ' operation hubs + 1 main hub)');

  // Return sitemap entries
  const sitemapEntries = [];
  sitemapEntries.push('/free-math-drills/');
  operations.forEach(op => sitemapEntries.push('/free-math-drills/' + op + '/'));
  Object.values(drillsByIntent).forEach(({ intent }) => {
    sitemapEntries.push('/free-math-drills/' + intent.operation + '/' + intent.topic + '/');
  });
  return sitemapEntries;
}

module.exports = { generateDrillPagesV2 };
