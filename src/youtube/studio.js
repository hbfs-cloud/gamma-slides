import express from 'express';
import { randomBytes } from 'crypto';
import open from 'open';
import { escapeHtml } from '../engine/html.js';
import { YOUTUBE_CATEGORIES } from './upload.js';

function localDateTimeValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}"${selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

export function renderYouTubeStudioHTML({ deck, channel, playlists, token }) {
  const youtube = deck.video?.youtube || {};
  const meta = deck.meta || {};
  const selectedPlaylist = playlists.find(item => item.id === youtube.playlist_id || item.title === youtube.playlist);
  const scheduleValue = localDateTimeValue(youtube.publish_at);
  const tags = (youtube.tags || meta.tags || []).join(', ');
  const playlistOptions = [
    option('', 'No playlist', !selectedPlaylist && !youtube.playlist),
    ...playlists.map(item => option(item.id, `${item.title} · ${item.itemCount} videos`, item.id === selectedPlaylist?.id)),
    option('__new__', '＋ Create a new playlist (matching visibility)', !selectedPlaylist && Boolean(youtube.playlist)),
  ].join('');
  const categoryOptions = Object.keys(YOUTUBE_CATEGORIES)
    .map(category => option(category, category, category === (youtube.category || 'Education')))
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>YouTube Publisher · Gamma Slides</title>
  <style>
    :root{color-scheme:dark;--ink:#0b0f17;--panel:#121824;--line:#293140;--muted:#8f99a9;--paper:#f4f1e9;--blue:#4d70ff;--green:#31c7a4;--red:#ff6860}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0,#1c2840 0,transparent 34%),var(--ink);color:var(--paper);font:15px/1.45 Inter,ui-sans-serif,system-ui,sans-serif}.shell{width:min(1120px,calc(100% - 40px));margin:36px auto 64px}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:28px}.brand{font:600 12px/1.2 ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em;text-transform:uppercase;color:#98a9ff}.top h1{margin:12px 0 8px;max-width:720px;font-size:42px;line-height:1.03;letter-spacing:-.04em}.lede{margin:0;color:var(--muted);font-size:16px}.channel{display:flex;align-items:center;gap:11px;border:1px solid var(--line);padding:10px 13px;background:#111722}.channel img{width:34px;height:34px;border-radius:50%}.channel small{display:block;color:var(--muted)}form{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,.85fr);gap:18px}.card{background:color-mix(in srgb,var(--panel) 94%,transparent);border:1px solid var(--line);padding:24px}.card h2{margin:0 0 19px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#cbd3df}.stack{display:grid;gap:16px}.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}label{display:grid;gap:7px;color:#cad1dd;font-size:12px;font-weight:650;letter-spacing:.02em}input,textarea,select{width:100%;border:1px solid #354054;background:#0d121c;color:var(--paper);padding:12px 13px;border-radius:3px;font:inherit;outline:none}input:focus,textarea:focus,select:focus{border-color:var(--blue);box-shadow:0 0 0 3px #4d70ff24}textarea{min-height:170px;resize:vertical}.hint{font-size:11px;color:var(--muted);font-weight:400}.switch{display:flex;gap:10px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}.switch input{width:16px;height:16px}.switch span{display:block}.switch small{display:block;color:var(--muted);margin-top:2px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:18px}.summary div{padding:14px;background:#101620}.summary strong{display:block;font-size:19px}.summary small{color:var(--muted)}.actions{display:flex;gap:10px;margin-top:4px}.primary,.secondary{border:0;padding:13px 16px;font-weight:750;border-radius:3px;cursor:pointer;text-decoration:none;text-align:center}.primary{flex:1;background:var(--blue);color:white}.secondary{background:#1c2432;color:#c8d0dd}.notice{padding:14px;border-left:3px solid var(--green);background:#11201e;color:#b7c9c5;font-size:12px}.storage{display:grid;grid-template-columns:auto 1fr;gap:10px;margin-top:16px;color:var(--muted);font-size:12px}.storage b{color:var(--green)}@media(max-width:800px){form{grid-template-columns:1fr}.top{display:grid}.row{grid-template-columns:1fr}.top h1{font-size:34px}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="top">
      <div><div class="brand">Gamma Slides / YouTube Publisher</div><h1>Turn the board deck into a scheduled broadcast.</h1><p class="lede">Review the publishing brief. Rendering, upload and cleanup run as one controlled pipeline.</p></div>
      <div class="channel">${channel?.thumbnail ? `<img src="${escapeHtml(channel.thumbnail)}" alt="">` : ''}<div><small>Authenticated channel</small><strong>${escapeHtml(channel?.title || 'YouTube')}</strong></div></div>
    </header>
    <form method="post" action="/publish">
      <input type="hidden" name="token" value="${escapeHtml(token)}">
      <section class="card stack">
        <h2>Editorial brief</h2>
        <label>Title <span class="hint">100 characters maximum</span><input name="title" maxlength="100" required value="${escapeHtml(youtube.title || meta.title || 'Presentation')}"></label>
        <label>Description <span class="hint">Chapters are generated from slide titles</span><textarea name="description">${escapeHtml(youtube.description || meta.description || '')}</textarea></label>
        <label>Tags <span class="hint">Comma-separated</span><input name="tags" value="${escapeHtml(tags)}"></label>
        <div class="row">
          <label>Category<select name="category">${categoryOptions}</select></label>
          <label>Playlist<select name="playlistId" id="playlist">${playlistOptions}</select></label>
        </div>
        <label id="new-playlist" style="display:none">New playlist title<input name="playlistTitle" value="${escapeHtml(youtube.playlist || '')}" placeholder="Finance & Markets"></label>
      </section>
      <aside class="stack">
        <section class="card stack">
          <h2>Release controls</h2>
          <label>Visibility<select name="privacy">${['unlisted', 'private', 'public'].map(value => option(value, value[0].toUpperCase() + value.slice(1), value === (youtube.privacy || 'unlisted'))).join('')}</select></label>
          <div class="switch"><input type="checkbox" id="scheduleEnabled" name="scheduleEnabled"${scheduleValue ? ' checked' : ''}><label for="scheduleEnabled"><span>Schedule publication</span><small>YouTube keeps scheduled videos private until this date.</small></label></div>
          <label>Local publication date<input type="datetime-local" name="publishAt" id="publishAt" value="${escapeHtml(scheduleValue)}"></label>
          <div class="row">
            <label>Thumbnail slide<input type="number" name="thumbnailSlide" min="1" max="${deck.slides.length}" value="${Number(deck.video?.thumbnail?.slide || 0) + 1}"></label>
            <label>Overlay<input name="thumbnailText" maxlength="80" value="${escapeHtml(deck.video?.thumbnail?.text_overlay || '')}"></label>
          </div>
          <div class="switch"><input type="checkbox" id="keepVideo" name="keepVideo"><label for="keepVideo"><span>Keep a local MP4</span><small>Off by default to protect disk space.</small></label></div>
          <div class="notice">OAuth grants access to your channel without exposing an API key or client secret in this page.</div>
        </section>
        <section class="card">
          <h2>Pipeline</h2>
          <div class="summary"><div><strong>${deck.slides.length}</strong><small>slides</small></div><div><strong>1080p</strong><small>master</small></div><div><strong>Auto</strong><small>cleanup</small></div></div>
          <div class="storage"><b>●</b><span>Rolling render: frames and narration are deleted slide by slide. Only compressed segments and the upload master coexist.</span></div>
          <div class="actions"><a class="secondary" href="/cancel">Cancel</a><button class="primary" type="submit">Create & publish</button></div>
        </section>
      </aside>
    </form>
  </main>
  <script>
    const playlist = document.getElementById('playlist');
    const newPlaylist = document.getElementById('new-playlist');
    const schedule = document.getElementById('scheduleEnabled');
    const publishAt = document.getElementById('publishAt');
    function syncPlaylist(){newPlaylist.style.display=playlist.value==='__new__'?'grid':'none'}
    function syncSchedule(){publishAt.disabled=!schedule.checked;publishAt.required=schedule.checked}
    playlist.addEventListener('change',syncPlaylist);schedule.addEventListener('change',syncSchedule);syncPlaylist();syncSchedule();
  <\/script>
</body>
</html>`;
}

export function renderPublishingHTML(token) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Publishing · Gamma Slides</title>
  <style>
    :root{color-scheme:dark;--ink:#0b0f17;--panel:#121824;--line:#293140;--muted:#8f99a9;--paper:#f4f1e9;--blue:#4d70ff;--green:#31c7a4;--red:#ff6860}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px;background:radial-gradient(circle at 78% 0,#1c2840 0,transparent 34%),var(--ink);color:var(--paper);font:15px/1.45 Inter,ui-sans-serif,system-ui,sans-serif}.card{width:min(760px,100%);padding:34px;border:1px solid var(--line);background:color-mix(in srgb,var(--panel) 94%,transparent)}.eyebrow{color:#98a9ff;font:700 11px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}h1{margin:15px 0 10px;font-size:38px;line-height:1.04;letter-spacing:-.045em}p{margin:0;color:var(--muted)}.progress{height:8px;margin:34px 0 16px;overflow:hidden;background:#202838}.bar{width:0;height:100%;background:linear-gradient(90deg,var(--blue),#7890ff);transition:width .35s ease}.status{display:flex;justify-content:space-between;gap:20px;align-items:baseline}.status strong{font-size:15px}.status b{font:700 13px ui-monospace,monospace;color:#aebaff}.detail{min-height:21px;margin-top:7px;color:var(--muted);font-size:13px}.log{max-height:180px;margin-top:26px;padding-top:18px;border-top:1px solid var(--line);overflow:auto;color:#778396;font:11px/1.65 ui-monospace,monospace}.log div:last-child{color:#c1cad8}.result{display:none;margin-top:28px;padding:18px;border-left:3px solid var(--green);background:#10201d}.result.is-visible{display:block}.result a{display:inline-block;margin-top:10px;color:#91a5ff;font-weight:750;text-decoration:none}.error{border-color:var(--red);background:#251516}.error a{color:#ff9b94}
  </style>
</head>
<body><main class="card"><div class="eyebrow">Gamma Slides / Broadcast pipeline</div><h1>Creating your YouTube broadcast.</h1><p>Keep this page open to follow rendering, upload, and cleanup in real time.</p><div class="progress"><div class="bar"></div></div><div class="status"><strong>Preparing secure workspace</strong><b>0%</b></div><div class="detail">The local master is temporary unless you chose to keep it.</div><div class="log"></div><section class="result"><strong></strong><div></div><a target="_blank" rel="noopener">Open on YouTube</a></section></main>
<script>
  const bar=document.querySelector('.bar'),status=document.querySelector('.status strong'),percent=document.querySelector('.status b'),detail=document.querySelector('.detail'),log=document.querySelector('.log'),result=document.querySelector('.result');
  const stages={thumbnail:'Creating thumbnail',render:'Rendering slides and narration',assemble:'Assembling upload master',upload:'Streaming to YouTube',cleanup:'Releasing temporary storage'};
  const addLog=text=>{const line=document.createElement('div');line.textContent=text;log.appendChild(line);log.scrollTop=log.scrollHeight};
  const events=new EventSource('/__gamma/progress?token=${escapeHtml(token)}');
  events.addEventListener('progress',event=>{const data=JSON.parse(event.data);const value=Math.max(0,Math.min(100,Number(data.overallPercent||0)));bar.style.width=value+'%';percent.textContent=Math.round(value)+'%';status.textContent=stages[data.stage]||'Publishing';detail.textContent=data.detail||'';addLog(status.textContent+(data.current&&data.total?' · '+data.current+'/'+data.total:'')+(data.detail?' · '+data.detail:''))});
  events.addEventListener('done',event=>{const data=JSON.parse(event.data);bar.style.width='100%';percent.textContent='100%';status.textContent='Published successfully';detail.textContent=data.publishAt?'Scheduled for '+new Date(data.publishAt).toLocaleString():'The video is now in your YouTube channel.';result.classList.add('is-visible');result.querySelector('strong').textContent='Broadcast ready';const link=result.querySelector('a');link.href=data.videoUrl;events.close();addLog('Temporary workspace released')});
  events.addEventListener('failed',event=>{const data=JSON.parse(event.data);status.textContent='Publication failed';detail.textContent=data.message||'Unknown error';result.classList.add('is-visible','error');result.querySelector('strong').textContent='Action required';result.querySelector('div').textContent='Return to the terminal for diagnostics. Temporary assets have been released.';result.querySelector('a').remove();events.close()});
<\/script></body></html>`;
}

function parsePublishForm(body) {
  const playlistIsNew = body.playlistId === '__new__';
  const publishAt = body.scheduleEnabled ? new Date(body.publishAt) : null;
  if (publishAt && Number.isNaN(publishAt.getTime())) throw new Error('Invalid publication date');
  if (publishAt && publishAt.getTime() <= Date.now()) throw new Error('The publication date must be in the future');
  if (playlistIsNew && !String(body.playlistTitle || '').trim()) throw new Error('A title is required for the new playlist');
  return {
    title: String(body.title || '').trim(),
    description: String(body.description || ''),
    tags: String(body.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
    category: String(body.category || 'Education'),
    playlistId: playlistIsNew ? null : String(body.playlistId || '') || null,
    playlist: playlistIsNew ? String(body.playlistTitle || '').trim() || null : null,
    createPlaylist: playlistIsNew,
    privacy: String(body.privacy || 'unlisted'),
    publishAt: publishAt?.toISOString() || null,
    thumbnailSlide: Math.max(0, Number.parseInt(body.thumbnailSlide || '1', 10) - 1),
    thumbnailText: String(body.thumbnailText || '').trim() || null,
    keepVideo: body.keepVideo === 'on',
  };
}

export async function openYouTubeStudio({ deck, channel, playlists }) {
  const token = randomBytes(24).toString('hex');
  const app = express();
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));

  return new Promise((resolveOptions, rejectOptions) => {
    let settled = false;
    let server;
    const progressClients = new Set();
    let latestProgress = null;
    let finalEvent = null;
    const closeServer = () => {
      for (const client of progressClients) client.end();
      progressClients.clear();
      server?.close();
    };
    const finish = (callback, value, close = true) => {
      if (settled) return;
      settled = true;
      if (close) setTimeout(closeServer, 200);
      callback(value);
    };
    const broadcast = (type, value) => {
      const payload = `event: ${type}\ndata: ${JSON.stringify(value)}\n\n`;
      for (const client of progressClients) client.write(payload);
    };
    const report = event => {
      const stage = event?.stage || 'render';
      const stagePercent = Math.max(0, Math.min(100, Number(event?.percent || 0)));
      const overallPercent = stage === 'thumbnail' ? 3 + stagePercent * 0.04
          : stage === 'render' ? 7 + stagePercent * 0.63
          : stage === 'assemble' || stage === 'complete' ? 70 + stagePercent * 0.08
            : stage === 'upload' ? 78 + stagePercent * 0.21
              : stage === 'cleanup' ? 99 : stagePercent;
      latestProgress = { ...event, stage: stage === 'complete' ? 'assemble' : stage, overallPercent };
      broadcast('progress', latestProgress);
    };
    const complete = result => {
      broadcast('progress', { stage: 'cleanup', overallPercent: 99, detail: 'Removing bounded temporary workspace' });
      finalEvent = { type: 'done', value: { videoUrl: result.videoUrl, publishAt: result.publishAt || null } };
      broadcast(finalEvent.type, finalEvent.value);
      setTimeout(closeServer, 750);
    };
    const fail = error => {
      finalEvent = { type: 'failed', value: { message: error?.message || String(error) } };
      broadcast(finalEvent.type, finalEvent.value);
      setTimeout(closeServer, 750);
    };

    app.get('/', (_request, response) => {
      response.type('html').send(renderYouTubeStudioHTML({ deck, channel, playlists, token }));
    });
    app.get('/__gamma/progress', (request, response) => {
      if (request.query.token !== token) return response.status(403).end();
      response.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-store', Connection: 'keep-alive' });
      response.flushHeaders();
      progressClients.add(response);
      if (latestProgress) response.write(`event: progress\ndata: ${JSON.stringify(latestProgress)}\n\n`);
      if (finalEvent) response.write(`event: ${finalEvent.type}\ndata: ${JSON.stringify(finalEvent.value)}\n\n`);
      request.on('close', () => progressClients.delete(response));
    });
    app.get('/cancel', (_request, response) => {
      response.type('html').send('<h1 style="font-family:system-ui">Publication cancelled. You can close this tab.</h1>');
      finish(rejectOptions, new Error('YouTube publication cancelled'));
    });
    app.post('/publish', (request, response) => {
      try {
        if (request.body.token !== token) return response.status(403).send('Invalid session token');
        const options = parsePublishForm(request.body);
        if (!options.title) return response.status(400).send('A title is required');
        response.type('html').send(renderPublishingHTML(token));
        finish(resolveOptions, { settings: options, report, complete, fail, close: closeServer }, false);
      } catch (error) {
        response.status(400).send(escapeHtml(error.message));
      }
    });

    server = app.listen(0, '127.0.0.1', async () => {
      try {
        const address = server.address();
        const url = `http://127.0.0.1:${address.port}`;
        console.log(`  YouTube Publisher: ${url}`);
        await open(url);
      } catch (error) {
        finish(rejectOptions, error);
      }
    });
    server.once('error', error => finish(rejectOptions, error));
  });
}
