import { orbitAction, orbitBranch } from './orbit-helpers.js';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const output = resolve('output/flagship-review');
const fixture = resolve(output, 'deck.html');
const deck = loadDeck('presentations/flagship.yaml');
const reviewSlides = (process.env.GAMMA_REVIEW_SLIDES || '6,10,15,19,26,32').split(',').map(Number);
if (reviewSlides.some(number => !Number.isInteger(number) || number < 1 || number > deck.slides.length)) throw new Error('GAMMA_REVIEW_SLIDES requires valid one-based slide numbers.');
mkdirSync(output, { recursive: true });
writeFileSync(fixture, renderDeck(deck));

// Fresh file:// session: no QA flag, theme override, storage seed, or dismissal.
async function open(page) {
  await page.goto(pathToFileURL(fixture).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__GAMMA_READY__ === true);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('body')).toHaveClass(/gamma-experience/);
  await expect(page.locator('.reveal > .slides > section')).toHaveCount(38);
  await expect(page.locator('.reveal > .slides > section.present')).toHaveAttribute('data-slide-number', '01');
  await expect(page.locator('#gamma-studio-wizard')).not.toBeVisible();
  await expect(page.locator('#gamma-theme-chooser')).not.toBeVisible();
}

async function inspect(page, mobile) {
  return page.evaluate(({ mobile }) => {
    const slide = document.querySelector('.reveal > .slides > section.present');
    const sr = slide.getBoundingClientRect();
    const defects = [];
    const visible = el => {
      for (let node = el; node; node = node.parentElement) {
        const css = getComputedStyle(node);
        if (css.display === 'none' || css.visibility === 'hidden' || Number(css.opacity) === 0) return false;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const name = el => `${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).replace(/\s+/g, '.')} ${el.textContent.trim().slice(0, 75)}`;
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    const context = probe.getContext('2d', { willReadFrequently: true });
    const rgba = value => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const p = context.getImageData(0, 0, 1, 1).data;
      return [p[0] / 255, p[1] / 255, p[2] / 255, p[3] / 255];
    };
    const over = (front, back) => {
      const a = front[3] + back[3] * (1 - front[3]);
      if (!a) return [0, 0, 0, 0];
      return [0, 1, 2].map(i => (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / a).concat(a);
    };
    const luminance = c => c.slice(0, 3).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const textSelector = 'h1,h2,h3,h4,.slide-subtitle,.cover-strip strong,.cover-strip>span,.title-meta span,.experience-cover-copy p,.experience-cover-metrics strong,.experience-cover-metrics span,.experience-chapter-map b,.experience-chapter-map span,.experience-flow figcaption,.value,.label,.delta,.dashboard-panel-title span,.dashboard-metric strong,.dashboard-metric>span,.dashboard-metric p,.dashboard-mini-metric strong,.dashboard-mini-metric>span,.closing-decision strong,.closing-decision small,.slide-insight p,.slide-source>span,.d3-webgpu-heading p,.d3-webgpu-insight,.d3-webgpu-readout,.data-table th,.data-table td,.data-table td>span,.strategy-item p,.bullet-text,.timeline-item p,.brief-role,.brief-value,.brief-delta,.experience-brief-row p,.experience-bet-order,.experience-bet p,.gate-quarter,.experience-gate p,.gate-criterion>span,.revenue-sculpture-totals strong,.revenue-sculpture-totals span,.revenue-segment>span,.revenue-segment small,.revenue-sculpture-readout,.experience-table-unit';
    const labels = [...slide.querySelectorAll(`${textSelector},.experience-chart-key li span,.experience-chart-key li strong,.experience-chart-key li b`)].filter(el => visible(el) && el.textContent.trim());
    const contrast = [];
    for (const el of labels) {
      const css = getComputedStyle(el);
      let foreground = rgba(css.webkitTextFillColor || css.color), background = [0, 0, 0, 0];
      const images = [];
      // Composite translucent backgrounds and opacity groups, including text
      // alpha. Comparing color strings misses white-on-ivory failures.
      for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node), layer = rgba(style.backgroundColor);
        foreground = over(foreground, layer);
        background = over(background, layer);
        foreground[3] *= Number(style.opacity);
        background[3] *= Number(style.opacity);
        if (style.backgroundImage !== 'none') images.push(style.backgroundImage);
      }
      foreground = over(foreground, [1, 1, 1, 1]);
      background = over(background, [1, 1, 1, 1]);
      const a = luminance(foreground), b = luminance(background);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      const large = parseFloat(css.fontSize) >= 24 || (parseFloat(css.fontSize) >= 18.66 && parseInt(css.fontWeight, 10) >= 700);
      const required = large ? 3 : 4.5;
      contrast.push({ element: name(el), ratio: +ratio.toFixed(2), required, foreground, background, backgroundImages: images.length });
      if (ratio + .02 < required) defects.push({ kind: 'contrast', element: name(el), ratio: +ratio.toFixed(2), required });
      const r = el.getBoundingClientRect();
      // Phone content may extend vertically inside its scrolling section.
      if (r.left < Math.max(0, sr.left) - 2 || r.right > Math.min(innerWidth, sr.right) + 2) defects.push({ kind: 'horizontal-overflow', element: name(el), left: r.left, right: r.right });
      if (!mobile && (r.top < sr.top - 2 || r.bottom > sr.bottom + 2)) defects.push({ kind: 'vertical-overflow', element: name(el), top: r.top, bottom: r.bottom });
    }
    if (document.documentElement.scrollWidth > innerWidth + 2 || slide.scrollWidth > slide.clientWidth + 2) defects.push({ kind: 'horizontal-scroll', document: document.documentElement.scrollWidth, slide: slide.scrollWidth, width: slide.clientWidth });
    if (mobile) {
      for (const el of document.querySelectorAll('button,[role="button"]')) {
        const r = el.getBoundingClientRect();
        if (!visible(el) || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
        if (r.width < 43.5 || r.height < 43.5) defects.push({ kind: 'tap-target', element: name(el), width: r.width, height: r.height });
      }
    } else {
      const sources = [...slide.querySelectorAll('.slide-source>span')].filter(visible);
      const contents = [...new Set([...labels.filter(el => !el.closest('.slide-source')), ...slide.querySelectorAll('.echarts-chart,.d3-webgpu-plot,.chart-container,table')])].filter(visible);
      for (const source of sources) {
        const a = source.getBoundingClientRect();
        for (const content of contents) {
          if (content.contains(source)) continue;
          const b = content.getBoundingClientRect();
          const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (overlapX > 2 && overlapY > 2) defects.push({ kind: 'source-overlap', element: name(content), source: source.textContent.trim().slice(0, 60) });
        }
      }
    }
    return { defects, contrast, scrollHeight: slide.scrollHeight, clientHeight: slide.clientHeight, title: slide.querySelector('h1,h2')?.textContent.trim() };
  }, { mobile });
}

for (const [device, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  test.describe(device, () => {
  test.use({ viewport, isMobile: device === 'mobile', hasTouch: device === 'mobile', deviceScaleFactor: device === 'mobile' ? 2 : 1 });
  test(`flagship is readable through all 38 slides in a fresh file session on ${device}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await open(page);
    const manifest = { device, viewport, file: fixture, slides: [], errors };
    const defects = [];
    for (let index = 0; index < 38; index += 1) {
      if (index) {
        if (device === 'mobile') await page.locator('[data-experience-next]').tap();
        else await page.keyboard.press('ArrowRight');
        await expect(page.locator('.reveal > .slides > section.present')).toHaveAttribute('data-slide-number', String(index + 1).padStart(2, '0'));
      }
      await page.waitForTimeout(650);
      const root = page.locator('section.present .d3-webgpu-stage');
      if (await root.count()) await expect.poll(() => root.evaluate(el => el.dataset.d3View === '3d' ? !!el._threeExploration?.renderer : /ready|fallback/.test(el.dataset.d3State))).toBe(true);
      await page.locator('section.present').evaluate(el => el.scrollTo(0, 0));
      const result = await inspect(page, device === 'mobile');
      if (result.title !== deck.slides[index].title) result.defects.push({ kind: 'heading', expected: deck.slides[index].title, actual: result.title });
      const id = `${device}-${String(index + 1).padStart(2, '0')}`;
      const captures = [];
      const maxScroll = Math.max(0, result.scrollHeight - result.clientHeight);
      for (let top = 0, part = 1; ; part += 1) {
        await page.locator('section.present').evaluate((el, y) => el.scrollTo(0, y), top);
        const filename = `${id}${part > 1 ? `-part-${part}` : ''}.png`;
        await page.screenshot({ path: resolve(output, filename) });
        captures.push(filename);
        if (device !== 'mobile' || top >= maxScroll) break;
        top = Math.min(maxScroll, top + Math.max(100, result.clientHeight - 100));
      }
      await page.locator('section.present').evaluate(el => el.scrollTo(0, 0));
      manifest.slides.push({ index: index + 1, ...result, captures });
      defects.push(...result.defects.map(defect => ({ slide: index + 1, ...defect })));
    }
    writeFileSync(resolve(output, `${device}-manifest.json`), JSON.stringify(manifest, null, 2));
    expect(errors, 'No browser errors during the entire deck').toEqual([]);
    expect(defects, `Review ${device}-manifest.json and its unmodified screenshots`).toEqual([]);
  });

  test(`light appearance keeps opening, KPI, and decisions readable on ${device}`, async ({ page }) => {
    await open(page);
    await orbitBranch(page,'theme');
    await expect(page.locator('#gamma-theme-chooser')).toBeVisible();
    await page.locator('[data-presentation-theme="analyst-proof"]').click();
    await expect(page.locator('#gamma-theme-chooser')).not.toBeVisible();
    const report = [];
    for (const index of [0, 2, 37]) {
      await page.evaluate(i => Reveal.slide(i), index);
      await page.waitForTimeout(650);
      const result = await inspect(page, device === 'mobile');
      report.push({ slide: index + 1, ...result });
      await page.screenshot({ path: resolve(output, `${device}-light-${String(index + 1).padStart(2, '0')}.png`) });
    }
    writeFileSync(resolve(output, `${device}-light-manifest.json`), JSON.stringify(report, null, 2));
    expect(report.flatMap(slide => slide.defects.map(defect => ({ slide: slide.slide, ...defect })))).toEqual([]);
  });

  test(`chapter navigation and the optional Studio open from real controls on ${device}`, async ({ page }) => {
    await open(page);
    await page.locator('[data-experience-index]').click();
    await expect(page.locator('#experience-index')).toBeVisible();
    const destination = page.locator('[data-experience-jump]').nth(2);
    const index = Number(await destination.getAttribute('data-experience-jump'));
    await destination.click();
    await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', String(index + 1).padStart(2, '0'));
    await expect(page.locator('#experience-index')).not.toBeVisible();
    await orbitBranch(page,'studio');
    await expect(page.locator('.gamma-live-panel')).toBeVisible();
    await page.locator('[data-live=close]').click();
    await expect(page.locator('#gamma-studio-wizard')).not.toBeVisible();
    await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', String(index + 1).padStart(2, '0'));
  });

  test(`reviewer chart fixes preserve complete labels and values on ${device}`, async ({ page }) => {
    test.setTimeout(90_000);
    await open(page);
    const manifestPath = resolve(output, `${device}-manifest.json`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const defects = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const index of reviewSlides.map(number => number - 1)) {
      await page.evaluate(i => Reveal.slide(i), index);
      await page.waitForTimeout(1100);
      await page.locator('section.present').evaluate(el => el.scrollTo(0, 0));
      const result = await inspect(page, device === 'mobile');
      const charts = await page.locator('section.present .chart-container').evaluateAll(containers => containers.map(container => {
        const element = container.querySelector('[id^="chart_"]');
        const chart = echarts.getInstanceByDom(element), option = chart.getOption();
        const box = container.getBoundingClientRect();
        const labels = [...container.querySelectorAll('svg text')].map(text => {
          const r = text.getBoundingClientRect();
          return { text: text.textContent, left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top };
        });
        return { type: container.dataset.chartType, width: box.width, height: box.height, labels, orient: option.series[0]?.orient, endLabels: option.series.map(series => ({ name: series.name, show: series.endLabel?.show })) };
      }));
      const flattened = charts.flatMap(chart => chart.labels).map(label => label.text).join('').replace(/\s+/g, '');
      const expectRendered = value => {
        if (!flattened.includes(value.replace(/\s+/g, ''))) result.defects.push({ kind: 'missing-svg-label', value });
      };
      if ([9, 14].includes(index)) {
        const data = deck.slides[index].chart.data;
        const money = value => `${value < 0 ? '-' : ''}$${Math.abs(value) / 1e6}M`;
        if (device === 'mobile') {
          const key = page.locator('section.present .experience-chart-key[aria-label="Bridge components"]');
          await expect(key).toBeVisible();
          const rows = await key.locator('li').evaluateAll(items => items.map(item => [...item.querySelectorAll('b,span,strong')].map(element => element.textContent.trim())));
          expect(rows).toEqual(data.labels.map((label, i) => [String(i + 1), label, money(data.datasets[0].values[i])]));
          const svgLabels = charts[0].labels.map(label => label.text.trim());
          for (let number = 1; number <= data.labels.length; number++) expect(svgLabels).toContain(String(number));
        } else for (const label of data.labels) expectRendered(label);
        for (const value of data.datasets[0].values) {
          const abs = Math.abs(value);
          expectRendered(`${value < 0 ? '-' : ''}$${(abs / 1e6).toFixed(abs % 1e6 === 0 ? 0 : 1)}M`);
        }
      }
      if (index === 18) {
        for (const item of deck.slides[index].chart.data.items) for (const label of item.name.split(' · ')) expectRendered(label);
      }
      if (index === 25) {
        const names = deck.slides[index].chart.data.nodes;
        expect(charts[0].orient).toBe(device === 'mobile' ? 'vertical' : 'horizontal');
        if (device === 'mobile') {
          for (const name of names) expectRendered(deck.slides[index].chart.options.node_labels[name]);
          const fullLabels = page.locator('section.present .experience-flow-labels');
          await fullLabels.locator('summary').click();
          expect(await fullLabels.locator('li').allTextContents()).toEqual(names);
          await fullLabels.locator('summary').click();
        } else for (const name of names) expectRendered(name);
      }
      if (device === 'mobile') {
        for (const chart of charts) {
          if ([5, 31].includes(index)) expect(chart.endLabels.filter(series => series.show)).toEqual([]);
          for (const label of chart.labels) {
            if (label.left < -2 || label.right > chart.width + 2 || label.top < -2 || label.bottom > chart.height + 2) result.defects.push({ kind: 'svg-label-clipped', type: chart.type, ...label, chartWidth: chart.width, chartHeight: chart.height });
          }
        }
      }
      const captures = [], maxScroll = Math.max(0, result.scrollHeight - result.clientHeight);
      for (let top = 0, part = 1; ; part++) {
        await page.locator('section.present').evaluate((el, y) => el.scrollTo(0, y), top);
        const filename = `${device}-${String(index + 1).padStart(2, '0')}${part > 1 ? `-part-${part}` : ''}.png`;
        await page.screenshot({ path: resolve(output, filename) }); captures.push(filename);
        if (device !== 'mobile' || top >= maxScroll) break;
        top = Math.min(maxScroll, top + Math.max(100, result.clientHeight - 100));
      }
      manifest.slides[index] = { index: index + 1, ...result, charts, captures };
      defects.push(...result.defects.map(defect => ({ slide: index + 1, ...defect })));
    }
    manifest.targetedConfirmations = [...(manifest.targetedConfirmations || (manifest.targetedConfirmation ? [manifest.targetedConfirmation] : [])), { slides: reviewSlides, errors }];
    manifest.targetedConfirmation = { slides: reviewSlides, errors };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    expect(errors).toEqual([]);
    expect(defects).toEqual([]);
  });
  });
}

test('the capital-flow chart changes orientation when crossing the phone breakpoint', async ({ page }) => {
  await open(page);
  await page.evaluate(() => Reveal.slide(25));
  const chart = page.locator('section.present .chart-container > [id^="chart_"]');
  for (const [width, height, orientation] of [[390, 844, 'vertical'], [1440, 900, 'horizontal'], [390, 844, 'vertical']]) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => chart.evaluate(el => echarts.getInstanceByDom(el)?.getOption().series[0].orient)).toBe(orientation);
    const fullLabels = page.locator('section.present .experience-flow-labels');
    if (orientation === 'vertical') {
      await expect(fullLabels.locator('summary')).toBeVisible();
      const labels = (await chart.locator('svg text').allTextContents()).join('').replace(/\s+/g, '');
      for (const name of Object.values(deck.slides[25].chart.options.node_labels)) expect(labels).toContain(name.replace(/\s+/g, ''));
    } else await expect(fullLabels).not.toBeVisible();
  }
});
