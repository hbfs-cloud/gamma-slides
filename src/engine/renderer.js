import { getTheme } from '../themes/index.js';
import { baseCSS } from '../themes/base.css.js';
import { animationCSS, autoAnimateJS } from './components/animations.js';
import { renderSlide } from './layouts/index.js';
import { renderFooter, renderWatermark } from './components/branding.js';
import { buildEChartsConfig, resetChartCounter } from './components/chart-builder.js';

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '128, 128, 128';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export function renderDeck(deck) {
  const theme = getTheme(deck.theme, deck.style);
  resetChartCounter();

  const slidesHtml = deck.slides.map(s => renderSlide(s, theme, deck)).join('\n');
  const footer = renderFooter(deck, theme);
  const watermark = renderWatermark(deck);

  // Collect all chart specs for JS initialization
  const charts = [];
  let chartIdx = 0;
  function collectCharts(slides) {
    for (const slide of slides) {
      if (slide.chart) {
        charts.push({ id: `chart_${chartIdx++}`, config: buildEChartsConfig(slide.chart, theme) });
      }
      if (slide.left?.chart) {
        charts.push({ id: `chart_${chartIdx++}`, config: buildEChartsConfig(slide.left.chart, theme) });
      }
      if (slide.right?.chart) {
        charts.push({ id: `chart_${chartIdx++}`, config: buildEChartsConfig(slide.right.chart, theme) });
      }
    }
  }
  collectCharts(deck.slides);

  const title = deck.meta?.title || 'Presentation';

  return `<!DOCTYPE html>
<html lang="${deck.meta?.language || 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — gamma-slides</title>
  ${deck.meta?.author ? `<meta name="author" content="${deck.meta.author}">` : ''}
  ${deck.meta?.description ? `<meta name="description" content="${deck.meta.description}">` : ''}
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    :root {
      --gamma-primary: ${theme.primary};
      --gamma-secondary: ${theme.secondary};
      --gamma-accent: ${theme.accent};
      --gamma-bg: ${theme.background};
      --gamma-text: ${theme.text};
      --gamma-muted: ${theme.textMuted};
    }
    body { margin: 0; background: ${theme.background}; }
    .reveal .slides { text-align: center; }
    .reveal .slides section {
      padding: 28px 40px 24px; height: 100%;
      display: flex !important; flex-direction: column; justify-content: center;
      overflow: hidden; font-size: 18px;
    }
    .reveal .slides section > * { flex-shrink: 1; min-height: 0; }
    .reveal { color: ${theme.text}; }
    .reveal h1, .reveal h2, .reveal h3, .reveal h4 { color: ${theme.text}; text-transform: none; }
    .reveal h2 { margin-bottom: 4px; }
    .reveal p { color: ${theme.textMuted}; margin: 4px 0; }
    /* Nav controls — tucked to sides, not overlapping footer */
    .reveal .controls { color: ${theme.primary}; bottom: 28px; }
    .reveal .controls button { opacity: 0.4; }
    .reveal .controls button:hover { opacity: 1; }
    .reveal .progress { color: ${theme.primary}; height: 2px; }
    /* Slide number — top right, out of the way */
    .reveal .slide-number {
      background: transparent; color: rgba(${hexToRgb(theme.textMuted)}, 0.5);
      font-family: 'General Sans', system-ui, sans-serif;
      font-size: 0.5em; right: 20px; top: 14px; bottom: auto;
      font-weight: 600; letter-spacing: 0.05em;
    }
    ${baseCSS(theme)}
    .reveal .speaker-controls { font-family: '${theme.fontBody || 'Inter'}', system-ui, sans-serif; }
    @media print {
      .reveal .slides section { page-break-after: always; }
      .footer-bar, .watermark { display: none !important; }
    }
    ${animationCSS()}
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
${slidesHtml}
    </div>
    ${footer}
    ${watermark}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"><\/script>
  <script>
    ${autoAnimateJS()}
    Reveal.initialize({
      hash: true, slideNumber: 'c/t', showSlideNumber: 'all',
      transition: 'slide', transitionSpeed: 'fast', backgroundTransition: 'fade',
      center: true, width: 1280, height: 720, margin: 0.02,
      controls: true, controlsTutorial: false, progress: true,
      history: true, keyboard: true, overview: true, touch: true,
      autoAnimateEasing: 'cubic-bezier(0.22, 1, 0.36, 1)', autoAnimateDuration: 0.5,
    });
    Reveal.on('ready', () => { applyAnimations(); initCharts(); });
    Reveal.on('slidechanged', initCharts);
    const chartInstances = {};
    function initCharts() {
      const configs = ${JSON.stringify(charts.map(c => ({ id: c.id, config: c.config })))};
      for (const {id, config} of configs) {
        const el = document.getElementById(id);
        if (!el || chartInstances[id]) continue;
        try {
          const chart = echarts.init(el, null, { renderer: 'canvas' });
          // Restore function-based animationDelay from serialized config
          if (config.series) {
            config.series.forEach(s => {
              if (s.animationDelay) delete s.animationDelay;
            });
          }
          chart.setOption(config);
          chartInstances[id] = chart;
          // Resize on window resize
          window.addEventListener('resize', () => chart.resize());
        } catch(e) { console.warn('Chart init error:', id, e); }
      }
    }
  <\/script>
</body>
</html>`;
}
