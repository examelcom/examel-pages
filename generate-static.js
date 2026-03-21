require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const fs = require('fs');

const YEAR = new Date().getFullYear();

const sharedHead = (title, desc, slug) => `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} | Examel</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://examel.com/${slug}">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%236C5CE7'/%3E%3Crect x='7' y='7' width='4' height='18' rx='1' fill='white'/%3E%3Crect x='7' y='7' width='7' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='14' width='11' height='4' rx='1' fill='white'/%3E%3Crect x='7' y='21' width='15' height='4' rx='1' fill='white'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">`;

const css = `<style>
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'DM Sans',system-ui,sans-serif;background:#FAF8F3;color:#1A1420;-webkit-font-smoothing:antialiased;}
h1,h2,h3,h4,.logo-text,.btn-primary,.nav-link{font-family:'Outfit',sans-serif;}
.site-header{background:#1C1526;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:200;border-bottom:1px solid rgba(255,255,255,0.06);}
.site-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
.logo-text{font-size:20px;font-weight:800;letter-spacing:-1px;color:white;}
.logo-text span{color:#6C5CE7;}
.site-header nav{display:flex;align-items:center;gap:2px;}
.nav-link{color:rgba(255,255,255,0.6);text-decoration:none;font-size:13px;font-weight:600;padding:7px 12px;border-radius:8px;transition:all 0.2s;}
.nav-link:hover{color:white;background:rgba(108,92,231,0.2);}
.container{max-width:760px;margin:0 auto;padding:60px 24px;}
.page-hero{background:#1C1526;padding:60px 24px;text-align:center;border-bottom:4px solid #6C5CE7;}
.page-hero h1{font-family:'Outfit',sans-serif;font-size:clamp(28px,4vw,42px);font-weight:800;color:white;letter-spacing:-1px;margin-bottom:12px;}
.page-hero p{color:rgba(255,255,255,0.5);font-size:16px;}
.prose{line-height:1.85;font-size:15px;color:#4A4458;}
.prose h2{font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;color:#1A1420;margin:40px 0 14px;letter-spacing:-0.3px;}
.prose h3{font-family:'Outfit',sans-serif;font-size:17px;font-weight:700;color:#1A1420;margin:28px 0 10px;}
.prose p{margin-bottom:16px;}
.prose ul{margin:0 0 16px 20px;}
.prose li{margin-bottom:8px;}
.prose a{color:#6C5CE7;text-decoration:none;}
.prose a:hover{text-decoration:underline;}
.prose strong{color:#1A1420;font-weight:600;}
.prose .updated{font-size:13px;color:#A89FAE;margin-bottom:40px;padding-bottom:20px;border-bottom:1px solid #EDE8DF;}
.btn-primary{display:inline-block;background:#6C5CE7;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;transition:all 0.2s;font-family:'Outfit',sans-serif;}
.btn-primary:hover{background:#5A4BD1;transform:translateY(-1px);}
.site-footer{background:#1C1526;border-top:3px solid #6C5CE7;padding:48px 24px 28px;margin-top:80px;}
.footer-inner{max-width:1100px;margin:0 auto;text-align:center;}
.footer-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px;}
.footer-motto{font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:1px;margin-top:2px;}
.footer-links{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-bottom:24px;}
.footer-links a{color:rgba(255,255,255,0.4);text-decoration:none;font-size:13px;transition:color 0.2s;}
.footer-links a:hover{color:#6C5CE7;}
.footer-copy{font-size:12px;color:rgba(255,255,255,0.2);border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;}
@media(max-width:768px){.site-header nav{display:none;}.container{padding:40px 20px;}}
</style>`;

const logoSVG = `<svg width="30" height="30" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg"><rect width="72" height="72" rx="16" fill="#6C5CE7"/><rect x="15" y="15" width="9" height="42" rx="2.5" fill="white"/><rect x="15" y="15" width="15" height="9" rx="2.5" fill="white"/><rect x="15" y="31.5" width="24" height="9" rx="2.5" fill="white"/><rect x="15" y="48" width="33" height="9" rx="2.5" fill="white"/></svg>`;

