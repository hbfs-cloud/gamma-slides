import { test, expect } from '@playwright/test';
import { orbitAction } from './orbit-helpers.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const out = resolve('output/cinematic-qa/full-demo');
mkdirSync(out, { recursive: true });
const file = resolve('output/cinematic-revenue.html');
writeFileSync(file, renderDeck(loadDeck('presentations/cinematic-revenue.yaml')));
const url = pathToFileURL(file).href;

async function open(page) {
  await page.goto(`${url}?theme=signal-room`);
  await page.waitForFunction(() => window.__GAMMA_READY__ === true);
  const skip = page.locator('[data-studio-action="skip"]');
  if (await skip.isVisible()) await skip.click();
  await page.evaluate(async () => Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
}

async function slide(page, index) {
  await page.evaluate(i => Reveal.slide(i), index);
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', String(index + 1).padStart(2, '0'));
  await page.waitForTimeout(360);
}

async function bounds(page) {
  const overflows = await page.evaluate(() => {
    const slide = document.querySelector('section.present'), sr = slide.getBoundingClientRect();
    return [...slide.querySelectorAll('h1,h2,h3,.cinema-amount,.cinema-feature,.cinema-segment-labels > div,.closing-decision,.slide-source')]
      .filter(el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || el.matches('.cinema-tools')) return false; const r = el.getBoundingClientRect(); return r.left < sr.left - 12 || r.right > sr.right + 12 || r.top < sr.top - 12 || r.bottom > sr.bottom + 12; })
      .map(el => el.className || el.tagName);
  });
  expect(overflows).toEqual([]);
}

for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  test(`complete demo deck stays composed on ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await open(page);
    await expect(page.locator('.reveal > .slides > section')).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      await slide(page, index);
      await bounds(page);
      await page.screenshot({ path: `${out}/${name}-${String(index + 1).padStart(2, '0')}.png` });
      if (index === 1 || index === 2 || index === 3) {
        const current = page.locator('section.present .cinema-stage');
        await expect(current).toHaveAttribute('data-cinema-renderer', 'webgl');
        await expect(page.locator('section.present .cinema-after')).toContainText('$');
        await (await orbitAction(page, current.locator('[data-cinema-action="split"]'))).click();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1200);
        await bounds(page);
      }
    }
    expect(errors).toEqual([]);
  });
}
