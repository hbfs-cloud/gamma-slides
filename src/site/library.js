import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { escapeHtml } from '../engine/html.js';
import { loadDeckFile } from '../loader/index.js';
import { buildStaticSite } from './build.js';
import { presentationSlug } from './github-pages.js';

function catalogHtml(entries) {
  const decks = entries.map(entry => `
    <article class="deck-entry">
      <p>${escapeHtml(entry.theme)} theme · ${entry.slides} slides</p>
      <h3>${escapeHtml(entry.title)}</h3>
      <a href="./${encodeURIComponent(entry.slug)}/">Open the live deck</a>
    </article>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="description" content="Gamma Presenter is the local macOS presentation studio for source-first decks, live visuals, recording, and operator-controlled AI co-piloting.">
  <title>Gamma Presenter — presentations that refuse to be flat</title>
  <style>
    @font-face{font-family:Instrument;src:url("./assets/instrument-sans-latin-wght-normal.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
    @font-face{font-family:SourceSerif;src:url("./assets/source-serif-4-latin-wght-normal.woff2") format("woff2");font-weight:200 900;font-style:normal;font-display:swap}
    :root{color:#F3F6F2;background:#05070A;font-family:Instrument,system-ui,sans-serif;font-synthesis:none}*{box-sizing:border-box}html{scroll-behavior:smooth}body{min-width:320px;margin:0;background:#05070A;color:#F3F6F2;line-height:1.5}a{color:inherit;text-decoration-thickness:1px;text-underline-offset:4px}a:hover{color:#8BA8FF}a:focus-visible{outline:2px solid #FFB000;outline-offset:5px}::selection{background:#315DFF;color:#fff}code{font-family:"Azeret Mono","SFMono-Regular",Consolas,monospace;font-size:.9em}.shell{width:min(1200px,calc(100% - 48px));margin:auto}.site-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 0;border-bottom:1px solid #26313D}.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;font-weight:760;letter-spacing:-.025em}.brand img{width:30px;height:30px}.site-header nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:18px;color:#A3ADB8;font-size:.88rem}.site-header nav a{text-decoration:none}.hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,.95fr);gap:clamp(40px,7vw,100px);align-items:center;padding:clamp(64px,10vw,136px) 0 96px}.hero-copy{max-width:670px}.hero h1,.section-heading h2,.story h2{margin:0;font-family:SourceSerif,Georgia,serif;font-weight:500;letter-spacing:-.04em;line-height:.96;text-wrap:balance}.hero h1{font-size:clamp(3.5rem,7.4vw,6.6rem)}.hero-copy>p{max-width:57ch;margin:29px 0 0;color:#C9D0D6;font-size:clamp(1.08rem,1.5vw,1.28rem);line-height:1.55}.actions{display:flex;flex-wrap:wrap;gap:13px;margin-top:34px}.action{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:1px solid #315DFF;background:#315DFF;color:#fff;text-decoration:none;font-weight:700;transition:background .18s ease,color .18s ease,transform .18s ease}.action:hover{background:#8BA8FF;color:#05070A;transform:translateY(-2px)}.action.secondary{border-color:#26313D;background:transparent;color:#F3F6F2}.action.secondary:hover{border-color:#8BA8FF;background:#0A0E13;color:#F3F6F2}.hero-proof{display:flex;flex-wrap:wrap;gap:9px;margin:28px 0 0;padding:0;list-style:none;color:#A3ADB8;font-size:.78rem}.hero-proof li{padding-right:10px;border-right:1px solid #26313D}.hero-proof li:last-child{border:0}.hero-figure{margin:0;animation:arrive .8s cubic-bezier(.16,1,.3,1) both}.hero-figure img{display:block;width:100%;height:auto;box-shadow:0 30px 78px rgba(0,0,0,.48)}.hero-figure figcaption,.visual figcaption{margin-top:13px;color:#A3ADB8;font-size:.78rem;line-height:1.45}.strip{border-top:1px solid #26313D;border-bottom:1px solid #26313D}.strip-inner{display:grid;grid-template-columns:repeat(3,1fr)}.strip-item{min-height:174px;padding:28px 30px 30px;border-right:1px solid #26313D}.strip-item:last-child{border:0}.strip-item h2{margin:0 0 12px;font-size:1.12rem;letter-spacing:-.025em}.strip-item p{max-width:31ch;margin:0;color:#A3ADB8;font-size:.94rem}.story{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:clamp(36px,8vw,130px);padding:clamp(86px,13vw,160px) 0}.story h2{font-size:clamp(2.65rem,5vw,4.9rem)}.story-copy{display:grid;align-content:start;gap:22px}.story-copy>p{max-width:57ch;margin:0;color:#C9D0D6;font-size:1.08rem}.capabilities{margin:13px 0 0;padding:0;list-style:none;border-top:1px solid #26313D}.capabilities li{display:grid;grid-template-columns:180px minmax(0,1fr);gap:22px;padding:17px 0;border-bottom:1px solid #26313D}.capabilities strong{font-size:.9rem}.capabilities span{color:#A3ADB8;font-size:.94rem}.visuals{display:grid;grid-template-columns:1.15fr .85fr;gap:30px;padding-bottom:clamp(88px,12vw,150px)}.visual{margin:0}.visual:nth-child(2){align-self:end}.visual img{display:block;width:100%;height:auto;box-shadow:0 24px 64px rgba(0,0,0,.42)}.contrast{padding:clamp(76px,10vw,132px) 0;border-top:1px solid #26313D;border-bottom:1px solid #26313D}.contrast-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.contrast-grid>div{padding:0 clamp(24px,5vw,70px) 0 0}.contrast-grid>div+div{padding:0 0 0 clamp(24px,5vw,70px);border-left:1px solid #26313D}.contrast h2{max-width:10ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.5rem,4.4vw,4.5rem);font-weight:500;letter-spacing:-.04em;line-height:.98}.contrast p{max-width:46ch;margin:25px 0 0;color:#C9D0D6;font-size:1.05rem}.contrast ul{margin:26px 0 0;padding:0;list-style:none}.contrast li{padding:12px 0;border-top:1px solid #26313D;color:#A3ADB8}.contrast li:last-child{border-bottom:1px solid #26313D}.deck-section{padding:clamp(84px,12vw,150px) 0}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:34px}.section-heading h2{max-width:13ch;font-size:clamp(2.7rem,5vw,5rem)}.section-heading p{max-width:40ch;margin:0;color:#A3ADB8}.deck-list{border-top:1px solid #26313D}.deck-entry{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:24px;align-items:center;padding:28px 0;border-bottom:1px solid #26313D}.deck-entry p{grid-column:1;margin:0 0 5px;color:#A3ADB8;font-family:"Azeret Mono",monospace;font-size:.7rem;letter-spacing:.045em;text-transform:uppercase}.deck-entry h3{margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(1.7rem,3vw,2.7rem);font-weight:500;letter-spacing:-.035em}.deck-entry a{grid-column:2;grid-row:1 / span 2;white-space:nowrap;font-size:.9rem;font-weight:700}.empty{margin:0;color:#A3ADB8}.start{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(36px,8vw,128px);padding:clamp(78px,11vw,140px) 0}.start h2{margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.7rem,4.8vw,4.8rem);font-weight:500;letter-spacing:-.04em;line-height:.98}.start p{max-width:39ch;color:#C9D0D6}.command{margin:0;padding:23px;overflow:auto;background:#0A0E13;color:#F3F6F2;font-size:.9rem;line-height:1.7;box-shadow:0 20px 50px rgba(0,0,0,.34)}.start-note{margin-top:18px;color:#A3ADB8;font-size:.88rem}.site-footer{display:flex;justify-content:space-between;gap:30px;padding:27px 0 42px;border-top:1px solid #26313D;color:#A3ADB8;font-size:.86rem}.site-footer nav{display:flex;flex-wrap:wrap;gap:17px}.site-footer a{color:#F3F6F2}@keyframes arrive{from{opacity:.2;clip-path:inset(8% 0 0 0);filter:blur(8px)}to{opacity:1;clip-path:inset(0);filter:blur(0)}}@media(max-width:860px){.hero,.story,.start{grid-template-columns:1fr}.hero{gap:45px}.hero-copy{max-width:720px}.hero-figure{max-width:760px}.story{gap:38px}.visuals{grid-template-columns:1fr;gap:36px}.visual:nth-child(2){max-width:78%;justify-self:end}.section-heading{display:block}.section-heading p{margin-top:21px}.strip-item{padding:24px 20px}.site-footer{display:block}.site-footer nav{margin-top:14px}}@media(max-width:620px){.shell{width:min(100% - 32px,1200px)}.site-header{align-items:flex-start}.site-header nav{justify-content:flex-start;gap:11px 15px}.hero{padding:52px 0 70px}.hero h1{font-size:clamp(3.05rem,15vw,4.75rem)}.strip-inner,.contrast-grid{grid-template-columns:1fr}.strip-item{min-height:auto;padding:25px 0;border-right:0;border-bottom:1px solid #26313D}.strip-item:last-child{border-bottom:0}.capabilities li{grid-template-columns:1fr;gap:5px}.contrast-grid>div,.contrast-grid>div+div{padding:0;border:0}.contrast-grid>div+div{margin-top:56px}.deck-entry{grid-template-columns:1fr;gap:17px}.deck-entry a{grid-column:1;grid-row:auto}.visual:nth-child(2){max-width:100%}.command{padding:17px;font-size:.78rem}.site-footer{padding-bottom:29px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.hero-figure{animation:none}.action{transition:none}.action:hover{transform:none}}
  </style>
</head>
<body>
  <header class="site-header shell">
    <a class="brand" href="./" aria-label="Gamma Presenter home"><img src="./assets/gamma-presenter-icon.svg" alt="">Gamma Presenter</a>
    <nav aria-label="Primary navigation"><a href="#workflow">Workflow</a><a href="#proof">Proof</a><a href="#decks">Live decks</a><a href="https://github.com/hbfs-cloud/gamma-slides">GitHub</a></nav>
  </header>
  <main>
    <section class="hero shell" aria-labelledby="hero-title">
      <div class="hero-copy">
        <h1 id="hero-title">Presentations that refuse to be flat.</h1>
        <p>Gamma Presenter is the local macOS studio for writing, shaping, presenting, recording, and co-animating source-first decks with live visuals.</p>
        <div class="actions"><a class="action" href="#get-started">Run it locally</a><a class="action secondary" href="https://github.com/hbfs-cloud/gamma-slides">Explore the source</a></div>
        <ul class="hero-proof" aria-label="Product qualities"><li>macOS desktop</li><li>Local-first</li><li>Bun-powered</li><li>MCP-ready</li></ul>
      </div>
      <figure class="hero-figure"><img src="./assets/gamma-presenter-control-room.png" alt="Gamma Presenter’s Author workspace with live timers, operator approvals, and local AI co-pilot controls" fetchpriority="high"><figcaption>The control room is part of the authoring surface—not an afterthought.</figcaption></figure>
    </section>
    <section class="strip" id="workflow" aria-label="Gamma Presenter workflow"><div class="strip-inner shell"><article class="strip-item"><h2>Write in durable source</h2><p>Markdown when speed matters; YAML and JSON when the visual needs real structure.</p></article><article class="strip-item"><h2>Keep the scene alive</h2><p>Media, charts, diagrams, GPU scenes, and animation remain first-class presentation content.</p></article><article class="strip-item"><h2>Run the room with intent</h2><p>Stage, speaker view, timers, cues, recording, and co-piloting are controlled where the work happens.</p></article></div></section>
    <section class="story shell" id="proof" aria-labelledby="story-title"><h2 id="story-title">The editor respects both the sentence and the system behind it.</h2><div class="story-copy"><p>Gamma Presenter lets a writer stay close to the story while giving a technical presenter a route to the full runtime. Its embedded preview renders the same Gamma deck that reaches the public stage.</p><ul class="capabilities"><li><strong>Author without flattening</strong><span>Create, duplicate, reorder, and edit slides while preserving advanced deck configuration.</span></li><li><strong>Bring real media</strong><span>Import images, GIFs, video, and audio into a portable project-local media folder.</span></li><li><strong>Show more than static slides</strong><span>Run ECharts, Archify, D3, Pixi, Three.js, animations, terminal scenes, and browser demonstrations.</span></li><li><strong>Keep the operator in control</strong><span>Use local timers, private cues, and loopback MCP with explicit approval for consequential live actions.</span></li></ul></div></section>
    <section class="visuals shell" aria-label="Gamma Presenter in use"><figure class="visual"><img src="./assets/gamma-presenter-author-rich.png" alt="Gamma Presenter editing a rich YAML deck with a rendered cinematic preview"><figcaption>Full-fidelity YAML and JSON decks stay editable beside their rendered output.</figcaption></figure><figure class="visual"><img src="./assets/gamma-presenter-author-chart.png" alt="Gamma Presenter rendering a rich chart slide in the embedded preview"><figcaption>Live data visualization belongs in the presentation, not in a screenshot of one.</figcaption></figure></section>
    <section class="contrast"><div class="contrast-grid shell"><div><h2>Not another Markdown-to-static-slide pipeline.</h2><p>Gamma keeps quick writing where it is useful, then makes room for the things conventional slide formats tend to flatten or push into a separate production stack.</p></div><div><ul><li>A single authoring surface for source, preview, media, and deck structure.</li><li>A native stage and speaker workflow with display selection, notes, clocks, cues, and recording controls.</li><li>An open, declarative runtime that stays useful for interactive reporting and technical storytelling.</li><li>Local AI assistance with a narrow, operator-approved control boundary instead of ambient system access.</li></ul></div></div></section>
    <section class="deck-section shell" id="decks" aria-labelledby="decks-title"><div class="section-heading"><h2 id="decks-title">See the renderer in the wild.</h2><p>These decks are generated from editable source and published as self-contained interactive HTML.</p></div><div class="deck-list">${decks || '<p class="empty">No presentations have been deployed yet.</p>'}</div></section>
    <section class="start shell" id="get-started" aria-labelledby="start-title"><div><h2 id="start-title">Open the studio on your Mac.</h2><p>Gamma Presenter runs locally from the repository. Bun keeps the workflow concise; Electron gives the authoring, stage, and speaker surfaces their native macOS home.</p></div><div><pre class="command"><code>git clone https://github.com/hbfs-cloud/gamma-slides.git
cd gamma-slides
bun install
bun run desktop</code></pre><p class="start-note">For the complete macOS workflow, package instructions, security boundary, and feature evidence, read the <a href="https://github.com/hbfs-cloud/gamma-slides/blob/main/docs/gamma-presenter-macos.md">Gamma Presenter guide</a>.</p></div></section>
  </main>
  <footer class="site-footer shell"><span>Gamma Presenter is built on the Gamma Slides engine.</span><nav aria-label="Footer"><a href="https://github.com/hbfs-cloud/gamma-slides/blob/main/README.md">README</a><a href="https://github.com/hbfs-cloud/gamma-slides/blob/main/docs/gamma-presenter-macos.md">macOS guide</a><a href="https://github.com/hbfs-cloud/gamma-slides">GitHub</a></nav></footer>
</body>
</html>`;
}

function copyMarketingAssets(destination) {
  const assets = [
    ['build/icon.svg', 'gamma-presenter-icon.svg'],
    ['docs/images/gamma-presenter-control-room.png', 'gamma-presenter-control-room.png'],
    ['docs/images/gamma-presenter-author-rich.png', 'gamma-presenter-author-rich.png'],
    ['docs/images/gamma-presenter-author-chart.png', 'gamma-presenter-author-chart.png'],
    ['node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2', 'instrument-sans-latin-wght-normal.woff2'],
    ['node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2', 'source-serif-4-latin-wght-normal.woff2'],
  ];
  const assetDirectory = resolve(destination, 'assets');
  mkdirSync(assetDirectory, { recursive: true });
  assets.forEach(([source, target]) => copyFileSync(resolve(source), resolve(assetDirectory, target)));
}

export function buildPresentationLibrary({ inputDir = './presentations', outputDir = './_site', include = [] } = {}) {
  const destination = resolve(outputDir);
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  copyMarketingAssets(destination);
  const files = [];
  const sourceDir = resolve(inputDir);
  if (existsSync(sourceDir)) {
    readdirSync(sourceDir)
      .filter(name => /\.(?:ya?ml|json)$/i.test(name))
      .sort()
      .forEach(name => files.push({ file: resolve(sourceDir, name), slug: presentationSlug(basename(name, extname(name))) }));
  }
  if (!files.length) {
    include.forEach(file => {
      const path = resolve(file);
      const slug = presentationSlug(basename(file, extname(file)));
      if (!files.some(entry => entry.slug === slug)) files.push({ file: path, slug });
    });
  }
  const entries = files.map(({ file, slug }, index) => {
    const deck = loadDeckFile(file);
    const result = buildStaticSite(deck, resolve(destination, slug));
    return { index: index + 1, slug, title: result.title, slides: result.slides, theme: result.theme };
  });
  writeFileSync(resolve(destination, 'index.html'), catalogHtml(entries), 'utf-8');
  writeFileSync(resolve(destination, '.nojekyll'), '', 'utf-8');
  writeFileSync(resolve(destination, 'presentations.json'), JSON.stringify(entries, null, 2), 'utf-8');
  return { outputDir: destination, entries };
}
