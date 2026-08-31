import { getTheme } from '../themes/index.js';
import { baseCSS } from '../themes/base.css.js';
import { animationCSS, autoAnimateJS } from './components/animations.js';
import { renderSlide } from './layouts/index.js';
import { renderFooter, renderWatermark } from './components/branding.js';
import { getRegisteredCharts, resetChartCounter } from './components/chart-builder.js';
import { escapeHtml, safeUrl } from './html.js';
import { presenterStudioCSS, presenterStudioJS } from './components/presenter-studio.js';
import { deckRuntimeAssets, embeddedFontCSS } from './runtime-assets.js';

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '128, 128, 128';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function serializeForScript(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

export function renderDeck(deck) {
  const theme = getTheme(deck.theme, deck.style);
  resetChartCounter();

  const slidesHtml = deck.slides.map(s => renderSlide(s, theme, deck)).join('\n');
  const footer = renderFooter(deck, theme);
  const watermark = renderWatermark(deck);

  const charts = getRegisteredCharts(theme);

  const title = escapeHtml(deck.meta?.title || 'Presentation');
  const language = escapeHtml(deck.meta?.language || 'en');
  const fontCSS = embeddedFontCSS(theme);

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — gamma-slides</title>
  ${deck.meta?.author ? `<meta name="author" content="${escapeHtml(deck.meta.author)}">` : ''}
  ${deck.meta?.description ? `<meta name="description" content="${escapeHtml(deck.meta.description)}">` : ''}
  ${deck.branding?.favicon ? `<link rel="icon" href="${safeUrl(deck.branding.favicon)}">` : ''}
  <style data-gamma-runtime="reveal.js@5.1.0">${deckRuntimeAssets.revealCss}</style>
  <style data-gamma-fonts="embedded">${fontCSS}</style>
  <script data-gamma-runtime="echarts@6.1.0">${deckRuntimeAssets.echartsJs}<\/script>
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
    body.reveal-viewport { background-color: ${theme.background}; }
    body::before {
      content: ''; position: fixed; inset: 0; pointer-events: none;
      background: radial-gradient(circle at 12% 8%, rgba(${hexToRgb(theme.primary)}, 0.10), transparent 32%);
    }
    .reveal .slides { text-align: center; }
    .reveal .slides section {
      padding: 28px 40px 24px; height: 100%;
      display: flex !important; flex-direction: column; justify-content: center;
      overflow: hidden; font-size: 18px;
    }
    .reveal .slides section > * { flex-shrink: 1; min-height: 0; }
    .reveal .slides section.layout-chart,
    .reveal .slides section.layout-split,
    .reveal .slides section.layout-table { justify-content: flex-start; padding-top: 42px; }
    .reveal { color: ${theme.text}; }
    .reveal h1, .reveal h2, .reveal h3, .reveal h4 { color: ${theme.text}; text-transform: none; }
    .reveal h2 { margin-bottom: 4px; }
    .reveal p { color: ${theme.textMuted}; margin: 4px 0; }
    /* Nav controls — tucked to sides, not overlapping footer */
    .reveal .controls { color: ${theme.primary}; bottom: 46px; right: 12px; transform: scale(0.78); transform-origin: bottom right; }
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
      .footer-bar, .watermark { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
    html.reveal-print body.aesthetic-editorial .reveal .slides .pdf-page > section {
      top: 0 !important; left: 0 !important; width: 1280px !important; height: 720px !important;
      padding: 44px 72px 72px !important;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }
    ${animationCSS()}
    ${presenterStudioCSS(theme)}
  </style>
</head>
<body class="theme-${escapeHtml(deck.theme)} aesthetic-${escapeHtml(theme.aesthetic || 'standard')}">
  <div class="reveal">
    <div class="slides">
${slidesHtml}
    </div>
    ${footer}
    ${watermark}
  </div>
  <script data-gamma-runtime="reveal.js@5.1.0">${deckRuntimeAssets.revealJs}<\/script>
  <script data-gamma-runtime="reveal-notes@5.1.0">${deckRuntimeAssets.revealNotesJs}<\/script>
  <script>
    window.__GAMMA_READY__ = false;
    const gammaExportMode = new URLSearchParams(window.location.search).has('gamma-export');
    if (gammaExportMode) document.documentElement.classList.add('gamma-export');
    ${autoAnimateJS()}
    Reveal.initialize({
      hash: true, slideNumber: false,
      transition: gammaExportMode ? 'none' : 'slide', transitionSpeed: 'fast', backgroundTransition: gammaExportMode ? 'none' : 'fade',
      center: !gammaExportMode, width: 1280, height: 720, margin: gammaExportMode ? 0 : 0.02,
      controls: false, controlsTutorial: false, progress: false,
      history: true, keyboard: true, overview: true, touch: true,
      autoAnimateEasing: 'cubic-bezier(0.22, 1, 0.36, 1)', autoAnimateDuration: 0.5,
      autoAnimate: !gammaExportMode,
      pdfPageHeightOffset: gammaExportMode ? 0 : -1,
      plugins: typeof RevealNotes === 'undefined' ? [] : [RevealNotes],
    });
    ${presenterStudioJS()}
    Reveal.on('ready', async () => {
      applyAnimations();
      initCharts(gammaExportMode ? document : Reveal.getCurrentSlide());
      if (!gammaExportMode) initPresenterStudio();
      await waitForGammaAssets();
      window.__GAMMA_READY__ = true;
    });
    Reveal.on('slidechanged', event => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        initCharts(event.currentSlide);
        resizeChartsWithin(event.currentSlide);
      }));
      setTimeout(() => resizeChartsWithin(event.currentSlide), 420);
    });
    const chartInstances = {};
    const chartConfigs = ${serializeForScript(charts.map(c => ({ id: c.id, config: c.config })))};
    const chartResizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
      entries.forEach(entry => {
        const chart = chartInstances[entry.target.id];
        if (chart && entry.contentRect.width > 8 && entry.contentRect.height > 8) chart.resize();
      });
    });
    async function waitForGammaAssets() {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.complete
        ? Promise.resolve()
        : new Promise(resolveImage => {
            img.addEventListener('load', resolveImage, { once: true });
            img.addEventListener('error', resolveImage, { once: true });
          })));
      if (gammaExportMode) {
        document.querySelectorAll('.fragment').forEach(fragment => fragment.classList.add('visible'));
        document.getAnimations().forEach(animation => {
          try { animation.finish(); } catch (_) {}
        });
      }
      await new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
    }
    function resizeChartsWithin(scope = document) {
      Object.entries(chartInstances).forEach(([id, chart]) => {
        const element = document.getElementById(id);
        if (element && (scope === document || scope?.contains(element))) chart.resize();
      });
    }
    function initCharts(scope = document) {
      for (const {id, config} of chartConfigs) {
        const el = document.getElementById(id);
        if (!el || chartInstances[id] || (scope !== document && !scope?.contains(el))) continue;
        if (el.clientWidth < 8 || el.clientHeight < 8) {
          requestAnimationFrame(() => initCharts(scope));
          continue;
        }
        try {
          const formatValue = (value, format = 'compact') => {
            const number = Number(value);
            if (format === 'currency_m') {
              const amount = '$' + (Math.abs(number) / 1000000).toFixed(number % 1000000 === 0 ? 0 : 1) + 'M';
              return number < 0 ? '-' + amount : amount;
            }
            if (format === 'currency_k') {
              const amount = '$' + (Math.abs(number) / 1000).toFixed(number % 1000 === 0 ? 0 : 1) + 'K';
              return number < 0 ? '-' + amount : amount;
            }
            if (format === 'percent') return number + '%';
            return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(number);
          };
          const formatLeft = config.__gammaFormatY;
          const formatRight = config.__gammaFormatYRight;
          const formatX = config.__gammaFormatX;
          const isWaterfall = config.__gammaWaterfall;
          delete config.__gammaFormatY;
          delete config.__gammaFormatYRight;
          delete config.__gammaFormatX;
          delete config.__gammaWaterfall;
          if (gammaExportMode) config.animation = false;
          if (!config.aria) config.aria = { enabled: true, decal: { show: false } };
          const axes = Array.isArray(config.yAxis) ? config.yAxis : config.yAxis ? [config.yAxis] : [];
          axes.forEach((axis, index) => {
            if (axis.axisLabel && (formatLeft || formatRight)) {
              axis.axisLabel.formatter = value => formatValue(value, index === 1 ? formatRight : formatLeft);
            }
          });
          const xAxes = Array.isArray(config.xAxis) ? config.xAxis : config.xAxis ? [config.xAxis] : [];
          xAxes.forEach(axis => {
            if (axis.type === 'value' && axis.axisLabel && formatX) axis.axisLabel.formatter = value => formatValue(value, formatX);
          });
          const chart = echarts.init(el, null, { renderer: 'svg' });
          // Restore function-based animationDelay from serialized config
          if (config.series) {
            config.series.forEach(s => {
              if (s.animationDelay) delete s.animationDelay;
              if (gammaExportMode) s.animation = false;
              const hasScalarLabels = !['scatter', 'heatmap', 'candlestick'].includes(s.type);
              const scalarFormat = formatLeft || formatX;
              if (s.label?.show && scalarFormat && hasScalarLabels) {
                s.label.formatter = params => formatValue(params.value, scalarFormat);
              }
              if (s.symbolSize === '__gammaBubbleSize') s.symbolSize = value => Math.max(10, Math.min(48, Math.sqrt(Number(value?.[2] || 1)) * 5));
              if (isWaterfall && s.label?.show) s.label.formatter = params => formatValue(params.data?.raw ?? params.value, formatLeft);
            });
          }
          chart.setOption(config);
          chartInstances[id] = chart;
          chartResizeObserver?.observe(el);
        } catch(e) { console.warn('Chart init error:', id, e); }
      }
    }
    window.addEventListener('resize', () => resizeChartsWithin(Reveal.getCurrentSlide()));
  <\/script>
</body>
</html>`;
}
