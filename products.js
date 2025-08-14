// products.js - lógica de busca, filtros, modal
document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const filters = document.querySelectorAll('.filter-btn');

  // Modal elements
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalPrice = document.getElementById('modalPrice');
  const closeModalBtn = document.getElementById('closeModal');
  const modalClose2 = document.getElementById('modalClose2');

  // Open modal with product data
  function openModal(cardEl) {
    const img = cardEl.querySelector('img').src;
    const title = cardEl.dataset.name || cardEl.querySelector('h3').innerText;
    const desc = cardEl.dataset.desc || '';
    const price = cardEl.dataset.price || '';

    modalImg.src = img;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalPrice.textContent = price;

    modalBackdrop.style.display = 'flex';
    modalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modalBackdrop.style.display = 'none';
    modalBackdrop.setAttribute('aria-hidden', 'true');
  }

  // Click each product card -> open modal
  productsGrid.querySelectorAll('.prod-item').forEach(card => {
    card.addEventListener('click', () => openModal(card));
    // also wire the small "Ver" button inside
    const btn = card.querySelector('.btn');
    if (btn) btn.addEventListener('click', (ev) => {
      ev.stopPropagation(); // prevent double event
      openModal(card);
    });
  });

  closeModalBtn.addEventListener('click', closeModal);
  modalClose2.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (ev) => {
    if (ev.target === modalBackdrop) closeModal();
  });

  // ESC to close
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });

  // Search
  function filterProducts() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

    productsGrid.querySelectorAll('.prod-item').forEach(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const matchesQuery = q === '' || name.includes(q) || (card.querySelector('h3') && card.querySelector('h3').innerText.toLowerCase().includes(q));
      const matchesFilter = activeFilter === 'all' || category === activeFilter;
      card.style.display = (matchesQuery && matchesFilter) ? 'flex' : 'none';
    });
  }

  searchInput.addEventListener('input', () => {
    filterProducts();
  });

  // Filters
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProducts();
    });
  });

  // Small enhancement: allow Enter on search to focus first visible product
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = productsGrid.querySelector('.prod-item[style*="display: flex"], .prod-item:not([style*="display: none"])');
      if (first) openModal(first);
    }
  });

});
