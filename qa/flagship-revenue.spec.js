import { orbitAction, orbitBranch } from './orbit-helpers.js';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const output = resolve('output/flagship-review');
const file = resolve(output, 'revenue-deck.html');
const deck = loadDeck('presentations/flagship.yaml');
const source = deck.slides.find(slide => slide.chart?.type === 'bar' && slide.chart.options?.format_y === 'currency_m').chart.data;
mkdirSync(output, { recursive: true });
writeFileSync(file, renderDeck(deck));

const errors = new WeakMap();
test.beforeEach(({ page }) => { errors.set(page, []); page.on('pageerror', error => errors.get(page).push(error.message)); });
test.afterEach(({ page }) => expect(errors.get(page), 'Uncaught JavaScript errors').toEqual([]));

async function open(page, query = '') {
  await page.goto(pathToFileURL(file).href + query, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__GAMMA_READY__ === true);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#gamma-studio-wizard')).not.toBeVisible();
  await expect(page.locator('#gamma-theme-chooser')).not.toBeVisible();
  return page.locator('section.present .revenue-sculpture');
}

async function gpuProof(root) {
  await expect(root).toHaveAttribute('data-revenue-state', 'ready');
  await expect.poll(() => root.evaluate(el => el._revenueSculpture.frame)).toBe(0);
  const proof = await root.evaluate(el => {
    const state = el._revenueSculpture, renderer = state.renderer, canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.render(state.scene, state.camera);
    const probe = document.createElement('canvas'); probe.width = 160; probe.height = 100;
    const context = probe.getContext('2d', { willReadFrequently: true });
    context.drawImage(canvas, 0, 0, probe.width, probe.height);
    const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
    let nonemptyPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 16) nonemptyPixels++;
    const projectedAmountScales = state.meshes.flatMap(mesh => {
      const positions = mesh.geometry.attributes.position;
      const point = index => new GammaThree.Vector3().fromBufferAttribute(positions, index).project(state.camera);
      return [(point(0).y - point(8).y) / mesh.userData.before, (point(648).y - point(656).y) / mesh.userData.after];
    });
    return { realContext:!!renderer.getContext(), drawCalls:renderer.info.render.calls, nonemptyPixels, dpr, css:{ width:rect.width, height:rect.height }, backing:{ width:canvas.width, height:canvas.height }, source:state.meshes.map(mesh => [mesh.userData.name, mesh.userData.before, mesh.userData.after]), projectedAmountScales, totalValues:state.model.totals };
  });
  expect(proof.realContext).toBe(true);
  expect(proof.drawCalls).toBeGreaterThanOrEqual(5);
  expect(proof.nonemptyPixels).toBeGreaterThan(2000);
  expect(proof.source).toEqual(source.labels.map((label, i) => [label, source.datasets[0].values[i], source.datasets[1].values[i]]));
  expect(proof.totalValues).toEqual([8300000, 16200000]);
  for (const value of proof.projectedAmountScales) expect(Math.abs(value / proof.projectedAmountScales[0] - 1)).toBeLessThan(0.000001);
  for (const axis of ['width', 'height']) {
    expect(proof.backing[axis], `${axis}: backing pixels must cover transformed CSS bounds at device DPR`).toBeGreaterThanOrEqual(proof.css[axis] * proof.dpr - 1);
    expect(proof.backing[axis], `${axis}: apply DPR only once`).toBeLessThanOrEqual(proof.css[axis] * proof.dpr + 2);
  }
  return proof;
}

