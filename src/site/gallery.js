import { renderDeck } from '../engine/renderer.js';

// The preview uses the real source slide, on a stable presentation-sized canvas.
// Scaling its outer frame must never trigger a different, scrollable mobile deck.
export const galleryFeatures = [
  { id: 'architecture', slug: 'gamma-presenter-capabilities', slide: 5, label: 'Architecture', action: 'Follow the flow', title: 'Explain the system. Then follow one path.', copy: 'Archify keeps components and connections alive. Play the story or select a component to focus the conversation.', hint: 'Try Play story or select a component.', kind: 'Live Archify diagram' },
  { id: 'charts', slug: 'flagship', slide: 4, label: 'Charts & finance', action: 'Inspect the numbers', title: 'Give every number its context.', copy: 'Move from a revenue trend to the underlying values without replacing the chart with a screenshot.', hint: 'Hover the chart to inspect a period. Demo data is illustrative.', kind: 'Live chart · sample data' },
  { id: 'spatial', slug: 'immersive-data', slide: 1, label: '3D data', action: 'Turn the data', title: 'Growth, valuation and margin. In one view.', copy: 'Rotate the same observations in space, then switch to an exact-value table when the detail matters.', hint: 'Drag to rotate. Choose Values to read the data.', kind: 'Interactive 3D · sample data' },
  { id: 'media', slug: 'gamma-presenter-capabilities', slide: 3, label: 'Video', action: 'Play inside the slide', title: 'Press play. Stay in your presentation.', copy: 'Embed a YouTube scene alongside your story, with the entire player and its controls kept in view.', hint: 'Press play in the player. YouTube requires an internet connection.', kind: 'YouTube player' },
  { id: 'browser', slug: 'gamma-presenter-capabilities', slide: 7, label: 'Web demos', action: 'Navigate a real page', title: 'Show the product, not a picture of it.', copy: 'Try this sample website. In the desktop app, open an isolated browser to navigate a real dashboard, documentation page or product during your talk.', hint: 'Choose Requests in the sample website. This public demo does not access your browser.', kind: 'Interactive website sample' },
  { id: 'ai', slug: 'gamma-presenter-capabilities', slide: 8, label: 'Claude & Codex', action: 'Rehearse an approval', title: 'Ask your co-pilot. Keep the final say.', copy: 'Give Claude Code or Codex an instruction in the desktop app. Review sensitive live-action requests before they reach the stage.', hint: 'Try the labeled approval walkthrough. No LLM is connected on this page.', kind: 'Real app capture + guided walkthrough' },
];

