
const FORM_ENDPOINT = "/submit-contact"; // add your Formspree/Make endpoint when ready

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
const mobile = document.querySelector('.mobile');
if(menuBtn && mobile){
  menuBtn.addEventListener('click', ()=> mobile.classList.toggle('open'));
}

// Create scrim overlay for mobile nav
let scrim = document.querySelector('.scrim');
if(!scrim){
  scrim = document.createElement('div');
  scrim.className = 'scrim';
  document.body.appendChild(scrim);
}

function positionMobile(){
  if(!mobile) return;
  const hdr = document.querySelector('header');
  const top = (hdr ? hdr.offsetHeight : 110);
  mobile.style.top = top + 'px';
  mobile.style.maxHeight = `calc(100dvh - ${top}px)`;
}

function setNav(open){
  mobile.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  document.documentElement.classList.toggle('nav-open', open);
  document.body.classList.toggle('nav-open', open);
  positionMobile();
}

if(menuBtn && mobile){
  menuBtn.addEventListener('click', ()=> setNav(!mobile.classList.contains('open')));
  scrim.addEventListener('click', ()=> setNav(false));
  window.addEventListener('resize', positionMobile);
  window.addEventListener('load', positionMobile);
  document.addEventListener('visibilitychange', positionMobile);
}

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


// ---- Robust mobile nav (v6) ----
(function(){
  const menuBtn = document.querySelector('[aria-label="Menu"], .burger');
  const mobile = document.querySelector('.mobile');
  if(!menuBtn || !mobile) return;
  // Create scrim if missing
  let scrim = document.querySelector('.scrim');
  if(!scrim){
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    document.body.appendChild(scrim);
  }
  function getHeaderTop(){
    const hdr = document.querySelector('header');
    return hdr ? hdr.getBoundingClientRect().height : 88;
  }
  function lockScroll(on){
    document.documentElement.classList.toggle('nav-open', on);
    document.body.classList.toggle('nav-open', on);
  }
  function openNav(on){
    if(on){
      mobile.style.top = getHeaderTop() + 'px';
      mobile.style.maxHeight = `calc(100dvh - ${getHeaderTop()}px)`;
    }
    mobile.classList.toggle('open', on);
    scrim.classList.toggle('open', on);
    menuBtn.setAttribute('aria-expanded', String(on));
    lockScroll(on);
  }
  // Toggle on tap
  menuBtn.addEventListener('click', function(e){ e.preventDefault(); openNav(!mobile.classList.contains('open')); }, {passive:false});
  // Close on overlay or escape
  scrim.addEventListener('click', ()=> openNav(false));
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') openNav(false); });
  // Recalc on resize/visibility changes
  ['resize','load','orientationchange','visibilitychange'].forEach(ev=> window.addEventListener(ev, ()=>{
    if(mobile.classList.contains('open')){
      mobile.style.top = getHeaderTop() + 'px';
      mobile.style.maxHeight = `calc(100dvh - ${getHeaderTop()}px)`;
    }
  }));
})();


// ===== v7 robust mobile nav =====
(function(){
  const btn = document.querySelector('.btn.burger,[aria-label="Menu"]');
  const drawer = document.querySelector('.mobile');
  if(!btn || !drawer) return;
  // create scrim if missing
  let scrim = document.querySelector('.scrim');
  if(!scrim){
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    document.body.appendChild(scrim);
  }
  function setHdrVar(){
    const h = (document.querySelector('header')?.getBoundingClientRect().height) || 64;
    document.documentElement.style.setProperty('--hdr-h', h+'px');
  }
  function lock(on){
    document.documentElement.classList.toggle('nav-open', on);
    document.body.classList.toggle('nav-open', on);
    if(on){
      document.body.style.overflow='hidden';
      document.body.style.touchAction='none';
    }else{
      document.body.style.overflow='';
      document.body.style.touchAction='';
    }
  }
  function toggle(open){
    setHdrVar();
    drawer.classList.toggle('open', open);
    scrim.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    lock(open);
  }
  btn.addEventListener('click', (e)=>{ e.preventDefault(); toggle(!drawer.classList.contains('open')); }, {passive:false});
  scrim.addEventListener('click', ()=> toggle(false));
  ['load','resize','orientationchange','visibilitychange'].forEach(ev => window.addEventListener(ev, setHdrVar));
  setHdrVar();
})();


// ===== v8: single reliable mobile menu handler =====
(function(){
  const btn = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileNav');
  if(!btn || !drawer) return;

  // Create scrim if missing
  let scrim = document.querySelector('.scrim');
  if(!scrim){
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    document.body.appendChild(scrim);
  }

  function setHdrH(){
    const h = (document.querySelector('header')?.getBoundingClientRect().height) || 64;
    document.documentElement.style.setProperty('--hdr-h', h + 'px');
  }
  function lock(on){
    document.body.style.overflow = on ? 'hidden' : '';
    document.body.style.touchAction = on ? 'none' : '';
    document.documentElement.classList.toggle('nav-open', on);
    document.body.classList.toggle('nav-open', on);
  }
  function openNav(on){
    setHdrH();
    drawer.classList.toggle('open', on);
    scrim.classList.toggle('open', on);
    if(on){ try{ drawer.scrollTop = 0; }catch(e){} }
    btn.setAttribute('aria-expanded', String(on));
    lock(on);
  }
  function toggle(){ openNav(!drawer.classList.contains('open')); }

  // Click + keyboard
  btn.addEventListener('click', (e)=>{ e.preventDefault(); toggle(); });
  btn.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
  });
  scrim.addEventListener('click', ()=> openNav(false));

  // Keep position correct on rotate/resize
  ['load','resize','orientationchange','visibilitychange'].forEach(ev => window.addEventListener(ev, setHdrH));

  setHdrH();
})();