const header = `<header class="site-header">
  <a href="https://examel.com" class="site-logo">${logoSVG}<span class="logo-text">examel<span>·</span></span></a>
  <nav>
    <a href="/free-math-worksheets/" class="nav-link">Math</a>
    <a href="/free-english-worksheets/" class="nav-link">English</a>
    <a href="/free-science-worksheets/" class="nav-link">Science</a>
    <a href="/free-math-drills/" class="nav-link">Drills</a>
    <a href="/free-reading-passages/" class="nav-link">Reading</a>
  </nav>
</header>`;

const footer = `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-logo">${logoSVG}
      <div><div style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:white;font-family:'Outfit',sans-serif;">examel<span style="color:#6C5CE7;">·</span></div>
      <div class="footer-motto">Know more. Score more.</div></div>
    </div>
    <div class="footer-links">
      <a href="/free-math-worksheets/">Math</a>
      <a href="/free-english-worksheets/">English</a>
      <a href="/free-science-worksheets/">Science</a>
      <a href="/free-math-drills/">Drills</a>
      <a href="/about/">About</a>
      <a href="/privacy-policy/">Privacy Policy</a>
      <a href="/terms/">Terms of Use</a>
    </div>
    <div class="footer-copy">© ${YEAR} Examel · Free K-8 Printable Worksheets · Every exam. Every grade.</div>
  </div>
</footer>`;

// ── PRIVACY POLICY ──────────────────────────────────────────────────────
const privacyHTML = `<!DOCTYPE html>
<html lang="en">
<head>${sharedHead('Privacy Policy','Examel privacy policy — how we collect, use and protect your information.','privacy-policy/')}${css}</head>
<body>${header}
<div class="page-hero"><h1>Privacy Policy</h1><p>How we collect, use and protect your information</p></div>
<div class="container"><div class="prose">
<p class="updated">Last updated: March 20, ${YEAR}</p>
<p>Examel ("we", "us", or "our") operates examel.com. This Privacy Policy explains how we collect, use, and protect information when you visit our website.</p>
<h2>Information we collect</h2>
<h3>Information you provide</h3>
<p>When you subscribe to our email list, we collect your email address. This is the only personal information we collect directly from you.</p>
<h3>Information collected automatically</h3>
<p>When you visit examel.com, we automatically collect certain information including your IP address, browser type, pages visited, and time spent on pages. This information is collected through cookies and similar tracking technologies.</p>
<h3>Google AdSense and advertising</h3>
<p>We use Google AdSense to display advertisements. Google uses cookies to serve ads based on your prior visits to our website and other sites. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank">Google Ad Settings</a>. We do not control Google's data collection practices. Please review <a href="https://policies.google.com/privacy" target="_blank">Google's Privacy Policy</a> for more information.</p>
<h2>How we use your information</h2>
<ul>
<li>To send you free worksheets and educational content you subscribed to receive</li>
<li>To improve our website and content</li>
<li>To analyze usage patterns and optimize the user experience</li>
<li>To display relevant advertisements through Google AdSense</li>
</ul>
<h2>Cookies</h2>
<p>We use cookies to analyze website traffic, remember your preferences, and serve relevant advertisements. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, some features of our website may not function properly without cookies.</p>
<h2>Email communications</h2>
<p>If you subscribe to our email list, you will receive free worksheets and educational content. You can unsubscribe at any time by clicking the unsubscribe link in any email we send, or by contacting us at hello@examel.com.</p>
<h2>Third-party services</h2>
<p>We use the following third-party services:</p>
<ul>
<li><strong>Klaviyo</strong> — email marketing platform. <a href="https://www.klaviyo.com/legal/privacy-notice" target="_blank">Klaviyo Privacy Policy</a></li>
<li><strong>Google Analytics</strong> — website analytics. <a href="https://policies.google.com/privacy" target="_blank">Google Privacy Policy</a></li>
<li><strong>Google AdSense</strong> — advertising. <a href="https://policies.google.com/privacy" target="_blank">Google Privacy Policy</a></li>
<li><strong>Cloudflare</strong> — content delivery and security. <a href="https://www.cloudflare.com/privacypolicy/" target="_blank">Cloudflare Privacy Policy</a></li>
</ul>
<h2>Children's privacy</h2>
<p>Examel is designed to provide educational resources for children in grades 1–6, but our website is intended for use by parents and teachers. We do not knowingly collect personal information from children under the age of 13. If you believe we have inadvertently collected information from a child under 13, please contact us immediately at hello@examel.com.</p>
<h2>Data security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
<h2>Your rights</h2>
<p>You have the right to access, correct, or delete any personal information we hold about you. To exercise these rights, please contact us at hello@examel.com.</p>
<h2>Changes to this policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page with an updated date.</p>
<h2>Contact us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:hello@examel.com">hello@examel.com</a>.</p>
</div></div>
${footer}</body></html>`;

