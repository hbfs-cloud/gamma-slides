import { escapeHtml } from '../html.js';

/** Large, deliberately sparse scenes for a fixed 16:9 recording. */
export function renderVideoStory(slide) {
  if (slide.variant !== 'video-story') return null;
  const composition = ['brief', 'sequence', 'evidence', 'decisions'].includes(slide.composition) ? slide.composition : 'evidence';
  const items = (slide.items || []);
  return `<article class="video-story video-story-${composition}" data-camera="${slide.scene?.camera?.visible === true}">
    <h2>${escapeHtml(slide.title || '')}</h2>
    <div class="video-story-body">
      ${slide.subtitle ? `<p class="video-story-message">${escapeHtml(slide.subtitle)}</p>` : ''}
      ${items.length ? `<ol class="video-story-points">${items.map((item, i) => `<li>${composition === 'sequence' ? `<span class="video-story-step" aria-hidden="true">${i + 1}</span>` : ''}<div>${item.title ? `<strong>${escapeHtml(item.title)}</strong>` : ''}${item.text ? `<span>${escapeHtml(item.text)}</span>` : ''}</div></li>`).join('')}</ol>` : ''}
      ${slide.quote ? `<pre class="video-story-code"><code>${escapeHtml(slide.quote)}</code></pre>` : ''}
    </div>
    ${slide.source ? `<p class="video-story-source">${escapeHtml(slide.source)}</p>` : ''}
  </article>`;
}

export function videoStoryCSS() { return `
  body.gamma-experience .reveal .slides > section.variant-video-story { text-align:left; padding:40px 64px 56px; }
  body.gamma-experience .reveal .slides .video-story { position:relative; display:flex; flex-direction:column; min-height:560px; height:100%; font-family:Archivo,system-ui,sans-serif; }
  body.gamma-experience .reveal .slides .video-story h2 { margin:0; max-width:1120px; color:var(--gamma-text); font:550 64px/1.06 Archivo,system-ui,sans-serif; letter-spacing:-.035em; text-wrap:balance; }
  body.gamma-experience .reveal .slides .video-story-body { margin-top:42px; }
  body.gamma-experience .reveal .slides .video-story-message { max-width:1020px; margin:0; color:var(--gamma-text); font:450 52px/1.2 Archivo,system-ui,sans-serif; text-wrap:balance; }
  body.gamma-experience .reveal .slides .video-story[data-camera="true"] .video-story-body { max-width:880px; }
  body.gamma-experience .reveal .slides .video-story-brief { justify-content:center; }
  body.gamma-experience .reveal .slides .video-story-brief h2 { max-width:1030px; font:400 88px/1.05 "Source Serif 4",Georgia,serif; letter-spacing:-.025em; }
  body.gamma-experience .reveal .slides .video-story-brief .video-story-message { color:var(--gamma-primary); font-size:48px; }
  body.gamma-experience .reveal .slides .video-story-points { display:flex; flex-direction:column; gap:22px; margin:0; padding:0; list-style:none; }
  body.gamma-experience .reveal .slides .video-story-points li { display:flex; gap:26px; align-items:baseline; margin:0; padding:0; color:var(--gamma-text); }
  body.gamma-experience .reveal .slides .video-story-points strong,body.gamma-experience .reveal .slides .video-story-points li div>span { display:block; font:500 52px/1.15 Archivo,system-ui,sans-serif; }
  body.gamma-experience .reveal .slides .video-story-points li div>span { color:var(--gamma-muted); font-size:40px; margin-top:10px; }
  body.gamma-experience .reveal .slides .video-story-step { flex:none; width:40px; color:var(--gamma-primary); font:400 52px/1.1 "Source Serif 4",Georgia,serif; }
  body.gamma-experience .reveal .slides .video-story-code { margin:0; padding:26px 0; border:0; border-top:1px solid var(--experience-line,var(--gamma-muted)); background:transparent; box-shadow:none; color:var(--gamma-primary); font:500 48px/1.35 "Azeret Mono",monospace; white-space:pre-wrap; overflow-wrap:anywhere; width:100%; }
  body.gamma-experience .reveal .slides .video-story-code code { padding:0; background:transparent; color:inherit; font:inherit; white-space:inherit; max-height:none; }
  body.gamma-experience .reveal .slides .video-story-source { position:absolute; bottom:0; left:0; max-width:850px; margin:0; color:var(--gamma-muted); font:450 16px/1.4 Archivo,system-ui,sans-serif; }
  body.gamma-experience .reveal .slides > section.variant-video-closeup .slide-header h2 { font-size:64px; }
  body.gamma-experience .reveal .slides > section.variant-video-closeup .slide-subtitle { font-size:40px; line-height:1.2; }
  body.gamma-experience .reveal .slides > section.variant-video-closeup .archify-reading { display:none; }
  @media(max-width:900px) {
    body.gamma-experience .reveal .slides .video-story { min-height:560px; height:auto; padding-bottom:64px; }
    body.gamma-experience .reveal .slides .video-story h2,body.gamma-experience .reveal .slides .video-story-brief h2 { font-size:44px; }
    body.gamma-experience .reveal .slides .video-story-body { margin-top:32px; }
    body.gamma-experience .reveal .slides .video-story-message,body.gamma-experience .reveal .slides .video-story-brief .video-story-message { font-size:30px; }
    body.gamma-experience .reveal .slides .video-story-points strong,body.gamma-experience .reveal .slides .video-story-step { font-size:30px; }
    body.gamma-experience .reveal .slides .video-story-points li div>span { font-size:24px; }
    body.gamma-experience .reveal .slides .video-story-code { font-size:25px; }
    body.gamma-experience .reveal .slides .video-story-source { font-size:12px; }
    body.gamma-experience .reveal .slides > section.variant-video-closeup .slide-header h2 { font-size:36px; }
    body.gamma-experience .reveal .slides > section.variant-video-closeup .slide-subtitle { font-size:26px; }
  }
`; }
