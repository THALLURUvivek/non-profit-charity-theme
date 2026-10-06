/* ==========================================================================
   Hearth Foundation — main.js
   GSAP-driven motion system + UI behaviour
   --------------------------------------------------------------------------
   00 helpers          05 reveal system
   01 preloader        06 counters / progress visuals
   02 custom cursor    07 page modules
   03 header + nav     08 forms
   04 hero + marquee   09 lifecycle
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- 00 */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const hasGSAP = typeof window.gsap !== 'undefined';

  /* whole dollars unless there are real cents to show, so 2.9% + 30¢ reads honestly */
  const money = v => {
    const n = Math.round(Number(v) * 100) / 100;
    return '$' + (n % 1 === 0 ? n.toLocaleString('en-US') : n.toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }));
  };

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH   = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* Register plugins once */
  if (hasGSAP) {
    gsap.config({ nullTargetWarn: false, force3D: true });
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
  }

  const EASE = 'power3.out';
  const EASE_SOFT = 'power2.out';

  /* Elements start hidden only when JS+GSAP are alive and motion allowed */
  function prepHidden() {
    if (!hasGSAP || REDUCED) return;
    $$('[data-anim="up"]').forEach(el => gsap.set(el, { y: 46, opacity: 0 }));
    $$('[data-anim="fade"]').forEach(el => gsap.set(el, { opacity: 0 }));
    $$('[data-anim="left"]').forEach(el => gsap.set(el, { x: -46, opacity: 0 }));
    $$('[data-anim="right"]').forEach(el => gsap.set(el, { x: 46, opacity: 0 }));
    $$('[data-anim="scale"]').forEach(el => gsap.set(el, { scale: .9, opacity: 0 }));
    $$('[data-anim="clip"]').forEach(el => gsap.set(el, { clipPath: 'inset(0 0 100% 0)' }));
    $$('[data-stagger]').forEach(el => {
      gsap.set(el.querySelectorAll('[data-stagger-item]'), { y: 34, opacity: 0 });
    });
  }

  /* ---------------------------------------------------------------- 01 */
  function initPreloader() {
    const pre = $('[data-preloader]');
    if (!pre) return Promise.resolve();

    if (REDUCED || !hasGSAP) { pre.remove(); return Promise.resolve(); }

    document.body.classList.add('is-locked');

    return new Promise(resolve => {
      const bar  = $('.preloader__bar span', pre);
      const num  = $('[data-preload-num]', pre);
      const pcts = $('[data-preload-pct]', pre);
      const obj  = { v: 0 };
      const done = () => {
        document.body.classList.remove('is-locked');
        resolve();
      };

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(pre, {
            yPercent: -101, duration: .95, ease: 'power4.inOut',
            onComplete: () => { pre.remove(); done(); }
          });
        }
      });

      tl.to(obj, {
        v: 100, duration: 1.15, ease: 'power2.inOut',
        onUpdate: () => {
          const v = Math.round(obj.v);
          if (num) num.textContent = String(v).padStart(3, '0');
          if (pcts) pcts.textContent = v + '%';
          if (bar) gsap.set(bar, { scaleX: obj.v / 100 });
        }
      })
      .from('.preloader__mark', { scale: .5, opacity: 0, duration: .6, ease: 'back.out(1.7)' }, 0)
      .from('.preloader__name', { y: 18, opacity: 0, duration: .5, ease: EASE }, .1)
      .from('.preloader__bar', { scaleX: 0, duration: .6, ease: EASE }, .15)
      .from('.preloader__pct', { y: 12, opacity: 0, duration: .45, ease: EASE }, .28)
      .to('.preloader__mark', { y: -14, duration: .3, ease: 'power2.in' }, .82)
      .to('.preloader__inner > *:not(.preloader__mark)', { y: -10, opacity: 0, duration: .35, ease: 'power2.in' }, .85);
    });
  }

  /* ---------------------------------------------------------------- 02 */
  function initCursor() {
    if (REDUCED || TOUCH || !hasGSAP) return;

    const dot  = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (!dot || !ring) return;

    document.documentElement.classList.add('has-custom-cursor');
    gsap.set([dot, ring], { autoAlpha: 0 });

    const dx = gsap.quickTo(dot, 'x', { duration: .16, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: .16, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });

    let visible = false;
    window.addEventListener('mousemove', e => {
      dx(e.clientX); dy(e.clientY);
      rx(e.clientX); ry(e.clientY);
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: .3 });
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => { visible = false; gsap.to([dot, ring], { autoAlpha: 0, duration: .25 }); });
    document.addEventListener('mouseenter', () => { if (visible) gsap.to([dot, ring], { autoAlpha: 1, duration: .25 }); });

    const HOVER = 'a, button, [role="button"], input, textarea, select, .card-shell, .value-card, .cause-card, .step, .mini-card, .team-card, .chip';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(HOVER)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(HOVER)) ring.classList.remove('is-hover');
    });
    document.addEventListener('mousedown', () => ring.classList.add('is-active'));
    document.addEventListener('mouseup',   () => ring.classList.remove('is-active'));

    /* Magnetic buttons */
    if (hasGSAP && !TOUCH) {
      $$('[data-magnetic]').forEach(el => {
        const strength = parseFloat(el.dataset.magnetic) || .32;
        const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
        const yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
        el.addEventListener('mousemove', e => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * strength);
          yTo((e.clientY - (r.top + r.height / 2)) * strength);
        });
        el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
      });
    }
  }

  /* ---------------------------------------------------------------- 03 */
  function initHeader() {
    const header = $('[data-header]');
    const bar    = $('[data-scroll-progress]');
    const topBtn = $('[data-to-top]');
    if (!header) return;

    const headerH = () => header.offsetHeight;
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;

      /* stuck state */
      header.classList.toggle('is-stuck', y > 24);

      /* progress bar */
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? clamp(y / max, 0, 1) : 0;
        if (hasGSAP) gsap.set(bar, { scaleX: p, opacity: p > 0.002 ? 1 : 0 });
        else bar.style.transform = 'scaleX(' + p + ')';
      }

      /* back to top */
      if (topBtn) topBtn.classList.toggle('is-visible', y > window.innerHeight * .7);

      /* auto-hide (never on inner pages while menu is open) */
      const menuOpen = document.body.classList.contains('menu-open');
      if (!menuOpen && y > headerH() * 2.2 && !header.classList.contains('is-stuck-forced')) {
        if (y > lastY + 4)      header.classList.add('is-hidden');
        else if (y < lastY - 4) header.classList.remove('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobile drawer */
    const toggle = $('[data-nav-toggle]');
    const drawer = $('[data-nav-drawer]');
    if (toggle && drawer && window.bootstrap) {
      const bs = bootstrap.Offcanvas.getOrCreateInstance(drawer);
      toggle.addEventListener('click', () => {
        document.body.classList.add('menu-open');
        header.classList.remove('is-hidden');
        if (!REDUCED && hasGSAP) {
          const links = $$('.mobile-nav__links a', drawer);
          gsap.fromTo(links,
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: .55, stagger: .06, ease: EASE, delay: .12 });
          gsap.fromTo('.mobile-nav__foot', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: EASE, delay: .42 });
        }
      });
      drawer.addEventListener('hidden.bs.offcanvas', () => {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
      $$('a', drawer).forEach(a => a.addEventListener('click', () => bs.hide()));
    }

    /* Back to top */
    if (topBtn) {
      topBtn.addEventListener('click', () => {
        if (hasGSAP && window.ScrollToPlugin) {
          gsap.to(window, { duration: 1.1, ease: 'power3.inOut', scrollTo: { y: 0, autoKill: true } });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    /* Smooth in-page anchors (nav stays fixed, so offset via CSS scroll-padding) */
    if (hasGSAP && window.ScrollToPlugin && !REDUCED) {
      $$('a[href^="#"]').forEach(a => {
        const id = a.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;
        a.addEventListener('click', e => {
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          gsap.to(window, {
            duration: 1.05, ease: 'power3.inOut',
            scrollTo: { y: target, offsetY: headerH() + 12, autoKill: true }
          });
        });
      });
    }
  }

  /* ---------------------------------------------------------------- 04 */
  function initHero() {
    const hero = $('[data-hero]');
    if (!hero || !hasGSAP || REDUCED) return;

    /* split the headline into masked words so it can rise into view */
    const title = $('[data-hero-title]');
    if (title && !title.dataset.splitHero) {
      splitText(title);
      title.dataset.splitHero = '1';
    }

    const tl = gsap.timeline({ defaults: { ease: EASE }, delay: .05 });

    tl.from('[data-hero-badge]', { y: 24, opacity: 0, duration: .7 })
      .fromTo('[data-hero-title] .word-inner', { yPercent: 118 }, { yPercent: 0, duration: 1.05, stagger: .07, ease: 'power4.out' }, '-=.35')
      .from('[data-hero-lead]', { y: 26, opacity: 0, duration: .8 }, '-=.65')
      .from('[data-hero-actions] > *', { y: 22, opacity: 0, duration: .6, stagger: .1 }, '-=.5')
      .from('[data-hero-trust]', { y: 18, opacity: 0, duration: .6 }, '-=.4')
      .from('[data-hero-frame]', { scale: 1.14, opacity: 0, duration: 1.25, ease: 'power3.out' }, '-=1.3')
      .from('[data-hero-card]', { scale: .7, opacity: 0, duration: .8, stagger: .12, ease: 'back.out(1.5)' }, '-=.75')
      .from('[data-hero-ring]', { scale: 0, rotate: -90, duration: .9, ease: 'back.out(1.7)' }, '-=.6')
      .from('[data-hero-scroll]', { opacity: 0, y: -10, duration: .5 }, '-=.4');

    /* Ambient parallax */
    const soft = matchMedia('(min-width: 992px) and (prefers-reduced-motion: no-preference)').matches;
    if (soft) {
      gsap.to('[data-hero-frame]', {
        yPercent: 9, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 }
      });
      gsap.to('[data-hero-content]', {
        yPercent: -6, opacity: .35, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 }
      });
      $$('.hero__orb').forEach((orb, i) => {
        gsap.to(orb, {
          x: (i % 2 ? -1 : 1) * (70 + i * 30),
          y: (i % 2 ? 1 : -1) * (50 + i * 24),
          duration: 11 + i * 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
        });
      });
      gsap.to('[data-hero-card="stat"]', {
        y: -16, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 }
      });
      gsap.to('[data-hero-card="prog"]', {
        y: 14, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }
  }

  function initMarquee() {
    if (!hasGSAP || REDUCED) return;
    $$('[data-marquee]').forEach(track => {
      const wrap = track.closest('.marquee');
      const speed = parseFloat(track.dataset.marquee) || 60;
      const groups = $$('.marquee__group', track);
      if (groups.length < 2) return;

      const tl = gsap.timeline({ repeat: -1 });
      tl.to(groups, { xPercent: -100, duration: groups[0].offsetWidth / speed, ease: 'none' });

      if (wrap) {
        wrap.addEventListener('mouseenter', () => gsap.to(tl, { timeScale: .25, duration: .4 }));
        wrap.addEventListener('mouseleave', () => gsap.to(tl, { timeScale: 1, duration: .4 }));
      }
      if (window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: wrap, start: 'top bottom', end: 'bottom top',
          onToggle: self => gsap.to(tl, { timeScale: self.isActive ? 1 : 0, duration: .5 })
        });
      }
    });
  }

  /* ---------------------------------------------------------------- 05 */
  function initReveals() {
    if (!hasGSAP) return;
    if (!window.ScrollTrigger) {
      /* prepHidden() already applied inline hides — undo them so nothing
         stays blank when the ScrollTrigger build never arrives */
      $$('[data-anim]').forEach(el => gsap.set(el, { clearProps: 'opacity,transform,clipPath' }));
      $$('[data-stagger-item]').forEach(el => gsap.set(el, { clearProps: 'opacity,transform' }));
      return;
    }

    if (REDUCED) {
      $$('[data-anim], [data-stagger-item]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    /* `once` must live in the scrollTrigger config — at tween level it is
       ignored, so refresh() would re-hide sections already revealed */
    const once = { once: true };

    /* single elements */
    $$('[data-anim]').forEach(el => {
      if (el.hasAttribute('data-anim-hero')) return;
      const map = { up: 'y', left: 'x', right: 'x', scale: 'scale' };
      const kind = el.dataset.anim;
      if (kind === 'clip') {
        gsap.to(el, {
          clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 88%', ...once }
        });
        return;
      }
      const props = { opacity: 1, duration: .95, ease: EASE };
      if (map[kind]) props[map[kind]] = 0;
      if (kind === 'scale') props.scale = 1;
      gsap.to(el, { ...props, scrollTrigger: { trigger: el, start: 'top 90%', ...once } });
    });

    /* staggered groups */
    $$('[data-stagger]').forEach(group => {
      const items = group.querySelectorAll('[data-stagger-item]');
      if (!items.length) return;
      gsap.to(items, {
        y: 0, opacity: 1, duration: .85, ease: EASE, stagger: .09,
        scrollTrigger: { trigger: group, start: 'top 86%', ...once }
      });
    });

    /* headings: word-by-word mask reveal */
    $$('[data-split]').forEach(el => {
      if (el.dataset.splitDone) return;
      splitText(el);
      const lines = el.querySelectorAll('.word-inner');
      if (!lines.length) return;
      el.dataset.splitDone = '1';
      gsap.to(lines, {
        yPercent: 0, duration: .95, ease: 'power4.out', stagger: .055,
        scrollTrigger: { trigger: el, start: 'top 90%', ...once }
      });
    });

    /* image parallax */
    if (!TOUCH) {
      $$('[data-parallax]').forEach(img => {
        const strength = parseFloat(img.dataset.parallax) || 8;
        gsap.fromTo(img, { yPercent: -strength }, {
          yPercent: strength, ease: 'none',
          scrollTrigger: { trigger: img.closest('.media-stack, .card-shell__media, [data-parallax-wrap]') || img, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }

    /* card 3D tilt */
    if (!TOUCH && !REDUCED) {
      $$('[data-tilt]').forEach(el => {
        const max = parseFloat(el.dataset.tilt) || 7;
        el.style.transformStyle = 'preserve-3d';
        el.addEventListener('mousemove', e => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - .5;
          const py = (e.clientY - r.top) / r.height - .5;
          gsap.to(el, { rotateY: px * max, rotateX: -py * max, duration: .6, ease: 'power2.out', transformPerspective: 900 });
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { rotateX: 0, rotateY: 0, duration: .9, ease: 'elastic.out(1, .6)' });
        });
      });
    }

    ScrollTrigger.refresh();
  }

  /* Split text into masked words (keeps inline elements like <em>) */
  function splitText(el) {
    const walk = node => {
      if (node.nodeType === 3) {
        const parts = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const outer = document.createElement('span');
          outer.className = 'word';
          const inner = document.createElement('span');
          inner.className = 'word-inner';
          inner.textContent = p;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        node.parentNode.replaceChild(frag, node);
        return;
      }
      if (node.nodeType === 1 && !node.classList.contains('word')) {
        Array.prototype.slice.call(node.childNodes).forEach(walk);
      }
    };
    Array.prototype.slice.call(el.childNodes).forEach(walk);
    const inners = el.querySelectorAll('.word-inner');
    if (inners.length && hasGSAP && !REDUCED) gsap.set(inners, { yPercent: 118 });
  }

  /* ---------------------------------------------------------------- 06 */
  function initCounters() {
    $$('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      if (isNaN(target)) return;

      if (!hasGSAP || REDUCED || !window.ScrollTrigger) { el.textContent = target.toFixed(decimals); return; }

      const obj = { v: 0 };
      const write = () => {
        const v = obj.v;
        el.textContent = v >= 1000
          ? Math.round(v).toLocaleString('en-US')
          : v.toFixed(decimals);
      };
      gsap.to(obj, {
        v: target, duration: 2.1, ease: 'power2.out', onUpdate: write,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });
  }

  function initBars() {
    const fill = els => els.forEach(el => {
      const pct = parseFloat(el.dataset.bar) || 0;
      if (!hasGSAP || REDUCED) { el.style.transform = 'scaleX(' + (pct / 100) + ')'; return; }
      gsap.to(el, {
        scaleX: pct / 100, duration: 1.5, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });
    fill($$('[data-bar]'));
  }

  function initDonut() {
    const donut = $('[data-donut]');
    if (!donut) return;
    const segs = $$('circle.seg', donut);
    const R = 100, C = 2 * Math.PI * R;
    let offset = 0;

    segs.forEach(seg => {
      const pct = parseFloat(seg.dataset.pct) || 0;
      const len = (pct / 100) * C;
      seg.style.strokeDasharray = len + ' ' + (C - len);
      seg.style.strokeDashoffset = -offset;
      seg.dataset._offset = offset;
      seg.dataset._len = len;
      offset += len;
    });

    if (!hasGSAP || REDUCED) return;

    const paint = p => segs.forEach(seg => {
      const len = parseFloat(seg.dataset._len);
      const off = parseFloat(seg.dataset._offset);
      seg.style.strokeDasharray = (len * p) + ' ' + C;
      seg.style.strokeDashoffset = -off * p;
    });

    const state = { p: 0 };
    gsap.fromTo(state, { p: 0 }, { p: 1, duration: 1.8, ease: 'power3.out',
      onUpdate: () => paint(state.p),
      scrollTrigger: { trigger: donut, start: 'top 85%', once: true } });

    /* interactive segments */
    const totalEl = $('[data-donut-total]');
    segs.forEach(seg => {
      const label = seg.dataset.label || '';
      const val = seg.dataset.pct;
      seg.style.cursor = 'pointer';
      seg.addEventListener('mouseenter', () => {
        if (totalEl && label) totalEl.textContent = val + '%';
      });
      seg.addEventListener('mouseleave', () => {
        if (totalEl) totalEl.textContent = donut.dataset.total;
      });
    });
  }

  function initRings() {
    $$('[data-ring]').forEach(ring => {
      const pct = parseFloat(ring.dataset.ring) || 0;
      const C = 251.3;
      const apply = p => ring.style.strokeDashoffset = String(C * (1 - (pct / 100) * p));
      apply(1);
      if (!hasGSAP || REDUCED) return;
      const o = { p: 0 };
      gsap.to(o, {
        p: 1, duration: 1.7, ease: 'power3.out',
        onUpdate: () => apply(o.p),
        scrollTrigger: { trigger: ring, start: 'top 90%', once: true }
      });
    });
  }

  /* ---------------------------------------------------------------- 07 */
  function initHorizontalScroll() {
    const section = $('[data-hscroll]');
    if (!section) return;

    const track  = $('.hscroll__track', section);
    const bar    = $('[data-hscroll-bar]', section);
    const prev   = $('[data-hscroll-prev]', section);
    const next   = $('[data-hscroll-next]', section);
    if (!track) return;

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
    let x = 0;

    const setBar = () => {
      if (!bar) return;
      const d = distance();
      const p = d ? (x / d) * 0.82 + 0.09 : 0.09;
      if (hasGSAP) gsap.set(bar, { scaleX: clamp(p, .09, 1) });
      else bar.style.transform = 'scaleX(' + clamp(p, .09, 1) + ')';
    };
    const setButtons = () => {
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= distance() - 2;
    };

    const move = dir => {
      x = clamp(x + dir * Math.min(window.innerWidth * .55, 520), 0, distance());
      if (hasGSAP && !REDUCED) gsap.to(track, { x: -x, duration: .9, ease: 'power3.inOut', onUpdate: setBar });
      else { track.style.transform = 'translateX(' + -x + 'px)'; setBar(); }
      setButtons();
    };

    next && next.addEventListener('click', () => move(1));
    prev && prev.addEventListener('click', () => move(-1));
    setBar(); setButtons();

    /* without GSAP the buttons above still work, via the translateX fallback in
       move() — there is simply no pinned scroll track to drive */
    if (!hasGSAP || !window.ScrollTrigger) {
      window.addEventListener('resize', () => { setBar(); setButtons(); });
      return;
    }

    const mm = gsap.matchMedia();

    /* Desktop: pinned scroll-driven track */
    mm.add('(min-width: 992px) and (prefers-reduced-motion: no-preference)', () => {
      const getMax = () => track.scrollWidth - window.innerWidth + 80;
      const tween = gsap.to(track, {
        x: () => -getMax(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => '+=' + (getMax() + window.innerHeight * .35),
          pin: true, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
          snap: { snapTo: (v) => Math.round(v * 10) / 10, duration: .25, ease: 'power1.inOut' }
        },
        onUpdate: self => {
          const pr = self && typeof self.progress === 'function' ? self.progress() : 0;
          x = Math.abs(pr * getMax());
          setBar(); setButtons();
        }
      });
      /* highlight active card */
      const cards = $$('.cause-card', track);
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: .38, scale: .94 },
          {
            opacity: 1, scale: 1, ease: 'none',
            scrollTrigger: {
              trigger: card, containerAnimation: tween,
              start: 'left 92%', end: 'left 45%', scrub: true
            }
          });
      });
      return () => { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
    });

    /* Mobile / tablet / reduced motion: transform-driven drag carousel */
    mm.add('(max-width: 991.98px), (prefers-reduced-motion: reduce)', () => {
      $$('.cause-card', track).forEach(c => { c.style.opacity = ''; c.style.transform = ''; });
      gsap.set(track, { x: 0 });

      const vp = $('.hscroll__viewport', section);
      if (!vp) return;

      let startX = 0, startOffset = 0, dragging = false, moved = 0;

      const paint = () => { if (bar) gsap.set(bar, { scaleX: clamp(.09 + (distance() ? x / distance() * .82 : 0), .09, 1) }); };

      vp.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startOffset = x;
        moved = 0;
        dragging = true;
      }, { passive: true });

      vp.addEventListener('touchmove', e => {
        if (!dragging) return;
        const dx = e.touches[0].clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        x = clamp(startOffset - dx, 0, distance());
        gsap.set(track, { x: -x });
        paint();
      }, { passive: true });

      vp.addEventListener('touchend', () => {
        if (!dragging) return;
        dragging = false;
        if (moved < 10) return;
        const cards = $$('.cause-card', track);
        const w = (cards[0] ? cards[0].getBoundingClientRect().width : 320) + 24;
        x = clamp(Math.round(x / w) * w, 0, distance());
        gsap.to(track, { x: -x, duration: .6, ease: 'power3.out', onUpdate: paint });
        setButtons();
      });

      return () => { gsap.set(track, { x: 0 }); };
    });
  }

  function initSlider() {
    $$('[data-slider]').forEach(root => {
      const track = $('[data-slider-track]', root);
      const slides = $$('[data-slide]', root);
      const dots = $$('[data-slider-dot]', root);
      const prev = $('[data-slider-prev]', root);
      const next = $('[data-slider-next]', root);
      if (!track || slides.length < 2) return;

      let index = 0;
      let autoplay = null;
      const delay = parseInt(root.dataset.slider, 10) || 7000;

      const go = i => {
        index = (i + slides.length) % slides.length;
        if (hasGSAP && !REDUCED) {
          gsap.to(track, { xPercent: -100 * index, duration: .85, ease: 'power3.inOut' });
        } else {
          track.style.transform = 'translateX(' + -100 * index + '%)';
        }
        dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
      };

      const start = () => {
        stop();
        if (REDUCED) return;
        autoplay = setInterval(() => go(index + 1), delay);
      };
      const stop = () => { if (autoplay) clearInterval(autoplay); autoplay = null; };

      dots.forEach((d, di) => d.addEventListener('click', () => { go(di); start(); }));
      prev && prev.addEventListener('click', () => { go(index - 1); start(); });
      next && next.addEventListener('click', () => { go(index + 1); start(); });
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      root.addEventListener('focusin', stop);
      root.addEventListener('focusout', start);

      /* swipe */
      let sx = 0;
      root.addEventListener('touchstart', e => { sx = e.touches[0].clientX; stop(); }, { passive: true });
      root.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        start();
      });

      document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

      go(0);
      start();
    });
  }

  function initAccordion() {
    $$('[data-accordion]').forEach(root => {
      const single = root.dataset.accordion === 'single';
      const items = $$('.acc-item', root);
      items.forEach(item => {
        const trigger = $('.acc-trigger', item);
        const panel = $('.acc-panel', item);
        if (!trigger || !panel) return;
        trigger.setAttribute('aria-expanded', 'false');
        let open = false;

        const setOpen = state => {
          if (open === state) return;
          open = state;
          item.classList.toggle('is-open', open);
          trigger.setAttribute('aria-expanded', String(open));
          if (hasGSAP && !REDUCED) {
            gsap.to(panel, {
              height: open ? 'auto' : 0, duration: open ? .55 : .4,
              ease: open ? 'power3.out' : 'power2.inOut'
            });
          } else {
            panel.style.height = open ? 'auto' : '0px';
          }
        };

        trigger.addEventListener('click', () => {
          if (single && !open) {
            items.forEach(other => {
              if (other === item) return;
              const t = $('.acc-trigger', other), p = $('.acc-panel', other);
              if (other.classList.contains('is-open')) {
                other.classList.remove('is-open');
                t && t.setAttribute('aria-expanded', 'false');
                if (hasGSAP && !REDUCED) gsap.to(p, { height: 0, duration: .38, ease: 'power2.inOut' });
                else if (p) p.style.height = '0px';
              }
            });
          }
          setOpen(!open);
        });
      });
    });
  }

  function initFilters() {
    $$('[data-filter-group]').forEach(group => {
      const targetSel = group.dataset.filterGroup;
      const buttons = $$('[data-filter]', group);
      const targets = $$(targetSel);
      if (!buttons.length || !targets.length) return;

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const f = btn.dataset.filter;
          buttons.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');

          const shown = [];
          targets.forEach(t => {
            const match = f === 'all' || (t.dataset.category || '').split(' ').indexOf(f) > -1;
            t.classList.toggle('is-hidden', !match);
            if (match) shown.push(t);
          });

          if (hasGSAP && !REDUCED) {
            gsap.fromTo(shown,
              { opacity: 0, y: 26, scale: .97 },
              { opacity: 1, y: 0, scale: 1, duration: .6, stagger: .06, ease: EASE, overwrite: true });
          }
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
      });
    });
  }

  function initScrollAnimations() {
    if (!hasGSAP || !window.ScrollTrigger || REDUCED) return;

    /* pinned quote */
    const pinQuote = $('[data-pin-quote]');
    if (pinQuote && window.innerWidth > 991) {
      gsap.to('.pin-quote__inner', {
        yPercent: -28, ease: 'none',
        scrollTrigger: { trigger: pinQuote, start: 'top bottom', end: 'bottom top', scrub: .8 }
      });
    }
  }

  /* ---------------------------------------------------------------- 07b */
  /* toasts — one live region reused by every module below               */

  /* A single region is announced once; we only ever rewrite its contents, so
     screen readers get one message rather than a stream of competing ones. */
  function ensureToastHost() {
    let host = $('[data-toast-host]');
    if (host) return host;
    host = document.createElement('div');
    host.className = 'toast-host';
    host.setAttribute('data-toast-host', '');
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
    return host;
  }

  /* Titles and bodies here are all first-party literals from the markup, so
     the template below is safe. Anything user-derived must go through textContent. */
  function toast(icon, title, body) {
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<i class="bi ' + icon + '"></i>' +
      '<span><b>' + title + '</b>' + body + '</span>';
    host.appendChild(el);

    const kill = () => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 400);
    };
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(kill, 4200);
    el.addEventListener('click', kill);
    return el;
  }

  /* Copy helper with a fallback, because navigator.clipboard is absent on
     insecure origins — which includes file:// and plain http:// previews. */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
        .then(() => true)
        .catch(() => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  const shareTarget = () => location.href;

  /* ---------------------------------------------------------------- 07c */
  /* social + placeholder links                                         */
  /* Every footer social icon ships as href="#". Social profiles are not
     published yet, so both the markup and this wiring send each icon to
     the error page; the envelope keeps its newsletter destination.      */

  const ERROR_PAGE = '404.html';

  const SOCIAL = {
    'twitter-x': { href: ERROR_PAGE },
    instagram: { href: ERROR_PAGE },
    linkedin: { href: ERROR_PAGE },
    youtube: { href: ERROR_PAGE }
  };

  /* Resolve an icon to its network key from the bootstrap icon class. */
  const networkOf = a => {
    const icon = a.querySelector('i.bi');
    if (!icon) return null;
    const cls = icon.className;
    return Object.keys(SOCIAL).find(k => cls.indexOf('bi-' + k) > -1) || null;
  };

  function initSocial() {
    $$('.social-row a').forEach(a => {
      const net = networkOf(a);
      if (!net) {
        /* the envelope icon is a newsletter shortcut, not a profile link */
        a.setAttribute('href', 'index.html#newsletter');
        return;
      }
      /* no profile pages yet — every social icon lands on the error page */
      const s = SOCIAL[net];
      a.setAttribute('href', s.href);
      a.removeAttribute('target');
      a.removeAttribute('rel');
      a.dataset.socialNet = net;
    });
  }

  /* Links that have no page behind them yet. Two behaviours:
     - share affordances (share this page) get a working share intent
     - everything else says plainly that it is not built yet            */
  function initPlaceholderLinks() {
    /* Buttons marked data-soon are deliberately not links: Privacy, Terms
       and friends have no page yet, so they get an honest toast instead of
       a dead href that crawlers and no-JS visitors both trip over. */
    $$('[data-soon]').forEach(btn => {
      btn.addEventListener('click', () => {
        toast('bi-info-circle-fill', btn.dataset.soon + ' is not up yet',
          'That document is still being written. Try the <a href="contact.html">contact form</a> if you need it sooner.');
      });
    });

    /* social rows are handled above and already carry real hrefs */
    $$('a[href="#"]').forEach(a => {
      if (a.closest('.social-row')) return;

      /* icon-only links carry their name in aria-label, not in text */
      const text = (a.textContent || '').trim() || (a.getAttribute('aria-label') || '').trim();
      if (!text) return;

      if (/^share( this page)?$/i.test(text)) {
        a.setAttribute('role', 'button');
        a.addEventListener('click', e => {
          e.preventDefault();
          openShare(shareTarget(), document.title);
        });
        return;
      }

      /* Team cards ship "Email <name>" icons. Those we can actually wire. */
      const mail = text.match(/^email\s+(.+)$/i);
      if (mail) {
        const who = mail[1].trim();
        const slug = who.toLowerCase().replace(/[^a-z0-9]+/g, '.');
        a.setAttribute('href', 'mailto:' + slug + '@hearthfoundation.org');
        a.setAttribute('aria-label', 'Email ' + who);
        return;
      }

      const li = text.match(/^(.+?)\s+on LinkedIn$/i);
      if (li) {
        a.setAttribute('href', 'https://linkedin.com/in/' + li[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        a.setAttribute('aria-label', li[1].trim() + ' on LinkedIn (opens in a new tab)');
        return;
      }

      a.setAttribute('role', 'button');
      a.addEventListener('click', e => {
        e.preventDefault();
        toast('bi-info-circle-fill', text + ' is not up yet',
          'This page is still being written. Try the <a href="contact.html">contact form</a> if you need it sooner.');
      });
    });
  }

  /* ---------------------------------------------------------------- 07d */
  /* share sheet — a real dialog, no library                              */

  let sharePop = null;

  function buildShare() {
    if (sharePop) return sharePop;
    sharePop = document.createElement('div');
    sharePop.className = 'share-pop';
    sharePop.setAttribute('data-share-pop', '');
    sharePop.setAttribute('role', 'dialog');
    sharePop.setAttribute('aria-modal', 'false');
    sharePop.setAttribute('aria-label', 'Share this page');
    sharePop.hidden = true;
    sharePop.innerHTML =
      '<p class="share-pop__title">Share this page</p>' +
      '<div class="share-pop__row">' +
        '<a class="share-pop__btn" data-net="twitter-x" target="_blank" rel="noopener noreferrer" aria-label="Share on X"><i class="bi bi-twitter-x"></i><span>X</span></a>' +
        '<a class="share-pop__btn" data-net="linkedin" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><i class="bi bi-linkedin"></i><span>LinkedIn</span></a>' +
        '<a class="share-pop__btn" data-net="facebook" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><i class="bi bi-facebook"></i><span>Facebook</span></a>' +
        '<button class="share-pop__btn" type="button" data-net="native" aria-label="Share using your device"><i class="bi bi-share"></i><span>More</span></button>' +
      '</div>' +
      '<button class="share-pop__copy" type="button" data-share-copy>' +
        '<i class="bi bi-link-45deg"></i><span>Copy link</span>' +
      '</button>' +
      '<button class="share-pop__close" type="button" data-share-close aria-label="Close share dialog"><i class="bi bi-x-lg"></i></button>';
    document.body.appendChild(sharePop);

    const close = () => closeShare();
    $('[data-share-close]', sharePop).addEventListener('click', close);

    /* focus trap: keep Tab inside the dialog while it is open */
    sharePop.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const items = $$('a[href], button:not([disabled])', sharePop);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    $('[data-share-copy]', sharePop).addEventListener('click', () => {
      copyText(sharePop.dataset.url || location.href).then(ok => {
        toast(ok ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill',
          ok ? 'Link copied' : 'Could not copy',
          ok ? 'It is on your clipboard — paste it anywhere.'
             : 'Your browser blocked clipboard access. Copy the address bar instead.');
      });
    });

    /* Each network link gets its href up front so it is focusable and
       announced as a link even before the dialog is opened; openShare
       refreshes them against the current url. */
    syncShareHrefs();

    $$('[data-net]', sharePop).forEach(btn => {
      btn.addEventListener('click', () => {
        const net = btn.dataset.net;
        if (net !== 'native') return;
        const url = sharePop.dataset.url || location.href;
        if (navigator.share) {
          navigator.share({ title: sharePop.dataset.title || document.title, url: url }).catch(() => {});
        } else {
          copyText(url).then(ok => toast(ok ? 'bi-check-circle-fill' : 'bi-info-circle-fill',
            ok ? 'Link copied' : 'Sharing unavailable',
            ok ? 'Your device has no share sheet, so we copied it instead.'
               : 'Your browser blocked clipboard access.'));
        }
      });
    });

    /* any click outside dismisses */
    document.addEventListener('click', e => {
      if (sharePop.hidden) return;
      if (sharePop.contains(e.target)) return;
      if (e.target.closest('[data-share-open], [data-share-trigger]')) return;
      close();
    });

    return sharePop;
  }

  function syncShareHrefs() {
    if (!sharePop) return;
    const url = sharePop.dataset.url || location.href;
    const title = sharePop.dataset.title || document.title;
    $$('[data-net]', sharePop).forEach(btn => {
      if (btn.dataset.net === 'native') return;
      btn.setAttribute('href', shareUrl(btn.dataset.net, url, title));
    });
  }

  function shareUrl(net, url, title) {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    if (net === 'twitter-x') return 'https://x.com/intent/post?url=' + u + '&text=' + t;
    if (net === 'linkedin')   return 'https://www.linkedin.com/sharing/share-offsite/?url=' + u;
    if (net === 'facebook')   return 'https://www.facebook.com/sharer/sharer.php?u=' + u;
    return url;
  }

  let lastFocus = null;

  function openShare(url, title) {
    const pop = buildShare();
    lastFocus = document.activeElement;
    pop.dataset.url = url;
    pop.dataset.title = title;
    pop.hidden = false;
    syncShareHrefs();
    /* position under whichever trigger opened it */
    const anchor = document.activeElement;
    if (anchor && anchor.getBoundingClientRect) {
      const r = anchor.getBoundingClientRect();
      const w = 268;
      const left = clamp(r.left + r.width / 2 - w / 2, 12, window.innerWidth - w - 12);
      pop.style.left = left + 'px';
      /* prefer below, flip above when there is no room */
      const below = window.innerHeight - r.bottom;
      pop.classList.toggle('is-up', below < 260);
      pop.style.top = (below < 260 ? r.top - 10 : r.bottom + 10) + 'px';
    }
    const first = $('[data-net]', pop);
    if (first) first.focus();
    if (hasGSAP && !REDUCED) {
      gsap.fromTo(pop, { opacity: 0, y: pop.classList.contains('is-up') ? 8 : -8, scale: .96 },
        { opacity: 1, y: 0, scale: 1, duration: .28, ease: EASE_SOFT });
    }
  }

  function closeShare() {
    if (!sharePop || sharePop.hidden) return;
    sharePop.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* any explicit trigger, on any page */
  function initShareTriggers() {
    $$('[data-share-open], [data-share-trigger]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const url = btn.dataset.shareUrl || shareTarget();
        const title = btn.dataset.shareTitle || document.title;
        if (sharePop && !sharePop.hidden && sharePop.dataset.url === url) closeShare();
        else openShare(url, title);
      });
    });
  }

  /* ---------------------------------------------------------------- 07e */
  /* the 404 page: capture the dead URL, offer it back                   */

  function initErrorPage() {
    const page = $('[data-err-page]');
    if (!page) return;

    /* Show what was actually requested. A 404 that cannot tell you which
       link broke is half a 404. Read it off location.pathname, and fall
       back to the referrer on hosts that rewrite unknown paths to /404. */
    const el = $('[data-err-url]', page);
    if (el) {
      let bad = '';
      if (location.protocol === 'file:') {
        bad = location.pathname.split(/[\\/]/).pop() || '';
      } else {
        const p = location.pathname.replace(/^\/+/, '');
        bad = p && p.toLowerCase() !== '404.html' ? p : '';
        if (!bad && document.referrer) {
          try { bad = new URL(document.referrer).pathname.replace(/^\/+/, ''); } catch (e) {}
        }
      }
      el.textContent = bad ? '/' + bad : 'an unknown path';
    }

    /* Copy-the-broken-link, so reporting it takes one click */
    $$('[data-err-copy]', page).forEach(btn => {
      btn.addEventListener('click', () => {
        copyText(location.href).then(ok => {
          toast(ok ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill',
            ok ? 'Link copied' : 'Could not copy',
            ok ? 'Paste it into the form below and we will fix it.'
               : 'Your browser blocked clipboard access.');
        });
      });
    });

    /* The report mailto carries the bad path so the inbox has it already */
    const report = $('[data-err-report]', page);
    if (report) {
      const bad = (el && el.textContent) || 'an unknown path';
      report.setAttribute('href', 'mailto:press@hearthfoundation.org' +
        '?subject=' + encodeURIComponent('Broken link: ' + bad) +
        '&body=' + encodeURIComponent('This link does not resolve:\n\n' + location.href + '\n\nI reached it from: '));
    }

    /* Filter the site map, because eight links is not many but it is enough */
    const search = $('[data-err-search]', page);
    const list = $('[data-err-list]', page);
    if (search && list) {
      const items = $$('li', list);
      const empty = $('[data-err-empty]', page);
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        let hits = 0;
        items.forEach(li => {
          const label = (li.textContent || '').toLowerCase();
          const href = (li.querySelector('a') || {}).getAttribute ? (li.querySelector('a').getAttribute('href') || '').toLowerCase() : '';
          const match = !q || label.indexOf(q) > -1 || href.indexOf(q) > -1;
          li.hidden = !match;
          if (match) hits++;
        });
        if (empty) empty.hidden = hits !== 0;
      });
    }
  }

  /* ---------------------------------------------------------------- 08 */
  function initDonation() {
    const form = $('[data-donate-form]');
    if (!form) return;

    const amountInput = $('[data-amount]', form);
    const customWrap = $('[data-custom-wrap]', form);
    const customInput = $('[data-custom-amount]', form);
    const output = $('[data-impact-output]');
    const freqLabel = $('[data-freq-label]', form);
    const totalEl = $('[data-impact-total]', form);
    const summaryEl = $('[data-summary-amount]', form);
    const impactMap = $('[data-impact-map]');

    /* frequency */
    $$('[data-freq]', form).forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-freq]', form).forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        if (freqLabel) freqLabel.textContent = btn.dataset.label || btn.textContent.trim();
        update();
      });
    });

    /* tiers */
    $$('[data-tier]', form).forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.dataset.tier, 10);
        $$('[data-tier]', form).forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        if (amountInput) { amountInput.value = amt; }
        if (customWrap) customWrap.classList.add('d-none');
        if (customInput) customInput.value = '';
        update();
      });
    });

    if (amountInput) {
      amountInput.addEventListener('input', () => {
        $$('[data-tier]', form).forEach(b => b.classList.remove('is-active'));
        if (customWrap) customWrap.classList.toggle('d-none', !amountInput.value);
        update();
      });
    }
    if (customInput) customInput.addEventListener('input', () => { if (amountInput) amountInput.value = customInput.value; update(); });

    /* payment method */
    const payButtons = $$('[data-pay]', form);
    const payPanels = $$('[data-pay-panel]', form);
    const cardNumber = $('[data-card-number]', form);
    const expiry    = $('[data-card-expiry]', form);
    const cvc       = $('[data-card-cvc]', form);

    const setPay = method => {
      payButtons.forEach(b => {
        const on = b.dataset.pay === method;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      payPanels.forEach(p => { p.hidden = p.dataset.payPanel !== method; });
      /* card details are only required when a card is the chosen rail */
      [cardNumber, expiry, cvc].forEach(f => { if (f) f.disabled = method !== 'card'; });
    };
    payButtons.forEach(btn => btn.addEventListener('click', () => setPay(btn.dataset.pay)));

    /* card field formatting */
    if (cardNumber) {
      cardNumber.addEventListener('input', () => {
        const digits = cardNumber.value.replace(/\D/g, '').slice(0, 19);
        cardNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();
      });
    }
    if (expiry) {
      expiry.addEventListener('input', () => {
        const d = expiry.value.replace(/\D/g, '').slice(0, 4);
        expiry.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
      });
    }
    if (cvc) {
      cvc.addEventListener('input', () => { cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4); });
    }
    setPay('card');

    /* impact multipliers */
    const multipliers = impactMap
      ? (impactMap.dataset.impactMap || '').split('|').map(Number).filter(n => !isNaN(n))
      : [];
    const rows = (impactMap ? $$('.impact-row', impactMap) : []).map(row => ({
      row, value: $('[data-impact-value]', row)
    }));

    const setNum = (el, v, fmt) => {
      if (!el) return;
      const txt = fmt
        ? fmt(v)
        : v >= 1000 ? Math.round(v).toLocaleString('en-US')
        : v.toFixed(Math.abs(v % 1) > 0 ? 1 : 0);
      if (el.textContent === txt) return;
      el.textContent = txt;
      if (hasGSAP && !REDUCED) {
        gsap.fromTo(el, { scale: 1.16, color: '#F5B93F' },
          { scale: 1, color: '', duration: .55, ease: 'back.out(2.2)' });
      }
    };

    /* the header prints a bare number, the button prints the currency symbol */
    const bareMoney = v => money(v).slice(1);

    function update() {
      const amt = parseFloat(amountInput && amountInput.value) || 0;
      const freq = $('[data-freq].is-active', form);
      const months = freq && freq.dataset.freq === 'monthly' ? 12 : 1;
      const total = amt * months;

      setNum(summaryEl, total, bareMoney);
      if (totalEl) totalEl.textContent = money(total);

      rows.forEach(r => {
        const mult = parseFloat(r.row.dataset.mult) || 1;
        setNum(r.value, amt * mult);
      });

      if (output && multipliers.length) {
        const uniq = multipliers.map(m => Math.round(amt * m)).filter((v, i, a) => a.indexOf(v) === i);
        output.textContent = uniq.length ? uniq.join('  ·  ') : '—';
      }
    }

    /* ---- validation helpers ------------------------------------------- */
    const status = $('[data-form-status]', form);
    const giveBtn = $('[data-give-btn]', form);
    const done = $('[data-gift-done]');

    const showStatus = (kind, html) => {
      if (!status) return;
      status.className = 'form-status mt-3 is-visible' + (kind ? ' is-' + kind : '');
      status.innerHTML = html;
    };

    const setError = (field, message) => {
      if (!field) return false;
      field.classList.add('is-invalid');
      field.style.borderColor = '';
      const slot = form.querySelector('[data-error-for="' + field.id + '"]');
      if (slot) { slot.textContent = message; slot.hidden = false; }
      return false;
    };

    const clearErrors = () => {
      $$('.is-invalid', form).forEach(f => {
        f.classList.remove('is-invalid');
        f.style.borderColor = '';
      });
      $$('[data-error-for]', form).forEach(s => { s.hidden = true; s.textContent = ''; });
    };

    /* luhn check so an obviously wrong card never reaches the processor */
    const luhn = digits => {
      if (digits.length < 13) return false;
      let sum = 0, alt = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let d = +digits[i];
        if (alt) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
        alt = !alt;
      }
      return sum % 10 === 0;
    };

    function validate() {
      clearErrors();
      const method = ($('[data-pay].is-active', form) || {}).dataset
        ? $('[data-pay].is-active', form).dataset.pay
        : 'card';

      let ok = true;
      const amount = parseFloat(amountInput && amountInput.value) || 0;
      if (!(amount >= 1)) ok = setError(amountInput, 'Enter an amount of $1 or more.');

      const first = $('#firstName', form);
      const last  = $('#lastName', form);
      const email = $('#email', form);
      if (!first || first.value.trim() === '') ok = setError(first, 'We need a first name for the receipt.');
      if (!last || last.value.trim() === '') ok = setError(last, 'We need a last name for the receipt.');
      if (!email || email.value.trim() === '') ok = setError(email, 'We send the receipt here, so it cannot be blank.');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))
        ok = setError(email, 'That email address does not look complete.');

      if (method === 'card') {
        const digits = cardNumber ? cardNumber.value.replace(/\D/g, '') : '';
        if (!digits) ok = setError(cardNumber, 'Enter the card number.');
        else if (!luhn(digits)) ok = setError(cardNumber, 'That card number fails its checksum — check for a typo.');

        const ex = expiry ? expiry.value.replace(/\D/g, '') : '';
        if (ex.length !== 4) ok = setError(expiry, 'Use MM / YY.');
        else {
          const m = +ex.slice(0, 2), y = 2000 + +ex.slice(2);
          const now = new Date();
          if (m < 1 || m > 12) ok = setError(expiry, 'That is not a real month.');
          else if (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth() + 1))
            ok = setError(expiry, 'That card has expired.');
        }

        const c = cvc ? cvc.value.replace(/\D/g, '') : '';
        if (c.length < 3) ok = setError(cvc, 'The security code is 3 or 4 digits.');
      }
      return ok;
    }

    /* ---- submit ------------------------------------------------------- */

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate()) {
        showStatus('error',
          '<i class="bi bi-exclamation-circle-fill"></i><span><b class="form-status__title">We could not take that gift yet.</b>' +
          'Check the highlighted fields and try again.</span>');
        status && status.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstBad = $('.is-invalid', form);
        if (firstBad) firstBad.focus({ preventScroll: true });
        return;
      }

      const amount = parseFloat(amountInput.value) || 0;
      const coverFees = $('#coverFees', form);
      const withFee = coverFees ? coverFees.checked : false;
      const fee = withFee ? amount * 0.029 + 0.3 : 0;

      const freqBtn = $('[data-freq].is-active', form);
      const monthly = freqBtn && freqBtn.dataset.freq === 'monthly';
      const methodBtn = $('[data-pay].is-active', form);
      const method = methodBtn ? methodBtn.dataset.pay : 'card';
      const programSel = $('#program', form);
      const program = programSel ? programSel.options[programSel.selectedIndex].text : 'Unrestricted';
      const email = $('#email', form).value.trim();
      const first = $('#firstName', form).value.trim();

      if (giveBtn) giveBtn.classList.add('is-loading');
      showStatus('busy', '<i class="bi bi-arrow-repeat"></i><span>Contacting our payment processor. Do not close this tab.</span>');
      form.setAttribute('aria-busy', 'true');

      /* No processor is wired up on this build — this stands in for the gateway call. */
      setTimeout(() => {
        form.removeAttribute('aria-busy');
        if (giveBtn) giveBtn.classList.remove('is-loading');

        const ref = 'HF-' + new Date().getFullYear() + '-' +
          Math.random().toString(36).slice(2, 8).toUpperCase();

        const methodNames = { card: 'Card', bank: 'Bank transfer', apple: 'Apple Pay', paypal: 'PayPal', crypto: 'Bitcoin' };

        const notes = {
          card: 'Your receipt is on its way to ' + email + ' — check the spam folder if it has not arrived in ten minutes.',
          bank: 'Bank details are in your inbox. Put ' + email + ' in the reference line so we can match the transfer to a receipt.',
          apple: 'Approve the prompt in your Apple Pay sheet to finish. Your receipt follows to ' + email + ' straight after.',
          paypal: 'We have sent you to PayPal to approve this gift. The receipt goes to ' + email + ' once PayPal confirms.',
          crypto: 'We have emailed a Bitcoin deposit address for this amount. The receipt covers market value on your first confirmation.'
        };

        const intro = monthly
          ? 'Your first monthly gift is scheduled. Every month on this date it renews, and the receipt arrives by email each time.'
          : 'Thank you, ' + first + '. Your receipt is on its way to ' + email + '.';

        const set = (sel, text) => { const el = $(sel, done); if (el) el.textContent = text; };
        set('[data-done-intro]', intro);
        set('[data-done-ref]', ref);
        set('[data-done-freq]', monthly ? 'Monthly, renewing' : 'One-time');
        set('[data-done-program]', program);
        set('[data-done-email]', email);
        set('[data-done-method]', methodNames[method] || 'Card');
        set('[data-done-total]', money(amount + fee));
        set('[data-done-note]', notes[method] || notes.card);
        set('[data-done-total-label]', monthly ? 'Charged today' : 'Total charged today');

        form.hidden = true;
        done.hidden = false;
        status.className = 'form-status mt-3';
        status.innerHTML = '';

        clearErrors();
        form.reset();
        update();

        if (hasGSAP && !REDUCED) {
          const mark = $('[data-done-mark]', done);
          gsap.fromTo(done, { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: .7, ease: EASE });
          if (mark) gsap.fromTo(mark, { scale: .4, rotate: -25 },
            { scale: 1, rotate: 0, duration: .8, ease: 'back.out(2.4)', delay: .1 });
          gsap.fromTo($$('.receipt__row', done), { opacity: 0, x: -14 },
            { opacity: 1, x: 0, duration: .5, stagger: .07, ease: EASE, delay: .18 });
        }
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1500);
    });

    /* start a fresh gift */
    const again = $('[data-give-again]', done && done.parentNode ? done.parentNode : document);
    if (again) {
      again.addEventListener('click', () => {
        done.hidden = true;
        form.hidden = false;
        setPay('card');
        update();
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (amountInput) amountInput.focus({ preventScroll: true });
      });
    }

    /* live-clear validation marks while typing */
    ['firstName', 'lastName', 'email'].forEach(id => {
      const field = $('#' + id, form);
      if (field) field.addEventListener('input', () => { clearErrors(); });
    });

    update();
  }

  function initForms() {
    $$('form[data-validate]').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        let ok = true;
        $$('[required]', form).forEach(field => {
          const valid = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
          field.style.borderColor = valid ? '' : 'var(--coral)';
          if (!valid) ok = false;
        });
        const status = $('[data-form-status]', form);
        if (status) {
          status.classList.add('is-visible');
          if (ok) {
            status.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Thank you — your message is with our team. We reply within one business day.</span>';
            form.reset();
          } else {
            status.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i><span>Please complete the highlighted fields.</span>';
          }
          if (hasGSAP && !REDUCED) {
            gsap.fromTo(status, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: EASE });
            status.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });

      $$('[required]', form).forEach(field => {
        field.addEventListener('input', () => { field.style.borderColor = ''; });
      });
    });

    /* live newsletter feedback */
    const news = $('[data-newsletter]');
    if (news) {
      news.addEventListener('submit', e => {
        e.preventDefault();
        const input = $('input', news);
        const note = $('[data-news-note]', news);
        if (!input || input.value.trim() === '') return;
        if (note) {
          note.textContent = 'You are on the list — welcome to the hearth. ' + input.value.trim();
          note.style.color = 'var(--leaf)';
        }
        news.reset();
      });
    }
  }

  /* ---------------------------------------------------------------- 09 */
  function onResize() {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function init() {
    prepHidden();
    initCursor();
    initHeader();

    initPreloader().then(() => {
      initHero();
      initMarquee();
      initReveals();
      initCounters();
      initBars();
      initDonut();
      initRings();
      initHorizontalScroll();
      initSlider();
      initAccordion();
      initFilters();
      initScrollAnimations();
      initDonation();
      initForms();
      initSocial();
      initPlaceholderLinks();
      initShareTriggers();
      initErrorPage();

      /* hero headings are animated by initHero, keep them visible for reveal engine */
      $$('[data-hero-title] [data-split], [data-anim-hero]').forEach(el => {
        if (el.querySelectorAll('.word-inner').length) el.dataset.splitHero = '1';
      });

      document.dispatchEvent(new CustomEvent('hearth:ready'));
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(onResize, 180); });
    window.addEventListener('orientationchange', () => setTimeout(onResize, 260));
    window.addEventListener('load', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
    window.addEventListener('pagehide', () => { if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(t => t.kill()); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
