import { describe, expect, test } from 'vitest';
import { distPathFor, extractTargets, hasId, sameDocFragments } from '../scripts/links';

describe('extractTargets', () => {
  test('keeps internal href and src, strips query and fragment', () => {
    const html = '<a href="/work/#x">a</a><img src="/_astro/a.webp?v=1"><a href="https://x.dev/">e</a><a href="//cdn.x/a">p</a><a href="mailto:a@b.c">m</a><a href="#top">f</a>';
    expect(extractTargets(html)).toEqual(['/work/', '/_astro/a.webp']);
  });
  test('reads srcset candidates', () => {
    expect(extractTargets('<img srcset="/a.webp 400w, /b.webp 800w">')).toEqual(['/a.webp', '/b.webp']);
  });
});

describe('distPathFor', () => {
  test('directory paths resolve to index.html', () => {
    expect(distPathFor('/work/')).toEqual(['work/index.html']);
    expect(distPathFor('/')).toEqual(['index.html']);
  });
  test('file paths resolve to themselves', () => {
    expect(distPathFor('/rss.xml')).toEqual(['rss.xml']);
  });
  test('extensionless paths try the file and the directory', () => {
    expect(distPathFor('/work')).toEqual(['work', 'work/index.html']);
  });
});

describe('fragments', () => {
  test('sameDocFragments lists ids linked from the page', () => {
    expect(sameDocFragments('<a href="#main">m</a><a href="/x/#y">n</a>')).toEqual(['main']);
  });
  test('hasId finds an element id', () => {
    expect(hasId('<main id="main">', 'main')).toBe(true);
    expect(hasId('<main id="other">', 'main')).toBe(false);
    expect(hasId('<div data-id="main">', 'main')).toBe(false);
  });
});
