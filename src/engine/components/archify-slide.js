import { getIcon } from './icons.js';
import { frameDiagramSVG } from './archify-framing.js';
import { compileDiagram } from '../archify.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderSource } from './slide-header.js';

export function diagramFacts(spec) {
  const nodes = spec.components || spec.nodes || spec.participants || spec.states || [];
  const edges = [...(spec.connections || spec.edges || spec.messages || spec.flows || spec.transitions || [])];
  if (spec.diagram_type === 'lifecycle') { const rail=nodes.filter(node=>node.lane==='main').sort((a,b)=>a.col-b.col);rail.slice(1).forEach((node,index)=>edges.push({from:rail[index].id,to:node.id,label:'Phase suivante'})); }
  return { nodes, edges, views: spec.meta?.views || [] };
}

export function renderDiagram(slide, theme, deck) {
  const compiled = compileDiagram(slide.diagram), facts = diagramFacts(slide.diagram.spec);
  const fr = deck.meta?.language?.startsWith('fr');
  const labels = fr ? { play:'Lire le parcours', pause:'Pause', all:'Vue d’ensemble', view:'Parcours', node:'Composant ou étape', data:'Lire les relations', inspect:'Sélectionner un élément pour lire ses relations.', static:'Vue statique', zoomIn:'Agrandir', zoomOut:'Réduire', fullscreen:'Plein écran', close:'Retour à la slide' } : { play:'Play story', pause:'Pause', all:'Overview', view:'Story', node:'Component or step', data:'Read relationships', inspect:'Select an element to read its relationships.', static:'Static view', zoomIn:'Zoom in', zoomOut:'Zoom out', fullscreen:'Full screen', close:'Back to slide' };
  const config = { title:slide.title, ...facts, labels, language:deck.meta?.language || 'en', background:theme.background, text:theme.text, muted:theme.textMuted, primary:theme.primary };
  const framedSVG=frameDiagramSVG(compiled.svg,slide.diagram.type);
  const svgDocument = framedSVG.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" data-theme="dark" ').replace(/(<svg[^>]*>)/, `$1<style><![CDATA[${compiled.css.replaceAll('</style', '<\\/style')} :root { --bg:${theme.background}; --text:${theme.text}; --text-muted:${theme.textMuted}; }]]></style>`);
  const staticImage = `data:image/svg+xml;base64,${Buffer.from(svgDocument).toString('base64')}`;
  return `${renderSlideHeader(slide)}<div class="archify-slide" data-archify-type="${escapeHtml(slide.diagram.type)}" data-archify-source="${compiled.sourceHash}">
    <script type="application/json" class="archify-config">${JSON.stringify(config).replaceAll('<','\\u003c')}</script>
    <template class="archify-document">${escapeHtml(compiled.html.replace(compiled.svg,framedSVG))}</template>
    <div class="archify-controls">
      <button type="button" class="archify-play" data-archify-action="play" aria-pressed="false">${getIcon('play','currentColor',18)}<span>${labels.play}</span></button>
      <label class="archify-view-choice"><span>${labels.view}</span><select data-archify-view aria-label="${labels.view}"><option value="">${labels.all}</option>${facts.views.map(view=>`<option value="${escapeHtml(view.id)}">${escapeHtml(view.label)}</option>`).join('')}</select></label>
      <div class="archify-view-tools" role="group" aria-label="${labels.all}">
        <button type="button" data-archify-action="out" aria-label="${labels.zoomOut}" title="${labels.zoomOut}">${getIcon('minus','currentColor',18)}</button>
        <button type="button" data-archify-action="in" aria-label="${labels.zoomIn}" title="${labels.zoomIn}">${getIcon('plus','currentColor',18)}</button>
        <button type="button" data-archify-action="reset" aria-label="${labels.all}" title="${labels.all}">${getIcon('scan','currentColor',18)}</button>
      </div>
      <button type="button" class="archify-expand" data-archify-action="fullscreen">${getIcon('expand','currentColor',18)}<span>${labels.fullscreen}</span></button>
      <button type="button" class="archify-close" data-archify-action="close">${getIcon('close','currentColor',18)}<span>${labels.close}</span></button>
    </div>
    <div class="archify-canvas"><img class="archify-static" src="${staticImage}" alt="${escapeHtml(slide.diagram.spec.meta.title)}"></div>
    <div class="archify-reading"><label>${labels.node}<select data-archify-node><option value="">${labels.all}</option>${facts.nodes.map(node=>`<option value="${escapeHtml(node.id)}">${escapeHtml(node.label)}</option>`).join('')}</select></label><p data-archify-status aria-live="polite">${labels.inspect}</p></div>
    <details class="archify-data"><summary>${labels.data}</summary><dl>${facts.nodes.map(node=>`<div><dt>${escapeHtml(node.label)}</dt><dd>${escapeHtml(node.sublabel || '')}${facts.edges.filter(edge=>edge.from===node.id).map(edge=>`<span>${escapeHtml(edge.label || '→')} → ${escapeHtml(facts.nodes.find(n=>n.id===edge.to)?.label || edge.to)}</span>`).join('')}</dd></div>`).join('')}</dl></details>
  </div>${renderSource(slide, {context:false})}`;
}

