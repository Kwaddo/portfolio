import { expect, test } from '@playwright/test';
import { site } from '../src/data/site';
import { toAddress, toSpelledOut } from '../src/lib/email';

test('the copy button copies the assembled address', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(toAddress(site.emailParts));
});

test.describe('without javascript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the spelled-out address and no copy button', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.getByText(toSpelledOut(site.emailParts))).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy email' })).toHaveCount(0);
  });
});
