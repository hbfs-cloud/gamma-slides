import { getIcon } from './icons.js';

export function actionOrbitCSS() { return `
  .gamma-orbit { --orbit-size:min(288px,calc(100vw - 32px),calc(100dvh - 96px)); --orbit-radius:calc(var(--orbit-size) * .32); position:fixed; right:28px; bottom:max(24px,min(80px,calc(100dvh - var(--orbit-size) - 16px))); z-index:1400; width:var(--orbit-size); height:var(--orbit-size); pointer-events:none; font:500 14px/1.4 Archivo,system-ui,sans-serif; color:var(--gamma-text); }
  .gamma-orbit,.gamma-orbit * { box-sizing:border-box; }
  .gamma-orbit[data-open=true] { pointer-events:auto; }
  .gamma-orbit button,.gamma-orbit select { pointer-events:auto; font:inherit; color:inherit; cursor:pointer; }
  .gamma-orbit button:focus-visible,.gamma-orbit select:focus-visible { outline:2px solid var(--gamma-primary); outline-offset:4px; }
  .gamma-orbit-hub { position:absolute; right:0; bottom:0; z-index:2; transition:transform 220ms cubic-bezier(.16,1,.3,1); width:56px; height:56px; border-radius:50%; border:1px solid var(--gamma-text); background:var(--gamma-text); color:var(--gamma-bg)!important; font:650 20px/1 Archivo,sans-serif!important; }
  .gamma-orbit[data-open=true] .gamma-orbit-hub { transform:translate(calc((56px - var(--orbit-size)) / 2),calc((56px - var(--orbit-size)) / 2)); }
  .gamma-orbit-hub[aria-expanded=true] { background:var(--gamma-primary); border-color:var(--gamma-primary); }
  .gamma-orbit-canopy { position:absolute; inset:0; width:100%; height:100%; border-radius:50%; background:var(--gamma-bg); border:1px solid var(--gamma-muted); opacity:0; visibility:hidden; transform:scale(.25); transform-origin:calc(100% - 28px) calc(100% - 28px); transition:transform 220ms cubic-bezier(.16,1,.3,1),opacity 140ms,visibility 220ms; pointer-events:none; }
  .gamma-orbit[data-open=true] .gamma-orbit-canopy { opacity:1; visibility:visible; transform:scale(1); pointer-events:auto; }
  .gamma-orbit-branches { position:absolute; inset:0; pointer-events:none; }
  .gamma-orbit-branch { position:absolute; left:calc(50% - 24px); top:calc(50% - 24px); width:48px; height:48px; padding:12px; border:1px solid var(--gamma-muted); border-radius:50%; background:var(--gamma-bg); opacity:0; visibility:hidden; transform:translate(calc((var(--orbit-size) - 56px) / 2),calc((var(--orbit-size) - 56px) / 2)) scale(.5); transition:transform 240ms cubic-bezier(.16,1,.3,1),opacity 140ms,visibility 240ms; pointer-events:none; }
  .gamma-orbit[data-open=true] .gamma-orbit-branch { opacity:1; visibility:visible; transform:translate(calc(var(--orbit-x) * var(--orbit-radius)),calc(var(--orbit-y) * var(--orbit-radius))) scale(1); pointer-events:auto; }
  .gamma-orbit-branch:hover,.gamma-orbit-branch[aria-expanded=true] { background:var(--gamma-primary); color:var(--gamma-bg); border-color:var(--gamma-primary); }
  .gamma-orbit svg { display:block; width:22px; height:22px; }
  .gamma-orbit-branch span { position:absolute; top:52px; left:50%; transform:translateX(-50%); font-size:12px; color:var(--gamma-text); white-space:nowrap; background:var(--gamma-bg); padding:0 4px; }
  .gamma-orbit-branch:disabled { opacity:.45!important; cursor:default; }
  .gamma-orbit-panel { pointer-events:auto; position:fixed; right:28px; bottom:152px; width:340px; max-width:calc(100vw - 32px); max-height:calc(100dvh - 220px); overflow:auto; overscroll-behavior:contain; background:var(--gamma-bg); border:1px solid var(--gamma-muted); border-radius:16px; padding:20px; box-sizing:border-box; }
  .gamma-orbit-panel[hidden] { display:none; }
  .gamma-orbit-panel header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; gap:16px; }.gamma-orbit-panel h3 { font:600 20px/1.2 Archivo,sans-serif; color:var(--gamma-text); margin:0; }
  .gamma-orbit-panel button { min-height:44px; border:1px solid var(--gamma-muted); border-radius:4px; padding:8px 12px; background:var(--gamma-bg); text-align:left; }
  .gamma-orbit-panel button:hover,.gamma-orbit-panel button[aria-pressed=true] { border-color:var(--gamma-primary); color:var(--gamma-primary); }
  .gamma-orbit-panel header button { width:44px; padding:10px; }.gamma-orbit-fields { display:flex; flex-direction:column; gap:12px; }
  .gamma-orbit-fields label { display:flex; flex-direction:column; gap:6px; color:var(--gamma-muted); }.gamma-orbit-fields select { width:100%; min-height:44px; font-size:16px; color:var(--gamma-text); background:var(--gamma-bg); border:1px solid var(--gamma-muted); border-radius:4px; padding:8px; }
  .gamma-orbit-fields button:disabled { opacity:.5; cursor:default; }
  .gamma-orbit-fields p { margin:0; color:var(--gamma-muted); }
  body.gamma-orbit-enabled .experience-tools,body.gamma-orbit-enabled .gamma-studio-toolbar,body.gamma-orbit-enabled .gamma-theme-switcher { display:none!important; }
  html.gamma-studio-modal-open .gamma-orbit,body:has(.gamma-recording-review.is-visible) .gamma-orbit,body:has(.gamma-countdown.is-visible) .gamma-orbit,body:has(.gamma-theme-chooser.is-visible) .gamma-orbit { visibility:hidden; pointer-events:none; }
  .archify-reading:has(>.gamma-orbit-managed) { grid-template-columns:1fr; }
  .gamma-orbit-managed { display:none!important; }
  @media(max-width:900px) { .gamma-orbit { right:16px; bottom:max(24px,min(116px,calc(100dvh - var(--orbit-size) - 16px))); }.gamma-orbit-panel { right:16px; bottom:152px; } }
  @media(prefers-reduced-motion:reduce) { .gamma-orbit-canopy,.gamma-orbit-branch,.gamma-orbit-hub { transition:none; } }
  @media print { .gamma-orbit { display:none!important; }.gamma-orbit-managed { display:none!important; } }
  html.gamma-export .gamma-orbit { display:none; }
`; }

