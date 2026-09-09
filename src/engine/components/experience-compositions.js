import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from './slide-header.js';

// Authored compositions follow the purpose of the evidence. They never alter
// values or the underlying chart model, and ordinary decks keep their layouts.
export function experienceCompositionHTML(slide) {
  const source = renderSource(slide);
  if (slide.composition === 'brief') {
    const rows = (slide.panels || []).map(panel => `<article class="experience-brief-row"><span class="brief-role">${escapeHtml(panel.title)}</span><strong class="brief-value">${escapeHtml(panel.value)}</strong><span class="brief-delta">${escapeHtml(panel.delta)}</span><p>${escapeHtml(panel.subtitle)}</p></article>`).join('');
    return `<div class="experience-brief">${renderSlideHeader(slide)}<div class="experience-brief-rows">${rows}</div></div>${source}`;
  }
  if (slide.composition === 'scorecard') {
    const rows = (slide.metrics || []).map(metric => `<div class="experience-score-row"><span class="label">${escapeHtml(metric.label)}</span><strong class="value">${escapeHtml(metric.value)}</strong><span class="delta">${escapeHtml(metric.delta)}</span></div>`).join('');
    return `<div class="experience-scorecard"><div class="experience-score-intro">${renderSlideHeader(slide)}${renderInsight(slide)}</div><div class="experience-score-rows">${rows}</div></div>${source}`;
  }
  if (slide.composition === 'sequence') {
    const rows = (slide.items || []).map((item, index) => `<li class="experience-bet"><span class="experience-bet-order">${index + 1}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></li>`).join('');
    return `${renderSlideHeader(slide)}<ol class="experience-sequence">${rows}</ol>${renderInsight(slide)}${source}`;
  }
  if (slide.composition === 'roadmap') {
    const rows = (slide.items || []).map(item => {
      const [quarter, ...name] = String(item.title || '').split(' · ');
      const [deliverable, ...gate] = String(item.description || item.text || '').split('; exit on ');
      return `<li class="experience-gate"><strong class="gate-quarter">${escapeHtml(quarter)}</strong><div class="gate-deliverable"><h3>${escapeHtml(name.join(' · '))}</h3><p>${escapeHtml(deliverable)}</p></div><div class="gate-criterion"><span>Release criterion</span><p>${escapeHtml(gate.join('; exit on '))}</p></div></li>`;
    }).join('');
    return `${renderSlideHeader(slide)}<ol class="experience-roadmap">${rows}</ol>${renderInsight(slide)}${source}`;
  }
  return null;
}

