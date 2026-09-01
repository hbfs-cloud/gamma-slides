export function presentationThemeCSS(theme) {
  if (theme.presentationTheme === 'cutting-room') return cuttingRoomCSS(theme);
  if (theme.presentationTheme === 'signal-room') return signalRoomCSS(theme);
  return analystProofCSS(theme);
}

function analystProofCSS(t) {
  return `
    .aesthetic-editorial .reveal .slides section { background:${t.background}; }
    .aesthetic-editorial .footer-wordmark { font-family:'Source Serif 4',serif; font-weight:650; }
    .aesthetic-editorial .brand-monogram { border-color:${t.primary}; color:${t.primary}; }
    .aesthetic-editorial .brand-deck-title { font-family:'Archivo',sans-serif; }
    .aesthetic-editorial .brand-classification { color:${t.primary}; }
    .aesthetic-editorial .theme-stage { top:92px; right:30px; bottom:76px; width:18px; color:${t.textMuted}; }
    .aesthetic-editorial .theme-stage span {
      position:absolute; top:0; right:0; color:${t.primary}; font-size:.48em; font-weight:650; letter-spacing:.04em;
      writing-mode:vertical-rl; transform:rotate(180deg);
    }
    .aesthetic-editorial .theme-stage i { top:42px; right:4px; bottom:0; width:1px; background:${t.hairline}; }
    .aesthetic-editorial .theme-stage b { right:1px; top:92px; width:7px; height:1px; background:${t.primary}; }
    .aesthetic-editorial .cadence-1 .theme-stage b { top:48%; }
    .aesthetic-editorial .cadence-2 .theme-stage b { top:76%; }
    .aesthetic-editorial .slide-header { position:relative; padding-left:26px; }
    .aesthetic-editorial .slide-header::before {
      content:''; position:absolute; left:0; top:2px; bottom:2px; width:1px; background:${t.primary};
    }
    .aesthetic-editorial .slide-kicker {
      position:absolute; right:0; top:4px; margin:0; max-width:180px; text-align:right;
      color:${t.textMuted}; font-size:.52em; letter-spacing:.08em;
    }
    .aesthetic-editorial .reveal .slides section > h2,
    .aesthetic-editorial .reveal .slides section > .slide-header h2 {
      font-weight:590; letter-spacing:-.025em;
    }
    .aesthetic-editorial .editorial-cover { grid-template-columns:2.7fr 8.3fr; }
    .aesthetic-editorial .cover-index { background:${t.primary}; }
    .aesthetic-editorial .cover-index strong { font-family:'Azeret Mono',monospace; font-weight:620; }
    .aesthetic-editorial .cover-content h1 { font-family:'Source Serif 4',serif; font-weight:560; letter-spacing:-.025em; }
    .aesthetic-editorial .metric-hero-primary,
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child { background:${t.text}; }
    .aesthetic-editorial .metric-hero-primary::after { width:34px; height:1px; }
    .aesthetic-editorial .dashboard-panel { background:transparent; }
    .aesthetic-editorial .dashboard-panel.type-metric { background:transparent; border-top-color:${t.text}; }
    .aesthetic-editorial .dashboard-panel.type-metric::after { display:none; }
    .aesthetic-editorial .data-table tbody tr:hover td { background:${t.tableHover} !important; }
    .aesthetic-editorial .data-table tbody tr:hover td:first-child { color:${t.primary}; }
    .aesthetic-editorial .data-table .col-highlight { box-shadow:inset 0 -1px 0 ${t.primary}; }
    .aesthetic-editorial .story-chart-visual { border-left-color:${t.primary}; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart { grid-template-columns:8.5fr 3.5fr; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart-copy { grid-column:2; grid-row:1; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart-visual {
      grid-column:1; grid-row:1; padding:0 22px 0 0; border-left:0; border-right:1px solid ${t.primary};
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart {
      grid-template-columns:1fr; grid-template-rows:auto minmax(0,1fr); gap:22px;
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy {
      display:grid; grid-template-columns:minmax(0,7fr) minmax(260px,3fr); gap:54px; align-items:end;
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy .slide-header { margin:0; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy .slide-insight { margin:0; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-visual { padding:18px 0 0; border:0; border-top:1px solid ${t.primary}; }
    .aesthetic-editorial .dashboard-grid-4 { grid-template-columns:1.5fr repeat(3,minmax(0,1fr)); }
    .aesthetic-editorial .editorial-table-wrap { margin-right:34px; }
    .aesthetic-editorial .reveal .slides section.present .slide-header::before {
      animation:proofRule .58s cubic-bezier(.16,1,.3,1) both;
    }
    .aesthetic-editorial .reveal .slides section.present .theme-stage b {
      animation:proofCursor .62s cubic-bezier(.16,1,.3,1) both;
    }
    @keyframes proofRule { from { transform:scaleY(.12); transform-origin:top; } to { transform:scaleY(1); transform-origin:top; } }
    @keyframes proofCursor { from { width:1px; opacity:.25; } to { width:7px; opacity:1; } }
  `;
}

