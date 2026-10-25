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
  '/personal/lab/nocturne-network/',
  '/about/',
  '/contact/',
  '/journal/',
  '/resume/',
  '/uses/',
  '/404.html',
];

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
