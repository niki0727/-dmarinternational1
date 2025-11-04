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
 *   --companyNumber = "[Insert company number]"
 *   --companyAddress = "[Insert full address]"
 *   --privacyEmail = "privacy@dmarinternational.com"
 *
 * This script is idempotent: safe to run multiple times.
 */

const fs = require('fs');
const path = require('path');

// --- tiny argument parser ---
const args = process.argv.slice(2);
const getArg = (name, def = undefined) => {
  const flag = `--${name}`;
  const prefixed = `${flag}=`;
  const direct = args.find((a) => a === flag || a.startsWith(prefixed));
  if (!direct) return def;
  if (direct.startsWith(prefixed)) return direct.slice(prefixed.length);
  const next = args[args.indexOf(direct) + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
};

const ROOT = path.resolve(getArg('root', '.'));
const PAGES = (getArg('pages', 'index.html,contact.html,careers.html') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const POLICY_PATH = getArg('policy', '/privacy.html');
const COOKIES_PATH = getArg('cookies', '/cookies.html');
const BANNER = String(getArg('banner', 'off')).toLowerCase() === 'on';
const DRY_RUN = Boolean(getArg('dry-run', false));

const companyName = getArg('companyName', 'DMAR International MB');
const companyNumber = getArg('companyNumber', '[Insert company number]');
const companyAddress = getArg('companyAddress', '[Insert full address]');
const privacyEmail = getArg('privacyEmail', 'privacy@dmarinternational.com');

const TODAY = new Date();
const LAST_UPDATED = TODAY.toLocaleString('en-GB', {
  day: '2-digit', month: 'long', year: 'numeric'
});

// --- helpers ---
const log = (...m) => console.log('[codex-dmar]', ...m);
const warn = (...m) => console.warn('[codex-dmar]', ...m);
const rel = (p) => path.relative(ROOT, p) || '.';

function readFileSafe(fp) {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch (err) {
    return null;
  }
}

function writeFileSafe(fp, content) {
  if (DRY_RUN) {
    log('DRY RUN:', rel(fp), 'would be written.');
    return false;
  }
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content, 'utf8');
  log('Wrote', rel(fp));
  return true;
}

function ensurePrivacyPage() {
  const target = path.join(ROOT, POLICY_PATH.replace(/^[\\/]+/, ''));
  const template = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Privacy • ${companyName}</title>
  <link rel="stylesheet" href="/assets/styles.css"/>
</head>
<body>
  <main class="policy">
    <section class="section">
      <div class="container policy">
        <h2>Privacy Policy</h2>
        <p class="lead">Last updated: ${LAST_UPDATED}</p>
        <h3>Who we are</h3>
        <p>${companyName} (${companyNumber}), located at ${companyAddress}, is responsible for the personal data collected through this site and our commercial engagements.</p>
        <h3>What data we collect</h3>
        <ul>
          <li>Contact form submissions: names, business contact details and enquiry notes.</li>
          <li>Careers submissions: CVs, experience notes, location and availability.</li>
          <li>Operational correspondence: project documentation exchanged during active engagements.</li>
          <li>Website analytics: pseudonymous identifiers when you consent to analytics cookies.</li>
        </ul>
        <h3>How and why we use data</h3>
        <ul>
          <li>To respond to enquiries and provide proposals (contract / legitimate interest).</li>
          <li>To manage our talent network and resource projects (legitimate interest).</li>
          <li>To meet marine warranty, regulatory and insurance requirements (legal obligation).</li>
          <li>To analyse site usage when cookies are permitted (consent).</li>
        </ul>
        <h3>Retention</h3>
        <p>Enquiries are retained for up to 24 months. CVs and resource notes are retained for up to 12 months. Engagement records are kept for the life of the contract plus seven years.</p>
        <h3>Sharing and processors</h3>
        <p>We share personal data only with processors who provide secure email, document storage, analytics or communication services under written data processing agreements.</p>
        <h3>International transfers</h3>
        <p>When data leaves the EEA or UK, we rely on Standard Contractual Clauses (SCCs) or equivalent safeguards to ensure adequate protection.</p>
        <h3>Security</h3>
        <p>Access to personal data is restricted to authorised personnel. We apply encryption, access controls and supplier reviews to keep data secure.</p>
        <h3>Your rights</h3>
        <p>You may request access, correction, deletion, or restriction, and can object to certain processing. You can also request data portability or lodge a complaint with your supervisory authority.</p>
        <h3>Contact</h3>
        <p>To exercise your rights or ask a question, email <a href="mailto:${privacyEmail}">${privacyEmail}</a>.</p>
      </div>
    </section>
  </main>
</body>
</html>`;
  const existing = readFileSafe(target);
  if (existing && existing.includes('Privacy Policy')) {
    log('Privacy page already present:', rel(target));
    return;
  }
  writeFileSafe(target, template);
}

function ensureCookiesPage() {
  const target = path.join(ROOT, COOKIES_PATH.replace(/^[\\/]+/, ''));
  const template = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Cookies • ${companyName}</title>
  <link rel="stylesheet" href="/assets/styles.css"/>
</head>
<body>
  <main class="policy">
    <section class="section">
      <div class="container policy">
        <h2>Cookies and storage</h2>
        <p class="lead">How we use cookies, pixels and browser storage, and how to manage your preferences.</p>
        <h3>Categories</h3>
        <ul>
          <li><strong>Essential:</strong> Required for site security and remembering your settings. Cannot be disabled.</li>
          <li><strong>Analytics:</strong> Optional measurement cookies that help us improve site content.</li>
          <li><strong>Marketing:</strong> Optional remarketing or campaign tags used when campaigns are running.</li>
        </ul>
        <h3>Cookie inventory</h3>
        <table class="table cookies-table">
          <thead><tr><th>Name</th><th>Purpose</th><th>Retention</th><th>Category</th></tr></thead>
          <tbody>
            <tr><td>cookieConsent</td><td>Stores your consent choices.</td><td>12 months</td><td>Essential</td></tr>
            <tr><td>_ga / _gid</td><td>Google Analytics measurement (only after consent).</td><td>Up to 2 years</td><td>Analytics</td></tr>
            <tr><td>_gcl_au</td><td>Google Ads conversion tracking (only after consent).</td><td>90 days</td><td>Marketing</td></tr>
          </tbody>
        </table>
        <h3>Manage preferences</h3>
        <p>Use the cookie banner or click the button below to revisit your preferences.</p>
        <p><button type="button" class="btn alt" data-cookie-settings>Open cookie settings</button></p>
      </div>
    </section>
  </main>
</body>
</html>`;
  const existing = readFileSafe(target);
  if (existing && existing.includes('Cookies and storage')) {
    log('Cookies page already present:', rel(target));
    return;
  }
  writeFileSafe(target, template);
}

const headSnippet = `  <!-- Google Tag Manager (loads after consent) -->\n  <script>\n    window.dataLayer = window.dataLayer || [];\n    window.DMAR_CONSENT = window.DMAR_CONSENT || {};\n    window.DMAR_CONSENT.gtmId = 'GTM-M3Z5Z4PQ';\n  </script>\n  <script type="text/plain" data-cookie-category="analytics" data-cookie-src="https://www.googletagmanager.com/gtm.js?id=GTM-M3Z5Z4PQ"></script>\n  <!-- End Google Tag Manager -->`;

const consentBlock = (type) => `          <div class="privacy-consent">\n            <p class="small">We’ll use your personal data to process your ${type}. See our <a href="${POLICY_PATH}">Privacy Policy</a> for details.</p>\n            <label class="consent-option">\n              <input type="checkbox" name="privacyConsent" required />\n              <span>I have read and agree to the Privacy Policy</span>\n            </label>\n          </div>\n`;

function ensureHeadSnippet(html) {
  if (html.includes('DMAR_CONSENT.gtmId')) return html;
  if (html.includes('<!-- Google Tag Manager -->')) {
    return html.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/, headSnippet);
  }
  return html;
}

