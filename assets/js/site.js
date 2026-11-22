/* data2comms — Core Interactive Scripts (Menu, Forms, Observatório Filter, Reading Progress) */
(function () {
  'use strict';

  // 1. Accessible Mobile Navigation Drawer
  const menuBtn = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  if (menuBtn && drawer) {
    const closeMenu = () => {
      drawer.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Abrir menu de navegação');
    };
    menuBtn.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  // 2. Reading Progress Bar (Articles & Press Releases)
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

  // 3. Lead Form Handler (Google Apps Script with genuine error verification)
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
        submitBtn.textContent = 'Mensagem enviada';
        submitBtn.classList.remove('btn-dark');
        submitBtn.classList.add('btn-acid');
        if (okBox) okBox.classList.add('is-visible');
        form.reset();

        setTimeout(() => {
          submitBtn.textContent = originalLabel;
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-acid');
          submitBtn.classList.add('btn-dark');
        }, 6000);
      } catch (err) {
        console.error('Erro ao enviar formulário:', err);
        submitBtn.textContent = originalLabel;
        submitBtn.disabled = false;
        if (errBox) errBox.classList.add('is-visible');
      }
    });
  });

  // 4. Observatório Category Filter
  const filterButtons = document.querySelectorAll('[data-filter-cat]');
  const filterCards = document.querySelectorAll('[data-card-cat]');
  const countEl = document.getElementById('observatorio-count');

  if (filterButtons.length && filterCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-filter-cat');
        filterButtons.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        let visible = 0;
        filterCards.forEach((card) => {
          const match = cat === 'all' || card.getAttribute('data-card-cat') === cat;
          card.style.display = match ? '' : 'none';
          if (match) visible += 1;
        });
        if (countEl) {
          countEl.textContent = visible + (visible === 1 ? ' estudo publicado' : ' estudos publicados');
        }
      });
    });
  }
})();