// ── TERMS OF USE ────────────────────────────────────────────────────────
const termsHTML = `<!DOCTYPE html>
<html lang="en">
<head>${sharedHead('Terms of Use','Examel terms of use — rules and guidelines for using our free worksheet platform.','terms/')}${css}</head>
<body>${header}
<div class="page-hero"><h1>Terms of Use</h1><p>Rules and guidelines for using Examel</p></div>
<div class="container"><div class="prose">
<p class="updated">Last updated: March 20, ${YEAR}</p>
<p>By accessing and using examel.com, you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our website.</p>
<h2>About Examel</h2>
<p>Examel provides free printable educational worksheets for children in Grades 1–6. Our worksheets are aligned to Common Core State Standards (CCSS) and are available for free personal and classroom use.</p>
<h2>Permitted use</h2>
<p>You may use Examel worksheets for:</p>
<ul>
<li>Personal use with your own children</li>
<li>Classroom use by teachers and educators</li>
<li>Homeschool use</li>
<li>Non-commercial educational purposes</li>
</ul>
<h2>Prohibited use</h2>
<p>You may not:</p>
<ul>
<li>Sell, resell, or commercially distribute our worksheets without written permission</li>
<li>Remove or alter any copyright notices or branding from our worksheets</li>
<li>Use our content to create competing products or services</li>
<li>Scrape, crawl, or automatically download large quantities of content</li>
<li>Use our platform in any way that could damage or impair the service</li>
</ul>
<h2>Intellectual property</h2>
<p>All content on examel.com, including worksheets, designs, logos, characters, and text, is owned by Examel and protected by copyright law. Our characters Maya, Leo, Zoe, and Max are proprietary to Examel.</p>
<h2>Free to use</h2>
<p>All worksheets on Examel are free to download, print, and use for personal and classroom purposes. We are committed to keeping our core content free.</p>
<h2>Accuracy of content</h2>
<p>While we strive to ensure all worksheets are accurate and aligned to curriculum standards, we make no warranties regarding the completeness or accuracy of our content. Please review worksheets before use.</p>
<h2>Third-party links</h2>
<p>Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of those sites.</p>
<h2>Disclaimer of warranties</h2>
<p>Examel is provided "as is" without any warranties of any kind. We do not guarantee that the website will be error-free or uninterrupted.</p>
<h2>Limitation of liability</h2>
<p>Examel shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or worksheets.</p>
<h2>Changes to terms</h2>
<p>We reserve the right to modify these Terms of Use at any time. Continued use of the website after changes constitutes acceptance of the new terms.</p>
<h2>Contact</h2>
<p>Questions about these Terms of Use? Contact us at <a href="mailto:hello@examel.com">hello@examel.com</a>.</p>
</div></div>
${footer}</body></html>`;

