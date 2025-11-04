/* DMAR International — final site script (mobile drawer + forms)
   - Mobile drawer: open/close + scrim + focus lock + ESC
   - Topbar close button
   - Forms: POST FormData to endpoints (supports file for Careers)
*/

/* ---------- CONFIG: endpoints ---------- */
/* If you use Cloudflare Pages Functions, keep as-is:
     /functions/submit-contact.js  =>  POST /submit-contact
     /functions/submit-careers.js  =>  POST /submit-careers
   Or replace with a form provider URL (Formspree/Getform/Basin).
*/
const CONTACT_ENDPOINT = "/submit-contact";
const CAREERS_ENDPOINT = "/submit-careers";

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- topbar ---------- */
(function initTopbar(){
  const closeBtn = $('.topbar .close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const bar = closeBtn.closest('.topbar');
      if (bar) bar.style.display = 'none';
    });
  }
})();

/* ---------- mobile drawer ---------- */
(function initMobileNav(){
  const root = document.documentElement;
  const header = $('header, .site-header');
  let nav = $('#mobileNav') || $('.mobile');
  let btn = $('#menuToggle') || $('.btn.burger') || $('[data-menu]');
  let scrim = $('.scrim');

  // Ensure scrim exists
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.setAttribute('aria-hidden', 'true');
    document.body.appendChild(scrim);
  }

  function setHeaderOffset(){
    const h = header ? Math.round(header.getBoundingClientRect().height) : 64;
    root.style.setProperty('--hdr-h', `${h}px`);
  }

  // Focus trap within the drawer
  let trapHandler = null;
  function enableFocusTrap(panel){
    const focusables = $$(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      panel
    ).filter(el => el.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', trapHandler);
    first.focus({ preventScroll: true });
  }
  function disableFocusTrap(){
    if (trapHandler) document.removeEventListener('keydown', trapHandler);
    trapHandler = null;
  }

  function openNav(){
    if (!nav) return;
    nav.classList.add('open');
    scrim.classList.add('open');
    root.classList.add('nav-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    enableFocusTrap(nav);
  }
  function closeNav(){
    if (!nav) return;
    nav.classList.remove('open');
    scrim.classList.remove('open');
    root.classList.remove('nav-open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.focus({ preventScroll: true });
    }
    disableFocusTrap();
  }

  // Attach events
  if (btn) btn.addEventListener('click', (e) => {
    e.preventDefault();
    nav && nav.classList.contains('open') ? closeNav() : openNav();
  });
  if (scrim) scrim.addEventListener('click', closeNav);
  if (nav) {
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav && nav.classList.contains('open')) closeNav();
  });

  // Keep drawer positioned under header
  setHeaderOffset();
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(setHeaderOffset, 100);
  });
  window.addEventListener('orientationchange', setHeaderOffset);
})();

/* ---------- optional niceties ---------- */
// prevent iOS double-tap zoom on buttons (by ensuring active state)
document.addEventListener('touchstart', () => {}, { passive: true });