export function experienceCompositionsCSS() { return `
  body.gamma-experience .experience-brief { display:grid; grid-template-columns:1fr 1.15fr; gap:72px; align-items:center; flex:1; }
  body.gamma-experience .reveal .slides section .experience-brief .slide-header h2 { font:400 var(--experience-display)/1.04 'Source Serif 4',Georgia,serif; letter-spacing:-.035em; }
  body.gamma-experience .experience-brief-rows { display:grid; }
  body.gamma-experience .experience-brief-row { display:grid; grid-template-columns:1fr auto; padding:20px 0; border-top:1px solid var(--experience-line); column-gap:24px; align-items:baseline; }
  .brief-role { font:550 1rem/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-text); }
  .brief-value { grid-column:2; grid-row:1 / 3; font:550 2.75rem/1 Archivo,system-ui,sans-serif; color:var(--gamma-text); }
  .brief-delta { grid-column:1; color:var(--gamma-primary); font:500 .75rem/1.4 Archivo,system-ui,sans-serif; margin-top:5px; }
  body.gamma-experience .experience-brief-row p { grid-column:1 / -1; margin:10px 0 0; }
  body.gamma-experience .experience-scorecard { display:grid; grid-template-columns:.95fr 1.2fr; gap:64px; align-items:stretch; flex:1; padding:12px 0; }
  body.gamma-experience .experience-score-intro { background:var(--gamma-primary); color:var(--gamma-bg); padding:36px; display:flex; flex-direction:column; justify-content:space-between; }
  body.gamma-experience .reveal .slides section .experience-score-intro .slide-header h2 { color:var(--gamma-bg); font:400 3.25rem/1.06 'Source Serif 4',Georgia,serif; }
  body.gamma-experience .experience-score-intro p { color:var(--gamma-bg); }
  body.gamma-experience .experience-score-intro .slide-insight { border-color:var(--gamma-bg); }
  .experience-score-rows { display:grid; align-content:center; }
  .experience-score-row { display:grid; grid-template-columns:1fr auto; align-items:baseline; border-bottom:1px solid var(--experience-line); padding:22px 0; gap:8px 20px; }
  .experience-score-row .label { font:500 1rem/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-muted); }
  .experience-score-row .value { font:550 3.25rem/1 Archivo,system-ui,sans-serif; color:var(--gamma-text); grid-column:2; grid-row:1 / 3; }
  .experience-score-row .delta { font:500 .75rem/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-primary); }

  body.gamma-experience section[data-composition="ledger"] { display:grid!important; grid-template-columns:330px minmax(0,1fr); gap:24px 54px; align-content:center; }
  body.gamma-experience section[data-composition="ledger"] > .slide-header { grid-column:1; grid-row:1; align-self:start; margin:0; }
  body.gamma-experience section[data-composition="ledger"] > .slide-insight { grid-column:1; grid-row:2; margin:0; align-self:end; }
  body.gamma-experience section[data-composition="ledger"] > .editorial-table-wrap { grid-column:2; grid-row:1 / 3; align-self:center; }
  body.gamma-experience section[data-composition="ledger"] .data-table td { padding-top:18px; padding-bottom:18px; }
  body.gamma-experience .data-table tr[data-emphasis="true"] td { background:var(--experience-surface); font-weight:650; border-bottom:1px solid var(--gamma-primary); }

  @media(min-width:901px) {
    body.gamma-experience section[data-composition="evidence"] .story-chart { grid-template-columns:330px minmax(0,1fr)!important; grid-template-rows:minmax(0,1fr)!important; gap:54px!important; align-items:center; }
    body.gamma-experience section[data-composition="evidence"] .story-chart-copy { display:flex!important; flex-direction:column; gap:36px!important; }
    body.gamma-experience section[data-composition="evidence"] .story-chart-visual { grid-column:2!important; grid-row:1!important; border-top:0!important; padding-top:0!important; height:100%; }
    body.gamma-experience section[data-composition="evidence"] .story-chart-copy .slide-insight { padding-top:20px; }
    body.gamma-experience section[data-composition="feature"] .dashboard-grid { display:grid; grid-template-columns:1.65fr 1fr; }
    body.gamma-experience section[data-composition="feature"] .dashboard-panel { grid-column:auto; }
    body.gamma-experience section[data-composition="feature"] .dashboard-panel.type-metric { align-self:center; padding:30px 0 30px 36px; border-top:0; border-left:1px solid var(--experience-line); }
    body.gamma-experience section[data-composition="feature"] .dashboard-metric strong { font-size:var(--experience-display); }
    body.gamma-experience section[data-composition="register"] .dashboard-grid { grid-template-rows:190px minmax(0,1fr); gap:16px 28px; }
    body.gamma-experience section[data-composition="register"] .dashboard-chart { height:145px; margin-top:4px; }
    body.gamma-experience section[data-composition="register"] .dashboard-panel.type-table { padding-top:16px; }
    body.gamma-experience section[data-composition="register"] .dashboard-panel.type-metric { padding-top:14px; }
    body.gamma-experience section[data-composition="register"] .dashboard-metric { padding-top:8px; gap:10px; }
    body.gamma-experience section[data-composition="register"] .dashboard-metric strong { font-size:2.75rem; }
    body.gamma-experience section[data-composition="register"] .dashboard-metric p { padding-top:0; margin-top:0; }
  }

  body.gamma-experience .reveal .experience-sequence { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:40px; list-style:none; padding:0; margin:32px 0 20px; width:100%; flex:1; align-items:start; align-content:center; }
  .experience-bet { display:grid; grid-template-columns:40px 1fr; gap:24px 12px; position:relative; padding:24px 0; }
  .experience-bet-order { font:400 2.75rem/1 'Source Serif 4',Georgia,serif; color:var(--gamma-primary); border-top:1px solid var(--gamma-primary); padding-top:18px; }
  body.gamma-experience .experience-bet h3 { color:var(--gamma-text); font:400 2.75rem/1.06 'Source Serif 4',Georgia,serif; letter-spacing:-.025em; margin:0; border-top:1px solid var(--experience-line); padding-top:18px; }
  body.gamma-experience .experience-bet p { grid-column:2; margin:0; }
  .experience-bet:not(:last-child)::after { content:''; position:absolute; width:12px; height:12px; border-top:1px solid var(--gamma-primary); border-right:1px solid var(--gamma-primary); right:-24px; top:64px; transform:rotate(45deg); }
  body.gamma-experience .reveal .experience-roadmap { display:grid; list-style:none; padding:0; margin:12px 0; width:100%; flex:1; }
  .experience-gate { display:grid; grid-template-columns:80px 1.1fr 1fr; gap:32px; border-top:1px solid var(--experience-line); padding:18px 0; align-items:center; }
  .gate-quarter { color:var(--gamma-primary); font:400 2.75rem/1 'Source Serif 4',Georgia,serif; }
  body.gamma-experience .experience-gate h3 { font:550 1.25rem/1.25 Archivo,system-ui,sans-serif; color:var(--gamma-text); margin:0 0 6px; }
  body.gamma-experience .experience-gate p { font-size:1rem; margin:0; }
  .gate-criterion > span { display:block; font:500 .75rem/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-primary); margin-bottom:6px; }
  body.gamma-experience .gate-criterion p { color:var(--gamma-text); }
  body.gamma-experience section[data-composition="roadmap"] > .slide-insight { padding-top:12px; margin-top:8px; }

  body.gamma-experience .reveal .slides > section[data-composition="chapter"] { background:var(--gamma-primary)!important; color:var(--gamma-bg); }
  body.gamma-experience section[data-composition="chapter"] .experience-cover { grid-template-columns:1.2fr 1fr; gap:60px; }
  body.gamma-experience section[data-composition="chapter"] .experience-cover h1 { font-family:'Source Serif 4',Georgia,serif; font-weight:400; color:var(--gamma-bg); }
  body.gamma-experience section[data-composition="chapter"] .experience-cover p,body.gamma-experience section[data-composition="chapter"] > .slide-source { color:var(--gamma-bg); }
  body.gamma-experience .reveal .slides section[data-composition="chapter"] > .slide-source { color:var(--gamma-bg); }
  body.gamma-experience section[data-composition="chapter"] .experience-cover-metrics { display:none; }
  body.gamma-experience .experience-chapter-map > a { display:grid; grid-template-columns:1fr 24px; text-decoration:none; padding:22px 0; border-top:1px solid currentColor; color:var(--gamma-bg); }
  body.gamma-experience .experience-chapter-map b { color:inherit; font-size:2.75rem; }
  body.gamma-experience .experience-chapter-map span { grid-column:1; color:inherit; }
  .experience-chapter-map svg { width:24px; height:24px; grid-column:2; grid-row:1 / 3; align-self:center; stroke:currentColor; fill:none; stroke-width:1.5; transition:transform .25s ease; }
  .experience-chapter-map a:hover svg { transform:translateX(5px); }
  body.gamma-experience section[data-composition="chapter"] :focus-visible { outline-color:var(--gamma-bg); }
  body.gamma-experience section[data-composition="decisions"] .editorial-closing { grid-template-columns:1fr 1.1fr; gap:64px; }
  body.gamma-experience section[data-composition="decisions"] .closing-message { background:var(--gamma-primary); padding:36px; }
  body.gamma-experience section[data-composition="decisions"] .closing-message h1 { color:var(--gamma-bg)!important; font:400 3.25rem/1.06 'Source Serif 4',Georgia,serif; }
  body.gamma-experience section[data-composition="decisions"] .closing-message p { color:var(--gamma-bg); margin-top:24px; }
  body.gamma-experience section[data-composition="decisions"] .closing-decision { padding:28px 0; }
  body.gamma-experience section[data-composition="decisions"] .closing-decision strong { font:550 1.5rem/1.2 Archivo,system-ui,sans-serif; }
  body.gamma-experience section[data-composition="decisions"] .closing-decision small { display:block; margin-top:10px; font:450 1rem/1.45 Archivo,system-ui,sans-serif; }

  @media(max-width:900px) {
    body.gamma-experience .experience-brief { display:flex; flex-direction:column; gap:0; align-items:stretch; flex:none; }
    body.gamma-experience .reveal .slides section .experience-brief .slide-header h2 { font:400 2.75rem/1.04 'Source Serif 4',Georgia,serif; }
    body.gamma-experience .experience-brief-row { padding:13px 0; gap:3px 14px; }
    .brief-value { font-size:2rem; }
    body.gamma-experience .experience-brief-row p { font-size:.75rem; margin:4px 0 0; }
    body.gamma-experience .experience-brief .slide-header { margin-bottom:18px; }
    body.gamma-experience .experience-scorecard { display:flex; flex-direction:column; gap:8px; padding:0; flex:none; }
    body.gamma-experience .experience-score-intro { display:contents; background:transparent; color:var(--gamma-text); }
    body.gamma-experience .experience-score-intro .slide-header { background:var(--gamma-primary); width:calc(100% + 48px); max-width:none; padding:24px; margin:-28px -24px 0; }
    body.gamma-experience .reveal .slides section .experience-score-intro .slide-header h2 { font-size:2rem; }
    body.gamma-experience .experience-score-intro .slide-insight { order:3; border-color:var(--experience-line); }
    body.gamma-experience .experience-score-intro .slide-insight p { color:var(--gamma-text); }
    body.gamma-experience .experience-score-rows { order:2; }
    .experience-score-row { padding:18px 0; }
    .experience-score-row .value { font-size:2rem; }
    .experience-score-row .label { max-width:180px; }
    body.gamma-experience section[data-composition="ledger"] { display:flex!important; gap:0; }
    body.gamma-experience section[data-composition="ledger"] > .slide-header { margin-bottom:24px; }
    body.gamma-experience section[data-composition="ledger"] > .slide-insight { margin-top:24px; }
    body.gamma-experience section[data-composition="ledger"] .data-table td { padding:0; }
    body.gamma-experience section[data-composition="ledger"] .data-table tr[data-emphasis="true"] { background:var(--experience-surface); padding:18px 12px; }
    body.gamma-experience section[data-composition="ledger"] .data-table tr[data-emphasis="true"] td { background:transparent; border:0; }
    body.gamma-experience section[data-composition="register"] .dashboard-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px 12px; }
    body.gamma-experience section[data-composition="register"] .dashboard-panel { min-width:0; padding:12px 0 0; }
    body.gamma-experience section[data-composition="register"] .dashboard-panel.type-table { grid-column:1 / -1; }
    body.gamma-experience section[data-composition="register"] .dashboard-chart { height:118px; margin-top:0; }
    body.gamma-experience section[data-composition="register"] .dashboard-panel-title { align-items:start; font-size:.75rem; min-height:38px; }
    body.gamma-experience section[data-composition="register"] .dashboard-panel-title svg { display:none; }
    body.gamma-experience section[data-composition="register"] .dashboard-metric { padding-top:6px; gap:10px; }
    body.gamma-experience section[data-composition="register"] .dashboard-metric strong { font-size:1.5rem; }
    body.gamma-experience section[data-composition="register"] .dashboard-metric > span,body.gamma-experience section[data-composition="register"] .dashboard-metric p { font-size:.75rem; margin:0; }
    body.gamma-experience .reveal .experience-sequence { display:flex; flex-direction:column; gap:24px; margin:6px 0 16px; flex:none; }
    .experience-bet { grid-template-columns:30px 1fr; gap:12px; padding:0; }
    .experience-bet-order { font-size:2rem; padding-top:14px; }
    body.gamma-experience .experience-bet h3 { font-size:2rem; padding-top:14px; }
    .experience-bet:not(:last-child)::after { display:none; }
    body.gamma-experience .reveal .experience-roadmap { flex:none; margin:0; }
    .experience-gate { grid-template-columns:44px minmax(0,1fr); gap:12px 18px; padding:20px 0; }
    .gate-quarter { font-size:2rem; align-self:start; }
    .gate-criterion { grid-column:2; }
    body.gamma-experience section[data-composition="chapter"] .experience-cover { gap:24px; }
    body.gamma-experience section[data-composition="chapter"] .experience-cover h1 { font-size:2.75rem; }
    body.gamma-experience section[data-composition="chapter"] .experience-cover-copy > p { margin:16px 0; }
    body.gamma-experience section[data-composition="chapter"] .experience-chapter-note { font-size:.75rem; }
    body.gamma-experience .experience-chapter-map { gap:0; }
    body.gamma-experience .experience-chapter-map > a { padding:18px 0; }
    body.gamma-experience .experience-chapter-map b { font-size:2rem; }
    body.gamma-experience .experience-chapter-map span { font-size:.75rem; margin-top:8px; }
    body.gamma-experience section[data-composition="decisions"] .editorial-closing { gap:12px; }
    body.gamma-experience section[data-composition="decisions"] .closing-message { padding:24px; margin:-28px -24px 0; }
    body.gamma-experience section[data-composition="decisions"] .closing-message h1 { font-size:2rem; }
    body.gamma-experience section[data-composition="decisions"] .closing-message p { font-size:.75rem; margin-top:14px; }
    body.gamma-experience section[data-composition="decisions"] .closing-decision { padding:16px 0; grid-template-columns:20px 1fr; gap:12px; }
    body.gamma-experience section[data-composition="decisions"] .closing-decision strong { font-size:1.25rem; }
    body.gamma-experience section[data-composition="decisions"] .closing-decision small { font-size:.75rem; margin-top:8px; }
  }
`; }
