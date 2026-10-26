import { expect, test } from '@playwright/test';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing animates and everything is visible', async ({ page }) => {
    await page.goto('/personal/');
    await page.waitForTimeout(300);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running).toBe(0);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
  });
});

test('panels reveal as they scroll into view', async ({ page }) => {
  await page.goto('/personal/');
  const count = await page.locator('[data-reveal]').count();
  expect(count).toBeGreaterThan(0);
  await page.mouse.wheel(0, 20000);
  await page.waitForTimeout(800);
  const notIn = await page.locator('[data-reveal]:not(.is-in)').count();
  expect(notIn).toBe(0);
});

test('client-side navigation wipes to the new page without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Work', exact: true }).first().click();
  await expect(page).toHaveURL(/\/work\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Work');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const focused = await page.evaluate(() => document.activeElement?.id);
  expect(focused).toBe('main');
});
