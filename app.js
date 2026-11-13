(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('#theme-toggle');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.querySelector('#project-dialog');
  const closeButton = document.querySelector('#dialog-close');
  let activeCard = null;
  let transition = null;

  function syncTheme() {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemTheme.matches;
    const label = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--page').trim();
  }
  themeButton.hidden = false;
  syncTheme();
  systemTheme.addEventListener('change', syncTheme);
  themeButton.addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemTheme.matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('erikpuw-theme', root.dataset.theme); } catch { /* Theme changes still work without storage. */ }
    syncTheme();
  });
  // Keep ordinary repository links working on browsers without native dialogs.
  if (typeof dialog.showModal !== 'function') return;

  function morph(update) {
    transition?.skipTransition();
    if (reducedMotion.matches || !document.startViewTransition) {
      update();
      return Promise.resolve();
    }
    const current = document.startViewTransition(update);
    transition = current;
    return current.finished.catch(() => {}).finally(() => {
      if (transition === current) transition = null;
    });
  }
  function openProject(card) {
    const template = document.querySelector(`#${card.dataset.project}-details`);
    if (activeCard || !template) return;
    activeCard = card;
    document.querySelector('#dialog-title').textContent = card.querySelector('h3').textContent;
    document.querySelector('#dialog-description').textContent = card.querySelector('p').textContent;
    document.querySelector('#dialog-category').textContent = card.querySelector('.project-category').textContent;
    document.querySelector('#dialog-repository').href = card.href;
    const art = document.createElement('img');
    art.src = `assets/detail-${card.dataset.project}.webp`;
    art.alt = '';
    art.width = 800;
    art.height = 1000;
    art.decoding = 'async';
    document.querySelector('#dialog-art').replaceChildren(art);
    document.querySelector('#dialog-details').replaceChildren(template.content.cloneNode(true));
    card.style.viewTransitionName = 'project-panel';
    morph(() => {
      card.style.viewTransitionName = '';
      dialog.style.viewTransitionName = 'project-panel';
      dialog.showModal();
      root.classList.add('dialog-open');
    });
  }
  function closeProject() {
    if (!dialog.open || !activeCard) return;
    const card = activeCard;
    morph(() => {
      dialog.style.viewTransitionName = '';
      dialog.close();
      root.classList.remove('dialog-open');
      card.style.viewTransitionName = 'project-panel';
      activeCard = null;
      card.focus({ preventScroll: true });
    }).finally(() => {
      if (activeCard !== card) card.style.viewTransitionName = '';
    });
  }
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openProject(card);
    });
    card.setAttribute('aria-haspopup', 'dialog');
  });
  closeButton.addEventListener('click', closeProject);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeProject();
  });
  let pointerStartedOnBackdrop = false;
  dialog.addEventListener('pointerdown', event => {
    const rect = dialog.getBoundingClientRect();
    pointerStartedOnBackdrop = event.target === dialog &&
      (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && pointerStartedOnBackdrop) closeProject();
    pointerStartedOnBackdrop = false;
  });
})();
