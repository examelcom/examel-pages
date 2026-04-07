/**
 * GRADE-TOPIC HUB GENERATOR
 * Generates grade+topic hub pages → /free-{subject}-worksheets/grade-{N}/{canonical_topic}/
 * 
 * This is the Tier 3 SEO engine — the most important new page type for organic traffic.
 * Each page targets "grade N [topic] worksheets" queries.
 *
 * Architecture:
 *   1. Loads topic-canonical-map.json
 *   2. Maps every worksheet's raw topic → canonical parent topic
 *   3. Groups by {subject, grade, canonical_topic}
 *   4. Generates pages for combos with 5+ worksheets AND valid CCSS grade
 *   5. Embeds LearningResource JSON-LD structured data
 *   6. Generates cross-grade navigation links
 *
 * Usage: called from generate-pages.js orchestrator
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const { buildSchema, buildOG, buildAnswerBadge, buildEmailCapture, buildAnalytics, getPageUrl } = require('./examel-config');

const BASE = '/opt/examel/examel-pages';
const MIN_WORKSHEETS = 5;

// ── Load canonical map ──
const CANONICAL_MAP = JSON.parse(
  fs.readFileSync(path.join(BASE, 'topic-canonical-map.json'), 'utf8')
);

// ── Build reverse lookup: raw_topic → { subject, canonical_slug, display_name, valid_grades } ──
const REVERSE_MAP = {};
for (const [subject, topics] of Object.entries(CANONICAL_MAP)) {
  if (subject.startsWith('_')) continue; // skip meta keys
  for (const [, topicDef] of Object.entries(topics)) {
    for (const raw of topicDef.raw_topics) {
      REVERSE_MAP[`${subject}|${raw}`] = {
        subject,
        canonical_slug: topicDef.canonical_slug,
        display_name: topicDef.display_name,
        valid_grades: topicDef.valid_grades,
        tier_a: topicDef.tier_a_content || false
      };
    }
  }
}

// ── Excluded topics (format artifacts, game seeder compounds, planners) ──
const EXCLUDED_SET = new Set();
if (CANONICAL_MAP._excluded_topics) {
  for (const arr of Object.values(CANONICAL_MAP._excluded_topics)) {
    if (Array.isArray(arr)) arr.forEach(t => EXCLUDED_SET.add(t.toLowerCase()));
  }
}

// ── Tier A content: hand-written educational sections for top pages ──
const TIER_A_CONTENT = {
  'math|addition': {
    grades: {
      1: 'In first grade, students build fluency with addition facts within 20. They learn strategies like counting on, making ten, and using doubles. By year\'s end, students should know all sums within 20 from memory (CCSS 1.OA.C.6). These worksheets provide the repetitive practice that builds automatic recall.',
      2: 'Second graders extend addition to two and three-digit numbers. They learn regrouping (carrying) and use place value understanding to add within 1,000 (CCSS 2.NBT.B.5-9). Our worksheets progress from no-regrouping problems to multi-step addition with carrying.',
      3: 'Third grade addition focuses on fluency within 1,000 and mental math strategies (CCSS 3.NBT.A.2). Students solve multi-step word problems requiring addition combined with other operations. These worksheets include both computation practice and applied word problems.'
    }
  },
  'math|subtraction': {
    grades: {
      1: 'First graders learn subtraction as "taking away" and as finding the difference. They master facts within 20 using strategies like counting back and relating to addition (CCSS 1.OA.C.6). These worksheets build from concrete picture-based problems to abstract number sentences.',
      2: 'Second grade subtraction introduces borrowing (regrouping) with two and three-digit numbers (CCSS 2.NBT.B.5-9). Students learn when and how to regroup across place values. Our worksheets provide scaffolded practice from no-borrowing to multi-step borrowing problems.'
    }
  },
  'math|multiplication': {
    grades: {
      2: 'Second graders are introduced to multiplication through equal groups, arrays, and repeated addition. This conceptual foundation prepares them for fluency work in third grade. These worksheets use visual models to help students understand what multiplication means before memorizing facts.',
      3: 'Third grade is the critical year for multiplication mastery. Students must know all products of two one-digit numbers from memory by year\'s end (CCSS 3.OA.C.7). Our worksheets cover times tables 2-12, arrays, equal groups, properties of multiplication, and word problems. This is the single most practiced skill in elementary math.',
      4: 'Fourth graders extend multiplication to multi-digit problems: multiplying up to four-digit numbers by one-digit numbers, and two-digit by two-digit using strategies based on place value (CCSS 4.NBT.B.5). Worksheets progress from single-digit review to the standard algorithm.',
      5: 'Fifth grade multiplication applies to larger numbers and decimals. Students multiply multi-digit whole numbers using the standard algorithm (CCSS 5.NBT.B.5) and begin multiplying decimals. These worksheets include both computation and real-world application problems.'
    }
  },
  'math|division': {
    grades: {
      3: 'Third graders learn division as the inverse of multiplication. They divide within 100 using the relationship between multiplication and division (CCSS 3.OA.A.2). Our worksheets connect division facts directly to known multiplication facts to build fluency.',
      4: 'Fourth grade introduces long division with up to four-digit dividends and one-digit divisors (CCSS 4.NBT.B.6). Students learn the standard algorithm and interpret remainders. These worksheets provide systematic practice from basic facts through multi-digit long division.',
      5: 'Fifth graders divide multi-digit whole numbers and begin dividing decimals (CCSS 5.NBT.B.6). Worksheets include whole-number long division, division with decimal quotients, and real-world division problems.',
      6: 'Sixth grade division extends to dividing fractions by fractions (CCSS 6.NS.A.1) and fluently dividing multi-digit numbers using the standard algorithm. These worksheets cover both computation and applied problems.'
    }
  },
  'math|fractions': {
    grades: {
      3: 'Third grade introduces fractions as numbers on the number line (CCSS 3.NF.A.1-3). Students learn to identify, compare, and find equivalent fractions with denominators of 2, 3, 4, 6, and 8. These worksheets use visual models — fraction bars, number lines, and shaded shapes — to build conceptual understanding.',
      4: 'Fourth graders extend fraction understanding to equivalence, ordering, and basic operations with like denominators (CCSS 4.NF). They add and subtract fractions, multiply fractions by whole numbers, and convert between fractions and decimals. Our worksheets progress from visual models to symbolic computation.',
      5: 'Fifth grade is the year of fraction operations. Students add and subtract fractions with unlike denominators, multiply fractions by fractions, and divide unit fractions by whole numbers (CCSS 5.NF). These worksheets cover the full range of fraction computation with word problems.'
    }
  },
  'english|reading-comprehension': {
    grades: {
      3: 'Third grade reading comprehension shifts from "learning to read" to "reading to learn." Students identify main ideas, determine word meanings from context, and distinguish their own point of view from the author\'s (CCSS RI.3.1-9). Our passages include both fiction and nonfiction with questions targeting inference, text evidence, and vocabulary.',
      4: 'Fourth graders analyze text structure, determine themes, and compare perspectives across texts (CCSS RL.4.1-9, RI.4.1-9). These worksheets feature grade-appropriate passages with questions on main idea, inference, author\'s purpose, and text structure — the skills tested on standardized assessments.'
    }
  }
};

// ── Tier C template (deterministic, no AI) ──
function tierCContent(displayName, grade, count, diffCounts) {
  const diffParts = [];
  if (diffCounts.beginner > 0) diffParts.push(`${diffCounts.beginner} beginner`);
  if (diffCounts.standard > 0) diffParts.push(`${diffCounts.standard} standard`);
  if (diffCounts.challenge > 0) diffParts.push(`${diffCounts.challenge} challenge`);
  const diffStr = diffParts.length ? diffParts.join(', ') : 'mixed';
  return `Browse ${count} free Grade ${grade} ${displayName.toLowerCase()} worksheets with answer keys. These printable worksheets include ${diffStr} difficulty levels. All worksheets are aligned to Common Core standards and ready to download as PDF.`;
}

// ── Helpers ──
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function titleCase(s) { return s ? s.split(' ').map(capitalize).join(' ') : ''; }
function formatTopic(t) { return t ? titleCase(t.replace(/-/g, ' ')) : ''; }
function gradeColor(grade) { return grade <= 2 ? '#FF6B6B' : grade <= 4 ? '#6C5CE7' : '#0984E3'; }

function subjectColor(s) {
  const m = { math:'#7C3AED', english:'#DB2777', science:'#059669' };
  return m[s] || '#6C5CE7';
}

// ── JSON-LD for hub pages ──
function buildHubJsonLd(subject, grade, displayName, count, canonicalUrl, worksheetUrls) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `Grade ${grade} ${displayName} Worksheets`,
    'description': `${count} free printable Grade ${grade} ${displayName.toLowerCase()} worksheets with answer keys. Common Core aligned.`,
    'url': canonicalUrl,
    'about': {
      '@type': 'Thing',
      'name': displayName
    },
    'educationalLevel': `Grade ${grade}`,
    'isAccessibleForFree': true,
    'provider': {
      '@type': 'Organization',
      'name': 'Examel',
      'url': 'https://examel.com'
    },
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': count,
      'itemListElement': worksheetUrls.slice(0, 20).map((url, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'url': url
      }))
    }
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// ── Worksheet card (matches existing pattern from generate-pages.js) ──
function worksheetCard(ws) {
  const color = subjectColor(ws.subject);
  const url = getPageUrl(ws);
  const subjectLabel = capitalize(ws.subject);
  const thumb = ws.preview_p1_url
    ? `<img src="${ws.preview_p1_url}" alt="${ws.title}" class="ws-card-thumb" loading="lazy">`
    : `<div class="ws-card-thumb-placeholder" style="background:linear-gradient(135deg,${color}18 0%,${color}08 100%);border-top:4px solid ${color}"><span style="font-size:28px;opacity:0.25;font-weight:900;color:${color};letter-spacing:-1px">${subjectLabel}</span></div>`;
  return `
    <a href="${url}" class="ws-card">
      ${thumb}
      <div class="ws-card-body">
        <div class="ws-card-badge" style="background:${color}">${capitalize(ws.subject)} · Grade ${ws.grade}</div>
        <h3>${ws.title}</h3>
        <p>${formatTopic(ws.topic)} · ${ws.difficulty ? capitalize(ws.difficulty) : ''}</p>
        <div class="ws-card-footer">
          <span class="ws-answer-badge">✓ Answer Key Included</span>
          ${ws.difficulty ? `<span class="ws-diff-badge ws-diff-${ws.difficulty}">${capitalize(ws.difficulty)}</span>` : ''}
          <span class="ws-card-btn">View →</span>
        </div>
      </div>
    </a>`;
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ══════════════════════════════════════════════════════════════════════════
function generateGradeTopicHubs(worksheets, sharedCSS, siteHeader, siteFooter, helpers) {
  const favicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E`;

  // Step 1: Map every worksheet to its canonical topic
  const mapped = [];
  for (const ws of worksheets) {
    const rawTopic = (ws.topic || '').toLowerCase().trim().replace(/ /g, '-');
    const subject  = (ws.subject || '').toLowerCase().trim();
    const grade    = ws.grade;
    if (!rawTopic || !subject || !grade) continue;

    // Check if this raw topic is excluded
    if (EXCLUDED_SET.has(rawTopic)) continue;

    // Look up canonical mapping
    const lookupKey = `${subject}|${rawTopic}`;
    const mapping = REVERSE_MAP[lookupKey];
    if (!mapping) continue; // unmapped topic — skip

    // Validate grade is CCSS-valid for this topic
    if (!mapping.valid_grades.includes(grade)) continue;

    mapped.push({
      ...ws,
      _canonical_slug: mapping.canonical_slug,
      _canonical_display: mapping.display_name,
      _tier_a: mapping.tier_a
    });
  }

  // Step 2: Group by subject|grade|canonical_slug
  const groups = {};
  for (const ws of mapped) {
    const key = `${ws.subject.toLowerCase().trim()}|${ws.grade}|${ws._canonical_slug}`;
    if (!groups[key]) {
      groups[key] = {
        subject: ws.subject.toLowerCase().trim(),
        grade: ws.grade,
        canonical_slug: ws._canonical_slug,
        display_name: ws._canonical_display,
        tier_a: ws._tier_a,
        worksheets: []
      };
    }
    groups[key].worksheets.push(ws);
  }

  // Step 3: Build all groups that meet threshold — also collect for cross-grade nav
  const allCanonicals = {}; // canonical_slug → [grade, grade, ...]
  for (const [, group] of Object.entries(groups)) {
    if (group.worksheets.length < MIN_WORKSHEETS) continue;
    const cKey = `${group.subject}|${group.canonical_slug}`;
    if (!allCanonicals[cKey]) allCanonicals[cKey] = [];
    allCanonicals[cKey].push(group.grade);
  }
  // Sort grades
  for (const k of Object.keys(allCanonicals)) {
    allCanonicals[k].sort((a, b) => a - b);
  }

  // Step 4: Generate pages
  let count = 0;
  for (const [, group] of Object.entries(groups)) {
    if (group.worksheets.length < MIN_WORKSHEETS) continue;

    const { subject, grade, canonical_slug, display_name, worksheets: groupWs } = group;
    const totalCount = groupWs.length;
    const subjectSlug = subject === 'english' ? 'english' : subject;
    const canonicalUrl = `https://examel.com/free-${subjectSlug}-worksheets/grade-${grade}/${canonical_slug}/`;

    // Sort by quality_score desc, then by title
    groupWs.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0) || (a.title || '').localeCompare(b.title || ''));

    // Difficulty distribution
    const diffCounts = { beginner: 0, standard: 0, challenge: 0 };
    groupWs.forEach(ws => {
      const d = (ws.difficulty || 'standard').toLowerCase();
      if (diffCounts[d] !== undefined) diffCounts[d]++;
    });

    // Sub-topic breakdown (show original topic values as micro-skill sections)
    const subTopics = {};
    groupWs.forEach(ws => {
      const raw = (ws.topic || '').toLowerCase().trim().replace(/ /g, '-');
      if (!subTopics[raw]) subTopics[raw] = [];
      subTopics[raw].push(ws);
    });
    const sortedSubTopics = Object.entries(subTopics)
      .sort((a, b) => b[1].length - a[1].length);

    // Content section
    const tierAKey = `${subject}|${canonical_slug}`;
    const tierAData = TIER_A_CONTENT[tierAKey];
    let contentSection = '';
    if (tierAData && tierAData.grades[grade]) {
      contentSection = tierAData.grades[grade];
    } else {
      contentSection = tierCContent(display_name, grade, totalCount, diffCounts);
    }

    // Cross-grade navigation
    const cKey = `${subject}|${canonical_slug}`;
    const otherGrades = (allCanonicals[cKey] || []).filter(g => g !== grade);

    // Sibling topics (other canonical topics at same grade with 5+ worksheets)
    const siblingTopics = Object.values(groups)
      .filter(g => g.subject === subject && g.grade === grade
                && g.canonical_slug !== canonical_slug
                && g.worksheets.length >= MIN_WORKSHEETS)
      .sort((a, b) => b.worksheets.length - a.worksheets.length)
      .slice(0, 8);

    // Worksheet URLs for JSON-LD
    const wsUrls = groupWs.map(ws => `https://examel.com${getPageUrl(ws)}`);

    // JSON-LD
    const jsonLd = buildHubJsonLd(subject, grade, display_name, totalCount, canonicalUrl, wsUrls);

    // Build page
    const dir = path.join(BASE, `free-${subjectSlug}-worksheets`, `grade-${grade}`, canonical_slug);
    fs.mkdirSync(dir, { recursive: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${favicon}>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Grade ${grade} ${display_name} Worksheets | Printable PDF with Answers | Examel</title>
  <meta name="description" content="Free printable Grade ${grade} ${display_name.toLowerCase()} worksheets with answer keys. ${totalCount} worksheets covering ${sortedSubTopics.length} skills. Download PDF instantly. Common Core aligned.">
  <link rel="canonical" href="${canonicalUrl}">
  ${buildOG({ title: `Free Grade ${grade} ${display_name} Worksheets | Examel`, description: `${totalCount} printable ${display_name.toLowerCase()} worksheets for Grade ${grade} with answer keys.`, url: canonicalUrl })}
  ${jsonLd}
  ${sharedCSS}
${buildAnalytics()}
</head>
<body>
  ${siteHeader}
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li><a href="https://examel.com">Home</a><span class="sep">›</span></li>
      <li><a href="/free-${subjectSlug}-worksheets/">Free ${capitalize(subject)} Worksheets</a><span class="sep">›</span></li>
      <li><a href="/free-${subjectSlug}-worksheets/grade-${grade}/">Grade ${grade}</a><span class="sep">›</span></li>
      <li aria-current="page">${display_name}</li>
    </ol>
  </nav>
  <div class="hero">
    <h1>Free Grade ${grade} <span>${display_name}</span> Worksheets</h1>
    <p>${totalCount} printable ${display_name.toLowerCase()} worksheets for Grade ${grade} students. Every worksheet includes an answer key. Common Core aligned. No signup required.</p>
  </div>
  ${buildAnswerBadge()}

  <!-- Content Section -->
  <div style="max-width:680px;margin:0 auto 40px;padding:0 20px;">
    <div style="background:white;border-radius:20px;padding:32px;border:1px solid #EDE8DF;">
      <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:12px;">What Grade ${grade} Students Learn</h2>
      <p style="font-size:15px;color:#3D3347;line-height:1.8;margin-bottom:14px;">${contentSection}</p>
      ${sortedSubTopics.length > 1 ? `
      <p style="font-size:14px;color:#6B6475;line-height:1.7;margin-top:16px;"><strong>Skills covered:</strong> ${sortedSubTopics.map(([t, ws]) => `${formatTopic(t)} (${ws.length})`).join(', ')}</p>
      ` : ''}
    </div>
  </div>

  <!-- Cross-Grade Navigation -->
  ${otherGrades.length > 0 ? `
  <div style="max-width:680px;margin:0 auto 32px;padding:0 20px;">
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
      <span style="font-size:14px;font-weight:600;color:#6B6475;padding:8px 0;font-family:Outfit,sans-serif;">${display_name} in other grades:</span>
      ${otherGrades.map(g => `<a href="/free-${subjectSlug}-worksheets/grade-${g}/${canonical_slug}/" style="padding:8px 18px;background:white;border:2px solid ${gradeColor(g)};border-radius:100px;text-decoration:none;color:${gradeColor(g)};font-size:13px;font-weight:700;font-family:Outfit,sans-serif;">Grade ${g}</a>`).join('')}
      <a href="/free-${subjectSlug}-worksheets/${canonical_slug}/" style="padding:8px 18px;background:white;border:2px solid #1A1420;border-radius:100px;text-decoration:none;color:#1A1420;font-size:13px;font-weight:700;font-family:Outfit,sans-serif;">All Grades</a>
    </div>
  </div>` : ''}

  ${buildEmailCapture()}

  <!-- Worksheet Grid -->
  <div style="max-width:1100px;margin:0 auto 16px;padding:0 20px;">
    <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;">${totalCount} ${display_name} Worksheets for Grade ${grade}</h2>
  </div>
  <div class="grid" data-pagefind-body>
    <span data-pagefind-filter="subject" hidden>${capitalize(subject)}</span>
    <span data-pagefind-filter="grade" hidden>Grade ${grade}</span>
    <span data-pagefind-filter="topic" hidden>${display_name}</span>
    ${groupWs.slice(0, 24).map(worksheetCard).join('')}
  </div>
  ${totalCount > 24 ? `
  <div style="text-align:center;margin:24px 0 48px;">
    <p style="font-size:14px;color:#6B6475;font-family:Outfit,sans-serif;">Showing 24 of ${totalCount} worksheets. <a href="/free-${subjectSlug}-worksheets/grade-${grade}/" style="color:#6C5CE7;font-weight:600;">Browse all Grade ${grade} ${capitalize(subject)}</a></p>
  </div>` : ''}

  <!-- Sibling Topics -->
  ${siblingTopics.length > 0 ? `
  <div style="max-width:680px;margin:48px auto 0;padding:0 20px;">
    <h2 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;color:#1A1420;margin-bottom:16px;text-align:center;">More Grade ${grade} ${capitalize(subject)} Topics</h2>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
      ${siblingTopics.map(st => `<a href="/free-${subjectSlug}-worksheets/grade-${grade}/${st.canonical_slug}/" style="padding:10px 20px;background:white;border:2px solid #EDE8DF;border-radius:100px;text-decoration:none;color:#1A1420;font-size:14px;font-weight:600;font-family:Outfit,sans-serif;">${st.display_name} (${st.worksheets.length})</a>`).join('')}
    </div>
  </div>` : ''}

  <div style="max-width:680px;margin:40px auto;padding:0 20px;text-align:center;">
    <a href="/free-${subjectSlug}-worksheets/grade-${grade}/" style="color:#6C5CE7;text-decoration:none;font-weight:700;font-family:Outfit,sans-serif;font-size:15px;">← All Grade ${grade} ${capitalize(subject)} Worksheets</a>
  </div>
  ${siteFooter}
</body>
</html>`;

    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count++;
  }

  console.log(`✓ Grade+Topic hub pages — ${count} pages generated`);
  return count;
}

module.exports = { generateGradeTopicHubs };
