/**
 * EXAMEL PAGE CONTRACT VALIDATOR
 * Every page must pass this before being written to disk.
 * Returns { valid: true/false, errors: [] }
 */

function validatePage(html, pageType) {
  const errors = [];

  // Required on ALL pages
  if (!html.includes('<title>') || !html.includes('</title>')) errors.push('missing-title');
  if (html.includes('<title></title>')) errors.push('empty-title');
  if (!html.includes('name="description"')) errors.push('missing-meta-description');
  if (!html.includes('rel="canonical"')) errors.push('missing-canonical');
  if (!html.includes('application/ld+json')) errors.push('missing-schema');
  if (!html.includes('og:title')) errors.push('missing-og-tags');
  if (!html.includes('</html>')) errors.push('missing-closing-html');
  if (!html.includes('</head>')) errors.push('missing-closing-head');
  if (!html.includes('</body>')) errors.push('missing-closing-body');

  // Must have exactly one H1
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 0) errors.push('missing-h1');
  if (h1Count > 1) errors.push('multiple-h1');

  // Must have viewport for mobile
  if (!html.includes('viewport')) errors.push('missing-viewport');

  // Must NOT have dead Kit form
  if (html.includes('app.kit.com')) errors.push('dead-kit-form');

  // Must NOT have uppercase paths in internal links
  const uppercaseLinks = html.match(/href="\/[^"]*[A-Z][^"]*"/g);
  if (uppercaseLinks && uppercaseLinks.length > 0) errors.push('uppercase-internal-links: ' + uppercaseLinks[0]);

  // Must NOT have HTTP mixed content (except external links)
  const httpSrc = (html.match(/src="http:\/\//gi) || []).length;
  if (httpSrc > 0) errors.push('mixed-http-content');

  // Content pages should have email capture
  if (['worksheet', 'drill', 'vocab', 'reading'].includes(pageType)) {
    if (!html.includes('klaviyo')) errors.push('missing-email-capture');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { validatePage };
