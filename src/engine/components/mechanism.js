import {escapeHtml as e} from '../html.js';
import {getIcon} from './icons.js';

/** A causal mechanism, with readable HTML labels at every output size. */
export function renderMechanism(slide) {
  const m=slide.visual.mechanism;
  const rows=m.steps.map((s,i)=>{
    const share=m.type==='allocation'&&/^\d+(?:[.,]\d+)?\s*%$/.test(s.value||'')?Math.min(100,Math.max(0,parseFloat(s.value.replace(',','.'))))/100:null;
    return `<li class="mechanism-step" data-tone="${e(s.tone||'normal')}" data-long-value="${(s.value||'').length>9}" style="--step:${i}"><span class="mechanism-index" aria-hidden="true">${s.icon?getIcon(s.icon,'currentColor',32):String(i+1).padStart(2,'0')}</span><div class="mechanism-label"><strong>${e(s.label)}</strong>${s.detail?`<span>${e(s.detail)}</span>`:''}</div>${s.value?`<b class="mechanism-value">${e(s.value)}</b>`:''}${share===null?'':`<span class="mechanism-share" aria-hidden="true" style="--share:${share}"></span>`}</li>`;
  }).join('');
  return `<article class="mechanism" data-mechanism="${e(m.type)}"><header><h2>${e(slide.title)}</h2>${m.status?`<p class="mechanism-status">${e(m.status)}</p>`:''}</header><figure aria-label="${e(slide.visual.alt)}"><ol>${rows}</ol><figcaption>${e(slide.subtitle||'')}</figcaption></figure><p class="mechanism-source">${e(slide.source||'')}</p><nav class="explainer-actions"><button type="button" data-mechanism-action="replay">Rejouer</button><button type="button" data-mechanism-action="pause" aria-pressed="false">Pause</button></nav></article>`;
}
export function mechanismCSS(){return `
body.gamma-experience .reveal .slides .mechanism{height:100%;display:flex;flex-direction:column;text-align:left;color:var(--gamma-text)}
.mechanism-status{font:550 16px/1.4 Azeret Mono,monospace;color:var(--gamma-primary);margin:12px 0 0}
body.gamma-experience .reveal .slides .mechanism h2{font:550 48px/1.06 Archivo,sans-serif;letter-spacing:-.03em;margin:0;max-width:1120px;color:var(--gamma-text)}
.mechanism figure{display:flex;flex-direction:column;justify-content:center;flex:1;margin:16px 0 0;min-height:min-content}
.mechanism ol{display:flex;flex-direction:column;list-style:none;padding:0;margin:0;width:100%}
.mechanism-step{display:flex;align-items:center;gap:24px;border-top:1px solid var(--gamma-muted);padding:8px 0;min-width:0}
.mechanism-index{font:550 24px/1.2 Azeret Mono,monospace;color:var(--gamma-primary);width:40px;flex:none;display:flex;justify-content:center}
.mechanism-index svg{width:32px;height:32px}
.mechanism-label{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.mechanism-label strong{font:550 32px/1.15 Archivo,sans-serif;color:var(--gamma-text)}
.mechanism-label>span{font:450 24px/1.2 Archivo,sans-serif;color:var(--gamma-muted)}
.mechanism-value{font:550 48px/1 Archivo,sans-serif;color:var(--gamma-primary);text-align:right;max-width:52%;overflow-wrap:normal;word-break:normal}
.mechanism-step[data-tone=reject] .mechanism-value{color:var(--gamma-secondary)}
.mechanism figcaption{font:450 30px/1.2 Archivo,sans-serif;margin:16px 0 0;color:var(--gamma-text)}
.mechanism-source{flex:none;font:450 12px/1.4 Archivo,sans-serif;color:var(--gamma-muted);margin:16px 0 0}
.mechanism[data-mechanism=flow] ol{flex-direction:row;gap:32px;align-items:stretch}
.mechanism[data-mechanism=flow] .mechanism-step{position:relative;flex:1;align-items:flex-start;flex-direction:column;border-top:4px solid var(--gamma-primary);gap:24px;padding-top:24px}
.mechanism[data-mechanism=flow] .mechanism-step:not(:last-child)::after{content:'→';position:absolute;right:-32px;top:12px;font:450 32px Archivo,sans-serif;color:var(--gamma-primary)}
.mechanism[data-mechanism=flow] .mechanism-value{max-width:100%;text-align:left;font-size:40px}
.mechanism[data-mechanism=formula] .mechanism-value{font-size:64px}
.mechanism[data-mechanism=allocation] .mechanism-step{position:relative;padding-bottom:12px}
.mechanism-share{position:absolute;left:0;bottom:0;height:4px;width:100%;background:var(--gamma-primary);transform:scaleX(var(--share));transform-origin:left}
.mechanism-step:nth-child(even) .mechanism-share{background:var(--gamma-secondary)}
section.present .mechanism-run .mechanism-step{animation:mechanismArrive .8s ease calc(var(--step)*.25s) both}
@keyframes mechanismArrive{from{opacity:.2;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.mechanism[data-paused=true] *{animation-play-state:paused!important}
@media(max-width:900px){body.gamma-experience .reveal .slides .mechanism{height:auto;min-height:580px}body.gamma-experience .reveal .slides .mechanism h2{font-size:36px}.mechanism-status{font-size:12px;margin-bottom:12px}.mechanism figure{margin-top:24px}.mechanism-step{gap:12px;padding:16px 0}.mechanism-index{width:24px;font-size:16px}.mechanism-index svg{width:24px;height:24px}.mechanism-label strong{font-size:24px}.mechanism-label>span{font-size:16px}.mechanism-value,.mechanism[data-mechanism=formula] .mechanism-value{font-size:32px;max-width:45%}.mechanism figcaption{font-size:24px}.mechanism[data-mechanism=flow] ol{flex-direction:column;gap:0}.mechanism[data-mechanism=flow] .mechanism-step{flex-direction:row;align-items:center;gap:12px;border-top-width:1px;padding-top:16px}.mechanism[data-mechanism=flow] .mechanism-value{font-size:24px;max-width:40%;text-align:right}.mechanism[data-mechanism=flow] .mechanism-step::after{display:none}}
@media(max-width:900px){.mechanism .mechanism-step[data-long-value=true]{display:grid;grid-template-columns:24px minmax(0,1fr)}.mechanism .mechanism-step[data-long-value=true] .mechanism-value{grid-column:2;max-width:none;text-align:left}.mechanism .mechanism-value{flex-shrink:0}.mechanism-status{margin-top:12px}.mechanism[data-mechanism=allocation] .mechanism-step{padding-bottom:20px}}
@media(prefers-reduced-motion:reduce){.mechanism *{animation:none!important}}html.gamma-export .mechanism *{animation:none!important}
`;}
export function mechanismJS(){return `function initMechanisms(){const roots=[...document.querySelectorAll('.mechanism')];const play=r=>{r.classList.remove('mechanism-run');void r.offsetWidth;r.dataset.paused='false';r.querySelector('[data-mechanism-action=pause]').setAttribute('aria-pressed','false');r.classList.add('mechanism-run');};const sync=()=>roots.forEach(r=>Reveal.getCurrentSlide()?.contains(r)?play(r):r.classList.remove('mechanism-run'));roots.forEach(r=>r.addEventListener('click',e=>{const a=e.target.closest('[data-mechanism-action]');if(!a)return;if(a.dataset.mechanismAction==='replay')play(r);else{r.dataset.paused=String(r.dataset.paused!=='true');a.setAttribute('aria-pressed',r.dataset.paused);}}));Reveal.on('slidechanged',sync);sync();}`;}
