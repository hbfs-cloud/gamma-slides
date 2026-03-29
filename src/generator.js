import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { themes } from './themes/fipto.js';
import { getTemplate } from './templates/index.js';
import { buildFecSlides } from './templates/fec.js';
import { buildConsolidationSlides } from './templates/consolidation.js';
import { buildRevenueModelSlides } from './templates/revenue-model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const templateBuilders = {
  fec: buildFecSlides,
  consolidation: buildConsolidationSlides,
  'revenue-model': buildRevenueModelSlides
};

export async function generatePresentation(opts) {
  const tplInfo = getTemplate(opts.template);
  const theme = themes[opts.theme] || themes.fipto;

  // Load data
  let data;
  if (opts.data) {
    const raw = await readFile(resolve(opts.data), 'utf-8');
    data = JSON.parse(raw);
  } else {
    const dataPath = resolve(__dirname, 'data', tplInfo.dataFile);
    const raw = await readFile(dataPath, 'utf-8');
    data = JSON.parse(raw);
  }

  // Build slides
  const builder = templateBuilders[opts.template];
  const slides = builder(data, theme);

  // Build title
  const title = opts.title || tplInfo.name;

  // Generate HTML
  const html = buildHTML(title, slides, theme, data);

  // Write output
  const outputPath = resolve(opts.output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf-8');

  return { outputPath, slideCount: slides.length };
}

function buildHTML(title, slides, theme, data) {
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30" width="80"><defs><linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:${theme.primary}"/><stop offset="100%" style="stop-color:${theme.secondary}"/></linearGradient></defs><text x="2" y="22" font-family="system-ui" font-size="22" font-weight="800" fill="url(#fg)">fipto</text></svg>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Fipto Slides</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    :root {
      --fipto-primary: ${theme.primary};
      --fipto-secondary: ${theme.secondary};
      --fipto-accent: ${theme.accent || '#FD79A8'};
      --fipto-bg: ${theme.background};
      --fipto-surface: ${theme.surface};
      --fipto-text: ${theme.text};
      --fipto-muted: ${theme.textMuted};
    }

    body { margin: 0; background: ${theme.background}; }

    .reveal .slides { text-align: center; }
    .reveal .slides section {
      padding: 30px 50px;
      height: 100%;
      display: flex !important;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      font-size: 16px;
    }
    .reveal .slides section > * { flex-shrink: 0; }
    .reveal { color: ${theme.text}; }
    .reveal h1, .reveal h2, .reveal h3, .reveal h4 { color: ${theme.text}; text-transform: none; }
    .reveal h2 { margin-bottom: 12px; }
    .reveal p { color: ${theme.textMuted}; margin: 6px 0; }

    .reveal .controls { color: ${theme.primary}; }
    .reveal .progress { color: ${theme.primary}; height: 3px; }
    .reveal .slide-number {
      background: transparent;
      color: ${theme.textMuted};
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.6em;
      right: 16px;
      bottom: 16px;
    }

    ${theme.css}

    /* Presenter mode overrides */
    .reveal .speaker-controls { font-family: 'Inter', system-ui, sans-serif; }

    /* Print/PDF styles */
    @media print {
      .reveal .slides section { page-break-after: always; }
      .footer-bar { display: none !important; }
    }

    /* Animations */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideInNumber {
      from { opacity: 0; transform: translateY(20px) scale(0.8); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes drawLine {
      from { width: 0; }
      to { width: 100%; }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(108, 92, 231, 0); }
      50% { box-shadow: 0 0 20px 4px rgba(108, 92, 231, 0.15); }
    }

    .reveal .slides section.present .anim-up { animation: fadeInUp 0.6s ease both; }
    .reveal .slides section.present .anim-left { animation: fadeInLeft 0.6s ease both; }
    .reveal .slides section.present .anim-right { animation: fadeInRight 0.6s ease both; }
    .reveal .slides section.present .anim-scale { animation: fadeInScale 0.5s ease both; }
    .reveal .slides section.present .anim-number { animation: slideInNumber 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

    .reveal .slides section.present .d1 { animation-delay: 0.1s; }
    .reveal .slides section.present .d2 { animation-delay: 0.2s; }
    .reveal .slides section.present .d3 { animation-delay: 0.3s; }
    .reveal .slides section.present .d4 { animation-delay: 0.4s; }
    .reveal .slides section.present .d5 { animation-delay: 0.5s; }
    .reveal .slides section.present .d6 { animation-delay: 0.6s; }
    .reveal .slides section.present .d7 { animation-delay: 0.7s; }
    .reveal .slides section.present .d8 { animation-delay: 0.8s; }

    /* Reset animation when not visible */
    .reveal .slides section:not(.present) .anim-up,
    .reveal .slides section:not(.present) .anim-left,
    .reveal .slides section:not(.present) .anim-right,
    .reveal .slides section:not(.present) .anim-scale,
    .reveal .slides section:not(.present) .anim-number { opacity: 0; }

    .metric-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(108, 92, 231, 0.2); }

    .reveal .slides section.present .metric-card { animation: pulseGlow 3s ease infinite; animation-delay: 1.5s; }

    /* Timeline animation */
    .reveal .slides section.present .timeline-item { animation: fadeInLeft 0.5s ease both; }
    .reveal .slides section.present .timeline-item:nth-child(1) { animation-delay: 0.15s; }
    .reveal .slides section.present .timeline-item:nth-child(2) { animation-delay: 0.3s; }
    .reveal .slides section.present .timeline-item:nth-child(3) { animation-delay: 0.45s; }
    .reveal .slides section.present .timeline-item:nth-child(4) { animation-delay: 0.6s; }
    .reveal .slides section.present .timeline-item:nth-child(5) { animation-delay: 0.75s; }
    .reveal .slides section:not(.present) .timeline-item { opacity: 0; }

    /* Table row animation */
    .reveal .slides section.present .data-table tbody tr { animation: fadeInUp 0.3s ease both; }
    .reveal .slides section.present .data-table tbody tr:nth-child(1) { animation-delay: 0.1s; }
    .reveal .slides section.present .data-table tbody tr:nth-child(2) { animation-delay: 0.15s; }
    .reveal .slides section.present .data-table tbody tr:nth-child(3) { animation-delay: 0.2s; }
    .reveal .slides section.present .data-table tbody tr:nth-child(4) { animation-delay: 0.25s; }
    .reveal .slides section.present .data-table tbody tr:nth-child(5) { animation-delay: 0.3s; }
    .reveal .slides section.present .data-table tbody tr:nth-child(6) { animation-delay: 0.35s; }
    .reveal .slides section.present .data-table tbody tr:nth-child(7) { animation-delay: 0.4s; }
    .reveal .slides section.present .data-table tbody tr:nth-child(8) { animation-delay: 0.45s; }
    .reveal .slides section:not(.present) .data-table tbody tr { opacity: 0; }

    /* Highlight box animation */
    .reveal .slides section.present .highlight-box { animation: fadeInUp 0.6s ease 0.5s both; }
    .reveal .slides section:not(.present) .highlight-box { opacity: 0; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slides.join('\n')}
    </div>
    <div class="footer-bar">
      <div>${logoSvg}</div>
      <div>${title}</div>
      <div>fipto.com</div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      slideNumber: 'c/t',
      showSlideNumber: 'all',
      transition: 'convex',
      transitionSpeed: 'slow',
      backgroundTransition: 'zoom',
      center: true,
      width: 1280,
      height: 720,
      margin: 0.06,
      controls: true,
      controlsTutorial: true,
      progress: true,
      history: true,
      keyboard: true,
      overview: true,
      touch: true,
      autoAnimateEasing: 'ease-out',
      autoAnimateDuration: 0.8,
    });

    // Auto-apply animations to elements
    function applyAnimations() {
      document.querySelectorAll('.reveal .slides section').forEach(section => {
        // Animate headings
        section.querySelectorAll('h1, h2, h3').forEach((el, i) => {
          el.classList.add('anim-up', 'd' + Math.min(i + 1, 8));
        });
        // Animate metric cards with staggered scale
        section.querySelectorAll('.metric-card').forEach((el, i) => {
          if (!el.classList.contains('anim-scale')) {
            el.classList.add('anim-scale', 'd' + Math.min(i + 2, 8));
          }
        });
        // Animate grids
        section.querySelectorAll('.grid-2, .grid-3, .grid-4').forEach((el, i) => {
          if (!el.classList.contains('anim-up')) {
            el.classList.add('anim-up', 'd' + Math.min(i + 2, 8));
          }
        });
        // Animate charts
        section.querySelectorAll('.chart-container').forEach((el, i) => {
          el.classList.add('anim-scale', 'd' + Math.min(i + 3, 8));
        });
        // Animate badges
        section.querySelectorAll('.fipto-badge').forEach(el => {
          if (!el.classList.contains('anim-scale')) {
            el.classList.add('anim-scale', 'd1');
          }
        });
        // Animate tags containers
        section.querySelectorAll('.highlight-box').forEach((el, i) => {
          // already handled in CSS
        });
      });
    }

    // Initialize charts after Reveal is ready
    Reveal.on('ready', () => { applyAnimations(); initCharts(); });
    Reveal.on('slidechanged', initCharts);

    const chartInstances = {};

    function initCharts() {
      const chartConfigs = {
        tresoChart: {
          type: 'doughnut',
          data: {
            labels: ['Banque EUR', 'Wallet USDC', 'Wallet EURC'],
            datasets: [{
              data: [3300000, 1400000, 600000],
              backgroundColor: ['${theme.primary}', '${theme.secondary}', '${theme.accent || '#FD79A8'}'],
              borderWidth: 0,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom', labels: { color: '${theme.textMuted}', font: { family: 'Inter', size: 11 }, padding: 16 } }
            },
            cutout: '65%',
          }
        },
        journalChart: {
          type: 'bar',
          data: {
            labels: ['ACH', 'VTE', 'BQ', 'OD', 'AN'],
            datasets: [{
              label: 'Écritures',
              data: [2800, 4200, 5100, 1932, 800],
              backgroundColor: ['${theme.primary}', '${theme.secondary}', '${theme.accent || '#FD79A8'}', '#74B9FF', '#FFEAA7'],
              borderRadius: 6,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '${theme.textMuted}' }, grid: { display: false } },
              y: { ticks: { color: '${theme.textMuted}' }, grid: { color: 'rgba(108,92,231,0.1)' } }
            }
          }
        },
        revenueByEntityChart: {
          type: 'doughnut',
          data: {
            labels: ${JSON.stringify((data.entities || []).map(e => e.name))},
            datasets: [{
              data: ${JSON.stringify((data.entities || []).map(e => e.revenue))},
              backgroundColor: ['#6C5CE7', '#00B894', '#FD79A8', '#74B9FF', '#FFEAA7'],
              borderWidth: 0,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '${theme.textMuted}', font: { family: 'Inter', size: 11 }, padding: 12 } } },
            cutout: '60%',
          }
        },
        revenueStreamsChart: {
          type: 'doughnut',
          data: {
            labels: ${JSON.stringify((data.revenue_streams || []).map(s => s.name))},
            datasets: [{
              data: ${JSON.stringify((data.revenue_streams || []).map(s => s.revenue_2025))},
              backgroundColor: ['#6C5CE7', '#00B894', '#FD79A8', '#74B9FF', '#FFEAA7'],
              borderWidth: 0,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '${theme.textMuted}', font: { family: 'Inter', size: 10 }, padding: 10 } } },
            cutout: '60%',
          }
        },
        quarterlyChart: {
          type: 'bar',
          data: {
            labels: ${JSON.stringify((data.quarterly_breakdown || []).map(q => q.quarter))},
            datasets: [{
              label: 'Revenue',
              data: ${JSON.stringify((data.quarterly_breakdown || []).map(q => q.revenue))},
              backgroundColor: '${theme.primary}',
              borderRadius: 8,
              borderSkipped: false,
            }, {
              label: 'Transactions',
              data: ${JSON.stringify((data.quarterly_breakdown || []).map(q => q.transactions))},
              backgroundColor: '${theme.secondary}',
              borderRadius: 8,
              borderSkipped: false,
              yAxisID: 'y1',
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '${theme.textMuted}', font: { family: 'Inter' } } } },
            scales: {
              x: { ticks: { color: '${theme.textMuted}' }, grid: { display: false } },
              y: { position: 'left', ticks: { color: '${theme.textMuted}', callback: v => (v/1e6).toFixed(1) + 'M' }, grid: { color: 'rgba(108,92,231,0.1)' } },
              y1: { position: 'right', ticks: { color: '${theme.textMuted}' }, grid: { display: false } }
            }
          }
        },
        retentionChart: {
          type: 'line',
          data: {
            labels: ${JSON.stringify((data.cohort_analysis || { months: [] }).months.map(m => 'M' + m))},
            datasets: [{
              label: 'Rétention %',
              data: ${JSON.stringify((data.cohort_analysis || { retention: [] }).retention)},
              borderColor: '${theme.secondary}',
              backgroundColor: 'rgba(0,184,148,0.1)',
              fill: true, tension: 0.3, pointRadius: 5, pointBackgroundColor: '${theme.secondary}',
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '${theme.textMuted}' }, grid: { display: false } },
              y: { min: 0, max: 100, ticks: { color: '${theme.textMuted}', callback: v => v + '%' }, grid: { color: 'rgba(108,92,231,0.1)' } }
            }
          }
        },
        expansionChart: {
          type: 'line',
          data: {
            labels: ${JSON.stringify((data.cohort_analysis || { months: [] }).months.map(m => 'M' + m))},
            datasets: [{
              label: 'Revenue Expansion %',
              data: ${JSON.stringify((data.cohort_analysis || { revenue_expansion: [] }).revenue_expansion)},
              borderColor: '${theme.primary}',
              backgroundColor: 'rgba(108,92,231,0.1)',
              fill: true, tension: 0.3, pointRadius: 5, pointBackgroundColor: '${theme.primary}',
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '${theme.textMuted}' }, grid: { display: false } },
              y: { min: 80, ticks: { color: '${theme.textMuted}', callback: v => v + '%' }, grid: { color: 'rgba(108,92,231,0.1)' } }
            }
          }
        }
      };

      for (const [id, config] of Object.entries(chartConfigs)) {
        const canvas = document.getElementById(id);
        if (!canvas) continue;
        if (chartInstances[id]) continue; // already initialized
        try {
          chartInstances[id] = new Chart(canvas.getContext('2d'), config);
        } catch(e) { /* chart not on current slide */ }
      }
    }
  </script>
</body>
</html>`;
}
