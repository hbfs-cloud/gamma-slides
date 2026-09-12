import { test, expect } from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildPresentationLibrary } from '../src/site/library.js';
import express from 'express';

let directory;
let live;
const evidence = resolve(process.env.GAMMA_GALLERY_EVIDENCE || 'output/public-gallery');

test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  // Reuse the same interaction/visual contracts against the deployed Pages URL.
  if (process.env.GAMMA_GALLERY_BASE_URL) {
    live = { url: new URL(process.env.GAMMA_GALLERY_BASE_URL).href };
    return;
  }
  directory = mkdtempSync(join(tmpdir(), 'gamma-public-gallery-'));
  buildPresentationLibrary({ inputDir: 'presentations', outputDir: directory, language: 'en' });
  const app = express();
  app.use(express.static(directory));
  const server = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  live = { server, url: `http://127.0.0.1:${server.address().port}/` };
});

test.afterAll(async () => {
  if (live?.server) await new Promise(resolve => live.server.close(resolve));
  if (directory) rmSync(directory, { recursive: true, force: true });
});

test('the public gallery keeps live proof, full demos, and mobile width available', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(live.url);
  const gallery = page.locator('#live-gallery');
  const previews = gallery.locator('[data-live-preview]');
  await expect(previews).toHaveCount(6);
  await previews.first().scrollIntoViewIfNeeded();
  await expect.poll(() => previews.first().getAttribute('src')).toMatch(/gamma-presenter-capabilities\/\?gamma-preview=1&gamma-clean=gallery#\/3/);
  await expect(previews.first().locator('..').locator('..')).toHaveAttribute('data-live-ready', '', { timeout: 20000 });
  const mediaDeck = await previews.first().elementHandle().then(handle => handle.contentFrame());
  await expect(mediaDeck.locator('#gamma-theme-chooser')).not.toBeVisible();
  await expect(mediaDeck.locator('section.present')).toContainText('Play a real YouTube scene');
  await expect(mediaDeck.locator('section.present iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//);
  await expect(gallery.getByRole('link', { name: 'Open the full Architecture in motion demo' })).toHaveAttribute('href', './gamma-presenter-capabilities/#/5');
  const desktopBox = await previews.first().boundingBox();
  expect(desktopBox.width / desktopBox.height).toBeGreaterThan(1.7);
  await page.screenshot({ path: join(evidence, 'desktop-media-preview.png') });
  await page.screenshot({ path: join(evidence, 'desktop-live-gallery.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(live.url);
  const mobilePreview = page.locator('#live-gallery [data-live-preview]').first();
  await mobilePreview.scrollIntoViewIfNeeded();
  await expect.poll(() => mobilePreview.getAttribute('src')).toMatch(/gamma-presenter-capabilities\/\?gamma-preview=1&gamma-clean=gallery#\/3/);
  await expect(mobilePreview.locator('..').locator('..')).toHaveAttribute('data-live-ready', '', { timeout: 20000 });
  const mobileBox = await mobilePreview.boundingBox();
  expect(mobileBox.width).toBeLessThanOrEqual(358);
  expect(mobileBox.height).toBeGreaterThan(500);
  const mobileDeck = await mobilePreview.elementHandle().then(handle => handle.contentFrame());
  const mobileHeading = mobileDeck.locator('section.present h2');
  const mobileMedia = mobileDeck.locator('section.present .studio-youtube-media');
  await expect(mobileHeading).toBeVisible();
  await expect(mobileMedia).toBeVisible();
  const [headingBox, mediaBox, mobileViewport] = await Promise.all([
    mobileHeading.evaluate(node => node.getBoundingClientRect().toJSON()),
    mobileMedia.evaluate(node => node.getBoundingClientRect().toJSON()),
    mobileDeck.evaluate(() => ({ width: innerWidth, height: innerHeight })),
  ]);
  expect(mediaBox).not.toBeNull();
  expect(mediaBox.width).toBeGreaterThan(mobileViewport.width * .6);
  expect(mediaBox.height).toBeGreaterThan(120);
  expect(mediaBox.y).toBeGreaterThanOrEqual(0);
  expect(mediaBox.y + mediaBox.height).toBeLessThanOrEqual(mobileViewport.height);
  expect(headingBox.y).toBeGreaterThanOrEqual(0);
  expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(mediaBox.y);
  await page.screenshot({ path: join(evidence, 'mobile-media-preview.png') });
  const mobileArchitecture = page.locator('#live-gallery [data-live-preview]').nth(1);
  await mobileArchitecture.scrollIntoViewIfNeeded();
  await expect.poll(() => mobileArchitecture.getAttribute('src')).toMatch(/gamma-presenter-capabilities\/\?gamma-preview=1&gamma-clean=gallery#\/5/);
  await expect(mobileArchitecture.locator('..').locator('..')).toHaveAttribute('data-live-ready', '', { timeout: 20000 });
  const architectureDeck = await mobileArchitecture.elementHandle().then(handle => handle.contentFrame());
  const archifyScene = architectureDeck.locator('section.present .archify-slide[data-ready=true]');
  await expect(archifyScene).toBeVisible();
  const archifyCanvas = architectureDeck.locator('section.present .archify-canvas');
  const [archifyBox, architectureViewport] = await Promise.all([
    archifyCanvas.evaluate(node => node.getBoundingClientRect().toJSON()),
    architectureDeck.evaluate(() => ({ width: innerWidth, height: innerHeight })),
  ]);
  expect(archifyBox.width).toBeGreaterThan(architectureViewport.width * .6);
  expect(archifyBox.height).toBeGreaterThan(160);
  expect(archifyBox.y).toBeGreaterThanOrEqual(0);
  expect(archifyBox.y + archifyBox.height).toBeLessThanOrEqual(architectureViewport.height);
  const archifyRuntime = await architectureDeck.locator('section.present .archify-canvas iframe').elementHandle().then(handle => handle.contentFrame());
  await expect(archifyRuntime.locator('svg [data-node-id]').first()).toBeVisible();
  await page.screenshot({ path: join(evidence, 'mobile-architecture-preview.png') });
  const overflow = await page.evaluate(() => [...document.body.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'absolute').map(el => el.className));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), JSON.stringify(overflow)).toBe(true);
  await page.screenshot({ path: join(evidence, 'mobile-live-gallery.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('the public gallery stops offscreen runtimes and honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(live.url);
  const previews = page.locator('[data-live-preview]');
  await previews.nth(1).scrollIntoViewIfNeeded();
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play Architecture in motion preview', exact: true }).click();
  await expect(previews.nth(1).locator('..').locator('..')).toHaveAttribute('data-live-ready', '', { timeout: 20000 });
  const deck = await previews.nth(1).elementHandle().then(handle => handle.contentFrame());
  await expect(deck.getByTestId('studio-wizard')).not.toBeVisible();
  await expect(deck.locator('#gamma-theme-chooser')).not.toBeVisible();
  await expect(deck.locator('section.present')).toContainText('Explain systems as systems');
  await expect(deck.locator('#gamma-library-return')).not.toBeVisible();
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(1);
  await page.screenshot({ path: join(evidence, 'desktop-architecture-preview.png') });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await previews.nth(3).scrollIntoViewIfNeeded();
  await expect(previews.nth(3).locator('..').locator('..')).toHaveAttribute('data-live-ready', '', { timeout: 20000 });
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(1);
  await page.locator('h1').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(0);
});
