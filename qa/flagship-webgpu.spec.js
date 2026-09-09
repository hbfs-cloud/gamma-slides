import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const output = resolve('output/flagship-review');
const file = resolve(output, 'gpu-deck.html');
const deck = loadDeck('presentations/flagship.yaml');
mkdirSync(output, { recursive: true });
writeFileSync(file, renderDeck(deck));
const gpuSlides = [8, 20, 26, 34];

function sourceRows(index) {
  const data = deck.slides[index].chart.data;
  if (data.labels) return data.labels.map((label, i) => [label, ...data.datasets.map(set => set.values[i])].map(String));
  if (data.graph_nodes) return [...data.graph_nodes.map(node => [node.name, node.category, node.value]), ...data.graph_links.map(link => [link.source, link.target, link.value])].map(row => row.map(String));
  return data.datasets.flatMap(set => set.points.map(point => [point.name, point.x, point.y, point.size ?? '—'].map(String)));
}

async function verifySourceValues(root, index) {
  const rows = await root.locator('.d3-webgpu-data tbody tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('th,td')].map(cell => cell.textContent.trim())));
  expect(rows, `Exact source data for slide ${index + 1}`).toEqual(sourceRows(index));
}

async function open(page) {
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__GAMMA_READY__ === true);
  await expect(page.locator('#gamma-studio-wizard')).not.toBeVisible();
  await expect(page.locator('#gamma-theme-chooser')).not.toBeVisible();
}

async function visit(page, index) {
  await page.evaluate(i => Reveal.slide(i), index);
  const root = page.locator('section.present .d3-webgpu-stage');
  await expect(root).toBeVisible();
  await expect.poll(() => root.evaluate(el => el.dataset.d3View === '3d' ? !!el._threeExploration?.renderer : /ready|fallback/.test(el.dataset.d3State))).toBe(true);
  await page.waitForTimeout(700);
  return root;
}

async function evidence(root) {
  return root.evaluate(el => {
    const app = el._pixiApp;
    const canvas = el.querySelector('canvas');
    const actualBackend = app?.renderer?.gpu?.device ? 'webgpu' : app?.renderer?.gl ? 'webgl' : null;
    // Inspect actual canvas pixels in the same task as rendering: a badge and
    // a loaded framework do not prove that data was drawn by the GPU.
    app?.render();
    const probe = document.createElement('canvas');
    probe.width = 160; probe.height = 100;
    const context = probe.getContext('2d', { willReadFrequently: true });
    context.drawImage(canvas, 0, 0, probe.width, probe.height);
    const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
    let nonempty = 0;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 16) {
        nonempty += 1;
        colors.add(`${pixels[i] >> 4},${pixels[i + 1] >> 4},${pixels[i + 2] >> 4}`);
      }
    }
    return { actualBackend, reportedBackend: el.dataset.d3Renderer, stageChildren: app?.stage?.children?.length || 0, tickerRunning: app?.ticker?.started, marks: Number(el.dataset.d3Marks), nonemptyPixels: nonempty, colors: colors.size, canvas: { width: canvas.width, height: canvas.height }, type: el.dataset.d3Type };
  });
}

async function depthReadability(root) {
  return root.evaluate(el => {
    const state = el._threeExploration;
    const labels = [...el.querySelectorAll('.d3-depth-label')].filter(label => getComputedStyle(label).visibility !== 'hidden' && getComputedStyle(label).display !== 'none');
    const points = labels.filter(label => label.dataset.kind === 'point');
    const overlaps = [];
    const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
    const canvas = state.renderer.domElement.getBoundingClientRect();
    const spheres = state.points.map(mesh => {
      const p = mesh.position.clone().project(state.camera);
      const radius = mesh.geometry.parameters.radius * mesh.scale.x * canvas.height * state.camera.zoom / (state.camera.top - state.camera.bottom);
      return { name: mesh.userData.name, x: canvas.left + (p.x + 1) * canvas.width / 2, y: canvas.top + (1 - p.y) * canvas.height / 2, radius };
    });
    for (const point of points) {
      const r = point.getBoundingClientRect();
      for (const other of labels) {
        if (point !== other && intersects(r, other.getBoundingClientRect())) overlaps.push({ label: point.textContent, kind: other.dataset.kind, other: other.textContent });
      }
      for (const sphere of spheres) {
        const x = Math.max(r.left, Math.min(sphere.x, r.right)), y = Math.max(r.top, Math.min(sphere.y, r.bottom));
        if (Math.hypot(x - sphere.x, y - sphere.y) <= sphere.radius + 1) overlaps.push({ label: point.textContent, kind: 'sphere', other: sphere.name });
      }
    }
    return { pointLabels: points.map(point => point.textContent), sphereCount: spheres.length, overlaps };
  });
}

