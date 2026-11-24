(function () {
  const pills = document.querySelectorAll('.pill');
  const rows = document.querySelectorAll('.catalog-table .row:not(.head)');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const searchForm = document.getElementById('searchForm');
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.querySelector('.main-nav');

  let activeExam = 'all';

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    rows.forEach((row) => {
      const matchesExam = activeExam === 'all' || row.dataset.exam === activeExam;
      const matchesQuery = !query || row.textContent.toLowerCase().includes(query);
      const show = matchesExam && matchesQuery;
      row.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });

    resultCount.textContent = visible + (visible === 1 ? ' document' : ' documents');
    emptyState.hidden = visible !== 0;
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      activeExam = pill.dataset.exam;
      applyFilters();
    });
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
  });
  searchInput.addEventListener('input', applyFilters);

  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open);
  });
})();
