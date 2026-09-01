import { escapeHtml } from '../html.js';

export function themePickerHTML(themes) {
  const options = themes.map(theme => `
    <button class="gamma-theme-option theme-${escapeHtml(theme.id)}" type="button" data-presentation-theme="${escapeHtml(theme.id)}" role="radio" aria-checked="false">
      <span class="gamma-theme-preview" aria-hidden="true"><i></i><b></b><em></em><u></u></span>
      <strong>${escapeHtml(theme.label)}</strong>
      <span class="gamma-theme-purpose">${escapeHtml(theme.purpose)}</span>
      <span class="gamma-theme-description">${escapeHtml(theme.description)}</span>
    </button>`).join('');

  return `
    <button class="gamma-theme-switcher" type="button" data-theme-open aria-haspopup="dialog" aria-controls="gamma-theme-chooser">
      <span class="gamma-theme-switcher-mark" aria-hidden="true"></span>
      <span>Theme</span><strong data-theme-current>${escapeHtml(themes[0].label)}</strong>
    </button>
    <div class="gamma-theme-chooser is-visible" id="gamma-theme-chooser" role="dialog" aria-modal="true" aria-labelledby="gamma-theme-title">
      <div class="gamma-theme-shell">
        <div class="gamma-theme-heading">
          <div>
            <h1 id="gamma-theme-title">Choose how the report should read.</h1>
            <p>Each theme changes the typography, composition, surfaces, and charts. Your slide and place stay the same.</p>
          </div>
          <button class="gamma-theme-close" type="button" data-theme-close aria-label="Close theme selector" hidden>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div class="gamma-theme-options" role="radiogroup" aria-label="Presentation theme">${options}
        </div>
        <p class="gamma-theme-hint">Arrow keys compare · Enter applies · Change theme again at any time</p>
      </div>
    </div>`;
}

