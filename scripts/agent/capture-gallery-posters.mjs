// Reproducible stills of the same focused scenes used by the public gallery.
// No synthetic interface overlays; regenerate after changing a source slide.
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { launchBrowser } from '../../src/browser.js';
import { loadDeckFile } from '../../src/loader/index.js';
import { galleryFeatures, renderGallerySlide } from '../../src/site/gallery.js';
import { renderBrowserWalkthrough, renderAiWalkthrough } from '../../src/site/feature-walkthroughs.js';
import { explanatoryStories } from '../../src/site/stories.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = join(root, 'docs/images');
const stories = process.argv.includes('--stories');
const features = stories ? explanatoryStories : galleryFeatures;
const directory = mkdtempSync(join(tmpdir(), 'gamma-gallery-posters-'));
let browser, server;
try {
  mkdirSync(join(directory, 'gallery'));
  mkdirSync(join(directory, 'assets'));
  copyFileSync(join(output, 'gamma-presenter-control-room.png'), join(directory, 'assets/gamma-presenter-control-room.png'));
  copyFileSync(join(root, 'node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2'), join(directory, 'assets/instrument-sans-latin-wght-normal.woff2'));
  for (const feature of features) {
    const deck = loadDeckFile(join(root, `presentations/${feature.slug}.yaml`));
    const html = feature.id === 'browser' ? renderBrowserWalkthrough() : feature.id === 'ai' ? renderAiWalkthrough() : renderGallerySlide(deck, feature);
    writeFileSync(join(directory, `gallery/${feature.id}.html`), html);
  }
  const app = express();
  app.use(express.static(directory));
  server = await new Promise(done => { const instance = app.listen(0, '127.0.0.1', () => done(instance)); });
  browser = await launchBrowser();
  for (const feature of features) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${server.address().port}/gallery/${feature.id}.html?gamma-preview=1&gamma-clean=gallery`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__GAMMA_READY__ === true);
    await page.evaluate(() => document.fonts.ready);
    if (feature.id === 'architecture' || stories) await page.waitForSelector('.archify-slide[data-ready=true]');
    if (feature.id === 'spatial') await page.waitForFunction(() => Number(document.querySelector('.immersive-chart')?.dataset.spatialFrames) > 2);
    if (feature.id === 'ai') await page.click('[data-action=ask]');
    await new Promise(done => setTimeout(done, feature.id === 'media' ? 3000 : 600));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), true, `${feature.id}: capture overflows its canvas`);
    const path = join(output, `${stories ? 'story' : 'gallery'}-${feature.id}.jpg`);
    await page.screenshot({ path, type: 'jpeg', quality: 88 });
    console.log(path);
    await page.close();
  }
} finally {
  await browser?.close();
  if (server) await new Promise(done => server.close(done));
  rmSync(directory, { recursive: true, force: true });
}
