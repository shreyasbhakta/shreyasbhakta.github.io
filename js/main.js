/* ============================================================
   CUSTOM CURSOR
============================================================ */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');

if (cursor && cursorRing && window.matchMedia('(hover: hover)').matches) {
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  const animRing = () => {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  };
  animRing();

  document.querySelectorAll('a, button, .skill-pill, .proj-card, .exp-item, .stat-item').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}

/* ============================================================
   SCROLL PROGRESS
============================================================ */
const progressBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  if (!progressBar) return;
  const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
  progressBar.style.width = (pct * 100) + '%';
}, { passive: true });

/* ============================================================
   NAVBAR SCROLL BEHAVIOR
============================================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  // Active nav link
  let current = '';
  document.querySelectorAll('section[id]').forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}, { passive: true });

/* ============================================================
   MOBILE MENU
============================================================ */
const hamburger     = document.getElementById('hamburger');
const mobileMenu    = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');

const openMenu  = () => { hamburger.classList.add('open'); mobileMenu.classList.add('open'); mobileOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
const closeMenu = () => { hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); mobileOverlay.classList.remove('open'); document.body.style.overflow = ''; };

hamburger?.addEventListener('click', () => mobileMenu.classList.contains('open') ? closeMenu() : openMenu());
mobileOverlay?.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-link').forEach(a => a.addEventListener('click', closeMenu));

/* ============================================================
   TYPEWRITER
============================================================ */
const twEl    = document.getElementById('typewriter');
const twWords = ['Java & Spring Boot', 'Distributed Systems', 'Kafka & Microservices', 'Fintech Engineer', 'Cloud-Native Systems'];
let twIdx = 0, twChar = 0, twDel = false, twDelay = 130;

function typeStep() {
  const word = twWords[twIdx];
  if (twDel) {
    twEl.textContent = word.slice(0, --twChar);
    twDelay = 55;
    if (twChar === 0) { twDel = false; twIdx = (twIdx + 1) % twWords.length; twDelay = 360; }
  } else {
    twEl.textContent = word.slice(0, ++twChar);
    twDelay = 130;
    if (twChar === word.length) { twDel = true; twDelay = 2400; }
  }
  setTimeout(typeStep, twDelay);
}
setTimeout(typeStep, 1800);

/* ============================================================
   SCROLL REVEAL
============================================================ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    revealObs.unobserve(e.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObs.observe(el));


/* ============================================================
   PROJECTS 3-CARD CAROUSEL
============================================================ */
const carouselStage = document.getElementById('projectsCarousel');
if (carouselStage) {
  const cards   = [...carouselStage.querySelectorAll('.proj-card')];
  const counter = document.getElementById('carouselCounter');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const total   = cards.length;
  let idx = 0;

  function setStates() {
    cards.forEach((card, i) => {
      const offset = ((i - idx) % total + total) % total;
      let state;
      if      (offset === 0)         state = 'center';
      else if (offset === 1)         state = 'right';
      else if (offset === total - 1) state = 'left';
      else if (offset <= Math.floor(total / 2)) state = 'hidden-right';
      else                           state = 'hidden-left';
      card.dataset.state = state;
    });
    if (counter) counter.textContent =
      String(idx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
  }

  const next = () => { idx = (idx + 1) % total; setStates(); };
  const prev = () => { idx = (idx - 1 + total) % total; setStates(); };

  nextBtn?.addEventListener('click', next);
  prevBtn?.addEventListener('click', prev);

  carouselStage.addEventListener('click', e => {
    const card = e.target.closest('.proj-card');
    if (!card) return;
    const state = card.dataset.state;
    if (state === 'left')  { prev(); return; }
    if (state === 'right') { next(); return; }
    if (state === 'center') {
      const url = card.dataset.url;
      if (!url) return;
      card.classList.add('flash');
      setTimeout(() => {
        card.classList.remove('flash');
        window.open(url, '_blank', 'noopener,noreferrer');
      }, 240);
    }
  });

  /* Swipe support on touch */
  let touchX = 0;
  carouselStage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  carouselStage.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
  }, { passive: true });

  setStates();
}

/* ============================================================
   EXPERIENCE TIMELINE — click to expand / collapse
============================================================ */
document.querySelectorAll('.exp-item').forEach(item => {
  item.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.exp-item.open').forEach(el => el.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ============================================================
   SKILL NAV — highlight active panel on scroll
============================================================ */
const skillNavItems  = document.querySelectorAll('.skill-nav-item');
const skillPanels    = document.querySelectorAll('.skill-panel');
const panelIds       = ['lang','backend','cloud','db','ai','sec'];

skillNavItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = document.getElementById('panel-' + item.dataset.target);
    if (!target) return;
    skillNavItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const top = target.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* Highlight nav item based on scroll position */
const skillSectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id.replace('panel-', '');
    skillNavItems.forEach(n => n.classList.toggle('active', n.dataset.target === id));
  });
}, { threshold: 0.5 });

skillPanels.forEach(p => skillSectionObs.observe(p));

/* ============================================================
   BACK TO TOP
============================================================ */
const backTop = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  backTop?.classList.toggle('show', window.scrollY > 500);
}, { passive: true });
backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ============================================================
   SMOOTH ANCHOR SCROLL
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 68;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ============================================================
   EDUCATION — hover background image
============================================================ */
document.querySelectorAll('.edu-item[data-bg]').forEach(item => {
  const overlay = item.querySelector('.edu-bg-overlay');
  if (!overlay) return;
  overlay.style.backgroundImage = `url(${item.dataset.bg})`;
});

/* ============================================================
   FOOTER YEAR
============================================================ */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
