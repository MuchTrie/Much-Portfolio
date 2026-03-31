/* ============================================================
   MUCH TRIE HARNANTO – PORTFOLIO SCRIPT
   Features: Section Loader, Navbar, Typed Text, Carousel,
             Reveal, Certifications, Project Filter, Contact,
             Back-to-Top
   ============================================================ */

'use strict';

/* ── 0. SECTION LOADER ───────────────────────────────────── */
// Each entry: [placeholder-div-id, path-to-view-html]
const SECTIONS = [
  ['section-navbar',         'views/navbar.html'],
  ['section-hero',           'views/hero.html'],
  ['section-about',          'views/about.html'],
  ['section-projects',       'views/projects.html'],
  ['section-experience',     'views/experience.html'],
  ['section-education',      'views/education.html'],
  ['section-certifications', 'views/certifications.html'],
  ['section-contact',        'views/contact.html'],
  ['section-footer',         'views/footer.html'],
];

async function loadAllSections() {
  await Promise.all(
    SECTIONS.map(([id, file]) =>
      fetch(file)
        .then(r => {
          if (!r.ok) throw new Error(`Failed to load ${file} (${r.status})`);
          return r.text();
        })
        .then(html => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = html;
        })
        .catch(err => console.error(err))
    )
  );
}

/* ── 1. DOM READY GUARD ──────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadAllSections().then(() => {
    initNavbar();
    initTypedText();
    initCarousels();
    initReveal();
    initCertificationModal();
    initProjectFilter();
    initContactForm();
    initBackToTop();
    initActiveNavLink();
    // 3D enhancements
    if (typeof initHero3D === 'function') initHero3D();
    if (typeof initGlobe3D === 'function') initGlobe3D();
    initTiltEffect();
    initHeroParallax();
  });
});


/* ── 2. NAVBAR (sticky scroll + hamburger) ───────────────── */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  const overlay   = document.getElementById('nav-overlay');

  // Add scrolled class for bg opacity change
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Toggle mobile menu
  function openMenu() {
    navMenu.classList.add('open');
    hamburger.classList.add('open');
    overlay.classList.add('show');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    hamburger.classList.remove('open');
    overlay.classList.remove('show');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  // Close menu on nav link click (mobile)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ESC key closes menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}


/* ── 3. ACTIVE NAV LINK (IntersectionObserver) ───────────── */
function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(sec => observer.observe(sec));
}


/* ── 4. TYPED TEXT EFFECT ────────────────────────────────── */
function initTypedText() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const phrases = [
    'Cybersecurity Enthusiast',
    'Full-Stack Web Developer',
    'Informatics Student',
    'Cloud Computing Learner',
  ];

  let phraseIndex = 0;
  let charIndex   = 0;
  let isDeleting  = false;
  let pause       = false;

  function type() {
    if (pause) return;

    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      el.textContent = currentPhrase.slice(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = currentPhrase.slice(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 60 : 100;

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Pause at end before deleting
      pause = true;
      setTimeout(() => {
        isDeleting = true;
        pause = false;
        type();
      }, 1800);
      return;
    }

    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(type, delay);
  }

  type();
}


/* ── 5. IMAGE CAROUSELS ──────────────────────────────────── */
function initCarousels() {
  const carousels = document.querySelectorAll('.project-carousel');

  carousels.forEach(carousel => {
    const slides   = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const dotsWrap = carousel.querySelector('.carousel-dots');
    const prevBtn  = carousel.querySelector('.carousel-prev');
    const nextBtn  = carousel.querySelector('.carousel-next');

    if (slides.length === 0) return;

    let current = 0;
    let autoTimer = null;

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function goTo(index) {
      slides[current].classList.remove('active');
      dotsWrap.children[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dotsWrap.children[current].classList.add('active');
    }

    function startAuto() {
      stopAuto();
      if (slides.length > 1) {
        autoTimer = setInterval(() => goTo(current + 1), 3500);
      }
    }

    function stopAuto() {
      clearInterval(autoTimer);
    }

    prevBtn.addEventListener('click', () => { goTo(current - 1); stopAuto(); startAuto(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); stopAuto(); startAuto(); });

    // Pause auto on hover
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    // Touch / swipe support
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        goTo(diff > 0 ? current + 1 : current - 1);
        stopAuto();
        startAuto();
      }
    }, { passive: true });

    startAuto();
  });
}


/* ── 6. SCROLL REVEAL (IntersectionObserver) ─────────────── */
function initReveal() {
  const targets = document.querySelectorAll('.reveal, .fade-in, .fade-in-delay');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate only once
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(el => observer.observe(el));
}


