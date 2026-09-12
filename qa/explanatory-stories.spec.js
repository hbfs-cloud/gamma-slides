import { test, expect } from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import express from 'express';
import { buildPresentationLibrary } from '../src/site/library.js';

const stories = [
  { slug: 'cyber-incident', slides: 8 },
  { slug: 'saas-explained', slides: 7 },
  { slug: 'data-pipeline', slides: 8 },
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const evidence = resolve(process.env.GAMMA_EXPLANATORY_STORIES_EVIDENCE || 'output/explanatory-stories');

let directory, live;

test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  if (process.env.GAMMA_GALLERY_BASE_URL) {
    const base = process.env.GAMMA_GALLERY_BASE_URL.endsWith('/')
      ? process.env.GAMMA_GALLERY_BASE_URL
      : `${process.env.GAMMA_GALLERY_BASE_URL}/`;
    live = { url: new URL(base).href };
    return;
  }

  directory = mkdtempSync(join(tmpdir(), 'gamma-explanatory-stories-'));
  buildPresentationLibrary({ inputDir: 'presentations', outputDir: directory, language: 'en' });
  const app = express();
  app.use(express.static(directory));
  const server = await new Promise(done => {
    const instance = app.listen(0, '127.0.0.1', () => done(instance));
  });
  live = { server, url: `http://127.0.0.1:${server.address().port}/` };
});

test.afterAll(async () => {
  if (live?.server) {
    live.server.closeIdleConnections();
    await new Promise(done => live.server.close(done));
  }
  if (directory) rmSync(directory, { recursive: true, force: true });
});

function deckUrl(story) {
  return new URL(`${story.slug}/`, live.url).href;
}

async function goToSlide(page, index) {
  await page.evaluate(target => Reveal.slide(target), index);
  await expect.poll(() => page.evaluate(() => Reveal.getIndices().h)).toBe(index);
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', String(index + 1).padStart(2, '0'));
}

async function currentDiagramFrame(page) {
  const frameElement = await page.locator('section.present .archify-canvas iframe').elementHandle();
  if (!frameElement) throw new Error('The current diagram did not create an Archify iframe.');
  const frame = await frameElement.contentFrame();
  if (!frame) throw new Error('The current Archify iframe has no document frame.');
  return frame;
}

async function expectDiagramInsideItsViewport(frame) {
  await expect.poll(() => frame.evaluate(() => {
    const svg = document.querySelector('.diagram-container > svg');
    if (!svg) return ['missing svg'];
    const svgBox = svg.getBoundingClientRect();
    const outside = [];
    if (svgBox.left < -1 || svgBox.top < -1 || svgBox.right > innerWidth + 1 || svgBox.bottom > innerHeight + 1) outside.push('svg');
    for (const node of svg.querySelectorAll('[data-node-id]')) {
      const box = node.getBoundingClientRect();
      if (box.left < svgBox.left - 1 || box.right > svgBox.right + 1 || box.top < svgBox.top - 1 || box.bottom > svgBox.bottom + 1) {
        outside.push(node.dataset.nodeId || 'unnamed node');
      }
    }
    return outside;
  }), { timeout: 10000 }).toEqual([]);
}

async function exerciseDiagramStory(page) {
  const slide = page.locator('section.present');
  await expect(slide.locator('.archify-slide')).toHaveAttribute('data-ready', 'true', { timeout: 20000 });
  const frame = await currentDiagramFrame(page);
  await expect(frame.locator('.diagram-container > svg')).toBeVisible();
  const nodes = frame.locator('svg [data-node-id]');
  expect(await nodes.count()).toBeGreaterThan(0);
  await expect(nodes.first()).toBeVisible();
  await expectDiagramInsideItsViewport(frame);

  const view = slide.locator('[data-archify-view]');
  const [firstView] = await view.locator('option').evaluateAll(options => options
    .map(option => ({ value: option.value, label: option.textContent?.trim() || '' }))
    .filter(option => option.value));
  expect(firstView, 'every explanatory diagram needs a focus view').toBeTruthy();
  await view.selectOption(firstView.value);
  await expect(view).toHaveValue(firstView.value);
  await expect.poll(() => frame.evaluate(() => window.Archify?.guidedViews?.active() || ''), { timeout: 10000 }).toBe(firstView.value);

  const play = slide.locator('[data-archify-action=play]');
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'false', { timeout: 10000 });
  await slide.locator('[data-archify-action=reset]').click();
  await expect(view).toHaveValue('');
  await expectDiagramInsideItsViewport(frame);
  // Capture the settled overview, not a transient focus camera or the finite
  // presenter entrance reveal. Story playback was exercised immediately above.
  await page.waitForFunction(() => !window.__gammaPresenterMotion?.active);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function exerciseNextAndBack(page, index, total) {
  if (index < total - 1) {
    await page.evaluate(() => Reveal.next());
    await expect.poll(() => page.evaluate(() => Reveal.getIndices().h)).toBe(index + 1);
    await page.evaluate(() => Reveal.prev());
    await expect.poll(() => page.evaluate(() => Reveal.getIndices().h)).toBe(index);
    return;
  }
  await page.evaluate(() => Reveal.prev());
  await expect.poll(() => page.evaluate(() => Reveal.getIndices().h)).toBe(index - 1);
  await page.evaluate(() => Reveal.next());
  await expect.poll(() => page.evaluate(() => Reveal.getIndices().h)).toBe(index);
}

for (const viewport of viewports) {
  test(`all explanatory stories render and remain interactive on ${viewport.name}`, async ({ page }) => {
    test.setTimeout(360000);
    page.setDefaultTimeout(15000);
    const errors = [];
    const missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(live.url) && response.status() >= 400) missing.push(response.url());
    });
    await page.setViewportSize(viewport);

    for (const story of stories) {
      const url = deckUrl(story);
      await page.goto(url);
      await page.waitForFunction(() => window.__GAMMA_READY__);
      await expect(page.locator('#gamma-theme-chooser')).not.toBeVisible();
      await expect(page.getByTestId('studio-wizard')).not.toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('.reveal > .slides > section')).toHaveCount(story.slides);
      if (viewport.name === 'mobile') {
        const home = await page.locator('#gamma-library-return').boundingBox();
        const menu = await page.locator('.gamma-orbit-hub').boundingBox();
        expect(home.height).toBeGreaterThanOrEqual(44);
        expect(home.x + home.width).toBeLessThanOrEqual(menu.x);
      }

      for (let index = 0; index < story.slides; index += 1) {
        await goToSlide(page, index);
        const slide = page.locator('section.present');
        const heading = slide.locator('.slide-header h2');
        await expect(heading).toBeVisible();
        expect((await heading.textContent()).trim()).toMatch(/[A-Za-z]{3}/);
        await exerciseDiagramStory(page);
        await page.screenshot({ path: join(evidence, `${viewport.name}-${story.slug}-${String(index + 1).padStart(2, '0')}.png`) });
        await exerciseNextAndBack(page, index, story.slides);
      }

      const home = page.locator('#gamma-library-return');
      await expect(home).toBeVisible();
      await expect(home).toHaveAttribute('href', '../');
      await Promise.all([
        page.waitForURL(new URL('../', url).href),
        home.click(),
      ]);
    }

    const examples = page.locator('#stories');
    await expect(examples.locator('[data-story]')).toHaveCount(3);
    await examples.scrollIntoViewIfNeeded();
    await expect.poll(() => examples.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth >= 1280))).toBe(true);
    await examples.screenshot({ path: join(evidence, `${viewport.name}-landing-stories.png`) });
    expect(errors).toEqual([]);
    expect(missing).toEqual([]);
  });
}
