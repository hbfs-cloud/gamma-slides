import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { escapeHtml, safeUrl, richText } from '../src/engine/html.js';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';
import { buildEChartsConfig } from '../src/engine/components/chart-builder.js';
import { getTheme } from '../src/themes/index.js';
import { renderPublishingHTML, renderYouTubeStudioHTML } from '../src/youtube/studio.js';
import { uploadToYouTube, uploadVideoResumable } from '../src/youtube/upload.js';
import { injectLiveReload } from '../src/preview.js';
import { buildStaticSite } from '../src/site/build.js';
import { buildPresentationLibrary } from '../src/site/library.js';
import { normalizePagesRepo, presentationSlug, presentationUrl } from '../src/site/github-pages.js';

test('preview runtime is injected at the real closing body, not inside bundled source strings', () => {
  const html = '<!doctype html><html><head></head><body><script>const markup="<body></body>";</script><main>Deck</main></body></html>';
  const rendered = injectLiveReload(html, { enabled: true, token: 'test-token' });

  assert.match(rendered, /<script>const markup="<body><\/body>";<\/script><main>Deck<\/main>/);
  assert.ok(rendered.indexOf("new EventSource('/__gamma/events')") > rendered.indexOf('<main>Deck</main>'));
  assert.match(rendered, /<head>\n<script>window\.__GAMMA_TERMINAL__/);
});

test('HTML helpers escape content and reject active URL schemes', () => {
  assert.equal(escapeHtml('<b title="x">&</b>'), '&lt;b title=&quot;x&quot;&gt;&amp;&lt;/b&gt;');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('https://example.com/a?x=1&y=2'), 'https://example.com/a?x=1&amp;y=2');
  assert.equal(richText('A **safe** <tag>'), 'A <strong>safe</strong> &lt;tag&gt;');
});

test('a minimal YAML deck loads and renders', () => {
  const deck = loadDeck(`
version: "1"
meta:
  title: Quarterly update
  language: en
slides:
  - layout: title
    title: Strong foundations
    subtitle: Clear next steps
`);
  const html = renderDeck(deck);
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /Strong foundations/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /class="footer-bar brand-rail"/);
  assert.match(html, /class="brand-deck-title" title="Quarterly update">Quarterly update/);
  assert.match(html, /class="brand-monogram"[^>]*>G</);
  assert.match(html, /class="watermark brand-watermark"[^>]*><span>Gamma Slides<\/span>/);
});

