/**
 * TOPIC HUB GENERATOR
 * Generates topic hub pages → /free-{subject}-worksheets/{topic}/
 * Builds topicMap internally from worksheets array.
 * Usage: called from generate-pages.js orchestrator
 */

'use strict';
const fs = require('fs');
const {
  buildSchema, buildOG, buildAnswerBadge, buildEmailCapture, buildAnalytics} = require('./examel-config');

const TOPIC_EDUCATION = {
  'math|multiplication': { intro: 'Multiplication is one of the most important math skills. Our worksheets cover basic facts (times tables 2-12), multi-digit multiplication, word problems, and real-world applications.', ccss: 'CCSS 3.OA.A.1-C.7, 4.OA.A, 5.NBT.B.5', progression: 'Single-digit facts → times tables → multi-digit multiplication.' },
  'math|addition': { intro: 'Addition is the foundation of all math learning. Our worksheets progress from single-digit facts through multi-digit addition with regrouping and word problems.', ccss: 'CCSS 1.OA.C.6, 2.OA.B.2, 2.NBT.B.5-9, 3.NBT.A.2', progression: 'Adding within 10 → within 20 → 2-digit and 3-digit with regrouping.' },
  'math|subtraction': { intro: 'Subtraction prepares students for multiplication and division. Our worksheets cover basic facts, borrowing/regrouping, multi-digit subtraction, and word problems.', ccss: 'CCSS 1.OA.C.6, 2.OA.B.2, 2.NBT.B.5-9, 3.NBT.A.2', progression: 'Within 10 → within 20 → multi-digit with borrowing.' },
  'math|fractions': { intro: 'Fractions are a critical Grade 3-5 skill. Our worksheets cover identifying, equivalent, comparing, adding, subtracting, and word problems.', ccss: 'CCSS 3.NF.A.1-3, 4.NF.A-C, 5.NF.A-B', progression: 'Identifying → comparing → operations with like and unlike denominators.' },
  'math|division': { intro: 'Division completes the four basic operations. Our worksheets cover basic facts, long division, remainders, and word problems.', ccss: 'CCSS 3.OA.A.2-4, 4.NBT.B.6, 5.NBT.B.6', progression: 'Basic facts → division within 100 → long division.' },
  'english|reading comprehension': { intro: 'Reading comprehension builds every ELA skill at once. Our passages include grade-appropriate nonfiction text with questions on main idea, inference, vocabulary, and text evidence.', ccss: 'CCSS ELA RI.1-6, RL.1-6', progression: 'Short passages with recall → longer passages with inferential questions.' },
  'english|parts of speech': { intro: 'Parts of speech are the foundation of grammar mastery. Our worksheets cover nouns, verbs, adjectives, adverbs, pronouns, prepositions, and conjunctions.', ccss: 'CCSS Language L.1-6.1', progression: 'Identifying nouns/verbs → adjectives/adverbs → using in writing.' },
  'science|ecosystems': { intro: 'Ecosystems teach how living things interact. Our worksheets cover habitats, food chains, producers/consumers, adaptations, and energy flow.', ccss: 'NGSS + Common Core literacy for science', progression: 'Basic needs → habitats and food chains → complex interactions.' }
};