function cuttingRoomCSS(t) {
  return `
    .aesthetic-editorial .reveal .slides section {
      padding-top:58px; background:${t.background}; color:${t.text};
    }
    .aesthetic-editorial .footer-bar { border-top-color:${t.primary}; }
    .aesthetic-editorial .brand-monogram { border-color:${t.primary}; background:${t.primary}; color:${t.background}; }
    .aesthetic-editorial .footer-wordmark,
    .aesthetic-editorial .brand-deck-title { font-family:'Archivo',sans-serif; text-transform:uppercase; }
    .aesthetic-editorial .footer-wordmark { font-weight:760; }
    .aesthetic-editorial .brand-classification { color:${t.primary}; }
    .aesthetic-editorial .watermark::before { width:28px; }
    .aesthetic-editorial .theme-stage { left:0; right:0; bottom:23px; height:24px; color:${t.primary}; }
    .aesthetic-editorial .theme-stage span {
      position:absolute; right:26px; bottom:2px; color:${t.primary}; font-size:.48em; font-weight:720; letter-spacing:.08em;
    }
    .aesthetic-editorial .theme-stage i {
      left:0; right:0; bottom:0; height:12px; opacity:.78;
      background:repeating-linear-gradient(90deg,${t.primary} 0 18px,transparent 18px 27px);
    }
    .aesthetic-editorial .theme-stage b { left:0; top:0; width:33%; height:1px; background:${t.primary}; }
    .aesthetic-editorial .cadence-1 .theme-stage b { width:66%; }
    .aesthetic-editorial .cadence-2 .theme-stage b { width:100%; }
    .aesthetic-editorial .reveal .slides section > h2,
    .aesthetic-editorial .reveal .slides section > .slide-header h2 {
      max-width:1040px; color:${t.text}; font-family:'Archivo',sans-serif; font-weight:760;
      font-stretch:82%; letter-spacing:-.035em; text-transform:uppercase;
    }
    .aesthetic-editorial .slide-header { position:relative; margin-bottom:26px; }
    .aesthetic-editorial .slide-kicker {
      position:absolute; right:0; bottom:-20px; margin:0; padding:4px 7px;
      background:${t.primary}; color:${t.background}; letter-spacing:.04em; transform:rotate(-1.2deg);
    }
    .aesthetic-editorial .slide-subtitle,
    .aesthetic-editorial .reveal p { color:${t.textMuted}; }
    .aesthetic-editorial .editorial-cover { grid-template-columns:4.2fr 6.8fr; gap:0; }
    .aesthetic-editorial .cover-index { background:${t.primary}; color:${t.background}; }
    .aesthetic-editorial .cover-index span,
    .aesthetic-editorial .cover-index strong { color:${t.background}; }
    .aesthetic-editorial .cover-index strong { font-family:'Azeret Mono',monospace; font-weight:780; }
    .aesthetic-editorial .cover-content { padding-left:46px; }
    .aesthetic-editorial .cover-content h1 { font-family:'Archivo',sans-serif; font-weight:790; text-transform:uppercase; }
    .aesthetic-editorial .cover-content h1 { font-size:3.05em; }
    .aesthetic-editorial .cover-strip { margin-left:46px; border-color:${t.hairline}; }
    .aesthetic-editorial .agenda-editorial-list,
    .aesthetic-editorial .metrics-support,
    .aesthetic-editorial .comparison-editorial,
    .aesthetic-editorial .strategy-grid { border-top-color:${t.primary}; }
    .aesthetic-editorial .agenda-editorial-row,
    .aesthetic-editorial .metric-support-row,
    .aesthetic-editorial .comparison-editorial-row,
    .aesthetic-editorial .strategy-item,
    .aesthetic-editorial .data-table tbody td { border-color:${t.hairline}; }
    .aesthetic-editorial .data-table tbody tr:hover td { color:${t.text}; background:${t.tableHover} !important; }
    .aesthetic-editorial .data-table tbody tr:hover td:first-child { color:${t.primary}; }
    .aesthetic-editorial .data-table .col-highlight { box-shadow:inset 0 -1px 0 ${t.primary}; }
    .aesthetic-editorial .metric-hero-primary { background:${t.primary}; color:${t.background}; }
    .aesthetic-editorial .metric-hero-primary .label,
    .aesthetic-editorial .metric-hero-primary .value,
    .aesthetic-editorial .metric-hero-primary .delta { color:${t.background}; }
    .aesthetic-editorial .dashboard-panel { border:0; border-bottom:1px solid ${t.hairline}; background:transparent; }
    .aesthetic-editorial .dashboard-panel.type-metric { border-top:0; background:transparent; }
    .aesthetic-editorial .dashboard-panel.type-metric::after { display:none; }
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child {
      background:${t.primary}; color:${t.background};
    }
    .aesthetic-editorial .story-chart-visual { border-left:0; padding-left:28px; }
    .aesthetic-editorial .story-chart-copy { border-right:1px solid ${t.primary}; padding-right:28px; }
    .aesthetic-editorial .story-chart-copy h2 { font-size:1.82em; line-height:1.04; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart { grid-template-columns:8.3fr 3.7fr; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart-copy {
      grid-column:2; grid-row:1; padding:0 0 0 28px; border:0; border-left:1px solid ${t.primary};
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart-visual { grid-column:1; grid-row:1; padding:0 22px 0 0; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart {
      grid-template-columns:1fr; grid-template-rows:auto minmax(0,1fr); gap:12px;
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy {
      display:grid; grid-template-columns:minmax(0,8fr) minmax(230px,2fr); gap:42px; align-items:end;
      padding:0 0 13px; border:0; border-bottom:1px solid ${t.primary};
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy .slide-header,
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy .slide-insight { margin:0; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-visual { padding:10px 0 0; }
    .aesthetic-editorial .dashboard-grid-4 { grid-template-columns:1.7fr repeat(3,minmax(0,1fr)); gap:0; }
    .aesthetic-editorial .dashboard-grid-4 .dashboard-panel { border-right:1px solid ${t.hairline}; }
    .aesthetic-editorial .editorial-closing { grid-template-columns:6.7fr 4.3fr; }
    .aesthetic-editorial .reveal .slides section.present .theme-stage i {
      animation:filmAdvance .7s cubic-bezier(.16,1,.3,1) both;
    }
    @keyframes filmAdvance { from { transform:translateX(-54px); opacity:.18; } to { transform:translateX(0); opacity:.72; } }
  `;
}

