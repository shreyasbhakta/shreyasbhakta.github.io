/* ============================================================
   RESUME DOWNLOAD
============================================================ */
const RESUME_PRIMARY  = 'resume/Shreyas_Bhakta_Resume.pdf';
const RESUME_FALLBACK = 'resume/Shreyas_Bhakta_SE.pdf';
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mljernqb';
// Public, no-auth hit counter (abacus.jasoncameron.dev) — safe to call from client-side code,
// unlike CounterAPI v2 which now requires a bearer key that a public page can't hide.
const COUNTER_NAMESPACE  = 'shreyasbhakta-dev';
const COUNTER_KEY        = 'resume-downloads';
const COUNTER_BASE       = 55;

const EMAIL_FORMAT_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', 'trashmail.com', 'fakeinbox.com', 'dispostable.com', 'sharklasers.com',
  'getnada.com', 'maildrop.cc', 'throwawaymail.com', 'mintemail.com', 'mytemp.email',
  'moakt.com', 'emailondeck.com', 'discard.email', 'spamgourmet.com', 'mailnesia.com',
  'tempinbox.com', 'burnermail.io', '33mail.com', 'anonbox.net', 'mailcatch.com',
  'mailsac.com', 'inboxkitten.com', 'tempr.email', '20minutemail.com', 'harakirimail.com'
]);

const EMAIL_TYPO_DOMAINS = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmailc.om': 'gmail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com', 'hotnail.com': 'hotmail.com', 'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outllok.com': 'outlook.com', 'outlook.con': 'outlook.com'
};

// Client-side checks only — a static site can't verify mailbox deliverability
// without a backend to hold a verification-service API key out of public view.
function validateResumeEmail(raw) {
  const email = (raw || '').trim().toLowerCase();
  if (!EMAIL_FORMAT_RE.test(email)) {
    return { ok: false, level: 'error', message: "That doesn't look like a valid email — check the format and try again." };
  }
  const domain = email.split('@')[1];
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, level: 'error', message: 'Please use a permanent email address, not a temporary/disposable one.' };
  }
  if (EMAIL_TYPO_DOMAINS[domain]) {
    const corrected = `${email.split('@')[0]}@${EMAIL_TYPO_DOMAINS[domain]}`;
    return { ok: true, email, flagged: true, message: `Heads up — did you mean ${corrected}? Sent anyway; flagged for review.` };
  }
  return { ok: true, email };
}

const resumeBtn       = document.getElementById('resumeDownloadBtn');
const resumeCounterEl = document.getElementById('resumeCounter');
const resumeOverlay   = document.getElementById('resumeModalOverlay');
const resumeModal     = document.getElementById('resumeModal');
const resumeCloseBtn  = document.getElementById('resumeModalClose');
const resumeForm      = document.getElementById('resumeModalForm');
const resumeSubmitBtn = document.getElementById('resumeSubmitBtn');
const resumeNoteEl    = document.getElementById('resumeModalNote');
const resumeEmailEl   = document.getElementById('resumeEmail');

function renderResumeCount(n) {
  if (resumeCounterEl) resumeCounterEl.textContent = n != null ? `${n} downloads` : '';
}

async function fetchResumeCount(bump) {
  try {
    const action = bump ? 'hit' : 'get';
    const res = await fetch(`https://abacus.jasoncameron.dev/${action}/${COUNTER_NAMESPACE}/${COUNTER_KEY}`);
    if (!res.ok) throw new Error('counter request failed');
    const data = await res.json();
    return typeof data.value === 'number' ? COUNTER_BASE + data.value : null;
  } catch {
    return null;
  }
}

