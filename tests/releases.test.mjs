import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../releases.js', import.meta.url), 'utf8');

function resolver(fetch) {
  const context = vm.createContext({ fetch, URL, AbortController, setTimeout, clearTimeout });
  vm.runInContext(source, context);
  return context.resolveLatestRelease;
}

function asset(repo, name, url) {
  return { name, state: 'uploaded', browser_download_url: url || `https://github.com/erikpuw/${repo}/releases/download/v1/${name}` };
}

function releaseResponse(assets, tag = 'v1', status = 200) {
  return { ok: status === 200, status, json: async () => ({ tag_name: tag, assets }) };
}

test('downloads versioned files from the current latest release without a fixed version', async () => {
  for (const tag of ['v1.0.2', 'v9.2.4']) {
    const name = `LenovoToolkit_${tag}.zip`;
    const resolve = resolver(async (url, options) => {
      assert.equal(url, 'https://api.github.com/repos/erikpuw/lenovo-toolkit/releases/latest');
      assert.equal(options.cache, 'no-store');
      return releaseResponse([asset('lenovo-toolkit', name)], tag);
    });
    const result = await resolve('lenovo-toolkit');
    assert.equal(result.status, 'download');
    assert.equal(result.version, tag);
    assert.equal(result.filename, name);
    assert.ok(result.url.endsWith(name));
  }
});

test('prefers the named executable when the release also has other packages', async () => {
  for (const repo of ['puw_notch', 'puw-player']) {
    const name = `${repo}.exe`;
    const resolve = resolver(async () => releaseResponse([asset(repo, `${repo}.zip`), asset(repo, name)]));
    const result = await resolve(repo);
    assert.equal(result.status, 'download');
    assert.equal(result.filename, name);
  }
});

test('does not offer a download when the project has no published release', async () => {
  const resolve = resolver(async () => releaseResponse([], '', 404));
  assert.equal((await resolve('jarvis-windows')).status, 'unreleased');
});

test('uses a manual release page when no unique Windows file can be chosen', async () => {
  for (const assets of [[], [asset('jarvis-windows', 'setup.exe'), asset('jarvis-windows', 'portable.zip')]]) {
    const resolve = resolver(async () => releaseResponse(assets));
    assert.equal((await resolve('jarvis-windows')).status, 'manual');
  }
});

test('rejects external download URLs, source bundles, and ARM files', async () => {
  const resolve = resolver(async () => releaseResponse([
    asset('puw-player', 'puw-player.exe', 'https://example.com/untrusted.exe'),
    asset('puw-player', 'puw-player-arm64.exe'),
    asset('puw-player', 'source.zip'),
  ]));
  assert.equal((await resolve('puw-player')).status, 'manual');
});

test('recovers from API limits, network errors, and malformed metadata', async () => {
  const fetches = [
    async () => releaseResponse([], '', 403),
    async () => { throw new Error('offline'); },
    async () => ({ ok: true, json: async () => ({ assets: 'invalid' }) }),
  ];
  for (const fetch of fetches) {
    assert.equal((await resolver(fetch)('puw-player')).status, 'unavailable');
  }
});
