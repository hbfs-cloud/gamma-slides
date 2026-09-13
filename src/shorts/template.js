import {readFileSync} from 'node:fs';
import {extname} from 'node:path';
import {signalRoom as t} from '../themes/signal-room.js';
import {DURATION} from './cards.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function image(path){const ext=extname(path).toLowerCase();return `data:image/${ext==='.svg'?'svg+xml':ext==='.jpg'||ext==='.jpeg'?'jpeg':ext==='.webp'?'webp':'png'};base64,${readFileSync(path).toString('base64')}`;}
export function renderShort(card, asset, {week,font}={}) {
 const row=(label,value,color='')=>`<div class="row ${color}"><span>${esc(label)}</span><p>${esc(value)}</p></div>`;
 const refs=(card.reference_levels||card.levels||[]).slice(0,6);
 const panels=[
  `<div class="eyebrow">01 / THE CATALYST</div><h2>${esc(card.catalyst)}</h2><div class="confidence">CATALYST <b>${esc(card.catalyst_confidence.toUpperCase())}</b><br>ENTRY <b>UNCONFIRMED</b></div>`,
  `<div class="eyebrow">02 / THE PRICE STRUCTURE</div><h2>${esc(card.setup)}</h2>${refs.length?`<div class="levels"><span>REFERENCE LEVELS · ${esc(card.currency)}</span><p>${refs.map(n=>Number(n).toFixed(2)).join(" · ")}</p></div>`:""}<div class="status">${card.status==='watch_only'?'WATCH ONLY · CARD INCOMPLETE':'CONDITIONAL · WAIT FOR THE SIGNAL'}</div>`,
  `<div class="eyebrow">03 / THE DECISION</div>${row('CONFIRMATION',card.confirmation,'green')}${row('INVALIDATION',card.invalidation,'red')}`,
  `<div class="eyebrow">04 / RISK & SCENARIO</div>${row('STOP',card.stop,'red')}${row('TARGETS / OBSTACLES',card.targets,'green')}<div class="expectation">${esc(card.expectation)}</div>`
 ];
 return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${esc(card.ticker)} · Signal Room</title><style>
 ${font?`@font-face{font-family:Archivo;src:url(${font})}`:''}
 *{box-sizing:border-box}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:${t.background};color:${t.text};font-family:Archivo,Arial,sans-serif}
 body{background:radial-gradient(ellipse at 25% 0%,#182132 0%,transparent 55%),${t.background}}
 .frame{position:absolute;inset:0;padding:90px 180px 290px 64px}.topline{display:flex;justify-content:space-between;align-items:center;font-size:25px;letter-spacing:3px;color:${t.textMuted};white-space:nowrap}
 .signal{color:${t.primary};font-weight:800}.brand-dot{display:inline-block;width:12px;height:12px;background:${t.primary};border-radius:50%;margin-right:10px}
 header{display:flex;align-items:center;gap:24px;margin-top:32px;height:135px}.logo{width:112px;height:90px;padding:12px;background:white;border-radius:15px;object-fit:contain}
 h1{font-size:79px;line-height:1;margin:0;letter-spacing:-3px}.company{margin-top:12px;font-size:27px;color:${t.textMuted};max-width:660px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .chart-label{display:flex;justify-content:space-between;font-size:24px;letter-spacing:1px;color:${t.textMuted};margin-top:36px;margin-bottom:13px}
 .chart{width:836px;height:396px;object-fit:contain;background:#11151d;border:1px solid ${t.hairline};border-radius:10px}
 .chart-source{font-size:22px;color:${t.textMuted};margin:10px 0 0;height:56px;line-height:1.25}.panel-area{position:relative;height:525px;margin-top:20px}.panel{position:absolute;inset:0;opacity:0;transform:translateY(18px);transition:opacity .4s ease,transform .4s ease;pointer-events:none}.panel.active{opacity:1;transform:translateY(0)}
 .eyebrow{color:${t.primary};font-size:26px;letter-spacing:3px;font-weight:700;margin-bottom:23px}h2{font-size:50px;line-height:1.16;letter-spacing:-1px;margin:0;font-weight:700;max-width:820px}
 .levels{margin-top:26px;border-left:4px solid ${t.primary};padding-left:20px}.levels span{font-size:23px;color:${t.textMuted}}.levels p{font-size:37px;line-height:1.35;margin:8px 0;font-variant-numeric:tabular-nums}.confidence{font-size:26px;line-height:1.8;margin-top:30px;color:${t.textMuted};letter-spacing:1px}.confidence b{color:${t.text};margin-left:14px}.status{display:inline-block;border-top:2px solid ${t.primary};padding-top:18px;margin-top:34px;font-size:25px;color:${t.primary};line-height:1.4}
 .row{border-left:4px solid ${t.forecast};padding-left:20px;margin:0 0 23px}.row span{font-size:24px;letter-spacing:2px;color:${t.textMuted};font-weight:700}.row p{font-size:38px;line-height:1.2;margin:7px 0 0;max-width:785px}.green{border-color:${t.positive}}.red{border-color:${t.negative}}.expectation{font-size:28px;line-height:1.3;color:${t.textMuted};padding-top:4px}
 footer{position:absolute;left:64px;right:180px;top:1450px;border-top:1px solid ${t.hairline};padding-top:18px}.caution{font-size:25px;line-height:1.4;color:${t.textMuted};margin:0 0 17px}.substack{font-size:28px;color:${t.text};font-weight:700}.progress{position:absolute;left:64px;top:1610px;width:836px;height:5px;background:${t.hairline}}.progress i{display:block;height:5px;background:${t.primary};width:0;transition:width .15s linear}
 @media(prefers-reduced-motion:reduce){.panel,.progress i{transition:none}}
 </style><body><main class="frame"><div class="topline"><span class="signal"><i class="brand-dot"></i>SIGNAL ROOM</span><span>${esc(week)}</span></div><header><img class="logo" src="${image(asset.logo)}" alt="${esc(card.name)} logo"><div><h1>${esc(card.ticker)}</h1><div class="company">${esc(card.name)}</div></div></header><div class="chart-label"><span>DAILY · ${esc(card.currency||'USD')}</span><span>REFERENCE ${esc(card.asof)}</span></div><img class="chart" src="${image(asset.chart)}" alt="${esc(asset.source_kind)} daily chart"><div class="chart-source">${esc(asset.source_kind)} · ${esc(asset.coverage_warning||'Native price structure · volumes · moving averages')}</div><div class="panel-area">${panels.map((p,i)=>`<section class="panel${i===0?' active':''}" data-panel="${i}">${p}</section>`).join('')}</div><footer><p class="caution">Preparation, not a live signal.<br>Recheck news & prices · Net expectancy unknown.</p><div class="substack">dailytickers.substack.com ↗</div></footer><div class="progress"><i></i></div></main><script>
 const boundaries=[0,6,13,21,${DURATION}]; window.shortTime=seconds=>{const phase=seconds<6?0:seconds<13?1:seconds<21?2:3;document.querySelectorAll('.panel').forEach((x,i)=>x.classList.toggle('active',i===phase));document.querySelector('.progress i').style.width=Math.min(100,seconds/${DURATION}*100)+'%';};
 window.startShort=()=>{const start=performance.now();const loop=()=>{const elapsed=(performance.now()-start)/1000;window.shortTime(elapsed);if(elapsed<${DURATION})requestAnimationFrame(loop)};requestAnimationFrame(loop);};
 </script></body></html>`;
}
