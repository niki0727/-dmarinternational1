
const FORM_ENDPOINT = ""; // add your Formspree/Make endpoint when ready

// Announcement bar dismiss
(function(){
  const bar = document.querySelector('.topbar');
  if(!bar) return;
  const k = 'dmar_topbar_dismissed_until';
  const until = localStorage.getItem(k);
  const now = Date.now();
  if(until && Number(until) > now){ bar.style.display='none'; return; }
  const btn = bar.querySelector('.close');
  btn && btn.addEventListener('click', ()=>{
    localStorage.setItem(k, String(now + 7*24*60*60*1000));
    bar.style.display='none';
  });
})();

// Mobile menu
const menuBtn = document.querySelector('.burger');
// prefer #mobileNav (id) then  (class)
let mobile = document.getElementById('mobileNa.mobilev') || document.querySelector('.mobile');

// Create scrim overlay for mobile nav
let scrim = document.querySelector('.scrim');
if(!scrim){
  scrim = document.createElement('div');
  scrim.className = 'scrim';
  document.body.appendChild(scrim);
}

function positionMobile(){
  // safely find nav element each time (handles markup differences)
  const navEl = mobile || document.getElementById('mobileNav') || document.querySelector('.mobile');
  if(!navEl) return;
  const hdr = document.querySelector('header');
  const top = (hdr ? hdr.offsetHeight : 110);
  navEl.style.top = top + 'px';
  navEl.style.maxHeight = `calc(100dvh - ${top}px)`;
}

function setNav(open){
  // safely find nav element each time
  const navEl = mobile || document.getElementById('mobileNav') || document.querySelector('.mobile');
  if(navEl) navEl.classList.toggle('open', open);
  if(scrim) scrim.classList.toggle('open', open);
  document.documentElement.classList.toggle('nav-open', open);
  document.body.classList.toggle('nav-open', open);
  positionMobile();

  // apply compact scaling for contact/careers pages on small screens
  // applyCompactScale may be defined later; it will be exposed to window by the helper IIFE below
  try { (window.applyCompactScale || function(){})(open); } catch(e){}
}

// Always wire burger toggle (don't require mobile variable to be present at bind)
if(menuBtn){
  menuBtn.addEventListener('click', function(e){
    e && e.preventDefault();
    const navEl = mobile || document.getElementById('mobileNav') || document.querySelector('.mobile');
    const isOpen = !!(navEl && navEl.classList.contains('open'));
    setNav(!isOpen);
  });
}

// Wire scrim close globally
if(scrim){
  scrim.addEventListener('click', ()=> setNav(false));
}

// keep responsive position wiring
window.addEventListener('resize', positionMobile);
window.addEventListener('load', positionMobile);
document.addEventListener('visibilitychange', positionMobile);

// Simple form wiring
function wireSimpleForm(form, msgSel){
  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const out = form.querySelector(msgSel);
    const data = new FormData(form);
    const name = data.get('name'), email = data.get('email');
    const errs = [];
    if(!name || String(name).trim().length < 2) errs.push('name');
    if(!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(email||'')) errs.push('email');
    if(errs.length){ out.textContent = 'Please check: '+errs.join(', '); out.style.color='#b42318'; return; }
    if(!FORM_ENDPOINT){
      out.textContent = 'Thanks — submitted locally (add FORM_ENDPOINT in /assets/script.js to deliver real emails).';
      out.style.color = '#067647'; form.reset(); return;
    }
    try{
      const resp = await fetch(FORM_ENDPOINT, { method:'POST', body:data });
      if(resp.ok){ out.textContent = 'Thanks — submitted.'; out.style.color = '#067647'; form.reset(); }
      else{ out.textContent = 'Submit failed. Please email info@dmarinternational.com'; out.style.color='#b42318'; }
    }catch(err){
      out.textContent = 'Network error. Please email info@dmarinternational.com'; out.style.color = '#b42318';
    }
  });
}
wireSimpleForm(document.querySelector('form[data-contact]'), '#form-msg');
wireSimpleForm(document.querySelector('form[data-quote]'), '#quote-msg');

const careers = document.querySelector('form[data-careers]');
if(careers){
  careers.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const out = careers.querySelector('#careers-msg');
    const data = new FormData(careers);
    const file = data.get('cv');
    if(!data.get('name') || !data.get('email') || !file || !file.name){
      out.textContent = 'Please add your name, email and CV.'; out.style.color = '#b42318'; return;
    }
    if(!FORM_ENDPOINT){
      out.textContent = 'Ready to send. Set FORM_ENDPOINT in /assets/script.js to enable real upload.'; out.style.color = '#067647'; careers.reset(); return;
    }
    try{
      const resp = await fetch(FORM_ENDPOINT, { method:'POST', body:data });
      if(resp.ok){ out.textContent = 'Thanks — CV submitted.'; out.style.color = '#067647'; careers.reset(); }
      else{ out.textContent = 'Upload failed. Please email careers@dmarinternational.com'; out.style.color='#b42318'; }
    }catch(err){
      out.textContent = 'Network error. Please email careers@dmarinternational.com'; out.style.color = '#b42318';
    }
  });
}


