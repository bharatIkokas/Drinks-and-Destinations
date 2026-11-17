/* ==========================================================================
   Drinks & Destinations — main.js
   Libraries (loaded via CDN, all optional — the page degrades gracefully):
   GSAP + ScrollTrigger + SplitText, Lenis, Swiper.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = reduceMotionQuery.matches;
  const DESKTOP_NAV_MQ = window.matchMedia('(min-width: 1200px)');

  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const hasSplitText = hasGSAP && typeof window.SplitText !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const hasSwiper = typeof window.Swiper !== 'undefined';

  /* ---------- Utils ---------- */
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  const debounce = (fn, wait = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const getHeaderOffset = () => {
    const header = $('[data-header]');
    return header ? header.offsetHeight : 0;
  };

  let lenis = null;

  /* ---------- Missing image slots ----------
     Each <img> points at a fixed filename in /images. Until the file exists we
     hide the broken image so the labelled placeholder underneath shows. */
  function initImageFallbacks() {
    $$('.media img, .logo__img').forEach((img) => {
      const markMissing = () => img.classList.add('is-missing');
      const markLoaded = () => {
        img.classList.remove('is-missing');
        refreshScrollTriggers();
      };
      if (img.complete) {
        if (img.naturalWidth === 0) markMissing();
      }
      img.addEventListener('error', markMissing);
      img.addEventListener('load', markLoaded);
    });
  }

  const refreshScrollTriggers = debounce(() => {
    if (hasScrollTrigger) window.ScrollTrigger.refresh();
  }, 200);

  /* ---------- Smooth scroll (Lenis ↔ ScrollTrigger) ---------- */
  function initSmoothScroll() {
    if (!hasLenis || prefersReducedMotion) return;

    lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });

    if (hasScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target) {
    const offset = -getHeaderOffset();
    if (lenis) {
      lenis.scrollTo(target, { offset: target === 0 ? 0 : offset, duration: 1.2 });
      return;
    }
    const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  /* ---------- Anchor links ---------- */
  function initAnchors() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute('href');
      // Placeholder links (href="#") do nothing for now: no jump to the top.
      if (hash === '#') {
        event.preventDefault();
        closeMobileMenu();
        closeAllDropdowns();
        return;
      }
      if (!hash) return;

      const target = hash === '#top' ? 0 : document.getElementById(hash.slice(1));
      if (target === null) return;

      event.preventDefault();
      closeMobileMenu();
      closeAllDropdowns();
      scrollToTarget(target);

      if (history.replaceState) history.replaceState(null, '', hash);

      // Move focus for keyboard / screen-reader users without a second jump
      const focusEl = target === 0 ? $('#main') : target;
      if (focusEl) {
        if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
        focusEl.focus({ preventScroll: true });
      }
    });
  }

  /* ---------- Header: shadow + hide on scroll down ---------- */
  function initHeader() {
    const header = $('[data-header]');
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 4);

      const menuOpen = root.classList.contains('menu-open');
      const dropdownOpen = !!$('.has-dropdown.is-open');
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;

      if (!menuOpen && !dropdownOpen && goingDown && y > 400) header.classList.add('is-hidden');
      else if (goingUp || y < 400 || menuOpen) header.classList.remove('is-hidden');

      lastY = y;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    // Keyboard users tabbing into the header should always see it
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    update();
  }

  /* ---------- Desktop dropdowns ---------- */
  function closeAllDropdowns(except = null) {
    $$('[data-dropdown]').forEach((dd) => {
      if (dd === except) return;
      dd.classList.remove('is-open');
      const toggle = $('[data-dropdown-toggle]', dd);
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function initDropdowns() {
    const dropdowns = $$('[data-dropdown]');
    if (!dropdowns.length) return;

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

    dropdowns.forEach((dd) => {
      const toggle = $('[data-dropdown-toggle]', dd);
      const menu = $('[data-dropdown-menu]', dd);
      if (!toggle || !menu) return;

      const setOpen = (open) => {
        if (open) closeAllDropdowns(dd);
        dd.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      };

      toggle.addEventListener('click', () => setOpen(!dd.classList.contains('is-open')));

      let hoverTimer;
      dd.addEventListener('mouseenter', () => {
        if (!canHover.matches) return;
        clearTimeout(hoverTimer);
        setOpen(true);
      });
      dd.addEventListener('mouseleave', () => {
        if (!canHover.matches) return;
        hoverTimer = setTimeout(() => setOpen(false), 160);
      });

      dd.addEventListener('keydown', (event) => {
        const items = $$('a', menu);
        const index = items.indexOf(document.activeElement);

        if (event.key === 'Escape') {
          setOpen(false);
          toggle.focus();
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          setOpen(true);
          (items[index + 1] || items[0]).focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          (items[index - 1] || items[items.length - 1]).focus();
        }
      });

      dd.addEventListener('focusout', (event) => {
        if (!dd.contains(event.relatedTarget)) setOpen(false);
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-dropdown]')) closeAllDropdowns();
    });
  }

  /* ---------- Mobile menu ---------- */
  let mobileMenu = null;
  let burger = null;

  function openMobileMenu() {
    if (!mobileMenu || !burger) return;
    mobileMenu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    root.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();

    const header = $('[data-header]');
    if (header) header.classList.remove('is-hidden');

    if (hasGSAP && !prefersReducedMotion) {
      window.gsap.fromTo(mobileMenu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
      window.gsap.fromTo($$('.mobile-menu__list > li, .mobile-menu__cta', mobileMenu),
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: 'power3.out', delay: 0.05 });
    }

    const firstLink = $('a, button', mobileMenu);
    if (firstLink) firstLink.focus();
  }

  function closeMobileMenu({ returnFocus = false } = {}) {
    if (!mobileMenu || !burger || mobileMenu.hidden) return;
    mobileMenu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    root.classList.remove('menu-open');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (returnFocus) burger.focus();
  }

  function initMobileMenu() {
    mobileMenu = $('[data-mobile-menu]');
    burger = $('[data-burger]');
    if (!mobileMenu || !burger) return;

    burger.addEventListener('click', () => {
      if (mobileMenu.hidden) openMobileMenu();
      else closeMobileMenu();
    });

    // Accordion for sub-menus
    $$('[data-accordion]', mobileMenu).forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
      });
    });

    // Esc + focus trap
    document.addEventListener('keydown', (event) => {
      if (mobileMenu.hidden) return;
      if (event.key === 'Escape') {
        closeMobileMenu({ returnFocus: true });
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = [burger, ...$$('a[href], button:not([disabled])', mobileMenu)]
        .filter((el) => el.offsetParent !== null);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    DESKTOP_NAV_MQ.addEventListener('change', (e) => {
      if (e.matches) closeMobileMenu();
    });
  }

  /* ---------- Active nav item while scrolling ---------- */
  function initActiveNav() {
    const tabs = $$('.primary-nav a.nav-tab, .primary-nav [data-dropdown-toggle]');
    if (!tabs.length || !('IntersectionObserver' in window)) return;

    const map = new Map([
      ['top', $('.primary-nav a[href="#top"]')],
      ['news', $('.primary-nav [data-dropdown-toggle]')],
      ['about', $('.primary-nav a[href="#about"]')],
      ['consulting', $('.primary-nav a[href="#consulting"]')],
      ['experiences', $('.primary-nav a[href="#experiences"]')],
      ['rtmis', $('.primary-nav a[href="#rtmis"]')],
      ['in-the-news', $('.primary-nav a[href="#in-the-news"]')],
    ]);

    const setActive = (id) => {
      const active = map.get(id);
      if (!active) return;
      tabs.forEach((tab) => {
        tab.classList.toggle('is-active', tab === active);
        if (tab.tagName === 'A') {
          if (tab === active) tab.setAttribute('aria-current', 'location');
          else tab.removeAttribute('aria-current');
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ---------- Carousels ---------- */
  function pauseAutoplayOnFocus(swiper, el) {
    if (!swiper || !swiper.autoplay) return;
    el.addEventListener('focusin', () => swiper.autoplay.stop());
    el.addEventListener('focusout', (event) => {
      if (!el.contains(event.relatedTarget) && swiper.params.autoplay) swiper.autoplay.start();
    });
  }

  function initSliders() {
    if (!hasSwiper) {
      root.classList.add('no-swiper');
      return;
    }

    const a11y = {
      enabled: true,
      prevSlideMessage: 'Previous slide',
      nextSlideMessage: 'Next slide',
      paginationBulletMessage: 'Go to slide {{index}}',
    };

    const logosEl = $('[data-logos-swiper]');
    if (logosEl) {
      // Loop needs at least 2× the visible slides; clone the set until there are enough.
      const wrapper = $('.swiper-wrapper', logosEl);
      const originals = Array.from(wrapper.children);
      while (originals.length && wrapper.children.length < 10) {
        originals.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.querySelectorAll('img').forEach((img) => {
            if (img.complete && img.naturalWidth === 0) img.classList.add('is-missing');
            img.addEventListener('error', () => img.classList.add('is-missing'));
            img.addEventListener('load', () => img.classList.remove('is-missing'));
          });
          wrapper.appendChild(clone);
        });
      }
      const logosSwiper = new window.Swiper(logosEl, {
        slidesPerView: 2.2,
        spaceBetween: 12,
        loop: true,
        speed: 800,
        grabCursor: true,
        autoplay: prefersReducedMotion ? false : {
          delay: 2500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        a11y: { enabled: true, slideRole: 'listitem' },
        breakpoints: {
          576: { slidesPerView: 3, spaceBetween: 16 },
          768: { slidesPerView: 4, spaceBetween: 16 },
          992: { slidesPerView: 5, spaceBetween: 16 },
        },
      });
      pauseAutoplayOnFocus(logosSwiper, logosEl);
    }

    const pressEl = $('[data-press-swiper]');
    if (pressEl) {
      const pressSwiper = new window.Swiper(pressEl, {
        slidesPerView: 1.2,
        spaceBetween: 16,
        speed: 700,
        grabCursor: true,
        watchOverflow: true,
        keyboard: { enabled: true, onlyInViewport: true },
        pagination: { el: '.press-pagination', clickable: true },
        autoplay: prefersReducedMotion ? false : {
          delay: 4500,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        },
        a11y,
        breakpoints: {
          576: { slidesPerView: 2.2, spaceBetween: 20 },
          992: { slidesPerView: 4, spaceBetween: 24, allowTouchMove: false },
        },
      });
      pauseAutoplayOnFocus(pressSwiper, pressEl);
    }
  }

  /* ---------- Waitlist signup (client-side; wire to your ESP endpoint) ---------- */
  function initNewsletter() {
    const form = $('[data-newsletter]');
    if (!form) return;

    const name = form.elements.name;
    const email = form.elements.email;
    const phone = form.elements.phone;
    const consent = form.elements.consent;
    const msg = $('.signup-form__msg', form);
    if (!name || !email || !consent || !msg) return;

    const setMessage = (text, isError) => {
      msg.textContent = text;
      msg.classList.toggle('is-error', isError);
    };
    const markInvalid = (field, invalid) => {
      if (field.type === 'checkbox') field.closest('label').classList.toggle('is-invalid', invalid);
      else field.setAttribute('aria-invalid', String(invalid));
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const checks = [
        [name, name.value.trim() !== '', 'Please enter your name.'],
        [email, email.value.trim() !== '' && email.checkValidity(), 'Please enter a valid email address.'],
        [phone, !phone || phone.value.trim() === '' || phone.checkValidity(), 'Please enter a valid phone number.'],
        [consent, consent.checked, 'Please agree to receive updates.'],
      ];
      checks.forEach(([field, ok]) => field && markInvalid(field, !ok));
      const failed = checks.find(([, ok]) => !ok);
      if (failed) {
        setMessage(failed[2], true);
        failed[0].focus();
        return;
      }
      // TODO: POST name / email / phone to the waitlist provider (Mailchimp / ConvertKit / etc.)
      setMessage('Thank you — you’re on the waitlist.', false);
      form.reset();
    });

    form.addEventListener('input', (event) => {
      const field = event.target;
      if (field.getAttribute('aria-invalid') === 'true' || field.closest('.is-invalid')) {
        markInvalid(field, false);
        if (msg.classList.contains('is-error')) setMessage('', false);
      }
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    const el = $('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- GSAP animations ---------- */
  function initHeroAnimation(gsap) {
    const title = $('[data-split]');
    const fades = $$('[data-hero-fade]');
    const media = $('[data-hero-media]');
    const img = media ? $('img', media) : null;

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });

    if (media) {
      tl.fromTo(media,
        { clipPath: 'inset(0% 0% 0% 100%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0);
    }
    if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2.2, ease: 'power3.out' }, 0.1);

    if (title) {
      if (hasSplitText) {
        gsap.set(title, { opacity: 1 });
        const split = window.SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'split-line-inner' });
        tl.from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0.35);
      } else {
        tl.fromTo(title, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2 }, 0.35);
      }
    }

    if (fades.length) {
      tl.fromTo(fades, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, 0.8);
    }

    // Subtle background drift on scroll
    if (img && media) {
      gsap.to(img, {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }

  function initRevealAnimations(gsap, ScrollTrigger) {
    const reveal = (selector, stagger) => {
      const els = $$(selector);
      if (!els.length) return;
      gsap.set(els, { opacity: 0, y: 32 });
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, {
          opacity: 1, y: 0, duration: 1, stagger, ease: 'power3.out', overwrite: true,
        }),
      });
    };

    reveal('[data-reveal]', 0.1);
    reveal('[data-reveal-stagger]', 0.12);

    // Image mask reveals
    $$('[data-clip]').forEach((el) => {
      const img = $('img', el);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        defaults: { ease: 'expo.out' },
      });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4 });
      if (img) tl.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.8 }, 0);
    });

    // Experience & press cards slide in
    ['.exp-card', '.press-card'].forEach((sel) => {
      const cards = $$(sel);
      if (!cards.length) return;
      gsap.from(cards, {
        opacity: 0,
        x: 40,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: cards[0].closest('.swiper') || cards[0], start: 'top 85%', once: true },
      });
    });

    // Stat counter
    $$('[data-count]').forEach((el) => {
      const end = parseInt(el.dataset.count, 10);
      if (Number.isNaN(end)) return;
      const counter = { value: 0 };
      gsap.to(counter, {
        value: end,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = String(Math.round(counter.value)); },
      });
    });
  }

  function initParallax(gsap) {
    const mm = gsap.matchMedia();
    // Parallax only on larger screens — keeps mobile light
    mm.add('(min-width: 992px)', () => {
      $$('[data-parallax]').forEach((img) => {
        const wrap = img.parentElement;
        if (!wrap) return;
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });
  }

  function initAnimations() {
    if (!hasGSAP || !hasScrollTrigger || prefersReducedMotion) {
      root.classList.add('anim-off');
      return;
    }

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    if (hasSplitText) gsap.registerPlugin(window.SplitText);

    root.classList.add('anim-on');

    initHeroAnimation(gsap);
    initRevealAnimations(gsap, ScrollTrigger);
    initParallax(gsap);

    // Recalculate once web fonts change line lengths
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  /* ---------- Video popup (Magnific Popup, YouTube) ---------- */
  function initVideoPopups() {
    const $j = window.jQuery;
    if (!$j || !$j.fn.magnificPopup) return; // links fall back to opening YouTube
    $j('.js-video-popup').magnificPopup({
      type: 'iframe',
      mainClass: 'mfp-fade mfp-video',
      removalDelay: 300,
      preloader: false,
      fixedContentPos: true,
      iframe: {
        patterns: {
          youtube: {
            index: 'youtube.com/',
            id: (url) => {
              const m = url.match(/[?&]v=([^&]+)/);
              return m ? m[1] : null;
            },
            src: 'https://www.youtube.com/embed/%id%?autoplay=1&rel=0',
          },
        },
      },
      callbacks: {
        open() { if (lenis) lenis.stop(); },
        close() { if (lenis) lenis.start(); },
      },
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    initImageFallbacks();
    initYear();
    initSmoothScroll();
    initAnimations();
    initAnchors();
    initHeader();
    initDropdowns();
    initMobileMenu();
    initSliders();
    initNewsletter();
    initVideoPopups();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
