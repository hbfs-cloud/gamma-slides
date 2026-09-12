import { test, expect } from '@playwright/test';
import { orbitAction, orbitBranch } from './orbit-helpers.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const out = resolve(process.env.GAMMA_IMMERSIVE_EVIDENCE || 'output/immersive-qa');
mkdirSync(out, { recursive: true });
const file = resolve(process.env.GAMMA_IMMERSIVE_DECK || 'output/immersive-data.html');
writeFileSync(file, renderDeck(loadDeck('presentations/immersive-data.yaml')));
const url = pathToFileURL(file).href;
const current = page => page.locator('section.present .immersive-chart');
async function clickOrbitAction(page, source) {
  await (await orbitAction(page, source)).click();
  await page.keyboard.press('Escape');
}
async function selectOrbitOption(page, source, value) {
  await (await orbitAction(page, source)).selectOption(value);
  await page.keyboard.press('Escape');
}
async function settle(page) {
  await page.evaluate(async()=>{
    await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));
  });
  await page.waitForFunction(()=>!document.querySelector('section.present [data-spatial-moving="true"]'));
}
async function open(page, query = 'theme=signal-room') {
  await page.goto(`${url}?${query}`);
  await page.waitForFunction(() => window.__GAMMA_READY__ === true);
  const skip = page.locator('[data-studio-action="skip"]');
  if (await skip.isVisible()) await skip.click();
  await settle(page);
}
async function next(page, index) {
  await page.evaluate(i => Reveal.slide(i), index);
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', String(index + 1).padStart(2, '0'));
  await settle(page);
}

test('GPU geometry, exact values, camera, selection, idle budget, and navigation', async ({ page }) => {
  const errors = [], network = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
  await open(page);
  await expect(current(page)).toHaveAttribute('data-immersive-view', 'spatial');
  await expect(current(page)).toHaveAttribute('data-spatial-frames', /[1-9]/);
  const geometry = await page.locator('.spatial-viewport canvas').evaluate(c => {
    const gl = c.getContext('webgl');
    return { error: gl.getError(), vertices: gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE), pixels: c.width*c.height };
  });
  expect(geometry.error).toBe(0); expect(geometry.vertices).toBeGreaterThan(1000); expect(geometry.pixels).toBeLessThanOrEqual(2_005_000);
  await selectOrbitOption(page, current(page).locator('.spatial-selection'), '6');
  await expect(current(page).locator('.spatial-readout')).toContainText('$4M');
  const viewport = current(page).locator('.spatial-viewport');
  await viewport.focus();
  const before = await current(page).getAttribute('data-spatial-camera');
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).not.toHaveAttribute('data-spatial-camera', before);
  await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', '01');
  await clickOrbitAction(page, current(page).getByRole('button', {name:'Reset view', includeHidden:true}));
  await expect(current(page)).toHaveAttribute('data-spatial-camera', '-0.480,0.420,0.620');
  await expect(current(page).locator('.spatial-story')).toContainText('+185.7%');
  await clickOrbitAction(page, current(page).getByRole('button',{name:'Profile view',exact:true, includeHidden:true}));
  await expect(current(page)).toHaveAttribute('data-spatial-moving','true');
  await expect(current(page)).toHaveAttribute('data-spatial-camera','-0.850,0.120,0.680');
  await clickOrbitAction(page, current(page).getByRole('button',{name:'Reset view',exact:true, includeHidden:true}));
  await expect(current(page)).toHaveAttribute('data-spatial-moving','false');
  const idle = await current(page).getAttribute('data-spatial-frames');
  await page.waitForTimeout(250);
  expect(await current(page).getAttribute('data-spatial-frames')).toBe(idle);
  await clickOrbitAction(page, current(page).getByRole('button', {name:'2D view',exact:true, includeHidden:true}));
  await expect(current(page).locator('.spatial-flat svg')).toBeVisible();
  const swatch = current(page).locator('.spatial-legend i').nth(1);
  const previousColor = await swatch.evaluate(el=>getComputedStyle(el).backgroundColor);
  await orbitBranch(page, 'theme');
  await page.locator('.gamma-theme-option[data-presentation-theme="analyst-proof"]').click();
  await expect(swatch).not.toHaveCSS('background-color',previousColor);
  await expect(current(page).locator('.spatial-flat svg')).toBeVisible();
  await clickOrbitAction(page, current(page).getByRole('button', {name:'Values',exact:true, includeHidden:true}));
  await expect(current(page).getByRole('cell', {name:'$4M',exact:true})).toBeVisible();
  expect(await current(page).locator('tbody tr').count()).toBe(10);
  await clickOrbitAction(page, current(page).getByRole('button', {name:'3D view',exact:true, includeHidden:true}));
  await next(page, 1);
  await expect(current(page)).toHaveAttribute('data-immersive-view', 'spatial');
  await selectOrbitOption(page, current(page).locator('.spatial-selection'), '4');
  await expect(current(page).locator('.spatial-readout')).toContainText('71%');
  expect(await page.locator('canvas').count()).toBe(1);
  await next(page, 2);
  await expect(page.locator('section.present .chart-container svg')).toBeVisible();
  await next(page, 0);
  expect(await page.evaluate(() => Object.keys(chartNarrativeTimers))).toHaveLength(0);
  expect(errors).toEqual([]); expect(network).toEqual([]);
});

