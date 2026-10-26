import { describe, expect, test } from 'vitest';
import { assetPaths, BUDGET_BYTES, fontUrls, isLatinFont } from '../scripts/budget';

describe('assetPaths', () => {
  test('finds internal stylesheets and scripts only', () => {
    const html =
      '<link rel="stylesheet" href="/_astro/a.css"><link rel="stylesheet" href="https://x.dev/b.css"><script type="module" src="/_astro/a.js"></script><link rel="icon" href="/favicon.svg">';
    expect(assetPaths(html)).toEqual({ css: ['/_astro/a.css'], js: ['/_astro/a.js'] });
  });
});

describe('assetPaths attribute order', () => {
  test('finds a stylesheet whose href comes before rel', () => {
    expect(assetPaths('<link href="/_astro/b.css" rel="stylesheet">').css).toEqual(['/_astro/b.css']);
  });
});

describe('fontUrls', () => {
  test('lists woff2 urls in a stylesheet', () => {
    const css = '@font-face{src:url(/_astro/inter-latin-wght-normal.abc.woff2) format("woff2")}@font-face{src:url(/_astro/x.woff) format("woff")}';
    expect(fontUrls(css)).toEqual(['/_astro/inter-latin-wght-normal.abc.woff2']);
  });

  test('tolerates quotes and query strings', () => {
    expect(fontUrls('@font-face{src:url("/_astro/a.woff2") format("woff2")}')).toEqual(['/_astro/a.woff2']);
    expect(fontUrls("@font-face{src:url('/_astro/a.woff2')}")).toEqual(['/_astro/a.woff2']);
    expect(fontUrls('@font-face{src:url(/_astro/a.woff2?v=1)}')).toEqual(['/_astro/a.woff2']);
  });
});

describe('isLatinFont', () => {
  test('accepts the latin subsets the page downloads', () => {
    expect(isLatinFont('/_astro/inter-latin-wght-normal.Dx4kXJAl.woff2')).toBe(true);
    expect(isLatinFont('/_astro/anton-latin-400-normal.Byf51wtH.woff2')).toBe(true);
  });
  test('rejects other subsets', () => {
    expect(isLatinFont('/_astro/inter-latin-ext-wght-normal.DO1Apj_S.woff2')).toBe(false);
    expect(isLatinFont('/_astro/inter-cyrillic-wght-normal.Dq.woff2')).toBe(false);
  });
  test('the budget is the spec value', () => {
    expect(BUDGET_BYTES).toBe(200_000);
  });
});