export function archifySlideCSS() { return `
  .archify-slide { min-height:0; flex:1; display:flex; flex-direction:column; gap:16px; color:var(--gamma-text); font-family:Archivo,sans-serif; }
  .archify-controls { display:flex; align-items:center; gap:12px; padding:8px; background:var(--experience-surface); border:1px solid var(--experience-line); border-radius:16px; }
  .archify-slide button,.archify-slide select { min-height:44px; min-width:44px; padding:8px 12px; border:0; background:transparent; color:var(--gamma-text); font:500 14px/1.3 Archivo,sans-serif; border-radius:4px; }
  .archify-slide button { display:inline-flex; justify-content:center; align-items:center; gap:8px; cursor:pointer; white-space:nowrap; }
  .archify-slide button:hover { background:var(--experience-line); }
  .archify-slide button svg { flex:none; width:18px; height:18px; }
  .archify-slide label { display:flex; align-items:center; gap:12px; color:var(--gamma-muted); font:500 14px/1.4 Archivo,sans-serif; min-width:0; }
  .archify-slide .archify-play { background:var(--gamma-primary); color:var(--gamma-bg); }
  .archify-view-choice { flex:1; }.archify-view-choice>span { padding-left:8px; }.archify-view-choice select { min-width:0; width:100%; max-width:320px; }
  .archify-slide select { appearance:auto; cursor:pointer; background:var(--gamma-bg); }
  .archify-view-tools { display:flex; gap:0; border-inline-start:1px solid var(--experience-line); padding-left:8px; }
  .archify-slide button:focus-visible,.archify-slide select:focus-visible,.archify-slide summary:focus-visible { outline:2px solid var(--gamma-primary); outline-offset:3px; }
  .archify-slide .archify-close { display:none; }
  .archify-canvas { position:relative; width:100%; height:420px; flex:1; min-height:240px; background:var(--gamma-bg); }
  .archify-canvas iframe { position:absolute; inset:0; width:100%; height:100%; border:0; display:block; }
  .archify-static { width:100%; height:100%; object-fit:contain; }
  .archify-slide[data-ready="true"] .archify-static { display:none; }
  .archify-reading { display:grid; grid-template-columns:280px 1fr; gap:24px; align-items:center; border-top:1px solid var(--experience-line); padding-top:12px; }
  .archify-reading label { align-items:start; flex-direction:column; gap:4px; }.archify-reading select { width:100%; padding-left:0; }
  .archify-reading p,.reveal .archify-reading p { font:450 16px/1.5 Archivo,sans-serif; color:var(--gamma-text); margin:0; }
  .archify-data { font:450 14px/1.5 Archivo,sans-serif; }.archify-data summary { cursor:pointer; min-height:44px; color:var(--gamma-muted); padding:8px 0; }
  .archify-data[open] { max-height:200px; overflow:auto; }.archify-data dl { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:0; }
  .archify-data dt { font-weight:650; }.archify-data dd { margin:4px 0 0; color:var(--gamma-muted); }.archify-data dd span { display:block; }
  body.gamma-experience .reveal .slides > section.layout-diagram { padding-top:24px; padding-bottom:48px; }
  body.gamma-experience .layout-diagram .slide-header { margin-bottom:16px; }
  .archify-fullscreen { box-sizing:border-box; position:fixed; inset:0; width:100vw; height:100dvh; max-width:none; max-height:none; margin:0; padding:24px 32px; border:0; background:var(--gamma-bg); color:var(--gamma-text); }
  .archify-fullscreen::backdrop { background:var(--gamma-bg); }.archify-fullscreen[open] { display:flex; flex-direction:column; gap:16px; }
  .archify-fullscreen h2 { margin:0; font:550 24px/1.2 Archivo,sans-serif; color:var(--gamma-text); }
  .archify-fullscreen .archify-slide { flex:1; min-height:0; }.archify-fullscreen .archify-canvas { height:auto; flex:1; }
  .archify-fullscreen .archify-close { display:inline-flex; }.archify-fullscreen .archify-expand { display:none; }
  @media(max-width:900px) {
    .archify-controls { flex-wrap:wrap; gap:8px; padding:8px; }.archify-play { flex:1; }.archify-view-choice { flex-basis:100%; order:3; }.archify-view-choice select { max-width:none; }.archify-view-tools { border:0; padding:0; order:4; }.archify-slide .archify-expand,.archify-slide .archify-close { margin-left:auto; order:4; }
    .archify-slide { flex:none; min-height:auto; }.archify-canvas { flex:none; height:260px; min-height:0; }
    .archify-reading { grid-template-columns:1fr; gap:12px; }.archify-reading label { flex-direction:row; align-items:center; }.archify-reading select { min-width:0; width:60%; font-size:16px; }
    .archify-data dl { grid-template-columns:1fr; }.archify-data[open] { max-height:none; overflow:visible; }
    .archify-fullscreen { padding:16px; overflow:auto; }.archify-fullscreen .archify-canvas { min-height:280px; }.archify-fullscreen h2 { font-size:20px; }
  }
  @media print { .archify-fullscreen { display:none!important; }.archify-controls,.archify-reading,.archify-data,.archify-canvas iframe { display:none!important; }.archify-static { display:block!important; }.archify-canvas { height:470px; } }
  html.gamma-export .archify-controls,html.gamma-export .archify-reading,html.gamma-export .archify-data { display:none; }
`; }

