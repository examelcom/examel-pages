/**
 * EXAMEL SAFE WRITE — Enforced page validation before writing to disk
 * Replaces direct fs.writeFileSync for all page output.
 * If validation fails, page is NOT written and error is logged.
 */

const fs = require('fs');
const path = require('path');
const { validatePage } = require('./validator');
const { registerPage } = require('./registry');

const _errors = [];
const _written = 0;
let _writeCount = 0;
let _blockCount = 0;

function safeWrite(filePath, html, pageType, url, priority, freq) {
  const result = validatePage(html, pageType);

  if (!result.valid) {
    const slug = path.basename(path.dirname(filePath));
    _errors.push({ slug, errors: result.errors, pageType });
    _blockCount++;

    // Log but don't block for warnings (missing-email-capture, multiple-h1)
    const criticalErrors = result.errors.filter(e =>
      !e.startsWith('missing-email-capture') && !e.startsWith('multiple-h1')
    );

    if (criticalErrors.length > 0) {
      console.log(`⚠️  BLOCKED: ${slug} — ${criticalErrors.join(', ')}`);
      return false;
    }
    // Non-critical: warn but still write
    console.log(`⚡ WARN: ${slug} — ${result.errors.join(', ')}`);
  }

  // Ensure directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  // Write file
  fs.writeFileSync(filePath, html);
  _writeCount++;

  // Register in build registry
  if (url) {
    registerPage(url, priority, freq);
  }

  return true;
}

function getStats() {
  return {
    written: _writeCount,
    blocked: _blockCount,
    errors: _errors
  };
}

function resetStats() {
  _errors.length = 0;
  _writeCount = 0;
  _blockCount = 0;
}

module.exports = { safeWrite, getStats, resetStats };
