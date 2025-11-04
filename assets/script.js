'use strict';

/* ---------- helpers ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/* ---------- topbar ---------- */
(function initTopbar(){
  const closeBtn = $('.topbar .close');
  if (!closeBtn) return;
  closeBtn.addEventListener('click', () => {
    const bar = closeBtn.closest('.topbar');
    if (!bar) return;
    bar.style.display = 'none';
  });
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
  const nav = $('#mobileNav') || $('.mobile');
  const btn = $('#menuToggle') || $('.btn.burger') || $('[data-menu]');
  let scrim = $('.scrim');

  if (!nav || !btn) return;

  // Ensure scrim exists and is appended to the document
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
    document.body.appendChild(scrim);
  }

  function setHeaderOffset(){
    const h = header ? Math.round(header.getBoundingClientRect().height) : 64;
    root.style.setProperty('--hdr-h', `${h}px`);
  }

  function getFocusableElements(container){
    return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
      .filter(el => !el.hasAttribute('aria-hidden') && el.getAttribute('tabindex') !== '-1' && (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement));
  }

  let trapHandler = null;
  function disableFocusTrap(){
    if (trapHandler && nav) {
      nav.removeEventListener('keydown', trapHandler);
      trapHandler = null;
    }
  }

  function enableFocusTrap(panel){
    disableFocusTrap();
    const focusables = getFocusableElements(panel);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    trapHandler = (event) => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    nav.addEventListener('keydown', trapHandler);
  }

  function openNav(){
    if (nav.classList.contains('open')) return;
    nav.classList.add('open');
    nav.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-mobile-nav');
    btn.setAttribute('aria-expanded', 'true');

    const focusables = getFocusableElements(nav);
    if (focusables.length) {
      focusables[0].focus({ preventScroll: true });
    }

    enableFocusTrap(nav);

    if (scrim) {
      scrim.hidden = false;
      scrim.classList.add('open');
    }
  }

  function closeNav(){
    if (!nav.classList.contains('open')) return;
    nav.classList.remove('open');
    nav.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-mobile-nav');
    btn.setAttribute('aria-expanded', 'false');
    disableFocusTrap();

    if (scrim) {
      scrim.classList.remove('open');
      scrim.hidden = true;
    }

    btn.focus({ preventScroll: true });
  }

  function toggleNav(){
    if (nav.classList.contains('open')) closeNav();
    else openNav();
  }

  btn.addEventListener('click', toggleNav);
  btn.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleNav();
    }
  });

  if (scrim) {
    scrim.addEventListener('click', closeNav);
  }

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeNav();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNav();
    }
  });

  function handleResize(){
    setHeaderOffset();
    if (window.innerWidth >= 1024) {
      closeNav();
    }
  }

  setHeaderOffset();
  window.addEventListener('resize', () => {
    window.requestAnimationFrame(handleResize);
  });
  window.addEventListener('orientationchange', handleResize);
})();

/* ---------- optional niceties ---------- */
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
      .split(/[\s,]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }

  function categoriesAllowed(state, categories){
    if (!categories.length) return true;
    return categories.every(cat => (cat === 'essential' ? true : !!state[cat]));
  }

  function activateScripts(state){
    const placeholders = $$('script[type="text/plain"][data-cookie-category]:not([data-cookie-loaded])');
    placeholders.forEach((placeholder) => {
      const required = splitCategories(placeholder.dataset.cookieCategory);
      if (!categoriesAllowed(state, required)) return;

      const target = placeholder.dataset.cookieTarget === 'body' ? document.body : (document.head || document.documentElement);
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
    let banner = document.getElementById('cookie-banner');
    if (banner) return banner;

    banner = document.createElement('div');
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
    const defaultBtn = banner.querySelector('[data-action="save"]');
    if (defaultBtn instanceof HTMLElement) {
      defaultBtn.focus({ preventScroll: true });
    }
  }

  function closeBanner(){
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.classList.remove('open');
    document.body.classList.remove('cookie-banner-open');
  }

  function applyAndMaybeReload(previous, next){
    activateScripts(next);
    const removedAnalytics = previous.analytics && !next.analytics;
    const removedMarketing = previous.marketing && !next.marketing;
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
    attachEvents();
    openBanner();
  } else {
    attachEvents();
  }
})();
