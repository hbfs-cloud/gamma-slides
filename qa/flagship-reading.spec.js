import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

const deck = loadDeck('presentations/flagship.yaml');
const output = resolve('output/flagship-reading');
mkdirSync(output, { recursive:true });
const file = resolve(output, 'deck.html');
writeFileSync(file, renderDeck(deck));
test.use({ viewport:{ width:390,height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
async function openSlide(page, number) {
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.__GAMMA_READY__);
  await page.evaluate(index => Reveal.slide(index), number - 1);
  await page.waitForTimeout(1000);
  return page.locator('section.present');
}

test('the stacked P&L retains its monetary scale beside the actual figures', async ({ page }) => {
  const slide = await openSlide(page, 7);
  const unit = slide.getByText('Amounts in $M', { exact:true });
  await expect(unit).toBeInViewport();
  const rows = await slide.locator('tbody tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent.trim())));
  expect(rows).toEqual(deck.slides[6].table.rows);
  const unitBox = await unit.boundingBox(), firstRow = await slide.locator('tbody tr').first().boundingBox();
  expect(unitBox.y + unitBox.height).toBeLessThanOrEqual(firstRow.y);
});

test('all revenue legend labels clear the doughnut arc', async ({ page }) => {
  const slide = await openSlide(page, 8);
  const proof = await slide.locator('[data-chart-type="doughnut"]').evaluate(container => {
    const host = container.querySelector('[id^="chart_"]');
    const instance = echarts.getInstanceByDom(host), model = instance.getModel().getSeriesByIndex(0);
    const data = model.getData(), pie = data.getItemLayout(0), box = host.getBoundingClientRect();
    const names = Array.from({ length:data.count() }, (_, index) => data.getName(index));
    const labels = [...host.querySelectorAll('svg text')].filter(text => names.includes(text.textContent.trim()));
    return { names, labels:labels.map(text => ({ name:text.textContent.trim(), top:text.getBoundingClientRect().top })), circleBottom:box.top + (pie.cy + pie.r) * box.height / host.clientHeight };
  });
  expect(proof.labels.map(label => label.name).sort()).toEqual([...proof.names].sort());
  for (const label of proof.labels) expect(label.top - proof.circleBottom, `${label.name} clears the lower arc`).toBeGreaterThan(8);
});

test('the funding flow names every node inside its first visible diagram', async ({ page }) => {
  const slide = await openSlide(page, 26);
  const proof = await slide.locator('[data-chart-type="sankey"]').evaluate(container => {
    const stage = container.closest('section').getBoundingClientRect();
    return [...container.querySelectorAll('svg text')].map(text => ({ text:text.textContent, top:text.getBoundingClientRect().top, bottom:text.getBoundingClientRect().bottom, stageTop:stage.top, stageBottom:stage.bottom }));
  });
  const text = proof.map(label => label.text).join('').replace(/\s+/g, '');
  for (const name of Object.values(deck.slides[25].chart.options.node_labels)) expect(text).toContain(name.replace(/\s+/g, ''));
  for (const label of proof) {
    expect(label.top).toBeGreaterThanOrEqual(label.stageTop);
    expect(label.bottom).toBeLessThanOrEqual(label.stageBottom);
  }
  const labels = slide.locator('.experience-flow-labels');
  await labels.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(slide).toHaveAttribute('data-slide-number', '26');
  await expect(labels).toHaveAttribute('open', '');
  expect(await labels.locator('li').allTextContents()).toEqual(deck.slides[25].chart.data.nodes);
});
