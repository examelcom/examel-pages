/**
 * EXAMEL DATA GATE — Validates and sanitizes Supabase data before page generation
 * Bad data gets flagged, not processed. Clean data proceeds.
 */

const VALID_SUBJECTS = ['math', 'english', 'science'];
const VALID_FORMATS = ['worksheet', 'drill-grid', 'vocab-match', 'reading-passage', 'word-search'];
const VALID_GRADES = [1, 2, 3, 4, 5, 6];

function validateWorksheet(ws) {
  const errors = [];

  if (!ws.slug || ws.slug.trim() === '') errors.push('missing-slug');
  if (!ws.subject) errors.push('missing-subject');
  if (!ws.grade || !VALID_GRADES.includes(Number(ws.grade))) errors.push('invalid-grade: ' + ws.grade);
  if (!ws.format || !VALID_FORMATS.includes(ws.format)) errors.push('invalid-format: ' + ws.format);
  if (!ws.title || ws.title.trim() === '') errors.push('missing-title');

  // Check for uppercase subject (common data issue)
  if (ws.subject && ws.subject !== ws.subject.toLowerCase()) {
    errors.push('uppercase-subject: ' + ws.subject);
  }

  return { valid: errors.length === 0, errors };
}

function sanitizeWorksheet(ws) {
  return {
    ...ws,
    subject: (ws.subject || 'math').toLowerCase().trim(),
    grade: Number(ws.grade) || 1,
    slug: (ws.slug || '').toLowerCase().trim(),
    format: (ws.format || 'worksheet').toLowerCase().trim(),
    topic: (ws.topic || '').toLowerCase().trim(),
    theme: (ws.theme || '').trim(),
    difficulty: (ws.difficulty || 'standard').toLowerCase().trim(),
    title: (ws.title || '').trim()
  };
}

function processWorksheets(worksheets) {
  const clean = [];
  const flagged = [];

  for (const ws of worksheets) {
    const result = validateWorksheet(ws);
    const sanitized = sanitizeWorksheet(ws);

    if (result.valid || result.errors.every(e => e.startsWith('uppercase-subject'))) {
      // Valid or just needs sanitization
      clean.push(sanitized);
    } else {
      flagged.push({ slug: ws.slug, errors: result.errors });
    }
  }

  if (flagged.length > 0) {
    console.log(`⚠️  Data gate flagged ${flagged.length} worksheets:`);
    flagged.slice(0, 5).forEach(f => console.log(`   ${f.slug}: ${f.errors.join(', ')}`));
  }

  return { clean, flagged };
}

module.exports = { validateWorksheet, sanitizeWorksheet, processWorksheets };
