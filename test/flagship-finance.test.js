import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDeck } from '../src/loader/index.js';
import { buildEChartsConfig } from '../src/engine/components/chart-builder.js';
import { d3WebGPUModel } from '../src/engine/components/d3-webgpu.js';
import { getTheme } from '../src/themes/index.js';

test('the flagship order book reconciles its ladder to cumulative depth', () => {
  const deck = loadDeck('presentations/flagship.yaml');
  const slide = deck.slides.find(slide => slide.kicker === 'MARKET MICROSTRUCTURE');
  const [depth, imbalance] = slide.panels.map(panel => panel.chart);
  for (const [side, series] of [['bids', 0], ['asks', 1]]) {
    const ladder = imbalance.data.datasets[series].values.map(Math.abs).reverse();
    const cumulative = ladder.map((_, index) => ladder.slice(0, index + 1).reduce((sum, value) => sum + value, 0));
    const observations = depth.data[side].map(point => point[1]);
    assert.deepEqual(observations, side === 'bids' ? cumulative.reverse() : cumulative);
  }
  const config = buildEChartsConfig(depth, getTheme('signal-room'));
  assert.equal(config.xAxis.min, 'dataMin');
  assert.equal(config.xAxis.max, 'dataMax');
  assert.equal(config.xAxis.scale, true);
  const paired = buildEChartsConfig(imbalance, getTheme('signal-room'));
  assert.equal(config.series[0].itemStyle.color, paired.series[0].itemStyle.color);
  assert.equal(config.series[1].itemStyle.color, paired.series[1].itemStyle.color);
});

test('cohorts preserve missing observations and GPU revenue preserves same-unit totals', () => {
  const deck = loadDeck('presentations/flagship.yaml');
  const cohort = deck.slides.find(slide => slide.chart?.type === 'heatmap').chart;
  const config = buildEChartsConfig(cohort, getTheme('signal-room'));
  assert.equal(config.series[0].data.length, cohort.data.values.flat().filter(Number.isFinite).length);
  assert.equal(config.xAxis.splitArea.show, false);
  assert.equal(config.yAxis.splitArea.show, false);
  const revenue = d3WebGPUModel(deck.slides.find(slide => slide.variant === 'd3-webgpu' && slide.chart.type === 'bar').chart);
  assert.deepEqual(revenue.series.map(series => series.values.reduce((sum, value) => sum + value, 0)), [8_300_000, 16_200_000]);
});
