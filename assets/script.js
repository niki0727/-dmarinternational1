/* DMAR Mobile Drawer – robust + tiny (no deps) */
(function () {
  const root  = document.documentElement;
  let scrim = document.querySelector('.scrim');
  if (!scrim) { scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim); }
  const nav  = document.getElementById('mobileNav') || document.querySelector('.mobile');
  const btn  = document.getElementById('menuToggle') ||
               document.querySelector('.btn.burger') ||
               document.querySelector('[data-menu]');

  function setOffsets(){
    const header = document.querySelector('header, .site-header');
    const h = header ? Math.round(header.getBoundingClientRect().height) : 64;
    root.style.setProperty('--hdr-h', h + 'px');
  }
  function openNav(){
    if(!nav) return;
    nav.classList.add('open');  scrim.classList.add('open');  root.classList.add('nav-open');
    const first = nav.querySelector('a,button,input,select,textarea'); first && first.focus({preventScroll:true});
  }
  function closeNav(){
    if(!nav) return;
    nav.classList.remove('open'); scrim.classList.remove('open'); root.classList.remove('nav-open');
    btn && btn.focus({preventScroll:true});
  }

  btn && btn.addEventListener('click', e => { e.preventDefault(); nav && nav.classList.contains('open') ? closeNav() : openNav(); });
  scrim.addEventListener('click', closeNav);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  nav && nav.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });

  setOffsets(); window.addEventListener('resize', setOffsets); window.addEventListener('orientationchange', setOffsets);
})();