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
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/* ---------- topbar ---------- */
(function initTopbar(){
  const STORAGE_KEY = 'dmar.topbar.dismissed.v1';
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === '1';
  } catch (err) {
    dismissed = false;
  }

  const bar = $('.topbar');
  if (!bar) return;
  if (dismissed) {
    bar.style.display = 'none';
    return;
  }

  const closeBtn = $('.topbar .close');
  if (!closeBtn) return;
  closeBtn.addEventListener('click', () => {
    const parentBar = closeBtn.closest('.topbar');
    if (!parentBar) return;
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (err) {
      // no-op
    }
    parentBar.style.display = 'none';
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

/* ---------- sector theme switcher ---------- */
(function initSectorTheme(){
  const body = document.body;
  if (!body || body.dataset.sectorPage !== 'true') return;

  const STORAGE_KEY = 'dmar.sectorTheme.v1';
  const VOTE_STORAGE_KEY = 'dmar.sectorVotes.v1';
  const VOTE_QUEUE_KEY = 'dmar.sectorVotes.queue.v1';
  const voteEndpoint = body.dataset.voteEndpoint || window.DMAR_SECTOR_VOTE_ENDPOINT || '/submit-sector-vote';
  const defaultTheme = body.dataset.sectorDefaultTheme === 'oil' ? 'oil' : 'wind';
  const persistThemeAcrossPages = body.classList.contains('sectors-page');
  const buttons = $$('[data-sector-theme-btn]');
  const switcher = $('[data-sector-theme]');
  if (!buttons.length) return;
  let statusEl = null;
  let vizEl = null;

  function readStoredTheme(){
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function saveTheme(theme){
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // no-op
    }
  }

  function readVoteState(){
    try {
      const raw = localStorage.getItem(VOTE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        wind: Number(parsed.wind) || 0,
        oil: Number(parsed.oil) || 0
      };
    } catch (err) {
      return { wind: 0, oil: 0 };
    }
  }

  function saveVoteState(state){
    try {
      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // no-op
    }
  }

  function readVoteQueue(){
    try {
      const raw = localStorage.getItem(VOTE_QUEUE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveVoteQueue(queue){
    try {
      localStorage.setItem(VOTE_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
    } catch (err) {
      // no-op
    }
  }

  function showVoteStatus(message, type = 'info'){
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = type;
  }

  function renderVoteViz(){
    const voteState = readVoteState();
    if (!vizEl) return;

    const wind = voteState.wind || 0;
    const oil = voteState.oil || 0;
    const total = wind + oil;
    const windPct = total ? (wind / total) * 100 : 50;
    const oilPct = total ? (oil / total) * 100 : 50;

    const fill = $('[data-vote-fill]', vizEl);
    const pointer = $('[data-vote-pointer]', vizEl);
    const lead = $('[data-vote-lead]', vizEl);

    if (fill) {
      fill.style.width = '100%';
      if (!total) {
        fill.style.background = '#d7e1ec';
      } else {
        fill.style.background = `linear-gradient(90deg, #1f9e63 0%, #1f9e63 ${windPct}%, #c07a3a ${windPct}%, #c07a3a 100%)`;
      }
    }
    if (pointer) pointer.style.left = `${windPct}%`;

    if (lead) {
      if (!total) lead.textContent = 'No votes yet. Pick your sector focus.';
      else if (wind === oil) lead.textContent = 'Current result: balanced';
      else lead.textContent = wind > oil ? 'Current result: Wind / Electric leads' : 'Current result: Oil & Gas leads';
    }
  }

  function upsertVoteUi(){
    if (!switcher) return;
    switcher.classList.add('theme-vote');
    if (!statusEl) {
      statusEl = document.createElement('p');
      statusEl.className = 'theme-vote-status';
      statusEl.textContent = 'Vote by selecting the sector focus for your next campaign.';
      switcher.insertAdjacentElement('afterend', statusEl);
    }
    if (!vizEl) {
      vizEl = document.createElement('div');
      vizEl.className = 'theme-vote-viz';
      vizEl.innerHTML = `
        <div class="theme-vote-track" aria-hidden="true">
          <span class="theme-vote-fill" data-vote-fill></span>
          <span class="theme-vote-pointer" data-vote-pointer></span>
        </div>
        <div class="theme-vote-meta">
          <span>Wind / Electric</span>
          <span data-vote-lead>Current result: balanced</span>
          <span>Oil & Gas</span>
        </div>
      `;
      statusEl.insertAdjacentElement('afterend', vizEl);
    }
    buttons.forEach((btn) => {
      const key = btn.dataset.sectorThemeBtn === 'oil' ? 'oil' : 'wind';
      btn.classList.add('theme-vote-btn');
      btn.dataset.voteLabel = key === 'oil' ? 'Vote Oil & Gas' : 'Vote Wind / Electric';
      btn.textContent = btn.dataset.voteLabel;
    });
    renderVoteViz();
  }

  async function sendVote(payload){
    const res = await fetch(voteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
    if (!res.ok) throw new Error(`Vote endpoint error: ${res.status}`);
  }

  async function flushVoteQueue(){
    const queue = readVoteQueue();
    if (!queue.length) return;

    const remaining = [];
    for (const item of queue) {
      try {
        await sendVote(item);
      } catch (err) {
        remaining.push(item);
      }
    }
    saveVoteQueue(remaining);
  }

  async function recordVote(theme){
    const payload = {
      vote: theme,
      page: window.location.pathname,
      title: document.title,
      votedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || ''
    };

    const voteState = readVoteState();
    voteState[theme] = (voteState[theme] || 0) + 1;
    saveVoteState(voteState);
    renderVoteViz();
    showVoteStatus('Saving your vote…', 'pending');

    try {
      await sendVote(payload);
      showVoteStatus('Thanks. Vote saved.', 'ok');
      flushVoteQueue();
    } catch (err) {
      const queue = readVoteQueue();
      queue.push(payload);
      saveVoteQueue(queue);
      showVoteStatus('Thanks. Vote captured.', 'ok');
    }
  }

  function applyTheme(theme){
    const next = (theme === 'oil' || theme === 'wind') ? theme : defaultTheme;
    body.classList.remove('theme-wind', 'theme-oil');
    body.classList.add(`theme-${next}`);

    buttons.forEach((btn) => {
      const active = btn.dataset.sectorThemeBtn === next;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    refreshThemeCardHighlights(next);
  }

  function inferCardTheme(card){
    const explicit = (card.dataset.themeCategory || '').trim().toLowerCase();
    if (explicit === 'wind' || explicit === 'oil') return explicit;

    const text = (card.textContent || '').toLowerCase();
    const href = (card.getAttribute('href') || '').toLowerCase();
    const haystack = `${text} ${href}`;

    const windSignals = [
      'wind', 'renewable', 'electric', 'turbine', 'subsea cable', 'cable', 'offshore-wind'
    ];
    const oilSignals = [
      'oil', 'gas', 'decommission', 'brownfield', 'hydrocarbon'
    ];

    if (windSignals.some(token => haystack.includes(token))) return 'wind';
    if (oilSignals.some(token => haystack.includes(token))) return 'oil';
    return 'neutral';
  }

  function refreshThemeCardHighlights(theme){
    const cards = $$('main .card');
    if (!cards.length) return;

    cards.forEach((card, index) => {
      const category = inferCardTheme(card);
      card.classList.remove('sector-theme-card', 'is-theme-match', 'is-theme-dim', 'theme-flash');
      card.classList.add('sector-theme-card');
      card.style.removeProperty('--theme-delay');

      if (category === 'neutral') return;
      if (category === theme) {
        card.classList.add('is-theme-match');
        card.classList.add('theme-flash');
        card.style.setProperty('--theme-delay', `${Math.min(index * 35, 280)}ms`);
        window.setTimeout(() => {
          card.classList.remove('theme-flash');
        }, 560 + Math.min(index * 35, 280));
      } else {
        card.classList.add('is-theme-dim');
      }
    });
  }

  upsertVoteUi();
  const initialTheme = persistThemeAcrossPages ? (readStoredTheme() || defaultTheme) : defaultTheme;
  applyTheme(initialTheme);
  flushVoteQueue();

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.sectorThemeBtn;
      applyTheme(theme);
      if (persistThemeAcrossPages) saveTheme(theme);
      recordVote(theme);
    });
  });
})();
