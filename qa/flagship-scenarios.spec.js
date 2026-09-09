import { orbitAction, orbitBranch } from './orbit-helpers.js';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const output = resolve('output/flagship-scenarios');
const file = resolve(output, 'deck.html');
const deck = loadDeck('presentations/flagship.yaml');
const slideSpec = deck.slides[32];
const profile = slideSpec.panels.find(panel => panel.chart?.type === 'parallel').chart;
const matrix = slideSpec.panels.find(panel => panel.chart?.type === 'heatmap').chart;
const names = ['Scenario A', 'Scenario B', 'Scenario C', 'Scenario D', 'Scenario E'];
mkdirSync(output, { recursive: true });
writeFileSync(file, renderDeck(deck));

async function state(chart) {
  return chart.evaluate(element => {
    const instance = echarts.getInstanceByDom(element);
    if (!instance) return { pending: true };
    const option = instance.getOption();
    const model = instance.getModel();
    return {
      series: option.series.map(series => ({ name: series.name, data: series.data, color: series.lineStyle.color })),
      active: model.getSeries().filter(series => !model.isSeriesFiltered(series)).map(series => series.name),
      selected: option.legend[0].selected,
      axes: option.parallelAxis.map(axis => ({ name: axis.name, min: axis.min, max: axis.max })),
      trajectories: [...element.querySelectorAll('svg path')].filter(path => (path.getAttribute('d')?.match(/L/g) || []).length >= 4).map(path => ({ color: path.getAttribute('stroke'), path: path.getAttribute('d') })),
    };
  });
}

async function capture(page, device, suffix = '') {
  const stage = page.locator('section.present');
  await stage.evaluate(element => element.scrollTo(0, 0));
  const { scrollHeight, clientHeight } = await stage.evaluate(element => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
  const captures = [];
  for (let top = 0, part = 1; ; part++) {
    await stage.evaluate((element, y) => element.scrollTo(0, y), top);
    const filename = `${device}-33${suffix}${part > 1 ? `-part-${part}` : ''}.png`;
    await page.screenshot({ path: resolve(output, filename) });
    captures.push(filename);
    if (device === 'desktop' || top >= scrollHeight - clientHeight) break;
    top = Math.min(scrollHeight - clientHeight, top + clientHeight - 100);
  }
  return captures;
}

for (const device of ['desktop', 'mobile']) {
  test.describe(`${device} scenario evidence`, () => {
    test.use(device === 'mobile' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } });

    test('every factor trajectory is identified, selectable, and retains its exact source values', async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__GAMMA_READY__ === true);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => Reveal.slide(32));
      const slide = page.locator('section.present');
      await expect(slide).toHaveAttribute('data-slide-number', '33');
      await page.waitForTimeout(1000);
      const parallel = slide.locator('[data-chart-type="parallel"]');
      const chart = parallel.locator('[id^="chart_"]');
      const buttons = parallel.locator('[data-chart-legend]');
      await expect(buttons).toHaveText(names);
      for (const name of names) {
        const button = await orbitAction(page,parallel.locator('[data-chart-legend]').filter({hasText:name}));
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
      }
      const before = await state(chart);
      expect(before.series.map(series => series.name)).toEqual(names);
      expect(before.series.map(series => series.data[0])).toEqual(profile.data.rows);
      expect(new Set(before.series.map(series => series.color)).size).toBe(5);
      expect(before.active).toEqual(names);
      for (const series of before.series) expect(before.trajectories.some(path => path.color === series.color), `${series.name} is actually drawn`).toBe(true);

      const heatmap = slide.locator('[data-chart-type="heatmap"]');
      const axes = await heatmap.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return [...element.querySelectorAll('svg text')].map(text => {
          const rect = text.getBoundingClientRect();
          return { text: text.textContent, left: rect.left - bounds.left, right: rect.right - bounds.left, top: rect.top - bounds.top, bottom: rect.bottom - bounds.top, chartWidth: bounds.width, chartHeight: bounds.height };
        });
      });
      for (const name of matrix.data.x_labels) {
        const labels = axes.filter(label => label.text === name);
        expect(labels, `${name} has a complete column label and row label`).toHaveLength(2);
        for (const label of labels) {
          expect(label.left, `${name} left bound`).toBeGreaterThanOrEqual(-1);
          expect(label.right, `${name} right bound`).toBeLessThanOrEqual(label.chartWidth + 1);
          expect(label.top, `${name} top bound`).toBeGreaterThanOrEqual(-1);
          expect(label.bottom, `${name} bottom bound`).toBeLessThanOrEqual(label.chartHeight + 1);
        }
      }
      const captures = await capture(page, device);

      const first = await orbitAction(page,parallel.locator('[data-chart-legend]').filter({hasText:names[0]}));
      if (device === 'mobile') await first.tap();
      else await first.click();
      await expect(first).toHaveAttribute('aria-pressed', 'false');
      await expect.poll(async () => (await state(chart)).active).toEqual(names.slice(1));
      await page.waitForTimeout(500);
      const hidden = await state(chart);
      expect(hidden.trajectories.some(path => path.color === before.series[0].color), 'The selected trajectory disappears from the rendered chart').toBe(false);
      expect(hidden.series.map(series => series.data[0]), 'Toggling a view does not mutate source data').toEqual(profile.data.rows);

      await first.focus();
      await page.keyboard.press('Space');
      await expect(first).toHaveAttribute('aria-pressed', 'true');
      await expect(slide).toHaveAttribute('data-slide-number', '33');
      await expect.poll(async () => (await state(chart)).active).toEqual(names);
      for (const name of names.slice(1)) {
        const button = await orbitAction(page,parallel.locator('[data-chart-legend]').filter({hasText:name}));
        if (device === 'mobile') await button.tap();
        else await button.click();
      }
      await expect.poll(async () => (await state(chart)).active).toEqual([names[0]]);
      await page.mouse.move(10, 10);
      await page.waitForTimeout(500);
      const isolated = await state(chart);
      expect(isolated.axes, 'Isolating a trajectory preserves every factor scale').toEqual(before.axes);
      expect(isolated.trajectories.filter(path => before.series.some(series => series.color === path.color))).toHaveLength(1);
      expect(isolated.trajectories.find(path => path.color === before.series[0].color).path, 'Scenario A retains its exact visible geometry').toEqual(before.trajectories.find(path => path.color === before.series[0].color).path);
      captures.push(...await capture(page, device, '-isolated'));

      await page.setViewportSize(device === 'desktop' ? { width: 390, height: 844 } : { width: 1440, height: 900 });
      await expect.poll(async () => (await state(chart)).active).toEqual([names[0]]);
      await orbitBranch(page,'theme');
      await page.locator('[data-presentation-theme="analyst-proof"]').click();
      await expect.poll(async () => (await state(chart)).active).toEqual([names[0]]);
      for (const name of names) await expect(parallel.locator('[data-chart-legend]').filter({hasText:name})).toHaveAttribute('aria-pressed', String(name === names[0]));
      expect((await state(chart)).series.map(series => series.data[0])).toEqual(profile.data.rows);
      expect(errors).toEqual([]);
      writeFileSync(resolve(output, `${device}-report.json`), JSON.stringify({ before, hidden, isolated, axes, captures, errors }, null, 2));
    });
  });
}