export function themePickerCSS() {
  return `
    .gamma-theme-chooser[hidden], .gamma-theme-switcher[hidden], .gamma-theme-close[hidden] { display:none !important; }
    .gamma-theme-chooser {
      position:fixed; inset:0; z-index:10020; display:grid; place-items:center; padding:34px;
      background:#050912; color:#F5F7FC; font-family:'Archivo',system-ui,sans-serif;
      opacity:0; visibility:hidden; transition:opacity 180ms ease,visibility 180ms ease;
    }
    .gamma-theme-chooser.is-visible { opacity:1; visibility:visible; }
    .gamma-theme-shell { width:min(1180px,100%); }
    .gamma-theme-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:36px; margin-bottom:28px; }
    .gamma-theme-heading h1 {
      max-width:820px; margin:0; color:#F5F7FC; font:650 clamp(38px,5.4vw,72px)/.97 'Archivo',system-ui,sans-serif;
      letter-spacing:-.035em; text-wrap:balance;
    }
    .gamma-theme-heading p { margin:14px 0 0; max-width:68ch; color:#AAB7CA; font:440 14px/1.5 'Archivo',system-ui,sans-serif; }
    .gamma-theme-close {
      width:44px; height:44px; display:grid; place-items:center; flex:0 0 auto; border:1px solid #2A3850;
      border-radius:9px; background:#0A101B; color:#AAB7CA; cursor:pointer; transition:background 150ms ease,color 150ms ease;
    }
    .gamma-theme-close svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; }
    .gamma-theme-close:hover { background:#111B2B; color:#F5F7FC; }
    .gamma-theme-close:focus-visible, .gamma-theme-option:focus-visible, .gamma-theme-switcher:focus-visible { outline:2px solid #8BA8FF; outline-offset:3px; }
    .gamma-theme-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-top:1px solid #2A3850; border-bottom:1px solid #2A3850; }
    .gamma-theme-option {
      min-width:0; padding:18px 20px 21px; border:0; border-right:1px solid #2A3850; background:#0A101B; color:#F5F7FC;
      text-align:left; cursor:pointer; transition:background 150ms ease,color 150ms ease;
    }
    .gamma-theme-option:last-child { border-right:0; }
    .gamma-theme-option:hover, .gamma-theme-option[aria-checked="true"] { background:#111B2B; }
    .gamma-theme-option[aria-checked="true"] { box-shadow:inset 0 3px 0 var(--theme-choice-color,#8BA8FF); }
    .gamma-theme-preview { position:relative; display:block; height:180px; margin-bottom:20px; overflow:hidden; border:1px solid #2A3850; }
    .gamma-theme-preview i, .gamma-theme-preview b, .gamma-theme-preview em, .gamma-theme-preview u { position:absolute; display:block; font-style:normal; text-decoration:none; }
    .theme-analyst-proof { --theme-choice-color:#1748D5; }
    .theme-analyst-proof .gamma-theme-preview { background:#F3F0E8; }
    .theme-analyst-proof .gamma-theme-preview i { inset:20px auto 20px 20px; width:21%; background:#1748D5; }
    .theme-analyst-proof .gamma-theme-preview b { left:32%; right:22px; top:27px; height:40px; border-top:7px solid #111318; border-bottom:7px solid #111318; }
    .theme-analyst-proof .gamma-theme-preview em { left:32%; right:22px; bottom:47px; height:1px; background:#111318; box-shadow:0 25px 0 #CFC9BD; }
    .theme-analyst-proof .gamma-theme-preview u { right:22px; bottom:20px; width:31%; height:3px; background:#1748D5; }
    .theme-cutting-room { --theme-choice-color:#FF5A1F; }
    .theme-cutting-room .gamma-theme-preview { background:#080808; }
    .theme-cutting-room .gamma-theme-preview i { inset:0 auto 0 0; width:36%; background:#FF5A1F; }
    .theme-cutting-room .gamma-theme-preview b { left:45%; right:20px; top:33px; height:44px; border-top:10px solid #F4F0E7; border-bottom:10px solid #F4F0E7; }
    .theme-cutting-room .gamma-theme-preview em { left:45%; right:32%; bottom:36px; height:2px; background:#FF5A1F; }
    .theme-cutting-room .gamma-theme-preview u { left:0; right:0; bottom:12px; height:6px; background:repeating-linear-gradient(90deg,#FF5A1F 0 13px,transparent 13px 20px); }
    .theme-signal-room { --theme-choice-color:#FFB000; }
    .theme-signal-room .gamma-theme-preview { background:#05070A; }
    .theme-signal-room .gamma-theme-preview i { left:20px; right:20px; top:28px; height:1px; background:#2A3850; box-shadow:0 38px 0 #2A3850,0 76px 0 #2A3850; }
    .theme-signal-room .gamma-theme-preview b { left:22px; top:22px; width:34%; height:8px; background:#F5F7FC; box-shadow:0 38px 0 #AAB7CA; }
    .theme-signal-room .gamma-theme-preview em { left:48%; right:24px; bottom:35px; height:70px; border-bottom:2px solid #3FD49A; transform:skewY(-13deg); box-shadow:0 19px 0 #8BA8FF; }
    .theme-signal-room .gamma-theme-preview u { right:22px; top:22px; width:8px; height:8px; background:#FFB000; }
    .gamma-theme-purpose { display:block; margin-top:8px; color:var(--theme-choice-color,#8BA8FF); font:650 10px/1 'Azeret Mono',monospace; letter-spacing:.06em; }
    .gamma-theme-option > strong { display:block; color:#F5F7FC; font:660 27px/1.08 'Archivo',system-ui,sans-serif; letter-spacing:-.025em; }
    .gamma-theme-description { display:block; margin-top:7px; color:#AAB7CA; font:430 12px/1.48 'Archivo',system-ui,sans-serif; }
    .gamma-theme-hint { margin:15px 0 0; color:#AAB7CA; font:560 10px/1 'Azeret Mono',monospace; }
    .gamma-theme-switcher {
      position:fixed; top:18px; left:18px; z-index:9100; min-height:40px; display:flex; align-items:center; gap:8px;
      padding:0 12px; border:1px solid #2A3850; border-radius:9px; background:#0A101B; color:#AAB7CA;
      cursor:pointer; font:620 10px/1 'Azeret Mono',monospace;
    }
    .gamma-theme-switcher-mark { width:7px; height:7px; background:var(--gamma-primary,#8BA8FF); }
    .gamma-theme-switcher strong { color:#F5F7FC; font-weight:650; }
    .gamma-theme-switcher:hover { background:#111B2B; }
    html.gamma-export .gamma-theme-chooser, html.gamma-export .gamma-theme-switcher { display:none !important; }
    ::view-transition-old(gamma-stage), ::view-transition-new(gamma-stage) { animation-duration:440ms; animation-timing-function:cubic-bezier(.16,1,.3,1); }
    .reveal { view-transition-name:gamma-stage; }
    @media(max-width:900px) {
      .gamma-theme-chooser { padding:20px; overflow:auto; align-items:start; }
      .gamma-theme-shell { margin:auto 0; }
      .gamma-theme-heading { align-items:flex-start; }
      .gamma-theme-options { grid-template-columns:1fr; }
      .gamma-theme-option { display:grid; grid-template-columns:180px 1fr; grid-template-rows:auto auto auto; gap:0 18px; border-right:0; border-bottom:1px solid #2A3850; }
      .gamma-theme-option:last-child { border-bottom:0; }
      .gamma-theme-preview { grid-row:1 / 4; height:116px; margin:0; }
    }
    @media(max-width:620px) {
      .gamma-theme-heading { margin-bottom:18px; }
      .gamma-theme-option { grid-template-columns:1fr; }
      .gamma-theme-preview { display:none; }
      .gamma-theme-switcher { top:10px; left:10px; }
    }
  `;
}

