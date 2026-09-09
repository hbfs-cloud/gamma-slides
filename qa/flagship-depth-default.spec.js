import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const output = resolve('output/flagship-review');
const file = resolve(output, 'depth-deck.html');
mkdirSync(output, { recursive:true });
writeFileSync(file, renderDeck(loadDeck('presentations/flagship.yaml')));

async function openDepth(page, query = '') {
  await page.goto(pathToFileURL(file).href + query);
  await page.waitForFunction(() => window.__GAMMA_READY__ === true);
  await page.evaluate(() => Reveal.slide(20));
  const root = page.locator('section.present .d3-webgpu-stage');
  await expect(root).toBeVisible();
  await page.waitForTimeout(500);
  return root;
}

async function expectStatic(root) {
  await expect(root).toHaveAttribute('data-d3-view', '3d');
  await expect(root.locator('.d3-depth-scene')).toHaveAttribute('data-depth-renderer', 'webgl');
  await expect.poll(() => root.evaluate(el => el._threeExploration.draws)).toBeGreaterThan(0);
  await new Promise(resolve => setTimeout(resolve, 100));
  const draws = await root.evaluate(el => el._threeExploration.draws);
  await new Promise(resolve => setTimeout(resolve, 350));
  expect(await root.evaluate(el => el._threeExploration.draws)).toBe(draws);
}

async function pointPosition(root, index) {
  return root.evaluate((el, i) => {
    const state = el._threeExploration, canvas = state.renderer.domElement.getBoundingClientRect();
    const p = state.points[i].position.clone().project(state.camera);
    return { x:canvas.left + (p.x + 1) * canvas.width / 2, y:canvas.top + (1 - p.y) * canvas.height / 2 };
  }, index);
}

async function expectSeparatedText(root) {
  const collisions = await root.locator('.d3-depth-labels').evaluate(layer => {
    const labels = [...layer.children].filter(label => getComputedStyle(label).display !== 'none');
    return labels.flatMap((a, index) => labels.slice(index + 1).flatMap(b => {
      const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
      return Math.min(x.right,y.right) - Math.max(x.left,y.left) > 0 && Math.min(x.bottom,y.bottom) - Math.max(x.top,y.top) > 0 ? [[a.textContent,b.textContent,a.dataset.kind,b.dataset.kind]] : [];
    }));
  });
  expect(collisions, 'Company labels, axes and all tick labels must remain distinct').toEqual([]);
}

async function expectImmediateIdentities(root) {
  const proof = await root.evaluate(el => {
    const state = el._threeExploration, viewport = state.viewport.getBoundingClientRect();
    const names = [...el.querySelectorAll('[data-kind="point"]')];
    return { names:names.map(label => label.textContent), expected:state.model.points.map(point => point.name), inPlot:names.every(label => { const box = label.getBoundingClientRect(); return box.left >= viewport.left && box.right <= viewport.right && box.top >= viewport.top && box.bottom <= viewport.bottom; }), inScreen:names.every(label => { const box = label.getBoundingClientRect(); return box.top >= 56 && box.bottom < innerHeight - 96; }), localReadout:el.querySelector('.d3-depth-selection').getBoundingClientRect().bottom < innerHeight - 96 };
  });
  expect(proof.names).toEqual(proof.expected);
  expect(proof.inPlot).toBe(true);
  expect(proof.inScreen).toBe(true);
  expect(proof.localReadout).toBe(true);
}