function signalRoomCSS(t) {
  return `
    .aesthetic-editorial .reveal .slides section {
      background:${t.background}; color:${t.text};
    }
    .aesthetic-editorial .footer-bar { border-top-color:${t.hairline}; background:${t.footerBg}; }
    .aesthetic-editorial .brand-monogram { position:relative; border-color:${t.hairline}; color:${t.primary}; }
    .aesthetic-editorial .brand-monogram::after {
      content:''; position:absolute; top:-1px; right:-1px; width:4px; height:4px; background:${t.primary};
    }
    .aesthetic-editorial .footer-wordmark,
    .aesthetic-editorial .brand-deck-title { font-family:'Azeret Mono',monospace; }
    .aesthetic-editorial .brand-classification { color:${t.primary}; }
    .aesthetic-editorial .watermark { opacity:.5; }
    .aesthetic-editorial .theme-stage { top:96px; right:29px; bottom:78px; width:22px; color:${t.primary}; }
    .aesthetic-editorial .theme-stage span {
      position:absolute; right:0; bottom:0; color:${t.primary}; font-size:.46em; font-weight:620; letter-spacing:.05em;
    }
    .aesthetic-editorial .theme-stage i { top:0; right:5px; bottom:28px; width:1px; background:${t.hairline}; }
    .aesthetic-editorial .theme-stage b {
      right:2px; top:18%; width:7px; height:7px; border:1px solid ${t.primary}; background:${t.background};
    }
    .aesthetic-editorial .cadence-1 .theme-stage b { top:48%; }
    .aesthetic-editorial .cadence-2 .theme-stage b { top:78%; background:${t.primary}; }
    .aesthetic-editorial .reveal .slides section::before {
      content:''; display:block; position:absolute; inset:0; pointer-events:none; opacity:.35;
      background-image:
        radial-gradient(circle at 13% 18%,${t.textMuted} 0 1px,transparent 1.4px),
        radial-gradient(circle at 73% 64%,${t.textMuted} 0 1px,transparent 1.4px),
        radial-gradient(circle at 43% 88%,${t.textMuted} 0 1px,transparent 1.4px);
      background-size:113px 97px,181px 157px,251px 223px;
    }
    .aesthetic-editorial .reveal .slides section > h2,
    .aesthetic-editorial .reveal .slides section > .slide-header h2 {
      max-width:1080px; color:${t.text}; font-family:'Azeret Mono',monospace;
      font-weight:570; letter-spacing:-.03em;
    }
    .aesthetic-editorial .slide-header { position:relative; margin-bottom:30px; }
    .aesthetic-editorial .slide-kicker {
      position:absolute; left:0; bottom:-18px; margin:0; color:${t.primary};
      font-size:.53em; letter-spacing:.18em;
    }
    .aesthetic-editorial .slide-subtitle,
    .aesthetic-editorial .reveal p { color:${t.textMuted}; }
    .aesthetic-editorial .editorial-cover {
      display:grid; grid-template-columns:1fr; grid-template-rows:minmax(0,1fr) auto auto;
      min-height:520px; gap:0;
    }
    .aesthetic-editorial .cover-index {
      position:static; grid-row:3; min-height:58px; padding:15px 0 0; flex-direction:row;
      align-items:flex-start; background:transparent; border-top:1px solid ${t.hairline}; overflow:visible;
    }
    .aesthetic-editorial .cover-index::after { display:none; }
    .aesthetic-editorial .cover-index span { color:${t.textMuted}; }
    .aesthetic-editorial .cover-index strong { color:${t.primary}; font-family:'Azeret Mono',monospace; font-size:2.1em; }
    .aesthetic-editorial .cover-content { grid-row:1; align-self:center; padding:0; }
    .aesthetic-editorial .cover-content h1 { max-width:1020px; font-family:'Azeret Mono',monospace; font-size:3.65em; font-weight:560; }
    .aesthetic-editorial .cover-strip { position:static; grid-row:2; justify-self:end; width:auto; border:0; padding:0 0 14px; }
    .aesthetic-editorial .agenda-editorial-list,
    .aesthetic-editorial .metrics-support,
    .aesthetic-editorial .comparison-editorial,
    .aesthetic-editorial .strategy-grid { border-top:0; }
    .aesthetic-editorial .agenda-editorial-row,
    .aesthetic-editorial .metric-support-row,
    .aesthetic-editorial .comparison-editorial-row,
    .aesthetic-editorial .strategy-item { border-color:${t.hairline}; }
    .aesthetic-editorial .agenda-editorial-row:hover,
    .aesthetic-editorial .metric-support-row:hover,
    .aesthetic-editorial .strategy-item:hover { color:${t.text}; filter:brightness(1.18); }
    .aesthetic-editorial .metric-hero-primary { background:transparent; border-bottom:1px solid ${t.primary}; }
    .aesthetic-editorial .metric-hero-primary .value { color:${t.primary}; }
    .aesthetic-editorial .dashboard-panel,
    .aesthetic-editorial .dashboard-panel.type-metric,
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child {
      border:0; border-bottom:1px solid ${t.hairline}; background:transparent; color:${t.text};
    }
    .aesthetic-editorial .dashboard-panel.type-metric::after { display:none; }
    .aesthetic-editorial .story-chart-visual { border:0; padding-left:30px; }
    .aesthetic-editorial .story-chart-copy { opacity:.72; }
    .aesthetic-editorial .story-chart-copy h2 { font-size:1.75em; line-height:1.05; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart { grid-template-columns:8.7fr 3.3fr; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart-copy { grid-column:2; grid-row:1; padding-left:16px; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-1 .story-chart-visual { grid-column:1; grid-row:1; padding:0 26px 0 0; border-right:1px solid ${t.hairline}; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart {
      grid-template-columns:1fr; grid-template-rows:auto minmax(0,1fr); gap:24px;
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy {
      display:grid; grid-template-columns:minmax(0,7.5fr) minmax(250px,2.5fr); gap:48px; align-items:end;
      opacity:1;
    }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy .slide-header,
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-copy .slide-insight { margin:0; }
    .aesthetic-editorial section.layout-chart.variant-story.cadence-2 .story-chart-visual { padding:20px 0 0; border-top:1px solid ${t.primary}; }
    .aesthetic-editorial .dashboard-grid-4 { grid-template-columns:1.65fr repeat(3,minmax(0,1fr)); gap:18px; }
    .aesthetic-editorial .dashboard-grid-4 > .dashboard-panel.type-metric:first-child { grid-row:span 2; }
    .aesthetic-editorial .closing-message h1 { font-size:2.62em; letter-spacing:-.03em; }
    .aesthetic-editorial .story-chart-copy:focus-within,
    .aesthetic-editorial .story-chart-copy:hover { opacity:1; }
    .aesthetic-editorial .data-table { border-collapse:collapse; }
    .aesthetic-editorial .data-table thead th { border-top:0; border-color:${t.primary}; }
    .aesthetic-editorial .data-table tbody td { border-color:${t.hairline}; }
    .aesthetic-editorial .data-table tbody tr:hover td { color:${t.text}; background:${t.tableHover} !important; }
    .aesthetic-editorial .data-table tbody tr:hover td:first-child { color:${t.primary}; }
    .aesthetic-editorial .data-table .col-highlight { box-shadow:inset 0 -1px 0 ${t.primary}; }
    .aesthetic-editorial .reveal .slides section.present::before {
      animation:signalDepth 14s linear infinite;
    }
    .aesthetic-editorial .reveal .slides section.present .theme-stage b {
      animation:signalLock .66s cubic-bezier(.16,1,.3,1) both;
    }
    @keyframes signalDepth { from { background-position:0 0,0 0,0 0; } to { background-position:22px 9px,-18px 12px,9px -13px; } }
    @keyframes signalLock { from { transform:translateY(-18px); opacity:.22; } to { transform:translateY(0); opacity:1; } }
    @media (prefers-reduced-motion:reduce) {
      .aesthetic-editorial .reveal .slides section.present::before { animation:none; }
    }
  `;
}
