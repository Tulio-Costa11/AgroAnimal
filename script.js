// script.js — Versão sem drawer (100% cliente, sem backend, sem storage)
// Inclui: menu mobile, shrink-on-scroll, smooth anchors, hero parallax,
// reveal on scroll, carousel (prev/next/dots/drag/autoplay), floating CTA -> scroll to contact,
// toasts, atalhos de teclado.

/* global document, window, Image */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------
     Helpers
  ------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

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
  const header = document.querySelector('.header') || document.querySelector('.site-header') || document.querySelector('header');
  const navToggle = document.querySelector('.nav-toggle') || document.querySelector('.toggle-menu') || document.querySelector('.site-header .toggle-menu');
  const navList = document.querySelector('.nav-list') || (header && header.querySelector('nav ul'));

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

    // close mobile menu when clicking outside (only when mobile)
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
        // close mobile nav if open
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
  const hero = document.querySelector('#home') || document.querySelector('.hero');
  const heroImage = hero ? hero.querySelector('.hero-image img') : null;
  if (hero && heroImage) {
    // Mouse parallax
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
    // Scroll parallax
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
     Carousel (per .carousel)
  ------------------------- */
  $$('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    // Wrap into .inner for consistent handling
    let inner = track.querySelector('.inner');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'inner';
      while (track.firstChild) inner.appendChild(track.firstChild);
      track.appendChild(inner);
    }

    const slides = Array.from(inner.querySelectorAll('.carousel-slide'));
    if (!slides.length) return;

    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    const dotsWrap = carousel.querySelector('.carousel-dots');

    let current = 0;
    const getCenterScroll = (index) => {
      const slide = slides[index];
      const slideLeft = slide.offsetLeft;
      const offset = (track.clientWidth - slide.clientWidth) / 2;
      return Math.round(slideLeft - offset);
    };

    const goTo = (index) => {
      index = Math.max(0, Math.min(slides.length - 1, index));
      const pos = getCenterScroll(index);
      track.scrollTo({ left: pos, behavior: 'smooth' });
      current = index;
      updateDots();
    };

    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      slides.forEach((s, i) => {
        const b = document.createElement('button');
        b.className = 'dot';
        b.setAttribute('aria-label', `Ir para ${i+1}`);
        b.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(b);
      });
      updateDots();
    };

    const updateDots = () => {
      if (!dotsWrap) return;
      Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('active', i === current));
    };

    // prev/next handlers
    prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));

    // update current after scroll
    let scrollTimer;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const centers = slides.map((s, i) => ({ i, dist: Math.abs(track.scrollLeft - getCenterScroll(i)) }));
        centers.sort((a, b) => a.dist - b.dist);
        current = centers[0].i;
        updateDots();
      }, 120);
    }, { passive: true });

    // autoplay
    let autoplay = null;
    const startAuto = () => {
      if (autoplay) return;
      autoplay = setInterval(() => {
        const nextIdx = (current + 1) % slides.length;
        goTo(nextIdx);
      }, 4200);
    };
    const stopAuto = () => { if (autoplay) { clearInterval(autoplay); autoplay = null; } };

    track.addEventListener('mouseenter', stopAuto);
    track.addEventListener('mouseleave', startAuto);

    // pointer drag
    let isDown = false, startX = 0, scrollLeft = 0;
    track.addEventListener('pointerdown', (e) => {
      isDown = true; startX = e.clientX; scrollLeft = track.scrollLeft; track.setPointerCapture(e.pointerId); track.style.cursor = 'grabbing';
      stopAuto();
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      track.scrollLeft = scrollLeft - dx;
    });
    const endDrag = () => {
      if (!isDown) return; isDown = false; track.style.cursor = '';
      const centers = slides.map((s, i) => ({ i, dist: Math.abs(track.scrollLeft - getCenterScroll(i)) }));
      centers.sort((a,b) => a.dist - b.dist);
      goTo(centers[0].i);
      startAuto();
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // keyboard navigation
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goTo(Math.min(current + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') goTo(Math.max(current - 1, 0));
    });

    // init
    buildDots();
    goTo(0);
    startAuto();
    window.addEventListener('resize', debounce(() => goTo(current), 120));
  });

  /* -------------------------
     Floating CTA: scroll to #contato
     (no drawer, no backend)
  ------------------------- */
  const floating = document.querySelector('.floating-cta');
  if (floating) {
    floating.addEventListener('click', () => {
      const c = document.getElementById('contato') || document.getElementById('contact') || document.querySelector('.contato');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else createToast('Seção de contato não encontrada', 'error', 2200);
    });
  }

  /* -------------------------
     Simulate add to cart (client-only)
  ------------------------- */
  $$('.btn-small, .product-card .btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      createToast('Adicionado ao carrinho (simulação) ✔', 'success', 1400);
      btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 260 });
    });
  });

  /* -------------------------
     Keyboard shortcuts (client-only)
     - "c": go to contato section
     - "g": go to products
     - "Esc": noop (keeps behaviour simple)
  ------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      const c = document.getElementById('contato') || document.querySelector('.contato');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else createToast('Seção de contato não encontrada', 'error', 1800);
    } else if (e.key === 'g' || e.key === 'G') {
      const p = document.getElementById('products') || document.querySelector('.products');
      p && p.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  /* -------------------------
     Small onboarding tip
  ------------------------- */
  setTimeout(() => createToast('Dica: pressione "c" para ir rapidamente ao contato.', 'info', 4200), 1200);

}); // DOMContentLoaded