test('comparables opens in real 3D and preserves an explicit 2D choice', async ({ page }) => {
  const root = await openDepth(page);
  await expectStatic(root);
  await expectSeparatedText(root);
  await expectImmediateIdentities(root);
  await expect(root.locator('.d3-depth-toggle')).toHaveText('Compare in 2D');
  await root.locator('[data-depth-action="right"]').focus();
  await page.keyboard.press('Space');
  expect(await root.evaluate(el => el._threeExploration.azimuth)).toBeCloseTo(-0.5);
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', '21');
  await root.locator('[data-depth-action="reset"]').focus();
  await page.keyboard.press('Space');
  expect(await root.evaluate(el => el._threeExploration.azimuth)).toBe(-0.68);
  expect(await root.evaluate(el => ({ count:el._threeExploration.points.length, context:!!el._threeExploration.renderer.getContext(), pixi:!!el._pixiApp }))).toEqual({ count:5, context:true, pixi:false });
  await root.locator('.d3-depth-select').selectOption('4');
  await expect(root.locator('.d3-webgpu-readout')).toHaveText('Stablecoin Infra · NTM revenue growth: 42% · EV / NTM revenue: 8.5× · Gross margin: 71%');
  await expect(root.locator('.d3-depth-selection')).toHaveText('42% growth · 8.5× EV/revenue · 71% margin');
  const point = await pointPosition(root, 0);
  await page.mouse.click(point.x, point.y);
  await expect(root.locator('.d3-webgpu-readout')).toHaveText('Legacy Processor · NTM revenue growth: 8% · EV / NTM revenue: 2.2× · Gross margin: 48%');
  await root.locator('.d3-depth-select').focus();
  await page.keyboard.press('g');
  await page.keyboard.press('Enter');
  await expect(root.locator('.d3-webgpu-readout')).toContainText('Global Payments');
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', '21');
  await root.locator('.d3-depth-toggle').focus();
  await page.keyboard.press('Space');
  await expect(root).toHaveAttribute('data-d3-view', '2d');
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', '21');
  await expect(root).toHaveAttribute('data-d3-state', 'ready');
  await root.locator('.d3-webgpu-plot').focus();
  await page.keyboard.press('ArrowRight');
  await expect(root.locator('.d3-webgpu-readout')).toContainText('Legacy Processor');
  const flatSelection = await root.locator('.d3-webgpu-readout').textContent();
  await root.locator('.d3-depth-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-d3-view', '3d');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-d3-view', '2d');
  await expect(root.locator('.d3-webgpu-readout')).toHaveText(flatSelection);
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', '21');
  await page.evaluate(() => Reveal.slide(21));
  await page.evaluate(() => Reveal.slide(20));
  await expect(root).toHaveAttribute('data-d3-view', '2d');
  await root.locator('.d3-depth-toggle').click();
  await expectStatic(root);
  await expect(root.locator('.d3-webgpu-readout')).toContainText('Global Payments');
  await page.evaluate(() => Reveal.slide(21));
  expect(await page.locator('[data-slide-number="21"] .d3-webgpu-stage').evaluate(el => el._threeExploration.renderer)).toBeNull();
  await page.evaluate(() => Reveal.slide(20));
  await expectStatic(root);
});

test('3D context loss and export retain the complete 2D fallback', async ({ page }) => {
  const root = await openDepth(page);
  await expectStatic(root);
  await root.evaluate(el => el._threeExploration.renderer.getContext().getExtension('WEBGL_lose_context').loseContext());
  await expect(root).toHaveAttribute('data-d3-view', '2d');
  await expect(root.locator('.d3-depth-toggle')).toBeDisabled();
  await root.locator('[data-d3-action="values"]').click();
  await expect(root.locator('.d3-webgpu-data tbody tr')).toHaveCount(5);
  await page.keyboard.press('Escape');
  const exported = await openDepth(page, '?gamma-export');
  await expect(exported).toHaveAttribute('data-d3-view', '2d');
  expect(await exported.evaluate(el => el._threeExploration.renderer)).toBeNull();
  await expect(exported.locator('.d3-webgpu-fallback')).toBeVisible();
});

test('reduced motion and print have no continuous 3D work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  const root = await openDepth(page);
  await expectStatic(root);
  await page.emulateMedia({ media:'print' });
  await expect(root).toHaveAttribute('data-d3-view', '2d');
  expect(await root.evaluate(el => el._threeExploration.renderer)).toBeNull();
  await expect(root.locator('.d3-webgpu-fallback')).toBeVisible();
  await page.emulateMedia({ media:'screen' });
  await expectStatic(root);
});

