import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { escapeHtml } from '../engine/html.js';
import { loadDeckFile } from '../loader/index.js';
import { buildStaticSite } from './build.js';
import { presentationSlug } from './github-pages.js';

const featuredDecks = {
  flagship: {
    label: 'Board review',
    title: 'A board deck with actual depth.',
    copy: 'A 38-slide operating review: editorial storytelling, data scenes, decisions, and the technical detail behind them.',
  },
  'gamma-slides-live-demo': {
    label: 'Live publishing',
    title: 'From a brief to a public URL.',
    copy: 'A compact, source-authored walkthrough of the publishing workflow and the interactive output it creates.',
  },
  'immersive-data': {
    label: 'Immersive data',
    title: 'Data that belongs on the stage.',
    copy: 'A focused visual runtime demo for live charting, spatial data, and an audience-sized point of view.',
  },
};

const macDownloadUrl = 'https://github.com/hbfs-cloud/gamma-slides/releases/latest/download/Gamma%20Presenter-2.0.0-arm64-mac.zip';

function featuredDeckHtml(entries) {
  return Object.entries(featuredDecks).map(([slug, content], index) => {
    const entry = entries.find(candidate => candidate.slug === slug);
    if (!entry) return '';
    const href = `./${encodeURIComponent(entry.slug)}/`;
    return `<article class="demo demo-${index + 1}">
      <div class="demo-copy"><p>${content.label} · ${entry.slides} slides</p><h3>${content.title}</h3><span>${content.copy}</span><a href="${href}">Open live deck <b aria-hidden="true">↗</b></a></div>
      <a class="demo-stage" href="${href}" aria-label="Open ${content.label} live deck"><iframe src="${href}" title="${content.label} live preview" loading="lazy" tabindex="-1"></iframe><i aria-hidden="true">Live presentation · open to explore</i></a>
    </article>`;
  }).join('');
}

