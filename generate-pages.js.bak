require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function generatePages() {
  console.log('Fetching worksheets from Supabase...');
  
  const { data: worksheets, error } = await supabase
    .from('worksheets')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${worksheets.length} worksheets`);

  for (const ws of worksheets) {
    const dir = `/opt/examel/examel-pages/worksheets/${ws.slug}`;
    fs.mkdirSync(dir, { recursive: true });

    const downloadUrl = ws.pdf_url && ws.pdf_url.startsWith('http') 
      ? ws.pdf_url 
      : 'https://examel.com';

    const gradeColor = ws.grade <= 2 ? '#FF6B6B' : ws.grade <= 4 ? '#6C5CE7' : ws.grade <= 5 ? '#0984E3' : '#2D3436';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ws.title} | Free Printable Worksheet | Examel</title>
  <meta name="description" content="Free printable ${ws.subject} worksheet for Grade ${ws.grade}. ${ws.topic} with ${ws.theme} theme. Download and print instantly.">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "EducationalResource",
    "name": "${ws.title}",
    "description": "Free printable ${ws.subject} worksheet for Grade ${ws.grade} about ${ws.topic}",
    "educationalLevel": "Grade ${ws.grade}",
    "subject": "${ws.subject}",
    "provider": {
      "@type": "Organization",
      "name": "Examel",
      "url": "https://examel.com"
    }
  }
  </script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #2D3436; background: #F8F7FF; }
    .hero { background: ${gradeColor}; color: white; padding: 40px 20px; text-align: center; }
    .hero h1 { font-size: 1.8em; margin-bottom: 10px; line-height: 1.3; }
    .hero p { font-size: 1em; opacity: 0.9; }
    .badges { display: flex; justify-content: center; gap: 10px; margin-top: 15px; flex-wrap: wrap; }
    .badge { background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: bold; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .download-box { background: white; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px; border: 2px solid ${gradeColor}; }
    .download-box h2 { color: ${gradeColor}; margin-bottom: 10px; font-size: 1.4em; }
    .download-box p { color: #636E72; margin-bottom: 20px; line-height: 1.6; }
    .btn { background: ${gradeColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1.1em; display: inline-block; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
    .info-card { background: white; border-radius: 12px; padding: 20px; text-align: center; }
    .info-card .label { font-size: 11px; color: #B2BEC3; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 5px; display: block; }
    .info-card .value { font-size: 1.1em; font-weight: bold; color: #2D3436; }
    .features { background: white; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
    .features h3 { color: ${gradeColor}; margin-bottom: 16px; }
    .feature-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 14px; color: #636E72; }
    .check { color: #00B894; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; padding: 30px; font-size: 13px; color: #B2BEC3; border-top: 1px solid #DFE6E9; margin-top: 20px; }
    .footer a { color: ${gradeColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>${ws.title}</h1>
    <p>Free printable worksheet — download and print instantly</p>
    <div class="badges">
      <span class="badge">${ws.subject}</span>
      <span class="badge">Grade ${ws.grade}</span>
      <span class="badge">${ws.theme} Theme</span>
    </div>
  </div>

  <div class="container">
    <div class="info-grid">
      <div class="info-card">
        <span class="label">SUBJECT</span>
        <span class="value">${ws.subject}</span>
      </div>
      <div class="info-card">
        <span class="label">GRADE</span>
        <span class="value">Grade ${ws.grade}</span>
      </div>
      <div class="info-card">
        <span class="label">TOPIC</span>
        <span class="value">${ws.topic}</span>
      </div>
    </div>

    <div class="download-box">
      <h2>Ready to Print</h2>
      <p>This worksheet includes 8 questions with a ${ws.theme} theme plus a full answer key for parents and teachers. Print it in seconds.</p>
      <a href="${downloadUrl}" class="btn" download>⬇ Download Free Worksheet</a>
    </div>

    <div class="features">
      <h3>What is included</h3>
      <div class="feature-item"><span class="check">✓</span> 8 curriculum-aligned questions</div>
      <div class="feature-item"><span class="check">✓</span> Full answer key for parents and teachers</div>
      <div class="feature-item"><span class="check">✓</span> ${ws.theme} theme to keep kids engaged</div>
      <div class="feature-item"><span class="check">✓</span> Print-ready PDF — Letter size</div>
      <div class="feature-item"><span class="check">✓</span> Name, date, and score fields included</div>
    </div>
  </div>

  <div class="footer">
    <a href="https://examel.com">examel.com</a> | The worksheet your child actually finishes.
  </div>
</body>
</html>`;

    fs.writeFileSync(`${dir}/index.html`, html);
    console.log(`Generated: /worksheets/${ws.slug}/ — Download: ${downloadUrl.substring(0, 50)}...`);
  }

  const baseUrl = 'https://examel-pages.pages.dev';
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${worksheets.map(ws => `  <url>
    <loc>${baseUrl}/worksheets/${ws.slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync('/opt/examel/examel-pages/sitemap.xml', sitemap);
  console.log(`\nDone — ${worksheets.length} pages + sitemap generated`);
}

generatePages().catch(console.error);
