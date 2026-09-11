import {escapeHtml as e} from '../html.js';
import {getIcon} from './icons.js';

// Declarative educational diagrams. All copy is escaped; no authored SVG executes.
export function renderExplainer(slide){
 const m=slide.visual?.story;if(!m)return null;
 const l=m.labels||[],ic=m.icons||[];
 const text=(x,y,t,cls='ex-label')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${e(t||'')}</text>`;
 const path=(d,cls='ex-line',delay=0)=>`<path d="${d}" class="${cls}" pathLength="1" style="--ex-delay:${delay}s"/>`;
 const icon=(x,y,name,size=72)=>`<g transform="translate(${x-size/2} ${y-size/2})" class="ex-symbol">${getIcon(name||'circle','currentColor',size)}</g>`;
 const node=(x,y,i)=>`<g class="ex-arrive" style="--ex-delay:${i*.65}s">${icon(x,y,ic[i]||['lightbulb','sliders','wallet','shield'][i])}${text(x,y+72,l[i])}</g>`;
 const curve='M100 290 L190 276 L260 296 L345 215 L415 236 L495 147 L575 178 L675 99 L760 130 L850 58';
 let art='';
 switch(m.type){
 case 'recovery':
  art=path('M150 100 L480 310 L810 100','ex-price ex-draw')+text(150,65,l[0],'ex-number')+text(480,390,l[1],'ex-number')+text(810,65,l[2],'ex-number')+text(240,250,'−50 %')+text(730,250,'+100 %');break;
 case 'correlation':
  art=path('M80 350 H900','ex-axis')+[0,1,2].map(i=>`<g transform="translate(0 ${i*30})">${path('M100 240 L230 180 L350 215 L490 105 L620 165 L730 80 L860 115',i===0?'ex-price ex-draw':i===1?'ex-stop ex-draw':'ex-muted-path ex-draw',i*.7)}</g>`).join('')+[0,1,2].map(i=>text(910,125+i*35,l[i])).join('')+text(480,415,'Temps →');break;
 case 'converge':
  art=path('M240 120 L630 225','ex-line ex-draw')+path('M240 330 L630 225','ex-line ex-draw',.7)+icon(180,90,'wallet',80)+icon(180,300,'wallet',80)+icon(730,210,'building',110)+text(180,170,l[0])+text(180,380,l[1])+text(730,330,l[2]);break;
 case 'fork':
  art=path('M110 200 H370 Q420 200 460 140 L570 80 H850','ex-line ex-draw')+path('M370 200 Q420 200 460 260 L570 320 H850','ex-line ex-draw',.5)+icon(105,200,ic[0]||'coins',100)+icon(690,80,ic[1]||'activity',72)+icon(690,320,ic[2]||'check-circle',72)+text(110,290,l[0])+text(690,150,l[1])+text(690,390,l[2])+`<circle r="13" class="ex-token"><animateMotion dur="5s" repeatCount="1" fill="freeze" path="M110 200 H370 Q420 200 460 260 L570 320 H850"/></circle>`;break;
 case 'funnel':
  art=path('M85 55 H870 L620 275 V380 H340 V275 Z','ex-outline')+Array.from({length:24},(_,i)=>`<circle cx="${180+(i%8)*84}" cy="${110+Math.floor(i/8)*55}" r="13" class="${i%5?'ex-reject':'ex-keep'} ex-filter" style="--ex-delay:${1+(i%5)*.35}s"/>`).join('')+text(480,35,l[0])+text(480,340,l[1],'ex-number')+text(480,425,l[2]);break;
 case 'mountain':
  art=path('M80 350 H900','ex-axis')+path(curve,'ex-price ex-draw')+path('M100 335 H280 L345 300 H440 L495 240 H600 L675 185 H780 L850 148','ex-stop ex-draw',1)+text(180,75,l[0])+text(760,220,l[1])+text(480,410,l[2]);break;
 case 'payoff':
  art=path('M80 220 H900','ex-axis')+[-1,-1.5,1,-1,.8,-1,5].map((n,i)=>`<rect x="${110+i*110}" y="${n>0?220-n*32:220}" width="65" height="${Math.abs(n)*32}" class="${n>0?'ex-positive':'ex-negative'} ex-bar" style="--ex-delay:${i*.4}s"/>`).join('')+text(300,350,l[0])+text(800,350,l[1])+text(480,405,l[2]);break;
 case 'balance':
  art=path('M480 105 V300 M235 190 H725 M480 100 L460 130 H500 Z','ex-line ex-draw')+path('M235 190 L145 315 H325 Z M725 190 L635 315 H815 Z','ex-outline')+icon(480,66,ic[0]||'wallet',90)+text(235,365,l[0])+text(725,365,l[1])+text(480,430,l[2])+`<g class="ex-transfer">${icon(235,273,'coins',68)}</g>`;break;
 case 'timeline':
  art=`<rect x="90" y="95" width="430" height="220" class="ex-surface"/><rect x="520" y="95" width="350" height="220" class="ex-future"/>`+path('M90 325 H880','ex-axis')+path('M110 270 L180 240 L230 260 L300 190 L380 205 L450 150','ex-price ex-draw')+path('M530 150 L600 240 L680 110 L750 180 L850 80','ex-muted-path')+path('M520 65 V355','ex-stop')+text(285,390,l[0])+text(705,390,l[1])+text(520,40,l[2]);break;
 case 'survivors':
  art=Array.from({length:12},(_,i)=>{const x=130+(i%6)*140,y=105+Math.floor(i/6)*160;return `<g class="${i%4?'ex-fade':'ex-arrive'}" style="--ex-delay:${1+i*.09}s">${icon(x,y,i%4?'building':'star',65)}</g>`;}).join('')+path('M280 90 Q490 -10 700 90 Q820 255 690 315 Q480 420 270 300 Q160 200 280 90','ex-stop ex-draw',2)+text(245,415,l[0])+text(735,415,l[1]);break;
 case 'network':
  art=[0,1,2,3,4,5].map((i)=>{const x=100+i*152;return path(`M${x} 110 L480 285`,'ex-line ex-draw',i*.22)+icon(x,68,ic[0]||'wallet',55);}).join('')+icon(480,292,ic[1]||'building',115)+text(480,170,l[0])+text(480,418,l[1]);break;
 case 'drawdown':
  art=path('M90 330 H900','ex-axis')+path('M95 270 L210 200 L340 95 L450 130 L560 260 L670 290 L780 175 L880 150','ex-price ex-draw')+path('M340 95 H860','ex-dashed')+path('M670 100 V286 M655 115 L670 100 L685 115 M655 271 L670 286 L685 271','ex-stop ex-draw',1.8)+text(260,65,l[0])+text(765,280,l[1],'ex-number')+text(480,410,l[2]);break;
 case 'distribution':
  art=Array.from({length:7},(_,i)=>path(`M100 330 Q${250+i*40} ${100+i*22} 480 ${180-i*18} T870 ${80+i*40}`,i===3?'ex-price ex-draw':'ex-muted-path ex-draw',i*.18)).join('')+path('M80 355 H900','ex-axis')+text(190,408,l[0])+text(780,408,l[1]);break;
 case 'calendar':
  art=Array.from({length:60},(_,i)=>`<rect x="${105+i%15*51}" y="${80+Math.floor(i/15)*54}" width="35" height="35" rx="2" class="ex-day ex-arrive" style="--ex-delay:${i*.045}s"/>`).join('')+text(490,365,l[0],'ex-number')+text(490,425,l[1]);break;
 case 'orbit':
  art=`<circle cx="480" cy="205" r="147" class="ex-orbit ex-draw" pathLength="1"/>`+[0,1,2].map(i=>{const a=i*Math.PI*2/3-Math.PI/2,x=480+Math.cos(a)*147,y=205+Math.sin(a)*147;return `<circle cx="${x}" cy="${y}" r="45" class="ex-backdrop"/>${icon(x,y,ic[i],54)}${text(x+(i===1?150:i===2?-150:0),y+(i===0?-32:10),l[i])}`;}).join('');break;
 case 'tiles':
  art=[0,1,2].map(i=>`<g class="ex-arrive" style="--ex-delay:${i*.8}s"><path d="M${100+i*275} 100 h220 v180 h-220z" class="ex-outline"/>${icon(210+i*275,170,ic[i],90)}${text(210+i*275,250,l[i])}</g>`).join('')+path('M115 340 H845','ex-line ex-draw',1)+text(480,410,l[3]);break;
 case 'ladder':
  art=path('M100 320 H300 V240 H500 V160 H700 V80 H880','ex-line ex-draw')+[0,1,2].map(i=>`${icon(200+i*230,260-i*80,ic[i],65)}${text(200+i*230,380-i*80,l[i])}`).join('');break;
 default:
  art=path('M170 185 H795','ex-line ex-draw')+[0,1,2].map(i=>`<circle cx="${170+i*310}" cy="185" r="66" class="ex-backdrop"/>${node(170+i*310,185,i)}`).join('');
 }
 // SMIL's clock cannot be paused with the operator menu. Use CSS-only motion.
 art=art.replace(/<circle r="13" class="ex-token">[\s\S]*?<\/circle>/,'');
 return `<article class="explainer" data-explainer="${e(m.type)}"><h2>${e(slide.title)}</h2><figure><svg viewBox="0 0 960 450" role="img" aria-label="${e(slide.visual.alt)}">${art}</svg><figcaption>${e(slide.subtitle||'')}</figcaption></figure><p class="explainer-source">${e(slide.visual.caption||slide.source||'')}</p><nav class="explainer-actions"><button type="button" data-explainer-action="replay">Rejouer l’illustration</button><button type="button" data-explainer-action="pause" aria-pressed="false">Pause de l’illustration</button></nav></article>`;
}
export function explainerCSS(){return `
body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true]{gap:16px;padding:32px 72px 50px}
body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true] .d3-webgpu-heading h2{font:550 48px/1.06 Archivo,sans-serif}
body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true] .d3-webgpu-heading p{font-size:24px}
body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true] .d3-webgpu-insight{font-size:36px;line-height:1.2}
body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true] .d3-webgpu-caption>div{max-width:100%}
@media(max-width:900px){body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true]{padding:32px 24px 24px}body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true] .d3-webgpu-heading h2{font-size:36px}body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true] .d3-webgpu-heading p{font-size:16px}body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-readable=true] .d3-webgpu-insight{font-size:24px}}
body.gamma-experience .reveal .slides .video-chart{height:100%;display:flex;flex-direction:column;text-align:left}
body.gamma-experience .reveal .slides .video-chart h2{font:550 64px/1.06 Archivo,sans-serif;margin:0;color:var(--gamma-text)}
body.gamma-experience .reveal .slides .video-chart-context{font:450 24px/1.3 Archivo,sans-serif;color:var(--gamma-muted);margin:16px 0}
.video-chart-with-candle{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:24px}.video-candle{margin:0;min-width:0;display:flex;flex-direction:column;justify-content:center}.video-candle svg{width:100%;height:auto;max-height:360px}.video-candle rect{fill:var(--gamma-primary)}.video-candle-lines{stroke:var(--gamma-muted);stroke-width:2;fill:none}.video-candle text{stroke:none;fill:var(--gamma-text);font:550 40px Archivo,sans-serif}.video-candle figcaption{font:450 24px Archivo,sans-serif;color:var(--gamma-muted);text-align:center}
@media(max-width:900px){.video-chart-with-candle{display:flex;flex-direction:column;height:auto!important}.video-chart-with-candle .chart-container{height:300px!important}.video-candle svg{height:260px}.video-candle figcaption{font-size:16px}}
.video-chart-plot{flex:1;min-height:300px}.video-chart-plot .chart-container{height:100%}
body.gamma-experience .reveal .slides .video-chart-insight{font:450 40px/1.2 Archivo,sans-serif;color:var(--gamma-text);margin:12px 0}
.video-chart-source{font:450 12px/1.4 Archivo,sans-serif;color:var(--gamma-muted);margin:0}
body.gamma-experience section.variant-video-hero .studio-visual{height:100%;grid-template-columns:1fr 1.2fr;gap:40px}
body.gamma-experience section.variant-video-hero .studio-visual h2{font-size:64px!important;line-height:1.05!important}body.gamma-experience section.variant-video-hero .studio-visual-copy>p{font-size:30px;line-height:1.3}
@media(max-width:900px){body.gamma-experience .reveal .slides .video-chart{height:auto;min-height:580px}body.gamma-experience .reveal .slides .video-chart h2{font-size:36px}body.gamma-experience .reveal .slides .video-chart-context{font-size:16px}body.gamma-experience .reveal .slides .video-chart-insight{font-size:24px}.video-chart-plot{height:340px;flex:none}body.gamma-experience section.variant-video-hero .studio-visual{grid-template-columns:1fr;height:auto}body.gamma-experience section.variant-video-hero .studio-visual h2{font-size:36px!important}body.gamma-experience section.variant-video-hero .studio-visual-copy>p{font-size:24px}}
body.gamma-experience .reveal .slides .explainer{height:100%;min-height:560px;display:flex;flex-direction:column;text-align:left;color:var(--gamma-text)}
body.gamma-experience .reveal .slides .explainer h2{font:550 64px/1.06 Archivo,sans-serif;letter-spacing:-.035em;max-width:1120px;margin:0}
.explainer figure{flex:1;min-height:0;margin:24px 0 0;display:flex;flex-direction:column;justify-content:center}
.explainer svg{width:100%;height:400px;overflow:visible}.explainer svg .ex-symbol svg{width:auto;height:auto;overflow:visible}
.explainer figcaption{font:450 40px/1.2 Archivo,sans-serif;color:var(--gamma-text);margin:12px 0;text-align:center}
.explainer-source{font:450 12px/1.4 Archivo,sans-serif;color:var(--gamma-muted);margin:12px 0 0}
.explainer-actions{display:flex;gap:16px}.explainer-actions button{min-height:44px;background:var(--gamma-bg);color:var(--gamma-text);border:1px solid var(--gamma-muted);font:500 14px Archivo,sans-serif;padding:8px 16px}
.ex-label{font:550 36px Archivo,sans-serif;fill:var(--gamma-text)}.ex-number{font:550 64px Archivo,sans-serif;fill:var(--gamma-primary)}.ex-symbol{color:var(--gamma-primary)}
.ex-line,.ex-price,.ex-stop,.ex-outline,.ex-axis,.ex-dashed,.ex-muted-path,.ex-orbit{fill:none;stroke:var(--gamma-primary);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.ex-axis{stroke:var(--gamma-muted);stroke-width:2}.ex-outline{stroke:var(--gamma-muted);stroke-width:3}.ex-stop{stroke:var(--gamma-secondary);stroke-dasharray:10 8;stroke-width:4}.ex-price{stroke-width:7}.ex-dashed{stroke:var(--gamma-muted);stroke-dasharray:9 9;stroke-width:2}.ex-muted-path{stroke:var(--gamma-muted);opacity:.45;stroke-width:3}
.ex-surface{fill:var(--gamma-primary);opacity:.1}.ex-future{fill:var(--gamma-muted);opacity:.12}.ex-backdrop{fill:var(--gamma-bg)}.ex-orbit{stroke:var(--gamma-secondary);stroke-width:4;stroke-dasharray:8 10}.ex-positive,.ex-keep,.ex-day{fill:var(--gamma-primary)}.ex-negative,.ex-reject{fill:var(--gamma-secondary)}.ex-reject,.ex-fade{opacity:.12}
@keyframes exDraw{from{stroke-dasharray:1;stroke-dashoffset:1}to{stroke-dasharray:1;stroke-dashoffset:0}}
@keyframes exArrive{from{opacity:.2;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes exFilter{from{opacity:1}to{opacity:.12}}@keyframes exTransfer{0%,15%{transform:translateX(0)}85%,100%{transform:translateX(490px)}}
@keyframes exBar{from{transform:scaleY(.08)}to{transform:scaleY(1)}}
section.present .explainer-run .ex-draw{animation:exDraw 3s cubic-bezier(.22,1,.36,1) var(--ex-delay,0s) both}
section.present .explainer-run .ex-arrive{animation:exArrive .9s cubic-bezier(.22,1,.36,1) var(--ex-delay,0s) both}
section.present .explainer-run .ex-reject,section.present .explainer-run .ex-fade{animation:exFilter 1.5s ease var(--ex-delay,1s) both}
section.present .explainer-run .ex-transfer{animation:exTransfer 5s cubic-bezier(.22,1,.36,1) both}
section.present .explainer-run .ex-bar{transform-box:fill-box;transform-origin:50% 100%;animation:exBar 1s ease var(--ex-delay,0s) both}
.explainer[data-paused=true] *{animation-play-state:paused!important}
@media(max-width:900px){body.gamma-experience .reveal .slides .explainer{min-height:520px;height:auto}body.gamma-experience .reveal .slides .explainer h2{font-size:36px}.explainer figure{margin-top:24px}.explainer svg{height:auto;min-height:200px}.explainer figcaption{font-size:24px;margin-top:24px}.explainer-source{font-size:12px;margin-top:32px}}
body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-compare=true]{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);grid-template-rows:auto minmax(0,1fr) auto;gap:16px 32px}
.d3-webgpu-stage[data-video-compare=true] .d3-webgpu-heading,.d3-webgpu-stage[data-video-compare=true] .d3-webgpu-caption{grid-column:1/-1}
.d3-webgpu-stage[data-video-compare=true] .d3-webgpu-plot{min-height:320px}
.d3-video-summary{display:flex;flex-direction:column;justify-content:center;min-width:0;color:var(--gamma-text)}
.reveal .slides .d3-video-summary>p{font:550 32px/1.2 Archivo,sans-serif;margin:0 0 16px}
.d3-video-summary>div{padding:12px 0;border-top:1px solid var(--gamma-muted);display:flex;flex-direction:column;gap:8px}
.d3-video-summary strong{font:550 32px/1.2 Archivo,sans-serif}
.d3-video-summary span{font:550 32px/1.2 Archivo,sans-serif;color:var(--gamma-primary);font-variant-numeric:tabular-nums}
.d3-video-summary i{font-style:normal;color:var(--gamma-muted)}
.d3-webgpu-stage[data-video-compare=true] .d3-depth-instruction,.d3-webgpu-stage[data-video-compare=true] .d3-webgpu-heading>p{display:none}
.d3-webgpu-stage[data-video-compare=true] .d3-depth-selection{display:none!important}
@media(max-width:900px){body.gamma-experience .reveal .slides .d3-webgpu-stage[data-video-compare=true]{display:flex}.d3-webgpu-stage[data-video-compare=true] .d3-webgpu-plot{min-height:340px}.d3-video-summary strong{font-size:24px}.d3-video-summary span{font-size:24px}.d3-video-summary>p{font-size:16px}}
@media(prefers-reduced-motion:reduce){.explainer *{animation:none!important}}
html.gamma-export .explainer *{animation:none!important}
`;}
export function explainerJS(){return `function initExplainers(){const roots=[...document.querySelectorAll('.explainer')];const play=root=>{root.classList.remove('explainer-run');void root.offsetWidth;root.dataset.paused='false';root.querySelector('[data-explainer-action=pause]').setAttribute('aria-pressed','false');root.classList.add('explainer-run');};const sync=()=>roots.forEach(r=>{if(Reveal.getCurrentSlide()?.contains(r))play(r);else r.classList.remove('explainer-run');});roots.forEach(r=>r.addEventListener('click',e=>{const a=e.target.closest('[data-explainer-action]');if(!a)return;if(a.dataset.explainerAction==='replay')play(r);else{r.dataset.paused=String(r.dataset.paused!=='true');a.setAttribute('aria-pressed',r.dataset.paused);}}));Reveal.on('slidechanged',sync);sync();}`;}