// ── ABOUT ────────────────────────────────────────────────────────────────
const aboutHTML = `<!DOCTYPE html>
<html lang="en">
<head>${sharedHead('About Examel — Free Worksheets Kids Actually Want to Do','Examel was built to make finding quality themed worksheets instant. Free printables for Grades 1-6.','about/')}${css}
<style>
.about-hero{background:#1C1526;padding:80px 24px;text-align:center;}
.about-hero h1{font-family:'Outfit',sans-serif;font-size:clamp(32px,5vw,52px);font-weight:800;color:white;letter-spacing:-1.5px;margin-bottom:16px;line-height:1.15;}
.about-hero h1 span{color:#6C5CE7;}
.about-hero p{color:rgba(255,255,255,0.55);font-size:17px;max-width:540px;margin:0 auto;line-height:1.7;}
.mission{background:#F4F1FF;border-radius:24px;padding:40px;margin-bottom:40px;border-left:5px solid #6C5CE7;}
.mission p{font-family:'Outfit',sans-serif;font-size:20px;font-weight:600;color:#1A1420;line-height:1.65;font-style:italic;}
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;}
.stat-card{background:white;border-radius:16px;padding:24px;text-align:center;border:1px solid #EDE8DF;}
.stat-num{font-family:'Outfit',sans-serif;font-size:32px;font-weight:800;color:#6C5CE7;letter-spacing:-1px;}
.stat-label{font-size:13px;color:#6B6475;margin-top:4px;}
.chars{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:40px 0;}
.char-card{text-align:center;background:white;border-radius:16px;padding:20px 12px;border:1px solid #EDE8DF;}
.char-name{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#1A1420;margin-top:8px;}
.char-role{font-size:12px;color:#A89FAE;}
.char-svg{margin-bottom:8px;display:flex;justify-content:center;} .char-svg svg{width:110px;height:130px;}
.for-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px;}
.for-card{background:white;border-radius:16px;padding:28px;border:1px solid #EDE8DF;}
.for-card h3{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#1A1420;margin-bottom:14px;}
.for-card ul{list-style:none;padding:0;}
.for-card li{font-size:14px;color:#4A4458;margin-bottom:10px;padding-left:20px;position:relative;}
.for-card li::before{content:'✓';position:absolute;left:0;color:#6C5CE7;font-weight:700;}
.cta-section{background:#1C1526;border-radius:24px;padding:40px;text-align:center;margin-top:40px;}
.cta-section h2{font-family:'Outfit',sans-serif;font-size:26px;font-weight:800;color:white;margin-bottom:12px;letter-spacing:-0.5px;}
.cta-section p{color:rgba(255,255,255,0.5);margin-bottom:24px;}
@media(max-width:600px){.stats-grid{grid-template-columns:1fr 1fr;}.chars{grid-template-columns:repeat(2,1fr);}.for-grid{grid-template-columns:1fr;}}
</style>
</head>
<body>${header}
<div class="about-hero">
  <h1>Built for teachers.<br><span>Loved by kids.</span></h1>
  <p>Finding worksheets that kids actually want to do takes hours. We made it take seconds.</p>
</div>
<div class="container">
  <div class="mission">
    <p>"Every child deserves worksheets that make them want to learn — not just fill in blanks. We built Examel because the worksheet problem was real: too many generic, boring printables and not enough time to find better ones."</p>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-num">1,000+</div><div class="stat-label">Free worksheets</div></div>
    <div class="stat-card"><div class="stat-num">Grades 1–6</div><div class="stat-label">All grade levels</div></div>
    <div class="stat-card"><div class="stat-num">Daily</div><div class="stat-label">New worksheets added</div></div>
  </div>
  <div class="prose">
    <h2>What makes Examel different</h2>
    <p>Every worksheet on Examel has a theme — space, pirates, dinosaurs, cooking, sports — woven directly into the questions. Not just in the title. Not as decoration. The theme IS the worksheet.</p>
    <p>A Grade 3 multiplication worksheet with a space theme has astronauts carrying supplies to different planets, rockets needing fuel calculations, and space stations counting crew members. The math is the same. But kids want to do it.</p>
    <h2>Meet the characters</h2>
  </div>
  <div class="chars">
    <div class="char-card"><div class="char-svg"><svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(108,92,231,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#6C5CE7"/><path d="M16 96 Q60 86 104 96 L108 124 Q60 134 12 124 Z" fill="#7C6CF7"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#5A4BD1"/><ellipse cx="60" cy="68" rx="38" ry="42" fill="#C8874A"/><ellipse cx="60" cy="32" rx="40" ry="22" fill="#1A0A00"/><circle cx="38" cy="36" r="14" fill="#1A0A00"/><circle cx="60" cy="28" r="16" fill="#1A0A00"/><circle cx="82" cy="36" r="14" fill="#1A0A00"/><path d="M26 42 Q20 62 24 82" fill="#1A0A00"/><path d="M94 42 Q100 62 96 82" fill="#1A0A00"/><path d="M80,30 Q90,20 96,28 Q90,26 88,32 Z" fill="#FF85A1"/><path d="M96,28 Q106,20 110,30 Q104,28 102,34 Z" fill="#FF6B8E"/><circle cx="96" cy="30" r="6" fill="#FF85A1"/><circle cx="48" cy="66" r="14" fill="white"/><circle cx="72" cy="66" r="14" fill="white"/><circle cx="49" cy="67" r="10" fill="#3D1F00"/><circle cx="73" cy="67" r="10" fill="#3D1F00"/><circle cx="53" cy="62" r="5" fill="white"/><circle cx="77" cy="62" r="5" fill="white"/><circle cx="49" cy="68" r="3.5" fill="#0A0500"/><circle cx="73" cy="68" r="3.5" fill="#0A0500"/><path d="M38 54 Q48 48 58 53" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M62 53 Q72 48 82 54" stroke="#1A0A00" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><circle cx="66" cy="78" r="2.5" fill="#A05830" opacity="0.5"/><path d="M46 88 Q60 100 74 88" stroke="#C05030" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="80" r="10" fill="#FF9999" opacity="0.2"/><circle cx="80" cy="80" r="10" fill="#FF9999" opacity="0.2"/></svg></div><div class="char-name">Maya</div><div class="char-role">Math Guide</div></div>
    <div class="char-card"><div class="char-svg"><svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(8,145,178,0.12)"/><rect x="22" y="72" width="76" height="52" rx="16" fill="#0891B2"/><ellipse cx="34" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="86" cy="120" rx="14" ry="8" fill="#1C1526"/><ellipse cx="60" cy="68" rx="40" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="30" rx="38" ry="22" fill="#6B3A2A"/><ellipse cx="26" cy="52" rx="13" ry="20" fill="#6B3A2A"/><ellipse cx="94" cy="52" rx="13" ry="20" fill="#6B3A2A"/><circle cx="48" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><circle cx="72" cy="66" r="15" fill="none" stroke="#4A3728" stroke-width="3"/><path d="M63 66 Q62 64 61 66" stroke="#4A3728" stroke-width="3" fill="none"/><circle cx="48" cy="66" r="10" fill="white"/><circle cx="72" cy="66" r="10" fill="white"/><circle cx="49" cy="67" r="7" fill="#3A2010"/><circle cx="73" cy="67" r="7" fill="#3A2010"/><circle cx="52" cy="63" r="3.5" fill="white"/><circle cx="76" cy="63" r="3.5" fill="white"/><circle cx="49" cy="68" r="2.5" fill="#0A0500"/><circle cx="73" cy="68" r="2.5" fill="#0A0500"/><path d="M50 88 Q60 98 70 88" stroke="#C06050" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/><circle cx="84" cy="78" r="10" fill="#FFB0A0" opacity="0.2"/></svg></div><div class="char-name">Leo</div><div class="char-role">English Guide</div></div>
    <div class="char-card"><div class="char-svg"><svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="105" rx="36" ry="8" fill="rgba(5,150,105,0.12)"/><rect x="18" y="70" width="84" height="54" rx="18" fill="#F8F8F8"/><rect x="30" y="76" width="60" height="28" rx="12" fill="#0D9488"/><ellipse cx="34" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="86" cy="122" rx="14" ry="8" fill="#0F766E"/><ellipse cx="60" cy="66" rx="42" ry="46" fill="#7B3F0E"/><ellipse cx="60" cy="26" rx="42" ry="24" fill="#0A0500"/><circle cx="32" cy="28" r="22" fill="#0A0500"/><circle cx="88" cy="28" r="22" fill="#0A0500"/><ellipse cx="32" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="88" cy="50" rx="12" ry="6" fill="#F59E0B"/><ellipse cx="32" cy="49" rx="9" ry="4" fill="#FBBF24"/><ellipse cx="88" cy="49" rx="9" ry="4" fill="#FBBF24"/><rect x="20" y="54" width="14" height="52" rx="7" fill="#0A0500"/><rect x="86" y="54" width="14" height="52" rx="7" fill="#0A0500"/><circle cx="27" cy="95" r="6" fill="#F59E0B" stroke="#0A0500" stroke-width="1.5"/><circle cx="93" cy="95" r="6" fill="#10B981" stroke="#0A0500" stroke-width="1.5"/><circle cx="48" cy="64" r="16" fill="white"/><circle cx="72" cy="64" r="16" fill="white"/><circle cx="49" cy="65" r="11" fill="#1A0500"/><circle cx="73" cy="65" r="11" fill="#1A0500"/><circle cx="53" cy="60" r="5.5" fill="white"/><circle cx="77" cy="60" r="5.5" fill="white"/><circle cx="49" cy="66" r="4" fill="#050100"/><circle cx="73" cy="66" r="4" fill="#050100"/><path d="M46 80 Q60 94 74 80" stroke="#C05030" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="72" r="12" fill="#FF8C69" opacity="0.25"/><circle cx="84" cy="72" r="12" fill="#FF8C69" opacity="0.25"/></svg></div><div class="char-name">Zoe</div><div class="char-role">Science Guide</div></div>
    <div class="char-card"><div class="char-svg"><svg width="110" height="130" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="108" rx="36" ry="8" fill="rgba(239,68,68,0.12)"/><rect x="22" y="74" width="80" height="60" rx="18" fill="#EF4444"/><ellipse cx="62" cy="70" rx="10" ry="9" fill="#FDBCB4"/><ellipse cx="60" cy="46" rx="42" ry="44" fill="#FDBCB4"/><ellipse cx="60" cy="10" rx="40" ry="22" fill="#3D1F00"/><path d="M22 18 Q46 2 96 6 Q108 12 112 24" fill="#3D1F00"/><rect x="22" y="10" width="76" height="13" rx="6.5" fill="#EF4444"/><circle cx="44" cy="44" r="14" fill="white"/><circle cx="76" cy="44" r="14" fill="white"/><circle cx="45" cy="45" r="9" fill="#3D1F00"/><circle cx="77" cy="45" r="9" fill="#3D1F00"/><circle cx="48" cy="41" r="4.5" fill="white"/><circle cx="80" cy="41" r="4.5" fill="white"/><circle cx="45" cy="46" r="3" fill="#0A0500"/><circle cx="77" cy="46" r="3" fill="#0A0500"/><path d="M40 66 Q60 84 80 66" stroke="#C06050" stroke-width="3" fill="#FF9999" stroke-linecap="round"/><path d="M44 68 Q60 78 76 68" fill="white"/><circle cx="28" cy="58" r="11" fill="#FF9999" opacity="0.25"/><circle cx="92" cy="58" r="11" fill="#FF9999" opacity="0.25"/></svg></div><div class="char-name">Max</div><div class="char-role">Drills Guide</div></div>
  </div>
  <div class="for-grid">
    <div class="for-card">
      <h3>For Teachers</h3>
      <ul>
        <li>Common Core State Standards aligned</li>
        <li>Grade-appropriate difficulty</li>
        <li>Answer key on every worksheet</li>
        <li>Print-ready US Letter format</li>
        <li>No login or account required</li>
        <li>New content added daily</li>
      </ul>
    </div>
    <div class="for-card">
      <h3>For Parents</h3>
      <ul>
        <li>Free forever — no hidden costs</li>
        <li>Instant PDF download</li>
        <li>Themes kids actually enjoy</li>
        <li>Safe and age-appropriate</li>
        <li>No subscription needed</li>
        <li>Works on any printer</li>
      </ul>
    </div>
  </div>
  <div class="cta-section">
    <h2>Start exploring free worksheets</h2>
    <p>Over 1,000 worksheets across Math, English, and Science. New ones every day.</p>
    <a href="/free-math-worksheets/" class="btn-primary">Browse Free Worksheets →</a>
  </div>
</div>
${footer}</body></html>`;

