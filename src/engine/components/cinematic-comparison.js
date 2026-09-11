import { escapeHtml } from '../html.js';
import { formatSpatialValue } from './immersive-data.js';

export function cinematicModel(chart) {
  const labels=chart?.data?.labels, sets=chart?.data?.datasets;
  if(!['','currency_m','currency_k','number','integer'].includes(chart?.options?.format_y||''))return null;
  if(chart?.type!=='bar'||!labels?.length||labels.length>5||sets?.length!==2||chart.options?.stacked||chart.options?.horizontal)return null;
  if(sets.some(s=>s.y_axis==='right'||s.values?.length!==labels.length||s.values.some(v=>!Number.isFinite(v)||v<0)))return null;
  const totals=sets.map(s=>s.values.reduce((sum,v)=>sum+v,0));
  if(totals.some(v=>!Number.isFinite(v)||v<=0))return null;
  const changes=labels.map((_,i)=>sets[1].values[i]-sets[0].values[i]);
  const direction=Math.sign(totals[1]-totals[0]);
  const winner=changes.reduce((best,value,i)=>(direction?value*direction:Math.abs(value))>(direction?changes[best]*direction:Math.abs(changes[best]))?i:best,0);
  if(!Number.isFinite((totals[1]/totals[0]-1)*100))return null;
  return { labels, series:sets.map((s,i)=>s.label||String(i+1)), values:sets.map(s=>s.values), totals, changes, winner, format:chart.options?.format_y||'', growth:(totals[1]/totals[0]-1)*100 };
}

