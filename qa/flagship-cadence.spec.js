import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const deck = loadDeck('presentations/flagship.yaml');
const output = resolve('output/flagship-cadence');
const file = resolve(output, 'deck.html');
mkdirSync(output, { recursive: true });
writeFileSync(file, renderDeck(deck));

async function open(page) {
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__GAMMA_READY__ === true);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.reveal > .slides > section')).toHaveCount(38);
  await expect(page.locator('#gamma-studio-wizard')).not.toBeVisible();
  await expect(page.locator('#gamma-theme-chooser')).not.toBeVisible();
}

async function visit(page, number) {
  await page.evaluate(index => Reveal.slide(index), number - 1);
  const slide = page.locator('section.present');
  await expect(slide).toHaveAttribute('data-slide-number', String(number).padStart(2, '0'));
  await page.waitForTimeout(750);
  await slide.evaluate(element => element.scrollTo(0, 0));
  return slide;
}

async function firstScreen(locator, label) {
  await expect(locator, `${label} is rendered`).toBeVisible();
  const geometry = await locator.evaluate(element => {
    const section = element.closest('section');
    const content = element.getBoundingClientRect();
    const stage = section.getBoundingClientRect();
    const viewport = { top: Math.max(stage.top, 0), bottom: Math.min(stage.bottom, innerHeight), left: Math.max(stage.left, 0), right: Math.min(stage.right, innerWidth) };
    return { content: { top: content.top, bottom: content.bottom, left: content.left, right: content.right }, viewport, scrollTop: section.scrollTop };
  });
  expect(geometry.scrollTop, `${label} checked before scrolling`).toBe(0);
  expect(geometry.content.top, `${label} starts inside first screen`).toBeGreaterThanOrEqual(geometry.viewport.top - 1);
  expect(geometry.content.bottom, `${label} ends inside first screen`).toBeLessThanOrEqual(geometry.viewport.bottom + 1);
  expect(geometry.content.left, `${label} clears left edge`).toBeGreaterThanOrEqual(geometry.viewport.left - 1);
  expect(geometry.content.right, `${label} clears right edge`).toBeLessThanOrEqual(geometry.viewport.right + 1);
}

test.describe('mobile narrative cadence', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  test('the readout and scorecard expose every signal before scrolling', async ({ page }) => {
    await open(page);
    let slide = await visit(page, 2);
    for (const panel of deck.slides[1].panels) {
      await firstScreen(slide.getByText(panel.title, { exact: true }), `Readout ${panel.title}`);
      await firstScreen(slide.getByText(panel.value, { exact: true }), `Readout ${panel.value}`);
      await expect(slide.getByText(panel.delta, { exact: true })).toBeVisible();
      await expect(slide.getByText(panel.subtitle, { exact: true })).toBeVisible();
    }
    slide = await visit(page, 3);
    for (const metric of deck.slides[2].metrics) {
      await firstScreen(slide.getByText(metric.label, { exact: true }), `Scorecard ${metric.label}`);
      await firstScreen(slide.getByText(metric.value, { exact: true }), `Scorecard ${metric.value}`);
      await expect(slide.getByText(metric.delta, { exact: true })).toBeVisible();
    }
    // A compact layout must preserve the supplied interpretation, including on phones.
    const insight = slide.getByText(deck.slides[2].insight, { exact: true });
    await expect(insight).toBeVisible();
    await insight.scrollIntoViewIfNeeded();
    await expect(insight).toBeInViewport();
  });

  test('all automation readings and the action register are discoverable in the first screen', async ({ page }) => {
    await open(page);
    const slide = await visit(page, 17);
    for (const panel of deck.slides[16].panels.filter(item => item.type === 'chart')) {
      const title = slide.getByText(panel.title, { exact: true });
      await firstScreen(title, panel.title);
      const article = title.locator('xpath=ancestor::article');
      const gaugeValue = article.locator('svg text').filter({ hasText: new RegExp(`^${String(panel.chart.data.value).replace('.', '\\.')}%$`) });
      await firstScreen(gaugeValue, `${panel.title} ${panel.chart.data.value}%`);
      const geometry = await gaugeValue.evaluate(element => {
        const label = element.getBoundingClientRect();
        const chart = element.closest('.dashboard-chart').getBoundingClientRect();
        return { label: { left: label.left, right: label.right, top: label.top, bottom: label.bottom }, chart: { left: chart.left, right: chart.right, top: chart.top, bottom: chart.bottom } };
      });
      expect(geometry.label.left).toBeGreaterThanOrEqual(geometry.chart.left - 1);
      expect(geometry.label.right).toBeLessThanOrEqual(geometry.chart.right + 1);
      expect(geometry.label.top).toBeGreaterThanOrEqual(geometry.chart.top - 1);
      expect(geometry.label.bottom).toBeLessThanOrEqual(geometry.chart.bottom + 1);
    }
    await firstScreen(slide.getByText('Open control actions', { exact: true }), 'Open control actions');
    const rows = await slide.locator('table tbody tr').evaluateAll(elements => elements.map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent.trim())));
    expect(rows).toEqual(deck.slides[16].panels.find(panel => panel.type === 'table').table.rows);
  });

  test('the closing shows all three board decisions before scrolling', async ({ page }) => {
    await open(page);
    const slide = await visit(page, 38);
    for (const decision of deck.slides[37].items) {
      await firstScreen(slide.getByText(decision.title, { exact: true }), decision.title);
      await expect(slide.getByText(decision.description, { exact: true })).toBeVisible();
    }
  });

  test('the continuation control leaves the slide content unobscured', async ({ page }) => {
    await open(page);
    for (const number of [1, 7, 21]) {
      const slide = await visit(page, number);
      const more = page.getByRole('button', { name: 'More below' });
      await expect(more).toBeVisible();
      const content = await slide.boundingBox(), control = await more.boundingBox();
      expect(control.y, `Continuation is below slide ${number}, so it cannot cover data`).toBeGreaterThanOrEqual(content.y + content.height - 1);
      await more.tap();
      await expect.poll(() => slide.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    }
  });
});

