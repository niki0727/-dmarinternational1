(() => {
  'use strict';

  const STORAGE_KEY = 'dmar.cookiePrefs.v1';
  const GTM_ID = 'GTM-M3Z5Z4PQ';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ----------------------------- Topbar dismiss ---------------------------- */
  (() => {
    const closeBtn = $('.topbar .close');
    if (!closeBtn) return;
    closeBtn.addEventListener('click', () => {
      const bar = closeBtn.closest('.topbar');
      if (bar) bar.style.display = 'none';
    });
  })();

  /* ----------------------------- Mobile drawer ---------------------------- */
  (() => {
    const root = document.documentElement;
    const header = $('header, .site-header');
    const nav = $('#mobileNav') || $('.mobile');
    const btn = $('#menuToggle') || $('.btn.burger') || $('[data-menu]');
    let scrim = $('.scrim');

    if (!scrim) {
      scrim = document.createElement('div');
      scrim.className = 'scrim';
      scrim.setAttribute('aria-hidden', 'true');
      document.body.appendChild(scrim);
    }

    const setHeaderOffset = () => {
      const height = header ? Math.round(header.getBoundingClientRect().height) : 64;
      root.style.setProperty('--hdr-h', `${height}px`);
    };

    let trapHandler = null;
    const enableFocusTrap = (panel) => {
      const focusables = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', panel)
        .filter(el => el.offsetParent !== null);
      if (!focusables.length) return;
      const [first] = focusables;
      const last = focusables[focusables.length - 1];
      trapHandler = (event) => {
        if (event.key !== 'Tab') return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', trapHandler);
      first.focus({ preventScroll: true });
    };

    const disableFocusTrap = () => {
      if (trapHandler) document.removeEventListener('keydown', trapHandler);
      trapHandler = null;
    };

    const openNav = () => {
      if (!nav) return;
      nav.classList.add('open');
      scrim.classList.add('open');
      root.classList.add('nav-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      enableFocusTrap(nav);
    };

    const closeNav = () => {
      if (!nav) return;
      nav.classList.remove('open');
      scrim.classList.remove('open');
      root.classList.remove('nav-open');
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.focus({ preventScroll: true });
      }
      disableFocusTrap();
    };

    btn?.addEventListener('click', (event) => {
      event.preventDefault();
      if (nav?.classList.contains('open')) closeNav();
      else openNav();
    });
    scrim?.addEventListener('click', closeNav);
    nav?.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav?.classList.contains('open')) closeNav();
    });

    setHeaderOffset();
    let debounce;
    window.addEventListener('resize', () => {
      clearTimeout(debounce);
      debounce = setTimeout(setHeaderOffset, 100);
    });
    window.addEventListener('orientationchange', setHeaderOffset);
  })();

  /* -------------------------- Cookie consent banner ----------------------- */
  const parseConsent = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const value = JSON.parse(stored);
      if (typeof value !== 'object' || value === null) return null;
      return {
        analytics: Boolean(value.analytics),
        marketing: Boolean(value.marketing),
        updatedAt: value.updatedAt || new Date().toISOString(),
      };
    } catch (err) {
      console.warn('Failed to parse cookie preferences:', err);
      return null;
    }
  };

  const storeConsent = (prefs) => {
    const payload = {
      analytics: Boolean(prefs.analytics),
      marketing: Boolean(prefs.marketing),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    applyConsent(payload);
    return payload;
  };

  let gtmLoaded = false;
  const enableGtm = () => {
    if (gtmLoaded) return;
    gtmLoaded = true;
    (function(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s);
      const dl = l !== 'dataLayer' ? `&l=${l}` : '';
      j.async = true;
      j.src = `https://www.googletagmanager.com/gtm.js?id=${i}${dl}`;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', GTM_ID);

    document.addEventListener('DOMContentLoaded', () => {
      if (document.body.querySelector('noscript[data-gtm]')) return;
      const noscript = document.createElement('noscript');
      noscript.dataset.gtm = 'true';
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.prepend(noscript);
    }, { once: true });
  };

  const enableDeferredScripts = (category) => {
    const scripts = $$(`script[type="text/plain"][data-cookie-category="${category}"]`);
    scripts.forEach((script) => {
      if (script.dataset.loaded === 'true') return;
      const clone = document.createElement('script');
      if (script.dataset.cookieSrc) {
        clone.src = script.dataset.cookieSrc;
        if (script.dataset.async !== 'false') clone.async = true;
      }
      clone.text = script.textContent || '';
      script.parentNode?.insertBefore(clone, script);
      script.dataset.loaded = 'true';
    });
  };

  const applyConsent = (prefs) => {
    const detail = { detail: { ...prefs } };
    document.dispatchEvent(new CustomEvent('cookie-preferences:updated', detail));

    if (prefs.analytics || prefs.marketing) {
      enableGtm();
    }

    if (prefs.analytics) enableDeferredScripts('analytics');
    if (prefs.marketing) enableDeferredScripts('marketing');
    if (!prefs.analytics) {
      document.cookie = '_ga=; Max-Age=0; path=/';
    }
    if (!prefs.marketing) {
      document.cookie = '_gcl_au=; Max-Age=0; path=/';
    }
  };

  const initCookieBanner = () => {
    const banner = $('#cookie-banner');
    const manageButtons = $$('[data-cookie-manage]');
    if (!banner) return;

    const toggles = {
      analytics: $('[data-cookie-toggle="analytics"]', banner),
      marketing: $('[data-cookie-toggle="marketing"]', banner),
    };

    const showBanner = () => {
      banner.hidden = false;
      banner.setAttribute('aria-hidden', 'false');
      banner.focus?.();
      document.body.classList.add('cookie-banner-open');
    };

    const hideBanner = () => {
      banner.hidden = true;
      banner.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cookie-banner-open');
    };

    const current = parseConsent();
    if (current) {
      toggles.analytics && (toggles.analytics.checked = current.analytics);
      toggles.marketing && (toggles.marketing.checked = current.marketing);
      hideBanner();
      applyConsent(current);
      manageButtons.forEach(btn => btn.hidden = false);
    } else {
      showBanner();
    }

    const readPrefsFromBanner = () => ({
      analytics: Boolean(toggles.analytics?.checked),
      marketing: Boolean(toggles.marketing?.checked),
    });

    const handleSave = (prefs) => {
      storeConsent(prefs);
      hideBanner();
      manageButtons.forEach(btn => btn.hidden = false);
    };

    banner.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.cookieAction;
      if (!action) return;

      if (action === 'accept') {
        toggles.analytics && (toggles.analytics.checked = true);
        toggles.marketing && (toggles.marketing.checked = true);
        handleSave({ analytics: true, marketing: true });
      } else if (action === 'reject') {
        toggles.analytics && (toggles.analytics.checked = false);
        toggles.marketing && (toggles.marketing.checked = false);
        handleSave({ analytics: false, marketing: false });
      } else if (action === 'save') {
        handleSave(readPrefsFromBanner());
      }
    });

    manageButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const prefs = parseConsent();
        if (prefs) {
          toggles.analytics && (toggles.analytics.checked = prefs.analytics);
          toggles.marketing && (toggles.marketing.checked = prefs.marketing);
        }
        showBanner();
        btn.blur();
      });
    });
  };

  initCookieBanner();


  /* Prevent iOS double-tap zoom on buttons */
  document.addEventListener('touchstart', () => {}, { passive: true });
})();
