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
  const dialogDuration = Number.parseFloat(motionTokens.getPropertyValue('--duration-dialog'));
  const reveals = new Map();
  let revealObserver = null;
  let dialogAnimation = null;
  let activeCard = null;
  let transition = null;
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
      card.addEventListener('pointerenter', () => reveals.get(card)?.finish());
      card.addEventListener('pointerdown', () => reveals.get(card)?.finish());
      card.addEventListener('focusin', () => reveals.get(card)?.finish());
    });
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    revealObserver?.disconnect();
    reveals.forEach(animation => animation.finish());
    transition?.skipTransition();
    dialogAnimation?.finish();
  });
  // Keep ordinary repository links working on browsers without native dialogs.
  if (typeof dialog.showModal !== 'function') return;

  function morph(update, direction, keyboard = false) {
    transition?.skipTransition();
    transition = null;
    const presentation = dialog.open ? getComputedStyle(dialog) : null;
    const visible = presentation && { opacity: presentation.opacity, transform: presentation.transform };
    dialogAnimation?.cancel();
    dialogAnimation = null;
    if (direction === 'close') dialog.dataset.closing = 'true';
    else delete dialog.dataset.closing;
    if (keyboard) {
      dialog.dataset.motion = 'instant';
      update();
      return Promise.resolve();
    }
    if (!reducedMotion.matches && document.startViewTransition) {
      dialog.dataset.motion = 'native';
      const current = document.startViewTransition(update);
      transition = current;
      return current.finished.catch(() => {}).finally(() => {
        if (transition === current) transition = null;
      });
    }
    if (typeof dialog.animate !== 'function') {
      dialog.dataset.motion = 'instant';
      update();
      return Promise.resolve();
    }
    const reduced = reducedMotion.matches;
    dialog.dataset.motion = reduced ? 'reduced' : 'fallback';
    const entering = direction === 'open';
    const edge = reduced ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' };
    const rest = reduced ? { opacity: 1 } : { opacity: 1, transform: 'scale(1)' };
    if (entering) update();
    const from = entering ? edge : reduced ? { opacity: visible.opacity } : visible;
    const animation = dialog.animate([from, entering ? rest : edge], {
      duration: reduced ? 200 : dialogDuration, easing: easeOut, fill: 'both',
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
  function openProject(card, keyboard) {
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
    updateDownload(card);
    card.style.viewTransitionName = 'project-panel';
    morph(() => {
      card.style.viewTransitionName = '';
      dialog.style.viewTransitionName = 'project-panel';
      dialog.showModal();
      root.classList.add('dialog-open');
    }, 'open', keyboard);
  }
  function closeProject(event) {
    if (!dialog.open || !activeCard) return;
    const card = activeCard;
    morph(() => {
      dialog.style.viewTransitionName = '';
      dialog.close();
      root.classList.remove('dialog-open');
      card.style.viewTransitionName = 'project-panel';
      activeCard = null;
      card.focus({ preventScroll: true });
    }, 'close', event.type === 'cancel' || event.detail === 0).finally(() => {
      if (activeCard !== card) card.style.viewTransitionName = '';
    });
  }
  projectCards.forEach(card => {
    card.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openProject(card, event.detail === 0);
    });
    card.setAttribute('aria-haspopup', 'dialog');
  });
  closeButton.addEventListener('click', closeProject);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeProject(event);
  });
  let pointerStartedOnBackdrop = false;
  dialog.addEventListener('pointerdown', event => {
    const rect = dialog.getBoundingClientRect();
    pointerStartedOnBackdrop = event.target === dialog &&
      (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && pointerStartedOnBackdrop) closeProject(event);
    pointerStartedOnBackdrop = false;
  });
})();