function initActionOrbit(icons) {
  if (new URLSearchParams(location.search).has('gamma-clean') || new URLSearchParams(location.search).has('gamma-export') || new URLSearchParams(location.search).has('print-pdf')) return;
  const fr=document.documentElement.lang.startsWith('fr');
  const t=fr?{menu:'Actions de la slide',actions:'Explorer',full:'Plein écran',back:'Retour',terminal:'Terminal',theme:'Apparence',studio:'Studio',close:'Fermer',empty:'Aucun réglage sur cette slide.'}:{menu:'Slide actions',actions:'Explore',full:'Full screen',back:'Return',terminal:'Terminal',theme:'Appearance',studio:'Studio',close:'Close',empty:'No settings on this slide.'};
  const root=document.createElement('nav');root.className='gamma-orbit';root.setAttribute('aria-label',t.menu);root.dataset.open='false';
  // Five equally spaced actions on one radius around the expanded M hub.
  const branches=[['studio',t.studio],['full',t.full],['actions',t.actions],['terminal',t.terminal],['theme',t.theme]].map(([id,label],i)=>{const angle=(-90+i*72)*Math.PI/180;return [id,label,Math.cos(angle),Math.sin(angle)];});
  root.innerHTML='<div class="gamma-orbit-canopy" aria-hidden="true"></div><div class="gamma-orbit-branches" id="gamma-orbit-branches">'+branches.map(([id,label,x,y])=>'<button type="button" class="gamma-orbit-branch" data-orbit="'+id+'" style="--orbit-x:'+x+';--orbit-y:'+y+'" tabindex="-1" aria-label="'+label+'">'+icons[id]+'<span>'+label+'</span></button>').join('')+'</div><button type="button" class="gamma-orbit-hub" aria-label="'+t.menu+'" aria-expanded="false" aria-controls="gamma-orbit-branches">M</button><section class="gamma-orbit-panel" aria-label="'+t.actions+'" hidden><header><h3>'+t.actions+'</h3><button type="button" data-orbit-close aria-label="'+t.close+'">'+icons.close+'</button></header><div class="gamma-orbit-fields"></div></section>';
  document.body.append(root);document.body.classList.add('gamma-orbit-enabled');
  const hub=root.querySelector('.gamma-orbit-hub'),panel=root.querySelector('.gamma-orbit-panel'),fields=root.querySelector('.gamma-orbit-fields');let timer,controls=[],proxies=[],openedByHover=false,controlSequence=0;
  const current=()=>document.querySelector('.archify-fullscreen[open] .archify-slide')||Reveal.getCurrentSlide();
  const sourceSelector='.revenue-sculpture-key,.archify-controls,.archify-reading>label,.archify-data,.d3-webgpu-actions,.d3-depth-toolbar,.spatial-toolbar,.spatial-inspector>label,.cinema-actions,.cinema-tools,.chart-scenario-legend,.studio-slide-actions';
  function collect(){
    const slide=current();if(!slide)return [];
    const containers=[...slide.querySelectorAll(sourceSelector)];
    // Hide controls only after the equivalent menu is ready. Keep their original event listeners and scopes.
    containers.forEach(el=>{if(el.matches('.revenue-sculpture-key,.chart-scenario-legend'))el.inert=true;else el.classList.add('gamma-orbit-managed');});
    return containers.flatMap(el=>el.matches('button,select')?[el]:[...el.querySelectorAll('button,select,summary')]).filter(el=>!el.matches('[data-archify-action=fullscreen],[data-archify-action=close]')).map(el=>{el.dataset.gammaOrbitId ||= 'orbit-control-'+(++controlSequence);return el;});
  }
  function refresh(){root.querySelector('[data-orbit=theme]').disabled=typeof openThemeChooser!=='function';controls=collect();root.querySelector('[data-orbit=actions]').disabled=!controls.length;const full=root.querySelector('[data-orbit=full]'),label=document.querySelector('.archify-fullscreen[open]')||document.fullscreenElement?t.back:t.full;full.querySelector('span').textContent=label;full.setAttribute('aria-label',label);}
  function setOpen(open){clearTimeout(timer);root.dataset.open=String(open);hub.setAttribute('aria-expanded',String(open));root.querySelectorAll('.gamma-orbit-branch').forEach(b=>b.tabIndex=open?0:-1);if(!open)panel.hidden=true;if(open)refresh();}
  function syncProxies(){proxies.forEach(({source,copy})=>{if(source.matches('select')){if(copy.innerHTML!==source.innerHTML)copy.innerHTML=source.innerHTML;copy.value=source.value;}else {const label=source.getAttribute('aria-label')||source.textContent.trim();if(copy.textContent!==label)copy.textContent=label;if(source.hasAttribute('aria-pressed'))copy.setAttribute('aria-pressed',source.getAttribute('aria-pressed'));}copy.disabled=!!source.disabled;});}
  function showActions(focus=true){
    const focused=document.activeElement?.dataset.orbitSource;
    refresh();fields.replaceChildren();proxies=[];
    controls.forEach(source=>{
      if(source.matches('select')){const label=document.createElement('label');label.textContent=source.getAttribute('aria-label')||source.closest('label')?.childNodes[0]?.textContent?.trim()||t.actions;const copy=source.cloneNode(true);copy.dataset.orbitSource=source.dataset.gammaOrbitId;copy.dataset.orbitControl=source.hasAttribute('data-archify-node')?'archify-node':source.hasAttribute('data-archify-view')?'archify-view':'selection';copy.removeAttribute('id');copy.removeAttribute('class');copy.removeAttribute('data-archify-view');copy.removeAttribute('data-archify-node');copy.addEventListener('change',()=>{source.value=copy.value;source.dispatchEvent(new Event('change',{bubbles:true}));});label.append(copy);fields.append(label);proxies.push({source,copy});}
      else {const copy=document.createElement('button');copy.type='button';copy.dataset.orbitSource=source.dataset.gammaOrbitId;copy.dataset.orbitAction=source.dataset.archifyAction||source.dataset.d3Action||source.dataset.spatialAction||'';copy.addEventListener('click',()=>{if(source.matches('summary')){source.parentElement.open=!source.parentElement.open;const existing=fields.querySelector('.gamma-orbit-relations');if(existing)existing.remove();else{const text=document.createElement('div');text.className='gamma-orbit-relations';text.textContent=source.parentElement.querySelector('dl')?.innerText||source.parentElement.textContent;fields.append(text);}}else source.click();syncProxies();});copy.addEventListener('keydown',event=>{
        if(event.key==='Escape')source.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
          event.preventDefault();event.stopPropagation();const choices=proxies.filter(p=>p.copy.matches('button')&&!p.copy.disabled),index=choices.findIndex(p=>p.copy===copy),delta=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;
          choices[event.key==='Home'?0:event.key==='End'?choices.length-1:(index+delta+choices.length)%choices.length]?.copy.focus();
        }
      });fields.append(copy);proxies.push({source,copy});}
    });
    syncProxies();panel.hidden=false;root.dataset.open='false';hub.setAttribute('aria-expanded','true');root.querySelectorAll('.gamma-orbit-branch').forEach(b=>b.tabIndex=-1);if(focus)panel.querySelector('button').focus();else if(focused)fields.querySelector('[data-orbit-source="'+focused+'"]')?.focus();
  }
  hub.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&matchMedia('(hover:hover)').matches&&panel.hidden&&!document.querySelector('.gamma-live-panel:not([hidden]),.gamma-browser:not([hidden])')){if(root.dataset.open!=='true')openedByHover=true;setOpen(true);}});
  root.addEventListener('pointerenter',()=>clearTimeout(timer));root.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&panel.hidden&&!root.contains(document.activeElement))timer=setTimeout(()=>setOpen(false),450);});
  hub.addEventListener('click',()=>{const studio=document.querySelector('.gamma-live-panel');if(studio)studio.hidden=true;if(!panel.hidden){panel.hidden=true;setOpen(true);}else if(openedByHover){openedByHover=false;setOpen(true);}else setOpen(root.dataset.open!=='true');});
  root.querySelector('[data-orbit-close]').addEventListener('click',()=>{panel.hidden=true;setOpen(true);hub.focus();});
  root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key.toLowerCase()==='m'&&!event.target.closest('input,textarea,select,[contenteditable]')){event.preventDefault();setOpen(root.dataset.open!=='true');hub.focus();}else if(event.key==='Escape'){event.preventDefault();if(root.dataset.open!=='true'&&panel.hidden&&document.querySelector('.archify-fullscreen[open]'))document.querySelector('.archify-fullscreen[open] [data-archify-action=close]').click();else{setOpen(false);hub.focus();}}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)&&panel.hidden){event.preventDefault();setOpen(true);const buttons=[hub,...root.querySelectorAll('.gamma-orbit-branch:not(:disabled)')],direction=['ArrowUp','ArrowRight'].includes(event.key)?1:-1;buttons[(buttons.indexOf(document.activeElement)+direction+buttons.length)%buttons.length].focus();}});
  document.addEventListener('pointerdown',event=>{if(!root.contains(event.target))setOpen(false);},true);
  root.querySelectorAll('[data-orbit]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.orbit;if(action==='actions'){showActions();return;}setOpen(false);
    if(action!=='full')document.querySelector('.archify-fullscreen[open] [data-archify-action=close]')?.click();
    if(action==='terminal'){initPresenterStudio();window.dispatchEvent(new Event('gamma:terminal-request'));}
    else if(action==='theme'){if(typeof openThemeChooser==='function')openThemeChooser();}
    else if(action==='studio'){initPresenterStudio();window.dispatchEvent(new Event('gamma:studio-open'));}
    else if(action==='full'){const slide=current(),archify=slide?.matches('.archify-slide')?slide:slide?.querySelector('.archify-slide');if(archify)archify.querySelector(document.querySelector('.archify-fullscreen[open]')?'[data-archify-action=close]':'[data-archify-action=fullscreen]').click();else if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else document.documentElement.requestFullscreen?.().catch(()=>{});}
  }));
  const observer=new MutationObserver(()=>{const before=controls;refresh();if(!panel.hidden){if(before.length!==controls.length||before.some((c,i)=>c!==controls[i]))showActions(false);else syncProxies();}});observer.observe(document.querySelector('.reveal .slides'),{childList:true,subtree:true});
  window.addEventListener('gamma:archify-fullscreen',()=>{const dialog=document.querySelector('.archify-fullscreen[open]');(dialog||document.body).append(root);setOpen(false);refresh();hub.focus();});
  window.addEventListener('message',event=>{if(event.data?.channel==='gamma-archify'&&window.__gammaArchify?.states.some(state=>state.frame?.contentWindow===event.source)){if(!panel.hidden)syncProxies();}});
  document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='m'&&!event.ctrlKey&&!event.metaKey&&!event.target.closest('input,textarea,select,[contenteditable],.gamma-terminal,.gamma-browser')){event.preventDefault();setOpen(root.dataset.open!=='true');hub.focus();}});
  Reveal.on('overviewshown',()=>setOpen(false));
  Reveal.on('slidechanged',()=>{setOpen(false);refresh();});refresh();
}

export function actionOrbitJS(){return `(${initActionOrbit.toString()})(${JSON.stringify({terminal:getIcon('terminal'),theme:getIcon('palette'),studio:getIcon('settings'),full:getIcon('expand'),actions:getIcon('sliders'),close:getIcon('close')})});`;}
