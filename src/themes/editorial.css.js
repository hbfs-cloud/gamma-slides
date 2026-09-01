import { presentationThemeCSS } from './presentation-theme.css.js';

export function editorialCSS(t) {
  const rgb = hexToRgb;
  const hairline = t.hairline || '#CFC9BD';
  const ink = t.ink || '#111318';
  const paper = t.paper || '#F3F0E8';
  const darkPaper = t.paper || t.text;
  const darkPaperRgb = rgb(darkPaper);

  return `
    .aesthetic-editorial::before { display:none; }
    .aesthetic-editorial .reveal { font-variant-numeric: tabular-nums lining-nums; }
    .aesthetic-editorial ::selection { color:${darkPaper}; background:${t.primary}; }
    .aesthetic-editorial * { scrollbar-color:${t.primary} ${paper}; scrollbar-width:thin; }
    .aesthetic-editorial .reveal .slides section {
      padding: 44px 72px 72px; text-align: left; align-items: stretch;
      justify-content:center;
    }
    .aesthetic-editorial .reveal .slides section > :not(.theme-stage):not(.slide-source):not(.notes) { position:relative; z-index:1; }
    .aesthetic-editorial .theme-stage { position:absolute; z-index:0; pointer-events:none; }
    .aesthetic-editorial .theme-stage span { font-family:'${t.fontMono}',monospace; font-variant-numeric:tabular-nums; }
    .aesthetic-editorial .theme-stage i, .aesthetic-editorial .theme-stage b { position:absolute; display:block; }
    .aesthetic-editorial .reveal .slides section::before,
    .aesthetic-editorial .reveal .slides section::after { display: none; }
    .aesthetic-editorial .reveal .slides section > h2,
    .aesthetic-editorial .reveal .slides section > .slide-header h2 {
      width: auto; max-width: 930px; margin: 0; text-align: left;
      font-size: 2.15em; line-height: 1.08; letter-spacing: -.045em; font-weight: 650;
    }
    .aesthetic-editorial .reveal .slides section > h2::after { display: none; }
    .aesthetic-editorial .slide-header { display:block; width:100%; margin:0 0 20px; text-align:left; flex-shrink:0; }
    .aesthetic-editorial .slide-kicker {
      margin-bottom: 11px; color: ${t.primary};
      font: 600 .66em/1 '${t.fontMono}', monospace; letter-spacing: .13em; text-transform: uppercase;
    }
    .aesthetic-editorial .slide-subtitle {
      max-width: 800px; margin: 9px 0 0; color: ${t.textMuted};
      font: 450 .92em/1.45 '${t.fontBody}', sans-serif;
    }
    .aesthetic-editorial .reveal .slides section > .slide-source {
      position:absolute; left:72px; right:72px; bottom:42px; display:flex; justify-content:space-between; gap:24px;
      color:${t.textMuted}; font:500 .54em/1.3 '${t.fontMono}',monospace; letter-spacing:.015em;
    }
    .aesthetic-editorial .slide-source .slide-context { color:${t.primary};font-weight:700;letter-spacing:.08em;text-transform:uppercase; }
    .aesthetic-editorial .slide-source i { margin:0 7px;color:${hairline};font-style:normal; }
    .aesthetic-editorial .slide-insight {
      border-top:1px solid ${hairline}; padding-top:14px; text-align:left;
    }
    .aesthetic-editorial .slide-insight > span {
      display:block; margin-bottom:7px; color:${t.primary}; font:600 .57em/1 '${t.fontMono}',monospace;
      text-transform:uppercase; letter-spacing:.12em;
    }
    .aesthetic-editorial .slide-insight p { margin:0; color:${t.text}; font:550 .94em/1.45 '${t.fontBody}',sans-serif; }

    .aesthetic-editorial .gamma-badge {
      align-self:flex-start; padding:0; border:0; border-radius:0; background:none;
      color:${t.primary}; font:600 .66em/1 '${t.fontMono}',monospace; letter-spacing:.13em;
    }
    .aesthetic-editorial .metric-card, .aesthetic-editorial .agenda-item,
    .aesthetic-editorial .bullet-item, .aesthetic-editorial .comparison-col,
    .aesthetic-editorial .timeline-horizontal .timeline-item {
      border-radius:4px; box-shadow:none; backdrop-filter:none;
    }
    .aesthetic-editorial .metric-card::before, .aesthetic-editorial .metric-card::after { display:none; }
    .aesthetic-editorial .metric-card:hover { transform:none; box-shadow:none; }
    .aesthetic-editorial .metric-card .metric-icon {
      width:28px; height:28px; margin-bottom:12px; border:0; border-radius:0; background:none; justify-content:flex-start;
    }
    .aesthetic-editorial .metric-card .label { font-family:'${t.fontMono}',monospace; font-size:.68em; letter-spacing:.09em; }
    .aesthetic-editorial .metric-card .value { font-family:'${t.fontHeading}',sans-serif; font-weight:650; letter-spacing:-.04em; }
    .aesthetic-editorial .metric-card.metric-featured { box-shadow:none; }
    .aesthetic-editorial .metric-card.metric-featured .value { background:none; color:${t.text}; -webkit-text-fill-color:currentColor; }

    .aesthetic-editorial .chart-container { padding:0; border:0; border-radius:0; background:transparent; }
    .aesthetic-editorial .highlight-box { border:0; border-top:1px solid ${hairline}; border-radius:0; background:transparent; padding:13px 0 0; }
    .aesthetic-editorial .data-table { border:0; border-radius:0; font-family:'${t.fontBody}',sans-serif; font-variant-numeric:tabular-nums lining-nums; }
    .aesthetic-editorial .data-table thead th { padding:9px 12px; border-top:1px solid ${ink}; border-bottom:1px solid ${ink}; background:transparent; font-family:'${t.fontMono}',monospace; font-size:.65em; text-transform:uppercase; letter-spacing:.06em; }
    .aesthetic-editorial .data-table tbody td { padding:11px 12px; border-bottom:1px solid ${hairline}; background:transparent !important; transition:color 150ms ease,background-color 150ms ease; }
    .aesthetic-editorial .data-table tbody tr { transition:opacity 150ms ease; }
    .aesthetic-editorial .data-table tbody:hover tr:not(:hover) { opacity:.54; }
    .aesthetic-editorial .data-table th:first-child,
    .aesthetic-editorial .data-table td:first-child { padding-left:0; font-weight:620; }
    .aesthetic-editorial .data-table th:last-child,
    .aesthetic-editorial .data-table td:last-child { padding-right:0; }
    .aesthetic-editorial .data-table .cell-amount,
    .aesthetic-editorial .data-table .cell-mono { text-align:right; font-family:'${t.fontMono}',monospace; }
    .aesthetic-editorial .data-table .table-overflow td { color:${t.textMuted}; text-align:center; font-size:.78em; font-style:italic; }
    .aesthetic-editorial .data-table .col-highlight { background:rgba(${rgb(t.primary)},.05) !important; }
    .aesthetic-editorial .tag { padding:0; border-radius:0; background:none; font-family:'${t.fontMono}',monospace; }
    .aesthetic-editorial .tag-positive::before, .aesthetic-editorial .tag-negative::before, .aesthetic-editorial .tag-accent::before, .aesthetic-editorial .tag-primary::before { content:''; display:inline-block; width:5px; height:5px; margin-right:6px; border-radius:50%; background:currentColor; vertical-align:1px; }

    .aesthetic-editorial .footer-bar {
      min-height:34px; padding:0 72px; border-top:1px solid rgba(${rgb(t.textMuted)},.16); background:${t.footerBg}; backdrop-filter:blur(12px);
      font-family:'${t.fontMono}',monospace; font-size:.5em;
    }
    .aesthetic-editorial .brand-deck-title { color:${t.textMuted}; }
    .aesthetic-editorial .watermark { top:19px; left:50%; right:auto; color:${t.textMuted}; opacity:.42; font-family:'${t.fontMono}',monospace; font-size:.46em; transform:translateX(-50%); }

    .aesthetic-editorial .tone-dark { color:#F7F4EC; background:${ink} !important; }
    .aesthetic-editorial .tone-dark h1, .aesthetic-editorial .tone-dark h2, .aesthetic-editorial .tone-dark h3,
    .aesthetic-editorial .tone-dark p { color:#F7F4EC; }
    .aesthetic-editorial .tone-dark .slide-subtitle { color:#A8AFBD; }

    /* Editorial cover — the cobalt ledger tab is the deck's opening signal. */
    .aesthetic-editorial .editorial-cover { display:grid; grid-template-columns:3.5fr 7.5fr; grid-template-rows:minmax(0,1fr) auto; column-gap:54px; align-items:stretch; min-height:500px; isolation:isolate; }
    .aesthetic-editorial .cover-index { grid-row:1 / 3;
      align-self:stretch; display:flex; flex-direction:column; justify-content:space-between;
      position:relative; overflow:hidden; padding:28px 30px 30px; border:0; background:${t.primary};
    }
    .aesthetic-editorial .cover-index::after {
      content:''; position:absolute; left:30px; right:30px; top:50%; height:1px;
      background:rgba(${darkPaperRgb},.32); transform-origin:left center;
    }
    .aesthetic-editorial .cover-index span { max-width:190px; color:${darkPaper}; font:650 .66em/1.45 '${t.fontMono}',monospace; letter-spacing:.14em; text-transform:uppercase; }
    .aesthetic-editorial .cover-index strong { position:relative; z-index:1; color:${darkPaper}; font:570 7.3em/.76 '${t.fontHeading}',sans-serif; letter-spacing:-.04em; }
    .aesthetic-editorial .cover-content { grid-column:2; grid-row:1; align-self:center; padding:12px 0 30px; }
    .aesthetic-editorial .cover-content .gamma-badge { color:${t.secondary}; margin-bottom:22px; }
    .aesthetic-editorial .cover-content h1 { max-width:790px; margin:0; color:${darkPaper}; background:none !important; -webkit-text-fill-color:currentColor !important; font:650 4.2em/.96 '${t.fontHeading}',sans-serif; letter-spacing:-.04em; }
    .aesthetic-editorial .cover-content h3 { max-width:720px; margin:22px 0 0 !important; color:rgba(${darkPaperRgb},.68) !important; font:450 1.08em/1.45 '${t.fontBody}',sans-serif !important; }
    .aesthetic-editorial .cover-content .title-meta { justify-content:flex-start; margin-top:34px; color:rgba(${darkPaperRgb},.58); font-family:'${t.fontMono}',monospace; font-size:.58em; }
    .aesthetic-editorial .cover-strip { grid-column:2; grid-row:2; display:flex; gap:34px; padding-top:16px; border-top:1px solid rgba(${darkPaperRgb},.24); color:rgba(${darkPaperRgb},.72); font:500 .66em/1 '${t.fontMono}',monospace; }
    .aesthetic-editorial .cover-strip span { display:flex; align-items:baseline; gap:7px; }
    .aesthetic-editorial .cover-strip strong { color:${darkPaper}; font-weight:650; }

    /* Executive agenda */
    .aesthetic-editorial .editorial-agenda { display:grid; grid-template-columns:4fr 7fr; gap:80px; align-items:start; }
    .aesthetic-editorial .editorial-agenda .slide-header { position:sticky; top:0; }
    .aesthetic-editorial .agenda-editorial-list { border-top:1px solid ${ink}; }
    .aesthetic-editorial .agenda-editorial-row { display:grid; grid-template-columns:48px 170px 1fr; gap:20px; align-items:start; padding:18px 0; border-bottom:1px solid ${hairline}; }
    .aesthetic-editorial .agenda-editorial-row > span { color:${t.primary}; font:600 .68em/1.5 '${t.fontMono}',monospace; }
    .aesthetic-editorial .agenda-editorial-row h3 { margin:0; font:620 1.05em/1.2 '${t.fontHeading}',sans-serif; letter-spacing:-.025em; }
    .aesthetic-editorial .agenda-editorial-row p { margin:0; color:${t.textMuted}; font:.82em/1.5 '${t.fontBody}',sans-serif; }

    /* Hero scorecard */
    .aesthetic-editorial .metrics-hero { display:grid; grid-template-columns:5fr 7fr; gap:0; align-items:stretch; margin-top:18px; }
    .aesthetic-editorial .metric-hero-primary {
      position:relative; overflow:hidden; min-height:270px; display:flex; flex-direction:column; justify-content:space-between;
      border:0; padding:27px 30px 28px; color:${darkPaper}; background:${t.primary};
    }
    .aesthetic-editorial .metric-hero-primary::after {
      content:''; position:absolute; top:30px; right:30px; width:42px; height:5px; background:${darkPaper}; opacity:.9;
    }
    .aesthetic-editorial .metric-hero-primary .label { color:${darkPaper}; font:650 .68em/1 '${t.fontMono}',monospace; letter-spacing:.1em; text-transform:uppercase; }
    .aesthetic-editorial .metric-hero-primary .value { margin:auto 0 12px; color:${darkPaper}; font:650 6.4em/.82 '${t.fontHeading}',sans-serif; letter-spacing:-.04em; }
    .aesthetic-editorial .metric-hero-primary .delta { color:${darkPaper}; font:650 .85em/1 '${t.fontMono}',monospace; }
    .aesthetic-editorial .metrics-support { display:grid; grid-template-rows:repeat(3,1fr); border-top:1px solid ${ink}; }
    .aesthetic-editorial .metric-support-row { display:grid; grid-template-columns:1fr auto; align-items:center; gap:20px; border-bottom:1px solid ${hairline}; padding:13px 0 13px 42px; }
    .aesthetic-editorial .metric-support-row .label { color:${t.textMuted}; font:600 .68em/1.3 '${t.fontMono}',monospace; text-transform:uppercase; letter-spacing:.08em; }
    .aesthetic-editorial .metric-support-row .value { font:620 2.45em/1 '${t.fontHeading}',sans-serif; letter-spacing:-.04em; text-align:right; }
    .aesthetic-editorial .metric-support-row .delta { grid-column:1; color:${t.positive}; font:600 .66em/1 '${t.fontMono}',monospace; }

    /* Story chart */
    .aesthetic-editorial .story-chart { display:grid; grid-template-columns:3.4fr 8.6fr; gap:42px; height:100%; min-height:0; align-items:stretch; }
    .aesthetic-editorial .story-chart-copy { display:flex; flex-direction:column; min-height:0; }
    .aesthetic-editorial .story-chart-copy .slide-insight { margin-top:auto; }
    .aesthetic-editorial .story-chart-visual { min-height:0; height:100%; padding-left:12px; border-left:1px solid ${hairline}; }

    /* Editorial comparison */
    .aesthetic-editorial .comparison-editorial { margin-top:10px; border-top:1px solid ${ink}; }
    .aesthetic-editorial .comparison-editorial-head, .aesthetic-editorial .comparison-editorial-row { display:grid; grid-template-columns:1fr 58px 1fr; gap:20px; align-items:center; }
    .aesthetic-editorial .comparison-editorial-head { padding:12px 0; color:${t.textMuted}; font:600 .68em/1 '${t.fontMono}',monospace; text-transform:uppercase; letter-spacing:.1em; }
    .aesthetic-editorial .comparison-editorial-row { min-height:55px; border-top:1px solid ${hairline}; font:560 1em/1.25 '${t.fontBody}',sans-serif; }
    .aesthetic-editorial .comparison-editorial-row .before { color:${t.negative}; }
    .aesthetic-editorial .comparison-editorial-row .after { color:${t.positive}; }
    .aesthetic-editorial .comparison-arrow { color:${t.primary}; text-align:center; font-family:'${t.fontMono}',monospace; }

    /* Strategy grid */
    .aesthetic-editorial .strategy-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-top:1px solid ${ink}; margin-top:12px; }
    .aesthetic-editorial .strategy-item { min-height:180px; padding:20px 24px 20px 0; border-bottom:1px solid ${hairline}; }
    .aesthetic-editorial .strategy-item:not(:nth-child(3n+1)) { padding-left:24px; border-left:1px solid ${hairline}; }
    .aesthetic-editorial .strategy-number { color:${t.primary}; font:600 .65em/1 '${t.fontMono}',monospace; }
    .aesthetic-editorial .strategy-item h3 { margin:28px 0 10px; font:620 1.08em/1.2 '${t.fontHeading}',sans-serif; letter-spacing:-.03em; }
    .aesthetic-editorial .strategy-item p { margin:0; color:${t.textMuted}; font:.82em/1.45 '${t.fontBody}',sans-serif; }

    /* Dashboard */
    .aesthetic-editorial .dashboard-grid { display:grid; gap:12px; min-height:0; flex:1; }
    .aesthetic-editorial .dashboard-grid-2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .aesthetic-editorial .dashboard-grid-3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .aesthetic-editorial .dashboard-grid-4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
    .aesthetic-editorial .dashboard-panel { min-width:0; min-height:0; display:flex; flex-direction:column; padding:14px 16px; border:1px solid ${hairline}; background:rgba(${rgb(t.surface)},.46); }
    .aesthetic-editorial .dashboard-panel.type-metric { position:relative; overflow:hidden; border-top:2px solid ${t.primary}; background:rgba(${rgb(t.surface)},.72); }
    .aesthetic-editorial .dashboard-panel.type-metric::after { display:none; }
    .aesthetic-editorial .dashboard-panel.span-2 { grid-column:span 2; }.aesthetic-editorial .dashboard-panel.span-3 { grid-column:span 3; }
    .aesthetic-editorial .dashboard-panel-title { display:flex; align-items:center; gap:8px; min-height:20px; color:${t.textMuted}; font:600 .61em/1 '${t.fontMono}',monospace; letter-spacing:.08em; text-transform:uppercase; }
    .aesthetic-editorial .dashboard-chart { min-height:0; flex:1; margin-top:5px; }
    .aesthetic-editorial .dashboard-metric { position:relative; z-index:1; display:grid; grid-template-columns:auto 1fr; grid-template-rows:1fr auto; align-items:center; align-content:stretch; column-gap:10px; flex:1; min-height:0; margin-top:0; }
    .aesthetic-editorial .dashboard-metric strong { font:640 2.7em/.9 '${t.fontHeading}',sans-serif; letter-spacing:-.04em; }
    .aesthetic-editorial .dashboard-metric > span { font:600 .68em/1 '${t.fontMono}',monospace; }.aesthetic-editorial .dashboard-metric .positive{color:${t.positive}}.aesthetic-editorial .dashboard-metric .negative{color:${t.negative}}
    .aesthetic-editorial .dashboard-metric p { grid-column:1 / -1; margin:0; padding-top:12px; border-top:1px solid ${hairline}; color:${t.textMuted}; font:.72em/1.4 '${t.fontBody}',sans-serif; }
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child {
      border-color:${t.primary}; color:${darkPaper}; background:${t.primary};
    }
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child::after { border-color:rgba(${darkPaperRgb},.18); box-shadow:0 0 0 20px rgba(${darkPaperRgb},.06),0 0 0 40px rgba(${darkPaperRgb},.035); }
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child .dashboard-panel-title,
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child .dashboard-metric p { color:${darkPaper}; }
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child .dashboard-metric p { border-color:rgba(${darkPaperRgb},.34); }
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child .dashboard-metric > span { color:${darkPaper}; }
    .aesthetic-editorial .dashboard-grid-3 .dashboard-panel.type-metric { padding:10px 12px; }
    .aesthetic-editorial .dashboard-grid-3 .dashboard-panel.type-metric::after { top:32px; width:62px; height:62px; }
    .aesthetic-editorial .dashboard-grid-3 .dashboard-panel.type-metric .dashboard-panel-title { min-height:16px; }
    .aesthetic-editorial .dashboard-grid-3 .dashboard-metric strong { font-size:2em; }
    .aesthetic-editorial .dashboard-grid-3 .dashboard-metric > span { font-size:.58em; }
    .aesthetic-editorial .dashboard-grid-3 .dashboard-metric p { padding-top:5px; font-size:.6em; line-height:1.2; }
    .aesthetic-editorial .dashboard-table { margin-top:10px; font-size:.72em; }
    .aesthetic-editorial .dashboard-list { margin:14px 0 0; padding:0; list-style:none; }
    .aesthetic-editorial .dashboard-list li { padding:9px 0; border-bottom:1px solid ${hairline}; color:${t.text}; font:.74em/1.35 '${t.fontBody}',sans-serif; }
    .aesthetic-editorial .dashboard-image { width:100%; min-height:0; flex:1; margin-top:10px; }
    .aesthetic-editorial .dashboard-mini-metrics { display:grid; gap:0; margin-top:10px; }
    .aesthetic-editorial .dashboard-mini-metric { display:grid; grid-template-columns:1fr auto; align-items:baseline; gap:8px; padding:8px 0; border-bottom:1px solid ${hairline}; }
    .aesthetic-editorial .dashboard-mini-metric span { color:${t.textMuted}; font:.64em/1 '${t.fontMono}',monospace; text-transform:uppercase; }
    .aesthetic-editorial .dashboard-mini-metric strong { font:630 1.35em/1 '${t.fontHeading}',sans-serif; }.aesthetic-editorial .dashboard-mini-metric small{grid-column:2;color:${t.textMuted};font:.58em/1 '${t.fontMono}',monospace}

    /* Editorial quote */
    .aesthetic-editorial .editorial-quote { display:grid; grid-template-columns:8fr 3fr; gap:72px; align-items:center; min-height:500px; }
    .aesthetic-editorial .editorial-quote blockquote { margin:0; color:${darkPaper}; font:italic 500 2.25em/1.22 '${t.fontDisplay}',serif; letter-spacing:-.02em; }
    .aesthetic-editorial .editorial-quote .quote-author { margin-top:28px; color:rgba(${darkPaperRgb},.66); font:500 .68em/1.6 '${t.fontMono}',monospace; text-transform:uppercase; letter-spacing:.08em; }
    .aesthetic-editorial .quote-proof { border-left:1px solid rgba(${darkPaperRgb},.24); padding-left:36px; }
    .aesthetic-editorial .quote-proof strong { display:block; color:${t.primary}; font:620 3.3em/.9 '${t.fontHeading}',sans-serif; letter-spacing:-.04em; }
    .aesthetic-editorial .quote-proof span { display:block; margin-top:14px; color:rgba(${darkPaperRgb},.68); font:.78em/1.45 '${t.fontBody}',sans-serif; }

    /* Closing / decisions */
    .aesthetic-editorial .editorial-closing { display:grid; grid-template-columns:5fr 6fr; gap:74px; align-items:start; min-height:480px; }
    .aesthetic-editorial .closing-message h1 { margin:16px 0 20px; color:${darkPaper}; background:none !important; -webkit-text-fill-color:currentColor !important; font:620 3.7em/.98 '${t.fontHeading}',sans-serif; letter-spacing:-.04em; }
    .aesthetic-editorial .closing-message p { color:rgba(${darkPaperRgb},.68); font:450 1em/1.55 '${t.fontBody}',sans-serif; }
    .aesthetic-editorial .closing-decisions { border-top:1px solid rgba(${darkPaperRgb},.7); }
    .aesthetic-editorial .closing-decision { display:grid; grid-template-columns:40px 1fr; gap:18px; padding:20px 0; border-bottom:1px solid rgba(${darkPaperRgb},.2); }
    .aesthetic-editorial .closing-decision > span { color:${t.primary}; font:600 .7em/1.4 '${t.fontMono}',monospace; }
    .aesthetic-editorial .closing-decision strong { color:${darkPaper}; font:600 .98em/1.35 '${t.fontBody}',sans-serif; }
    .aesthetic-editorial .closing-decision small { display:block; margin-top:5px; color:rgba(${darkPaperRgb},.66); font:.72em/1.4 '${t.fontBody}',sans-serif; }

    .aesthetic-editorial .gamma-progress-hud { color:${t.textMuted}; }
    .aesthetic-editorial:has(section.present.tone-dark) .gamma-progress-hud { color:rgba(${darkPaperRgb},.66); }
    .aesthetic-editorial:has(section.present.tone-dark) .gamma-progress-count { color:${darkPaper}; }
    .aesthetic-editorial:has(section.present.tone-dark) .footer-bar { color:rgba(${darkPaperRgb},.66); background:rgba(${rgb(t.ink || t.background)},.94); border-color:rgba(${darkPaperRgb},.1); }
    .aesthetic-editorial:has(section.present.tone-dark) .footer-wordmark { color:${darkPaper}; }
    .aesthetic-editorial:has(section.present.tone-dark) .brand-deck-title { color:rgba(${darkPaperRgb},.66); }
    .aesthetic-editorial:has(section.present.tone-dark) .watermark { color:${darkPaper}; opacity:.46; }

    @keyframes editorialSignalLock {
      0% { clip-path:inset(0 100% 0 0); filter:blur(7px); }
      68% { clip-path:inset(0); filter:blur(0); }
      84% { transform:translateX(4px); }
      100% { transform:translateX(0); }
    }
    @keyframes editorialRuleLock { from { transform:scaleX(.06); opacity:.35; } to { transform:scaleX(1); opacity:1; } }
    .aesthetic-editorial .reveal .slides section.present .cover-index,
    .aesthetic-editorial .reveal .slides section.present .metric-hero-primary,
    .aesthetic-editorial .reveal .slides section.present .dashboard-grid-4 > .dashboard-panel.type-metric:first-child {
      animation:editorialSignalLock .72s cubic-bezier(.16,1,.3,1) both;
    }
    .aesthetic-editorial .reveal .slides section.present .cover-index::after { animation:editorialRuleLock .55s cubic-bezier(.16,1,.3,1) .45s both; }

    @media (max-width: 800px) {
      .aesthetic-editorial .editorial-cover, .aesthetic-editorial .editorial-agenda,
      .aesthetic-editorial .metrics-hero, .aesthetic-editorial .story-chart,
      .aesthetic-editorial .editorial-quote, .aesthetic-editorial .editorial-closing { grid-template-columns:1fr; gap:24px; }
      .aesthetic-editorial .cover-index { min-height:180px; }
      .aesthetic-editorial .metric-support-row { padding-left:0; }
    }
    ${presentationThemeCSS(t)}
  `;
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '128,128,128';
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
