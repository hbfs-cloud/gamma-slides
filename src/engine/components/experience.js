import { getIcon } from './icons.js';
import { escapeHtml } from '../html.js';
import { renderSource } from './slide-header.js';
import { revenueSculptureHTML } from './revenue-sculpture.js';

const arrow = direction => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction === 'left' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'}"/></svg>`;

export function experienceTitleHTML(slide, deck) {
  const first = deck.slides[0] === slide;
  const fr = deck.meta?.language?.startsWith('fr');
  const chapterMap = `<div class="experience-chapter-map">${(deck.meta?.chapters || []).filter(chapter=>chapter.start>1).slice(0,3).map(chapter=>`<a href="#/${chapter.start-1}"><b>${escapeHtml(chapter.label)}</b><span>Go to slide ${String(chapter.start).padStart(2,'0')}</span>${arrow('right')}</a>`).join('')}</div>`;
  const illustration = first ? (revenueSculptureHTML(deck) || chapterMap) : deck.meta?.tags?.includes('repository') ? chapterMap : `<div class="experience-chapter-map"><a href="#/28"><b>Price</b><span>Tape · volume · momentum</span>${arrow('right')}</a><a href="#/29"><b>Exposure</b><span>Liquidity · concentration · tails</span>${arrow('right')}</a><a href="#/35"><b>Outlook</b><span>Capital flows · rates · scenarios</span>${arrow('right')}</a></div>`;
  const metrics = (slide.metrics || []).map(m => `<div><strong>${escapeHtml(m.value)}</strong><span>${escapeHtml(m.label)}</span></div>`).join('');
  return `<div class="experience-cover"><div class="experience-cover-copy"><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.subtitle || '')}</p>${first ? '<a class="experience-start" href="#/1">Explore the review ' + arrow('right') + '</a>' : `<p class="experience-chapter-note">${escapeHtml(slide.footnote || '')}</p>`}</div>${illustration}</div><div class="experience-cover-metrics">${metrics}</div>${renderSource(slide, { context: false })}`;
}

export function experienceHTML(deck) {
  const fr = deck.meta?.language?.startsWith('fr');
  const chapters = deck.meta?.chapters || [{ start: 1, label: 'Presentation' }];
  const options = chapters.map(chapter => `<button type="button" data-experience-jump="${chapter.start - 1}"><span>${String(chapter.start).padStart(2, '0')}</span>${escapeHtml(chapter.label)}</button>`).join('');
  return `<header class="experience-masthead"><a href="#/" aria-label="First slide"><b>${escapeHtml(deck.meta?.company || 'Gamma Slides')}</b><span>${escapeHtml(deck.meta?.subtitle || '')}</span></a><div class="experience-tools"><button type="button" data-experience-terminal aria-label="Open terminal" title="Terminal">${getIcon('terminal','currentColor',20)}</button><button type="button" data-experience-theme>Appearance</button><button type="button" data-experience-studio>Studio</button></div></header>
    <nav class="experience-nav" aria-label="Presentation"><button type="button" data-experience-prev aria-label="Previous slide">${arrow('left')}</button><button type="button" data-experience-index aria-expanded="false" aria-controls="experience-index"><span data-experience-chapter></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9h12M6 15h12"/></svg></button><span data-experience-count aria-live="polite"></span><button type="button" data-experience-next aria-label="Next slide">${arrow('right')}</button><div class="experience-progress" aria-hidden="true"><i></i></div></nav>
    <button class="experience-more" data-experience-scroll type="button" hidden>${fr ? 'Lire la suite' : 'More below'} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-6-6 6 6 6-6"/></svg></button>
    <div class="experience-index" id="experience-index" hidden><div><h2>Explore the review</h2><button type="button" data-experience-close aria-label="Close chapter index">Close</button></div>${options}<small>${escapeHtml(deck.meta?.tags?.includes('repository') ? 'Sources tied to a revision' : 'Illustrative data')} · Arrow keys navigate · Esc closes this index</small></div>`;
}