function catalogHtml(entries) {
  const demos = featuredDeckHtml(entries);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="description" content="Gamma Presenter is the local macOS presentation studio for source-first decks, live visuals, recording, and operator-controlled AI co-piloting.">
  <title>Gamma Presenter — presentations for work that will not fit in a template</title>
  <style>
    @font-face{font-family:Instrument;src:url("./assets/instrument-sans-latin-wght-normal.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
    @font-face{font-family:SourceSerif;src:url("./assets/source-serif-4-latin-wght-normal.woff2") format("woff2");font-weight:200 900;font-style:normal;font-display:swap}
    :root{color:#f3f6f2;background:#05070a;font-family:Instrument,system-ui,sans-serif;font-synthesis:none}*{box-sizing:border-box}html{scroll-behavior:smooth}body{min-width:320px;margin:0;background:#05070a;color:#f3f6f2;line-height:1.5}a{color:inherit;text-decoration-thickness:1px;text-underline-offset:4px}a:hover{color:#8ba8ff}a:focus-visible{outline:2px solid #ffb000;outline-offset:5px}::selection{background:#315dff;color:#fff}code{font-family:"Azeret Mono","SFMono-Regular",Consolas,monospace;font-size:.9em}.shell{width:min(1220px,calc(100% - 48px));margin:auto}.site-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 0;border-bottom:1px solid #26313d}.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;font-weight:760;letter-spacing:-.025em}.brand img{width:31px;height:31px}.site-header nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:18px;color:#a3adb8;font-size:.88rem}.site-header nav a{text-decoration:none}.hero{display:grid;grid-template-columns:minmax(0,.88fr) minmax(420px,1.12fr);gap:clamp(42px,7vw,110px);align-items:center;padding:clamp(64px,10vw,136px) 0 84px}.hero-copy{max-width:650px}.hero h1,.manifesto h2,.demo-intro h2,.start h2{margin:0;font-family:SourceSerif,Georgia,serif;font-weight:500;letter-spacing:-.04em;line-height:.96;text-wrap:balance}.hero h1{font-size:clamp(3.5rem,7vw,6.5rem)}.hero-copy>p{max-width:54ch;margin:29px 0 0;color:#c9d0d6;font-size:clamp(1.08rem,1.5vw,1.28rem);line-height:1.55}.actions{display:flex;flex-wrap:wrap;gap:13px;margin-top:35px}.action{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:1px solid #315dff;background:#315dff;color:#fff;text-decoration:none;font-weight:740;transition:background .18s ease,color .18s ease,transform .18s ease}.action:hover{background:#8ba8ff;color:#05070a;transform:translateY(-2px)}.action.secondary{border-color:#26313d;background:transparent;color:#f3f6f2}.action.secondary:hover{border-color:#8ba8ff;background:#0a0e13;color:#f3f6f2}.hero-proof{display:flex;flex-wrap:wrap;gap:9px;margin:28px 0 0;padding:0;list-style:none;color:#a3adb8;font-size:.78rem}.hero-proof li{padding-right:10px;border-right:1px solid #26313d}.hero-proof li:last-child{border:0}.hero-figure{margin:0;animation:arrive .75s cubic-bezier(.16,1,.3,1) both}.hero-figure img{display:block;width:100%;height:auto;border:1px solid #26313d;box-shadow:0 30px 78px rgba(0,0,0,.48)}.hero-figure figcaption{margin-top:13px;color:#a3adb8;font-size:.78rem;line-height:1.45}.operating-model{border-top:1px solid #26313d;border-bottom:1px solid #26313d}.operating-model>div{display:grid;grid-template-columns:repeat(3,1fr)}.operating-model article{min-height:176px;padding:30px;border-right:1px solid #26313d}.operating-model article:last-child{border:0}.operating-model h2{margin:0 0 14px;font-size:1.15rem;letter-spacing:-.025em}.operating-model p{max-width:29ch;margin:0;color:#a3adb8;font-size:.94rem}.manifesto{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(40px,9vw,144px);padding:clamp(90px,13vw,164px) 0}.manifesto h2{font-size:clamp(2.75rem,5.1vw,5rem)}.manifesto-copy{align-self:center}.manifesto-copy>p{max-width:55ch;margin:0;color:#c9d0d6;font-size:1.1rem}.proof-list{margin:30px 0 0;padding:0;list-style:none;border-top:1px solid #26313d}.proof-list li{display:grid;grid-template-columns:150px minmax(0,1fr);gap:24px;padding:17px 0;border-bottom:1px solid #26313d}.proof-list strong{font-size:.89rem}.proof-list span{color:#a3adb8;font-size:.94rem}.demo-intro{display:flex;align-items:end;justify-content:space-between;gap:34px;padding:0 0 38px}.demo-intro h2{max-width:12ch;font-size:clamp(2.9rem,5.3vw,5.2rem)}.demo-intro p{max-width:39ch;margin:0;color:#a3adb8}.demo-shelf{padding:0 0 clamp(86px,12vw,150px)}.demo{display:grid;grid-template-columns:minmax(230px,.52fr) minmax(0,1fr);gap:clamp(28px,5vw,74px);align-items:center;padding:clamp(48px,7vw,82px) 0;border-top:1px solid #26313d}.demo:last-child{border-bottom:1px solid #26313d}.demo-copy>p{margin:0 0 15px;color:#8ba8ff;font-size:.72rem;font-weight:750;letter-spacing:.09em;text-transform:uppercase}.demo-copy h3{max-width:9ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.15rem,3.6vw,3.8rem);font-weight:500;letter-spacing:-.04em;line-height:.98}.demo-copy span{display:block;max-width:34ch;margin:20px 0 0;color:#a3adb8;font-size:.96rem}.demo-copy a{display:inline-flex;gap:9px;margin-top:24px;font-weight:730;text-decoration:none}.demo-copy b{color:#ffb000;font-size:1.1rem}.demo-stage{position:relative;display:block;aspect-ratio:16/9;overflow:hidden;border:1px solid #26313d;background:#0a0e13;box-shadow:0 26px 64px rgba(0,0,0,.42)}.demo-stage iframe{display:block;width:100%;height:100%;border:0;pointer-events:none}.demo-stage i{position:absolute;right:0;bottom:0;padding:8px 11px;background:#05070a;color:#f3f6f2;font-style:normal;font-size:.7rem;letter-spacing:.025em}.contrast{border-top:1px solid #26313d;border-bottom:1px solid #26313d}.contrast>div{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:clamp(80px,11vw,144px) 0}.contrast h2{max-width:10ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.65rem,4.7vw,4.75rem);font-weight:500;letter-spacing:-.04em;line-height:.98}.contrast ul{margin:0;padding:0 0 0 clamp(24px,6vw,92px);list-style:none;border-left:1px solid #26313d}.contrast li{padding:15px 0;border-top:1px solid #26313d;color:#c9d0d6}.contrast li:last-child{border-bottom:1px solid #26313d}.contrast strong{display:block;margin-bottom:3px;color:#f3f6f2;font-size:.92rem}.contrast span{color:#a3adb8;font-size:.93rem}.start{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(38px,8vw,130px);padding:clamp(88px,12vw,150px) 0}.start h2{font-size:clamp(2.8rem,4.9vw,4.9rem)}.start p{max-width:39ch;color:#c9d0d6}.command{margin:0;padding:23px;overflow:auto;background:#0a0e13;border:1px solid #26313d;color:#f3f6f2;font-size:.9rem;line-height:1.7;box-shadow:0 20px 50px rgba(0,0,0,.34)}.start-note{margin-top:18px;color:#a3adb8;font-size:.88rem}.site-footer{display:flex;justify-content:space-between;gap:30px;padding:27px 0 42px;border-top:1px solid #26313d;color:#a3adb8;font-size:.86rem}.site-footer nav{display:flex;flex-wrap:wrap;gap:17px}.site-footer a{color:#f3f6f2}@keyframes arrive{from{opacity:.2;clip-path:inset(8% 0 0 0);filter:blur(8px)}to{opacity:1;clip-path:inset(0);filter:blur(0)}}@media(max-width:860px){.hero,.manifesto,.start{grid-template-columns:1fr}.hero{gap:44px}.hero-copy{max-width:720px}.hero-figure{max-width:820px}.manifesto{gap:39px}.demo{grid-template-columns:1fr;gap:28px}.demo-copy h3{max-width:12ch}.demo-stage{max-width:820px}.demo-intro{display:block}.demo-intro p{margin-top:22px}.operating-model article{padding:25px 20px}.site-footer{display:block}.site-footer nav{margin-top:14px}}@media(max-width:620px){.shell{width:min(100% - 32px,1220px)}.site-header{align-items:flex-start}.site-header nav{justify-content:flex-start;gap:11px 15px}.hero{padding:52px 0 72px}.hero h1{font-size:clamp(3.1rem,15vw,4.8rem)}.operating-model>div,.contrast>div{grid-template-columns:1fr}.operating-model article{min-height:auto;padding:25px 0;border-right:0;border-bottom:1px solid #26313d}.operating-model article:last-child{border-bottom:0}.proof-list li{grid-template-columns:1fr;gap:5px}.demo{padding:54px 0}.demo-stage i{padding:6px 8px;font-size:.62rem}.contrast>div{gap:52px}.contrast ul{padding:0;border-left:0}.command{padding:17px;font-size:.78rem}.site-footer{padding-bottom:29px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.hero-figure{animation:none}.action{transition:none}.action:hover{transform:none}}
    /* Product identity and repository route stay legible before the first scroll. */
    .site-header{padding:18px 0}.brand{gap:12px}.brand img{width:38px;height:38px}.site-header nav{align-items:center}.site-header .github-link{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 12px;border:1px solid #315dff;color:#f3f6f2;font-weight:720}.site-header .github-link:hover{background:#315dff;color:#fff}.github-link svg{width:16px;height:16px;fill:currentColor}
  </style>
</head>
<body>
  <header class="site-header shell">
    <a class="brand" href="./" aria-label="Gamma Presenter home"><img src="./assets/gamma-presenter-icon.svg" alt="Gamma Presenter logo">Gamma Presenter</a>
    <nav aria-label="Primary navigation"><a href="#demos">Live demos</a><a href="#difference">Why Gamma</a><a href="#get-started">Run locally</a><a class="github-link" href="https://github.com/hbfs-cloud/gamma-slides"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.49c-2.23.49-2.7-.95-2.7-.95-.37-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.89.87 2.35.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.97 0-.88.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82A7.63 7.63 0 0 1 8 4.8c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.27.83 2.15 0 3.09-1.87 3.77-3.66 3.97.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>View on GitHub</a></nav>
  </header>
  <main>
    <section class="hero shell" aria-labelledby="hero-title">
      <div class="hero-copy">
        <h1 id="hero-title">The native macOS app for presentations that need a real runtime.</h1>
        <p>Gamma Presenter brings source-first authoring, live visuals, Stage, Speaker View, recording, and an operator-controlled Claude Code or Codex co-pilot into one local control room. Write quickly. Keep the real system alive on stage.</p>
        <div class="actions"><a class="action" href="${macDownloadUrl}">Download for macOS</a><a class="action secondary" href="#demos">Open live demos</a></div>
        <ul class="hero-proof" aria-label="Product qualities"><li>macOS desktop</li><li>Local-first</li><li>Bun-powered</li><li>Loopback MCP</li></ul>
      </div>
      <figure class="hero-figure"><img src="./assets/gamma-presenter-control-room.png" alt="Gamma Presenter’s English Author workspace with live timers, operator approvals, and local AI co-pilot controls" fetchpriority="high"><figcaption>Author, timer, live-action approvals, and local co-pilot — one intentional control surface.</figcaption></figure>
    </section>
    <section class="operating-model" aria-label="Gamma Presenter workflow"><div class="shell"><article><h2>Write in durable source.</h2><p>Markdown when speed matters; YAML and JSON when a visual needs real structure.</p></article><article><h2>Keep the scene alive.</h2><p>Media, charts, diagrams, GPU scenes, terminal output, and animation remain presentation content.</p></article><article><h2>Run the room with intent.</h2><p>Stage, speaker view, recording, timers, cues, and co-piloting stay where the work happens.</p></article></div></section>
    <section class="manifesto shell" aria-labelledby="manifesto-title"><h2 id="manifesto-title">A deck can be both a clear story and a live system.</h2><div class="manifesto-copy"><p>Gamma Presenter gives the writer a focused authoring surface and gives the technical presenter a route to the runtime. The embedded preview uses the same deck that reaches the public stage.</p><ul class="proof-list"><li><strong>Author</strong><span>Create, duplicate, reorder, and edit slides without flattening advanced deck configuration.</span></li><li><strong>Compose</strong><span>Bring project-local images, GIFs, video, audio, diagrams, charts, and 3D scenes into the work.</span></li><li><strong>Present</strong><span>Use a native stage and speaker workflow with notes, clocks, cues, display selection, and recording.</span></li><li><strong>Co-animate</strong><span>Let a local LLM request bounded actions through MCP; consequential live actions remain visibly operator-approved.</span></li></ul></div></section>
    <section class="demo-shelf shell" id="demos" aria-labelledby="demos-title"><div class="demo-intro"><h2 id="demos-title">The app is the product. The live decks are the proof.</h2><p>Gamma Presenter is where you write, operate, record, and co-animate. These are the real, generated presentations it puts on Stage — not marketing videos or flattened screenshots.</p></div>${demos || '<p class="empty">No featured presentations have been deployed yet.</p>'}</section>
    <section class="contrast" id="difference"><div class="shell"><h2>Not another Markdown-to-static-slide pipeline.</h2><ul><li><strong>One working surface.</strong><span>Source, structure, local media, rich preview, and operations sit together instead of being passed between disconnected tools.</span></li><li><strong>A native moment on stage.</strong><span>Stage and speaker surfaces add display control, elapsed time, countdowns, private cues, recording, and safe recovery.</span></li><li><strong>A serious visual runtime.</strong><span>Gamma keeps ECharts, Archify, D3, Pixi, Three.js, browser scenes, and terminal output live rather than turning them into screenshots.</span></li><li><strong>AI without ambient control.</strong><span>Local CLI co-pilots and loopback MCP are explicit, authenticated, bounded, and approved at the moment of action.</span></li></ul></div></section>
    <section class="start shell" id="get-started" aria-labelledby="start-title"><div><h2 id="start-title">Open the studio on your Mac.</h2><p><a href="${macDownloadUrl}">Download the arm64 ZIP</a> for Apple silicon, or run from source. The release is unsigned until Apple Developer signing credentials are configured.</p></div><div><pre class="command"><code>git clone https://github.com/hbfs-cloud/gamma-slides.git
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
