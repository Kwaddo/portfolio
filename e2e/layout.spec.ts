import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/work/',
  '/work/tanami/',
  '/work/cuspio/',
  '/personal/',
  '/personal/games/smobb/',
  '/personal/games/smobb/play/',
  '/personal/games/skoobl/',
  '/personal/games/gridlock/',
  '/personal/lab/nocturne-network/',
  '/personal/lab/smart-road/',
  '/about/',
  '/contact/',
  '/journal/',
  '/resume/',
  '/uses/',
  '/404.html',
];

// every tap target is at least 44x44 on the phone; inline links inside running text are the one exemption
test('touch targets are at least 44px on the phone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'phone project only');
  for (const route of ['/', '/about/', '/personal/', '/personal/games/smobb/', '/personal/games/smoke-break/play/', '/contact/', '/journal/', '/resume/', '/404.html']) {
    await page.goto(route);
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('a, button')) {
        if (el.hidden) continue;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (!el.matches('.btn') && el.closest('p, .prose')) continue; // a link in running text
        const { width, height } = el.getBoundingClientRect();
        if (!width && !height) continue;
        if (width < 44 || height < 44) out.push(`${el.tagName} ${el.className} "${el.textContent?.trim().slice(0, 20)}" ${Math.round(width)}x${Math.round(height)}`);
      }
      return out;
    });
    expect(small, route).toEqual([]);
  }
});

for (const dir of ['ltr', 'rtl'] as const) {
  for (const route of routes) {
    test(`${route} fits the viewport (${dir})`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status(), `${route} should exist`).toBe(200);
      await page.evaluate((d) => {
        document.documentElement.dir = d;
      }, dir);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      // side margins: nothing but backgrounds passes the wrap's edges (the wrap box includes its gutter padding); measured once the opening slide has settled
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
      const outside = await page.evaluate(() => {
        const wrap = document.querySelector('main .wrap') ?? document.querySelector('.wrap');
        if (!wrap) return [];
        const { left, right } = wrap.getBoundingClientRect();
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('.panel, .strip__link, .bubble, .frame, .timeline__item, .chapter__text, .chapter__side, .notice, .player, .btn, .badge, .frame__cap, img, .split__door h2, .split__door p, .sfx > span')) {
          if (el.closest('.nav, .footer')) continue;
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          let { left: l, right: r, width } = el.getBoundingClientRect();
          if (!width) continue;
          if (el.matches('.sfx > span, .split__door h2')) {
            const range = document.createRange();
            range.selectNodeContents(el);
            ({ left: l, right: r } = range.getBoundingClientRect());
          }
          if (l < left - 1 || r > right + 1) out.push(`${el.tagName} ${el.className} ${Math.round(l - left)}/${Math.round(r - right)}`);
        }
        return out;
      });
      expect(outside).toEqual([]);
      // nothing scrolls past the footer
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const past = await page.evaluate(() => {
        const footer = document.querySelector('.footer')!.getBoundingClientRect();
        return document.documentElement.scrollHeight - (footer.bottom + window.scrollY);
      });
      expect(past).toBeLessThanOrEqual(1);
    });
  }
}

test('back to top hides on a page with nothing to scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop only: the empty journal outgrows a phone screen');
  await page.goto('/journal/');
  await expect(page.locator('[data-top]')).toBeHidden();
  await page.goto('/about/');
  await expect(page.locator('[data-top]')).toBeVisible();
});
