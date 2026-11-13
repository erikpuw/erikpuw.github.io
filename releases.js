async function resolveLatestRelease(repo) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.github.com/repos/erikpuw/${encodeURIComponent(repo)}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status === 404) return { status: 'unreleased' };
    if (!response.ok) throw new Error('Release lookup failed');
    const release = await response.json();
    if (!Array.isArray(release.assets) || typeof release.tag_name !== 'string' || release.draft || release.prerelease) {
      throw new Error('Invalid release metadata');
    }
    const files = release.assets.filter(asset => {
      if (!asset || asset.state !== 'uploaded' || typeof asset.name !== 'string' || !/\.(exe|msi|zip)$/i.test(asset.name)) return false;
      if (/(?:^|[-_.])(arm64|aarch64|source|sources|symbols|debug)(?:[-_.]|$)/i.test(asset.name)) return false;
      try {
        const url = new URL(asset.browser_download_url);
        return url.origin === 'https://github.com' && !url.username && !url.password &&
          url.pathname.startsWith(`/erikpuw/${repo}/releases/download/`);
      } catch { return false; }
    });
    const executable = files.find(asset => asset.name.toLowerCase() === `${repo}.exe`.toLowerCase());
    const file = executable || (files.length === 1 ? files[0] : null);
    if (!file) return { status: 'manual', version: release.tag_name };
    return { status: 'download', version: release.tag_name, filename: file.name, url: file.browser_download_url };
  } catch {
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}
