@@ -6,50 +6,116 @@

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

/* ---------- project gallery cards ---------- */
(function initProjectGalleries(){
  const galleries = $$('[data-project-gallery]');
  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    const mainImage = $('.project-gallery__image', gallery);
    const dots = $$('.project-gallery__dot', gallery);
    if (!mainImage || !dots.length) return;

    let current = dots.findIndex(dot => dot.classList.contains('is-active'));
    if (current < 0) current = 0;
    let loadToken = 0;
    const fallbackAlt = mainImage.alt;

    const initialDot = dots[current];
    if (initialDot) {
      const initialAlt = initialDot.dataset.alt;
      if (initialAlt) mainImage.alt = initialAlt;
      initialDot.classList.add('is-active');
    }

    function updateTo(index){
      if (index === current) return;
      const targetDot = dots[index];
      if (!targetDot) return;
      const nextSrc = targetDot.dataset.image;
      if (!nextSrc) return;

      gallery.classList.add('is-loading');
      const token = ++loadToken;
      const loader = new Image();
      loader.onload = () => {
        if (token !== loadToken) return;
        mainImage.src = nextSrc;
        mainImage.alt = targetDot.dataset.alt || fallbackAlt;
        gallery.classList.remove('is-loading');
      };
      loader.onerror = () => {
        if (token !== loadToken) return;
        gallery.classList.remove('is-loading');
      };
      loader.src = nextSrc;

      dots.forEach(dot => dot.classList.remove('is-active'));
      targetDot.classList.add('is-active');
      current = index;
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => updateTo(idx));
      dot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          updateTo(idx);
        }
      });
    });

    mainImage.addEventListener('click', () => {
      const nextIndex = (current + 1) % dots.length;
      updateTo(nextIndex);
    });
  });
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
@@ -104,25 +170,228 @@ const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
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
  const STORAGE_KEY = 'cookieConsent.v1';
  const DEFAULT_STATE = {
    essential: true,
    analytics: false,
    marketing: false,
    acknowledged: false
  };

  const state = loadState();

  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch (err) {
      console.warn('[cookie-consent] invalid stored value', err);
      return { ...DEFAULT_STATE };
    }
  }

  function persist(){
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...state,
          essential: true,
          acknowledged: true,
          updatedAt: new Date().toISOString()
        })
      );
    } catch (err) {
      console.warn('[cookie-consent] unable to persist', err);
    }
  }

  function loadGTM(){
    if (window.__gtmLoaded || (!state.analytics && !state.marketing)) return;
    window.__gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cookieConsent.update',
      analytics: !!state.analytics,
      marketing: !!state.marketing
    });
    (function(w,d,s,l,i){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-M3Z5Z4PQ');
  }

  function removeOptionalCookies(){
    ['_ga', '_ga_GTM-M3Z5Z4PQ', '_gid', '_gcl_au', '_fbp'].forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
  }

  function applyPreferences(previous){
    if (state.analytics || state.marketing) {
      loadGTM();
    } else if (previous && (previous.analytics || previous.marketing)) {
      removeOptionalCookies();
      window.setTimeout(() => window.location.reload(), 150);
    }
  }

  function ensureStyles(){
    if (document.getElementById('cookie-banner-styles')) return;
    const style = document.createElement('style');
    style.id = 'cookie-banner-styles';
    style.textContent = `
      .cookie-banner{position:fixed;inset:auto 0 0 0;background:#111;color:#fff;padding:16px 12px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;z-index:9999;box-shadow:0 -2px 12px rgba(0,0,0,.25);}
      .cookie-banner p{margin:0;max-width:60ch;}
      .cookie-banner a{color:#9cf;text-decoration:underline;}
      .cookie-banner__actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;}
      .cookie-banner button{background:#0A5694;color:#fff;border:0;border-radius:4px;padding:8px 14px;font:inherit;cursor:pointer;}
      .cookie-banner button.secondary{background:#333;}
      .cookie-banner__toggles{display:flex;gap:12px;flex-wrap:wrap;font-size:0.9em;}
      .cookie-banner__toggles label{display:flex;align-items:center;gap:6px;}
      @media (max-width:600px){.cookie-banner{flex-direction:column;align-items:flex-start;}.cookie-banner__actions{margin-left:0;width:100%;justify:flex-start;}}
    `;
    document.head.appendChild(style);
  }

  function ensureBanner(){
    let banner = document.getElementById('cookie-banner');
    if (banner) return banner;

    ensureStyles();
    banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <p>This site uses cookies. <a href="/cookies.html">Learn more</a></p>
      <div class="cookie-banner__toggles" role="group" aria-label="Optional cookies">
        <label><input type="checkbox" name="analytics"> Analytics</label>
        <label><input type="checkbox" name="marketing"> Marketing</label>
      </div>
      <div class="cookie-banner__actions">
        <button type="button" class="secondary" data-action="reject">Essential only</button>
        <button type="button" data-action="save">Save preferences</button>
        <button type="button" data-action="accept">Accept all</button>
      </div>
    `;
    document.body.appendChild(banner);
    banner.hidden = true;
    return banner;
  }

  function openBanner(){
    const banner = ensureBanner();
    const analyticsToggle = banner.querySelector('input[name="analytics"]');
    const marketingToggle = banner.querySelector('input[name="marketing"]');
    if (analyticsToggle) analyticsToggle.checked = !!state.analytics;
    if (marketingToggle) marketingToggle.checked = !!state.marketing;
    banner.hidden = false;
    banner.setAttribute('aria-live', 'polite');
  }

  function hideBanner(){
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.hidden = true;
  }

  function handleAction(action){
    const previous = { ...state };
    if (action === 'accept') {
      state.analytics = true;
      state.marketing = true;
    } else if (action === 'reject') {
      state.analytics = false;
      state.marketing = false;
    } else if (action === 'save') {
      const banner = document.getElementById('cookie-banner');
      if (banner) {
        const analyticsToggle = banner.querySelector('input[name="analytics"]');
        const marketingToggle = banner.querySelector('input[name="marketing"]');
        state.analytics = analyticsToggle ? analyticsToggle.checked : false;
        state.marketing = marketingToggle ? marketingToggle.checked : false;
      }
    }

    state.acknowledged = true;
    persist();
    hideBanner();
    applyPreferences(previous);
  }

  function bindEvents(){
    const banner = ensureBanner();
    banner.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      handleAction(btn.dataset.action);
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

  bindEvents();
  applyPreferences();

  if (!state.acknowledged) {
    openBanner();
  }
})();