test('revenue SVG export bypasses GPU, and native print disposes then resumes the live scene', async ({ page }) => {
  const proof = {};
  for (const query of ['?gamma-export=1', '?print-pdf']) {
    const root = await open(page, query);
    await expect(root).toHaveAttribute('data-revenue-state', 'fallback');
    await expect(root).toHaveAttribute('data-revenue-renderer', 'svg');
    await expect(root.locator('canvas')).toHaveCount(0);
    await expect(root.locator('.revenue-sculpture-fallback')).toBeVisible();
    await expect(root.locator('[data-revenue-segment]')).toHaveCount(5);
    proof[query] = await root.evaluate(el => ({ renderer:el.dataset.revenueRenderer, liveRenderer:!!el._revenueSculpture.renderer, draws:el._revenueSculpture.draws }));
    expect(proof[query].draws).toBe(0);
  }
  const root = await open(page);
  await expect(root).toHaveAttribute('data-revenue-state', 'ready');
  await (await orbitAction(page,root.locator('[data-revenue-segment="1"]'))).click();
  const liveReadout = await root.locator('figcaption').innerText();
  await page.emulateMedia({ media:'print' });
  await expect(root.locator('canvas')).toHaveCount(0);
  await expect(root.locator('.revenue-sculpture-fallback')).toBeVisible();
  expect(await root.evaluate(el => el._revenueSculpture.renderer)).toBeNull();
  await page.emulateMedia({ media:'screen' });
  await expect(root).toHaveAttribute('data-revenue-state', 'ready');
  await expect(root.locator('figcaption')).toHaveText(liveReadout);
  proof.nativePrint = { disposed:true, sourceSelectionPreserved:true, resumed:true };
  writeFileSync(resolve(output, 'revenue-export-manifest.json'), JSON.stringify(proof, null, 2));
});

test('revenue GPU geometry keeps its common amount scale and sharp pixels at desktop 1920 and resized 1440', async ({ page }) => {
  await page.setViewportSize({ width:1920, height:1080 });
  const root = await open(page);
  const large = await gpuProof(root);
  await page.setViewportSize({ width:1440, height:900 });
  await page.waitForTimeout(150);
  const resized = await gpuProof(root);
  expect(large.css.width).toBeGreaterThan(resized.css.width);
  writeFileSync(resolve(output, 'revenue-desktop-manifest.json'), JSON.stringify({ large, resized }, null, 2));
});

test('revenue segment Space activation keeps the presentation on slide one', async ({ page }) => {
  const root = await open(page);
  const platforms = root.locator('[data-revenue-segment="1"]');
  await (await orbitAction(page,platforms)).focus(); await page.keyboard.press('Space');
  expect(await page.evaluate(() => Reveal.getIndices().h)).toBe(0);
  await expect(platforms).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('figcaption')).toContainText('Platforms: $2.6M added');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
  expect(await page.evaluate(() => Reveal.getIndices().h)).toBe(0);
  await expect(root.locator('[data-revenue-segment="2"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(root.locator('figcaption')).toContainText('Fintech: $1.3M added');
  await page.keyboard.press('Escape');
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
  writeFileSync(resolve(output, 'revenue-keyboard-manifest.json'), JSON.stringify({ nativeSpace:true, arrowFocus:true, exactReadout:true, escapeClears:true, slideIndex:0 }, null, 2));
});

test.describe('revenue touch rendering', () => {
  test.use({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
  test('mobile 390 retains sharp proportional GPU data and touch selection with zero idle rendering', async ({ page }) => {
    const root = await open(page);
    const proof = await gpuProof(root);
    const platforms = root.locator('[data-revenue-segment="1"]');
    await (await orbitAction(page,platforms)).tap();
    await expect(platforms).toHaveAttribute('aria-pressed', 'true');
    await expect(root.locator('figcaption')).toContainText('Platforms: $2.6M added');
    await expect.poll(() => root.evaluate(el => el._revenueSculpture.frame)).toBe(0);
    const draws = await root.evaluate(el => el._revenueSculpture.draws);
    await page.waitForTimeout(400);
    expect(await root.evaluate(el => el._revenueSculpture.draws)).toBe(draws);
    await expect(platforms).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => Reveal.slide(1));
    const persistentRoot = page.locator('section').first().locator('.revenue-sculpture');
    expect(await persistentRoot.evaluate(el => el._revenueSculpture.renderer)).toBeNull();
    await page.evaluate(() => Reveal.slide(0));
    await expect(root).toHaveAttribute('data-revenue-state', 'ready');
    await expect(platforms).toHaveAttribute('aria-pressed', 'true');
    writeFileSync(resolve(output, 'revenue-mobile-manifest.json'), JSON.stringify({ ...proof, idleDraws:0, touchPersistent:true, offslideDisposal:true, reentry:true }, null, 2));
  });
});