if (resumeBtn) {
  fetchResumeCount(false).then(n => renderResumeCount(n != null ? n : COUNTER_BASE));

  const openResumeModal = () => {
    resumeOverlay.classList.add('open');
    resumeModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    resumeNoteEl.textContent = '';
    setTimeout(() => resumeEmailEl?.focus(), 50);
  };
  const closeResumeModal = () => {
    resumeOverlay.classList.remove('open');
    resumeModal.classList.remove('open');
    document.body.style.overflow = '';
  };

  resumeBtn.addEventListener('click', openResumeModal);
  resumeCloseBtn.addEventListener('click', closeResumeModal);
  resumeOverlay.addEventListener('click', closeResumeModal);

  async function fetchResumeBlob(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    if (!blob || blob.size === 0) throw new Error('empty file');
    return blob;
  }

  async function triggerResumeDownload() {
    let blob, filename;
    try {
      blob = await fetchResumeBlob(RESUME_PRIMARY);
      filename = 'Shreyas_Bhakta_Resume.pdf';
    } catch {
      blob = await fetchResumeBlob(RESUME_FALLBACK);
      filename = 'Shreyas_Bhakta_SE.pdf';
    }
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
  }

  resumeForm.addEventListener('submit', async e => {
    e.preventDefault();

    resumeNoteEl.textContent = '';
    resumeNoteEl.classList.remove('error', 'warn');

    // Honeypot — real visitors never fill this in; bots that scrape+submit the raw form often do.
    if (resumeForm.elements['_gotcha']?.value) return;

    const check = validateResumeEmail(resumeEmailEl.value);
    if (!check.ok) {
      resumeNoteEl.textContent = check.message;
      resumeNoteEl.classList.add('error');
      return;
    }
    const email = check.email;
    if (check.flagged) {
      resumeNoteEl.textContent = check.message;
      resumeNoteEl.classList.add('warn');
    }

    resumeSubmitBtn.disabled = true;
    resumeSubmitBtn.textContent = 'Sending...';

    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          flagged_possible_typo: !!check.flagged,
          message: "Every connection starts with sharing — thanks for sharing your email. Hope this is the start of something great!",
          source: 'shreyasbhakta.dev resume download'
        })
      });
    } catch {
      // Don't block the download if the email log fails
    }

    try {
      await triggerResumeDownload();
      const n = await fetchResumeCount(true);
      renderResumeCount(n);
      if (!check.flagged) resumeNoteEl.textContent = 'Thanks! Your download should start automatically.';
      setTimeout(closeResumeModal, 1800);
    } catch {
      resumeNoteEl.textContent = 'Something went wrong — please email me directly at shreyasbhakta@gmail.com.';
      resumeNoteEl.classList.add('error');
    } finally {
      resumeSubmitBtn.disabled = false;
      resumeSubmitBtn.textContent = 'Send Resume My Way';
    }
  });
}

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
const twWords = ['I Build the Backend · Then I Teach It to Think', 'Engineered for Scale · Wired for Intelligence'];
let twIdx = 0, twChar = 0, twDel = false, twDelay = 45;

function typeStep() {
  const word = twWords[twIdx];
  if (twDel) {
    twEl.textContent = word.slice(0, --twChar);
    twDelay = 18;
    if (twChar === 0) { twDel = false; twIdx = (twIdx + 1) % twWords.length; twDelay = 200; }
  } else {
    twEl.textContent = word.slice(0, ++twChar);
    twDelay = 45;
    if (twChar === word.length) { twDel = true; twDelay = 1400; }
  }
  setTimeout(typeStep, twDelay);
}
setTimeout(typeStep, 800);

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
      card.classList.add('flash');
      setTimeout(() => card.classList.remove('flash'), 240);
      openProjectModal(card);
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
   PROJECT DETAIL MODAL (image slider)
============================================================ */
// Includes uppercase variants — GitHub Pages serves from a case-sensitive filesystem,
// unlike macOS locally, so "1.JPG" on disk won't match a request for "1.jpg" in production.
const PROJECT_IMAGE_EXTENSIONS = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'webp', 'WEBP'];
const PROJECT_IMAGE_MAX_PROBE  = 20;
const projectImageCache = new Map();

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve({ src, ratio: img.naturalHeight / img.naturalWidth });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function findProjectImage(slug, n) {
  for (const ext of PROJECT_IMAGE_EXTENSIONS) {
    const found = await loadImage(`assets/projects/${slug}/${n}.${ext}`);
    if (found) return found;
  }
  return null;
}

async function getProjectImages(slug) {
  if (projectImageCache.has(slug)) return projectImageCache.get(slug);
  const found = [];
  for (let n = 1; n <= PROJECT_IMAGE_MAX_PROBE; n++) {
    const img = await findProjectImage(slug, n);
    if (!img) break;
    found.push(img);
  }
  projectImageCache.set(slug, found);
  return found;
}