export function cinematicHTML(slide, chart, model, language='en') {
  const fr=language.startsWith('fr'), fmt=v=>escapeHtml(formatSpatialValue(v,model.format));
  const json=JSON.stringify(model).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
  const increase=model.growth>=0, growth=(increase?'+':'')+model.growth.toFixed(1)+'%';
  const sumChange=model.totals[1]-model.totals[0];
  return `<div class="cinema-stage" data-cinema-mode="total" data-cinema-renderer="svg" data-cinema-chart="${chart.id}">
    <script type="application/json" class="cinema-model">${json}</script>
    <div class="cinema-canvas" aria-hidden="true"></div>
    <header class="cinema-heading"><h2>${escapeHtml(slide.title||'')}</h2><p>${escapeHtml(slide.subtitle||'')}</p></header>
    <div class="cinema-amount cinema-before"><span>${escapeHtml(model.series[0])}</span><strong>${fmt(model.totals[0])}</strong></div>
    <div class="cinema-amount cinema-after"><span>${escapeHtml(model.series[1])}</span><strong>${fmt(model.totals[1])}</strong><b>${growth}</b></div>
    <aside class="cinema-feature"><b></b><strong></strong><p></p></aside>
    <svg class="cinema-leaders" aria-hidden="true"></svg>
    <div class="cinema-segment-labels" aria-hidden="true"></div>
    <div class="cinema-fallback">${chart.html.replace('min-height: 280px','height: 100%; min-height: 0')}</div>
    <aside class="cinema-takeaway"><b>${escapeHtml(model.labels[model.winner])}</b><p>Largest contribution to the change<br><strong>${model.changes[model.winner]>=0?'+':''}${fmt(model.changes[model.winner])}</strong> of ${sumChange>=0?'+':''}${fmt(sumChange)}</p></aside>
    <nav class="cinema-actions" aria-label="Explore the presentation"><button type="button" data-cinema-action="split">What changed? <span aria-hidden="true">↗</span></button><button type="button" data-cinema-action="values">The numbers</button></nav>
    <button type="button" class="cinema-tools" data-cinema-action="tools">${fr?'Outils':'Tools'}</button>
    <dialog class="cinema-data"><button type="button" data-cinema-action="close">Close</button><table><caption>Source data</caption><thead><tr><th scope="col">Segment</th>${model.series.map(name=>`<th scope="col">${escapeHtml(name)}</th>`).join('')}<th scope="col">Change</th></tr></thead><tbody>${model.labels.map((name,i)=>`<tr><th scope="row">${escapeHtml(name)}</th><td>${fmt(model.values[0][i])}</td><td>${fmt(model.values[1][i])}</td><td>${model.changes[i]>=0?'+':''}${fmt(model.changes[i])}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th>${model.totals.map(v=>`<td>${fmt(v)}</td>`).join('')}<td>${sumChange>=0?'+':''}${fmt(sumChange)}</td></tr></tfoot></table></dialog>
  </div>`;
}

export function cinematicCSS(){return `
  .reveal .slides section.variant-cinematic:has(.cinema-stage) { padding:0!important; }
  .reveal .slides section.variant-cinematic:has(.cinema-stage) > .theme-stage { display:none; }
  .reveal .slides section.variant-cinematic:has(.cinema-stage) > .cinema-stage { position:absolute!important; inset:0!important; width:100%; height:100%; z-index:1; }
  .cinema-stage { overflow:hidden; color:var(--gamma-text); text-align:left; --cinema-display:clamp(48px,7vw,92px); }
  .cinema-canvas { position:absolute; inset:0; }
  .cinema-canvas canvas { display:block; width:100%; height:100%; }
  .cinema-heading { position:absolute; left:64px; top:56px; width:490px; z-index:2; pointer-events:none; }
  .reveal .cinema-heading h2 { color:var(--gamma-text); font:500 58px/.98 'Source Serif 4',Georgia,serif; letter-spacing:-.035em; text-transform:none; margin:0; text-wrap:balance; }
  .reveal .cinema-heading p { font:450 15px/1.5 Archivo,system-ui,sans-serif; color:var(--gamma-muted); max-width:370px; margin:18px 0 0; }
  .cinema-amount { position:absolute; z-index:2; pointer-events:none; transform:translate(-50%,-100%); text-align:center; white-space:nowrap; }
  .cinema-amount span { display:block; color:var(--gamma-muted); font:550 14px/1.2 Archivo,system-ui,sans-serif; margin-bottom:5px; }
  .cinema-amount strong { display:block; font:500 var(--cinema-display)/1 Archivo,system-ui,sans-serif; letter-spacing:-.04em; color:var(--gamma-text); font-variant-numeric:tabular-nums; }
  .cinema-before strong { font:450 56px/1 Archivo,system-ui,sans-serif; }
  .cinema-amount b { display:block; margin-top:8px; font:550 22px/1.2 Archivo,system-ui,sans-serif; color:var(--gamma-primary); }
  .cinema-takeaway { position:absolute; left:64px; bottom:78px; width:340px; z-index:2; }
  .cinema-takeaway > b { color:var(--gamma-primary); font:600 23px/1.1 Archivo,system-ui,sans-serif; }
  .reveal .cinema-takeaway p { color:var(--gamma-muted); font:450 14px/1.5 Archivo,system-ui,sans-serif; margin-top:8px; }
  .cinema-takeaway strong { color:var(--gamma-text); font-weight:650; }
  .cinema-actions { position:absolute; right:64px; bottom:84px; display:flex; align-items:center; gap:20px; z-index:3; }
  .cinema-stage button { cursor:pointer; min-height:44px; border:0; background:none; color:var(--gamma-text); font:550 14px/1.2 Archivo,system-ui,sans-serif; padding:8px 0; }
  .cinema-actions button:first-child { border-bottom:1px solid var(--gamma-primary); }
  .cinema-actions button:first-child span { padding-left:20px; color:var(--gamma-primary); }
  .cinema-actions button:nth-child(2) { color:var(--gamma-muted); }
  .cinema-tools { position:absolute; top:14px; right:24px; z-index:5; }
  .cinema-stage button:focus-visible { outline:2px solid var(--gamma-primary); outline-offset:6px; }
  .cinema-stage button:disabled { opacity:.5; cursor:default; }
  .cinema-feature { position:absolute; left:64px; top:300px; z-index:3; width:290px; }
  .cinema-feature > b { display:block; font:550 24px/1.2 Archivo,sans-serif; color:var(--gamma-primary); }
  .cinema-feature > strong { display:block; font:500 70px/1.2 Archivo,sans-serif; letter-spacing:-.04em; margin-top:12px; }
  .reveal .cinema-feature p { font:450 15px/1.4 Archivo,sans-serif; color:var(--gamma-muted); }
  .cinema-stage[data-cinema-mode="total"] .cinema-feature,.cinema-stage[data-cinema-mode="total"] .cinema-leaders { visibility:hidden; }
  .cinema-leaders { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; overflow:visible; }
  .cinema-leaders path { fill:none; stroke:var(--gamma-muted); stroke-width:.6; opacity:.55; }
  .cinema-segment-labels { position:absolute; inset:0; z-index:2; pointer-events:none; }
  .cinema-segment-labels > div { position:absolute; transform:translate(-50%,0); text-align:left; width:155px; }
  .cinema-segment-labels b { display:block; font:600 16px/1.15 Archivo,system-ui,sans-serif; color:var(--gamma-text); }
  .cinema-segment-labels span { display:block; margin-top:7px; font:450 13px/1.3 Archivo,system-ui,sans-serif; color:var(--gamma-muted); }
  .cinema-segment-labels strong { display:block; margin-top:7px; font:550 16px/1.1 Archivo,system-ui,sans-serif; color:var(--gamma-primary); }
  .cinema-stage[data-cinema-mode="total"] .cinema-segment-labels,.cinema-stage[data-cinema-mode="split"] .cinema-amount { visibility:hidden; }
  .cinema-stage[data-cinema-mode="split"] .cinema-takeaway { display:none; }
  .cinema-segment-labels > div:not([data-winner="true"]) strong { color:var(--gamma-muted); }
  .cinema-segment-labels > div[data-winner="true"] b { color:var(--gamma-primary); }
  .cinema-stage[data-cinema-mode="split"] .cinema-heading { width:650px; }
  .cinema-stage[data-cinema-mode="split"] .cinema-heading h2 { font:500 46px/1 'Source Serif 4',Georgia,serif; }
  .cinema-stage[data-cinema-mode="split"] .cinema-heading p { max-width:600px; }
  .cinema-fallback { position:absolute; inset:210px 64px 180px; }
  .cinema-fallback .chart-container { height:100%; }
  .cinema-stage[data-cinema-renderer="webgl"] .cinema-fallback { display:none; }
  .cinema-stage[data-cinema-renderer="svg"] :is(.cinema-amount,.cinema-canvas,.cinema-segment-labels,.cinema-leaders,.cinema-feature) { display:none; }
  .cinema-data { border:1px solid var(--gamma-muted); background:var(--gamma-bg); color:var(--gamma-text); max-width:90vw; max-height:80vh; padding:24px; font:450 16px/1.5 Archivo,system-ui,sans-serif; }
  .cinema-data::backdrop { background:color-mix(in srgb,var(--gamma-bg) 85%,transparent); }
  .cinema-data > button { float:right; margin-bottom:12px; }
  .cinema-data table { clear:both; border-collapse:collapse; width:100%; font-variant-numeric:tabular-nums; }
  .cinema-data caption { text-align:left; padding-bottom:16px; }
  .cinema-data th,.cinema-data td { padding:12px; border-bottom:1px solid color-mix(in srgb,var(--gamma-muted) 25%,transparent); text-align:right; }
  .cinema-data th:first-child { text-align:left; }
  body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) {
    background:
      radial-gradient(circle at 78% 28%, rgba(255,176,0,.12), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,.025), transparent 52%),
      var(--gamma-bg) !important;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .editorial-cover {
    grid-template-columns:minmax(220px,3fr) minmax(0,8fr);
    column-gap:72px;
    min-height:560px;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-index {
    background:linear-gradient(180deg, var(--gamma-primary), color-mix(in srgb,var(--gamma-primary) 68%, #111 32%));
    box-shadow:18px 0 70px rgba(255,176,0,.08);
  }
  body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-content h1 {
    max-width:820px;
    font:500 clamp(4.3rem,7.2vw,7.5rem)/.9 'Source Serif 4',Georgia,serif;
    letter-spacing:-.055em;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-content h3 {
    max-width:520px;
    font-size:1.16em !important;
    line-height:1.45 !important;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-strip {
    gap:30px;
    padding-top:20px;
    font-size:.72em;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) {
    background:
      radial-gradient(circle at 18% 20%, rgba(255,176,0,.1), transparent 27%),
      var(--gamma-bg) !important;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .editorial-closing {
    grid-template-columns:minmax(0,6fr) minmax(360px,5fr);
    gap:90px;
    min-height:560px;
    align-items:center;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-message h1 {
    max-width:760px;
    font:500 clamp(3.6rem,5.8vw,6.2rem)/.92 'Source Serif 4',Georgia,serif;
    letter-spacing:-.05em;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-message p {
    max-width:520px;
    margin-top:26px;
    font-size:1.1em;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-decisions {
    border-top:1px solid color-mix(in srgb, var(--gamma-muted) 50%, transparent);
    background:rgba(255,255,255,.025);
    padding:0 26px;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-decision {
    grid-template-columns:46px 1fr;
    gap:22px;
    padding:24px 0;
  }
  body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-decision strong {
    font-size:1.15em;
  }
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-title:not(.variant-cinematic) .cover-content h1,
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-message h1 {
    color:var(--gamma-text)!important;
    -webkit-text-fill-color:var(--gamma-text)!important;
  }
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-title:not(.variant-cinematic) .cover-content h3,
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-message p {
    color:color-mix(in srgb, var(--gamma-text) 68%, transparent)!important;
  }
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-title:not(.variant-cinematic) .title-meta,
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-title:not(.variant-cinematic) .cover-strip {
    color:color-mix(in srgb, var(--gamma-text) 72%, transparent)!important;
  }
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-title:not(.variant-cinematic) .cover-strip strong,
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-decision strong {
    color:var(--gamma-text)!important;
  }
  body.gamma-cinema-deck[data-presentation-theme="analyst-proof"] .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-decision small {
    color:color-mix(in srgb, var(--gamma-text) 66%, transparent)!important;
  }
  body.gamma-cinema-active:not(.cinema-tools-visible) .gamma-studio-toolbar,body.gamma-cinema-active:not(.cinema-tools-visible) .gamma-theme-switcher,body.gamma-cinema-active .gamma-progress-hud,body.gamma-cinema-active .footer-bar,body.gamma-cinema-active .watermark { visibility:hidden; }
  body.gamma-cinema-deck:not(.cinema-tools-visible) .gamma-studio-toolbar,body.gamma-cinema-deck:not(.cinema-tools-visible) .gamma-theme-switcher { visibility:hidden; }
  body.gamma-cinema-active .reveal .slides section.variant-cinematic:has(.cinema-stage) > .slide-source { bottom:22px; left:64px; right:64px; font:450 10px/1.4 Archivo,system-ui,sans-serif; z-index:3; }
  @media (max-width:900px) {
    body.gamma-cinema-deck .reveal .slides { transform:none!important; zoom:1!important; inset:0!important; width:100%!important; height:100%!important; }
    body.gamma-cinema-deck .reveal .slides section:not(.variant-cinematic) { inset:0!important; width:100%!important; height:100%!important; padding:32px 24px 76px!important; }
    body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .editorial-cover { grid-template-columns:1fr; min-height:100%; height:100%; justify-content:center; text-align:left; }
    body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-content { width:100%; max-width:none; }
    body.gamma-cinema-deck .reveal .slides section:not(.variant-cinematic) { --cinema-mobile-cover-size:clamp(2.625rem,12vw,3.625rem); --cinema-mobile-close-size:clamp(2.25rem,10vw,3.25rem); }
    body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-content h1 { font-size:var(--cinema-mobile-cover-size)!important; line-height:.98; max-width:100%; }
    body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-content h3 { font-size:1rem!important; line-height:1.35; max-width:330px; }
    body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-strip { display:flex; flex-wrap:wrap; gap:12px 18px; margin-top:28px; font-size:12px; }
    body.gamma-cinema-deck .reveal .slides section.layout-title:not(.variant-cinematic) .cover-index { display:none; }
    body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .editorial-closing { height:100%; display:flex; flex-direction:column; justify-content:center; gap:28px; }
    body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-message h1 { font-size:var(--cinema-mobile-close-size)!important; line-height:1.02; }
    body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-message p { font-size:1rem; line-height:1.4; }
    body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-decisions { width:100%; }
    body.gamma-cinema-deck .reveal .slides section.layout-closing:not(.variant-cinematic) .closing-decision { padding:16px 0; }
    body.gamma-cinema-deck .footer-bar,body.gamma-cinema-deck .watermark,body.gamma-cinema-deck .gamma-progress-hud { visibility:hidden; }
    body.gamma-cinema-deck .reveal .slide-number { visibility:hidden; }
    body.gamma-cinema-deck .reveal .slides section:not(.variant-cinematic) > .slide-source { left:24px; right:24px; bottom:42px; display:flex; flex-direction:column; gap:4px; font-size:10px; line-height:1.25; }
    body.gamma-cinema-active .reveal .slides { transform:none!important; zoom:1!important; inset:0!important; width:100%!important; height:100%!important; }
    body.gamma-cinema-active .reveal .slides section.variant-cinematic:has(.cinema-stage) { inset:0!important; width:100%!important; height:100%!important; }
    .cinema-heading { left:24px; top:24px; width:calc(100% - 48px); }
    .reveal .cinema-heading h2 { font:500 46px/1 'Source Serif 4',Georgia,serif; max-width:360px; }
    .reveal .cinema-heading p { font:450 13px/1.4 Archivo,system-ui,sans-serif; margin-top:12px; }
    .cinema-amount strong { font:500 52px/1 Archivo,system-ui,sans-serif; }
    .cinema-before strong { font:450 38px/1 Archivo,system-ui,sans-serif; }
    .cinema-amount b { font:550 18px/1.1 Archivo,system-ui,sans-serif; }
    .cinema-takeaway { left:24px; bottom:132px; width:calc(100% - 48px); }
    .cinema-takeaway > b { font:600 21px/1.2 Archivo,system-ui,sans-serif; }
    .cinema-actions { left:24px; right:24px; bottom:70px; justify-content:space-between; gap:12px; }
    body.gamma-experience .cinema-takeaway { bottom:70px; }
    body.gamma-cinema-active .reveal .slides section.variant-cinematic:has(.cinema-stage) > .slide-source { position:absolute!important; top:auto!important; left:24px; right:24px; bottom:12px; flex-direction:column; gap:3px; font:450 10px/1.25 Archivo,system-ui,sans-serif; }
    .cinema-stage[data-cinema-mode="split"] .cinema-heading { width:calc(100% - 48px); }
    .cinema-stage[data-cinema-mode="split"] .cinema-heading h2 { font:500 34px/1.1 'Source Serif 4',Georgia,serif; }
    .cinema-feature { left:24px; top:152px; width:calc(100% - 48px); }
    .cinema-feature > b { font:550 18px/1.2 Archivo,sans-serif; }
    .cinema-feature > strong { font:500 46px/1.1 Archivo,sans-serif; margin-top:3px; }
    .reveal .cinema-feature p { position:absolute; left:165px; top:25px; width:170px; font:450 12px/1.4 Archivo,sans-serif; }
    .cinema-stage[data-cinema-mode="split"] .cinema-heading p { display:none; }
    .cinema-segment-labels > div { width:105px; }
    .cinema-segment-labels b { font:600 13px/1.2 Archivo,system-ui,sans-serif; }
    .cinema-segment-labels span { font:450 11px/1.3 Archivo,system-ui,sans-serif; }
    .cinema-segment-labels strong { font:550 16px/1.2 Archivo,system-ui,sans-serif; }
    .cinema-stage[data-cinema-mode="split"] .cinema-takeaway { display:none; }
    .cinema-fallback { inset:220px 24px 245px; }
  }
  @media print { .cinema-canvas,.cinema-amount,.cinema-actions,.cinema-tools,.cinema-segment-labels,.cinema-feature,.cinema-leaders { display:none!important; } .cinema-fallback { display:block!important; } }
`;}