export function experienceCSS() { return `
  body.gamma-experience { --experience-line:color-mix(in srgb,var(--gamma-text) 19%,var(--gamma-bg)); --experience-surface:color-mix(in srgb,var(--gamma-text) 4%,var(--gamma-bg)); --experience-display:5.5rem; --experience-title:2.75rem; --experience-body:1rem; --experience-caption:.75rem; }
  body.gamma-experience .reveal { position:absolute; top:56px; height:calc(100% - 112px); width:100%; }
  body.gamma-experience .reveal .slides > section { padding:36px 54px 72px; background:var(--gamma-bg)!important; color:var(--gamma-text); font-family:Archivo,system-ui,sans-serif; }
  body.gamma-experience .reveal .slides > section::before,body.gamma-experience .reveal .slides > section::after { display:none!important; }
  body.gamma-experience .theme-stage,body.gamma-experience .footer-bar,body.gamma-experience .watermark,body.gamma-experience .gamma-progress-hud,body.gamma-experience .gamma-studio-toolbar,body.gamma-experience .gamma-theme-switcher { display:none!important; }
  body.gamma-experience .slide-header { margin:0 0 30px; padding:0; border:0; }
  body.gamma-experience .slide-header::before { display:none; }
  body.gamma-experience .reveal .slides section h2,body.gamma-experience .reveal .slides section .slide-header h2 { font:550 var(--experience-title)/1.04 Archivo,system-ui,sans-serif; letter-spacing:-.035em; max-width:1040px; color:var(--gamma-text); text-transform:none; text-wrap:balance; }
  body.gamma-experience .reveal p,body.gamma-experience .slide-subtitle { font:450 var(--experience-body)/1.5 Archivo,system-ui,sans-serif; color:var(--gamma-muted); max-width:78ch; }
  body.gamma-experience .slide-header .slide-subtitle { margin-top:12px; }
  body.gamma-experience .reveal .slides section > .slide-source { left:54px; right:54px; bottom:20px; gap:24px; font:450 10px/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-muted); }
  body.gamma-experience .slide-source > span { max-width:52%; }
  body.gamma-experience .slide-source > span:last-child { text-align:right; }
  body.gamma-experience .slide-context,body.gamma-experience .slide-source i { display:none; }
  body.gamma-experience .slide-insight { border-top:1px solid var(--experience-line); padding-top:16px; margin-top:20px; }
  body.gamma-experience .slide-insight > span { display:none; }
  body.gamma-experience .slide-insight p { color:var(--gamma-text); font-size:var(--experience-body); line-height:1.5; }
  body.gamma-experience .story-chart { grid-template-columns:1fr!important; grid-template-rows:auto minmax(0,1fr)!important; gap:24px!important; }
  body.gamma-experience .story-chart .story-chart-copy { display:grid!important; grid-template-columns:1.5fr 1fr!important; gap:48px!important; grid-column:1!important; grid-row:1!important; padding:0!important; opacity:1!important; align-items:start; }
  body.gamma-experience .story-chart .slide-header { margin:0; }
  body.gamma-experience .story-chart .slide-insight { margin:0; padding:10px 0 0; }
  body.gamma-experience .story-chart .story-chart-visual { grid-column:1!important; grid-row:2!important; border:0!important; border-top:1px solid var(--experience-line)!important; padding:20px 0 0!important; }
  body.gamma-experience .chart-container { border:0; background:transparent; padding:0; }
  body.gamma-experience .dashboard-grid { gap:28px; }
  body.gamma-experience .dashboard-grid-2 { grid-template-columns:1fr 1fr; }
  body.gamma-experience .reveal .slides > section:has(> .dashboard-grid-4) { display:grid!important; grid-template-columns:.8fr 1.3fr; gap:56px; align-items:center; align-content:center; }
  body.gamma-experience .dashboard-grid-4 { grid-template-columns:repeat(2,minmax(0,1fr)); gap:36px 40px; flex:none; }
  body.gamma-experience .dashboard-grid-4 .dashboard-metric { flex:none; grid-template-rows:auto auto auto; }
  body.gamma-experience .dashboard-grid-4 .dashboard-metric p { margin:12px 0 0; padding:0; border:0; }
  body.gamma-experience .dashboard-grid-4 .dashboard-panel:first-child .dashboard-metric p { color:var(--gamma-muted); }
  body.gamma-experience .dashboard-panel,body.gamma-experience .dashboard-panel.type-metric,body.gamma-experience .dashboard-grid-4 > .dashboard-panel.type-metric:first-child { grid-row:auto; padding:18px 0 12px; border:0; border-top:1px solid var(--experience-line); background:transparent; color:var(--gamma-text); animation:none!important; }
  body.gamma-experience .dashboard-panel-title { color:var(--gamma-muted); font:550 var(--experience-caption)/1.4 Archivo,system-ui,sans-serif; letter-spacing:0; text-transform:none; }
  body.gamma-experience .dashboard-metric { grid-template-columns:1fr; grid-template-rows:auto auto 1fr; align-content:start; gap:12px; padding-top:18px; }
  body.gamma-experience .dashboard-metric strong { color:var(--gamma-text); font:550 3.65em/1 Archivo,system-ui,sans-serif; }
  body.gamma-experience .dashboard-metric > span { justify-self:start; font:550 var(--experience-body)/1.2 Archivo,system-ui,sans-serif; color:var(--gamma-primary); }
  body.gamma-experience .dashboard-metric p { margin-top:auto; padding-top:18px; font-size:var(--experience-body); }
  body.gamma-experience .dashboard-chart { margin-top:20px; }
  body.gamma-experience .metrics-hero { grid-template-columns:1fr 1.2fr; gap:72px; margin:12px 0 20px; }
  body.gamma-experience .metric-hero-primary { color:var(--gamma-text); background:transparent; border:0; border-top:1px solid var(--experience-line); padding:24px 0; animation:none!important; min-height:270px; }
  body.gamma-experience .metric-hero-primary::after { display:none; }
  body.gamma-experience .metric-hero-primary .value { color:var(--gamma-primary); font:550 var(--experience-display)/1 Archivo,system-ui,sans-serif; }
  body.gamma-experience .metric-hero-primary .label,body.gamma-experience .metric-hero-primary .delta { color:var(--gamma-muted); font:500 var(--experience-body)/1.3 Archivo,system-ui,sans-serif; letter-spacing:0; }
  body.gamma-experience .metrics-support { border-color:var(--experience-line); }
  body.gamma-experience .metric-support-row { padding:20px 0; border-color:var(--experience-line); }
  body.gamma-experience .metric-support-row .label,body.gamma-experience .metric-support-row .delta { font:500 var(--experience-caption)/1.4 Archivo,system-ui,sans-serif; text-transform:none; letter-spacing:0; }
  body.gamma-experience .metric-support-row .value { color:var(--gamma-text); font:500 2.75em/1 Archivo,system-ui,sans-serif; }
  body.gamma-experience .data-table { color:var(--gamma-text); font-size:var(--experience-body); }
  body.gamma-experience .data-table thead th { font:550 var(--experience-caption)/1.3 Archivo,system-ui,sans-serif; color:var(--gamma-muted); letter-spacing:0; text-transform:none; border-color:var(--experience-line); }
  body.gamma-experience .data-table tbody td { border-color:var(--experience-line); padding-top:13px; padding-bottom:13px; }
  body.gamma-experience .data-table tbody:hover tr:not(:hover) { opacity:1; }
  body.gamma-experience .editorial-table-wrap { min-height:0; }
  body.gamma-experience .strategy-grid { border-color:var(--experience-line); gap:36px; }
  body.gamma-experience .strategy-item { padding:24px 0!important; border:0!important; border-top:1px solid var(--experience-line)!important; }
  body.gamma-experience .strategy-number { color:var(--gamma-primary); font:500 1rem/1 Archivo,system-ui,sans-serif; }
  body.gamma-experience .strategy-item h3 { font:550 1.5rem/1.2 Archivo,system-ui,sans-serif; color:var(--gamma-text); }
  body.gamma-experience .strategy-item p { font:450 var(--experience-body)/1.5 Archivo,system-ui,sans-serif; }
  body.gamma-experience .timeline h4 { font:550 var(--experience-body)/1.4 Archivo,system-ui,sans-serif; }
  body.gamma-experience .timeline p { font-size:var(--experience-caption); }
  body.gamma-experience .editorial-closing { grid-template-columns:1fr 1fr; align-items:center; gap:70px; min-height:0; height:100%; }
  body.gamma-experience .closing-message h1 { color:var(--gamma-text)!important; -webkit-text-fill-color:currentColor!important; font:550 3.65em/1.04 Archivo,system-ui,sans-serif; letter-spacing:-.035em; text-wrap:balance; }
  body.gamma-experience .closing-message p { color:var(--gamma-muted); }
  body.gamma-experience .closing-decisions { border-color:var(--experience-line); }
  body.gamma-experience .closing-decision { padding:24px 0; grid-template-columns:32px 1fr; border-color:var(--experience-line); }
  body.gamma-experience .closing-decision strong { color:var(--gamma-text); font:550 1.25rem/1.3 Archivo,system-ui,sans-serif; }
  body.gamma-experience .closing-decision small { margin-top:10px; color:var(--gamma-muted); font:450 var(--experience-body)/1.5 Archivo,system-ui,sans-serif; }
  body.gamma-experience .experience-cover { display:grid; grid-template-columns:1.1fr 1fr; gap:56px; align-items:center; flex:1; }
  body.gamma-experience .experience-cover h1 { color:var(--gamma-text); -webkit-text-fill-color:currentColor; font:550 var(--experience-display)/.98 Archivo,system-ui,sans-serif; letter-spacing:-.04em; text-wrap:balance; margin:0; }
  body.gamma-experience .experience-cover-copy > p { font:450 1.25rem/1.5 Archivo,system-ui,sans-serif; margin:28px 0; }
  body.gamma-experience .experience-start { display:inline-flex; gap:32px; align-items:center; min-height:48px; color:var(--gamma-text); border-bottom:1px solid var(--gamma-primary); font:550 1rem/1.3 Archivo,system-ui,sans-serif; text-decoration:none; }
  .experience-start svg,.experience-nav svg { width:22px; height:22px; stroke:currentColor; stroke-width:1.5; fill:none; }
  body.gamma-experience .experience-flow { margin:0; }
  .experience-flow svg { width:100%; height:auto; overflow:visible; }
  .flow-band { fill:var(--gamma-primary); stroke:var(--gamma-bg); stroke-width:2; }
  .flow-band-0 { fill:var(--gamma-secondary); }.flow-band-2 { fill:var(--gamma-accent); }.flow-band-3 { fill:var(--gamma-muted); }.flow-band-4 { fill:var(--gamma-text); }
  .flow-year { fill:var(--gamma-muted); font:500 12px Archivo,system-ui,sans-serif; }
  .flow-value { fill:var(--gamma-text); font:550 32px Archivo,system-ui,sans-serif; }
  body.gamma-experience .experience-flow figcaption { font:450 var(--experience-caption)/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-muted); text-align:right; margin:14px 0 0; }
  body.gamma-experience .experience-cover-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:32px; border-top:1px solid var(--experience-line); padding-top:20px; margin-top:30px; }
  .experience-cover-metrics div { display:flex; align-items:baseline; gap:14px; }
  .experience-cover-metrics strong { font:550 24px/1.2 Archivo,system-ui,sans-serif; color:var(--gamma-text); }
  .experience-cover-metrics span { font:450 12px/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-muted); }
  .experience-chapter-map { display:grid; gap:28px; }
  .experience-chapter-map > div { padding:16px 0; border-top:1px solid var(--experience-line); }
  .experience-chapter-map b { display:block; color:var(--gamma-primary); font:500 2.75rem/1.1 'Source Serif 4',Georgia,serif; }
  .experience-chapter-map span { display:block; margin-top:12px; color:var(--gamma-muted); font:450 1rem/1.5 Archivo,system-ui,sans-serif; }
  .experience-masthead { position:fixed; inset:0 28px auto; height:56px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--experience-line); z-index:110; color:var(--gamma-text); font:500 12px/1 Archivo,system-ui,sans-serif; }
  .experience-masthead > a { display:flex; align-items:center; gap:20px; color:var(--gamma-text); text-decoration:none; min-height:44px; }
  .experience-masthead > a span { color:var(--gamma-muted); }
  .experience-tools { display:flex; gap:20px; }
  .experience-tools button { border:0; padding:0 8px; background:transparent; color:var(--gamma-muted); min-height:44px; font:inherit; cursor:pointer; }
  .experience-nav { position:fixed; bottom:0; left:28px; right:28px; height:56px; z-index:115; display:flex; align-items:center; gap:18px; border-top:1px solid var(--experience-line); background:var(--gamma-bg); color:var(--gamma-text); }
  .experience-nav button { min-width:44px; min-height:44px; border:0; background:transparent; color:inherit; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:20px; font:500 12px/1.2 Archivo,system-ui,sans-serif; }
  .experience-nav button:disabled { color:var(--gamma-muted); cursor:default; opacity:.5; }
  .experience-nav [data-experience-count] { margin-left:auto; font:500 12px/1 'Azeret Mono',monospace; }
  .experience-progress { position:absolute; left:0; right:0; top:-1px; height:2px; pointer-events:none; }
  .experience-progress i { display:block; height:100%; background:var(--gamma-primary); width:100%; transform:scaleX(0); transform-origin:left; transition:transform .35s ease; }
  .experience-index { position:fixed; z-index:120; bottom:70px; left:28px; width:min(520px,calc(100vw - 56px)); padding:24px; color:var(--gamma-text); background:var(--gamma-bg); border:1px solid var(--experience-line); box-shadow:0 18px 50px color-mix(in srgb,var(--gamma-text) 12%,transparent); max-height:calc(100dvh - 140px); overflow:auto; }
  .experience-index[hidden] { display:none; }.experience-index > div { display:flex; align-items:start; gap:24px; }
  .experience-index h2 { margin:0 0 24px; font:550 24px/1.2 Archivo,system-ui,sans-serif; }
  .experience-index button { cursor:pointer; background:none; border:0; color:inherit; min-height:44px; font:500 1rem/1.3 Archivo,system-ui,sans-serif; }
  .experience-index > button { display:flex; align-items:center; width:100%; gap:24px; text-align:left; padding:14px 0; border-top:1px solid var(--experience-line); }
  .experience-index > button span { color:var(--gamma-primary); font-variant-numeric:tabular-nums; }
  .experience-index small { display:block; margin-top:24px; color:var(--gamma-muted); font:450 12px/1.4 Archivo,system-ui,sans-serif; }
  .experience-more { display:none; }
  .experience-chart-key { display:none; }
  .experience-table-unit { display:none; }
  .experience-flow-labels { display:none; }
  body.gamma-experience :focus-visible { outline:2px solid var(--gamma-primary); outline-offset:3px; }
  body.gamma-experience ::selection { background:var(--gamma-primary); color:var(--gamma-bg); }
  body.gamma-experience * { scrollbar-color:var(--gamma-muted) var(--gamma-bg); scrollbar-width:thin; }
  @media(max-width:900px) {
    body.gamma-experience { --experience-display:3.25rem; --experience-title:2rem; }
    body.gamma-experience .reveal { top:52px; height:calc(100% - 152px); }
    body.gamma-experience .reveal:not(.overview) .slides { transform:none!important; zoom:1!important; inset:0!important; width:100%!important; height:100%!important; }
    body.gamma-experience .reveal:not(.overview) .slides > section { inset:0!important; transform:none; width:100%!important; height:100%!important; padding:28px 24px 32px!important; overflow:auto; overscroll-behavior:contain; justify-content:flex-start!important; }
    body.gamma-experience .reveal .slides section > * { flex-shrink:0; }
    body.gamma-experience .slide-header { margin-bottom:24px; }
    body.gamma-experience .reveal .slides section h2,body.gamma-experience .reveal .slides section .slide-header h2 { font-size:var(--experience-title); }
    body.gamma-experience .reveal .slides section > .slide-source { position:static!important; margin-top:28px; display:flex; flex-direction:column; gap:8px; font-size:12px; }
    body.gamma-experience .slide-source > span { max-width:100%; text-align:left!important; }
    body.gamma-experience .experience-cover { display:flex; flex-direction:column; gap:28px; align-items:stretch; flex:none; }
    body.gamma-experience .experience-cover-copy > p { font-size:1rem; margin:20px 0; }
    body.gamma-experience .experience-flow { width:100%; }
    body.gamma-experience .experience-cover-metrics { grid-template-columns:1fr; gap:16px; margin-top:28px; }
    body.gamma-experience .experience-cover-metrics > div { justify-content:space-between; }
    body.gamma-experience .story-chart { height:auto!important; display:flex!important; flex-direction:column; gap:20px!important; }
    body.gamma-experience .story-chart .story-chart-copy { display:flex!important; flex-direction:column; gap:20px!important; }
    body.gamma-experience .story-chart .story-chart-visual { height:360px; min-height:360px; }
    body.gamma-experience section:has([data-chart-type="stock"]) .story-chart-visual { height:600px; min-height:600px; }
    body.gamma-experience section:has([data-chart-type="sankey"]) .story-chart-copy { display:contents!important; }
    body.gamma-experience section:has([data-chart-type="sankey"]) .story-chart-visual { height:380px; min-height:380px; order:2; }
    body.gamma-experience section:has([data-chart-type="sankey"]) .story-chart .slide-insight { order:3; }
    body.gamma-experience section:has([data-chart-type="sankey"]) .experience-chart-key { order:4; }
    body.gamma-experience .experience-flow-labels { display:block; order:4; font:450 .75rem/1.5 Archivo,system-ui,sans-serif; color:var(--gamma-muted); }
    .experience-flow-labels summary { display:flex; align-items:center; min-height:44px; cursor:pointer; color:var(--gamma-text); border-bottom:1px solid var(--experience-line); }
    body.gamma-experience .reveal .experience-flow-labels ul { margin:16px 0 0; padding-left:18px; list-style:disc; }
    body.gamma-experience .reveal .experience-chart-key { display:grid; grid-template-columns:1fr; width:100%; margin:0; padding:0; list-style:none; gap:12px; }
    .experience-chart-key li { display:flex; gap:14px; align-items:baseline; font:450 1rem/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-text); }
    .experience-chart-key b { color:var(--gamma-primary); min-width:18px; font:550 12px/1.4 Archivo,system-ui,sans-serif; }
    .experience-chart-key strong { margin-left:auto; white-space:nowrap; font:550 1rem/1.4 Archivo,system-ui,sans-serif; }
    body.gamma-experience .reveal .slides > section:has(> .dashboard-grid-4) { display:flex!important; gap:0; }
    body.gamma-experience .dashboard-grid,.gamma-experience .dashboard-grid-4 { display:flex; flex-direction:column; flex:none; gap:28px; }
    body.gamma-experience .dashboard-panel { flex:none; min-height:0; padding:18px 0 0; }
    body.gamma-experience .dashboard-chart { height:320px; flex:none; }
    body.gamma-experience .dashboard-metric { padding:20px 0 0; gap:12px; }
    body.gamma-experience .dashboard-metric strong { font-size:3.05em; }
    body.gamma-experience .dashboard-metric p { margin-top:12px; }
    body.gamma-experience .metrics-hero { grid-template-columns:1fr; gap:20px; margin:0; }
    body.gamma-experience .metric-hero-primary { min-height:210px; }
    body.gamma-experience .metric-support-row .value { font-size:2.25em; }
    body.gamma-experience .editorial-table-wrap { width:100%; margin:0; padding:0; }
    body.gamma-experience .data-table { display:block; width:100%; min-width:0!important; }
    body.gamma-experience .experience-table-unit { display:block; margin-bottom:12px; font:500 .75rem/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-muted); text-align:left; }
    body.gamma-experience .data-table thead { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
    body.gamma-experience .data-table tbody { display:block; }
    body.gamma-experience .data-table tr { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px 14px; border-top:1px solid var(--experience-line); padding:18px 0; }
    body.gamma-experience .data-table[data-columns="3"] tr,body.gamma-experience .data-table[data-columns="5"] tr { grid-template-columns:repeat(2,minmax(0,1fr)); }
    body.gamma-experience .data-table[data-columns="2"] tr { grid-template-columns:1fr; }
    body.gamma-experience .data-table tbody td { display:block; border:0; padding:0; min-width:0; text-align:left; white-space:normal; font:500 1rem/1.4 Archivo,system-ui,sans-serif; background:transparent; }
    body.gamma-experience .data-table tbody td:first-child { grid-column:1 / -1; font-weight:550; }
    body.gamma-experience .data-table tbody td:not(:first-child)::before { content:attr(data-label); display:block; font:450 12px/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-muted); margin-bottom:5px; }
    body.gamma-experience .data-table .col-highlight { color:var(--gamma-primary); }
    body.gamma-experience .strategy-grid { grid-template-columns:1fr; gap:20px; }
    body.gamma-experience .strategy-item { min-height:0; }
    body.gamma-experience .timeline-horizontal { display:flex; flex-direction:column; gap:24px; padding-top:8px; }
    body.gamma-experience .timeline-horizontal .timeline-item { padding:12px 0 0 20px; margin:0; }
    body.gamma-experience .timeline-horizontal .timeline-item::before { top:16px; left:0; }
    body.gamma-experience .timeline-horizontal::before { display:none; }
    body.gamma-experience .timeline p { font-size:1rem; }
    body.gamma-experience .editorial-closing { display:flex; flex-direction:column; height:auto; gap:28px; }
    body.gamma-experience .closing-message h1 { font-size:3.05em; }
    body.gamma-experience .closing-decision { gap:16px; }
    .experience-masthead { left:20px; right:20px; height:52px; }
    .experience-masthead > a span { display:none; }.experience-tools { gap:4px; }
    .experience-nav { left:12px; right:12px; gap:8px; }
    .experience-nav button { gap:8px; }.experience-nav [data-experience-index] { max-width:190px; text-align:left; }
    .experience-index { left:16px; width:calc(100vw - 32px); }
    .experience-more:not([hidden]) { display:flex; align-items:center; justify-content:flex-end; gap:10px; position:fixed; bottom:56px; left:24px; right:24px; z-index:114; min-height:44px; padding:8px 0; background:var(--gamma-bg); color:var(--gamma-text); border:0; border-top:1px solid var(--experience-line); font:500 12px/1.3 Archivo,system-ui,sans-serif; cursor:pointer; }
    .experience-more svg { width:18px; height:18px; stroke:currentColor; fill:none; stroke-width:1.5; }
  }
  @media print { .experience-masthead,.experience-nav,.experience-index,.experience-more { display:none!important; } body.gamma-experience .reveal { top:0; height:100%; } }
  html.gamma-export .experience-masthead,html.gamma-export .experience-nav,html.gamma-export .experience-index { display:none; }
  html.gamma-export body.gamma-experience .reveal { top:0; height:100%; }
`; }

