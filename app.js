(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('#theme-toggle');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.querySelector('#project-dialog');
  const closeButton = document.querySelector('#dialog-close');
  const projectCards = Array.from(document.querySelectorAll('.project-card'));
  const motionTokens = getComputedStyle(root);
  const easeOut = motionTokens.getPropertyValue('--ease-out').trim();
  const detailDuration = Number.parseFloat(motionTokens.getPropertyValue('--duration-detail'));
  const dismissDuration = Number.parseFloat(motionTokens.getPropertyValue('--duration-dismiss'));
  const detailEase = motionTokens.getPropertyValue('--ease-detail').trim();
  const dismissEase = motionTokens.getPropertyValue('--ease-dismiss').trim();
  const reveals = new Map();
  const artworkCache = new Map();
  let revealObserver = null;
  let dialogAnimation = null;
  let activeCard = null;
  let downloadRequest = 0;

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
  function getProjectArtwork(card, priority) {
    const id = card.dataset.project;
    const cached = artworkCache.get(id);
    if (cached) {
      if (priority === 'high') cached.fetchPriority = 'high';
      return cached;
    }
    const art = document.createElement('img');
    art.alt = '';
    art.width = 800;
    art.height = 1000;
    art.decoding = 'async';
    art.fetchPriority = priority;
    art.src = `assets/detail-${id}.webp`;
    artworkCache.set(id, art);
    if (typeof art.decode === 'function') {
      art.decode().catch(() => {
        if (artworkCache.get(id) === art) artworkCache.delete(id);
      });
    }
    return art;
  }
  if (typeof IntersectionObserver === 'function') {
    const imageObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        getProjectArtwork(entry.target, 'low');
        imageObserver.unobserve(entry.target);
      }
    }, { rootMargin: '240px 0px' });
    projectCards.forEach(card => imageObserver.observe(card));
  }
  projectCards.forEach(card => {
    for (const type of ['pointerenter', 'pointerdown', 'focusin']) {
      card.addEventListener(type, () => {
        reveals.get(card)?.finish();
        getProjectArtwork(card, 'high');
      });
    }
  });
  if (!reducedMotion.matches && typeof IntersectionObserver === 'function' && projectCards.every(card => typeof card.animate === 'function')) {
    const pending = new Set(projectCards);
    revealObserver = new IntersectionObserver(entries => {
      let delay = 0;
      for (const entry of entries) {
        const card = entry.target;
        if (!entry.isIntersecting || !pending.delete(card)) continue;
        revealObserver.unobserve(card);
        if (reducedMotion.matches || card.matches(':focus-visible') || card.matches(':hover')) continue;
        const animation = card.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 300, delay, easing: easeOut, fill: 'backwards',
        });
        delay += 50;
        reveals.set(card, animation);
        animation.finished.catch(() => {}).finally(() => {
          if (reveals.get(card) === animation) reveals.delete(card);
          animation.cancel();
        });
      }
      if (!pending.size) revealObserver.disconnect();
    }, { threshold: .15 });
    projectCards.forEach(card => {
      revealObserver.observe(card);
    });
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    revealObserver?.disconnect();
    reveals.forEach(animation => animation.finish());
    dialogAnimation?.finish();
  });
  // Keep ordinary repository links working on browsers without native dialogs.
  if (typeof dialog.showModal !== 'function') return;

  // Keep the detail surface opaque and reverse from its visible position.
  function animateDialog(update, direction) {
    const current = dialog.open ? getComputedStyle(dialog) : null;
    const from = { transform: current?.transform || 'translateX(100%)' };
    dialogAnimation?.cancel();
    dialogAnimation = null;
    if (direction === 'close') dialog.dataset.closing = 'true';
    else delete dialog.dataset.closing;
    if (reducedMotion.matches || typeof dialog.animate !== 'function') {
      dialog.dataset.motion = 'instant';
      update();
      return Promise.resolve();
    }
    dialog.dataset.motion = 'detail';
    const entering = direction === 'open';
    if (entering) update();
    const to = { transform: entering ? 'translateX(0%)' : 'translateX(100%)' };
    const animation = dialog.animate([from, to], {
      duration: entering ? detailDuration : dismissDuration,
      easing: entering ? detailEase : dismissEase, fill: 'both',
    });
    dialogAnimation = animation;
    return animation.finished.catch(() => {}).then(() => {
      if (dialogAnimation !== animation) return;
      if (!entering) update();
      dialogAnimation = null;
      animation.cancel();
    });
  }
  async function updateDownload(card) {
    const request = ++downloadRequest;
    const download = document.querySelector('#dialog-download');
    const label = document.querySelector('#dialog-download-label');
    const status = document.querySelector('#dialog-download-status');
    download.hidden = true;
    download.removeAttribute('href');
    status.textContent = 'Đang tìm bản phát hành mới nhất...';
    const repo = new URL(card.href).pathname.split('/').pop();
    const release = await resolveLatestRelease(repo);
    if (activeCard !== card || request !== downloadRequest) return;
    if (release.status === 'unreleased') {
      status.textContent = 'Chưa có bản phát hành để tải. Xem hướng dẫn cài đặt trên GitHub.';
      return;
    }
    download.href = release.url || `${card.href}/releases/latest`;
    label.textContent = release.status === 'download' ? 'Tải cho Windows' : 'Xem Releases';
    if (release.status === 'download') {
      status.textContent = `${release.version} · ${release.filename}`;
    } else if (release.status === 'manual') {
      status.textContent = `${release.version}. Chọn tệp phù hợp trong Releases.`;
    } else {
      status.textContent = 'Không kiểm tra được bản tải mới nhất. Mở Releases để xem các bản phát hành.';
    }
    download.hidden = false;
  }
  function openProject(card) {
    const template = document.querySelector(`#${card.dataset.project}-details`);
    if (activeCard || !template) return;
    activeCard = card;
    document.querySelector('#dialog-title').textContent = card.querySelector('h3').textContent;
    document.querySelector('#dialog-description').textContent = card.querySelector('p').textContent;
    document.querySelector('#dialog-category').textContent = card.querySelector('.project-category').textContent;
    document.querySelector('#dialog-repository').href = card.href;
    const art = getProjectArtwork(card, 'high');
    document.querySelector('#dialog-art').replaceChildren(art);
    document.querySelector('#dialog-details').replaceChildren(template.content.cloneNode(true));
    updateDownload(card);
    animateDialog(() => {
      dialog.showModal();
      root.classList.add('dialog-open');
    }, 'open');
  }
  function closeProject() {
    if (!dialog.open || !activeCard) return;
    if (dialog.dataset.closing) return;
    const card = activeCard;
    animateDialog(() => {
      dialog.close();
      root.classList.remove('dialog-open');
      activeCard = null;
      card.focus({ preventScroll: true });
    }, 'close');
  }
  projectCards.forEach(card => {
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