/* ---------- cookie consent ---------- */
(function initCookieConsent(){
  const STORAGE_KEY = 'cookieConsent';
  const defaultPrefs = { essential: true, analytics: false, marketing: false };
  const root = document.documentElement;

  const safeJSON = {
    parse(input){
      try {
        return JSON.parse(input);
      } catch (err) {
        console.warn('Could not parse stored cookie preferences', err);
        return null;
      }
    },
    stringify(value){
      try {
        return JSON.stringify(value);
      } catch (err) {
        console.warn('Could not serialise cookie preferences', err);
        return null;
      }
    }
  };

  const storedRaw = (() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Local storage unavailable, cookie banner will still show', err);
      return null;
    }
  })();

  let prefs = { ...defaultPrefs };
  const storedPrefs = storedRaw ? safeJSON.parse(storedRaw) : null;
  if (storedPrefs && typeof storedPrefs === 'object') {
    prefs.analytics = !!storedPrefs.analytics;
    prefs.marketing = !!storedPrefs.marketing;
  }

  function setDataset(){
    root.dataset.analyticsConsent = prefs.analytics ? 'allowed' : 'denied';
    root.dataset.marketingConsent = prefs.marketing ? 'allowed' : 'denied';
  }

  function activateScripts(category){
    $$(`script[type="text/plain"][data-cookie-category="${category}"]`).forEach((tpl) => {
      if (tpl.dataset.cookieLoaded === 'true') return;
      const script = document.createElement('script');
      const src = tpl.getAttribute('data-cookie-src');
      const type = tpl.getAttribute('data-cookie-type') || 'text/javascript';
      script.type = type;
      if (src) {
        script.src = src;
        script.async = true;
      } else {
        script.textContent = tpl.textContent || '';
      }
      document.head.appendChild(script);
      tpl.dataset.cookieLoaded = 'true';
    });
  }

  function applyConsent(){
    setDataset();
    ['analytics', 'marketing'].forEach((category) => {
      if (prefs[category]) activateScripts(category);
    });
  }

  function persist(){
    const payload = { analytics: !!prefs.analytics, marketing: !!prefs.marketing };
    const json = safeJSON.stringify(payload);
    if (!json) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
    } catch (err) {
      console.warn('Unable to persist cookie preferences', err);
    }
  }

  let banner = null;
  let analyticsToggle = null;
  let marketingToggle = null;

  function syncToggles(){
    if (analyticsToggle) analyticsToggle.checked = !!prefs.analytics;
    if (marketingToggle) marketingToggle.checked = !!prefs.marketing;
  }

  function hideBanner(){
    if (!banner) return;
    banner.classList.remove('open');
    banner.setAttribute('aria-hidden', 'true');
  }

  function saveAndClose(){
    persist();
    applyConsent();
    hideBanner();
  }

  function handleAcceptAll(){
    prefs.analytics = true;
    prefs.marketing = true;
    saveAndClose();
  }

  function handleSaveSelection(){
    prefs.analytics = analyticsToggle ? !!analyticsToggle.checked : false;
    prefs.marketing = marketingToggle ? !!marketingToggle.checked : false;
    saveAndClose();
  }

  function handleEssentialOnly(){
    prefs.analytics = false;
    prefs.marketing = false;
    saveAndClose();
  }

  function ensureBanner(){
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = `
      <h3>Manage cookie preferences</h3>
      <p>We use essential cookies to run the site. Choose whether we can also use analytics and marketing cookies.</p>
      <div class="cookie-options">
        <label class="cookie-toggle">
          <div><strong>Essential</strong><span>Always active</span></div>
          <input type="checkbox" checked disabled />
        </label>
        <label class="cookie-toggle">
          <div><strong>Analytics</strong><span>Helps us measure site usage.</span></div>
          <input type="checkbox" data-category="analytics" />
        </label>
        <label class="cookie-toggle">
          <div><strong>Marketing</strong><span>Enables remarketing tags.</span></div>
          <input type="checkbox" data-category="marketing" />
        </label>
      </div>
      <div class="actions">
        <button type="button" class="btn" data-action="accept-all">Accept all</button>
        <button type="button" class="btn alt" data-action="save">Save selection</button>
        <button type="button" class="link-button" data-action="essential">Essential only</button>
      </div>
      <p class="small" style="margin-top:12px">Review our <a href="/cookies.html">cookies policy</a> for details.</p>
    `;
    document.body.appendChild(banner);
    analyticsToggle = banner.querySelector('input[data-category="analytics"]');
    marketingToggle = banner.querySelector('input[data-category="marketing"]');
    syncToggles();
    banner.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute('data-action');
      if (!action) return;
      if (action === 'accept-all') handleAcceptAll();
      else if (action === 'save') handleSaveSelection();
      else if (action === 'essential') handleEssentialOnly();
    });
  }

  function showBanner(){
    ensureBanner();
    syncToggles();
    banner.classList.add('open');
    banner.removeAttribute('aria-hidden');
  }

  function bindSettingsButtons(){
    $$('[data-cookie-settings]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        showBanner();
      });
    });
  }

  applyConsent();
  bindSettingsButtons();
  ensureBanner();

  if (!storedPrefs) {
    showBanner();
  }

  window.DMAR_CONSENT = window.DMAR_CONSENT || {};
  window.DMAR_CONSENT.showPreferences = showBanner;
})();