function generateTopicHubs(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const { gradeColor, capitalize, formatTopic, worksheetCard, buildEmailCapture: _unused } = helpers;

  const favicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E`;

  // Build topicMap internally
  const topicMap = {};
  for (const ws of worksheets) {
    if (ws.format && ws.format !== 'worksheet') continue;
    const subj  = (ws.subject || '').toLowerCase();
    const topic = (ws.topic || '').toLowerCase().replace(/ /g, '-');
    const key   = subj + '|' + topic;
    if (!topicMap[key]) topicMap[key] = { subject: subj, topic, worksheets: [] };
    topicMap[key].worksheets.push(ws);
  }

  let count = 0;
  for (const [key, data] of Object.entries(topicMap)) {
    if (data.worksheets.length < 3) continue;

    const subj         = data.subject;
    const topic        = data.topic;
    const topicDisplay = formatTopic(topic);
    const topicSlug    = topic.replace(/ /g, '-');
    const eduKey       = subj + '|' + topic.replace(/-/g, ' ');
    const edu          = TOPIC_EDUCATION[eduKey] || {
      intro: `Practice ${topicDisplay.toLowerCase()} with our printable worksheets for Grades 1-6. Each worksheet includes an answer key aligned to Common Core standards.`,
      ccss: '', progression: ''
    };

    const byGrade = {};
    for (const ws of data.worksheets) {
      if (!byGrade[ws.grade]) byGrade[ws.grade] = [];
      byGrade[ws.grade].push(ws);
    }
    const gradesAvailable = Object.keys(byGrade).sort((a, b) => a - b);
    const totalCount      = data.worksheets.length;
    const canonicalUrl    = `https://examel.com/free-${subj}-worksheets/${topicSlug}/`;

    const relatedTopics = Object.values(topicMap)
      .filter(t => t.subject === subj && t.topic !== topic && t.worksheets.length >= 3)
      .sort((a, b) => b.worksheets.length - a.worksheets.length)
      .slice(0, 6);

    const dir = `/opt/examel/examel-pages/free-${subj}-worksheets/${topicSlug}`;
    fs.mkdirSync(dir, { recursive: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${favicon}>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${topicDisplay} Worksheets | Grades ${gradesAvailable[0]}-${gradesAvailable[gradesAvailable.length - 1]} | Printable PDF | Examel</title>
  <meta name="description" content="Free printable ${topicDisplay.toLowerCase()} worksheets for Grades ${gradesAvailable[0]}-${gradesAvailable[gradesAvailable.length - 1]}. ${totalCount}+ worksheets with answer keys. Download PDF instantly. Common Core aligned.">
  <link rel="canonical" href="${canonicalUrl}">
  ${buildOG({ title: `Free ${topicDisplay} Worksheets | Examel`, description: `${totalCount}+ printable ${topicDisplay.toLowerCase()} worksheets with answer keys.`, url: canonicalUrl })}
  ${buildSchema({ type: 'CollectionPage', title: `Free ${topicDisplay} Worksheets`, description: `${totalCount}+ free ${topicDisplay.toLowerCase()} worksheets`, url: canonicalUrl })}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <div class="breadcrumb">
    <a href="https://examel.com">Home</a><span class="sep">›</span>
    <a href="/free-${subj}-worksheets/">Free ${capitalize(subj)} Worksheets</a><span class="sep">›</span>
    ${topicDisplay}
  </div>
  <div class="hero">
    <h1>Free <span>${topicDisplay}</span> Worksheets</h1>
    <p>${totalCount}+ printable ${topicDisplay.toLowerCase()} worksheets for Grades ${gradesAvailable[0]}-${gradesAvailable[gradesAvailable.length - 1]}. Answer keys included. Common Core aligned.</p>
  </div>
  ${buildAnswerBadge()}
  <div style="max-width:680px;margin:0 auto 40px;padding:0 20px;">
    <div style="background:white;border-radius:20px;padding:32px;border:1px solid #EDE8DF;">
      <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:12px;">About ${topicDisplay} Practice</h2>
      <p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:14px;">${edu.intro}</p>
      ${edu.ccss ? `<p style="font-size:14px;color:#6B6475;line-height:1.7;margin-bottom:14px;"><strong>Standards:</strong> ${edu.ccss}</p>` : ''}
      ${edu.progression ? `<p style="font-size:14px;color:#6B6475;line-height:1.7;"><strong>Skill progression:</strong> ${edu.progression}</p>` : ''}
    </div>
  </div>
  ${buildEmailCapture()}
  <div style="max-width:1100px;margin:0 auto 32px;padding:0 20px;">
    <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;text-align:center;">Browse by Grade</h2>
  </div>
  <div class="hub-grid" data-pagefind-body>
    <span data-pagefind-filter="format" hidden>Hub</span>
    ${gradesAvailable.map(g => {
      const cnt = byGrade[g] ? byGrade[g].length : 0;
      return `<a href="/free-${subj}-worksheets/grade-${g}/" class="hub-card" style="border-top:3px solid ${gradeColor(parseInt(g))}">
        <span class="hub-icon">📄</span>
        <h3>Grade ${g}</h3>
        <p>${cnt} worksheets</p>
      </a>`;
    }).join('')}
  </div>
  <div style="max-width:1100px;margin:32px auto 0;padding:0 20px;">
    <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;">Latest ${topicDisplay} Worksheets</h2>
  </div>
  <div class="grid">
    ${data.worksheets.slice(0, 12).map(worksheetCard).join('')}
  </div>
  ${relatedTopics.length > 0 ? `
  <div style="max-width:680px;margin:48px auto 0;padding:0 20px;">
    <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;text-align:center;">Related ${capitalize(subj)} Topics</h2>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
      ${relatedTopics.map(rt => `<a href="/free-${subj}-worksheets/${rt.topic.replace(/ /g, '-')}/" style="padding:10px 20px;background:white;border:2px solid #EDE8DF;border-radius:100px;text-decoration:none;color:#1A1420;font-size:14px;font-weight:600;font-family:Outfit,sans-serif;">${formatTopic(rt.topic)} (${rt.worksheets.length})</a>`).join('')}
    </div>
  </div>` : ''}
  <div style="max-width:680px;margin:40px auto;padding:0 20px;text-align:center;">
    <a href="/free-${subj}-worksheets/" style="color:#6C5CE7;text-decoration:none;font-weight:700;font-family:Outfit,sans-serif;font-size:15px;">← All ${capitalize(subj)} Worksheets</a>
  </div>
  ${siteFooter}
</body>
</html>`;

    fs.writeFileSync(`${dir}/index.html`, html);
    count++;
  }
  console.log(`✓ Topic hub pages — ${count} pages generated`);
  return count;
}

module.exports = { generateTopicHubs };
