import { test, expect } from '@playwright/test';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { findBrowserExecutable } from '../src/browser.js';
import { renderDeck } from '../src/engine/renderer.js';
import { loadDeck } from '../src/loader/index.js';

test('native hidden operator keeps GPU drawing and updates the clean audience', async () => {
  test.setTimeout(45000);
  const evidence = resolve('output/studio-background'); mkdirSync(evidence, { recursive: true });
  const html = renderDeck(loadDeck('presentations/studio-demo.yaml'));
  const server = createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  // Playwright normally enables focus emulation in its own CDP session. That
  // keeps document.hidden=false even on minimized windows. Native Puppeteer
  // pages inside this Playwright test deliberately do not install that override.
  const browser = await puppeteer.launch({
    executablePath: findBrowserExecutable(), headless: false,
    ignoreDefaultArgs: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
    defaultViewport: { width: 1280, height: 720 },
  });
  const errors = [];
  try {
    const operator = await browser.newPage(); operator.on('pageerror', e => errors.push(e.message));
    await operator.goto('http://127.0.0.1:' + server.address().port + '/?gamma-qa=1');
    await operator.waitForFunction(() => window.__GAMMA_READY__ && window.__gammaFrame);
    const audienceTarget = browser.waitForTarget(t => t.opener() === operator.target());
    await operator.evaluate(() => __gammaOpenOutput());
    const audience = await (await audienceTarget).page(); audience.on('pageerror', e => errors.push(e.message));
    await audience.waitForFunction(() => window.__GAMMA_READY__);
    // A real foreground tab in the operator's native browser window makes the
    // operator inactive. The separately opened audience stays in the foreground.
    await operator.evaluate(() => window.open('about:blank', 'gamma-background-cover'));
    await audience.bringToFront();
    await operator.waitForFunction(() => document.hidden, { timeout: 5000, polling: 100 });
    const visibility = await operator.evaluate(() => ({ hidden: document.hidden, state: document.visibilityState, broadcasting: __gammaBroadcastActive }));
    expect(visibility).toEqual({ hidden: true, state: 'hidden', broadcasting: true });
    const cadence = await operator.evaluate(() => new Promise(resolve => {
      const start = performance.now(), stamps = []; let running = true;
      const tick = now => { if (!running) return; stamps.push(now - start); __gammaFrame(tick); };
      __gammaFrame(tick);
      setTimeout(() => { running = false; resolve({ elapsed: performance.now() - start, stamps, hidden: document.hidden }); }, 2200);
    }));
    writeFileSync(resolve(evidence, 'native-cadence.json'), JSON.stringify({ visibility, cadence }, null, 2));
    const gpu = await operator.evaluate(() => [...document.querySelectorAll('.reveal .slides>section')].findIndex(s => s.querySelector('.d3-webgpu-stage')));
    expect(gpu).toBeGreaterThan(-1);
    await operator.evaluate(i => Reveal.slide(i), gpu);
    await operator.waitForFunction(() => document.querySelector('section.present .d3-webgpu-stage')?.dataset.d3State === 'ready', { polling: 100, timeout: 8000 });
    await audience.waitForFunction(() => document.querySelector('section.present .gamma-output-canvas')?.width > 100, { polling: 100, timeout: 6000 }).catch(async error => {
      const inspect = page => page.evaluate(() => ({ hidden: document.hidden, slide: Reveal.getIndices(), ready: __GAMMA_READY__, canvases: [...document.querySelectorAll('section.present canvas')].map(c => ({ width: c.width, height: c.height, visible: getComputedStyle(c).visibility, rect: c.getBoundingClientRect().toJSON() })), videos: [...document.querySelectorAll('section.present video')].map(v => ({ width: v.videoWidth, height: v.videoHeight, ready: v.readyState, paused: v.paused })), dataset: { ...document.querySelector('section.present .d3-webgpu-stage')?.dataset } }));
      writeFileSync(resolve(evidence, 'mirror-failure.json'), JSON.stringify({ operator: await inspect(operator), audience: await inspect(audience), errors }, null, 2));
      throw error;
    });
    await new Promise(resolve => setTimeout(resolve, 900));
    const sourceBefore = await operator.evaluate(() => {
      const root = document.querySelector('section.present .d3-webgpu-stage'), canvas = root.querySelector('canvas');
      return { hidden: document.hidden, draws: Number(root.dataset.d3Draws), renderer: root.dataset.d3Renderer, pixels: canvas.toDataURL() };
    });
    const sample = async audience => audience.evaluate(() => {
      return document.querySelector('section.present .gamma-output-canvas').toDataURL();
    });
    const audienceBefore = await sample(audience);
    await operator.evaluate(() => document.querySelector('section.present .d3-webgpu-plot').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    await expect.poll(async () => operator.evaluate(() => Number(document.querySelector('section.present .d3-webgpu-stage').dataset.d3Draws))).toBeGreaterThan(sourceBefore.draws);
    await expect.poll(async () => sample(audience), { timeout: 5000 }).not.toBe(audienceBefore);
    const sourceAfter = await operator.evaluate(() => {
      const root = document.querySelector('section.present .d3-webgpu-stage');
      return { hidden: document.hidden, draws: Number(root.dataset.d3Draws), renderer: root.dataset.d3Renderer, pixels: root.querySelector('canvas').toDataURL() };
    });
    expect(sourceAfter.hidden).toBe(true); expect(sourceAfter.renderer).toMatch(/^pixijs-/); expect(sourceAfter.pixels).not.toBe(sourceBefore.pixels);
    const controls = await audience.evaluate(() => [...document.querySelectorAll('.gamma-orbit,.gamma-live-panel,.gamma-recording-badge,.d3-webgpu-actions,.gamma-terminal')].filter(el => el.getBoundingClientRect().width && getComputedStyle(el).display !== 'none').length);
    expect(controls).toBe(0); expect(errors).toEqual([]);
    await audience.screenshot({ path: resolve(evidence, 'hidden-operator-audience.png') });
    delete sourceBefore.pixels; delete sourceAfter.pixels;
    writeFileSync(resolve(evidence, 'proof.json'), JSON.stringify({ method: 'Native headed Chrome, real inactive operator tab; no emulated document visibility', visibility, cadence, sourceBefore, sourceAfter, audiencePixelsChanged: true, visibleOperatorControls: controls, errors }, null, 2));
    expect(cadence.stamps.length).toBeGreaterThan(20);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