// ===== Unified Mobile Drawer Logic =====
(function(){
  function setHdr(){ 
    var h = document.querySelector('header'); 
    if(h){ document.documentElement.style.setProperty('--hdr-h', h.getBoundingClientRect().height + 'px'); }
  }
  setHdr(); window.addEventListener('resize', setHdr); window.addEventListener('orientationchange', setHdr);

  // Stagger menu links
  var nav = document.getElementById('mobileNav') || document.querySelector('.mobile');
  function setStagger(){
    if(!nav) return;
    var links = nav.querySelectorAll('a');
    links.forEach(function(a,i){ a.style.setProperty('--delay', (0.03 * i)+'s'); });
  }
  setStagger();

  // If you use a toggle button with id="menuToggle" and scrim with id="scrim"
  var toggle = document.getElementById('menuToggle');
  var scrim  = document.getElementById('scrim') || document.querySelector('.scrim');

  function openNav(){
    if(!nav) return;
    nav.classList.add('open'); if(scrim) scrim.classList.add('open');
    document.documentElement.classList.add('nav-open'); document.body.classList.add('nav-open');
    setHdr(); setStagger();
    // apply compact scaling when opening
    try{ applyCompactScale(true); }catch(e){}
  }
  function closeNav(){
    if(!nav) return;
    nav.classList.remove('open'); if(scrim) scrim.classList.remove('open');
    document.documentElement.classList.remove('nav-open'); document.body.classList.remove('nav-open');
    // remove compact scaling when closing
    try{ applyCompactScale(false); }catch(e){}
  }
  if(toggle){ toggle.addEventListener('click', function(e){ e.preventDefault(); (nav.classList.contains('open')?closeNav:openNav)(); }); }
  if(scrim){ scrim.addEventListener('click', closeNav); }
})();

// Add compact-scaling helper for contact/careers pages on small screens
(function(){
  // Compact scale settings (tuned for phones)
  const COMPACT_SCALE = 0.92;
  const COMPACT_BREAKPOINT = 480;  // px - target small phones

  // detect contact/careers pages by form presence or body classes
  const isContactOrCareers = !!(
    document.querySelector('form[data-contact]') ||
    document.querySelector('form[data-careers]') ||
    document.body.classList.contains('contact') ||
    document.body.classList.contains('careers')
  );

  function chooseTarget(){
    // prefer <main>, fallback to container or body
    return document.querySelector('main') || document.querySelector('.container') || document.body;
  }

  function applyCompactScale(open){
    if(!isContactOrCareers) return;
    const small = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT}px)`).matches;
    const target = chooseTarget();
    if(!target) return;

    if(open && small){
      target.style.transition = 'transform .18s ease';
      target.style.transformOrigin = 'top center';
      target.style.transform = `scale(${COMPACT_SCALE})`;
      target.style.willChange = 'transform';
    }else{
      target.style.transform = '';
      target.style.transition = '';
      target.style.willChange = '';
    }
  }

  // expose globally so other modules / earlier code can call it safely
  window.applyCompactScale = applyCompactScale;

  // Re-apply when viewport resizes (if nav is open)
  window.addEventListener('resize', function(){
    try{ applyCompactScale(document.body.classList.contains('nav-open')); }catch(e){}
  });

  // Also re-run on orientation change for some devices
  window.addEventListener('orientationchange', function(){
    try{ applyCompactScale(document.body.classList.contains('nav-open')); }catch(e){}
  });

})();

// Tiny helper: compute header+banner top for drawer and wire toggle/staggering
(function(){
  const header = document.querySelector('header');
  const banner = document.querySelector('.hiring-banner, .announcement, .notice'); // pick first visible banner
  const nav    = document.getElementById('mobileNav') || document.querySelector('.mobile');
  const toggle = document.getElementById('menuToggle') || document.querySelector('[data-menu-toggle]') || document.querySelector('.burger');
  const scrim  = document.getElementById('scrim') || document.querySelector('.scrim');

  function computeTop(){
    let top = 0;
    if (banner && banner.offsetParent !== null) top += banner.getBoundingClientRect().height;
    if (header) top += header.getBoundingClientRect().height;
    // CSS var used by styles and also set nav.top to be safe
    document.documentElement.style.setProperty('--nav-top', top + 'px');
    if (nav) nav.style.top = top + 'px';
  }

  function setStagger(){
    if (!nav) return;
    const links = nav.querySelectorAll('a');
    links.forEach((a,i)=> a.style.setProperty('--delay', (0.03 * i) + 's'));
  }

  function openNav(){
    if (!nav) return;
    computeTop();
    setStagger();
    nav.classList.add('open');
    if (scrim) scrim.classList.add('open');
    document.documentElement.classList.add('nav-open');
    document.body.classList.add('nav-open');
  }

  function closeNav(){
    if (!nav) return;
    nav.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
    document.documentElement.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
  }

  // initial run + responsive updates
  computeTop();
  setStagger();
  window.addEventListener('resize', computeTop);
  window.addEventListener('orientationchange', computeTop);

  if (toggle) toggle.addEventListener('click', function(e){
    e && e.preventDefault();
    if (!nav) return;
    (nav.classList.contains('open') ? closeNav() : openNav());
  });
  if (scrim) scrim.addEventListener('click', closeNav);
})();
