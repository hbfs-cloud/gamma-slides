export function baseCSS(t) {
  const rgb = hexToRgb;
  const isLight = t.mode === 'light';

  return `
    @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&f[]=general-sans@400,500,600&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

    .reveal { font-family: 'General Sans', 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    .reveal h1, .reveal h2, .reveal h3 {
      font-family: 'Satoshi', 'Inter', system-ui, sans-serif;
      font-weight: 900; letter-spacing: -0.035em; line-height: 1.1;
    }
    .reveal h1 { font-size: 2.8em; }
    .reveal h2 { font-size: 1.65em; margin-bottom: 4px; }
    .reveal h3 { font-size: 1.1em; font-weight: 500; }

    .slide-background { background: ${t.background} !important; }

    /* ── Badge ── */
    .gamma-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: 100px;
      background: ${t.badgeBg || `rgba(${rgb(t.primary)}, 0.12)`};
      border: 1px solid ${t.badgeBorder || `rgba(${rgb(t.primary)}, 0.25)`};
      color: ${isLight ? t.primary : t.textMuted}; font-size: 0.65em; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.1em;
      font-family: 'General Sans', system-ui, sans-serif;
    }

    /* ── Metric Cards ── */
    .metric-card {
      background: ${t.cardBg || t.surface};
      border: 1px solid ${t.cardBorder || `rgba(${rgb(t.primary)}, 0.15)`};
      border-radius: 12px; padding: 16px 20px;
      text-align: left; position: relative; overflow: hidden;
      backdrop-filter: blur(8px);
    }
    .metric-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0;
      height: 2px; background: ${t.gradient};
      opacity: 0.8;
    }
    .metric-card .metric-icon { margin-bottom: 8px; opacity: 0.7; }
    .metric-card .label {
      color: ${t.textMuted}; font-size: 0.6em; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
      font-family: 'General Sans', system-ui, sans-serif;
    }
    .metric-card .value {
      color: ${t.text}; font-size: 1.85em; font-weight: 900; line-height: 1;
      font-family: 'Satoshi', system-ui, sans-serif; letter-spacing: -0.03em;
    }
    .metric-card .delta {
      font-size: 0.65em; font-weight: 600; margin-top: 6px;
      font-family: 'General Sans', system-ui, sans-serif;
    }
    .metric-card .delta.positive, .metric-card .delta.up { color: ${t.positive || t.secondary}; }
    .metric-card .delta.negative, .metric-card .delta.down { color: ${t.negative || t.accent}; }

    /* ── Data Tables ── */
    .data-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      font-size: 0.72em; border-radius: 10px; overflow: hidden;
      border: 1px solid ${t.tableBorder || `rgba(${rgb(t.primary)}, 0.15)`};
      font-family: 'General Sans', system-ui, sans-serif;
    }
    .data-table thead th {
      background: ${t.tableHeaderBg || `rgba(${rgb(t.primary)}, 0.12)`}; color: ${t.textMuted};
      padding: 10px 14px; text-align: left; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.8em;
      border-bottom: 2px solid ${t.tableBorder || `rgba(${rgb(t.primary)}, 0.15)`};
    }
    .data-table tbody td {
      padding: 9px 14px;
      border-bottom: 1px solid ${t.tableBorder || `rgba(${rgb(t.primary)}, 0.07)`};
      color: ${t.tableText || t.text};
      line-height: 1.4;
    }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover td { background: ${t.tableHover || `rgba(${rgb(t.primary)}, 0.05)`}; }
    .data-table .amount {
      font-family: 'JetBrains Mono', monospace; font-weight: 600;
      text-align: right; font-size: 0.95em; letter-spacing: -0.02em;
    }
    .data-table .positive { color: ${t.positive || t.secondary}; }
    .data-table .negative { color: ${t.negative || t.accent}; }

    /* ── Grids ── */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: stretch; width: 100%; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: stretch; width: 100%; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; align-items: stretch; width: 100%; }

    /* ── Tags ── */
    .tag {
      display: inline-block; padding: 3px 10px; border-radius: 5px;
      font-size: 0.78em; font-weight: 600; letter-spacing: 0.02em;
      font-family: 'General Sans', system-ui, sans-serif;
    }
    .tag-primary { background: rgba(${rgb(t.primary)}, 0.15); color: ${isLight ? t.primary : `rgba(${rgb(t.primary)}, 1)`}; }
    .tag-secondary { background: rgba(${rgb(t.secondary)}, 0.15); color: ${t.secondary}; }
    .tag-accent { background: rgba(${rgb(t.accent)}, 0.15); color: ${t.accent}; }

    /* ── Timeline ── */
    .timeline { position: relative; padding-left: 28px; text-align: left; }
    .timeline::before {
      content: ''; position: absolute; left: 7px; top: 4px; bottom: 4px; width: 2px;
      background: ${t.gradient}; border-radius: 2px;
    }
    .timeline-item { position: relative; margin-bottom: 18px; }
    .timeline-item::before {
      content: ''; position: absolute; left: -25px; top: 5px;
      width: 10px; height: 10px; border-radius: 50%;
      background: ${t.primary}; border: 2px solid ${t.background};
      box-shadow: 0 0 0 3px rgba(${rgb(t.primary)}, 0.2);
    }
    .timeline-item h4 {
      color: ${t.text}; margin: 0 0 3px; font-weight: 700; font-size: 0.88em;
      font-family: 'Satoshi', system-ui, sans-serif; letter-spacing: -0.01em;
    }
    .timeline-item p { color: ${t.textMuted}; margin: 0; font-size: 0.75em; line-height: 1.4; }

    /* ── Highlight / Callout ── */
    .highlight-box {
      background: ${t.highlightBg || `linear-gradient(135deg, rgba(${rgb(t.primary)}, 0.1), rgba(${rgb(t.secondary)}, 0.06))`};
      border-left: 3px solid ${t.primary}; border-radius: 0 10px 10px 0;
      padding: 12px 16px; text-align: left; margin: 10px 0;
      font-size: 0.78em; line-height: 1.5; color: ${t.textMuted};
    }
    .highlight-box strong { color: ${t.text}; }

    /* ── Chart Container ── */
    .chart-container {
      background: ${isLight ? 'transparent' : `rgba(${rgb(t.surface || t.background)}, 0.5)`};
      border-radius: 12px; padding: 4px;
      border: 1px solid ${isLight ? 'transparent' : `rgba(${rgb(t.primary)}, 0.08)`};
      width: 100%; height: 100%; min-height: 200px;
    }

    /* ── Footer ── */
    .footer-bar {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      padding: 6px 32px; display: flex; justify-content: space-between; align-items: center;
      background: ${t.footerBg || t.background};
      border-top: 1px solid rgba(${rgb(t.primary)}, 0.08);
      font-size: 0.5em; color: ${t.textMuted};
      font-family: 'General Sans', system-ui, sans-serif;
      pointer-events: none;
    }

    /* ── Watermark ── */
    .watermark {
      position: fixed; top: 14px; right: 24px;
      font-size: 0.5em; font-weight: 700;
      color: rgba(${rgb(t.textMuted)}, 0.18);
      text-transform: uppercase; letter-spacing: 0.2em; z-index: 50;
      font-family: 'General Sans', system-ui, sans-serif;
      pointer-events: none;
    }

    /* ── Comparison ── */
    .comparison-col {
      flex: 1; padding: 18px; border-radius: 12px; text-align: left;
    }
    .comparison-col.positive {
      background: rgba(${rgb(t.positive || t.secondary)}, 0.06);
      border: 1px solid rgba(${rgb(t.positive || t.secondary)}, 0.15);
    }
    .comparison-col.negative {
      background: rgba(${rgb(t.negative || t.accent)}, 0.06);
      border: 1px solid rgba(${rgb(t.negative || t.accent)}, 0.15);
    }
    .comparison-col h3 {
      font-family: 'Satoshi', system-ui, sans-serif !important;
      font-weight: 700 !important; font-size: 1em !important;
      margin-bottom: 14px !important;
    }

    /* ── Quote ── */
    .quote-block {
      font-size: 1.2em; font-style: italic; line-height: 1.6;
      color: ${t.text}; max-width: 780px; margin: 0 auto;
      font-family: 'Satoshi', Georgia, serif;
    }
    .quote-block::before {
      content: '\\201C'; font-size: 3.5em; color: ${t.primary}; opacity: 0.4;
      line-height: 0; vertical-align: -0.55em; margin-right: 2px;
      font-family: Georgia, serif;
    }
    .quote-author {
      color: ${t.textMuted}; font-size: 0.78em; margin-top: 18px;
      font-family: 'General Sans', system-ui, sans-serif;
    }

    /* ── Bullets ── */
    .bullet-item {
      display: flex; align-items: flex-start; gap: 12px;
      margin-bottom: 10px; padding: 10px 14px;
      background: ${t.cardBg || t.surface}; border-radius: 10px;
      text-align: left;
      border: 1px solid ${isLight ? t.cardBorder || '#E5E7EB' : 'rgba(255,255,255,0.04)'};
    }
    .bullet-item .bullet-text { color: ${t.text}; font-size: 0.82em; line-height: 1.4; }
    .bullet-icon {
      width: 30px; height: 30px; border-radius: 8px;
      background: rgba(${rgb(t.primary)}, 0.12);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    /* ── Slide-level subtitle ── */
    .slide-subtitle {
      color: ${t.textMuted}; font-size: 0.72em; margin: 2px 0 0;
      font-family: 'General Sans', system-ui, sans-serif; font-weight: 500;
    }
  `;
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '128, 128, 128';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
