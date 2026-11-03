// Data2Comms — Interatividade Institucional & Editorial

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
    });
  }

  // 2. Reading Progress Indicator (Artigos)
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const scrolled = (window.scrollY / docHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
      }
    }, { passive: true });
  }

  // 3. Blog Category Filtering & Live Search
  const filterButtons = document.querySelectorAll('[data-category-filter]');
  const searchInput = document.getElementById('article-search');
  const articleCards = document.querySelectorAll('.article-card-item');
  const noResultsMsg = document.getElementById('no-results-message');

  let currentCategory = 'todos';
  let searchQuery = '';

  function applyFilters() {
    let visibleCount = 0;
    articleCards.forEach(card => {
      const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
      const cardTitle = (card.getAttribute('data-title') || '').toLowerCase();
      const cardSummary = (card.getAttribute('data-summary') || '').toLowerCase();

      const matchesCategory = (currentCategory === 'todos' || cardCat === currentCategory);
      const matchesSearch = !searchQuery || cardTitle.includes(searchQuery) || cardSummary.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResultsMsg) {
      if (visibleCount === 0) {
        noResultsMsg.classList.remove('hidden');
      } else {
        noResultsMsg.classList.add('hidden');
      }
    }
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filterButtons.forEach(b => {
        b.classList.remove('bg-ink', 'text-white', 'border-ink');
        b.classList.add('bg-transparent', 'text-ink-secondary', 'border-border-subtle');
      });
      btn.classList.remove('bg-transparent', 'text-ink-secondary', 'border-border-subtle');
      btn.classList.add('bg-ink', 'text-white', 'border-ink');

      currentCategory = btn.getAttribute('data-category-filter').toLowerCase();
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // Support URL parameter category filtering (e.g. blog.html?cat=tecnologia)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  if (catParam) {
    const targetBtn = document.querySelector(`[data-category-filter="${catParam.toLowerCase()}"]`);
    if (targetBtn) {
      targetBtn.click();
    }
  }

  // 4. Executive Contact Form Handler
  const contactForm = document.getElementById('executive-contact-form');
  const formSuccessModal = document.getElementById('form-success-state');
  if (contactForm && formSuccessModal) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      contactForm.classList.add('opacity-50', 'pointer-events-none');
      setTimeout(() => {
        contactForm.reset();
        contactForm.classList.remove('opacity-50', 'pointer-events-none');
        contactForm.classList.add('hidden');
        formSuccessModal.classList.remove('hidden');
      }, 600);
    });
  }
});
