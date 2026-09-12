import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { loadDeckFile } from '../loader/index.js';
import { buildStaticSite } from './build.js';
import { presentationSlug } from './github-pages.js';

const featuredDecks = {
  'gamma-presenter-capabilities': { kind: 'Complete capability tour', title: 'See the whole product in one live deck.', copy: 'A guided author → runtime → stage → operator tour: rich source, local media, data, Archify, 3D, browser scenes, recording, exports, and approved local AI.' },
  flagship: { kind: 'Board review', title: 'A long-form operating review.', copy: 'A 38-slide narrative with decision context, data scenes, and the technical detail a serious review cannot leave behind.' },
  'gamma-slides-live-demo': { kind: 'Live publishing', title: 'From source to a public deck.', copy: 'A compact walkthrough of the declarative workflow and the interactive output it produces.' },
  'immersive-data': { kind: 'Immersive data', title: 'Data that belongs on stage.', copy: 'A live runtime demo for charting, spatial data, and an audience-sized point of view.' },
};

const repositoryUrl = 'https://github.com/hbfs-cloud/gamma-slides';
const releaseUrl = `${repositoryUrl}/releases/tag/v2.0.3`;
const macDownloadUrl = `${repositoryUrl}/releases/latest/download/Gamma.Presenter-2.0.3-arm64-mac.zip`;

