#!/usr/bin/env node
/**
 * DMAR Codex Automator
 * --------------------------------------------------
 * One-run script to:
 *  1) create /privacy.html and /cookies.html (drop-in, GDPR/UK-GDPR ready)
 *  2) inject privacy micro-notice + required checkbox into forms (careers/contact)
 *  3) add footer links (Privacy | Cookies | Contact) site-wide
 *  4) optionally inject a minimal cookie banner and block non-essential scripts until consent
 *
 * Usage examples:
 *   node codex-dmar.js --root ./ --pages index.html,contact.html,careers.html \
 *     --policy /privacy.html --cookies /cookies.html --banner on --dry-run
 *
 * Defaults:
 *   --root = current directory
 *   --pages = index.html,contact.html,careers.html
 *   --policy = /privacy.html
 *   --cookies = /cookies.html
 *   --banner = off
 *   --companyName = "DMAR International MB"
 *   --companyNumber = "[306293837]"
 *   --companyAddress = "[Litorinos g. 3, Kalotės k., LT-92275 Klaipėdos r.]"
 *   --privacyEmail = "privacy@dmarinternational.com"
 *   --contact = /contact.html
 *
 * This script is idempotent: safe to run multiple times.
 */

const fs = require('fs');
const path = require('path');

// --- tiny argument parser ---
const args = process.argv.slice(2);
const getArg = (name, def = undefined) => {
  const i = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return def;
  const eq = args[i].indexOf('=');
  if (eq !== -1) return args[i].slice(eq + 1);
  const nxt = args[i + 1];
  if (!nxt || nxt.startsWith('--')) return true;
  return nxt;
};

