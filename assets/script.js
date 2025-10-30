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

/* ---------- forms (Contact + Careers) ---------- */
(function initForms(){
  // CONTACT
  const contactForm = $('form[data-contact]');
  if (contactForm) {
    const msg = $('#form-msg');
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (msg) msg.textContent = 'Sending…';

      try {
        const res = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          body: new FormData(contactForm)
        });
        if (res.ok) {
          if (msg) msg.textContent = 'Thanks — we’ll reply shortly.';
          contactForm.reset();
        } else {
          if (msg) msg.textContent = 'Sorry — could not send. Please email info@dmarinternational.com';
        }
      } catch {
        if (msg) msg.textContent = 'Network error — email info@dmarinternational.com';
      }
    });
  }

  // CAREERS (supports file upload)
  const careersForm = $('form[data-careers]');
  if (careersForm) {
    const msg = $('#careers-msg');
    careersForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (msg) msg.textContent = 'Uploading…';

      try {
        const res = await fetch(CAREERS_ENDPOINT, {
          method: 'POST',
          body: new FormData(careersForm)
        });
        if (res.ok) {
          if (msg) msg.textContent = 'Thanks — received. We’ll review your CV.';
          careersForm.reset();
        } else {
          if (msg) msg.textContent = 'Upload failed — email careers@dmarinternational.com';
        }
      } catch {
        if (msg) msg.textContent = 'Network error — email careers@dmarinternational.com';
      }
    });
  }
})();

/* ---------- optional niceties ---------- */
// prevent iOS double-tap zoom on buttons (by ensuring active state)
document.addEventListener('touchstart', () => {}, { passive: true });

