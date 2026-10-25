import { expect, test } from '@playwright/test';
import { site } from '../src/data/site';
import { toAddress } from '../src/lib/email';

// Component scripts must initialise the page reached by a client-side navigation, not only the first full load.

test('the copy button appears after a client-side navigation to the contact page', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('link', { name: 'Get in touch' }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  const button = page.getByRole('button', { name: 'Copy email' });
  await expect(button).toBeVisible();
  await expect(page.locator('[data-email-link]')).toHaveText(toAddress(site.emailParts));
  await button.click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  // bound once: a second click still reports a single copy, not two status flips
  await button.click();
  await expect(page.getByRole('status')).toHaveText('Copied');
});

test('the player starts after a client-side navigation to the play page', async ({ page }) => {
  await page.route('https://kwaddo.github.io/**', (route) => route.abort());
  await page.goto('/personal/games/smobb/');
  await page.getByRole('link', { name: 'Play', exact: true }).click();
  await expect(page).toHaveURL(/\/play\/$/);
  await page.getByRole('button', { name: /^Play/ }).click();
  const frame = page.locator('iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toBeFocused();
});

test('the player still works after navigating away and back', async ({ page }) => {
  await page.route('https://kwaddo.github.io/**', (route) => route.abort());
  await page.goto('/personal/games/smobb/play/');
  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.locator('iframe')).toBeFocused();
  await expect(page.locator('html')).toHaveClass(/is-playing/);
  // away: the scroll lock lifts with the frame
  await page.getByRole('link', { name: 'Get in touch' }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.locator('html')).not.toHaveClass(/is-playing/);
  await expect(page.locator('iframe')).toHaveCount(0);
  // back (history): a fresh player, one iframe after one click
  await page.goBack();
  await expect(page).toHaveURL(/\/play\/$/);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect(page.locator('iframe')).toBeFocused();
});

test('the hero picker and reveals run again on the way back to the landing page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Work', exact: true }).first().click();
  await expect(page).toHaveURL(/\/work\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveClass(/js/);
  await expect(page.locator('img[data-figure]:not([hidden])')).toHaveCount(1);
  await page.mouse.wheel(0, 20000);
  await page.waitForTimeout(800);
  await expect(page.locator('[data-reveal]:not(.is-in)')).toHaveCount(0);
});