const ROOT = path.resolve(getArg('root', '.'));
const PAGES = (getArg('pages', 'index.html,contact.html,careers.html') || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const POLICY_PATH = getArg('policy', '/privacy.html');
const COOKIES_PATH = getArg('cookies', '/cookies.html');
const CONTACT_PATH = getArg('contact', '/contact.html');
const BANNER = String(getArg('banner', 'off')).toLowerCase() === 'on';
const DRY_RUN = !!getArg('dry-run', false);

const companyName = getArg('companyName', 'DMAR International MB');
const companyNumber = getArg('companyNumber', '[306293837]');
const companyAddress = getArg('companyAddress', '[Litorinos g. 3, Kalotės k., LT-92275 Klaipėdos r.]');
const privacyEmail = getArg('privacyEmail', 'info@dmarinternational.com');

const TODAY = new Date();
const LAST_UPDATED = TODAY.toLocaleString('en-GB', {
  day: '2-digit', month: 'long', year: 'numeric'
});

// --- helpers ---
const log = (...m) => console.log('[codex-dmar]', ...m);
const rel = p => path.relative(process.cwd(), p);

function readFileSafe(fp) {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function ensureDir(fp) {
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) {
    if (DRY_RUN) {
      log('DRY RUN: would create directory', rel(dir));
    } else {
      fs.mkdirSync(dir, { recursive: true });
      log('Created directory', rel(dir));
    }
  }
}

function writeFileSmart(fp, content) {
  const existing = readFileSafe(fp);
  if (existing && existing.trim() === content.trim()) {
    log('No changes for', rel(fp));
    return false;
  }
  ensureDir(fp);
  if (DRY_RUN) {
    log('DRY RUN: would write', rel(fp));
    return true;
  }
  fs.writeFileSync(fp, content, 'utf8');
  log(existing ? 'Updated' : 'Created', rel(fp));
  return true;
}

function normalisePath(basePath) {
  return basePath.startsWith('/')
    ? basePath
    : `/${basePath}`;
}

const POLICY_LINK = normalisePath(POLICY_PATH);
const COOKIES_LINK = normalisePath(COOKIES_PATH);
const CONTACT_LINK = normalisePath(CONTACT_PATH);

// --- policy pages ---
const privacyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Policy | ${companyName}</title>
  <link rel="stylesheet" href="/assets/css/main.css">
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; }
    main { max-width: 860px; margin: 4rem auto; padding: 0 1.5rem 4rem; }
    h1, h2, h3 { color: #0c223a; }
    nav.breadcrumb { font-size: 0.9rem; margin-bottom: 2rem; }
    nav.breadcrumb a { color: #0c223a; text-decoration: none; }
    nav.breadcrumb span { margin: 0 0.3rem; }
    section { margin-bottom: 2.5rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #d6dde5; padding: 0.75rem; text-align: left; vertical-align: top; }
    th { background: #f5f8fb; }
    ul { padding-left: 1.2rem; }
    .meta { font-size: 0.95rem; color: #4a5a6a; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <main>
    <nav class="breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span>Privacy</span></nav>
    <h1>Privacy Policy</h1>
    <p class="meta">Last updated: ${LAST_UPDATED}</p>
    <section>
      <h2>Who we are</h2>
      <p>${companyName} (<abbr title="company number">${companyNumber}</abbr>) operates this website and is the controller of your personal data. Our registered address is ${companyAddress}.</p>
    </section>
    <section>
      <h2>How to contact us</h2>
      <p>If you have any questions about this notice or how we handle your information, email <a href="mailto:${privacyEmail}">${privacyEmail}</a>. You can also write to our registered address.</p>
    </section>
    <section>
      <h2>The personal data we collect</h2>
      <p>We collect and process the following categories of personal data:</p>
      <ul>
        <li>Contact details you provide through our forms (for example your name, company, email address and telephone number).</li>
        <li>Information relating to your enquiry and any follow-up correspondence.</li>
        <li>Technical data such as IP address, device and browser information, if analytics cookies are enabled.</li>
      </ul>
    </section>
    <section>
      <h2>How we use your personal data</h2>
      <p>We use your personal data to:</p>
      <ul>
        <li>Respond to enquiries and provide the services or information you request.</li>
        <li>Assess job applications and manage our recruitment process.</li>
        <li>Monitor and improve our website, products and services.</li>
      </ul>
    </section>
    <section>
      <h2>Our lawful bases</h2>
      <p>We rely on the following lawful bases under the UK GDPR/EU GDPR:</p>
      <table>
        <thead>
          <tr><th>Purpose</th><th>Lawful basis</th></tr>
        </thead>
        <tbody>
          <tr><td>Responding to enquiries</td><td>Legitimate interests – communicating with prospective and existing clients.</td></tr>
          <tr><td>Recruitment</td><td>Legitimate interests – managing our recruitment process. Where required, we may ask for consent to retain your CV for longer.</td></tr>
          <tr><td>Analytics (if enabled)</td><td>Consent – collected only after you accept cookies.</td></tr>
        </tbody>
      </table>
    </section>
    <section>
      <h2>Who we share your data with</h2>
      <p>We only share your personal data when necessary. Typical recipients include our cloud hosting and email providers, and any processors who help us deliver our services. We ensure any third parties keep your data secure and act under our instructions.</p>
    </section>
    <section>
      <h2>International transfers</h2>
      <p>If we transfer personal data outside the UK or EEA, we use appropriate safeguards such as the UK International Data Transfer Agreement or the EU Standard Contractual Clauses.</p>
    </section>
    <section>
      <h2>How long we keep your data</h2>
      <p>We keep personal data only for as long as necessary. Enquiry records are kept for up to 24 months. Recruitment information is retained for up to 12 months unless you consent to a longer period.</p>
    </section>
    <section>
      <h2>Your rights</h2>
      <p>You have rights under data protection law including to access, correct, delete or transfer your data, to object to processing, and to withdraw consent. To exercise these rights, contact us at <a href="mailto:${privacyEmail}">${privacyEmail}</a>. You can also complain to the UK Information Commissioner's Office or your local supervisory authority.</p>
    </section>
    <section>
      <h2>Updates</h2>
      <p>We may update this notice from time to time. Significant changes will be highlighted on this page.</p>
    </section>
  </main>
</body>
</html>
`;

const cookiesHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cookie Policy | ${companyName}</title>
  <link rel="stylesheet" href="/assets/css/main.css">
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; }
    main { max-width: 860px; margin: 4rem auto; padding: 0 1.5rem 4rem; }
    h1, h2, h3 { color: #0c223a; }
    nav.breadcrumb { font-size: 0.9rem; margin-bottom: 2rem; }
    nav.breadcrumb a { color: #0c223a; text-decoration: none; }
    nav.breadcrumb span { margin: 0 0.3rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #d6dde5; padding: 0.75rem; text-align: left; vertical-align: top; }
    th { background: #f5f8fb; }
  </style>
</head>
<body>
  <main>
    <nav class="breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span>Cookies</span></nav>
    <h1>Cookie Policy</h1>
    <p>We use cookies and similar technologies to ensure the website operates securely and efficiently. We keep the use of cookies to a minimum and only deploy analytics cookies when you have given consent.</p>
    <section>
      <h2>Strictly necessary cookies</h2>
      <p>These cookies are required for the website to function. They do not store personal data and cannot be disabled.</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Purpose</th><th>Expires</th></tr>
        </thead>
        <tbody>
          <tr><td>site_session</td><td>Maintains session preferences (first-party).</td><td>End of session</td></tr>
        </tbody>
      </table>
    </section>
    <section>
      <h2>Analytics cookies (optional)</h2>
      <p>Analytics cookies help us understand how visitors use our site. We load these cookies only after you accept the banner.</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Purpose</th><th>Expires</th></tr>
        </thead>
        <tbody>
          <tr><td>_ga</td><td>Google Analytics – distinguishes users.</td><td>2 years</td></tr>
          <tr><td>_ga_<em>property</em></td><td>Google Analytics – maintains session state.</td><td>24 months</td></tr>
        </tbody>
      </table>
      <p>If you do not consent, these cookies will not load.</p>
    </section>
    <section>
      <h2>Managing cookies</h2>
      <p>You can update your preference at any time by selecting “Cookie settings” in the banner. Most browsers also let you control cookies via settings.</p>
    </section>
    <section>
      <h2>Contact</h2>
      <p>Questions about this cookie policy? Email <a href="mailto:${privacyEmail}">${privacyEmail}</a>.</p>
    </section>
  </main>
</body>
</html>
`;

const policyWritten = writeFileSmart(path.join(ROOT, POLICY_LINK.replace(/^\//, '')), privacyHtml);
const cookiesWritten = writeFileSmart(path.join(ROOT, COOKIES_LINK.replace(/^\//, '')), cookiesHtml);

// --- HTML manipulation helpers ---
function injectBeforeClose(tag, html, snippet) {
  const closeTag = `</${tag}>`;
  const idx = html.toLowerCase().lastIndexOf(closeTag);
  if (idx === -1) return html;
  return html.slice(0, idx) + snippet + '\n' + html.slice(idx);
}

function injectForms(html) {
  const formRegex = /<form\b[\s\S]*?<\/form>/gi;
  return html.replace(formRegex, formBlock => {
    if (formBlock.includes('data-codex-dmar="form-privacy"') || formBlock.includes('codex-privacy-consent')) {
      return formBlock;
    }
    const indentMatch = formBlock.match(/^(\s*)<form/i);
    const indent = indentMatch ? indentMatch[1] + '  ' : '  ';
    const notice = `\n${indent}<div class="codex-privacy-note" data-codex-dmar="form-privacy">\n${indent}  <p>By submitting this form you confirm you have read our <a href="${POLICY_LINK}">Privacy Policy</a> and understand how ${companyName} handles your data.</p>\n${indent}  <label class="codex-privacy-consent">\n${indent}    <input type="checkbox" name="privacyConsent" required> I consent to ${companyName} processing my personal data for the purpose of this enquiry.\n${indent}  </label>\n${indent}</div>\n`;
    const closeIndex = formBlock.toLowerCase().lastIndexOf('</form>');
    if (closeIndex === -1) return formBlock;
    return formBlock.slice(0, closeIndex) + notice + formBlock.slice(closeIndex);
  });
}

function ensureFooter(html) {
  const footerSnippet = `\n    <div class="codex-footer-links" data-codex-dmar="footer-links">\n      <a href="${POLICY_LINK}">Privacy</a> | <a href="${COOKIES_LINK}">Cookies</a> | <a href="${CONTACT_LINK}">Contact</a>\n    </div>`;
  if (html.includes('data-codex-dmar="footer-links"')) {
    return html;
  }
  const footerMatch = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  if (footerMatch) {
    const fullFooter = footerMatch[0];
    const updatedFooter = injectBeforeClose('footer', fullFooter, footerSnippet);
    return html.replace(fullFooter, updatedFooter);
  }
  // No footer found – inject before closing body
  const newFooter = `\n  <footer class="site-footer" data-codex-dmar="footer">${footerSnippet}\n  </footer>`;
  return injectBeforeClose('body', html, newFooter);
}

function ensureBanner(html) {
  if (!BANNER || html.includes('data-codex-dmar="cookie-banner"')) {
    return html;
  }
  const styleSnippet = `\n  <style data-codex-dmar="cookie-banner">\n    .codex-cookie-banner { position: fixed; z-index: 9999; left: 1rem; right: 1rem; bottom: 1rem; background: rgba(12,34,58,0.97); color: #fff; padding: 1.25rem 1.5rem; border-radius: 12px; box-shadow: 0 18px 45px rgba(12,34,58,0.25); max-width: 420px; margin: 0 auto; font-size: 0.95rem; }\n    .codex-cookie-banner h2 { margin-top: 0; font-size: 1.15rem; color: #fff; }\n    .codex-cookie-banner p { margin: 0.5rem 0 1rem; }\n    .codex-cookie-banner__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }\n    .codex-cookie-banner button { cursor: pointer; border: none; border-radius: 999px; padding: 0.55rem 1.4rem; font-weight: 600; font-size: 0.95rem; }\n    .codex-cookie-banner button[data-action="accept"] { background: #2fd3a3; color: #0c223a; }\n    .codex-cookie-banner button[data-action="decline"] { background: rgba(255,255,255,0.15); color: #fff; }\n    @media (min-width: 768px) { .codex-cookie-banner { left: auto; right: 2rem; bottom: 2rem; } }\n  </style>`;
  const bannerHtml = `\n  <div class="codex-cookie-banner" data-codex-dmar="cookie-banner" role="dialog" aria-live="polite">\n    <h2>Cookies</h2>\n    <p>We use essential cookies to make our site work and would like to use analytics cookies to understand usage. You can change your choice at any time.</p>\n    <div class="codex-cookie-banner__actions">\n      <button type="button" data-action="accept">Accept all</button>\n      <button type="button" data-action="decline">Decline</button>\n    </div>\n    <p style="margin-top:1rem;font-size:0.85rem;">Read our <a href="${COOKIES_LINK}" style="color:#2fd3a3;">cookie policy</a>.</p>\n  </div>`;
  const scriptSnippet = `\n  <script data-codex-dmar="cookie-banner">\n    (function(){\n      const STORAGE_KEY = 'cookieConsent';\n      const banner = document.querySelector('[data-codex-dmar="cookie-banner"]');\n      if (!banner) return;\n      function setConsent(value) {\n        localStorage.setItem(STORAGE_KEY, value);\n        document.documentElement.dataset.cookieConsent = value;\n        window.dispatchEvent(new CustomEvent('codex:cookie-consent', { detail: value }));\n      }\n      function hide() { banner.setAttribute('hidden', 'hidden'); }\n      const stored = localStorage.getItem(STORAGE_KEY);\n      if (stored) {\n        setConsent(stored);\n        hide();\n      } else {\n        banner.removeAttribute('hidden');\n      }\n      banner.addEventListener('click', function(ev){\n        const btn = ev.target.closest('button[data-action]');\n        if (!btn) return;\n        const action = btn.getAttribute('data-action');\n        if (action === 'accept') {\n          setConsent('accepted');\n        } else {\n          setConsent('declined');\n        }\n        hide();\n      });\n      window.codexLoadAfterConsent = function(callback){\n        if (typeof callback !== 'function') return;\n        if (localStorage.getItem(STORAGE_KEY) === 'accepted') {\n          callback();\n        } else {\n          window.addEventListener('codex:cookie-consent', function handler(evt){\n            if (evt.detail === 'accepted') {\n              window.removeEventListener('codex:cookie-consent', handler);\n              callback();\n            }\n          });\n        }\n      };\n    })();\n  </script>`;
  let updated = html;
  if (!updated.includes('data-codex-dmar="cookie-banner"')) {
    updated = injectBeforeClose('body', updated, bannerHtml);
  }
  if (!updated.includes('<style data-codex-dmar="cookie-banner"')) {
    updated = injectBeforeClose('head', updated, styleSnippet);
  }
  if (!updated.includes('<script data-codex-dmar="cookie-banner"')) {
    updated = injectBeforeClose('body', updated, scriptSnippet);
  }
  return updated;
}

function processPage(pagePath) {
  const absPath = path.join(ROOT, pagePath);
  const html = readFileSafe(absPath);
  if (!html) {
    log('Skipping missing page', rel(absPath));
    return false;
  }
  let updated = html;
  updated = injectForms(updated);
  updated = ensureFooter(updated);
  updated = ensureBanner(updated);
  if (updated === html) {
    log('No changes for', rel(absPath));
    return false;
  }
  if (DRY_RUN) {
    log('DRY RUN: would update', rel(absPath));
    return true;
  }
  fs.writeFileSync(absPath, updated, 'utf8');
  log('Updated', rel(absPath));
  return true;
}

let touched = false;
for (const page of PAGES) {
  const changed = processPage(page);
  touched = touched || changed;
}

if (!policyWritten && !cookiesWritten && !touched) {
  log('All files already up to date.');
}