function archifyFrameBridge() {
  const channel = 'gamma-archify';
  const root = document.documentElement;
  const api = window.Archify;
  const svg = document.querySelector('.diagram-container > svg');
  if (!api || !svg) return;
  const send = () => { mobileCamera(api.guidedViews?.beat()?.nodeId || (typeof api.focus?.active?.()==='string'?api.focus.active():null));parent.postMessage({ channel, event:'state', playing:api.guidedViews?.isPlaying(), view:api.guidedViews?.active(), beat:api.guidedViews?.beat(), node:api.focus?.active?.(), scale:api.view?.state?.().scale }, '*'); };
  const overview=svg.getAttribute('viewBox');let cameraNode=null;
  window.addEventListener('resize',()=>{cameraNode=null;if(innerWidth>720)svg.setAttribute('viewBox',overview);send();});
  function mobileCamera(id) {
    if(innerWidth>720)return;
    if(id===cameraNode)return;cameraNode=id;
    const node=[...svg.querySelectorAll('[data-node-id]')].find(node=>node.dataset.nodeId===id);
    if(!node){svg.setAttribute('viewBox',overview);return;}
    const box=node.getBBox(),width=Math.max(260,box.width+80),height=width*Math.max(1,innerHeight)/Math.max(1,innerWidth);
    svg.setAttribute('viewBox',`${box.x+box.width/2-width/2} ${box.y+box.height/2-height/2} ${width} ${height}`);
  }
  const nodeIds = new Set([...svg.querySelectorAll('[data-node-id]')].map(node=>node.dataset.nodeId));
  window.addEventListener('message', event => {
    if (event.source !== parent || event.data?.channel !== channel) return;
    const { action, value } = event.data;
    if (action === 'theme') {
      if(root.dataset.theme!==(value.mode||'dark'))api.theme?.toggle();
      for (const key of ['bg','text','text-muted']) if (typeof value?.[key] === 'string' && CSS.supports('color',value[key])) root.style.setProperty('--'+key,value[key]);
    } else if (action === 'play') { api.motionGovernor?.resume(); api.guidedViews?.play(); }
    else if (action === 'pause') { api.guidedViews?.pause(); api.motionGovernor?.pause(); }
    else if (action === 'view') { if (value) api.guidedViews?.activate(value); else { api.guidedViews?.showAll(); api.focus?.clear(); api.view?.reset(); } }
    else if (action === 'node' && nodeIds.has(value)) { api.guidedViews?.pause(); api.guidedViews?.showAll(); api.focus?.set(value, {updateUrl:false,toggle:false}); api.view?.reveal([value], {includeNeighbors:false}); }
    else if (action === 'reset') { api.guidedViews?.pause(); api.guidedViews?.showAll(); api.focus?.clear(); api.view?.reset(); }
    else if (action === 'in') api.view?.zoomIn();
    else if (action === 'out') api.view?.zoomOut();
    send();
  });
  let queued = false;
  const observer = new MutationObserver(() => { if (!queued) { queued=true; requestAnimationFrame(()=>{queued=false;send();}); } });
  observer.observe(svg,{attributes:true,subtree:true,attributeFilter:['data-story-beat','data-story-playing','data-story-active','data-focus-active','aria-pressed']});
  document.addEventListener('keydown',event=>{
    if (event.key === 'Escape') parent.postMessage({channel,event:'escape'},'*');
  });
  parent.postMessage({channel,event:'ready',nodes:nodeIds.size},'*');
  send();
}

