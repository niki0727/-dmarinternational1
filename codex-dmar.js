#!/usr/bin/env node
/**
 * DMAR Codex Automator
 * --------------------------------------------------
 * Bootstraps privacy, cookies, and consent assets for the DMAR International static site.
 * The script is idempotent: it will only add missing markup and skip existing changes.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const flag = args.find(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (!flag) return defaultValue;
  if (flag.includes('=')) return flag.split('=').slice(1).join('=');
  const value = args[args.indexOf(flag) + 1];
  if (!value || value.startsWith('--')) return true;
  return value;
};

const ROOT = path.resolve(getArg('root', '.'));
const PAGES = (getArg('pages', 'index.html,contact.html,careers.html,about.html,services.html,sectors.html,projects.html,sustainability.html') || '')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);
const POLICY_PATH = getArg('policy', 'privacy.html');
const COOKIES_PATH = getArg('cookies', 'cookies.html');
const ENABLE_BANNER = String(getArg('banner', 'on')).toLowerCase() === 'on';
const DRY_RUN = Boolean(getArg('dry-run', false));

const COMPANY = {
  name: getArg('companyName', 'DMAR International MB'),
  number: getArg('companyNumber', 'MB 306044652'),
  address: getArg('companyAddress', 'Litorinos g. 3, Kalotės k., Klaipėdos raj., 92275, Lithuania'),
  privacyEmail: getArg('privacyEmail', 'privacy@dmarinternational.com'),
};

const today = new Date();
const LAST_UPDATED = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

const rel = (targetPath) => path.relative(process.cwd(), targetPath);
const log = (...message) => console.log('[codex-dmar]', ...message);

const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
};

const writeFile = (filePath, contents) => {
  if (DRY_RUN) {
    log('(dry run) would write', rel(filePath));
    return;
  }
  fs.writeFileSync(filePath, contents, 'utf8');
  log('wrote', rel(filePath));
};

const ensureDir = (dirPath) => {
  if (DRY_RUN) return;
  fs.mkdirSync(dirPath, { recursive: true });
};

const bannerMarkup = ` <div id="cookie-banner" data-cookie-banner class="cookie-banner" role="dialog" aria-modal="true" aria-live="polite" hidden>
  <div class="cookie-banner__inner">
    <h2>Cookie preferences</h2>
    <p>We use essential cookies to make our site work. With your consent, we’ll also use analytics and marketing cookies to understand performance and tailor our services.</p>
    <div class="cookie-banner__options">
      <div class="cookie-banner__option">
        <div>
          <span class="cookie-banner__label">Essential cookies</span>
          <p class="cookie-banner__description">Always active — required for security, network management, and accessibility.</p>
        </div>
        <span class="cookie-banner__tag">Always on</span>
      </div>
      <label class="cookie-banner__option" data-cookie-option="analytics">
        <div>
          <span class="cookie-banner__label">Analytics cookies</span>
          <p class="cookie-banner__description">Help us measure traffic and improve the site.</p>
        </div>
        <input type="checkbox" data-cookie-toggle="analytics" />
      </label>
      <label class="cookie-banner__option" data-cookie-option="marketing">
        <div>
          <span class="cookie-banner__label">Marketing cookies</span>
          <p class="cookie-banner__description">Enable Google Ads and LinkedIn Insights once consent is given.</p>
        </div>
        <input type="checkbox" data-cookie-toggle="marketing" />
      </label>
    </div>
    <div class="cookie-banner__actions">
      <button type="button" class="btn" data-cookie-action="accept">Accept all</button>
      <button type="button" class="btn alt" data-cookie-action="save">Save choices</button>
      <button type="button" class="btn ghost" data-cookie-action="reject">Essential only</button>
    </div>
    <p class="cookie-banner__link"><a href="/cookies.html">View cookie details</a></p>
  </div>
</div>
<button type="button" class="cookie-manage" data-cookie-manage hidden>Cookie settings</button>`;

const consentBlock = `          <div class="privacy-consent">
            <p>We’ll use your personal data to process your enquiry/application. See our <a href="/privacy.html">Privacy Policy</a> for details.</p>
            <label for="@@ID@@">
              <input id="@@ID@@" name="privacyConsent" type="checkbox" required />
              <span>I have read and agree to the Privacy Policy</span>
            </label>
          </div>`;

const footerLink = `<div class="small"><a href="/privacy.html">Privacy</a></div>\n      <div class="small"><a href="/cookies.html">Cookies</a></div>`;

const ensureFooterLinks = (html) => {
  if (html.includes('<a href="/cookies.html">Cookies</a>')) return html;
  return html.replace('<div class="small"><a href="/privacy.html">Privacy</a></div>', footerLink);
};

const ensureBanner = (html) => {
  if (!ENABLE_BANNER) return html;
  if (html.includes('data-cookie-banner')) return html;
  return html.replace('<script src="/assets/script.js"></script>', `${bannerMarkup}\n\n<script src="/assets/script.js"></script>`);
};

const ensureConsentBlock = (html, formSelector, checkboxId) => {
  if (!formSelector) return html;
  if (html.includes(`id=\"${checkboxId}\"`)) return html;
  const insertionPoint = formSelector === 'contact'
    ? '          <div class="form-actions">'
    : '          <div style="margin-top:14px;display:flex;gap:10px;align-items:center">';
  if (!html.includes(insertionPoint)) return html;
  return html.replace(insertionPoint, `${consentBlock.replace(/@@ID@@/g, checkboxId)}\n${insertionPoint}`);
};

const stripGtm = (html) => html
  .replace(/\s*<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, '\n')
  .replace(/\s*<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, '\n');

const ensureManageButton = (html) => {
  if (html.includes('data-cookie-manage hidden')) return html;
  if (!html.includes('data-cookie-banner')) return html;
  return html.replace('<button type="button" class="cookie-manage" data-cookie-manage hidden>Cookie settings</button>', '<button type="button" class="cookie-manage" data-cookie-manage hidden>Cookie settings</button>');
};

const ensureScripts = () => {
  const srcPath = path.join(ROOT, 'assets', 'script.js');
  if (!fs.existsSync(srcPath)) {
    log('assets/script.js missing — add the shared behaviour script before running this tool.');
  }
};

const createPrivacyPage = () => {
  const filePath = path.join(ROOT, POLICY_PATH);
  if (fs.existsSync(filePath)) {
    log('privacy page exists — skip');
    return;
  }
  const template = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset=\"utf-8\"/>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n  <meta name=\"theme-color\" content=\"#0A5694\"/>\n  <title>Privacy • ${COMPANY.name}</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"/assets/styles.css\"/>\n  <meta name=\"description\" content=\"Privacy notice for ${COMPANY.name}.\"/>\n</head>\n<body>\n  <main>\n    <section class=\"section\">\n      <div class=\"container\">\n        <h1>Privacy Notice</h1>\n        <p class=\"lead\">Last updated: ${LAST_UPDATED}. This notice explains how ${COMPANY.name} collects and uses personal data and the choices available to you.</p>\n        <div class=\"card\" style=\"padding:24px;display:grid;gap:24px\">\n          <section>\n            <h2>Who we are</h2>\n            <p>${COMPANY.name} (company number ${COMPANY.number}) is registered at ${COMPANY.address}. We act as the data controller for the information described in this notice.</p>\n          </section>\n          <section>\n            <h2>What data we collect</h2>\n            <ul>\n              <li>Identity and contact details submitted through our contact and project enquiry forms.</li>\n              <li>Career information (CVs, qualifications, location, availability) submitted through the careers form.</li>\n              <li>Operational details you share to scope marine warranty or consultancy work.</li>\n              <li>Technical diagnostics from essential cookies required to keep the site secure.</li>\n            </ul>\n          </section>\n          <section>\n            <h2>How and why we use your data</h2>\n            <ul>\n              <li><strong>Responding to enquiries and providing proposals</strong> (legitimate interests).</li>\n              <li><strong>Assessing job applications and resourcing specialists</strong> (consent and legitimate interests).</li>\n              <li><strong>Meeting legal or regulatory obligations</strong> (legal obligation).</li>\n              <li><strong>Improving the site</strong> with aggregated analytics when you opt in (consent).</li>\n            </ul>\n          </section>\n          <section>\n            <h2>How long we keep your data</h2>\n            <ul>\n              <li>General enquiries: up to 24 months after our last interaction.</li>\n              <li>CVs: 12 months unless you ask us to remove them sooner.</li>\n              <li>Project files: engagement term plus retention required for insurance or law (normally 7 years).</li>\n              <li>Cookie preferences: 12 months.</li>\n            </ul>\n          </section>\n          <section>\n            <h2>Who we share information with</h2>\n            <ul>\n              <li>Cloudflare Pages Functions and Resend to deliver encrypted form submissions.</li>\n              <li>Google services (Tag Manager, Analytics) when you grant analytics consent.</li>\n              <li>Marketing platforms such as Google Ads or LinkedIn, only if you opt into marketing cookies.</li>\n              <li>Professional advisers, insurers, regulators, or law enforcement where required.</li>\n            </ul>\n          </section>\n          <section>\n            <h2>International transfers</h2>\n            <p>Where our suppliers process data outside the UK or EEA, we rely on safeguards such as the European Commission’s Standard Contractual Clauses, the UK International Data Transfer Addendum, or adequacy decisions.</p>\n          </section>\n          <section>\n            <h2>Security</h2>\n            <p>We use encrypted form submissions, role-based access, security monitoring, and routine reviews of processors to protect personal data.</p>\n          </section>\n          <section>\n            <h2>Your rights</h2>\n            <ul>\n              <li>Access, rectify, or erase your personal data.</li>\n              <li>Restrict or object to processing based on legitimate interests.</li>\n              <li>Withdraw consent where processing relies on it.</li>\n              <li>Lodge a complaint with your supervisory authority.</li>\n            </ul>\n          </section>\n          <section>\n            <h2>Contact</h2>\n            <p>Email <a href=\"mailto:${COMPANY.privacyEmail}\">${COMPANY.privacyEmail}</a> or write to ${COMPANY.address} to exercise your rights.</p>\n          </section>\n        </div>\n      </div>\n    </section>\n  </main>\n</body>\n</html>\n`;
  writeFile(filePath, template);
};

const createCookiesPage = () => {
  const filePath = path.join(ROOT, COOKIES_PATH);
  if (fs.existsSync(filePath)) {
    log('cookies page exists — skip');
    return;
  }
  const template = `<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\"/>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n  <title>Cookies • ${COMPANY.name}</title>\n  <link rel=\"stylesheet\" href=\"/assets/styles.css\"/>\n</head>\n<body>\n  <main>\n    <section class=\"section\">\n      <div class=\"container\">\n        <h1>Cookies &amp; storage</h1>\n        <p class=\"lead\">This page explains the cookies and storage technologies used by ${COMPANY.name}.</p>\n        <div class=\"card\" style=\"padding:24px;display:grid;gap:24px\">\n          <section>\n            <h2>How we use cookies</h2>\n            <p>Essential cookies keep the site secure and operational. Analytics and marketing cookies only load if you opt in.</p>\n            <button type=\"button\" class=\"btn alt\" data-cookie-manage style=\"width:max-content\">Manage cookie preferences</button>\n          </section>\n          <section>\n            <h2>Cookie inventory</h2>\n            <div class=\"table-scroll\">\n              <table class=\"cookie-table\">\n                <thead>\n                  <tr><th>Cookie / storage</th><th>Purpose</th><th>Retention</th><th>Category</th></tr>\n                </thead>\n                <tbody>\n                  <tr><td>cookiePrefs (localStorage)</td><td>Stores your cookie consent choices.</td><td>12 months</td><td>Essential</td></tr>\n                  <tr><td>cf_use_ob, __cf_bm</td><td>Cloudflare protection against bots and traffic spikes.</td><td>24 hours</td><td>Essential</td></tr>\n                  <tr><td>_ga, _gid, _gat_*</td><td>Google Analytics metrics (loaded only with consent).</td><td>14 months / 24 hours / 1 minute</td><td>Analytics</td></tr>\n                  <tr><td>_gcl_au</td><td>Google Ads conversion measurement when marketing cookies are enabled.</td><td>90 days</td><td>Marketing</td></tr>\n                  <tr><td>LinkedIn Insight Tag</td><td>Campaign measurement when marketing cookies are enabled.</td><td>90 days</td><td>Marketing</td></tr>\n                </tbody>\n              </table>\n            </div>\n          </section>\n          <section>\n            <h2>Third-party services</h2>\n            <p>Analytics and marketing cookies are provided by Google (Tag Manager, Analytics, Ads) and LinkedIn. These providers rely on Standard Contractual Clauses or adequacy decisions for international transfers.</p>\n          </section>\n          <section>\n            <h2>Updating your choice</h2>\n            <p>You can revisit your consent at any time via the on-page manage button or the floating “Cookie settings” control shown after you save a preference.</p>\n          </section>\n        </div>\n      </div>\n    </section>\n  </main>\n</body>\n</html>\n`;
  writeFile(filePath, template);
};

const processPage = (pagePath) => {
  const fullPath = path.join(ROOT, pagePath);
  let html = readFile(fullPath);
  if (html === null) {
    log('skip missing page', rel(fullPath));
    return;
  }

  const original = html;
  html = stripGtm(html);
  html = ensureFooterLinks(html);
  if (pagePath === 'contact.html') html = ensureConsentBlock(html, 'contact', 'contactPrivacy');
  if (pagePath === 'careers.html') html = ensureConsentBlock(html, 'careers', 'careersPrivacy');
  if (ENABLE_BANNER) html = ensureBanner(html);
  html = ensureManageButton(html);

  if (html !== original) {
    writeFile(fullPath, html);
  } else {
    log('no changes for', rel(fullPath));
  }
};

const run = () => {
  ensureDir(ROOT);
  ensureScripts();
  if (POLICY_PATH) createPrivacyPage();
  if (COOKIES_PATH) createCookiesPage();
  PAGES.forEach(processPage);
};

run();