test('static sites use index.html and bypass Jekyll processing', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'gamma-site-'));
  try {
    const deck = loadDeck(`
meta:
  title: Published decision deck
slides:
  - layout: title
    title: Ready for the web
`);
    const result = buildStaticSite(deck, tempDir);
    assert.equal(result.indexPath, join(tempDir, 'index.html'));
    assert.match(readFileSync(result.indexPath, 'utf-8'), /Ready for the web/);
    assert.equal(readFileSync(join(tempDir, '.nojekyll'), 'utf-8'), '');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('presentation libraries expose stable routes and a machine-readable catalog', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'gamma-library-'));
  const sourceDir = join(tempDir, 'presentations');
  const outputDir = join(tempDir, '_site');
  try {
    writeFileSync(join(tempDir, 'placeholder'), '');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(join(sourceDir, 'Comité FY26.yaml'), `
meta:
  title: Comité FY26
slides:
  - layout: title
    title: Décider maintenant
`);
    const fallback = join(tempDir, 'fallback.yaml');
    writeFileSync(fallback, `slides:\n  - layout: title\n    title: Fallback only\n`);
    const result = buildPresentationLibrary({ inputDir: sourceDir, outputDir, include: [fallback] });
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].slug, 'comite-fy26');
    assert.match(readFileSync(join(outputDir, 'index.html'), 'utf-8'), /Comité FY26/);
    assert.match(readFileSync(join(outputDir, 'presentations.json'), 'utf-8'), /"slug": "comite-fy26"/);
    assert.match(readFileSync(join(outputDir, 'comite-fy26', 'index.html'), 'utf-8'), /Décider maintenant/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('GitHub Pages presentation identifiers are normalized and validated', () => {
  assert.equal(presentationSlug('Comité FY26 / Plan'), 'comite-fy26-plan');
  assert.equal(normalizePagesRepo('hbfs-cloud/gamma-slides'), 'hbfs-cloud/gamma-slides');
  assert.equal(presentationUrl('hbfs-cloud/gamma-slides', 'FY26 Plan'), 'https://hbfs-cloud.github.io/gamma-slides/fy26-plan/');
  assert.throws(() => normalizePagesRepo('not a repo'), /owner\/repository/);
});

test('the persistent brand rail carries supplied identity on every deck', () => {
  const deck = loadDeck(`
meta:
  title: FY26 Operating Plan
  company: Northstar Labs
branding:
  watermark: Internal review
  company_url: northstar.example
slides:
  - layout: title
    title: Direction
`);
  const html = renderDeck(deck);

  assert.match(html, /class="brand-monogram"[^>]*>N</);
  assert.match(html, /class="footer-wordmark">Northstar Labs/);
  assert.match(html, /class="brand-deck-title" title="FY26 Operating Plan">FY26 Operating Plan/);
  assert.match(html, /class="brand-classification">Internal review/);
  assert.match(html, /class="brand-url">northstar\.example/);
  assert.match(html, /class="watermark brand-watermark"[^>]*><span>Internal review<\/span>/);
});

test('Presenter Studio ships a permission-safe startup wizard and recording controls', () => {
  const deck = loadDeck(`
slides:
  - layout: title
    title: Studio preflight
`);
  const html = renderDeck(deck);

  assert.match(html, /wizard\.id='gamma-studio-wizard'/);
  assert.match(html, /data-testid="studio-mode-present"/);
  assert.match(html, /data-testid="studio-mode-camera"/);
  assert.match(html, /data-testid="studio-mode-mic"/);
  assert.match(html, /data-testid="studio-camera-drag"/);
  assert.match(html, /data-testid="studio-mode-record"/);
  assert.match(html, /data-testid="studio-mode-terminal"/);
  assert.match(html, /data-studio-theme-grid/);
  assert.match(html, /Step '\+state\.step\+' of 4/);
  assert.match(html, /data-testid="studio-terminal-drag"/);
  assert.match(html, /data-testid="studio-terminal-splitter"/);
  assert.match(html, /data-testid','studio-terminal-restore/);
  assert.match(html, /gamma-terminal-frame-v2/);
  assert.match(html, /gamma-terminal-history-v1/);
  assert.match(html, /gamma-terminal-docked/);
  assert.doesNotMatch(html, /terminalTool\.disabled=true/);
  assert.match(html, /Slide commands ready/);
  assert.match(html, /else if\(mode==='terminal'\)state\.options\.terminal/);
  assert.match(html, /System commands require the localhost bridge/);
  assert.match(html, /else await runShellCommand/);
  assert.match(html, /data-testid="studio-request-media"/);
  assert.match(html, /aria-label="Microphone device"/);
  assert.match(html, /action==='mic'\)toggleMicrophone\(\)/);
  assert.match(html, /gamma-camera-frame-v1/);
  assert.match(html, /videoBitsPerSecond:12000000/);
  assert.match(html, /data-testid="studio-request-screen"/);
  assert.match(html, /data-testid="studio-summary"/);
  assert.match(html, /data-testid="studio-pause"/);
  assert.match(html, /startChartNarrative/);
  assert.match(html, /if \(gammaExportMode \|\| chartNarrativeTimers/);
  assert.match(html, /data-testid="studio-stop"/);
  assert.match(html, /setAttribute\('data-testid','studio-recording-review'\)/);
  assert.match(html, /data-testid="studio-review-rewind"/);
  assert.match(html, /\[5,30\]\.forEach\(seconds/);
  assert.match(html, /Math\.max\(0,reviewVideo\.currentTime-/);
  assert.match(html, /showSaveFilePicker/);
  assert.match(html, /Your browser controls the destination; check Downloads/);
  assert.match(html, /state\.recorder\.onpause=\(\)=>syncPauseUI\(true\)/);
  assert.match(html, /state\.phase='ready';await startRecording\(\)/);
  assert.match(html, /state\.step=Math\.min\(4,state\.step\+1\)/);
  assert.match(html, /if\(selectStudioTheme\(themeId\)\)\{state\.step=2;renderWizard\(\)\}/);
  assert.match(html, /state\.presentationTheme=themeId;renderStudioThemes\(\);if\(typeof commitPresentationTheme/);
  assert.doesNotMatch(html, /if\(state\.step===2&&!state\.options\.camera/);
  assert.doesNotMatch(html, /if\(\['recording','paused'\]\.includes\(state\.phase\)\)stopRecording\(\)/);
  assert.match(html, /data-studio-action','skip/);
  assert.match(html, /data-gamma-studio-ready/);
  assert.match(html, /params\.has\('gamma-qa'\)/);

  // Permission APIs are only called inside functions wired to explicit user actions.
  assert.equal((html.match(/navigator\.mediaDevices\.getUserMedia\(/g) || []).length, 1);
  assert.equal((html.match(/navigator\.mediaDevices\.getDisplayMedia\(/g) || []).length, 1);
  assert.match(html, /action==='request-media'\)await requestUserMedia\(\)/);
  assert.match(html, /action==='request-screen'&&state\.options\.record\)await requestDisplay\(\)/);
  assert.doesNotMatch(html, /if\s*\(!state\.cameraStream\)\s*await\s+toggleCamera/);
});

test('generated decks embed their complete runtime and fonts without a CDN', () => {
  const deck = loadDeck(`theme: boardroom
slides:
  - layout: chart
    title: Offline finance runtime
    chart:
      type: bar
      data:
        labels: [Q4]
        datasets: [{ label: Revenue, values: [4200000] }]
`);
  const html = renderDeck(deck);

  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)=["']https?:/iu);
  assert.doesNotMatch(html, /cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/iu);
  assert.match(html, /data-gamma-runtime="reveal\.js@5\.1\.0"/u);
  assert.match(html, /data-gamma-runtime="echarts@6\.1\.0"/u);
  assert.match(html, /data-gamma-runtime="reveal-notes@5\.1\.0"/u);
  assert.match(html, /Instrument Sans/u);
  assert.match(html, /Source Serif 4/u);
  assert.match(html, /IBM Plex Mono/u);
  assert.match(html, /src: url\(data:font\/woff2;base64,/u);
});

test('interactive decks lazily render the current slide as SVG and expose Presenter Studio', () => {
  const deck = loadDeck(`slides:
  - layout: chart
    title: Live chart
    chart: { type: bar, data: { labels: [Q4], datasets: [{ values: [42] }] } }
`);
  const html = renderDeck(deck);
  assert.match(html, /initCharts\(gammaExportMode \? document : Reveal\.getCurrentSlide\(\)\)/);
  assert.match(html, /echarts\.init\(el, null, \{ renderer: 'svg' \}\)/);
  assert.match(html, /setAttribute\('data-testid','studio-wizard'\)/);
  assert.match(html, /Present only/);
  assert.match(html, /Camera & microphone/);
  assert.match(html, /Screen & tab audio/);
  assert.match(html, /data-gamma-studio-ready/);
});

test('deck content cannot break out of generated markup', () => {
  const deck = loadDeck(JSON.stringify({
    meta: { title: '<script>alert(1)</script>', author: '" onload="bad' },
    slides: [{
      layout: 'image',
      title: '<img src=x onerror=bad>',
      image: { src: 'javascript:alert(1)', alt: '"><script>bad</script>' },
    }],
  }));
  const html = renderDeck(deck);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(html, /src="javascript:/);
  assert.match(html, /&lt;img src=x onerror=bad&gt;/);
});

test('custom HTML is isolated and theme overrides reject CSS injection', () => {
  const deck = loadDeck(JSON.stringify({
    slides: [{ layout: 'blank', html: '<script>window.parent.pwned=true</script><h1>Sandbox</h1>' }],
  }));
  const html = renderDeck(deck);
  assert.match(html, /iframe class="gamma-sandboxed-html" sandbox=""/);
  assert.doesNotMatch(html, /<script>window\.parent\.pwned/);
  assert.throws(
    () => getTheme('boardroom', { primary_color: '</style><script>alert(1)</script>' }),
    /Invalid CSS color/,
  );
  assert.throws(
    () => getTheme('boardroom', { font_heading: "Safe';background:red" }),
    /Invalid font family/,
  );
  assert.equal(getTheme('boardroom', { primary_color: '#abc' }).primary, '#AABBCC');
  assert.throws(() => getTheme('boardroom', { primary_color: 'red' }), /use #RRGGBB/);
  assert.throws(() => getTheme('boardroom', { primary_color: 'rgb(1,2,3)' }), /use #RRGGBB/);
});

test('comparison style values are allowlisted even when rendering an unvalidated object', () => {
  const html = renderDeck({
    theme: 'boardroom', style: {}, meta: {}, branding: {},
    slides: [{
      layout: 'comparison',
      columns: [
        { heading: 'A', items: ['One'], style: 'neutral"><img src=x onerror="window.pwned=1' },
        { heading: 'B', items: ['Two'], style: 'positive' },
      ],
    }],
  });
  assert.doesNotMatch(html, /onerror=/);
  assert.match(html, /comparison-col neutral/);
});

test('layout class values are allowlisted even when rendering an unvalidated object', () => {
  const payload = 'up"><img src=x onerror="window.pwned=1';
  const html = renderDeck({
    theme: 'boardroom', style: {}, meta: {}, branding: {},
    slides: [
      {
        layout: 'timeline',
        orientation: payload,
        items: [{ title: 'Milestone', description: 'Safe copy' }],
      },
      {
        layout: 'metrics',
        metrics: [{ label: 'Revenue', value: '$1M', delta: 'Flat', trend: payload }],
      },
      {
        layout: 'split',
        left: { type: 'metrics', metrics: [{ label: 'Margin', value: '50%', delta: 'Flat', trend: payload }] },
        right: { type: 'bullets', items: ['Safe copy'] },
      },
    ],
  });
  assert.doesNotMatch(html, /onerror=/);
  assert.match(html, /timeline timeline-vertical/);
  assert.match(html, /delta neutral/);
  assert.match(html, /delta up/);
});

test('Reveal theme defaults do not override slide backgrounds', () => {
  const deck = loadDeck(`theme: boardroom
slides:
  - layout: title
    title: Default paper
  - layout: title
    title: Dark section
    background: { type: solid, value: '#0B0F17' }
`);
  const html = renderDeck(deck);
  assert.doesNotMatch(html, /theme\/black\.css/);
  assert.match(html, /data-background-color="#0B0F17"/);
  assert.match(html, /\.slide-background \{ background-color: #F3F0E8; \}/);
});

test('editorial covers keep the KPI strip in its own grid row', () => {
  const deck = loadDeck(`theme: boardroom
slides:
  - layout: title
    variant: editorial
    title: Board review
    metrics: [{ label: Revenue, value: $16.2M }]
`);
  const html = renderDeck(deck);
  const initialThemeCSS = html.match(/<style id="gamma-theme-runtime">([\s\S]*?)<\/style>/)?.[1] || '';
  assert.match(html, /\.cover-index \{ grid-row:1 \/ 3;/);
  assert.match(html, /\.cover-strip \{ grid-column:2; grid-row:2;/);
  assert.doesNotMatch(initialThemeCSS, /\.cover-strip \{ position:absolute/);
});

test('boardroom decks let viewers choose and switch between three native themes', () => {
  const deck = loadDeck(`theme: boardroom
slides:
  - layout: title
    variant: editorial
    title: Three presentation themes
`);
  const html = renderDeck(deck);

  assert.match(html, /data-presentation-theme="analyst-proof"/);
  assert.match(html, /data-presentation-theme="cutting-room"/);
  assert.match(html, /data-presentation-theme="signal-room"/);
  assert.match(html, /Analyst Proof/);
  assert.match(html, /Cutting Room/);
  assert.match(html, /Signal Room/);
  assert.match(html, /const chartConfigSets/);
  assert.match(html, /function setChartTheme/);
  assert.match(html, /document\.startViewTransition/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /data-theme-open/);
});

test('invalid decks report all useful validation errors', () => {
  assert.throws(
    () => loadDeck('{"slides":[]}'),
    /Invalid deck specification:[\s\S]*must NOT have fewer than 1 items/,
  );
});

test('speaker notes use explicit notes or narration as a fallback', () => {
  const deck = loadDeck(`slides:\n  - layout: title\n    title: Demo\n    narration: Presenter context`);
  const html = renderDeck(deck);
  assert.match(html, /<aside class="notes">Presenter context<\/aside>/);
  assert.match(html, /data-gamma-runtime="reveal-notes@5\.1\.0"/);
});

test('language defaults select a matching narration voice', () => {
  const deck = loadDeck(`meta:\n  language: fr\nslides:\n  - layout: title\n    title: Bonjour`);
  assert.equal(deck.narration.voice, 'fr-FR-HenriNeural');
});

test('agenda layout renders numbered or icon-led cards', () => {
  const deck = loadDeck(`slides:\n  - layout: agenda\n    title: Plan\n    items:\n      - title: First\n        description: Context\n      - title: Second\n        icon: rocket`);
  const html = renderDeck(deck);
  assert.match(html, /class="agenda-grid/);
  assert.match(html, />01<\/span>/);
  assert.match(html, /First/);
});

test('chart formatting and stacking options reach the browser config', () => {
  const config = buildEChartsConfig({
    type: 'bar',
    data: { labels: ['Q1'], datasets: [{ label: 'Revenue', values: [2_000_000] }] },
    options: { format_y: 'currency_m', stacked: true },
  }, getTheme('corporate'));
  assert.equal(config.__gammaFormatY, 'currency_m');
  assert.equal(config.series[0].stack, 'total');
  assert.equal(config.series[0].label.show, true);
});

test('finance line and radar scales preserve editorial intent', () => {
  const theme = getTheme('boardroom');
  const line = buildEChartsConfig({
    type: 'line',
    data: {
      labels: ['Q1', 'Q2'],
      datasets: [{ label: 'Plan', values: [120, 128], dashed: true }],
    },
    options: { y_min: 115, y_max: 140 },
  }, theme);
  const radar = buildEChartsConfig({
    type: 'radar',
    data: {
      labels: ['Control', 'Close'],
      datasets: [{ label: 'Score', values: [4.2, 4.6] }],
    },
    options: { max: 5 },
  }, theme);

  assert.equal(line.yAxis.min, 115);
  assert.equal(line.yAxis.max, 140);
  assert.equal(line.series[0].lineStyle.type, 'dashed');
  assert.deepEqual(radar.radar.indicator.map(item => item.max), [5, 5]);
});

test('layout-specific validation rejects incomplete slides', () => {
  assert.throws(
    () => loadDeck('slides:\n  - layout: comparison\n    title: Broken'),
    /layout "comparison" requires columns/,
  );
});

test('finance chart schemas accept OHLC tuples and reject malformed heatmaps', () => {
  const deck = loadDeck(`slides:
  - layout: chart
    chart:
      type: candlestick
      data:
        labels: [D1]
        datasets:
          - values: [[100, 104, 98, 106]]
`);
  assert.equal(deck.slides[0].chart.data.datasets[0].values[0][3], 106);
  assert.throws(
    () => loadDeck(`slides:
  - layout: chart
    chart:
      type: heatmap
      data: { x_labels: [A], y_labels: [B], values: [1] }
`),
    /must be array/,
  );
});

test('the flagship exercises the complete Gamma Finance Catalog v1', () => {
  const deck = loadDeck(readFileSync(new URL('../src/schema/examples/corporate-demo.yaml', import.meta.url), 'utf8'));
  const charts = [];
  for (const slide of deck.slides) {
    if (slide.chart) charts.push(slide.chart);
    for (const panel of slide.panels || []) if (panel.chart) charts.push(panel.chart);
    for (const side of [slide.left, slide.right]) if (side?.chart) charts.push(side.chart);
  }
  assert.equal(deck.slides.length, 38);
  assert.equal(charts.length, 37);
  assert.equal(new Set(charts.map(chart => chart.type)).size, 28);
  assert.equal(deck.slides.filter(slide => slide.source).length, 38);
  assert.equal(deck.slides.filter(slide => slide.narration).length, 38);
});

test('finance-grade chart templates produce native and composed ECharts series', () => {
  const theme = getTheme('boardroom');
  const stock = buildEChartsConfig({
    type: 'stock',
    data: { labels: ['D1', 'D2'], datasets: [{ values: [[10, 11, 9, 12], [11, 10, 9, 12]] }], volume: [100, 120] },
    options: { moving_averages: [2], show_bollinger: true, bollinger_period: 2, show_obv: true, show_macd: true, show_rsi: true, rsi_period: 2 },
  }, theme);
  const depth = buildEChartsConfig({ type: 'market_depth', data: { bids: [[99, 12]], asks: [[101, 10]] } }, theme);
  const box = buildEChartsConfig({ type: 'boxplot', data: { labels: ['Equity'], boxes: [[-2, -1, 0, 1, 2]], outliers: [[0, 3]] } }, theme);
  const calendar = buildEChartsConfig({ type: 'calendar_heatmap', data: { calendar_values: [{ date: '2025-01-02', value: 2 }] }, options: { range: '2025' } }, theme);
  const network = buildEChartsConfig({ type: 'network', data: { categories: ['Bank'], graph_nodes: [{ name: 'A', value: 4, category: 'Bank' }, { name: 'B', value: 2, category: 'Bank' }], graph_links: [{ source: 'A', target: 'B', value: 3 }] } }, theme);
  const river = buildEChartsConfig({ type: 'theme_river', data: { streams: [{ date: '2025-01-01', value: 2, name: 'Rates' }] } }, theme);
  const fan = buildEChartsConfig({ type: 'fan', data: { labels: ['2026'], lower: [1], upper: [3], base: [2] } }, theme);

  assert.equal(stock.series[0].type, 'candlestick');
  assert.equal(stock.series.find(series => series.name === 'MACD histogram')?.type, 'bar');
  assert.equal(stock.series.find(series => series.name === 'RSI 2')?.type, 'line');
  assert.equal(stock.series.find(series => series.name === 'OBV')?.type, 'line');
  assert.equal(stock.series.filter(series => series.name === 'Bollinger').length, 2);
  assert.equal(stock.grid.length, 4);
  assert.equal(stock.dataZoom.length, 2);
  assert.deepEqual(depth.series.map(series => series.step), ['end', 'start']);
  assert.deepEqual(box.series.map(series => series.type), ['boxplot', 'scatter']);
  assert.equal(calendar.series[0].coordinateSystem, 'calendar');
  assert.equal(network.series[0].type, 'graph');
  assert.equal(river.series[0].type, 'themeRiver');
  assert.deepEqual(fan.series.map(series => series.stack || null), ['confidence', 'confidence', null]);
});

test('chart object data is whitelisted before it reaches ECharts', () => {
  const payload = '<img src=x onerror="window.pwned=1">';
  const theme = getTheme('boardroom');
  const sankey = buildEChartsConfig({
    type: 'sankey',
    data: {
      nodes: [{ name: 'Source', tooltip: { formatter: payload } }, { name: 'Use' }],
      links: [{ source: 'Source', target: 'Use', value: 10, tooltip: { formatter: payload } }],
    },
  }, theme);
  const treemap = buildEChartsConfig({
    type: 'treemap',
    data: {
      items: [{
        name: 'Group',
        children: [{ name: 'Leaf', value: 10, tooltip: { formatter: payload } }],
        tooltip: { formatter: payload },
      }],
    },
  }, theme);
  const bar = buildEChartsConfig({
    type: 'bar',
    data: { labels: ['A'], datasets: [{ values: [{ value: 1, tooltip: { formatter: payload } }] }] },
  }, theme);

  assert.deepEqual(sankey.series[0].data.map(node => node.name), ['Source', 'Use']);
  assert.deepEqual(sankey.series[0].links, [{ source: 'Source', target: 'Use', value: 10 }]);
  assert.deepEqual(treemap.series[0].data, [{ name: 'Group', children: [{ name: 'Leaf', value: 10 }] }]);
  assert.deepEqual(bar.series[0].data, [null]);
  assert.doesNotMatch(JSON.stringify({ sankey, treemap, bar }), /window\.pwned|onerror/);
});

test('chart schemas reject arbitrary Sankey and Treemap configuration', () => {
  const tooltip = { formatter: '<img src=x onerror="window.pwned=1">' };
  assert.throws(
    () => loadDeck(JSON.stringify({
      slides: [{
        layout: 'chart',
        chart: {
          type: 'sankey',
          data: {
            nodes: [{ name: 'Source', tooltip }, 'Use'],
            links: [{ source: 'Source', target: 'Use', value: 10 }],
          },
        },
      }],
    })),
    /must NOT have additional properties/,
  );
  assert.throws(
    () => loadDeck(JSON.stringify({
      slides: [{
        layout: 'chart',
        chart: { type: 'treemap', data: { items: [{ name: 'Market', value: 10, tooltip }] } },
      }],
    })),
    /must NOT have additional properties/,
  );
});

test('premium variants enforce content caps and complete dashboard panels', () => {
  assert.throws(
    () => loadDeck(`slides:
  - layout: dashboard
    panels: [{ type: chart, title: Missing }]
`),
    /chart panel requires chart/,
  );
  assert.throws(
    () => loadDeck(`slides:
  - layout: metrics
    variant: hero
    metrics:
      - { label: A, value: '1' }
      - { label: B, value: '2' }
      - { label: C, value: '3' }
      - { label: D, value: '4' }
      - { label: E, value: '5' }
`),
    /hero metrics require between 2 and 4/,
  );
  assert.throws(
    () => loadDeck(`slides:
  - layout: table
    variant: editorial
    table: { headers: [A], rows: [['1']], max_rows: -1 }
`),
    /must be >= 1/,
  );
});

test('unknown themes fail during validation instead of later rendering', () => {
  assert.throws(
    () => loadDeck('theme: imaginary\nslides:\n  - layout: title\n    title: Demo'),
    /must be equal to one of the allowed values/,
  );
});

test('YouTube Publisher renders account, playlists, schedule and disk-safe defaults', () => {
  const html = renderYouTubeStudioHTML({
    deck: {
      meta: { title: 'Q4 2025', tags: ['finance'] },
      video: { youtube: { playlist_id: 'PL1', publish_at: '2030-01-02T12:00:00Z' }, thumbnail: { slide: 2 } },
      slides: [{}, {}, {}],
    },
    channel: { title: 'Boardroom Channel', thumbnail: null },
    playlists: [{ id: 'PL1', title: 'Market Briefings', itemCount: 12 }],
    token: 'csrf-token',
  });
  assert.match(html, /Boardroom Channel/);
  assert.match(html, /Market Briefings · 12 videos/);
  assert.match(html, /name="publishAt"/);
  assert.match(html, /Keep a local MP4/);
  assert.match(html, /Rolling render/);
  assert.doesNotMatch(html, /client_secret|api_key/i);
});

test('YouTube publishing view follows progress without exposing its session token in copy', () => {
  const html = renderPublishingHTML('test-session-token');
  assert.match(html, /Broadcast pipeline/);
  assert.match(html, /EventSource\('\/__gamma\/progress\?token=test-session-token'\)/);
  assert.match(html, /Streaming to YouTube/);
  assert.match(html, /Open on YouTube/);
  assert.doesNotMatch(html, /client_secret|api_key/i);
});

test('YouTube scheduling rejects invalid dates before authentication', async () => {
  await assert.rejects(
    uploadToYouTube({ videoPath: 'package.json', title: 'Demo', publishAt: 'not-a-date' }),
    /Invalid YouTube publication date/,
  );
});

test('YouTube resumable upload follows 308 ranges with aligned streamed chunks', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'gamma-youtube-test-'));
  const videoPath = join(tempDir, 'video.mp4');
  const fileSize = 600 * 1024;
  writeFileSync(videoPath, Buffer.alloc(fileSize, 0x2a));

  try {
    const calls = [];
    const ranges = [];
    const auth = {
      async request(options) {
        calls.push(options);
        if (options.method === 'POST') {
          return {
            status: 200,
            data: {},
            headers: new Headers({ location: 'https://upload.youtube.test/resumable-session' }),
          };
        }
        const chunks = [];
        for await (const chunk of options.data) chunks.push(chunk);
        assert.equal(Buffer.concat(chunks).length, options.headers['Content-Length']);
        ranges.push(options.headers['Content-Range']);
        const end = Number(/bytes \d+-(\d+)\//.exec(options.headers['Content-Range'])[1]);
        return end + 1 < fileSize
          ? { status: 308, data: {}, headers: new Headers({ range: `bytes=0-${end}` }) }
          : { status: 200, data: { id: 'youtube-video-id' }, headers: new Headers() };
      },
    };
    const progress = [];
    const result = await uploadVideoResumable({
      auth,
      videoPath,
      chunkSize: 256 * 1024,
      requestBody: {
        snippet: { title: 'Q4 2025' },
        status: { privacyStatus: 'private', publishAt: '2030-01-02T12:00:00.000Z' },
      },
      onProgress: event => progress.push(event),
    });

    assert.deepEqual(result, { id: 'youtube-video-id' });
    assert.equal(calls[0].url, 'https://www.googleapis.com/upload/youtube/v3/videos');
    assert.equal(calls[0].params.uploadType, 'resumable');
    assert.equal(calls[0].headers['X-Upload-Content-Type'], 'video/mp4');
    assert.match(calls[0].data, /"publishAt":"2030-01-02T12:00:00.000Z"/);
    assert.deepEqual(ranges, [
      `bytes 0-${(256 * 1024) - 1}/${fileSize}`,
      `bytes ${256 * 1024}-${(512 * 1024) - 1}/${fileSize}`,
      `bytes ${512 * 1024}-${fileSize - 1}/${fileSize}`,
    ]);
    assert.deepEqual(progress.map(event => event.bytesRead), [0, 256 * 1024, 512 * 1024, fileSize]);
    assert.equal(progress.at(-1).percent, 100);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('YouTube upload queries session status and resumes after a network error', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'gamma-youtube-retry-test-'));
  const videoPath = join(tempDir, 'video.mp4');
  const fileSize = 600 * 1024;
  writeFileSync(videoPath, Buffer.alloc(fileSize, 0x5a));

  try {
    const uploadedRanges = [];
    let secondChunkFailed = false;
    let statusQueries = 0;
    const auth = {
      async request(options) {
        if (options.method === 'POST') {
          return {
            status: 200,
            data: {},
            headers: new Headers({ location: 'https://upload.youtube.test/private-session' }),
          };
        }
        if (options.headers['Content-Range'].startsWith('bytes */')) {
          statusQueries += 1;
          return { status: 308, data: {}, headers: new Headers({ range: `bytes=0-${(512 * 1024) - 1}` }) };
        }

        const chunks = [];
        for await (const chunk of options.data) chunks.push(chunk);
        assert.equal(Buffer.concat(chunks).length, options.headers['Content-Length']);
        uploadedRanges.push(options.headers['Content-Range']);
        if (uploadedRanges.length === 1) {
          return { status: 308, data: {}, headers: new Headers({ range: `bytes=0-${(256 * 1024) - 1}` }) };
        }
        if (!secondChunkFailed) {
          secondChunkFailed = true;
          throw Object.assign(new Error('simulated socket reset'), { code: 'ECONNRESET' });
        }
        return { status: 200, data: { id: 'resumed-video-id' }, headers: new Headers() };
      },
    };
    const progress = [];
    const result = await uploadVideoResumable({
      auth,
      videoPath,
      requestBody: { snippet: { title: 'Resumable' }, status: { privacyStatus: 'unlisted' } },
      chunkSize: 256 * 1024,
      maxRetries: 2,
      retryBaseDelayMs: 0,
      onProgress: event => progress.push(event),
    });

    assert.deepEqual(result, { id: 'resumed-video-id' });
    assert.equal(statusQueries, 1);
    assert.deepEqual(uploadedRanges, [
      `bytes 0-${(256 * 1024) - 1}/${fileSize}`,
      `bytes ${256 * 1024}-${(512 * 1024) - 1}/${fileSize}`,
      `bytes ${512 * 1024}-${fileSize - 1}/${fileSize}`,
    ]);
    assert.deepEqual(progress.map(event => event.bytesRead), [0, 256 * 1024, 512 * 1024, fileSize]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('YouTube resumable upload bounds retries when the session never advances', async () => {
  let chunkAttempts = 0;
  let statusQueries = 0;
  const auth = {
    async request(options) {
      if (options.method === 'POST') {
        return {
          status: 200,
          data: {},
          headers: new Headers({ location: 'https://upload.youtube.test/retry-session' }),
        };
      }
      if (options.headers['Content-Range'].startsWith('bytes */')) {
        statusQueries += 1;
        return { status: 308, data: {}, headers: new Headers() };
      }
      chunkAttempts += 1;
      throw Object.assign(new Error('simulated network outage'), { code: 'ECONNRESET' });
    },
  };

  await assert.rejects(
    uploadVideoResumable({
      auth,
      videoPath: 'package.json',
      requestBody: { snippet: { title: 'Retry cap' }, status: { privacyStatus: 'private' } },
      chunkSize: 256 * 1024,
      maxRetries: 2,
      retryBaseDelayMs: 0,
    }),
    /failed after 2 retries/,
  );
  assert.equal(chunkAttempts, 3);
  assert.equal(statusQueries, 2);
});

test('YouTube resumable upload refuses to PUT without a session URI', async () => {
  const auth = { request: async () => ({ data: {}, headers: new Headers() }) };
  await assert.rejects(
    uploadVideoResumable({ auth, videoPath: 'package.json', requestBody: {} }),
    /did not return a resumable upload session/,
  );
});
