/**
 * LINKING ENGINE — Session 3
 * Microservice: separate file, called by generate-pages.js
 * Produces 6-8 pedagogical links per worksheet page
 * 
 * Link types:
 * 1. Parent category (upward)
 * 2. Next logical skill (lateral progression)
 * 3. Same topic, one grade easier (scaffold down)
 * 4. Same topic, one grade harder (scaffold up)
 * 5. Cross-format (worksheet ↔ drill ↔ vocab)
 * 6-8. Siblings (same grade+subject, different topic)
 */

let curriculumMap = null;
try {
  const { CURRICULUM } = require('/opt/examel/pdf-engine/curriculum-map.js');
  curriculumMap = CURRICULUM;
} catch (e) {
  console.warn('[linking-engine] curriculum-map.js not found, using fallback linking');
}
const { getPageUrl } = require('./examel-config/urls.js');

// Skill progression: for a given subject+grade+topic, what comes next?
function getNextSkill(subject, grade, topic) {
  if (!curriculumMap) return null;
  const subj = subject.toLowerCase();
  if (!curriculumMap[subj] || !curriculumMap[subj][grade]) return null;
  const topics = curriculumMap[subj][grade];
  const idx = topics.findIndex(t => t.topic === topic || t.topic === topic.replace(/ /g, '-'));
  if (idx === -1 || idx >= topics.length - 1) return null;
  return topics[idx + 1].topic;
}

// Normalize topic for comparison (handle spaces vs hyphens)
function normTopic(t) {
  return (t || '').toLowerCase().replace(/-/g, ' ').trim();
}

// Build URL for a worksheet — delegates to examel-config/urls.js (single source of truth)
function buildUrl(ws) {
  return getPageUrl(ws);
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatTopic(t) {
  return (t || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Main function: get pedagogical links for a worksheet
 * @param {Object} ws - the current worksheet
 * @param {Array} allWorksheets - all worksheets from Supabase
 * @returns {Array} array of {url, text, type} objects, max 8
 */
function getPedagogicalLinks(ws, allWorksheets) {
  const links = [];
  const subj = (ws.subject || '').toLowerCase();
  const usedSlugs = new Set([ws.slug]);

  // Helper: find best worksheet matching criteria
  function findOne(filter) {
    const match = allWorksheets.find(w => !usedSlugs.has(w.slug) && filter(w));
    if (match) usedSlugs.add(match.slug);
    return match;
  }

  // Helper: find multiple
  function findMany(filter, max) {
    const results = [];
    for (const w of allWorksheets) {
      if (results.length >= max) break;
      if (!usedSlugs.has(w.slug) && filter(w)) {
        usedSlugs.add(w.slug);
        results.push(w);
      }
    }
    return results;
  }

  // 1. Parent category page (always — this is a hub link, not a worksheet)
  links.push({
    url: `/free-${subj}-worksheets/grade-${ws.grade}/`,
    text: `More Grade ${ws.grade} ${capitalize(subj)} Worksheets`,
    type: 'parent'
  });

  // 2. Next logical skill
  const nextTopic = getNextSkill(subj, ws.grade, ws.topic);
  if (nextTopic) {
    const nextWs = findOne(w =>
      w.subject.toLowerCase() === subj &&
      w.grade === ws.grade &&
      normTopic(w.topic) === normTopic(nextTopic)
    );
    if (nextWs) {
      links.push({
        url: buildUrl(nextWs),
        text: `Next Skill: ${formatTopic(nextTopic)}`,
        type: 'next-skill'
      });
    }
  }

  // 3. Same topic, one grade easier
  if (ws.grade > 1) {
    const easier = findOne(w =>
      w.subject.toLowerCase() === subj &&
      w.grade === ws.grade - 1 &&
      normTopic(w.topic) === normTopic(ws.topic)
    );
    if (easier) {
      links.push({
        url: buildUrl(easier),
        text: `Need Practice? Grade ${ws.grade - 1} ${formatTopic(ws.topic)}`,
        type: 'easier'
      });
    }
  }

  // 4. Same topic, one grade harder
  if (ws.grade < 6) {
    const harder = findOne(w =>
      w.subject.toLowerCase() === subj &&
      w.grade === ws.grade + 1 &&
      normTopic(w.topic) === normTopic(ws.topic)
    );
    if (harder) {
      links.push({
        url: buildUrl(harder),
        text: `Challenge: Grade ${ws.grade + 1} ${formatTopic(ws.topic)}`,
        type: 'harder'
      });
    }
  }

  // 5. Cross-format (worksheet → drill, drill → worksheet, etc)
  const otherFormats = ['drill-grid', 'vocab-match', 'word-search', 'reading-passage'];
  const currentFormat = ws.format || 'worksheet';
  for (const fmt of otherFormats) {
    if (fmt === currentFormat) continue;
    const cross = findOne(w =>
      w.format === fmt &&
      w.subject.toLowerCase() === subj &&
      w.grade === ws.grade
    );
    if (cross) {
      const fmtLabel = fmt === 'drill-grid' ? 'Math Drill' : fmt === 'vocab-match' ? 'Vocabulary Activity' : fmt === 'word-search' ? 'Word Search' : 'Reading Passage';
      links.push({
        url: buildUrl(cross),
        text: `Try a ${fmtLabel} — Grade ${ws.grade}`,
        type: 'cross-format'
      });
      break; // Only one cross-format link
    }
  }

  // 6-8. Siblings (same grade+subject, different topic, shuffled)
  const shuffled = allWorksheets
    .filter(w =>
      !usedSlugs.has(w.slug) &&
      w.subject.toLowerCase() === subj &&
      w.grade === ws.grade &&
      normTopic(w.topic) !== normTopic(ws.topic)
    )
    .sort(() => Math.random() - 0.5);

  const siblings = shuffled.slice(0, Math.max(0, 8 - links.length));
  for (const sib of siblings) {
    usedSlugs.add(sib.slug);
    links.push({
      url: buildUrl(sib),
      text: `${formatTopic(sib.topic)} — Grade ${sib.grade} ${capitalize(subj)}`,
      type: 'sibling'
    });
  }

  return links.slice(0, 8);
}

module.exports = { getPedagogicalLinks };
