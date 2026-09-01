import { editorialCSS } from './editorial.css.js';

export function baseCSS(t) {
  const rgb = hexToRgb;
  const isLight = t.mode === 'light';

  return `
    .reveal { font-family: '${t.fontBody || 'General Sans'}', 'General Sans', 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    .reveal h1, .reveal h2, .reveal h3 {
      font-family: '${t.fontHeading || 'Satoshi'}', 'Satoshi', 'Inter', system-ui, sans-serif;
      font-weight: 900; letter-spacing: -0.035em; line-height: 1.1;
    }
    .reveal h1 { font-size: 3.8em; }
    .reveal h2 { font-size: 2.4em; margin-bottom: 6px; }
    .reveal h3 { font-size: 1.5em; font-weight: 500; }

    .slide-background { background-color: ${t.background}; }

    /* ── Slide composition ── */
    .reveal .slides section::before {
      content: ''; position: absolute; width: 520px; height: 520px;
      top: -310px; right: -250px; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(${rgb(t.primary)}, 0.12), transparent 68%);
      filter: blur(4px);
    }
    .reveal .slides section > :not(.theme-stage) { position: relative; z-index: 1; }
    .reveal .slides section > h2 {
      position: relative; display: inline-block; width: fit-content;
      margin-left: auto; margin-right: auto;
    }
    .reveal .slides section > h2::after {
      content: ''; display: block; width: 42px; height: 3px; margin: 12px auto 0;
      border-radius: 99px; background: ${t.gradient};
    }
    .reveal .slides section.layout-title::before,
    .reveal .slides section.layout-closing::before {
      width: 760px; height: 760px; top: -350px; right: -260px;
      background: radial-gradient(circle, rgba(${rgb(t.primary)}, 0.18), transparent 65%);
    }
    .reveal .slides section.layout-title::after,
    .reveal .slides section.layout-closing::after {
      content: ''; position: absolute; inset: 0; pointer-events: none; opacity: ${isLight ? '0.14' : '0.22'};
      background-image: radial-gradient(rgba(${rgb(t.textMuted)}, 0.6) 0.7px, transparent 0.7px);
      background-size: 22px 22px;
      mask-image: linear-gradient(115deg, transparent 10%, black 55%, transparent 90%);
    }
    .title-meta {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      margin-top: 20px; color: ${t.textMuted}; font-size: 0.7em;
      font-weight: 600; letter-spacing: 0.03em;
    }
    .title-meta i { width: 4px; height: 4px; border-radius: 50%; background: ${t.primary}; opacity: 0.8; }
    .empty-state {
      display: grid; place-items: center; min-height: 220px; width: 100%;
      border: 1px dashed rgba(${rgb(t.textMuted)}, 0.3); border-radius: 16px;
      color: ${t.textMuted}; font-size: 0.9em;
    }

    /* ── Badge ── */
    .gamma-badge {
      display: inline-flex; align-items: center; gap: 6px;
      align-self: center; width: max-content;
      padding: 5px 14px; border-radius: 100px;
      background: ${t.badgeBg || `rgba(${rgb(t.primary)}, 0.12)`};
      border: 1px solid ${t.badgeBorder || `rgba(${rgb(t.primary)}, 0.25)`};
      color: ${isLight ? t.primary : t.textMuted}; font-size: 0.85em; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.1em;
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif;
    }

    /* ── Metric Cards ── */
    .metric-card {
      background: ${t.cardBg || t.surface};
      border: 1px solid ${t.cardBorder || `rgba(${rgb(t.primary)}, 0.15)`};
      border-radius: 16px; padding: 24px 28px 26px;
      text-align: left; position: relative; overflow: hidden;
      backdrop-filter: blur(8px);
    }
    .metric-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0;
      height: 2px; background: ${t.gradient};
      opacity: 0.8;
    }
    .metric-card::after {
      content: ''; position: absolute; width: 120px; height: 120px; right: -60px; bottom: -70px;
      border-radius: 50%; background: rgba(${rgb(t.primary)}, 0.10); filter: blur(4px);
    }
    .metric-card.metric-featured {
      border-color: rgba(${rgb(t.primary)}, 0.55);
      box-shadow: 0 14px 42px rgba(${rgb(t.primary)}, 0.13);
    }
    .metric-card.metric-featured .value { color:${t.primary}; }
    .metric-card .metric-icon {
      width: 34px; height: 34px; display: grid; place-items: center;
      margin-bottom: 14px; border-radius: 9px; opacity: 1;
      background: rgba(${rgb(t.primary)}, 0.12); border: 1px solid rgba(${rgb(t.primary)}, 0.18);
    }
    .metric-card .label {
      color: ${t.textMuted}; font-size: 0.82em; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif;
    }
    .metric-card .value {
      color: ${t.text}; font-size: 2.5em; font-weight: 900; line-height: 1;
      font-family: '${t.fontHeading || 'Satoshi'}', system-ui, sans-serif; letter-spacing: -0.03em;
    }
    .metric-card .delta {
      font-size: 0.85em; font-weight: 600; margin-top: 6px;
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif;
    }
    .metric-card .delta.positive, .metric-card .delta.up { color: ${t.positive || t.secondary}; }
    .metric-card .delta.negative, .metric-card .delta.down { color: ${t.negative || t.accent}; }

    /* ── Data Tables ── */
    .data-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      font-size: 1.0em; border-radius: 9px; overflow: hidden;
      border: 1px solid ${t.tableBorder || `rgba(${rgb(t.primary)}, 0.15)`};
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif;
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
    .data-table tbody tr:nth-child(even) td { background: rgba(${rgb(t.textMuted)}, 0.025); }
    .data-table tbody tr:hover td { background: ${t.tableHover || `rgba(${rgb(t.primary)}, 0.05)`}; }
    .data-table .col-highlight { background: rgba(${rgb(t.primary)}, 0.07) !important; }
    .data-table .amount {
      font-family: '${t.fontMono || 'JetBrains Mono'}', monospace; font-weight: 600;
      text-align: right; font-size: 0.95em; letter-spacing: -0.02em;
    }
    .data-table .positive { color: ${t.positive || t.secondary}; }
    .data-table .negative { color: ${t.negative || t.accent}; }

    /* ── Grids ── */
    .grid-1 { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: stretch; width: 100%; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: stretch; width: 100%; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: stretch; width: 100%; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; align-items: stretch; width: 100%; }

    /* ── Tags ── */
    .tag {
      display: inline-block; padding: 3px 10px; border-radius: 4px;
      font-size: 0.78em; font-weight: 600; letter-spacing: 0.02em;
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif;
    }
    .tag-primary { background: rgba(${rgb(t.primary)}, 0.15); color: ${isLight ? t.primary : `rgba(${rgb(t.primary)}, 1)`}; }
    .tag-secondary { background: rgba(${rgb(t.secondary)}, 0.15); color: ${t.secondary}; }
    .tag-accent { background: rgba(${rgb(t.accent)}, 0.15); color: ${t.accent}; }
    .tag-positive { background: rgba(${rgb(t.positive || t.secondary)}, 0.13); color: ${t.positive || t.secondary}; }
    .tag-negative { background: rgba(${rgb(t.negative || t.accent)}, 0.13); color: ${t.negative || t.accent}; }

    /* ── Timeline ── */
    .timeline { position: relative; padding-left: 28px; text-align: left; margin: 22px auto 0; max-width: 760px; width: 100%; }
    .timeline-vertical::before {
      content: ''; position: absolute; left: 7px; top: 4px; bottom: 4px; width: 2px;
      background: ${t.gradient}; border-radius: 4px;
    }
    .timeline-item { position: relative; margin-bottom: 18px; }
    .timeline-vertical .timeline-item::before {
      content: ''; position: absolute; left: -25px; top: 5px;
      width: 10px; height: 10px; border-radius: 50%;
      background: ${t.primary}; border: 2px solid ${t.background};
      box-shadow: 0 0 0 3px rgba(${rgb(t.primary)}, 0.2);
    }
    .timeline-item h4 {
      color: ${t.text}; margin: 0 0 3px; font-weight: 700; font-size: 1.15em;
      font-family: '${t.fontHeading || 'Satoshi'}', system-ui, sans-serif; letter-spacing: -0.01em;
    }
    .timeline-item p { color: ${t.textMuted}; margin: 0; font-size: 1.0em; line-height: 1.4; }
    .timeline-horizontal {
      max-width: none; padding: 34px 0 0; display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px;
    }
    .timeline-horizontal::before {
      content: ''; position: absolute; top: 7px; left: 9%; right: 9%; height: 2px;
      background: ${t.gradient}; opacity: 0.75;
    }
    .timeline-horizontal .timeline-item {
      margin: 0; padding: 20px 18px; min-height: 150px; border-radius: 16px;
      background: ${t.cardBg || t.surface}; border: 1px solid ${t.cardBorder || `rgba(${rgb(t.primary)}, 0.15)`};
    }
    .timeline-horizontal .timeline-item::before {
      content: ''; position: absolute; top: -33px; left: 50%; transform: translateX(-50%);
      width: 12px; height: 12px; border-radius: 50%; background: ${t.primary};
      border: 3px solid ${t.background}; box-shadow: 0 0 0 3px rgba(${rgb(t.primary)}, 0.2);
    }
    .timeline-horizontal .timeline-item h4 { font-size: 1em; line-height: 1.25; }
    .timeline-horizontal .timeline-item p { font-size: 0.82em; margin-top: 10px; }

    /* ── Highlight / Callout ── */
    .highlight-box {
      background: ${t.highlightBg || `linear-gradient(135deg, rgba(${rgb(t.primary)}, 0.1), rgba(${rgb(t.secondary)}, 0.06))`};
      border-top: 1px solid ${t.primary}; border-radius: 0;
      padding: 16px 22px; text-align: left; margin: 10px 0;
      font-size: 1.05em; line-height: 1.5; color: ${t.textMuted};
    }
    .highlight-box strong { color: ${t.text}; }

    /* ── Chart Container ── */
    .chart-container {
      background: ${isLight ? 'transparent' : `rgba(${rgb(t.surface || t.background)}, 0.5)`};
      border-radius: 13px; padding: 4px;
      border: 1px solid ${isLight ? 'transparent' : `rgba(${rgb(t.primary)}, 0.08)`};
      width: 100%; height: 100%; min-height: 200px;
    }

    /* ── Footer ── */
    .footer-bar {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      min-height: 34px; padding: 0 32px; display: grid;
      grid-template-columns: minmax(180px, 1fr) minmax(0, 1.75fr) minmax(180px, 1fr);
      gap: 24px; align-items: center;
      background: ${t.footerBg || t.background}; backdrop-filter: blur(14px);
      border-top: 1px solid rgba(${rgb(t.primary)}, 0.08);
      font-size: 0.5em; color: ${t.textMuted};
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif;
      pointer-events: none;
    }
    .brand-lockup, .brand-publication { display:flex; align-items:center; min-width:0; }
    .brand-lockup { gap:8px; color:${t.text}; }
    .brand-logo-image { display:block; width:auto; max-width:132px; height:20px; object-fit:contain; }
    .brand-monogram {
      display:inline-grid; place-items:center; width:18px; height:18px; flex:0 0 18px;
      border:1px solid ${t.primary}; color:${t.primary};
      font-family:'${t.fontMono || t.fontBody}',monospace; font-size:1em; font-weight:750; line-height:1;
    }
    .footer-wordmark {
      overflow:hidden; color:${t.text}; font-weight:700; letter-spacing:-.01em;
      text-overflow:ellipsis; white-space:nowrap;
    }
    .brand-deck-title {
      overflow:hidden; color:${t.textMuted}; font-weight:520; letter-spacing:.01em;
      text-align:center; text-overflow:ellipsis; white-space:nowrap;
    }
    .brand-publication { justify-content:flex-end; gap:10px; overflow:hidden; text-align:right; }
    .brand-classification {
      color:${t.primary}; font-family:'${t.fontMono || t.fontBody}',monospace; font-weight:650;
      letter-spacing:.08em; text-transform:uppercase; white-space:nowrap;
    }
    .brand-url { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    /* ── Watermark ── */
    .watermark {
      position:fixed; top:16px; left:50%; right:auto; z-index:50; transform:translateX(-50%);
      display:flex; align-items:center; gap:8px;
      color:${t.textMuted}; opacity:.34;
      font-family:'${t.fontMono || t.fontBody}',monospace; font-size:.44em; font-weight:650;
      letter-spacing:.16em; line-height:1; text-transform:uppercase;
      pointer-events: none;
    }
    .watermark::before { content:''; width:18px; height:1px; background:${t.primary}; }

    /* ── Comparison ── */
    .comparison-col {
      flex: 1; padding: 24px; border-radius: 16px; text-align: left;
    }
    .comparison-col.positive {
      background: rgba(${rgb(t.positive || t.secondary)}, 0.06);
      border: 1px solid rgba(${rgb(t.positive || t.secondary)}, 0.15);
    }
    .comparison-col.negative {
      background: rgba(${rgb(t.negative || t.accent)}, 0.06);
      border: 1px solid rgba(${rgb(t.negative || t.accent)}, 0.15);
    }
    .comparison-col.neutral {
      background: ${t.cardBg || t.surface};
      border: 1px solid ${t.cardBorder || `rgba(${rgb(t.primary)}, 0.15)`};
    }
    .comparison-col h3 {
      font-family: '${t.fontHeading || 'Satoshi'}', system-ui, sans-serif !important;
      font-weight: 700 !important; font-size: 1.35em !important;
      margin-bottom: 14px !important;
    }
    .comparison-col span { font-size: 1.08em; }

    /* ── Quote ── */
    .quote-block {
      font-size: 1.6em; font-style: italic; line-height: 1.6;
      color: ${t.text}; max-width: 780px; margin: 0 auto;
      font-family: '${t.fontDisplay || t.fontHeading || 'Satoshi'}', Georgia, serif;
    }
    .quote-block::before {
      content: '\\201C'; font-size: 3.5em; color: ${t.primary}; opacity: 0.4;
      line-height: 0; vertical-align: -0.55em; margin-right: 2px;
      font-family: Georgia, serif;
    }
    .quote-author {
      color: ${t.textMuted}; font-size: 0.78em; margin-top: 18px;
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif;
    }

    /* ── Bullets ── */
    .bullet-item {
      display: flex; align-items: flex-start; gap: 12px;
      margin-bottom: 0; padding: 14px 16px;
      background: ${t.cardBg || t.surface}; border-radius: 9px;
      text-align: left;
      border: 1px solid ${isLight ? t.cardBorder || `rgba(${rgb(t.textMuted)}, 0.22)` : 'rgba(255,255,255,0.04)'};
    }
    .bullet-item .bullet-text { color: ${t.text}; font-size: 1.1em; line-height: 1.4; }
    .bullet-icon {
      width: 30px; height: 30px; border-radius: 9px;
      background: rgba(${rgb(t.primary)}, 0.12);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .bullet-list {
      display: grid; gap: 12px; width: 100%; max-width: 900px;
      margin: 22px auto 0;
    }
    .bullet-list-1 { grid-template-columns: minmax(0, 1fr); max-width: 720px; }
    .bullet-list-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    /* ── Agenda ── */
    .agenda-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px; width: 100%; max-width: 940px; margin: 24px auto 0;
    }
    .agenda-item {
      display: grid; grid-template-columns: 52px 1fr; gap: 14px; align-items: start;
      padding: 18px; text-align: left; border-radius: 16px;
      background: ${t.cardBg || t.surface};
      border: 1px solid ${t.cardBorder || `rgba(${rgb(t.primary)}, 0.15)`};
    }
    .agenda-marker {
      width: 48px; height: 48px; border-radius: 13px; display: grid; place-items: center;
      background: rgba(${rgb(t.primary)}, 0.12); border: 1px solid rgba(${rgb(t.primary)}, 0.2);
    }
    .agenda-number {
      color: ${t.primary}; font-family: '${t.fontMono || 'JetBrains Mono'}', monospace;
      font-size: 0.78em; font-weight: 700; letter-spacing: 0.04em;
    }
    .agenda-item h3 {
      font-size: 1.05em; font-weight: 700; margin: 2px 0 5px; letter-spacing: -0.015em;
    }
    .agenda-item p { font-size: 0.78em; line-height: 1.4; margin: 0; }

    /* ── Slide-level subtitle ── */
    .slide-subtitle {
      color: ${t.textMuted}; font-size: 0.95em; margin: 2px 0 0;
      font-family: '${t.fontBody || 'General Sans'}', system-ui, sans-serif; font-weight: 500;
    }

    @media (max-width: 800px) {
      .agenda-grid, .bullet-list-2 { grid-template-columns: 1fr; }
      .timeline-horizontal { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    ${t.aesthetic === 'editorial' ? editorialCSS(t) : ''}
  `;
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '128, 128, 128';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
