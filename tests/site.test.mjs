import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');

test('owner is consistently erikpuw and page metadata is present', () => {
  assert.match(html, /<title>erikpuw/);
  assert.doesNotMatch(html, /Erik\s*PUW|Erik\s*Puw|ERIK\s*PUW/);
  assert.match(html, /<html lang="vi"/);
  assert.match(html, /name="description"/);
  assert.match(html, /rel="canonical" href="https:\/\/erikpuw.github.io\/"/);
});

test('all four project links work without JavaScript and have unique details', () => {
  const cards = [...html.matchAll(/<a\b[^>]*class="project-card[^\"]*"[^>]*>/g)].map(([tag]) => tag);
  assert.equal(cards.length, 4);
  for (const [id, repo] of [
    ['jarvis', 'jarvis-windows'], ['notch', 'puw_notch'],
    ['player', 'puw-player'], ['toolkit', 'lenovo-toolkit'],
  ]) {
    const card = cards.find(tag => tag.includes(`data-project="${id}"`));
    assert.ok(card, `missing ${id} card`);
    assert.ok(card.includes(`href="https://github.com/erikpuw/${repo}"`));
    assert.equal((html.match(new RegExp(`id="${id}-details"`, 'g')) || []).length, 1);
  }
});

test('local page assets exist and external tabs are protected', () => {
  const references = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]);
  for (const file of references.filter(value => !/^https?:/.test(value))) {
    assert.ok(existsSync(new URL(file, root)), `missing ${file}`);
  }
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(tag, /rel="[^"]*noopener/);
  }
});

test('dialog and theme controls retain accessible names and motion fallbacks', () => {
  assert.match(html, /<dialog[^>]*aria-labelledby="dialog-title"/);
  assert.match(html, /id="theme-toggle"[^>]*aria-label="[^"]+"/);
  assert.match(html, /id="dialog-close"[^>]*aria-label="[^"]+"/);
  const css = readFileSync(new URL('styles.css', root), 'utf8');
  const js = readFileSync(new URL('app.js', root), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-reduced-transparency: reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /startViewTransition/);
  assert.match(js, /showModal/);
  assert.match(js, /'cancel'/);
});

test('project artwork keeps its aspect ratio in cards and details', () => {
  const css = readFileSync(new URL('styles.css', root), 'utf8');
  const js = readFileSync(new URL('app.js', root), 'utf8');
  assert.equal((html.match(/preserveAspectRatio="xMidYMid slice"/g) || []).length, 8);
  assert.doesNotMatch(css, /object-fit:\s*fill/);
  assert.match(css, /\.dialog-art > img[^}]*object-fit:\s*contain/);
  assert.match(js, /assets\/detail-\$\{card\.dataset\.project\}\.webp/);
  for (const id of ['jarvis', 'notch', 'player', 'toolkit']) {
    assert.ok(existsSync(new URL(`assets/detail-${id}.webp`, root)), `missing ${id} detail art`);
  }
});
