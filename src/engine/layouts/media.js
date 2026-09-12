import {escapeHtml,safeUrl} from '../html.js';

const youtubeHosts = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com']);

/**
 * Convert only a public YouTube watch/embed/short URL to the privacy-enhanced
 * player URL. Keeping the host and ID allowlisted prevents an authored deck
 * from turning a media iframe into an arbitrary third-party embedding surface.
 */
export function youtubeEmbedUrl(value = '') {
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'https:') return '';
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const id = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : youtubeHosts.has(host)
        ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1]
        : '';
    if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return '';
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
  } catch {
    return '';
  }
}

export function renderMedia(slide){
 const m=slide.media||{};
 if(m.kind==='youtube'){
  const embed=youtubeEmbedUrl(m.src),watch=safeUrl(m.src),title=escapeHtml(m.alt||slide.title||'YouTube video');
  const player=embed
    ? `<iframe class="studio-youtube-media" src="${embed}" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
    : `<div class="studio-youtube-unavailable" role="status">This YouTube URL cannot be embedded. Open the source video instead.</div>`;
  return `<div class="studio-content-slide"><p class="studio-content-kicker">YouTube, embedded</p><h2>${escapeHtml(slide.title||'')}</h2>${player}<div class="studio-slide-actions">${watch?`<a href="${watch}" target="_blank" rel="noopener noreferrer">Open on YouTube</a>`:''}</div><p>${escapeHtml(m.caption||slide.subtitle||'')}</p></div>`;
 }
 const kind=m.kind==='audio'?'audio':'video';
 const src=/^data:(video|audio)\/[a-z0-9.+-]+;base64,/i.test(m.src||'')?escapeHtml(m.src):safeUrl(m.src);
 return `<div class="studio-content-slide"><p class="studio-content-kicker">${kind==='audio'?'Listen':'Watch in motion'}</p><h2>${escapeHtml(slide.title||'')}</h2><${kind} class="studio-slide-media" src="${src}" ${m.poster?`poster="${safeUrl(m.poster)}"`:''} controls playsinline preload="metadata" aria-label="${escapeHtml(m.alt||slide.title||kind)}">${m.captions?`<track kind="captions" src="${safeUrl(m.captions)}" srclang="${escapeHtml(m.language||'en')}" label="Captions" default>`:''}</${kind}><div class="studio-slide-actions"><button data-media="play">Play media</button><button data-media="back">Back 10 seconds</button><button data-media="mute" aria-pressed="false">Mute media audio</button></div><p>${escapeHtml(m.caption||slide.subtitle||'')}</p></div>`;
}
export function renderBrowser(slide){return `<div class="studio-content-slide"><p class="studio-content-kicker">Live demonstration</p><h2>${escapeHtml(slide.title||'')}</h2><p>${escapeHtml(slide.subtitle||'')}</p><p class="studio-site-address">${escapeHtml(slide.browser?.url||'')}</p><div class="studio-slide-actions"><button type="button" data-studio-browser-url="${safeUrl(slide.browser?.url)}">${escapeHtml(slide.browser?.label||'Open browser')}</button></div><p class="gamma-operator-only">M → Explorer → Open browser</p></div>`;}
