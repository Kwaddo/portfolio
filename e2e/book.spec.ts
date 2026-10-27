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
  await expect(page.locator('.wwm__ink > .sfx')).toHaveText('PSST');
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

test('SFX letter in more than one look', async ({ page }) => {
  await page.goto('/personal/');
  await expect(page.locator('.sfx.sfx--rough')).toHaveCount(1);
  await expect(page.locator('.sfx.sfx--motion')).toHaveCount(1);
  await page.goto('/');
  await expect(page.locator('.wwm__ink > .sfx.sfx--burst')).toHaveCount(1);
  await page.goto('/404.html');
  await expect(page.locator('.sfx.sfx--rough')).toHaveCount(1);
});

test('section pages open as numbered chapters', async ({ page }) => {
  for (const [route, label] of [['/work/', 'Chapter 01'], ['/personal/', 'Chapter 02'], ['/journal/', 'Chapter 03'], ['/about/', 'Chapter 04'], ['/contact/', 'Chapter 05']] as const) {
    await page.goto(route);
    await expect(page.locator('main .kicker').first(), route).toHaveText(label);
  }
});

test('the landing doors read as a contents page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.split__contents')).toHaveText('Contents');
  await expect(page.locator('.split__door--work .kicker')).toHaveText('Ch. 01');
  await expect(page.locator('.split__door--personal .kicker')).toHaveText('Ch. 02');
});

test('the landing is framed as a volume cover', async ({ page }, testInfo) => {
  const year = String(new Date().getFullYear());
  await page.goto('/');
  await expect(page.locator('.cover__vol')).toHaveText('Vol. 01');
  await expect(page.locator('.cover__stamp')).toContainText('AK');
  await expect(page.locator('.cover__stamp')).toContainText(year);
  await expect(page.locator('.cover__spine')).toBeVisible({ visible: testInfo.project.name === 'desktop' });
  await expect(page.locator('footer')).toContainText(`${year} Ali Khalaf · Vol. 01`);
});

test('every spread carries a page number', async ({ page }) => {
  for (const route of ['/', '/work/', '/personal/', '/personal/games/skoobl/']) {
    await page.goto(route);
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('main .spread')].filter((el) => !getComputedStyle(el, '::after').content.includes('counter(folio')).length,
    );
    expect(missing, route).toBe(0);
  }
});

test('the next panel reads TO BE CONTINUED', async ({ page }) => {
  await page.goto('/personal/games/skoobl/');
  const next = page.locator('a.next-panel');
  await expect(next.locator('.tbc')).toHaveText('To be continued');
  await expect(next.locator('.sfx')).toHaveCount(0);
  await expect(next).toContainText('Smoke Break');
});

test('cards are art first: no letter fillers, a caption box on every card', async ({ page }) => {
  for (const route of ['/work/', '/personal/']) {
    await page.goto(route);
    await expect(page.locator('.panel__initial'), route).toHaveCount(0);
    const cards = await page.locator('a.panel.card').count();
    expect(cards, route).toBeGreaterThan(0);
    await expect(page.locator('a.panel.card .panel__cap'), route).toHaveCount(cards);
  }
  await page.goto('/work/');
  await expect(page.locator('.panel__titlecard .panel__word', { hasText: 'Tanami' })).toHaveCount(1);
});

test.describe('hover under reduced motion', () => {
  test('a card inverts but does not move or zoom', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto('/personal/');
    const card = page.locator('a.panel.card').filter({ has: page.locator('.panel__media img') }).first();
    await card.scrollIntoViewIfNeeded();
    const before = await card.boundingBox();
    await card.hover();
    await page.waitForTimeout(400);
    expect(await card.boundingBox()).toEqual(before);
    expect(await card.locator('.panel__media img').evaluate((img) => getComputedStyle(img).scale)).toBe('none');
  });
});

test('About chapters carry a title card, not an empty box', async ({ page }) => {
  await page.goto('/about/');
  const sides = await page.locator('.chapter__side').count();
  await expect(page.locator('.chapter__side > .speed')).toHaveCount(sides);
});

test('live and released badges sparkle', async ({ page }) => {
  await page.goto('/personal/');
  const bright = await page.locator('.badge--live, .badge--released').count();
  expect(bright).toBeGreaterThan(0);
  await expect(page.locator('.badge__spark')).toHaveCount(bright);
});

test('copying the email pops a COPIED! burst', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  await expect(page.locator('.email__pop')).toBeVisible();
  await expect(page.locator('.email__pop')).toHaveText('COPIED!');
  await expect(page.locator('.email__pop')).toBeHidden({ timeout: 2500 });
});

test('the 404 figure sweats', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('.lost__sweat')).toHaveCount(1);
});