test('the desktop data fills its field and DPR follows the displayed Reveal scale', async ({ page }) => {
  const root = await openDepth(page);
  await expectStatic(root);
  const width = await root.evaluate(el => { const state = el._threeExploration, x = state.points.map(mesh => mesh.position.clone().project(state.camera).x); return (Math.max(...x) - Math.min(...x)) / 2; });
  expect(width).toBeGreaterThanOrEqual(0.5);
  await page.setViewportSize({ width:1920,height:1080 });
  await page.waitForTimeout(300);
  const ratio = await root.evaluate(el => { const canvas = el._threeExploration.renderer.domElement; return canvas.width / canvas.getBoundingClientRect().width; });
  expect(ratio).toBeCloseTo(1, 2);
  await expectSeparatedText(root);
  await page.screenshot({ path:resolve(output, 'desktop-3d-field-21.png') });
});

test('allowed rotation extrema keep all five spheres and their identities inside the field', async ({ page }) => {
  const root = await openDepth(page);
  const plot = root.locator('.d3-webgpu-plot');
  const assertInside = async () => {
    await page.waitForTimeout(80);
    const proof = await root.evaluate(el => {
      const state = el._threeExploration;
      return { points:state.points.map(mesh => {
        const p = mesh.position.clone().project(state.camera), radius = mesh.geometry.parameters.radius;
        const rx = 2 * radius / (state.camera.right-state.camera.left), ry = 2 * radius / (state.camera.top-state.camera.bottom);
        return {name:mesh.userData.name,inside:Math.abs(p.x)+rx <= 1 && Math.abs(p.y)+ry <= 1};
      }), labels:[...el.querySelectorAll('[data-kind="point"]')].map(label => label.textContent) };
    });
    expect(proof.points).toHaveLength(5);
    expect(proof.points.every(point => point.inside),JSON.stringify(proof.points)).toBe(true);
    expect(proof.labels).toEqual(proof.points.map(point => point.name));
    await expectSeparatedText(root);
    await expectImmediateIdentities(root);
  };
  for (let i = 0; i < 3; i++) await root.locator('[data-depth-action="left"]').click();
  await plot.focus();
  for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowUp');
  expect(await root.evaluate(el => el._threeExploration.azimuth)).toBe(-1.15);
  expect(await root.evaluate(el => el._threeExploration.elevation)).toBe(0.85);
  await assertInside();
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
  expect(await root.evaluate(el => el._threeExploration.azimuth)).toBe(1.15);
  await assertInside();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowDown');
  expect(await root.evaluate(el => el._threeExploration.elevation)).toBe(0.12);
  await assertInside();
  const box = await root.locator('.d3-depth-scene canvas').boundingBox();
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.4);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.9,box.y+box.height*.9,{steps:8});
  await page.mouse.up();
  expect(await root.evaluate(el => el._threeExploration.azimuth)).toBe(-1.15);
  expect(await root.evaluate(el => el._threeExploration.elevation)).toBe(0.85);
  await assertInside();
  await root.locator('[data-depth-action="reset"]').click();
  await assertInside();
  const width = await root.evaluate(el => { const state = el._threeExploration, x = state.points.map(mesh => mesh.position.clone().project(state.camera).x); return (Math.max(...x)-Math.min(...x))/2; });
  expect(width).toBeGreaterThanOrEqual(0.5);
});

test.describe('touch comparables', () => {
  test.use({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
  test('a tap selects a sphere and rotation preserves the exact readout', async ({ page }) => {
    const root = await openDepth(page);
    await expectStatic(root);
    await expectSeparatedText(root);
    await expectImmediateIdentities(root);
    const scene = root.locator('.d3-depth-scene');
    await scene.scrollIntoViewIfNeeded();
    const point = await pointPosition(root, 4);
    await page.touchscreen.tap(point.x, point.y);
    await expect(root.locator('.d3-webgpu-readout')).toContainText('Stablecoin Infra');
    await expect(root.locator('.d3-webgpu-readout')).toContainText('71%');
    await expect(root.locator('.d3-depth-selection')).toHaveText('42% growth · 8.5× EV/revenue · 71% margin');
    await expectImmediateIdentities(root);
    await scene.locator('[data-depth-action="right"]').tap();
    await expect(root.locator('.d3-webgpu-readout')).toContainText('Stablecoin Infra');
    await expect(scene.locator('.d3-depth-select')).toHaveValue('4');
    await expectStatic(root);
    await expectSeparatedText(root);
    await page.screenshot({ path:resolve(output, 'mobile-3d-selection-21.png') });
  });
});
