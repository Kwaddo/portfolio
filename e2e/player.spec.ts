import { expect, test } from '@playwright/test';

test('the game iframe exists only after clicking Play, and is sandboxed', async ({ page }) => {
  await page.route('https://kwaddo.github.io/**', (route) => route.abort());
  await page.goto('/personal/games/smobb/play/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: /^Play/ }).click();
  const frame = page.locator('iframe');
  await expect(frame).toBeFocused();
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen');
  await expect(frame).toHaveAttribute('allow', 'fullscreen');
  await expect(frame).toHaveAttribute('allowfullscreen', '');
  await expect(frame).toHaveAttribute('src', 'https://kwaddo.github.io/smobb/');
});

test('the player keeps the keys until the visitor clicks outside it', async ({ page }) => {
  await page.route('https://kwaddo.github.io/**', (route) => route.abort());
  await page.goto('/personal/games/smobb/play/');
  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.locator('iframe')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  // pressing the player keeps the frame focused
  const stage = page.locator('.player__stage');
  await stage.click({ position: { x: 5, y: 5 } });
  await expect(page.locator('iframe')).toBeFocused();
  // a click outside hands the keys back to the page
  await page.locator('h1').click();
  await expect(page.locator('iframe')).not.toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});
