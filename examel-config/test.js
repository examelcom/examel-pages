/**
 * EXAMEL CONFIG TEST SUITE — Runs before every build
 * Tests all config functions. If any test fails, build is blocked.
 * Learned tests auto-grow from discovered bugs.
 */

const fs = require('fs');
const path = require('path');
const { getPageUrl, getDirPath, getDrillTopicUrl, getCardUrl, sanitize } = require('./urls');
const { buildSchema, buildOG, buildAnswerBadge, buildEmailCapture, buildAnalytics, buildBreadcrumbSchema, buildOrganizationSchema } = require('./components');
const { validatePage } = require('./validator');
const { processWorksheets } = require('./data-gate');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.log(`❌ FAILED: ${testName}`);
  }
}

// ── URL TESTS ──
assert(getPageUrl({ format: 'worksheet', slug: 'test-ws' }) === '/worksheets/test-ws/', 'worksheet URL');
assert(getPageUrl({ format: 'drill-grid', subject: 'Math', grade: 3, slug: 'my-drill' }) === '/drills/math/grade-3/my-drill/', 'drill URL lowercase');
assert(getPageUrl({ format: 'vocab-match', subject: 'English', grade: 2, slug: 'vocab-1' }) === '/vocab-match/english/grade-2/vocab-1/', 'vocab URL lowercase');
assert(getPageUrl({ format: 'reading-passage', grade: 4, slug: 'read-1' }) === '/reading-passages/grade-4/read-1/', 'reading URL');
assert(getDirPath({ format: 'worksheet', slug: 'test-ws' }) === '/opt/examel/examel-pages/worksheets/test-ws', 'dir path');

// ── DRILL TOPIC URL TESTS (critical — this caused 1,414 broken links) ──
assert(getDrillTopicUrl('division') === '/free-math-drills/division/', 'drill topic: division (no double)');
assert(getDrillTopicUrl('multiplication') === '/free-math-drills/multiplication/', 'drill topic: multiplication (no double)');
assert(getDrillTopicUrl('addition') === '/free-math-drills/addition/', 'drill topic: addition (no double)');
assert(getDrillTopicUrl('subtraction') === '/free-math-drills/subtraction/', 'drill topic: subtraction (no double)');
assert(getDrillTopicUrl('times-table-6') === '/free-math-drills/multiplication/times-table-6/', 'drill topic: times-table-6');
assert(getDrillTopicUrl('adding-multiples-of-10') === '/free-math-drills/addition/adding-multiples-of-10/', 'drill topic: adding-multiples');
assert(getDrillTopicUrl('division-with-remainders') === '/free-math-drills/division/division-with-remainders/', 'drill topic: division-with-remainders');
assert(getDrillTopicUrl('mad-minute-multiplication') === '/free-math-drills/mixed/mad-minute-multiplication/', 'drill topic: mad-minute');
assert(getDrillTopicUrl('') === '/free-math-drills/', 'drill topic: empty');
assert(getDrillTopicUrl(null) === '/free-math-drills/', 'drill topic: null');

// ── SANITIZE TESTS ──
assert(sanitize('Math') === 'math', 'sanitize uppercase');
assert(sanitize('  English  ') === 'english', 'sanitize whitespace');
assert(sanitize(null) === '', 'sanitize null');
assert(sanitize('Word Problems') === 'word-problems', 'sanitize spaces to hyphens');

// ── CARD URL TESTS ──
assert(getCardUrl({ format: 'drill-grid', topic: 'division' }) === '/free-math-drills/division/', 'card URL drill');
assert(getCardUrl({ format: 'worksheet', slug: 'my-ws' }) === '/worksheets/my-ws/', 'card URL worksheet');

// ── COMPONENT TESTS ──
assert(buildAnswerBadge().includes('Every Answer Verified'), 'answer badge content');
assert(buildEmailCapture().includes('klaviyo'), 'email capture has klaviyo');
assert(buildSchema({ title: 'Test', url: 'https://examel.com/test/' }).includes('application/ld+json'), 'schema has ld+json');
assert(buildOG({ title: 'Test', url: 'https://examel.com/test/' }).includes('og:title'), 'OG has og:title');

// ── VALIDATOR TESTS ──
const goodPage = '<html><head><title>Test</title><meta name="description" content="test"><link rel="canonical" href="x"><meta name="viewport"><script type="application/ld+json">{}</script><meta property="og:title" content="x"></head><body><h1>Test</h1><div class="klaviyo">x</div></body></html>';
assert(validatePage(goodPage, 'worksheet').valid === true, 'good page passes validation');
assert(validatePage('<html></html>', 'worksheet').valid === false, 'bad page fails validation');
assert(validatePage(goodPage.replace('app.kit.com', '') + '', 'worksheet').errors.filter(e => e === 'dead-kit-form').length === 0, 'no kit form passes');

// ── DATA GATE TESTS ──
const testWs = [
  { slug: 'test', subject: 'Math', grade: 3, format: 'worksheet', title: 'Test', topic: 'addition' },
  { slug: '', subject: '', grade: 99, format: 'bad', title: '', topic: '' }
];
const result = processWorksheets(testWs);
assert(result.clean.length === 1, 'data gate: 1 clean');
assert(result.flagged.length === 1, 'data gate: 1 flagged');
assert(result.clean[0].subject === 'math', 'data gate: subject lowercased');



// ── SCHEMA TESTS ──
assert(buildBreadcrumbSchema([{name:'Home',url:'https://examel.com'}]).includes('BreadcrumbList'), 'breadcrumb schema has BreadcrumbList');
assert(buildOrganizationSchema().includes('Organization'), 'org schema has Organization');
assert(buildSchema({title:'Test',ccss:'3.OA.7'}).includes('educationalAlignment'), 'schema with ccss has educationalAlignment');
assert(buildSchema({title:'Test',ccss:'3.OA.7'}).includes('Common Core'), 'schema with ccss has Common Core');
assert(buildSchema({title:'Test',typicalAgeRange:'8-9'}).includes('typicalAgeRange'), 'schema has typicalAgeRange');
// ── ANALYTICS TESTS ──
assert(buildAnalytics().includes('G-QJ7DF8JRPV'), 'analytics has GA4 ID');
assert(buildAnalytics().includes('umami'), 'analytics has Umami');
assert(buildAnalytics().includes('gtag'), 'analytics has gtag');
// ── LEARNED TESTS (auto-growing) ──
const learnedPath = path.join(__dirname, 'learned-tests.json');
if (fs.existsSync(learnedPath)) {
  try {
    const learned = JSON.parse(fs.readFileSync(learnedPath, 'utf8'));
    for (const test of learned) {
      if (test.type === 'url-not-equal') {
        const actual = getDrillTopicUrl(test.input);
        assert(actual !== test.forbidden, `learned: ${test.input} must not produce ${test.forbidden}`);
      }
      if (test.type === 'url-equals') {
        const actual = getPageUrl(test.input);
        assert(actual === test.expected, `learned: URL for ${test.input.slug} should be ${test.expected}`);
      }
    }
    console.log(`📚 ${learned.length} learned tests loaded`);
  } catch(e) {
    console.log('⚠️  Could not load learned tests:', e.message);
  }
}

// ── RESULTS ──
console.log(`\n🧪 Config test: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('🛑 BUILD BLOCKED — config tests failed');
  process.exit(1);
}
console.log('✅ All config tests passed');