/* ── 7. CERTIFICATION MODALS ─────────────────────────────── */
function initCertificationModal() {
  const modalTriggers = document.querySelectorAll('[data-cert-modal-target]');
  const modals = document.querySelectorAll('.cert-modal');
  if (!modalTriggers.length || !modals.length) return;

  let activeModal = null;
  let lastFocusedElement = null;

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');

    window.setTimeout(() => {
      modal.hidden = true;
      if (activeModal === modal) activeModal = null;
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }, 220);
  }

  function openModal(modal, trigger) {
    if (!modal) return;

    if (activeModal && activeModal !== modal) {
      activeModal.classList.remove('is-open');
      activeModal.hidden = true;
    }

    lastFocusedElement = trigger || document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
    });

    activeModal = modal;
    document.body.classList.add('modal-open');

    const focusTarget = modal.querySelector('.cert-modal-close, .cert-btn, .cert-open-btn');
    if (focusTarget) focusTarget.focus();
  }

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-cert-modal-target');
      if (!modalId) return;
      openModal(document.getElementById(modalId), trigger);
    });
  });

  modals.forEach(modal => {
    modal.addEventListener('click', (event) => {
      const closeTrigger = event.target.closest('[data-cert-modal-close]');
      if (closeTrigger && modal.contains(closeTrigger)) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeModal) {
      closeModal(activeModal);
    }
  });
}


/* ── 8. PROJECT FILTER AND PAGINATION ──────────────────────── */
function initProjectFilter() {
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const projectCards = Array.from(document.querySelectorAll('.project-card[data-category]'));
  const paginationContainer = document.getElementById('projects-pagination');

  const CARDS_PER_PAGE = 6;
  let currentPage = 1;
  let currentFilter = 'all';

  function renderCards() {
    // Filter cards
    const filteredCards = projectCards.filter(card => {
      return currentFilter === 'all' || card.dataset.category === currentFilter;
    });

    const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);

    // Hide all first
    projectCards.forEach(card => card.style.display = 'none');

    // Calculate range
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    const end = start + CARDS_PER_PAGE;

    // Show current page cards
    const pageCards = filteredCards.slice(start, end);
    pageCards.forEach(card => {
      card.style.display = '';
      card.classList.add('visible'); // re-trigger reveal
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }

    paginationContainer.style.display = 'flex';

    // Prev btn
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCards();
        scrollToProjects();
      }
    });
    paginationContainer.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderCards();
        scrollToProjects();
      });
      paginationContainer.appendChild(pageBtn);
    }

    // Next btn
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn next-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderCards();
        scrollToProjects();
      }
    });
    paginationContainer.appendChild(nextBtn);
  }

  function scrollToProjects() {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      // Small delay to let items render before scrolling
      setTimeout(() => {
        const y = projectsSection.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 50);
    }
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentFilter = btn.dataset.filter;
      currentPage = 1; // reset to 1 on filter
      renderCards();
    });
  });

  // Initial render
  renderCards();
}


/* ── 9. CONTACT FORM VALIDATION ──────────────────────────── */
function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  // Sanitize input to prevent XSS (basic defence for display purposes)
  function sanitize(str) {
    return str.replace(/[<>"'&]/g, (c) => ({
      '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
    }[c]));
  }

  function showError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(`${fieldId}-error`);
    if (field)  field.classList.add('error');
    if (errEl)  errEl.textContent = msg;
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(`${fieldId}-error`);
    if (field)  field.classList.remove('error');
    if (errEl)  errEl.textContent = '';
  }

  // Live clear on input
  ['name', 'email', 'subject', 'message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearError(id));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    // Validate – only clears errors for valid fields, shows for invalid
    if (!name) { showError('name', 'Please enter your name.'); valid = false; }
    else clearError('name');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) { showError('email', 'Please enter your email.'); valid = false; }
    else if (!emailRegex.test(email)) { showError('email', 'Please enter a valid email.'); valid = false; }
    else clearError('email');

    if (!subject) { showError('subject', 'Please enter a subject.'); valid = false; }
    else clearError('subject');

    if (!message || message.length < 10) {
      showError('message', 'Message must be at least 10 characters.'); valid = false;
    } else clearError('message');

    if (!valid) return;

    // Simulate send (mailto fallback)
    const safeSubject = sanitize(subject);
    const safeBody    = sanitize(`Name: ${name}\n\n${message}`);

    // Build mailto string (safe because values are URL-encoded by encodeURIComponent)
    const mailtoLink = `mailto:muchtrieha@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailtoLink;

    // Show success message
    form.reset();
    success.hidden = false;
    setTimeout(() => { success.hidden = true; }, 5000);
  });
}


/* ── 10. BACK TO TOP ─────────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ── 11. 3D TILT EFFECT (Project Cards) ──────────────────── */
function initTiltEffect() {
  // Skip on mobile / touch devices
  if (window.innerWidth < 768 || 'ontouchstart' in window) return;

  const cards = document.querySelectorAll('.project-card:not(.project-wip)');

  cards.forEach(card => {
    // Inject glare overlay
    const glare = document.createElement('div');
    glare.className = 'tilt-glare';
    card.appendChild(glare);

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Max rotation 8 degrees
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;

      // Move glare to mouse position
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      glare.style.background = '';
    });
  });
}


/* ── 12. HERO 3D PARALLAX ────────────────────────────────── */
// Globe handles its own mouse interaction via 3d-globe.js
function initHeroParallax() {
  // No-op: replaced by 3D Globe mouse interaction
}
