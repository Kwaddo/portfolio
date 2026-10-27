import { describe, expect, test } from 'vitest';
import { findViolations, ogImageOf } from '../scripts/dist-rules';
import { site } from '../src/data/site';
import { toAddress, toSpelledOut } from '../src/lib/email';

const decode = (b64: string) => Buffer.from(b64, 'base64').toString();
const address = toAddress(site.emailParts);

const ok = '<html><body><h1>Ali Khalaf</h1><a href="https://github.com/Kwaddo">GitHub</a></body></html>';

describe('findViolations', () => {
  test('a clean page passes, and a handle inside a URL is allowed', () => {
    expect(findViolations('index.html', ok)).toEqual([]);
  });
  test('flags AI tooling names', () => {
    expect(findViolations('a/index.html', `<p>Built with ${decode('Q2xhdWRl')}</p>`)).toHaveLength(1);
    expect(findViolations('a/index.html', `<p>${decode('Y28tYXV0aG9yZWQ=')}-by someone</p>`)).toHaveLength(1);
  });
  test('flags the phone number', () => {
    expect(findViolations('a/index.html', '<p>+973 3600 1234</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<p>36001234</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<p>3600-1234</p>')).toHaveLength(1);
  });
  test('does not flag years or build hashes as phone numbers', () => {
    expect(findViolations('a/index.html', '<p>Updated 2026</p>')).toEqual([]);
    expect(findViolations('a/index.html', '<p class="astro-a1b2c3d4">x</p>')).toEqual([]);  });
  test('flags a plain email address and a mailto link in markup', () => {
    expect(findViolations('a/index.html', `<p>${address}</p>`)).toHaveLength(1);
    expect(findViolations('a/index.html', '<a href="mailto:x@y.z">x</a>')).toHaveLength(1);
  });
  test('allows the string mailto: inside a script (the client-side assembler)', () => {
    expect(findViolations('a/index.html', '<script>link.href=`mailto:${a}`</script>')).toEqual([]);
  });
  test('still flags the plain address inside a script', () => {
    expect(findViolations('a/index.html', `<script>x="${address}"</script>`)).toHaveLength(1);
  });
  test('allows the spelled-out email', () => {
    expect(findViolations('a/index.html', `<p>${toSpelledOut(site.emailParts)}</p>`)).toEqual([]);
  });
  test('flags media on the confidential Tanami page', () => {
    expect(findViolations('work/tanami/index.html', '<img src="/x.png">')).toHaveLength(1);
    expect(findViolations('work/cuspio/index.html', '<img src="/x.png">')).toEqual([]);
  });
  test('allows only the aria-hidden KWADDO sfx word as handle text', () => {
    const sfx = '<span class="sfx sfx--paper" aria-hidden="true" style="--sfx-rotate: -8deg"><span>KWADDO</span></span>';
    expect(findViolations('index.html', `<div>${sfx}</div>`)).toEqual([]);
    expect(findViolations('index.html', `<div>${sfx}<p>by Kwaddo</p></div>`)).toHaveLength(1);
    expect(findViolations('index.html', '<span class="sfx"><span>KWADDO</span></span>')).toHaveLength(1);
    // hero only: the same word on any other page is a violation
    expect(findViolations('about/index.html', `<div>${sfx}</div>`)).toHaveLength(1);
    expect(findViolations('about/index.html', `<div>${sfx}<p>by Kwaddo</p></div>`)).toHaveLength(1);
  });

  test('flags the Kwaddo handle as visible text but not in attributes', () => {
    expect(findViolations('a/index.html', '<p>by Kwaddo</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<a href="https://alikhalaf.fn.dilmune.app/">x</a>')).toEqual([]);
  });
  test('allows the handle inside JSON-LD URLs', () => {
    const ld = '<script type="application/ld+json">{"url":"https://github.com/Kwaddo"}</script>';
    expect(findViolations('a/index.html', ld)).toEqual([]);
  });
  test('flags Quad anywhere', () => {
    expect(findViolations('a/index.html', '<p>Quad</p>')).toHaveLength(1);
  });
});

describe('findViolations on xml', () => {
  test('a sitemap with the site URL in <loc> passes', () => {
    expect(findViolations('sitemap-0.xml', '<urlset><url><loc>https://alikhalaf.fn.dilmune.app/x/</loc></url></urlset>')).toEqual([]);
  });
  test('RSS link and guid URLs pass, but the handle in a description is flagged', () => {
    const item = (d: string) => `<item><link>https://alikhalaf.fn.dilmune.app/j/</link><guid isPermaLink="true">https://alikhalaf.fn.dilmune.app/j/</guid><description>${d}</description></item>`;
    expect(findViolations('rss.xml', item('hello'))).toEqual([]);
    expect(findViolations('rss.xml', item('by Kwaddo'))).toHaveLength(1);
  });
  test('other rules still scan the whole xml', () => {
    expect(findViolations('rss.xml', `<description>${address}</description>`)).toHaveLength(1);
    expect(findViolations('rss.xml', `<description>${decode('Q2xhdWRl')}</description>`)).toHaveLength(1);
  });
});

describe('ogImageOf', () => {
  test('reads the path of the og:image meta tag', () => {
    const html = '<meta property="og:image" content="https://alikhalaf.fn.dilmune.app/og/work.png" />';
    expect(ogImageOf(html)).toBe('/og/work.png');
  });
  test('returns undefined when absent', () => {
    expect(ogImageOf('<html></html>')).toBeUndefined();
  });
});
