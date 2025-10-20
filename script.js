// Mobile nav
(function(){
  const btn = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileNav');
  let scrim = document.querySelector('.scrim');
  if(!btn || !drawer) return;
  if(!scrim){ scrim = document.createElement('div'); scrim.className='scrim'; document.body.appendChild(scrim); }

  function setHdr(){ const h=(document.querySelector('header')?.getBoundingClientRect().height)||64;
    document.documentElement.style.setProperty('--hdr-h', h+'px'); }
  function lock(on){ document.body.style.overflow= on ? 'hidden' : ''; document.body.style.touchAction= on ? 'none' : ''; scrim.classList.toggle('open', on); }
  function openNav(on){ setHdr(); drawer.classList.toggle('open', on); lock(on); btn.setAttribute('aria-expanded', String(on)); if(on){ try{ drawer.scrollTop=0; }catch(e){} } }
  btn.addEventListener('click', e=>{ e.preventDefault(); openNav(!drawer.classList.contains('open')); });
  btn.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openNav(!drawer.classList.contains('open')); }});
  scrim.addEventListener('click', ()=> openNav(false));
  ['load','resize','orientationchange','visibilitychange'].forEach(ev=> window.addEventListener(ev, setHdr));
  setHdr();
})();

// Reveal animation
(function(){
  const els=[...document.querySelectorAll('.reveal')];
  if(!('IntersectionObserver' in window) || !els.length){ els.forEach(e=>e.classList.add('in')); return; }
  const io=new IntersectionObserver((es)=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} }),{rootMargin:'0px 0px -10% 0px',threshold:0.1});
  els.forEach(e=> io.observe(e));
})();
