import { expect, test, type TestInfo } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const desktopOnly = (testInfo: TestInfo) => test.skip(testInfo.project.name !== 'desktop', 'desktop project only');

for (const figure of ['a', 'b'] as const) {
  test(`the hero word is lettered over figure ${figure}`, async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.addInitScript((f) => {
      sessionStorage.setItem('figure', f);
      sessionStorage.setItem('hero', '1');
    }, figure);
    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('.hero__figure img').waitFor();
      // the figure layer ignores the pointer; let hit-testing see every layer of the cell
      await page.addStyleTag({ content: '.hero__end-cell * { pointer-events: auto !important; }' });
      const onTop = await page.evaluate(() => {
        const span = document.querySelector('.hero__end-cell > .sfx > span');
        const text = span?.firstChild;
        if (!text?.textContent) return 'no word above the figure';
        const range = document.createRange();
        range.setStart(text, text.textContent.length - 1);
        range.setEnd(text, text.textContent.length);
        const r = range.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit?.closest('.sfx') ? 'ok' : `covered by ${hit?.tagName}`;
      });
      expect(onTop, `${width}px`).toBe('ok');
    }
  });
}

test('the Say Hello panel says PSST, and HUH? is left to the 404 page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.wwm .sfx')).toHaveText('PSST');
  await expect(page.locator('main .sfx', { hasText: 'HUH?' })).toHaveCount(0);
});

test('the work timeline word clears every entry', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/work/');
  const hits = await page.evaluate(() => {
    // the visible word: its lettering box cut to the clipping box around it
    const sfx = document.querySelector('.spread--ink > .sfx')!;
    const a = sfx.getBoundingClientRect();
    const b = sfx.querySelector('span')!.getBoundingClientRect();
    const word = { left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) };
    return [...document.querySelectorAll('.spread--ink .timeline__item')].filter((li) => {
      const r = li.getBoundingClientRect();
      return r.left < word.right && r.right > word.left && r.top < word.bottom && r.bottom > word.top;
    }).length;
  });
  expect(hits).toBe(0);
});
