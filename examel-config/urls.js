/**
 * EXAMEL URL BUILDER — Single source of truth for ALL URLs
 * Every generator, every linker, every sitemap builder uses these functions.
 * NEVER hardcode a URL pattern anywhere else.
 */

// ── DRILL OPERATION MAPPING ──
const DRILL_OPERATIONS = {
  'addition':'addition','single-digit-addition':'addition','addition-within-10':'addition',
  'addition-within-20':'addition','doubles-facts':'addition','adding-three-numbers':'addition',
  'adding-multiples-of-10':'addition','addition-no-regrouping':'addition',
  'addition-with-regrouping':'addition','3-digit-addition':'addition',
  'subtraction':'subtraction','single-digit-subtraction':'subtraction',
  'subtraction-within-10':'subtraction','subtraction-within-20':'subtraction',
  'subtracting-multiples-of-10':'subtraction','subtraction-no-borrowing':'subtraction',
  'subtraction-with-borrowing':'subtraction','3-digit-subtraction':'subtraction',
  'mixed-add-subtract':'subtraction',
  'multiplication':'multiplication','multiplication-facts-0-12':'multiplication',
  '2-digit-by-1-digit':'multiplication','2-digit-by-2-digit':'multiplication',
  'multiplying-by-10-100':'multiplication','mixed-mult-division':'multiplication',
  'times-table-2':'multiplication','times-table-3':'multiplication',
  'times-table-4':'multiplication','times-table-5':'multiplication',
  'times-table-6':'multiplication','times-table-7':'multiplication',
  'times-table-8':'multiplication','times-table-9':'multiplication',
  'times-table-10':'multiplication','times-table-11':'multiplication',
  'times-table-12':'multiplication',
  'division':'division','basic-division-facts':'division','division-by-2':'division',
  'division-by-5':'division','division-by-10':'division',
  'division-with-remainders':'division','dividing-by-10-100':'division',
  'long-division-2-digit-divisor':'division',
  'mad-minute-addition':'mixed','mad-minute-multiplication':'mixed',
  'mixed-all-operations':'mixed'
};

// ── SANITIZE — all inputs cleaned before use ──
function sanitize(val) {
  if (!val) return '';
  return String(val).toLowerCase().trim().replace(/ /g, '-');
}

// ── PAGE URL — returns the canonical URL path for any worksheet ──
function getPageUrl(ws) {
  const subject = sanitize(ws.subject);
  const grade = ws.grade || 0;
  const slug = sanitize(ws.slug);
  const format = sanitize(ws.format);

  if (!slug) return '/';

  switch (format) {
    case 'worksheet':
      return `/worksheets/${slug}/`;
    case 'drill-grid':
      return `/drills/${subject}/grade-${grade}/${slug}/`;
    case 'vocab-match':
      return `/vocab-match/${subject}/grade-${grade}/${slug}/`;
    case 'reading-passage':
      return `/reading-passages/grade-${grade}/${slug}/`;
    case 'word-search':
      return `/word-searches/${subject}/grade-${grade}/${slug}/`;
    default:
      if (format.startsWith('game-')) return `/games/${slug}/`;
      return `/worksheets/${slug}/`;
  }
}

// ── DIR PATH — returns the filesystem directory path for any worksheet ──
function getDirPath(ws) {
  const url = getPageUrl(ws);
  return `/opt/examel/examel-pages${url.replace(/\/$/, '')}`;
}

// ── DRILL TOPIC URL — returns the intent page URL for a drill topic ──
function getDrillTopicUrl(topic) {
  const t = sanitize(topic);
  if (!t) return '/free-math-drills/';
  const op = DRILL_OPERATIONS[t];
  if (!op) return '/free-math-drills/';
  // If topic IS the operation (e.g., "division"), don't double it
  if (t === op) return `/free-math-drills/${op}/`;
  return `/free-math-drills/${op}/${t}/`;
}

// ── DRILL GRADE URL — returns the drill grade hub URL ──
function getDrillGradeUrl(subject, grade) {
  return `/drills/${sanitize(subject)}/grade-${grade}/`;
}

// ── SUBJECT HUB URL ──
function getSubjectHubUrl(subject) {
  return `/free-${sanitize(subject)}-worksheets/`;
}

// ── GRADE HUB URL ──
function getGradeHubUrl(subject, grade) {
  return `/free-${sanitize(subject)}-worksheets/grade-${grade}/`;
}

// ── CARD URL — used by worksheetCard() for linking ──
// Returns the best URL for a worksheet card on non-drill pages
function getCardUrl(ws) {
  const format = sanitize(ws.format);
  if (format === 'drill-grid') {
    return getDrillTopicUrl(ws.topic);
  }
  return getPageUrl(ws);
}

module.exports = {
  sanitize,
  getPageUrl,
  getDirPath,
  getDrillTopicUrl,
  getDrillGradeUrl,
  getSubjectHubUrl,
  getGradeHubUrl,
  getCardUrl,
  DRILL_OPERATIONS
};
