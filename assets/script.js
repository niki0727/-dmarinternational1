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
  }
  function closeNav(){
    if(!nav) return;
    nav.classList.remove('open'); if(scrim) scrim.classList.remove('open');
    document.documentElement.classList.remove('nav-open'); document.body.classList.remove('nav-open');
  }
  if(toggle){ toggle.addEventListener('click', function(e){ e.preventDefault(); (nav.classList.contains('open')?closeNav:openNav)(); }); }
  if(scrim){ scrim.addEventListener('click', closeNav); }
})();
