document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------
     Helpers
  ------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function debounce(fn, wait = 100) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  function createToast(message, type = 'info', ms = 3000) {
    let container = document.getElementById('toasts-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toasts-container';
      Object.assign(container.style, {
        position: 'fixed',
        right: '16px',
        bottom: '80px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      });
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.textContent = message;
    t.className = `toast toast-${type}`;
    Object.assign(t.style, {
      background: type === 'success' ? '#2ecc71' : (type === 'error' ? '#ff6b6b' : '#333'),
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '10px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
      fontWeight: 600,
      pointerEvents: 'auto',
      transform: 'translateX(0)',
      opacity: '1',
      transition: 'transform .4s ease, opacity .4s ease'
    });
    container.appendChild(t);
    setTimeout(() => {
      t.style.transform = 'translateX(20px)';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 420);
    }, ms);
  }

  /* -------------------------
     Header: mobile toggle + shrink on scroll + outside click
  ------------------------- */
  const header = $('.header');
  const navToggle = $('.nav-toggle');
  const navList = $('.nav-list');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const open = navList.classList.toggle('open');
      if (open) {
        navList.style.display = 'flex';
        navList.style.flexDirection = 'column';
      } else {
        navList.style.display = 'none';
        navList.style.flexDirection = '';
      }
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (ev) => {
      if (!navList || !navToggle) return;
      if (window.innerWidth > 720) return;
      if (navList.contains(ev.target) || navToggle.contains(ev.target)) return;
      if (getComputedStyle(navList).display === 'flex') {
        navList.style.display = 'none';
        navList.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (header) {
    const initialPadding = getComputedStyle(header).padding || '22px 40px';
    const shrink = () => {
      if (window.scrollY > 30) {
        header.style.padding = '10px 28px';
        header.style.boxShadow = '0 8px 26px rgba(6,10,8,0.14)';
      } else {
        header.style.padding = initialPadding;
        header.style.boxShadow = '';
      }
    };
    shrink();
    window.addEventListener('scroll', debounce(shrink, 12), { passive: true });
  }

  /* -------------------------
     Smooth scroll for anchor links
  ------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;
      const el = document.querySelector(href);
      if (el) {
        ev.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navList && window.innerWidth <= 720) {
          navList.style.display = 'none';
          navList.classList.remove('open');
          navToggle && navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  /* -------------------------
     Hero parallax (mouse + scroll)
  ------------------------- */
  const hero = $('#home');
  const heroImage = hero ? hero.querySelector('.hero-image img') : null;
  if (hero && heroImage) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const tx = px * 12;
      const ty = py * 8;
      heroImage.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(1.02)`;
      heroImage.style.transition = 'transform .08s linear';
    });
    hero.addEventListener('mouseleave', () => {
      heroImage.style.transform = '';
      heroImage.style.transition = 'transform .4s cubic-bezier(.2,.9,.2,1)';
    });
    window.addEventListener('scroll', () => {
      const sc = window.scrollY;
      heroImage.style.transform = `translate3d(0, ${Math.min(sc * -0.03, -12)}px, 0) scale(1.01)`;
    }, { passive: true });
  }

  /* -------------------------
     Reveal on scroll
  ------------------------- */
  const revealSelector = '.section, .section-header, .product-card, .service-card, .about-content, .carousel-slide, .faq-list details';
  const revealEls = $$(revealSelector).filter(Boolean);
  if (revealEls.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Number(el.getAttribute('data-reveal-delay') || 0);
          setTimeout(() => el.classList.add('is-visible'), delay);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  /* -------------------------
     Carousel (transform-based sliding, circular, drag + buttons)
  ------------------------- */
  $$('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.querySelectorAll('.carousel-slide'));
    if (!slides.length) return;

    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    const dotsWrap = carousel.querySelector('.carousel-dots');

    let currentIndex = 0;
    let slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 32);
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    const setSliderPosition = () => {
      track.style.transform = `translateX(${currentTranslate}px)`;
    };

    const updateActive = () => {
      slides.forEach((slide, i) => slide.classList.toggle('active', i === currentIndex));
    };

    const goTo = (index) => {
      if (index < 0) currentIndex = slides.length - 1;
      else if (index >= slides.length) currentIndex = 0;
      else currentIndex = index;

      prevTranslate = currentTranslate = -currentIndex * slideWidth;
      track.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      setSliderPosition();
      updateDots();
      updateActive();
    };

    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      slides.forEach((s, i) => {
        const b = document.createElement('button');
        b.className = 'dot';
        b.setAttribute('aria-label', `Ir para slide ${i+1}`);
        b.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(b);
      });
      updateDots();
    };

    const updateDots = () => {
      if (!dotsWrap) return;
      Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    };

    prevBtn && prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

    // Drag handling (ignora botões dentro do slide)
    track.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.prev, .next, [data-prev], [data-next], button, a, .btn')) return;
      isDragging = true;
      startPos = e.clientX;
      track.style.transition = '';
      stopAuto();
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const currentPosition = e.clientX;
      currentTranslate = prevTranslate + currentPosition - startPos;
      setSliderPosition();
    });

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      const movedBy = currentTranslate - prevTranslate;
      if (movedBy < -100) currentIndex = (currentIndex + 1) % slides.length;
      if (movedBy > 100) currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      goTo(currentIndex);
      startAuto();
    };

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // Delegar clique em prev/next dentro de slides
    carousel.addEventListener('click', (ev) => {
      const prevEl = ev.target.closest('.prev, [data-prev]');
      const nextEl = ev.target.closest('.next, [data-next]');
      if (prevEl) { ev.preventDefault(); goTo(currentIndex - 1); }
      if (nextEl) { ev.preventDefault(); goTo(currentIndex + 1); }
    });

    // Autoplay
    let autoplay = null;
    const startAuto = () => {
      if (autoplay) return;
      autoplay = setInterval(() => goTo((currentIndex + 1) % slides.length), 4200);
    };
    const stopAuto = () => { clearInterval(autoplay); autoplay = null; };

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    // Resize handler
    window.addEventListener('resize', debounce(() => {
      slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 32);
      goTo(currentIndex);
    }, 120));

    // Init
    buildDots();
    goTo(0);
    startAuto();
  });

  /* -------------------------
     Floating CTA: scroll to #contato
  ------------------------- */
  const floating = $('.floating-cta');
  if (floating) {
    floating.addEventListener('click', () => {
      const c = document.getElementById('contato') || document.querySelector('.contato');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else createToast('Seção de contato não encontrada', 'error', 2200);
    });
  }

  /* -------------------------
     Simulate add to cart
  ------------------------- */
  $$('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      createToast('Adicionado ao carrinho (simulação) ✔', 'success', 1400);
      btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 260 });
    });
  });

});