// ── 404 PAGE ─────────────────────────────────────────────────────────────
const notFoundHTML = `<!DOCTYPE html>
<html lang="en">
<head>${sharedHead('Page Not Found','The page you were looking for could not be found. Browse free worksheets at Examel.','404')}${css}
<style>
.lost{text-align:center;padding:80px 24px;}
.lost-emoji{font-size:64px;margin-bottom:24px;display:block;}
.lost h1{font-family:'Outfit',sans-serif;font-size:32px;font-weight:800;color:#1A1420;margin-bottom:12px;letter-spacing:-0.5px;}
.lost p{color:#6B6475;font-size:16px;margin-bottom:32px;max-width:440px;margin-left:auto;margin-right:auto;}
.lost-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
.lost-link{padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;font-family:'Outfit',sans-serif;border:2px solid #EDE8DF;color:#6B6475;transition:all 0.2s;}
.lost-link:hover{border-color:#6C5CE7;color:#6C5CE7;}
</style>
</head>
<body>${header}
<div class="container">
  <div class="lost">
    <span class="lost-emoji">🔍</span>
    <h1>Oops! That worksheet got lost.</h1>
    <p>The page you were looking for doesn't exist. Let's find you something great instead.</p>
    <a href="/" class="btn-primary" style="display:inline-block;margin-bottom:20px;">Go to Homepage →</a>
    <div class="lost-links">
      <a href="/free-math-worksheets/" class="lost-link">Math Worksheets</a>
      <a href="/free-english-worksheets/" class="lost-link">English Worksheets</a>
      <a href="/free-science-worksheets/" class="lost-link">Science Worksheets</a>
      <a href="/free-math-drills/" class="lost-link">Math Drills</a>
    </div>
  </div>
</div>
${footer}</body></html>`;

// ── robots.txt ───────────────────────────────────────────────────────────
const robotsTxt = `User-agent: *
Allow: /

Disallow: /downloads/
Disallow: /thumbnails/

Sitemap: https://examel.com/sitemap.xml`;

// ── Write all files ──────────────────────────────────────────────────────
const base = '/opt/examel/examel-pages';

fs.mkdirSync(`${base}/privacy-policy`, { recursive: true });
fs.writeFileSync(`${base}/privacy-policy/index.html`, privacyHTML);
console.log('✓ privacy-policy/index.html');

fs.mkdirSync(`${base}/terms`, { recursive: true });
fs.writeFileSync(`${base}/terms/index.html`, termsHTML);
console.log('✓ terms/index.html');

fs.mkdirSync(`${base}/about`, { recursive: true });
fs.writeFileSync(`${base}/about/index.html`, aboutHTML);
console.log('✓ about/index.html');

fs.writeFileSync(`${base}/404.html`, notFoundHTML);
console.log('✓ 404.html');

fs.writeFileSync(`${base}/robots.txt`, robotsTxt);
console.log('✓ robots.txt');

console.log('\nAll static pages generated.');
