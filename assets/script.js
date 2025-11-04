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

/* ---------- cookie consent banner ---------- */
(function initCookieConsent(){
  const STORAGE_KEY = 'dmar.cookieConsent.v1';
  const DEFAULT_STATE = { essential: true, analytics: false, marketing: false, acknowledged: false };

  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch (err) {
      console.warn('[cookie-consent] Failed to parse stored consent', err);
      return { ...DEFAULT_STATE };
    }
  }

  function persistState(state){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        essential: true,
        acknowledged: true,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.warn('[cookie-consent] Failed to persist consent', err);
    }
  }

  function splitCategories(str){
    return (str || '')
      .split(/[,\s]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }

  function categoriesAllowed(state, categories){
    if (!categories.length) return true;
    return categories.every(cat => cat === 'essential' ? true : !!state[cat]);
  }

  function activateScripts(state){
    const placeholders = $$('script[type="text/plain"][data-cookie-category]:not([data-cookie-loaded])');
    placeholders.forEach((placeholder) => {
      const required = splitCategories(placeholder.dataset.cookieCategory);
      if (!categoriesAllowed(state, required)) return;

      const target = placeholder.dataset.cookieTarget === 'body' ? document.body : document.head || document.documentElement;
      const newScript = document.createElement('script');

      if (placeholder.dataset.cookieSrc) {
        newScript.src = placeholder.dataset.cookieSrc;
        if (placeholder.dataset.cookieAsync === 'true') newScript.async = true;
        if (placeholder.dataset.cookieDefer === 'true') newScript.defer = true;
      } else {
        newScript.textContent = placeholder.textContent;
      }

      placeholder.dataset.cookieLoaded = 'true';
      target.appendChild(newScript);
    });
  }

  function ensureBanner(){
    if (document.getElementById('cookie-banner')) return document.getElementById('cookie-banner');

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner__inner" role="dialog" aria-modal="true" aria-labelledby="cookie-banner-title">
        <div class="cookie-banner__content">
          <h2 id="cookie-banner-title">Manage cookie preferences</h2>
          <p>We use cookies to operate our site (essential) and to measure performance or deliver marketing once you permit us. You can update your preferences at any time.</p>
          <ul class="cookie-banner__list">
            <li>
              <div>
                <strong>Essential cookies</strong>
                <p>Required for security and basic functionality. Always active.</p>
              </div>
            </li>
            <li>
              <label>
                <div>
                  <strong>Analytics cookies</strong>
                  <p>Help us understand visits and improve the website via Google Analytics (through Google Tag Manager).</p>
                </div>
                <div class="toggle">
                  <input type="checkbox" name="analytics" />
                  <span class="slider" aria-hidden="true"></span>
                </div>
              </label>
            </li>
            <li>
              <label>
                <div>
                  <strong>Marketing cookies</strong>
                  <p>Enable remarketing and advertising pixels delivered via Google Tag Manager.</p>
                </div>
                <div class="toggle">
                  <input type="checkbox" name="marketing" />
                  <span class="slider" aria-hidden="true"></span>
                </div>
              </label>
            </li>
          </ul>
        </div>
        <div class="cookie-banner__actions">
          <a class="btn ghost" href="/cookies.html">View cookies</a>
          <button type="button" class="btn alt" data-action="reject">Essential only</button>
          <button type="button" class="btn" data-action="save">Save preferences</button>
          <button type="button" class="btn" data-action="accept">Accept all</button>
        </div>
      </div>`;

    document.body.appendChild(banner);
    return banner;
  }

  const state = loadState();
  activateScripts(state);

  function openBanner(){
    const banner = ensureBanner();
    const analyticsToggle = banner.querySelector('input[name="analytics"]');
    const marketingToggle = banner.querySelector('input[name="marketing"]');
    if (analyticsToggle) analyticsToggle.checked = !!state.analytics;
    if (marketingToggle) marketingToggle.checked = !!state.marketing;

    banner.classList.add('open');
    document.body.classList.add('cookie-banner-open');
    banner.querySelector('[data-action="save"]').focus({ preventScroll: true });
  }

  function closeBanner(){
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.classList.remove('open');
    document.body.classList.remove('cookie-banner-open');
  }

  function applyAndMaybeReload(prev, next){
    activateScripts(next);
    const removedAnalytics = prev.analytics && !next.analytics;
    const removedMarketing = prev.marketing && !next.marketing;
    if (removedAnalytics || removedMarketing) {
      window.setTimeout(() => window.location.reload(), 150);
    }
  }

  function attachEvents(){
    const banner = ensureBanner();
    const analyticsToggle = banner.querySelector('input[name="analytics"]');
    const marketingToggle = banner.querySelector('input[name="marketing"]');

    banner.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const previous = { ...state };
      if (action === 'accept') {
        state.analytics = true;
        state.marketing = true;
      } else if (action === 'reject') {
        state.analytics = false;
        state.marketing = false;
      } else if (action === 'save') {
        state.analytics = analyticsToggle ? analyticsToggle.checked : false;
        state.marketing = marketingToggle ? marketingToggle.checked : false;
      }

      state.acknowledged = true;

      persistState(state);
      closeBanner();
      applyAndMaybeReload(previous, state);
    });

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-cookie-open]');
      if (!trigger) return;
      event.preventDefault();
      openBanner();
    });

    window.cookieConsent = {
      open: openBanner,
      state: () => ({ ...state })
    };
  }

  if (!state.acknowledged) {
    // No consent stored or only essential: show banner
    attachEvents();
    openBanner();
  } else {
    // Consent already granted for at least one optional category
    attachEvents();
  }
})();

