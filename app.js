(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('#theme-toggle');
  const langButton = document.querySelector('#lang-toggle');
  const filterBar = document.querySelector('#project-filters');
  const projectGrid = document.querySelector('#project-grid');
  const filterIds = ['all', 'ai', 'custom', 'entertainment', 'tools'];
  let activeFilter = 'all';
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
  const releaseCache = new Map();
  let revealObserver = null;
  let dialogAnimation = null;
  let activeCard = null;
  let downloadRequest = 0;

  const copy = {
    vi: {
      title: 'erikpuw | Phần mềm cho Windows',
      metaDescription: 'Các dự án Windows của erikpuw: JARVIS, PUW Notch, Puw Player, Lenovo Toolkit, puwdesk, PuwBar và PuwVGA. Khám phá ứng dụng và mã nguồn trên GitHub.',
      skipLink: 'Đến các dự án',
      wordmarkLabel: 'erikpuw, trang chủ',
      navLabel: 'Điều hướng chính',
      switchLang: 'Chuyển sang tiếng Anh',
      toLight: 'Chuyển sang giao diện sáng',
      toDark: 'Chuyển sang giao diện tối',
      eyebrow: 'Phần mềm cho Windows',
      heroTitle: 'Một góc làm việc tốt hơn.',
      heroDescription: 'AI, tùy biến Windows, giải trí và công cụ hệ thống của erikpuw.',
      heroOrigin: 'Sản phẩm phần mềm do người Việt làm.',
      heroCta: 'Khám phá dự án',
      projectsTitle: 'Dự án của tôi',
      footerCopy: '© 2026 erikpuw. Bảo lưu mọi quyền.',
      filterLabel: 'Phân loại dự án',
      filters: {
        all: 'Tất cả',
        ai: 'AI',
        custom: 'Custom Windows',
        entertainment: 'Giải trí',
        tools: 'Công cụ',
      },
      dialogClose: 'Đóng chi tiết dự án',
      downloadWin: 'Tải cho Windows',
      viewReleases: 'Xem Releases',
      viewGithub: 'Xem trên GitHub',
      checkingRelease: 'Đang tìm bản phát hành mới nhất...',
      comingSoon: 'Sắp ra mắt',
      unreleasedDefault: 'Chưa có bản phát hành để tải. Xem hướng dẫn cài đặt trên GitHub.',
      manualRelease: version => `${version}. Chọn tệp phù hợp trong Releases.`,
      unavailableRelease: 'Không kiểm tra được bản tải mới nhất. Mở Releases để xem các bản phát hành.',
      projects: {
        jarvis: {
          category: 'Trợ lý AI',
          description: 'Trợ lý AI với giọng nói tiếng Việt.',
        },
        notch: {
          category: 'Tiện ích desktop',
          description: 'Nhạc và tiện ích ngay trên desktop.',
        },
        player: {
          category: 'Âm nhạc',
          description: 'Nghe nhạc offline, lời chạy theo bài.',
        },
        toolkit: {
          category: 'Phần cứng',
          description: 'Nguồn, quạt và pin cho laptop Lenovo.',
        },
        puwdesk: {
          category: 'Hình nền động',
          description: 'Desktop của bạn sẽ là nơi trải nghiệm thư giãn',
          unreleased: 'Đang chuẩn bị phát hành. Bản tải sẽ xuất hiện khi có trên GitHub Releases.',
        },
        puwbar: {
          category: 'Thanh taskbar',
          description: 'Taskbar kính mờ nổi cho Windows 11, giữ nguyên mọi tính năng gốc.',
        },
        puwvga: {
          category: 'Đồ họa / GPU',
          description: 'Điều khiển toàn bộ VGA của 3 hãng lớn NVIDIA, AMD và Intel tại một nơi.',
          unreleased: 'Đang chuẩn bị phát hành. Bản tải sẽ xuất hiện khi có trên GitHub Releases.',
        },
      },
    },
    en: {
      title: 'erikpuw | Windows Software',
      metaDescription: 'Windows software by erikpuw: JARVIS, PUW Notch, Puw Player, Lenovo Toolkit, puwdesk, PuwBar, and PuwVGA. Explore apps and source code on GitHub.',
      skipLink: 'Skip to projects',
      wordmarkLabel: 'erikpuw, home',
      navLabel: 'Main navigation',
      switchLang: 'Switch to Vietnamese',
      toLight: 'Switch to light theme',
      toDark: 'Switch to dark theme',
      eyebrow: 'Windows Software',
      heroTitle: 'A better workspace.',
      heroDescription: 'AI, Windows customization, entertainment, and system tools by erikpuw.',
      heroOrigin: 'Software built in Vietnam.',
      heroCta: 'Explore projects',
      projectsTitle: 'My projects',
      footerCopy: '© 2026 erikpuw. All rights reserved.',
      filterLabel: 'Filter projects by category',
      filters: {
        all: 'All',
        ai: 'AI',
        custom: 'Custom Windows',
        entertainment: 'Entertainment',
        tools: 'Tools',
      },
      dialogClose: 'Close project details',
      downloadWin: 'Download for Windows',
      viewReleases: 'View Releases',
      viewGithub: 'View on GitHub',
      checkingRelease: 'Checking for the latest release...',
      comingSoon: 'Coming soon',
      unreleasedDefault: 'No release available yet. Check installation instructions on GitHub.',
      manualRelease: version => `${version}. Choose the right package in Releases.`,
      unavailableRelease: 'Could not check the latest download. Open Releases to view available builds.',
      projects: {
        jarvis: {
          category: 'AI Assistant',
          description: 'AI assistant with Vietnamese voice.',
          intro: 'A Windows assistant that connects to local language models for chat, lookup, and everyday tasks.',
          features: [
            'Vietnamese speech recognition and spoken replies.',
            'Personal document lookup powered by a local knowledge base.',
            'Per-user conversation history and access controls.',
          ],
          note: 'Requires configuring an AI model and runtime environment. See setup instructions in the repository.',
        },
        notch: {
          category: 'Desktop utility',
          description: 'Music and quick utilities right on your desktop.',
          intro: 'A compact notch for the Windows desktop that brings media controls and everyday tools into one place.',
          features: [
            'View now-playing tracks and control your music player.',
            'Quick access to weather, calendar, and desktop widgets.',
            'Expands smoothly from a compact pill into a utility panel.',
          ],
          note: 'Media playback control depends on the active player and Windows media integration.',
        },
        player: {
          category: 'Music',
          description: 'Offline music player with synced lyrics.',
          intro: 'A music player built for your local library. Add files or folders, build playlists, and listen your way.',
          features: [
            'Local library and playlists without moving original files.',
            'Synced lyrics from LRC files or optional LRCLIB lookup.',
            'Media key integration and seamless pairing with PUW Notch.',
          ],
          note: 'Plays offline. Online lyric lookup via LRCLIB requires internet and only runs when enabled.',
        },
        toolkit: {
          category: 'Hardware',
          description: 'Power, fans, and battery control for Lenovo laptops.',
          intro: 'A Rust utility for supported Lenovo Legion, LOQ, and IdeaPad Gaming laptops.',
          features: [
            'Switch power modes and monitor fans and thermal sensors.',
            'Manage charging limits and inspect battery health.',
            'Control lighting, Fn keys, and quick actions from the system tray.',
          ],
          note: 'Unofficial project, not affiliated with Lenovo. Hardware controls depend on device and firmware; read the guide before use.',
        },
        puwdesk: {
          category: 'Live wallpaper',
          description: 'Turn your desktop into a calm, living space.',
          unreleased: 'Preparing for release. Downloads will appear once published on GitHub Releases.',
          intro: 'An interactive live wallpaper for Windows, written in Rust. The Floating Sky Garden brings trees, flowers, clouds, and gentle motion to your desktop.',
          features: [
            'Reacts softly to pointer movement and shifts between day and night by local time.',
            'Automatically pauses when covered by maximized or fullscreen windows, lock screen, or display off.',
            'Vietnamese–English settings, reduced-motion support, and start with Windows.',
          ],
          note: 'The download button automatically checks for the latest stable GitHub Release and stays inactive until published.',
        },
        puwbar: {
          category: 'Taskbar',
          description: 'Floating frosted glass taskbar for Windows 11, with native features intact.',
          intro: 'Splits the Windows 11 taskbar into rounded frosted-glass pills for apps, the System Tray, and Widgets — built in Rust + C++/WinRT as a single puwbar.exe.',
          features: [
            'Real-time backdrop blur via Windows.UI.Composition while keeping Explorer, Start menu, tray animations, and window previews intact.',
            'Adapts live across all 4 edges (Bottom / Top / Left / Right) and Left / Center alignment with VSync-locked 300ms slide animations.',
            'Single ~870 KB executable (~1.2 MB idle RAM), Vietnamese–English tray menu, Start with Windows, and clean restore on exit (Ctrl+Alt+F12).',
          ],
          note: 'Built for Windows 11 (x64), no Windhawk or Visual C++ Redistributable needed. Disable any active Windhawk taskbar mod before running.',
        },
        puwvga: {
          category: 'Graphics / GPU',
          description: 'Control GPUs from all three major makers — NVIDIA, AMD, and Intel — in one place.',
          unreleased: 'Preparing for release. Downloads will appear once published on GitHub Releases.',
          intro: 'A unified Windows GPU control center built for graphics cards from all three major vendors: NVIDIA, AMD, and Intel.',
          note: 'This project is being prepared for GitHub. Full details and stable downloads will appear automatically once published on GitHub Releases.',
        },
      },
    },
  };

  function getLang() {
    return root.dataset.lang === 'en' ? 'en' : 'vi';
  }
  function getStrings() {
    return copy[getLang()];
  }
  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }
  function setAttr(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }
  function buildProjectDetails(id) {
    const lang = getLang();
    if (lang === 'en') {
      const info = copy.en.projects[id];
      if (info && info.intro) {
        const nodes = [];
        const intro = document.createElement('p');
        intro.textContent = info.intro;
        nodes.push(intro);
        if (Array.isArray(info.features) && info.features.length) {
          const list = document.createElement('ul');
          list.className = 'feature-list';
          for (const item of info.features) {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
          }
          nodes.push(list);
        }
        if (info.note) {
          const note = document.createElement('p');
          note.className = 'detail-note';
          note.textContent = info.note;
          nodes.push(note);
        }
        return nodes;
      }
    }
    const template = document.querySelector(`#${id}-details`);
    return template ? [template.content.cloneNode(true)] : null;
  }
  function syncTheme() {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemTheme.matches;
    const t = getStrings();
    const label = dark ? t.toLight : t.toDark;
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = getComputedStyle(root).getPropertyValue('--page').trim();
  }
  function renderCardVersion(card, release) {
    const badge = card.querySelector('.card-version');
    if (!badge || !release) return;
    if (release.version) {
      badge.textContent = release.version;
      badge.dataset.state = 'released';
      badge.hidden = false;
    } else if (release.status === 'unreleased') {
      badge.textContent = getStrings().comingSoon;
      badge.dataset.state = 'unreleased';
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }
  async function loadCardVersion(card) {
    const id = card.dataset.project;
    if (!id || releaseCache.has(id)) {
      renderCardVersion(card, releaseCache.get(id));
      return;
    }
    releaseCache.set(id, null);
    try {
      const repo = new URL(card.href).pathname.split('/').pop();
      const release = await resolveLatestRelease(repo);
      releaseCache.set(id, release);
      renderCardVersion(card, release);
    } catch {
      releaseCache.delete(id);
    }
  }
  function syncLang() {
    const lang = getLang();
    const t = copy[lang];
    root.lang = lang;
    root.dataset.lang = lang;
    if (typeof document.title === 'string') document.title = t.title;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.content = t.metaDescription;
    setText('.skip-link', t.skipLink);
    setAttr('.wordmark', 'aria-label', t.wordmarkLabel);
    setAttr('.nav-glass', 'aria-label', t.navLabel);
    if (langButton) {
      langButton.setAttribute('aria-label', t.switchLang);
      langButton.title = t.switchLang;
      langButton.setAttribute('aria-pressed', String(lang === 'en'));
    }
    setText('.eyebrow', t.eyebrow);
    setText('#hero-title', t.heroTitle);
    setText('#hero-desc-main', t.heroDescription);
    setText('#hero-desc-origin', t.heroOrigin);
    setText('#hero-cta-label', t.heroCta);
    setText('#projects-title', t.projectsTitle);
    setText('#footer-copy', t.footerCopy);
    setAttr('#project-filters', 'aria-label', t.filterLabel);
    for (const key of filterIds) setText(`#filter-${key}`, t.filters[key]);
    setAttr('#dialog-close', 'aria-label', t.dialogClose);
    setText('#dialog-repo-label', t.viewGithub);
    projectCards.forEach(card => {
      const info = t.projects[card.dataset.project];
      if (!info) return;
      const cat = card.querySelector('.project-category');
      const desc = card.querySelector('p');
      if (cat) cat.textContent = info.category;
      if (desc) desc.textContent = info.description;
      renderCardVersion(card, releaseCache.get(card.dataset.project));
    });
    syncTheme();
    if (activeCard && dialog.open) {
      document.querySelector('#dialog-description').textContent = activeCard.querySelector('p').textContent;
      document.querySelector('#dialog-category').textContent = activeCard.querySelector('.project-category').textContent;
      const details = buildProjectDetails(activeCard.dataset.project);
      if (details) document.querySelector('#dialog-details').replaceChildren(...details);
      updateDownload(activeCard);
    }
  }
  function applyFilter(next) {
    activeFilter = filterIds.includes(next) ? next : 'all';
    let visible = 0;
    projectCards.forEach(card => {
      const match = activeFilter === 'all' || card.dataset.group === activeFilter;
      card.hidden = !match;
      if (match) visible += 1;
    });
    if (projectGrid) {
      if (activeFilter === 'all') {
        delete projectGrid.dataset.filtered;
        delete projectGrid.dataset.count;
      } else {
        projectGrid.dataset.filtered = 'true';
        projectGrid.dataset.count = String(visible);
      }
    }
    for (const key of filterIds) {
      const btn = document.querySelector(`#filter-${key}`);
      if (btn) btn.setAttribute('aria-pressed', String(key === activeFilter));
    }
  }
  if (filterBar) {
    filterBar.hidden = false;
    for (const key of filterIds) {
      const btn = document.querySelector(`#filter-${key}`);
      if (btn) btn.addEventListener('click', () => applyFilter(key));
    }
  }
  themeButton.hidden = false;
  if (langButton) {
    langButton.hidden = false;
    langButton.addEventListener('click', () => {
      root.dataset.lang = getLang() === 'en' ? 'vi' : 'en';
      try { localStorage.setItem('erikpuw-lang', root.dataset.lang); } catch { /* Language toggle still works without storage. */ }
      syncLang();
    });
  }
  syncLang();
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
        loadCardVersion(entry.target);
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
    const from = { transform: current?.transform || 'translateY(10px)' };
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
    const to = { transform: entering ? 'translateY(0px)' : 'translateY(10px)' };
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
    const t = getStrings();
    const download = document.querySelector('#dialog-download');
    const label = document.querySelector('#dialog-download-label');
    const status = document.querySelector('#dialog-download-status');
    download.setAttribute('aria-disabled', 'true');
    download.setAttribute('aria-busy', 'true');
    download.setAttribute('tabindex', '-1');
    download.removeAttribute('href');
    download.removeAttribute('title');
    label.textContent = t.downloadWin;
    status.textContent = t.checkingRelease;
    const repo = new URL(card.href).pathname.split('/').pop();
    const release = await resolveLatestRelease(repo);
    releaseCache.set(card.dataset.project, release);
    renderCardVersion(card, release);
    if (activeCard !== card || request !== downloadRequest) return;
    const current = getStrings();
    download.removeAttribute('aria-busy');
    if (release.status === 'unreleased') {
      const info = current.projects[card.dataset.project];
      status.textContent = getLang() === 'en'
        ? (info?.unreleased || current.unreleasedDefault)
        : (card.dataset.unreleasedMessage || info?.unreleased || current.unreleasedDefault);
      return;
    }
    download.href = release.url || `${card.href}/releases/latest`;
    label.textContent = release.status === 'download' ? current.downloadWin : current.viewReleases;
    if (release.status === 'download') {
      status.textContent = `${release.version} · ${release.filename}`;
      download.title = `${release.version} — ${release.filename}`;
    } else if (release.status === 'manual') {
      status.textContent = current.manualRelease(release.version);
    } else {
      status.textContent = current.unavailableRelease;
    }
    download.removeAttribute('aria-disabled');
    download.removeAttribute('tabindex');
  }
  function openProject(card) {
    const details = buildProjectDetails(card.dataset.project);
    if (activeCard || !details) return;
    activeCard = card;
    document.querySelector('#dialog-title').textContent = card.querySelector('h3').textContent;
    document.querySelector('#dialog-description').textContent = card.querySelector('p').textContent;
    document.querySelector('#dialog-category').textContent = card.querySelector('.project-category').textContent;
    document.querySelector('#dialog-repository').href = card.href;
    const art = getProjectArtwork(card, 'high');
    document.querySelector('#dialog-art').replaceChildren(art);
    document.querySelector('#dialog-details').replaceChildren(...details);
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