export function galleryHTML(entries) {
  const features = galleryFeatures.filter(feature => entries.some(entry => entry.slug === feature.slug && entry.slides > feature.slide));
  if (!features.length) return '<p>No featured presentations have been deployed yet.</p>';
  return `<div class="proof-gallery" data-gallery>
    <div class="gallery-choices" role="tablist" aria-label="Explore presentation capabilities">${features.map((feature, index) => `<button type="button" role="tab" id="tab-${feature.id}" aria-controls="panel-${feature.id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-gallery-choice="${feature.id}"><strong>${feature.label}</strong><span>${feature.action}</span></button>`).join('')}</div>
    ${features.map((feature, index) => `<article id="panel-${feature.id}" role="tabpanel" aria-labelledby="tab-${feature.id}" data-gallery-panel="${feature.id}" ${index ? 'hidden' : ''}>
      <div class="gallery-summary"><h3>${feature.title}</h3><p>${feature.copy}</p></div>
      <div class="deck-preview" data-live-preview-shell>
        <div class="deck-preview-stage">
          <img class="gallery-poster" src="./assets/gallery-${feature.id}.jpg" width="1280" height="720" loading="lazy" alt="${feature.kind}: ${feature.title}">
          <iframe data-live-preview data-src="./gallery/${feature.id}.html?gamma-preview=1&amp;gamma-clean=gallery" title="${feature.kind}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <div class="gallery-controls"><button type="button" data-play-preview>Play ${feature.label} preview</button><span data-preview-status role="status">${feature.kind} · paused</span><a href="./${feature.slug}/#/${feature.slide}" aria-label="Open the full ${feature.label} demo">Open full presentation <b aria-hidden="true">↗</b></a></div>
      </div>
      <p class="gallery-instruction">${feature.hint}</p>
    </article>`).join('')}
    <p class="gallery-resource-note">One preview runs at a time. Offscreen previews stop; reduced-motion visitors choose when to play.</p>
  </div>`;
}

export function galleryCSS() {
  return `
    .decks{padding:72px 0}.deck-intro{display:grid;grid-template-columns:1fr 1fr;align-items:end;gap:32px;margin-bottom:32px}.deck-intro h2{max-width:16ch;font-size:clamp(2rem,4vw,3rem);letter-spacing:-.035em;line-height:1.05}.deck-intro p{margin:0;max-width:55ch;color:#62646b}
    .gallery-choices{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-block:1px solid #cfc9bd;margin-bottom:28px}.gallery-choices button{position:relative;min-height:88px;padding:16px 12px;border:0;background:transparent;color:#62646b;font:inherit;cursor:pointer;text-align:left}.gallery-choices button strong{display:block;font-size:1rem;color:#111318}.gallery-choices button span{display:block;margin-top:6px;font-size:.75rem}.gallery-choices button:hover{background:#fbf9f3}.gallery-choices button[aria-selected=true]{background:#fbf9f3;color:#1748d5;box-shadow:inset 0 -3px #1748d5}.gallery-choices button[aria-selected=true] strong{color:#1748d5}
    .proof-gallery [hidden]{display:none!important}.gallery-summary{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;margin-bottom:24px}.gallery-summary h3{margin:0;max-width:25ch;font-size:1.5rem;font-weight:650;line-height:1.2;letter-spacing:-.025em}.gallery-summary p{margin:0;color:#62646b;font-size:1rem;line-height:1.5}
    .deck-preview{border:1px solid #cfc9bd;background:#fbf9f3}.deck-preview-stage{position:relative;aspect-ratio:16/9;overflow:hidden;background:#f3f0e8}.gallery-poster{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain}.deck-preview-stage iframe{position:absolute;inset:0;width:1280px;height:720px;border:0;transform:scale(var(--gallery-scale,1));transform-origin:top left;opacity:0;visibility:hidden}.deck-preview[data-live-ready] iframe{opacity:1;visibility:visible}.deck-preview[data-live-ready] .gallery-poster{visibility:hidden}
    .gallery-controls{display:flex;align-items:center;gap:18px;padding:12px 18px;border-top:1px solid #cfc9bd;min-height:68px}.gallery-controls button{min-height:44px;padding:10px 16px;border:1px solid #1748d5;border-radius:4px;background:#1748d5;color:#fff;font:650 .875rem Instrument,system-ui,sans-serif;cursor:pointer}.gallery-controls button:hover{background:#111318}.gallery-controls span{font-size:.75rem;color:#62646b}.gallery-controls a{margin-left:auto;font-size:.875rem;font-weight:650;text-decoration:none;white-space:nowrap}.gallery-controls a b{color:#1748d5}.proof-gallery button:focus-visible{outline:2px solid #1748d5;outline-offset:4px}.gallery-instruction{margin:12px 0 0;font-size:.875rem;color:#62646b}.gallery-resource-note{margin:28px 0 0;padding-top:18px;border-top:1px solid #cfc9bd;color:#62646b;font-size:.75rem}.workflow-illustration{margin:24px 0 0}.workflow-illustration img{display:block;width:100%;height:auto}.workflow-illustration figcaption{margin-top:8px;font-size:.75rem;color:#62646b}
    @media(max-width:850px){.gallery-choices{grid-template-columns:repeat(3,minmax(0,1fr))}.gallery-summary,.deck-intro{grid-template-columns:1fr;gap:12px}.gallery-summary h3{max-width:none}.gallery-controls{flex-wrap:wrap;gap:8px 16px}.gallery-controls span{order:3;width:100%}}
    @media(max-width:590px){.decks{padding:48px 0}.gallery-choices{margin-bottom:20px}.gallery-choices button{min-height:84px;padding:12px 8px}.gallery-choices button strong{font-size:.875rem}.gallery-choices button span{font-size:.75rem;line-height:1.3}.gallery-summary h3{font-size:1.5rem}.gallery-summary p{font-size:.875rem}.gallery-controls{padding:12px}.gallery-controls a{display:flex;align-items:center;min-height:44px;white-space:normal;font-size:.75rem}.gallery-controls button{padding:8px 10px;font-size:.75rem}.gallery-instruction{font-size:.75rem}
      :is(#panel-browser,#panel-ai) .deck-preview-stage iframe{width:100%;height:100%;transform:none}
      :is(#panel-browser,#panel-ai) .deck-preview[data-live-ready] .deck-preview-stage{aspect-ratio:auto;height:900px}
    }
  `;
}

// Kept as a function so the emitted script is parsed by the same JS toolchain.
export function galleryRuntime() {
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  const tabs = [...gallery.querySelectorAll('[data-gallery-choice]')];
  const panels = [...gallery.querySelectorAll('[data-gallery-panel]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = panels[0], activePreview, readinessTimer, visible = false, paused = false;
  const resize = new ResizeObserver(entries => entries.forEach(({ target, contentRect }) => {
    target.style.setProperty('--gallery-scale', String(contentRect.width / 1280));
  }));
  gallery.querySelectorAll('.deck-preview-stage').forEach(stage => resize.observe(stage));
  function stop() {
    clearInterval(readinessTimer);
    if (activePreview) {
      const shell = activePreview.closest('[data-live-preview-shell]');
      activePreview.removeAttribute('src');
      shell.removeAttribute('data-live-ready');
      shell.querySelector('[data-play-preview]').textContent = 'Play preview';
      shell.querySelector('[data-preview-status]').textContent = `${activePreview.title} · paused`;
    }
    activePreview = null;
  }
  function play() {
    const frame = selected.querySelector('[data-live-preview]');
    if (activePreview === frame) return;
    stop();
    activePreview = frame;
    const shell = frame.closest('[data-live-preview-shell]');
    shell.querySelector('[data-preview-status]').textContent = 'Loading the live runtime…';
    shell.querySelector('[data-play-preview]').textContent = 'Pause preview';
    // The gallery deliberately defers inactive previews. Once this preview is
    // selected, however, it has a bounded readiness window and must not remain
    // queued by the browser's native lazy-loading heuristic.
    frame.loading = 'eager';
    frame.src = frame.dataset.src;
    const started = Date.now();
    readinessTimer = setInterval(() => {
      let ready = false;
      try { ready = Boolean(frame.contentWindow.__GAMMA_READY__); } catch { /* bounded fallback below */ }
      if (ready) {
        shell.setAttribute('data-live-ready', '');
        shell.querySelector('[data-preview-status]').textContent = frame.title;
        clearInterval(readinessTimer);
      } else if (Date.now() - started > 20000) {
        stop();
        paused = true;
        shell.querySelector('[data-preview-status]').textContent = 'Preview unavailable. Retry or open the full presentation.';
      }
    }, 100);
  }
  function select(tab) {
    stop();
    tabs.forEach(item => { const active = item === tab; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; });
    panels.forEach(panel => { panel.hidden = panel.dataset.galleryPanel !== tab.dataset.galleryChoice; if (!panel.hidden) selected = panel; });
    if (visible && !reduced.matches && !paused) play();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault(); tabs[next].focus(); select(tabs[next]);
    });
  });
  gallery.querySelectorAll('[data-play-preview]').forEach(button => button.addEventListener('click', () => {
    if (activePreview) { paused = true; stop(); } else { paused = false; play(); }
  }));
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible || document.hidden) stop();
    else if (!reduced.matches && !paused) play();
  }, { threshold: 0 }).observe(gallery);
  reduced.addEventListener('change', () => { stop(); if (!reduced.matches && visible && !paused) play(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (visible && !reduced.matches && !paused) play();
  });
}

export function renderGallerySlide(deck, feature) {
  const source = deck.slides[feature.slide];
  if (!source) throw new Error(`Gallery source is missing: ${feature.slug} slide ${feature.slide + 1}`);
  const focused = { ...deck, theme: 'analyst-proof', meta: { ...deck.meta, experience: false }, slides: [source] };
  const css = `<style id="gallery-slide-fit">
    .footer-bar,.watermark,.gamma-progress-hud,.gamma-orbit,.gamma-theme-switcher{display:none!important}body:before,body:after,.reveal:before,.reveal:after{display:none!important}
    html.gamma-clean-stage body .archify-controls,html.gamma-clean-stage body .archify-reading>label,html.gamma-clean-stage body .spatial-toolbar{display:flex!important}
    .reveal{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}.reveal .slides{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;transform:none!important;zoom:1!important}
    .reveal .slides>section{box-sizing:border-box!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;transform:none!important;padding:28px 36px!important;overflow:hidden!important;display:flex!important;flex-direction:column;gap:0;justify-content:flex-start!important;text-align:left}
    .reveal .slides>section:before,.reveal .slides>section:after,.reveal .slides>section>.slide-header,.reveal .slides>section>h2,.reveal .slides>section>.slide-subtitle,.slide-source,.gamma-footer,.gamma-watermark,.experience-masthead,.experience-nav,.reveal .controls,.reveal .progress,.reveal .slide-number{display:none!important}
    .archify-slide{width:100%;height:100%;min-height:0;gap:14px}.archify-canvas{min-height:0;flex:1}.archify-data{display:none}.archify-controls{border-radius:4px}.archify-reading{grid-template-columns:250px 1fr}
    .immersive-chart{height:100%;flex:1;min-height:0}.spatial-body{grid-template-columns:220px minmax(0,1fr);gap:20px}.spatial-toolbar{flex-shrink:0}.spatial-inspector{overflow:hidden}.spatial-status{display:none}.spatial-hint{margin-top:auto!important;font-size:.875rem!important}
    .studio-content-slide:has(.studio-youtube-media){height:100%;padding:0!important;display:flex!important;align-items:center;justify-content:center;gap:0!important}.studio-content-slide:has(.studio-youtube-media)>:not(.studio-youtube-media){display:none!important}
    .studio-content-slide>.studio-youtube-media{width:1152px!important;height:648px!important;max-width:100%!important;max-height:100%!important;flex:none;aspect-ratio:16/9!important}
  </style>`;
  return renderDeck(focused).replace('</head>', `${css}</head>`);
}
