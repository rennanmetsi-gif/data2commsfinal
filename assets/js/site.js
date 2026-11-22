/* data2comms — Core Interactive Scripts */
(function () {
  'use strict';

  // Mobile menu drawer
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
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Interactive Services Explorer (Home)
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

  // Reading progress bar (Press Releases)
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

  // Lead form handler (Google Apps Script)
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