test('reduced motion, unavailable GPU, and context loss retain the data', async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion:'reduce' });
  const page = await reduced.newPage();
  await open(page);
  await expect(current(page)).toHaveAttribute('data-immersive-view','flat');
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(current(page).locator('.spatial-flat svg')).toBeVisible();
  await reduced.close();
  const noGPU = await browser.newContext();
  const fallback = await noGPU.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : original.call(this,type,...args); };
  });
  await open(fallback);
  await expect(current(fallback)).toHaveAttribute('data-immersive-view','flat');
  await expect(await orbitAction(fallback, current(fallback).getByRole('button',{name:'3D view',exact:true, includeHidden:true}))).toBeDisabled();
  await expect(current(fallback).locator('.spatial-flat svg')).toBeVisible();
  await noGPU.close();
  const normal = await browser.newContext();
  const lost = await normal.newPage(); await open(lost);
  await lost.locator('.spatial-viewport canvas').evaluate(c=>c.getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
  await expect(current(lost)).toHaveAttribute('data-immersive-view','flat');
  await expect(current(lost).locator('.spatial-flat svg')).toBeVisible();
  await normal.close();
});

test('export and ordinary printing produce SVG evidence without GPU allocation', async ({ page }) => {
  await open(page, 'theme=signal-room&gamma-export=1');
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.locator('.spatial-flat svg')).toHaveCount(2);
  await expect(current(page).locator('.spatial-toolbar')).toBeHidden();
  await page.screenshot({path:resolve(out,'export.png')});
  await page.pdf({path:resolve(out,'immersive-data.pdf'),width:'1280px',height:'720px',printBackground:true});
  await open(page);
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  await expect(current(page)).toHaveAttribute('data-immersive-view','flat');
  await expect(current(page).locator('.spatial-flat svg')).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await expect(current(page)).toHaveAttribute('data-immersive-view','spatial');
  await open(page,'theme=signal-room&print-pdf=1');
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.locator('.spatial-flat svg')).toHaveCount(2);
});

for (const theme of ['signal-room','analyst-proof','cutting-room']) {
  test(`visual evidence and theme consistency: ${theme}`, async ({page})=>{
    await open(page, `theme=${theme}`);
    for (let i=0;i<2;i++) {
      await next(page,i);
      await expect(current(page)).toHaveAttribute('data-spatial-frames', /[1-9]/);
      await page.screenshot({path:resolve(out,`${theme}-${i+1}.png`)});
      const audit=await current(page).evaluate(root=>{
        const viewport=root.querySelector('.spatial-viewport').getBoundingClientRect();
        const visible=[...root.querySelectorAll('.spatial-labels span')].filter(el=>!el.hidden);
        return { labels:visible.map(el=>el.textContent), overflow:visible.filter(el=>{const r=el.getBoundingClientRect();return r.left<viewport.left-1||r.right>viewport.right+1||r.top<viewport.top-1||r.bottom>viewport.bottom+1;}).map(el=>el.textContent) };
      });
      expect(audit.overflow).toEqual([]);
      expect(audit.labels).toContain(i===0?'Revenue':'Gross margin');
      if(i===0) { expect(audit.labels).toContain('Other');expect(audit.labels).toContain('FY25'); }
    }
  });
}

test('phone and tablet retain reachable controls, values, and navigation', async ({page})=>{
  for(const size of [{width:390,height:844},{width:768,height:1024}]) {
    await page.setViewportSize(size); await open(page);
    await expect(current(page)).toHaveAttribute('data-immersive-view','spatial');
    await page.screenshot({path:resolve(out,`device-${size.width}.png`)});
    const orbitThreeD = await orbitAction(page, current(page).getByRole('button',{name:'3D view',exact:true, includeHidden:true}));
    const bounds=await orbitThreeD.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44); expect(bounds.width).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await clickOrbitAction(page, current(page).getByRole('button',{name:'Values',exact:true, includeHidden:true}));
    await expect(current(page).locator('.spatial-table')).toBeVisible();
    await next(page,1);
    await page.screenshot({path:resolve(out,`device-${size.width}-scatter.png`)});
    if (size.width === 390) {
      const depthAxis = await current(page).evaluate(root => {
        const viewport = root.querySelector('.spatial-viewport').getBoundingClientRect();
        const title = [...root.querySelectorAll('.spatial-labels .axis-title')].find(el => el.textContent === 'Gross margin');
        const ticks = [...root.querySelectorAll('.spatial-labels span')].filter(el => !el.hidden && !el.classList.contains('axis-title') && /%$/.test(el.textContent));
        const rect = el => el.getBoundingClientRect();
        const overlaps = (a, b) => Math.max(a.left, b.left) < Math.min(a.right, b.right) && Math.max(a.top, b.top) < Math.min(a.bottom, b.bottom);
        const titleRect = title && rect(title);
        return {
          inside: titleRect && titleRect.left >= viewport.left && titleRect.right <= viewport.right && titleRect.top >= viewport.top && titleRect.bottom <= viewport.bottom,
          overlappingTicks: titleRect ? ticks.filter(tick => overlaps(titleRect, rect(tick))).map(tick => tick.textContent) : [],
          tickCollisions: ticks.flatMap((tick, index) => ticks.slice(index + 1).filter(other => overlaps(rect(tick), rect(other))).map(other => [tick.textContent, other.textContent])),
        };
      });
      expect(depthAxis.inside).toBe(true);
      expect(depthAxis.overlappingTicks).toEqual([]);
      expect(depthAxis.tickCollisions).toEqual([]);
    }
    await next(page,2);
    await expect(page.locator('body')).not.toHaveClass(/gamma-immersive-mobile/);
  }
});