export function themePickerJS(themes, defaultThemeId) {
  const themeMeta = Object.fromEntries(themes.map(theme => [theme.id, {
    label: theme.label,
    purpose: theme.purpose,
    description: theme.description,
  }]));
  return `
    const gammaThemeParams=new URLSearchParams(window.location.search);
    const gammaThemeMeta=${JSON.stringify(themeMeta)};
    const gammaThemeQuery=(gammaThemeParams.get('theme')||'').toLowerCase();
    const gammaThemeAutomation=gammaExportMode||gammaThemeParams.has('gamma-qa');
    let gammaPresentationTheme=gammaThemeMeta[gammaThemeQuery]?gammaThemeQuery:${JSON.stringify(defaultThemeId)};
    let gammaThemePicked=gammaThemeAutomation||Boolean(gammaThemeMeta[gammaThemeQuery]);
    let gammaThemeReturnFocus=null;

    function commitPresentationTheme(themeId,{persist=true}={}){
      if(!gammaThemeMeta[themeId])return;
      gammaPresentationTheme=themeId;
      document.body.dataset.presentationTheme=themeId;
      const style=document.getElementById('gamma-theme-runtime');
      if(style&&gammaThemeCssSets[themeId])style.textContent=gammaThemeCssSets[themeId];
      document.querySelectorAll('[data-presentation-theme]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.presentationTheme===themeId)));
      const current=document.querySelector('[data-theme-current]');
      if(current)current.textContent=gammaThemeMeta[themeId].label;
      if(persist){try{localStorage.setItem('gamma-presentation-theme',themeId)}catch(_){}}
      if(typeof setChartTheme==='function')setChartTheme(themeId);
    }

    function refreshThemeStage(){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(typeof Reveal!=='undefined')Reveal.layout();
        if(typeof resizeChartsWithin==='function')resizeChartsWithin(document);
        window.dispatchEvent(new CustomEvent('gamma:theme-changed',{detail:{theme:gammaPresentationTheme}}));
      }));
    }

    function applyPresentationTheme(themeId,{animate=true}={}){
      const update=()=>{commitPresentationTheme(themeId);refreshThemeStage()};
      if(animate&&document.startViewTransition&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        document.startViewTransition(update);
      }else update();
    }

    function closeThemeChooser({restoreFocus=true}={}){
      const chooser=document.getElementById('gamma-theme-chooser');
      if(!chooser)return;
      chooser.classList.remove('is-visible');
      document.querySelector('.reveal')?.removeAttribute('aria-hidden');
      const studioWizard=document.getElementById('gamma-studio-wizard');
      if(studioWizard){studioWizard.inert=false;studioWizard.removeAttribute('aria-hidden')}
      setTimeout(()=>{chooser.hidden=true},200);
      if(restoreFocus)(gammaThemeReturnFocus||document.querySelector('[data-theme-open]'))?.focus();
    }

    function openThemeChooser(){
      const chooser=document.getElementById('gamma-theme-chooser');
      if(!chooser)return;
      gammaThemeReturnFocus=document.activeElement;
      chooser.hidden=false;
      const close=chooser.querySelector('[data-theme-close]');
      if(close)close.hidden=!gammaThemePicked;
      requestAnimationFrame(()=>chooser.classList.add('is-visible'));
      document.querySelector('.reveal')?.setAttribute('aria-hidden','true');
      const studioWizard=document.getElementById('gamma-studio-wizard');
      if(studioWizard){studioWizard.inert=true;studioWizard.setAttribute('aria-hidden','true')}
      const focusSelected=()=> (chooser.querySelector('[data-presentation-theme="'+gammaPresentationTheme+'"]')||chooser.querySelector('[data-presentation-theme]'))?.focus();
      requestAnimationFrame(focusSelected);setTimeout(focusSelected,120);
    }

    function initThemePicker(){
      const chooser=document.getElementById('gamma-theme-chooser');
      const switcher=document.querySelector('[data-theme-open]');
      if(!chooser||!switcher)return;
      let saved='';
      try{saved=(localStorage.getItem('gamma-presentation-theme')||'').toLowerCase()}catch(_){ }
      if(!gammaThemeMeta[gammaThemeQuery]&&gammaThemeMeta[saved])gammaPresentationTheme=saved;
      commitPresentationTheme(gammaPresentationTheme,{persist:false});
      if(gammaThemeAutomation||gammaThemeMeta[gammaThemeQuery]){
        chooser.hidden=true;chooser.classList.remove('is-visible');
      }else{
        const close=chooser.querySelector('[data-theme-close]');if(close)close.hidden=true;
        document.querySelector('.reveal')?.setAttribute('aria-hidden','true');
        const studioWizard=document.getElementById('gamma-studio-wizard');
        if(studioWizard){studioWizard.inert=true;studioWizard.setAttribute('aria-hidden','true')}
        const focusSelected=()=> (chooser.querySelector('[data-presentation-theme="'+gammaPresentationTheme+'"]')||chooser.querySelector('[data-presentation-theme]'))?.focus();
        requestAnimationFrame(focusSelected);setTimeout(focusSelected,120);
      }
      switcher.addEventListener('click',openThemeChooser);
      chooser.addEventListener('click',event=>{
        const option=event.target.closest('[data-presentation-theme]');
        if(option){gammaThemePicked=true;applyPresentationTheme(option.dataset.presentationTheme);closeThemeChooser();return}
        if(event.target.closest('[data-theme-close]')&&gammaThemePicked)closeThemeChooser();
      });
      document.addEventListener('keydown',event=>{
        if(chooser.hidden||!chooser.classList.contains('is-visible'))return;
        const options=[...chooser.querySelectorAll('[data-presentation-theme]')];
        if(event.key==='Escape'&&gammaThemePicked){event.preventDefault();closeThemeChooser();return}
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
        const index=Math.max(0,options.indexOf(document.activeElement));
        const direction=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;
        event.preventDefault();options[(index+direction+options.length)%options.length].focus();
      });
    }
  `;
}