for (const device of ['desktop', 'mobile']) {
  test.describe(`${device} authored navigation and gates`, () => {
    test.use(device === 'mobile' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } });

    test('market lenses navigate to their actual evidence through the visible links', async ({ page }) => {
      await open(page);
      for (const [lens, number] of [['Price', 29], ['Exposure', 30], ['Outlook', 36]]) {
        await page.locator('[data-experience-index]').click();
        await page.locator('#experience-index').getByRole('button', { name: /28 Market perspectives/ }).click();
        const chapter = page.locator('section.present');
        await expect(chapter).toHaveAttribute('data-slide-number', '28');
        const destination = chapter.getByRole('link', { name: new RegExp(`^${lens}`) });
        if (device === 'mobile') await firstScreen(destination, `Chapter link ${lens}`);
        await destination.click();
        await expect(page.locator('section.present')).toHaveAttribute('data-slide-number', String(number));
        await expect(page.locator('section.present').getByRole('heading', { name: deck.slides[number - 1].title, exact: true })).toBeVisible();
      }
    });

    test('the roadmap preserves every deliverable and release criterion', async ({ page }) => {
      await open(page);
      const slide = await visit(page, 25);
      const expected = [
        ['Q1', 'LatAm live', 'Brazil and Mexico', '10 design partners plus rail and regulatory readiness.'],
        ['Q2', 'Platform GA', 'White-label API and treasury dashboard', 'five live enterprise customers.'],
        ['Q3', 'Compliance', 'Embedded KYB/KYC and monitoring', '30 percent attach for new enterprise logos.'],
        ['Q4', 'Scale', 'Commercial scale and automation', '200-plus customers and 78 percent margin.'],
      ];
      const rows = slide.getByRole('listitem');
      await expect(rows).toHaveCount(4);
      for (let index = 0; index < expected.length; index++) {
        for (const phrase of expected[index]) await expect(rows.nth(index).getByText(phrase, { exact: true })).toBeVisible();
        await expect(rows.nth(index).getByText('Release criterion', { exact: true })).toBeVisible();
      }
      await expect(slide.getByText('Capital and headcount release only when the preceding operating gate is met.', { exact: true })).toBeVisible();
    });
  });
}
