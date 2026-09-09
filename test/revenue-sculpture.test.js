import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDeck } from '../src/loader/index.js';
import { buildRevenueSculptureModel, revenueSculptureHTML } from '../src/engine/components/revenue-sculpture.js';

test('revenue sculpture reconciles both years and preserves one amount scale at every endpoint', () => {
  const model = buildRevenueSculptureModel(loadDeck('presentations/flagship.yaml'));
  assert.deepEqual(model.totals, [8300000, 16200000]);
  assert.deepEqual(model.years, ['FY24', 'FY25']);
  assert.equal(model.bands.length, 5);
  for (const band of model.bands) {
    assert.ok(Math.abs((band.from.top - band.from.bottom) / band.before - model.unit) < 1e-15);
    assert.ok(Math.abs((band.to.top - band.to.bottom) / band.after - model.unit) < 1e-15);
    if (band.index) {
      const previous = model.bands[band.index - 1];
      assert.ok(Math.abs(previous.from.bottom - band.from.top - model.gap) < 1e-10);
      assert.ok(Math.abs(previous.to.bottom - band.to.top - model.gap) < 1e-10);
    }
  }
  assert.deepEqual(model.bands.find(band => band.name === 'Platforms').before, 1400000);
  assert.deepEqual(model.bands.find(band => band.name === 'Platforms').after, 4000000);
});

test('the sculpture refuses unrelated units and unrepresentable revenue instead of fabricating geometry', () => {
  const chart = { type: 'bar', data: { labels: ['A'], datasets: [{ label: 'Prior', values: [1] }, { label: 'Current', values: [2] }] }, options: { format_y: 'percent' } };
  assert.equal(buildRevenueSculptureModel({ slides: [{ chart }] }), null);
  chart.options.format_y = 'currency_m';
  chart.data.datasets[1].values = [-2];
  assert.equal(buildRevenueSculptureModel({ slides: [{ chart }] }), null);
  chart.data.datasets[1].values = [NaN];
  assert.equal(buildRevenueSculptureModel({ slides: [{ chart }] }), null);
  chart.data.datasets[1].values = [];
  assert.equal(buildRevenueSculptureModel({ slides: [{ chart }] }), null);
  chart.data.datasets.forEach(set => set.values = [0]);
  assert.equal(buildRevenueSculptureModel({ slides: [{ chart }] }), null);
});

test('exact source values remain available in semantic HTML, with untrusted labels escaped in SVG, buttons and JSON', () => {
  const deck = loadDeck('presentations/flagship.yaml');
  const chart = deck.slides.find(slide => slide.chart?.type === 'bar').chart;
  chart.data.labels[0] = '</script><img src=x onerror=alert(1)>';
  const html = revenueSculptureHTML(deck);
  assert.equal((html.match(/class="revenue-segment revenue-segment-/g) || []).length, 5);
  assert.match(html, /FY24 \$1\.4M, FY25 \$4\.0M/);
  assert.match(html, /<strong>\$8\.3M<\/strong>/);
  assert.match(html, /<strong>\$16\.2M<\/strong>/);
  assert.ok(!html.includes('</script><img'));
  assert.ok(html.includes('&lt;/script&gt;&lt;img'));
  assert.ok(html.includes('\\u003c/script>\\u003cimg'));
});
