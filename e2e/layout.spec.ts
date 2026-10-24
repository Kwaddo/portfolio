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
];

for (const dir of ['ltr', 'rtl'] as const) {
  for (const route of routes) {
    test(`${route} fits the viewport (${dir})`, async ({ page }) => {
      await page.goto(route);
      await page.evaluate((d) => {
        document.documentElement.dir = d;
      }, dir);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
