function text(value, limit = 180) { return String(value ?? '').trim().slice(0, limit); }

function escapeAttribute(value) {
  return text(value, 2_000).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A public HTTPS URL is required: embeds must never turn a local file or localhost into a share link. */
export function publicPresentationUrl(value) {
  let parsed;
  try { parsed = new URL(String(value || '')); } catch { throw new Error('A valid public HTTPS presentation URL is required.'); }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const octets = /^\d+\.\d+\.\d+\.\d+$/.test(host) ? host.split('.').map(Number) : null;
  const privateV4 = octets && (octets[0] === 0 || octets[0] === 10 || octets[0] === 127 || octets[0] >= 224
    || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
    || (octets[0] === 198 && [18, 19].includes(octets[1])));
  const privateV6 = host.startsWith('[') && !/^\[[23][0-9a-f]{3}:/.test(host);
  if (parsed.protocol !== 'https:' || !host || parsed.username || parsed.password || String(value).length > 2000
    || privateV4 || privateV6 || /(?:^|\.)(?:localhost|local)$/.test(host) || (!host.includes('.') && !host.startsWith('['))) {
    throw new Error('Embed and share links must use a public HTTPS URL, never a local address.');
  }
  return parsed.toString();
}

function dimensions(aspectRatio) {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(String(aspectRatio || '16:9'));
  if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) throw new Error('Aspect ratio must look like 16:9.');
  return `${Number(match[1])} / ${Number(match[2])}`;
}

export function presentationEmbed({ url, title = 'Gamma Presenter presentation', aspectRatio = '16:9' } = {}) {
  const publicUrl = publicPresentationUrl(url);
  const safeTitle = escapeAttribute(text(title, 160) || 'Gamma Presenter presentation');
  return `<iframe src="${escapeAttribute(publicUrl)}" title="${safeTitle}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="width:100%;aspect-ratio:${dimensions(aspectRatio)};border:0"></iframe>`;
}

/** Provider-neutral copy for services which either render an iframe (Notion) or unfurl a URL (Linear). */
export function presentationShareKit({ url, title, aspectRatio = '16:9' } = {}) {
  const publicUrl = publicPresentationUrl(url);
  const label = text(title, 160) || 'Gamma Presenter presentation';
  return {
    url: publicUrl,
    iframe: presentationEmbed({ url: publicUrl, title: label, aspectRatio }),
    notion: `Paste this public URL into Notion, then choose “Embed” when Notion offers it:\n${publicUrl}`,
    linear: `[${label}](${publicUrl})`,
    staticHost: 'Upload the generated static-site directory to any HTTPS static host. Configure a catch-all only if your host requires one; Gamma Presenter itself uses index.html.',
    vercel: 'Run `vercel login`, then deploy the generated static-site directory with `vercel --prod`. Gamma Presenter never stores your Vercel token.',
  };
}
