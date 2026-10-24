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
  await expect(frame).toHaveAttribute('src', 'https://kwaddo.github.io/smobb/');
});