function featuredDeckHtml(entries) {
  return Object.entries(featuredDecks).map(([slug, content]) => {
    const entry = entries.find(candidate => candidate.slug === slug);
    if (!entry) return '';
    const href = `./${encodeURIComponent(entry.slug)}/`;
    return `<article class="deck-row">
      <div class="deck-meta"><p>${content.kind} <span aria-hidden="true">/</span> ${entry.slides} slides</p><h3>${content.title}</h3><span>${content.copy}</span><a href="${href}">Open this live deck <b aria-hidden="true">→</b></a></div>
      <a class="deck-preview" href="${href}" aria-label="Open ${content.kind} live deck"><span>Gamma Slides</span><strong>${content.kind}</strong><i>Open the live deck <b aria-hidden="true">→</b></i></a>
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
  <meta name="color-scheme" content="light">
  <meta name="description" content="Gamma Presenter is the local macOS presentation studio for source-first decks, live visuals, recording, and operator-controlled AI co-piloting.">
  <link rel="icon" href="./assets/gamma-presenter-icon.svg" type="image/svg+xml">
  <title>Gamma Presenter — a macOS stage for live presentations</title>
  <style>
    @font-face{font-family:Instrument;src:url("./assets/instrument-sans-latin-wght-normal.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
    @font-face{font-family:SourceSerif;src:url("./assets/source-serif-4-latin-wght-normal.woff2") format("woff2");font-weight:200 900;font-style:normal;font-display:swap}
    :root{background:#f3f0e8;color:#111318;font-family:Instrument,system-ui,sans-serif;font-synthesis:none}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{min-width:320px;margin:0;background:#f3f0e8;color:#111318;line-height:1.5}
    a{color:inherit;text-decoration-thickness:1px;text-underline-offset:4px}a:hover{color:#1748d5}a:focus-visible{outline:2px solid #1748d5;outline-offset:5px}::selection{background:#1748d5;color:#fff}
    .shell{width:min(1240px,calc(100% - 56px));margin:auto}.site-header{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:20px 0;border-bottom:1px solid #cfc9bd}
    .brand{display:inline-flex;align-items:center;gap:12px;font-size:1rem;font-weight:780;letter-spacing:-.025em;text-decoration:none}.brand img{width:36px;height:36px}.site-header nav{display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;gap:20px;color:#62646b;font-size:.86rem;font-weight:650}.site-header nav a{text-decoration:none}.site-header .source-link{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 11px;border:1px solid #1748d5;color:#111318}.source-link svg{width:16px;height:16px;fill:currentColor}
    h1,h2,h3,p{margin-top:0}.hero{padding:clamp(52px,8vw,112px) 0 0}.hero-copy{display:grid;grid-template-columns:minmax(0,1.38fr) minmax(240px,.62fr);gap:clamp(26px,6vw,88px);align-items:end;padding-bottom:clamp(46px,7vw,88px)}.hero h1{max-width:10ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(3.6rem,7.2vw,7.4rem);font-weight:440;letter-spacing:-.052em;line-height:.88;text-wrap:balance}.hero-aside{padding-bottom:7px}.hero-aside p{max-width:32ch;margin:0;color:#62646b;font-size:1.08rem;line-height:1.55}
    .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.action{display:inline-flex;align-items:center;justify-content:center;min-height:49px;padding:0 20px;background:#1748d5;color:#fff;font-size:.92rem;font-weight:800;text-decoration:none;transition:background .18s ease,transform .18s ease}.action:hover{background:#315dff;color:#fff;transform:translateY(-2px)}.action.secondary{background:transparent;border:1px solid #111318;color:#111318}.action.secondary:hover{border-color:#1748d5;background:#fbf9f3}.release-facts{display:flex;flex-wrap:wrap;gap:8px 17px;margin:19px 0 0;padding:0;list-style:none;color:#62646b;font-size:.77rem}.release-facts li+li:before{margin-right:17px;color:#1748d5;content:"/"}
    .product-shot{position:relative;margin:0;border-top:1px solid #111318}.product-shot picture,.product-shot img{display:block;width:100%;height:auto}.product-shot picture{border-right:1px solid #111318;border-bottom:1px solid #111318;border-left:1px solid #111318;background:#05070a}.product-shot figcaption{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:18px;padding:14px 0 0;color:#62646b;font-size:.78rem;line-height:1.45}.product-shot figcaption strong{color:#111318;font-weight:760}.product-shot figcaption a{color:#1748d5;font-weight:790;text-decoration:none}.product-shot figcaption a:hover{text-decoration:underline}.hero-rule{height:2px;margin:clamp(54px,8vw,110px) auto 0;background:#1748d5}
    .evidence{display:grid;grid-template-columns:minmax(0,.74fr) minmax(0,1.26fr);gap:clamp(35px,8vw,132px);padding:clamp(82px,12vw,164px) 0}.evidence h2,.deck-intro h2,.install h2{max-width:10ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.9rem,5.4vw,5.4rem);font-weight:440;letter-spacing:-.045em;line-height:.94;text-wrap:balance}.evidence-copy{align-self:end}.evidence-copy>p{max-width:51ch;margin:0 0 32px;color:#62646b;font-size:1.08rem;line-height:1.62}.evidence-list{margin:0;padding:0;list-style:none;border-top:1px solid #cfc9bd}.evidence-list li{display:grid;grid-template-columns:150px minmax(0,1fr);gap:25px;padding:18px 0;border-bottom:1px solid #cfc9bd}.evidence-list strong{font-size:.88rem}.evidence-list span{color:#62646b;font-size:.94rem}
    .proof-band{background:#1748d5;color:#fff}.proof-band>div{display:grid;grid-template-columns:repeat(3,1fr)}.proof-band article{min-height:218px;padding:31px 32px;border-right:1px solid #8ba8ff}.proof-band article:first-child{border-left:1px solid #8ba8ff}.proof-band h3{margin:0 0 52px;color:#f3f0e8;font-size:.76rem;font-weight:800;letter-spacing:.055em;text-transform:uppercase}.proof-band p{max-width:23ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:1.45rem;font-weight:440;letter-spacing:-.025em;line-height:1.12}
    .runtime-proof{display:grid;grid-template-columns:minmax(260px,.68fr) minmax(0,1.32fr);gap:clamp(35px,8vw,124px);align-items:center;padding:clamp(88px,12vw,156px) 0}.runtime-proof h2{max-width:10ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.9rem,5.4vw,5.4rem);font-weight:440;letter-spacing:-.045em;line-height:.94;text-wrap:balance}.runtime-proof p{max-width:32ch;margin:23px 0 0;color:#62646b;font-size:1rem;line-height:1.6}.runtime-proof a{display:inline-flex;gap:9px;margin-top:25px;color:#111318;font-weight:790;text-decoration:none}.runtime-proof a b{color:#1748d5;font-size:1.2rem}.runtime-loop{margin:0;border:1px solid #111318;background:#05070a}.runtime-loop picture,.runtime-loop img{display:block;width:100%;height:auto}.runtime-loop figcaption{padding:12px 15px;background:#fbf9f3;color:#62646b;font-size:.77rem;line-height:1.45}.runtime-loop figcaption strong{color:#111318}
    .decks{padding:clamp(86px,12vw,156px) 0}.deck-intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,.64fr);gap:44px;align-items:end;padding-bottom:45px}.deck-intro p{max-width:35ch;margin:0;color:#62646b;font-size:1rem;line-height:1.6}.deck-row{display:grid;grid-template-columns:minmax(240px,.62fr) minmax(0,1.38fr);gap:clamp(36px,7vw,108px);align-items:center;padding:clamp(53px,8vw,100px) 0;border-top:1px solid #cfc9bd}.deck-row:last-child{border-bottom:1px solid #cfc9bd}.deck-meta>p{margin:0 0 14px;color:#1748d5;font-size:.75rem;font-weight:790;letter-spacing:.08em;text-transform:uppercase}.deck-meta>p span{color:#5e46a8}.deck-meta h3{max-width:11ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.15rem,3.7vw,4rem);font-weight:440;letter-spacing:-.045em;line-height:.96}.deck-meta>span{display:block;max-width:35ch;margin-top:19px;color:#62646b;font-size:.96rem;line-height:1.58}.deck-meta a{display:inline-flex;gap:9px;margin-top:25px;font-weight:790;text-decoration:none}.deck-meta a b{color:#1748d5;font-size:1.2rem}.deck-preview{display:grid;align-content:space-between;aspect-ratio:16/9;padding:clamp(23px,4vw,52px);border:1px solid #111318;background:#fbf9f3;color:#111318;text-decoration:none}.deck-preview span{color:#1748d5;font-size:.75rem;font-weight:790;letter-spacing:.08em;text-transform:uppercase}.deck-preview strong{max-width:9ch;font-family:SourceSerif,Georgia,serif;font-size:clamp(2rem,4.1vw,4.8rem);font-weight:440;letter-spacing:-.05em;line-height:.88}.deck-preview i{display:inline-flex;gap:9px;align-items:center;color:#111318;font-size:.82rem;font-style:normal;font-weight:790}.deck-preview i b{color:#1748d5;font-size:1.2rem}
    .install{display:grid;grid-template-columns:minmax(0,.86fr) minmax(0,1.14fr);gap:clamp(38px,8vw,130px);padding:clamp(88px,12vw,150px) 0}.install-copy{align-self:center}.install-copy p{max-width:35ch;margin:21px 0 0;color:#62646b;font-size:1.05rem;line-height:1.6}.install-meta{padding-top:3px}.install-meta .action{width:100%}.download-note{margin:13px 0 0;color:#62646b;font-size:.82rem;line-height:1.55}.source-command{margin:27px 0 0;padding:19px 22px;overflow:auto;border:1px solid #cfc9bd;background:#fbf9f3;color:#3c3d43;font-family:ui-monospace,monospace;font-size:.84rem;line-height:1.72}.source-command code{white-space:pre}.site-footer{display:flex;align-items:center;justify-content:space-between;gap:25px;padding:27px 0 42px;border-top:1px solid #cfc9bd;color:#62646b;font-size:.84rem}.site-footer nav{display:flex;flex-wrap:wrap;gap:19px}.site-footer a{color:#111318}.site-footer a:hover{color:#1748d5}
    @media(max-width:850px){.hero-copy,.evidence,.runtime-proof,.deck-intro,.install{grid-template-columns:1fr}.hero h1{max-width:11ch}.hero-aside{max-width:620px}.evidence{gap:45px}.runtime-proof{gap:37px}.proof-band>div{grid-template-columns:1fr}.proof-band article,.proof-band article:first-child{min-height:auto;padding:29px 0;border-right:0;border-left:0;border-bottom:1px solid #8ba8ff}.proof-band article:last-child{border-bottom:0}.proof-band h3{margin-bottom:13px}.deck-intro{gap:25px}.deck-row{grid-template-columns:1fr;gap:31px}.deck-preview{max-width:820px}.install{gap:35px}.site-footer{align-items:flex-start;flex-direction:column}}
    @media(max-width:590px){.shell{width:min(100% - 32px,1240px)}.site-header{align-items:flex-start;padding:16px 0}.site-header nav{justify-content:flex-start;gap:12px 16px}.site-header .source-link{min-height:32px;padding:0 8px}.hero{padding-top:46px}.hero h1{font-size:clamp(3.2rem,15.4vw,4.65rem)}.release-facts{gap:7px 13px}.release-facts li+li:before{margin-right:13px}.product-shot figcaption{grid-template-columns:1fr;gap:3px}.evidence-list li{grid-template-columns:1fr;gap:5px}.decks{padding:76px 0}.deck-row{padding:55px 0}.deck-preview i{padding:6px 8px;font-size:.62rem}.install{padding:78px 0}.source-command{padding:16px;font-size:.74rem}.site-footer{padding-bottom:28px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.action{transition:none}.action:hover{transform:none}}
  </style>
</head>
<body>
  <header class="site-header shell">
    <a class="brand" href="./" aria-label="Gamma Presenter home"><img src="./assets/gamma-presenter-icon.svg" alt="Gamma Presenter logo">Gamma Presenter</a>
    <nav aria-label="Primary navigation"><a href="#proof">What it does</a><a href="#decks">Live decks</a><a href="#download">Download</a><a class="source-link" href="${repositoryUrl}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.49c-2.23.49-2.7-.95-2.7-.95-.37-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.89.87 2.35.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.97 0-.88.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82A7.63 7.63 0 0 1 8 4.8c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.27.83 2.15 0 3.09-1.87 3.77-3.66 3.97.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>Source</a></nav>
  </header>
  <main>
    <section class="hero shell" aria-labelledby="hero-title"><div class="hero-copy"><h1 id="hero-title">Presentations with a live operating system.</h1><div class="hero-aside"><p>Gamma Presenter is the native macOS workspace for decks that carry more than text: real visuals, a real stage, a real clock, and a local AI operator that asks before it acts.</p><div class="actions"><a class="action" href="${macDownloadUrl}">Download Gamma Presenter</a><a class="action secondary" href="${releaseUrl}">Release notes</a></div><ul class="release-facts" aria-label="Current release"><li>v2.0.3</li><li>Apple silicon</li><li>185 MB ZIP</li><li>Unsigned</li></ul></div></div><figure class="product-shot"><picture><source media="(prefers-reduced-motion: no-preference)" srcset="./assets/gamma-presenter-immersive-runtime.gif" type="image/gif"><img src="./assets/gamma-presenter-author-chart.png" alt="A live Gamma Presenter stage rendering an interactive three-dimensional data scene" fetchpriority="high"></picture><figcaption><strong>A running Gamma scene.</strong><span>This is a recorded product loop, not a mockup: the runtime stays interactive when the deck opens.</span><a href="./gamma-presenter-capabilities/">Explore the live tour <b aria-hidden="true">→</b></a></figcaption></figure></section>
    <div class="hero-rule" aria-hidden="true"></div>
    <section class="evidence shell" id="proof" aria-labelledby="proof-title"><h2 id="proof-title">Do not flatten the work to fit the slides.</h2><div class="evidence-copy"><p>Write an argument in Markdown. Keep a rich Gamma deck intact when the argument needs media, diagrams, charts, a browser scene, terminal output, or 3D. Then carry that same document into Stage.</p><ul class="evidence-list"><li><strong>Author</strong><span>Create, duplicate, reorder, inspect, and write slides in Markdown, YAML, or JSON without erasing advanced deck configuration.</span></li><li><strong>Compose</strong><span>Use project-local images, GIFs, video, audio, charts, diagrams, and GPU scenes as presentation content — not a screenshot workaround.</span></li><li><strong>Present</strong><span>Run Stage and Speaker View with notes, display selection, elapsed time, countdowns, cues, recording, and explicit recovery controls.</span></li><li><strong>Co-animate</strong><span>Connect a local Claude Code or Codex workflow through loopback MCP. Sensitive live actions queue visibly for the presenter to approve or reject.</span></li></ul></div></section>
    <section class="proof-band" aria-label="Gamma Presenter principles"><div class="shell"><article><h3>One document</h3><p>Fast source for the writer. Full fidelity for the runtime.</p></article><article><h3>One room</h3><p>Authoring, stagecraft, recording, and live operations stay connected.</p></article><article><h3>One boundary</h3><p>AI can assist the show. The operator retains the final action.</p></article></div></section>
    <section class="runtime-proof shell" aria-labelledby="runtime-title"><div><h2 id="runtime-title">Make the visual do the explaining.</h2><p>Build beyond static slides: cinematic scenes, charts, Archify diagrams, 3D, media, browser experiences, recording, and presenter controls are all native parts of the same deck.</p><a href="./immersive-data/">Open the immersive data demo <b aria-hidden="true">→</b></a></div><figure class="runtime-loop"><picture><source media="(prefers-reduced-motion: no-preference)" srcset="./assets/gamma-presenter-cinematic-runtime.gif" type="image/gif"><img src="./assets/gamma-presenter-control-room.png" alt="The Gamma Presenter Author workspace with its local presentation control room"></picture><figcaption><strong>Motion belongs to the argument.</strong> A second captured runtime loop shows a cinematic data scene; reduced-motion visitors receive the real Author workspace instead.</figcaption></figure></section>
    <section class="decks shell" id="decks" aria-labelledby="decks-title"><div class="deck-intro"><h2 id="decks-title">Start with the complete capability tour.</h2><p>One navigable deck now demonstrates the whole Gamma Presenter workflow. The following deep dives prove the individual runtimes under real presentation pressure.</p></div>${demos || '<p>No featured presentations have been deployed yet.</p>'}</section>
    <section class="install shell" id="download" aria-labelledby="download-title"><div class="install-copy"><h2 id="download-title">Install the app. Keep the runtime.</h2><p>Gamma Presenter is available now for Apple-silicon Macs. The release contains the Gamma Presenter app in a ZIP and is explicitly unsigned while Apple Developer signing credentials are not configured.</p></div><div class="install-meta"><a class="action" href="${macDownloadUrl}">Download for Apple silicon</a><p class="download-note">Direct GitHub Release download · v2.0.3 · 185 MB ZIP · <a href="${releaseUrl}">checksums and release notes</a></p><pre class="source-command"><code>git clone ${repositoryUrl}.git
cd gamma-slides
bun install
bun run desktop</code></pre></div></section>
  </main>
  <footer class="site-footer shell"><span>Gamma Presenter is built on the Gamma Slides engine.</span><nav aria-label="Footer"><a href="${repositoryUrl}/blob/main/README.md">README</a><a href="${repositoryUrl}/blob/main/docs/gamma-presenter-macos.md">macOS guide</a><a href="${repositoryUrl}">GitHub</a></nav></footer>
</body>
</html>`;
}

function copyMarketingAssets(destination) {
  const assets = [
    ['build/icon.svg', 'gamma-presenter-icon.svg'],
    ['docs/images/gamma-presenter-control-room.png', 'gamma-presenter-control-room.png'],
    ['docs/images/gamma-presenter-author-chart.png', 'gamma-presenter-author-chart.png'],
    ['docs/images/gamma-presenter-immersive-runtime.gif', 'gamma-presenter-immersive-runtime.gif'],
    ['docs/images/gamma-presenter-cinematic-runtime.gif', 'gamma-presenter-cinematic-runtime.gif'],
    ['node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2', 'instrument-sans-latin-wght-normal.woff2'],
    ['node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2', 'source-serif-4-latin-wght-normal.woff2'],
  ];
  const assetDirectory = resolve(destination, 'assets');
  mkdirSync(assetDirectory, { recursive: true });
  assets.forEach(([source, target]) => copyFileSync(resolve(source), resolve(assetDirectory, target)));
}

export function buildPresentationLibrary({ inputDir = './presentations', outputDir = './_site', include = [], language = '' } = {}) {
  const destination = resolve(outputDir);
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  copyMarketingAssets(destination);
  const files = [];
  const sourceDir = resolve(inputDir);
  if (existsSync(sourceDir)) {
    readdirSync(sourceDir).filter(name => /\.(?:ya?ml|json)$/i.test(name)).sort()
      .forEach(name => files.push({ file: resolve(sourceDir, name), slug: presentationSlug(basename(name, extname(name))) }));
  }
  if (!files.length) include.forEach(file => {
    const path = resolve(file);
    const slug = presentationSlug(basename(file, extname(file)));
    if (!files.some(entry => entry.slug === slug)) files.push({ file: path, slug });
  });
  const requestedLanguage = String(language || '').trim().toLowerCase();
  const managedDecks = files.map(({ file, slug }) => ({ file, slug, deck: loadDeckFile(file) }))
    .filter(({ deck }) => !requestedLanguage || String(deck.meta?.language || '').toLowerCase().startsWith(requestedLanguage));
  const entries = managedDecks.map(({ slug, deck }, index) => {
    const result = buildStaticSite(deck, resolve(destination, slug), { homeHref: '../' });
    return { index: index + 1, slug, title: result.title, slides: result.slides, theme: result.theme };
  });
  writeFileSync(resolve(destination, 'index.html'), catalogHtml(entries), 'utf-8');
  writeFileSync(resolve(destination, '.nojekyll'), '', 'utf-8');
  writeFileSync(resolve(destination, 'presentations.json'), JSON.stringify(entries, null, 2), 'utf-8');
  return { outputDir: destination, entries };
}