function initArchifySlides(bridgeSource) {
  const roots = [...document.querySelectorAll('.archify-slide')];
  const exported = new URLSearchParams(location.search).has('gamma-export') || new URLSearchParams(location.search).has('print-pdf');
  const printing = matchMedia('print');
  const theme = () => { const css=getComputedStyle(document.body);return {mode:document.body.dataset.presentationTheme === 'analyst-proof' ? 'light' : 'dark',bg:css.getPropertyValue('--gamma-bg').trim(),text:css.getPropertyValue('--gamma-text').trim(),'text-muted':css.getPropertyValue('--gamma-muted').trim()}; };
  const post = (state,action,value) => state.frame?.contentWindow?.postMessage({channel:'gamma-archify',action,value},'*');
  const states=roots.map(root=>({root, section:root.closest('section'), config:JSON.parse(root.querySelector('.archify-config').textContent),frame:null,playing:false,view:'',node:''}));
  const destroy = state => { state.frame?.remove();state.frame=null;state.root.dataset.ready='false';state.playing=false;state.root.querySelector('[data-archify-action="play"] span').textContent=state.config.labels.play;state.root.querySelector('[data-archify-action="play"]').setAttribute('aria-pressed','false'); };
  const mount = state => {
    if (state.frame) return;
    if(matchMedia('(max-width:900px)').matches&&!state.node&&!state.view)state.node=state.config.nodes[0]?.id || '';
    const frame=document.createElement('iframe');frame.title=state.section.querySelector('h2')?.textContent || 'Archify';
    frame.setAttribute('sandbox','allow-scripts allow-downloads');
    const css=`html,body{margin:0!important;padding:0!important;min-height:0!important;height:100%!important;background:var(--bg)!important;background-image:none!important}.container{width:100%!important;max-width:none!important;height:100%!important;margin:0!important;padding:0!important}.header,.toolbar,.guided-views,.cards,.diagram-nav,#focus-chip,.relationship-lens{display:none!important}.diagram-container{width:100%!important;height:100%!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.diagram-container>svg{display:block;width:100%!important;height:100%!important;min-width:0!important;max-width:none!important}html[data-theme]{--bg:${theme().bg};--text:${theme().text};--text-muted:${theme()['text-muted']}}`;
    frame.srcdoc=state.root.querySelector('.archify-document').content.textContent.replace('</head>',`<style>${css}</style></head>`).replace('</body>',`<script>(${bridgeSource})()<\/script></body>`);
    state.frame=frame;state.root.querySelector('.archify-canvas').append(frame);
  };
  const sync=()=>states.forEach(state=>{if(!exported&&!printing.matches&&!document.hidden&&state.section===Reveal.getCurrentSlide())mount(state);else destroy(state);});
  const dialog=document.createElement('dialog');dialog.className='archify-fullscreen';dialog.setAttribute('aria-label','Archify');
  const heading=document.createElement('h2');dialog.append(heading);document.body.append(dialog);let expanded=null,placeholder=null,returnFocus=null;
  const closeExpanded=()=>{
    if(!expanded)return;const state=expanded;expanded=null;
    if(placeholder.parentElement.moveBefore)placeholder.parentElement.moveBefore(state.root,placeholder);
    else {const playing=state.playing;destroy(state);placeholder.before(state.root);state.resumePlaying=playing;}
    placeholder.remove();placeholder=null;dialog.close();if(document.fullscreenElement===dialog)document.exitFullscreen().catch(()=>{});
    sync();window.dispatchEvent(new Event('gamma:archify-fullscreen'));(document.querySelector('.gamma-orbit-hub')||returnFocus)?.focus();
  };
  const expand=state=>{
    if(expanded)return;returnFocus=document.activeElement;placeholder=document.createComment('archify slide');state.root.before(placeholder);expanded=state;heading.textContent=state.config.title;
    if(dialog.moveBefore)dialog.moveBefore(state.root,null);else {const playing=state.playing;destroy(state);dialog.append(state.root);state.resumePlaying=playing;}
    dialog.showModal();mount(state);window.dispatchEvent(new Event('gamma:archify-fullscreen'));dialog.requestFullscreen?.().catch(()=>{});
  };
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeExpanded();});
  document.addEventListener('fullscreenchange',()=>{if(expanded&&!document.fullscreenElement)closeExpanded();});
  window.addEventListener('beforeprint',closeExpanded);
  states.forEach(state=>{
    state.root.addEventListener('click',event=>{const button=event.target.closest('[data-archify-action]');if(!button)return;const action=button.dataset.archifyAction;if(action==='fullscreen'){expand(state);return;}if(action==='close'){closeExpanded();return;}if(action==='reset'){state.node='';state.view='';state.root.querySelector('[data-archify-node]').value='';}post(state,action==='play'&&state.playing?'pause':action);});
    state.root.querySelector('[data-archify-view]').addEventListener('change',event=>{state.view=event.target.value;state.node='';post(state,'view',state.view);});
    state.root.querySelector('[data-archify-node]').addEventListener('change',event=>{state.node=event.target.value;post(state,state.node?'node':'reset',state.node);});
    state.root.addEventListener('keydown',event=>{if(event.target.closest('button,select,summary'))event.stopPropagation();});
  });
  window.addEventListener('message',event=>{
    if(event.data?.channel!=='gamma-archify')return;
    const state=states.find(state=>state.frame?.contentWindow===event.source);if(!state)return;
    if(event.data.event==='escape'){if(expanded){closeExpanded();return;}(document.querySelector('.gamma-orbit-hub')||state.root.querySelector('[data-archify-action="play"]')).focus();return;}
    if(event.data.event==='ready'){state.root.dataset.ready='true';post(state,'theme',theme());if(state.node)post(state,'node',state.node);else if(state.view)post(state,'view',state.view);if(state.resumePlaying){post(state,'play');state.resumePlaying=false;}return;}
    if(event.data.event!=='state')return;
    state.view=event.data.view||'';state.playing=!!event.data.playing;state.root.querySelector('[data-archify-action="play"] span').textContent=state.playing?state.config.labels.pause:state.config.labels.play;
    state.root.querySelector('[data-archify-action="play"]').setAttribute('aria-pressed',String(state.playing));
    const id=event.data.beat?.nodeId || (typeof event.data.node==='string'?event.data.node:null) || state.node;
    const node=state.config.nodes.find(node=>node.id===id),view=state.config.views.find(view=>view.id===event.data.view);
    if(node){if(!state.playing)state.node=node.id;state.root.querySelector('[data-archify-node]').value=node.id;state.root.querySelector('[data-archify-status]').textContent=[node.label,node.sublabel,...state.config.edges.filter(edge=>edge.from===node.id).map(edge=>`${edge.label||'→'} → ${state.config.nodes.find(node=>node.id===edge.to)?.label||edge.to}`)].filter(Boolean).join(' · ');}
    else state.root.querySelector('[data-archify-status]').textContent=view?.note || state.config.labels.inspect;
    state.root.querySelector('[data-archify-view]').value=view?.id||'';
  });
  Reveal.on('slidechanged',()=>{closeExpanded();sync();});window.addEventListener('gamma:theme-changed',()=>states.forEach(state=>post(state,'theme',theme())));
  document.addEventListener('visibilitychange',sync);printing.addEventListener('change',()=>{if(printing.matches)closeExpanded();sync();});window.addEventListener('pagehide',()=>states.forEach(destroy));sync();
  window.__gammaArchify={states};
}

export function archifySlideJS() { return `(${initArchifySlides.toString()})(${JSON.stringify(archifyFrameBridge.toString()).replaceAll('<','\\u003c')});`; }