async function verifyDepth(page, device) {
  await open(page);
  const root = await visit(page, 20);
  await expect(root).toHaveAttribute('data-d3-view', '3d');
  const scene = root.locator('.d3-depth-scene');
  await expect(scene).toHaveAttribute('data-depth-renderer', 'webgl');
  await scene.scrollIntoViewIfNeeded();
  const proof = await root.evaluate(el => {
    const state = el._threeExploration;
    state.renderer.render(state.scene, state.camera);
    return {
      realContext: !!state.renderer.getContext(),
      renderCalls: state.renderer.info.render.calls,
      source: state.points.map(mesh => [mesh.userData.name, mesh.userData.x, mesh.userData.y, mesh.userData.size].map(String)),
      points: state.points.map(mesh => ({ position: mesh.position.toArray(), expected: [state.scales.x(mesh.userData.x), state.scales.y(mesh.userData.y), state.scales.z(mesh.userData.size)] })),
      azimuth: state.azimuth,
    };
  });
  expect(proof.realContext).toBe(true);
  expect(proof.renderCalls).toBeGreaterThan(5);
  expect(proof.points).toHaveLength(5);
  expect(proof.source).toEqual(sourceRows(20));
  for (const point of proof.points) point.position.forEach((coordinate, axis) => expect(coordinate).toBeCloseTo(point.expected[axis], 8));
  await page.waitForTimeout(100);
  const initialReadability = await depthReadability(root);
  await page.screenshot({ path: resolve(output, `${device}-3d-21.png`) });
  if (device === 'mobile') await scene.locator('[data-depth-action="right"]').tap();
  else {
    const box = await scene.locator('canvas').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 20, { steps: 5 });
    await page.mouse.up();
  }
  expect(await root.evaluate(el => el._threeExploration.azimuth)).not.toBe(proof.azimuth);
  await page.waitForTimeout(100);
  const turnedReadability = await depthReadability(root);
  await page.screenshot({ path: resolve(output, `${device}-3d-21-turned.png`) });
  writeFileSync(resolve(output, `${device}-3d-manifest.json`), JSON.stringify({ initial: initialReadability, turned: turnedReadability }, null, 2));
  expect(initialReadability.overlaps, 'Initial 3D point labels must clear other labels, ticks, axes, and spheres').toEqual([]);
  expect(turnedReadability.overlaps, 'Rotated 3D point labels must clear other labels, ticks, axes, and spheres').toEqual([]);
  await scene.locator('[data-depth-action="reset"]').click();
  await page.waitForTimeout(100);
  const draws = await root.evaluate(el => el._threeExploration.draws);
  await page.waitForTimeout(400);
  expect(await root.evaluate(el => el._threeExploration.draws)).toBe(draws);
  await page.screenshot({ path: resolve(output, `${device}-3d-21.png`) });
  const overlaps = await scene.locator('[data-kind="point"]').evaluateAll(labels => {
    const visible = labels.filter(label => getComputedStyle(label).visibility !== 'hidden' && getComputedStyle(label).display !== 'none');
    return visible.flatMap((a, i) => visible.slice(i + 1).flatMap(b => {
      const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
      return Math.min(x.right, y.right) - Math.max(x.left, y.left) > 2 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 2 ? [[a.textContent, b.textContent]] : [];
    }));
  });
  expect(overlaps, '3D point labels must remain distinguishable').toEqual([]);
  await root.locator('.d3-depth-toggle').click();
  await expect(root).toHaveAttribute('data-d3-view', '2d');
  await expect(root).toHaveAttribute('data-d3-renderer', /pixijs-(webgpu|webgl)/);
  await expect(scene).not.toBeVisible();
}

test('the 3D view encodes three source dimensions and responds to dragging', async ({ page }) => {
  await verifyDepth(page, 'desktop');
});