function ensureFooter(html) {
  if (html.includes('data-cookie-settings')) return html;
  return html.replace(
    /<div class="small"><a href="[^"]*privacy[^"]*">Privacy<\/a><\/div>/,
    `<div class="small"><a href="${POLICY_PATH}">Privacy</a></div>\n      <div class="small"><a href="${COOKIES_PATH}">Cookies</a></div>\n      <div class="small"><button type="button" class="link-button" data-cookie-settings>Cookie settings</button></div>`
  );
}

function injectConsent(html, target, type) {
  if (html.includes('privacy-consent')) return html;
  const regex = new RegExp(`(<form[^>]*${target}[^>]*>[\\s\\S]*?<div[^>]*class=\\"form-actions\\"[^>]*>)`);
  if (regex.test(html)) {
    return html.replace(
      /(<div class="message-field">[\s\S]*?<\/div>\s*)(<div class="form-actions">)/,
      `$1${consentBlock(type)}          $2`
    );
  }
  return html;
}

function updatePage(pagePath) {
  const fullPath = path.join(ROOT, pagePath);
  const html = readFileSafe(fullPath);
  if (!html) {
    warn('Skipping missing page', rel(fullPath));
    return;
  }
  let next = html;
  next = ensureHeadSnippet(next);
  next = ensureFooter(next);
  next = injectConsent(next, 'contact', 'enquiry');
  next = injectConsent(next, 'careers', 'application');
  if (next === html) {
    log('No changes needed for', rel(fullPath));
    return;
  }
  if (DRY_RUN) {
    log('DRY RUN: would update', rel(fullPath));
  } else {
    fs.writeFileSync(fullPath, next, 'utf8');
    log('Updated', rel(fullPath));
  }
}

function ensureBannerAssets() {
  if (!BANNER) return;
  const scriptPath = path.join(ROOT, 'assets', 'script.js');
  const script = readFileSafe(scriptPath);
  if (!script) {
    warn('Cannot locate assets/script.js to ensure banner hooks.');
    return;
  }
  if (script.includes('cookieConsent')) {
    log('Cookie banner logic already present in assets/script.js');
    return;
  }
  warn('Banner logic not detected. Please merge manually from site assets.');
}

function main() {
  log('Root:', ROOT);
  ensurePrivacyPage();
  ensureCookiesPage();
  PAGES.forEach(updatePage);
  ensureBannerAssets();
  log('Done.');
}

main();
