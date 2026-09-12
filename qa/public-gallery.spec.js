import { test, expect } from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildPresentationLibrary } from '../src/site/library.js';
import { galleryFeatures } from '../src/site/gallery.js';
import express from 'express';

let directory, live;
const evidence = resolve(process.env.GAMMA_GALLERY_EVIDENCE || 'output/public-gallery');
test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  if (process.env.GAMMA_GALLERY_BASE_URL) { live = { url: new URL(process.env.GAMMA_GALLERY_BASE_URL).href }; return; }
  directory = mkdtempSync(join(tmpdir(), 'gamma-public-gallery-'));
  buildPresentationLibrary({ inputDir: 'presentations', outputDir: directory, language: 'en' });
  const app = express();
  app.use(express.static(directory));
  const server = await new Promise(done => { const instance = app.listen(0, '127.0.0.1', () => done(instance)); });
  live = { server, url: 'http://127.0.0.1:' + server.address().port + '/' };
});
test.afterAll(async () => {
  if (live?.server) { live.server.closeIdleConnections(); await new Promise(done => live.server.close(done)); }
  if (directory) rmSync(directory, { recursive: true, force: true });
});

async function contained(locator, width, height) {
  const { box, viewport } = await locator.evaluate(node => ({ box: node.getBoundingClientRect().toJSON(), viewport: [innerWidth, innerHeight] }));
  expect(box.width).toBeGreaterThan(width);
  expect(box.height).toBeGreaterThan(height);
  expect(box.left).toBeGreaterThanOrEqual(-1);
  expect(box.top).toBeGreaterThanOrEqual(-1);
  expect(box.right).toBeLessThanOrEqual(viewport[0] + 1);
  expect(box.bottom).toBeLessThanOrEqual(viewport[1] + 1);
  return box;
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 }, { name: 'wide', width: 2016, height: 1230 },
]) {
  test('six gallery scenes are usable and contained on ' + viewport.name, async ({ page }) => {
    test.setTimeout(160000);
    const errors = [], missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(live.url) && response.status() >= 400) missing.push(response.url()); });
    await page.setViewportSize(viewport);
    await page.goto(live.url);
    await expect(page.locator('[data-gallery-choice]')).toHaveCount(6);
    for (const feature of galleryFeatures) {
      await page.locator('[data-gallery-choice=' + feature.id + ']').click();
      const panel = page.locator('[data-gallery-panel=' + feature.id + ']');
      await panel.locator('.deck-preview').scrollIntoViewIfNeeded();
      await expect(panel.locator('[data-live-preview-shell]')).toHaveAttribute('data-live-ready', '', { timeout: 20000 });
      await expect(page.locator('[data-live-preview][src]')).toHaveCount(1);
      await expect(panel.locator('[data-live-preview]')).toHaveJSProperty('loading', 'eager');
      const frame = await panel.locator('iframe').elementHandle().then(handle => handle.contentFrame());
      await frame.evaluate(() => document.fonts.ready);
      await expect(frame.locator('#gamma-theme-chooser')).not.toBeVisible();
      await expect(frame.getByTestId('studio-wizard')).not.toBeVisible();
      await expect(panel.locator('.gallery-poster')).toHaveJSProperty('complete', true);
      expect(await panel.locator('.gallery-poster').evaluate(node => node.naturalWidth)).toBeGreaterThanOrEqual(1280);
      const responsive = viewport.width <= 590 && ['browser', 'ai'].includes(feature.id);
      if (!responsive) expect(await frame.evaluate(() => [innerWidth, innerHeight])).toEqual([1280, 720]);
      const stage = await panel.locator('.deck-preview-stage').boundingBox();
      if (!responsive) expect(Math.abs(stage.width / stage.height - 16 / 9)).toBeLessThan(.01);
      else {
        expect(await frame.evaluate(() => innerWidth)).toBeLessThan(590);
        expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      await expect(panel.getByRole('link')).toHaveAttribute('href', './' + feature.slug + '/#/' + feature.slide);
      await expect(panel.getByRole('button', { name: 'Pause preview', exact: true })).toBeVisible();
      if (feature.id === 'architecture') {
        await expect(frame.locator('.archify-slide')).toHaveAttribute('data-ready', 'true');
        await contained(frame.locator('.archify-canvas'), 1000, 350);
        const diagram = await frame.locator('.archify-canvas iframe').elementHandle().then(handle => handle.contentFrame());
        const nodes = diagram.locator('svg [data-node-id]');
        expect(await nodes.count()).toBeGreaterThanOrEqual(6);
        for (const node of await nodes.all()) await expect(node).toBeVisible();
        await frame.getByRole('button', { name: 'Play story', exact: true }).click();
        await expect(frame.locator('[data-archify-action=play]')).toHaveAttribute('aria-pressed', 'true');
        await frame.locator('[data-archify-action=play]').click();
        await expect(frame.locator('[data-archify-action=play]')).toHaveAttribute('aria-pressed', 'false');
      } else if (feature.id === 'charts') {
        await contained(frame.locator('.chart-container'), 650, 450);
        await expect(frame.locator('.chart-container svg')).toBeVisible();
        const series = await frame.locator('.chart-container > [id]').evaluate(node => {
          const chart = window.echarts.getInstanceByDom(node);
          chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: 0 });
          return chart.getOption().series.length;
        });
        expect(series).toBeGreaterThanOrEqual(2);
      } else if (feature.id === 'spatial') {
        await expect.poll(async () => Number(await frame.locator('.immersive-chart').getAttribute('data-spatial-frames'))).toBeGreaterThan(2);
        await contained(frame.locator('.spatial-viewport'), 700, 450);
        await frame.locator('[data-spatial-action=data]').click();
        await expect(frame.locator('.spatial-table')).toBeVisible();
        await expect(frame.locator('.spatial-table')).toContainText('Legacy Processor');
        await frame.locator('[data-spatial-action=spatial]').click();
        await frame.locator('[data-spatial-action=profile]').click();
        await expect(frame.locator('[data-spatial-action=profile]')).toHaveAttribute('aria-pressed', 'true');
      } else if (feature.id === 'media') {
        const media = await contained(frame.locator('.studio-youtube-media'), 1000, 550);
        expect(Math.abs(media.width / media.height - 16 / 9)).toBeLessThan(.01);
        await expect(frame.locator('.studio-youtube-media')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//);
        const player = await frame.locator('.studio-youtube-media').elementHandle().then(handle => handle.contentFrame());
        await player?.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
      } else if (feature.id === 'browser') {
        await contained(frame.locator('.bw-session'), responsive ? 250 : 1100, 450);
        if (responsive) expect((await frame.getByRole('tab', { name: 'Requests', exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(44);
        await frame.getByRole('tab', { name: 'Requests', exact: true }).click();
        await expect(frame.locator('[data-address]')).toHaveText('demo.local/requests');
        await expect(frame.locator('.bw-requests')).toBeVisible();
        await frame.getByRole('tab', { name: 'Overview', exact: true }).click();
        await expect(frame.locator('.bw-overview')).toBeVisible();
      } else {
        await expect(frame.locator('.aw-capture img')).toHaveJSProperty('complete', true);
        expect(await frame.locator('.aw-capture img').evaluate(node => node.naturalWidth)).toBeGreaterThan(1000);
        await contained(frame.locator('.aw-actions'), 200, 40);
        if (responsive) expect((await frame.locator('[data-action=approve]').boundingBox()).height).toBeGreaterThanOrEqual(44);
        await frame.locator('[data-action=ask]').click();
        await expect(frame.locator('#gamma-ai-walkthrough')).toHaveAttribute('data-state', 'review');
        await frame.locator('[data-action=approve]').click();
        await expect(frame.locator('[data-outcome]')).toHaveText('Approved in this simulation only.');
        await frame.locator('[data-action=ask]').click();
        await frame.locator('[data-action=reject]').click();
        await expect(frame.locator('[data-outcome]')).toHaveText('Rejected in this simulation only.');
        await frame.locator('[data-action=ask]').click();
      }
      await page.screenshot({ path: join(evidence, viewport.name + '-' + feature.id + '.png') });
      await panel.locator('.deck-preview').screenshot({ path: join(evidence, viewport.name + '-' + feature.id + '-scene.png') });
    }
    expect(errors).toEqual([]);
    expect(missing).toEqual([]);
  });
}

test('gallery pause, keyboard, offscreen disposal and reduced motion preserve useful stills', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(live.url);
  const tabs = page.getByRole('tablist', { name: 'Explore presentation capabilities' });
  await tabs.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(0);
  const first = tabs.getByRole('tab').first();
  await first.focus();
  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab').last()).toBeFocused();
  await expect(page.locator('[data-gallery-panel=ai]')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  const panel = page.locator('[data-gallery-panel=architecture]');
  await expect(panel.locator('.gallery-poster')).toBeVisible();
  await panel.locator('[data-play-preview]').click();
  await expect(panel.locator('[data-live-preview-shell]')).toHaveAttribute('data-live-ready', '', { timeout: 20000 });
  await panel.locator('[data-play-preview]').click();
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(0);
  await expect(panel.locator('.gallery-poster')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(0);
  await panel.locator('[data-play-preview]').click();
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(1);
  await page.locator('h1').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-live-preview][src]')).toHaveCount(0);
});
