/* data2comms: Motion, Kinetic Data Canvas, Services Explorer & Forms */
(function () {
  'use strict';

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Header elevation on scroll
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 2. Mobile menu drawer
  const menuBtn = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  if (menuBtn && drawer) {
    const closeMenu = () => {
      drawer.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Abrir menu de navegação');
      menuBtn.textContent = 'Menu';
    };
    menuBtn.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
      menuBtn.textContent = open ? 'Fechar' : 'Menu';
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
    drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }

  // 3. Choreographed Scroll Reveal
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  // 4. Animated Counter (e.g. 60 mil assinaturas)
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length && !reducedMotion && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count-to'), 10);
        const suffix = el.getAttribute('data-count-suffix') || '';
        const prefix = el.getAttribute('data-count-prefix') || '';
        const start = performance.now();
        const duration = 950;
        const step = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.round(eased * target);
          el.textContent = prefix + val.toLocaleString('pt-BR') + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.35 });
    counters.forEach((el) => cio.observe(el));
  }

  // 5. Subtle Kinetic Data Network Canvas in Hero (Light, minimal, interactive)
  const canvas = document.getElementById('hero-data-canvas');
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: -999, y: -999 };
    const nodes = [];
    const COUNT = window.innerWidth < 768 ? 18 : 34;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }, { passive: true });
    canvas.parentElement.addEventListener('mouseleave', () => {
      pointer.x = -999; pointer.y = -999;
    });

    for (let i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: i % 5 === 0 ? 4.2 : 2.2,
        accent: i % 5 === 0
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        const dxp = a.x - pointer.x;
        const dyp = a.y - pointer.y;
        const dp = Math.hypot(dxp, dyp);
        if (dp < 150 && dp > 1) {
          a.x += (dxp / dp) * 0.65;
          a.y += (dyp / dp) * 0.65;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 165) {
            const alpha = (1 - dist / 165) * 0.14;
            ctx.strokeStyle = `rgba(23, 25, 28, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        if (n.accent) {
          ctx.fillStyle = '#CCFF00';
          ctx.fill();
          ctx.strokeStyle = 'rgba(23, 25, 28, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(23, 25, 28, 0.22)';
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // 6. Interactive Services Explorer (Home)
  const svcTabs = document.querySelectorAll('[data-svc-tab]');
  const svcPanels = document.querySelectorAll('[data-svc-panel]');
  if (svcTabs.length && svcPanels.length) {
    const activate = (id) => {
      svcTabs.forEach((btn) => {
        const active = btn.getAttribute('data-svc-tab') === id;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      svcPanels.forEach((panel) => {
        const active = panel.getAttribute('data-svc-panel') === id;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    };
    svcTabs.forEach((btn) => {
      btn.addEventListener('click', () => activate(btn.getAttribute('data-svc-tab')));
    });
  }

  // 7. Reading progress bar (Press Releases)
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      progressBar.style.width = pct.toFixed(1) + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // 8. Lead form handler (Google Apps Script)
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-Yea5JRZ8dYQOLKEmd3inKh98mMWs_s8K7woc2_-jd_IkH27g9NAf6vGg0vM6NXKNEw/exec';
  document.querySelectorAll('form[data-lead-form]').forEach((form) => {
    const submitBtn = form.querySelector('button[type="submit"]');
    const okBox = form.querySelector('[data-form-success]');
    const errBox = form.querySelector('[data-form-error]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!submitBtn) return;

      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      if (okBox) okBox.classList.remove('is-visible');
      if (errBox) errBox.classList.remove('is-visible');

      try {
        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: new FormData(form),
        });
        if (!res.ok && res.type !== 'opaque') {
          throw new Error('HTTP ' + res.status);
        }
        submitBtn.textContent = 'Enviado';
        if (okBox) okBox.classList.add('is-visible');
        form.reset();

        setTimeout(() => {
          submitBtn.textContent = originalLabel;
          submitBtn.disabled = false;
        }, 6000);
      } catch (err) {
        console.error('Erro ao enviar formulário:', err);
        submitBtn.textContent = originalLabel;
        submitBtn.disabled = false;
        if (errBox) errBox.classList.add('is-visible');
      }
    });
  });
})();