test('four business scenes render their data with Pixi GPU and D3 geometry', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  const report = [];
  for (const index of gpuSlides) {
    const root = await visit(page, index);
    if (await root.getAttribute('data-d3-view') === '3d') await root.locator('.d3-depth-toggle').click();
    await expect(root).toHaveAttribute('data-d3-renderer', /pixijs-(webgpu|webgl)/);
    const proof = await evidence(root);
    report.push({ slide: index + 1, ...proof });
    expect(proof.actualBackend).toMatch(/webgpu|webgl/);
    expect(proof.reportedBackend).toBe(`pixijs-${proof.actualBackend}`);
    expect(proof.stageChildren).toBeGreaterThan(0);
    expect(proof.marks).toBeGreaterThan(3);
    expect(proof.nonemptyPixels).toBeGreaterThan(60);
    expect(proof.colors).toBeGreaterThan(1);
    expect(proof.tickerRunning).toBe(false);
    await page.screenshot({ path: resolve(output, `gpu-${String(index + 1).padStart(2, '0')}.png`) });
    const plot = root.locator('.d3-webgpu-plot');
    const readout = root.locator('.d3-webgpu-readout');
    const hint = await readout.textContent();
    await plot.focus();
    await page.keyboard.press('ArrowRight');
    await expect(readout).toContainText(sourceRows(index)[0][0]);
    await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', String(index + 1).padStart(2, '0'));
    await page.keyboard.press('Escape');
    await expect(readout).toHaveText(hint);
    await root.locator('[data-d3-action="values"]').click();
    await expect(root.locator('.d3-webgpu-data')).toBeVisible();
    await verifySourceValues(root, index);
    await page.keyboard.press('Escape');
    await expect(root.locator('.d3-webgpu-data')).not.toBeVisible();
  }
  writeFileSync(resolve(output, 'gpu-manifest.json'), JSON.stringify(report, null, 2));
  expect(errors).toEqual([]);
});

test('reduced motion renders a static GPU frame without an idle animation loop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const root = await visit(page, gpuSlides[0]);
  await expect(root).toHaveAttribute('data-d3-state', 'ready');
  await page.waitForTimeout(300);
  const before = await root.getAttribute('data-d3-draws');
  await page.waitForTimeout(700);
  expect(await root.getAttribute('data-d3-draws')).toBe(before);
  expect((await evidence(root)).tickerRunning).toBe(false);
});

test('unavailable GPU leaves complete readable SVG and data fallbacks', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', { configurable: true, get: () => undefined });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return /webgl|webgpu/i.test(kind) ? null : original.call(this, kind, ...args);
    };
  });
  await open(page);
  for (const index of gpuSlides) {
    const root = await visit(page, index);
    if (await root.getAttribute('data-d3-view') === '3d') await root.locator('.d3-depth-toggle').click();
    await expect(root).toHaveAttribute('data-d3-renderer', 'svg');
    await expect(root.locator('.d3-webgpu-plot svg').first()).toBeVisible();
    expect(await root.locator('.d3-webgpu-plot svg path,.d3-webgpu-plot svg rect,.d3-webgpu-plot svg circle').count()).toBeGreaterThan(3);
    await root.locator('[data-d3-action="values"]').click();
    await expect(root.locator('.d3-webgpu-data')).toBeVisible();
    await verifySourceValues(root, index);
    await page.keyboard.press('Escape');
  }
});

test('print mode replaces GPU canvases with vector data', async ({ page }) => {
  await open(page);
  const root = await visit(page, gpuSlides[0]);
  await page.emulateMedia({ media: 'print' });
  await expect(root.locator('canvas')).not.toBeVisible();
  await expect(root.locator('.d3-webgpu-plot svg').first()).toBeVisible();
  expect(await root.locator('.d3-webgpu-plot svg path,.d3-webgpu-plot svg rect,.d3-webgpu-plot svg circle').count()).toBeGreaterThan(3);
});

test('losing the actual GPU device restores the data view', async ({ page }) => {
  await open(page);
  const root = await visit(page, gpuSlides[0]);
  await root.evaluate(el => {
    const renderer = el._pixiApp.renderer;
    if (renderer.gpu?.device) renderer.gpu.device.destroy();
    else renderer.gl.getExtension('WEBGL_lose_context').loseContext();
  });
  await expect(root).toHaveAttribute('data-d3-renderer', 'svg');
  await expect(root.locator('.d3-webgpu-plot svg')).toBeVisible();
  await root.locator('[data-d3-action="values"]').click();
  await verifySourceValues(root, gpuSlides[0]);
});

test.describe('touch input', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  test('the 3D view remains usable on a phone', async ({ page }) => {
    await verifyDepth(page, 'mobile');
  });
  test('tapping a data mark selects it on a phone', async ({ page }) => {
    await open(page);
    const root = await visit(page, gpuSlides[0]);
    const plot = root.locator('.d3-webgpu-plot');
    await plot.scrollIntoViewIfNeeded();
    const point = await root.evaluate(el => {
      const state = window.__gammaGPUCharts.states.find(state => state.root === el);
      const hit = state.scene.hits[0], box = state.plot.getBoundingClientRect();
      return { x: box.left + (hit.x + hit.w / 2) * box.width / state.scene.width, y: box.top + (hit.y + hit.h / 2) * box.height / state.scene.height };
    });
    await page.touchscreen.tap(point.x, point.y);
    await expect(root.locator('.d3-webgpu-readout')).toContainText(sourceRows(gpuSlides[0])[0][0]);
  });
});