const SLIDER_MIN_HEIGHT = 220;
const SLIDER_MAX_HEIGHT = 560;
const SLIDER_MAX_VH     = 0.6;

const projectModal        = document.getElementById('projectModal');
const projectModalOverlay = document.getElementById('projectModalOverlay');
const projectModalClose   = document.getElementById('projectModalClose');
const projectModalTitle   = document.getElementById('projectModalTitle');
const projectModalGithub  = document.getElementById('projectModalGithub');
const projectSlider       = document.getElementById('projectSlider');
const sliderTrackWrap     = document.getElementById('sliderTrackWrap');
const sliderTrack         = document.getElementById('sliderTrack');
const sliderDots          = document.getElementById('sliderDots');
const sliderPrev          = document.getElementById('sliderPrev');
const sliderNext          = document.getElementById('sliderNext');

let sliderImages = []; // [{ src, ratio }]
let sliderIndex  = 0;

function applySlideHeight() {
  if (!sliderImages.length) { sliderTrackWrap.style.height = ''; return; }
  const ratio = sliderImages[sliderIndex].ratio;
  const width = sliderTrackWrap.getBoundingClientRect().width;
  const maxHeight = Math.min(SLIDER_MAX_HEIGHT, window.innerHeight * SLIDER_MAX_VH);
  const height = Math.min(maxHeight, Math.max(SLIDER_MIN_HEIGHT, width * ratio));
  sliderTrackWrap.style.height = `${height}px`;
}

function renderSlide() {
  sliderTrack.style.transform = `translateX(-${sliderIndex * 100}%)`;
  [...sliderDots.children].forEach((dot, i) => dot.classList.toggle('active', i === sliderIndex));
  applySlideHeight();
}

function slideTo(i) {
  sliderIndex = (i + sliderImages.length) % sliderImages.length;
  renderSlide();
}

function closeProjectModal() {
  projectModal?.classList.remove('open');
  projectModalOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

let projectModalRequestId = 0;

async function openProjectModal(card) {
  if (!projectModal) return;
  const requestId = ++projectModalRequestId;
  const slug  = card.dataset.slug;
  const url   = card.dataset.url;
  const title = card.querySelector('.proj-title')?.textContent || '';

  projectModalTitle.textContent = title;
  projectModalGithub.href = url || '#';

  sliderTrack.innerHTML = '';
  sliderDots.innerHTML  = '';
  sliderImages = [];
  sliderIndex  = 0;
  projectSlider.classList.remove('has-images', 'single-image');

  projectModalOverlay.classList.add('open');
  projectModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const images = slug ? await getProjectImages(slug) : [];
  // A newer open (or a fast card-to-card click) may have started while this was probing — don't clobber it.
  if (requestId !== projectModalRequestId) return;
  sliderImages = images;
  if (images.length) {
    projectSlider.classList.add('has-images');
    if (images.length === 1) projectSlider.classList.add('single-image');
    images.forEach((image, i) => {
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = `${title} screenshot ${i + 1}`;
      sliderTrack.appendChild(img);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot';
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      dot.addEventListener('click', () => slideTo(i));
      sliderDots.appendChild(dot);
    });
    renderSlide();
  }
}

projectModalClose?.addEventListener('click', closeProjectModal);
projectModalOverlay?.addEventListener('click', closeProjectModal);
sliderPrev?.addEventListener('click', () => slideTo(sliderIndex - 1));
sliderNext?.addEventListener('click', () => slideTo(sliderIndex + 1));
window.addEventListener('resize', () => {
  if (projectModal?.classList.contains('open')) applySlideHeight();
}, { passive: true });
document.addEventListener('keydown', e => {
  if (!projectModal?.classList.contains('open')) return;
  if (e.key === 'Escape') closeProjectModal();
  if (e.key === 'ArrowLeft' && sliderImages.length > 1) slideTo(sliderIndex - 1);
  if (e.key === 'ArrowRight' && sliderImages.length > 1) slideTo(sliderIndex + 1);
});

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