function initExperience(chapters) {
  const nav = document.querySelector('.experience-nav');
  if (!nav) return;
  document.addEventListener('keydown', event => {
    if ([' ', 'Enter'].includes(event.key) && event.target.closest('button,summary,a,select')) event.stopPropagation();
  }, true);
  const index = document.getElementById('experience-index');
  const indexButton = nav.querySelector('[data-experience-index]');
  const more = document.querySelector('[data-experience-scroll]');
  const updateScroll = () => { const slide = Reveal.getCurrentSlide(); more.hidden = !slide || slide.scrollHeight - slide.clientHeight - slide.scrollTop < 24; };
  more.addEventListener('click', () => { const slide = Reveal.getCurrentSlide(); slide.scrollBy({ top: slide.clientHeight * .8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
  document.addEventListener('scroll', updateScroll, true);
  window.addEventListener('resize', updateScroll);
  document.fonts.ready.then(updateScroll);
  const close = () => { index.hidden = true; indexButton.setAttribute('aria-expanded', 'false'); };
  const update = () => {
    const current = Reveal.getIndices().h, total = document.querySelectorAll('.reveal .slides > section').length;
    const chapter = [...chapters].reverse().find(c => c.start <= current + 1) || chapters[0];
    nav.querySelector('[data-experience-count]').textContent = `${String(current + 1).padStart(2, '0')} / ${total}`;
    nav.querySelector('[data-experience-chapter]').textContent = chapter.label;
    nav.querySelector('[data-experience-prev]').disabled = current === 0;
    nav.querySelector('[data-experience-next]').disabled = current === total - 1;
    nav.querySelector('.experience-progress i').style.transform = `scaleX(${(current + 1) / total})`;
  };
  nav.querySelector('[data-experience-prev]').addEventListener('click', () => Reveal.prev());
  nav.querySelector('[data-experience-next]').addEventListener('click', () => Reveal.next());
  indexButton.addEventListener('click', () => { index.hidden = !index.hidden; indexButton.setAttribute('aria-expanded', String(!index.hidden)); if (!index.hidden) index.querySelector('[data-experience-jump]').focus(); });
  index.addEventListener('click', e => { const jump = e.target.closest('[data-experience-jump]'); if (jump) { Reveal.slide(Number(jump.dataset.experienceJump)); close(); indexButton.focus(); } if (e.target.closest('[data-experience-close]')) { close(); indexButton.focus(); } });
  index.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { close(); indexButton.focus(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !index.hidden) { close(); indexButton.focus(); } });
  document.querySelector('[data-experience-theme]').addEventListener('click', () => { if (typeof openThemeChooser === 'function') openThemeChooser(); });
  document.querySelector('[data-experience-terminal]').addEventListener('click',()=>{initPresenterStudio();window.dispatchEvent(new Event('gamma:terminal-request'));});
  document.querySelector('[data-experience-studio]').addEventListener('click', () => { initPresenterStudio(); document.querySelector('[data-testid="studio-setup"]')?.click(); });
  Reveal.on('slidechanged', ({ currentSlide }) => { currentSlide.scrollTop = 0; close(); update(); requestAnimationFrame(updateScroll); });
  update();
  updateScroll();
}

export function experienceJS(deck) {
  return `${initExperience.toString()}\ninitExperience(${JSON.stringify(deck.meta?.chapters || [{ start: 1, label: 'Presentation' }]).replaceAll('<', '\\u003c')});`;
}

export function adaptExperienceChart(config, type, width, compact, colors) {
  const series = config.series || [];
  for (const item of series) if (item.endLabel) item.endLabel.show = false;
  if (!compact) return;
  if (type === 'doughnut' && config.legend) {
    for (const item of series) { item.radius = ['42%', '64%']; item.center = ['50%', '39%']; }
    if (config.title) config.title.top = '28%';
    config.legend.bottom = 0;
    config.legend.textStyle.fontSize = 12;
  }
  if (type === 'gauge' && width < 180) {
    for (const item of series) {
      item.detail.fontSize = 20;
      item.title.fontSize = 12;
      item.title.offsetCenter = [0, '66%'];
      item.progress.width = 7;
      item.axisLine.lineStyle.width = 7;
    }
  }
  if (config.__gammaWaterfall) {
    config.grid.bottom = 40;
    config.xAxis.axisLabel.formatter = (_value, index) => String(index + 1);
    config.xAxis.axisLabel.fontSize = 12;
  }
  if (type === 'sankey') {
    const luminance = color => [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
    for (const item of series) {
      Object.assign(item, { orient: 'vertical', left: 10, right: 10, top: 8, bottom: 8, nodeWidth: 44, nodeGap: 16 });
      item.label = { ...item.label, position: 'inside', fontFamily: 'Archivo', fontSize: 12, lineHeight: 14, fontWeight: 650, formatter: params => { const label = config.__gammaNodeLabels?.[params.name]; return typeof label === 'string' ? label : params.name.replaceAll(' ', '\n'); } };
      item.data.forEach(node => {
        const l = luminance(node.itemStyle.color);
        const ratio = color => (Math.max(l, luminance(color)) + .05) / (Math.min(l, luminance(color)) + .05);
        node.label = { color: ratio(colors.text) >= ratio(colors.bg) ? colors.text : colors.bg };
      });
    }
  }
}
