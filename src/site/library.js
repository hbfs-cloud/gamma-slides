import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { loadDeckFile } from '../loader/index.js';
import { buildStaticSite } from './build.js';
import { presentationSlug } from './github-pages.js';

const featuredDecks = [
  { slug: 'gamma-presenter-capabilities', kind: 'Media on stage', title: 'Play the real scene, inside the deck.', copy: 'A privacy-enhanced YouTube player is presentation content—not a color-bar stand-in. Open the full deck when you want to take control.', slide: 3 },
  { slug: 'gamma-presenter-capabilities', kind: 'Architecture in motion', title: 'Let the system explain itself.', copy: 'The Archify scene exposes focus views and relationships as a living diagram, rather than a frozen architecture screenshot.', slide: 5 },
  { slug: 'flagship', kind: 'Board review', title: 'Keep the data live through the decision.', copy: 'A long-form operating review with decision context, interactive data scenes, and the technical detail a serious review cannot leave behind.', slide: 18 },
  { slug: 'immersive-data', kind: 'Data in space', title: 'Use three dimensions when they clarify.', copy: 'Drag the live runtime to inspect a spatial comparison; the audience still has a conventional, accessible fallback.', slide: 1 },
  { slug: 'gamma-presenter-capabilities', kind: 'Browser evidence', title: 'Navigate the proof without leaving the story.', copy: 'A browser scene carries repositories, documentation, dashboards, or a web app into the deck when a real system is the evidence.', slide: 7 },
  { slug: 'gamma-presenter-capabilities', kind: 'AI operator', title: 'Make automation ask before it acts.', copy: 'Clocks, cues, local MCP status, and approval requests keep the human presenter at the control boundary.', slide: 9 },
];

const repositoryUrl = 'https://github.com/hbfs-cloud/gamma-slides';
const packageVersion = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;

function featuredDeckHtml(entries) {
  return featuredDecks.map(content => {
    const { slug } = content;
    const entry = entries.find(candidate => candidate.slug === slug);
    if (!entry) return '';
    const href = `./${encodeURIComponent(entry.slug)}/#/${content.slide}`;
    const previewHref = `./${encodeURIComponent(entry.slug)}/?gamma-preview=1&gamma-clean=gallery#/${content.slide}`;
    return `<article class="deck-row">
      <div class="deck-meta"><p>${content.kind} <span aria-hidden="true">/</span> ${entry.slides} slides</p><h3>${content.title}</h3><span>${content.copy}</span><a href="${href}">Open the full live deck <b aria-hidden="true">→</b></a></div>
      <div class="deck-preview" data-live-preview-shell>
        <div class="deck-preview-stage"><iframe data-live-preview data-src="${previewHref}" title="Live Gamma Presenter preview: ${content.kind}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="deck-preview-loading"><button type="button" data-play-preview aria-label="Play ${content.kind} preview">Play live preview</button><span data-preview-status role="status">The full interactive deck, loaded on demand.</span></div></div>
        <div class="deck-preview-caption"><span>Interactive preview</span><a href="${href}" aria-label="Open the full ${content.kind} demo">Open full screen <b aria-hidden="true">→</b></a></div>
      </div>
    </article>`;
  }).join('');
}

function catalogHtml(entries, releaseVersion) {
  const releaseUrl = `${repositoryUrl}/releases/tag/v${releaseVersion}`;
  // GitHub normalizes spaces in uploaded release asset names to periods.
  const macDownloadUrl = `${repositoryUrl}/releases/download/v${releaseVersion}/Gamma.Presenter-${releaseVersion}-arm64-mac.zip`;
  const releaseNote = releaseVersion === packageVersion ? '' : `<p class="download-note">Live demos follow the latest source. The desktop download remains v${releaseVersion} while the next update is being validated.</p>`;
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
    .runtime-proof{display:grid;grid-template-columns:minmax(260px,.68fr) minmax(0,1.32fr);gap:clamp(35px,8vw,124px);align-items:center;padding:clamp(88px,12vw,156px) 0}.runtime-proof h2,.ai-boundary h2{max-width:10ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.9rem,5.4vw,5.4rem);font-weight:440;letter-spacing:-.04em;line-height:.94;text-wrap:balance}.runtime-proof p{max-width:32ch;margin:23px 0 0;color:#62646b;font-size:1rem;line-height:1.6}.runtime-proof a,.deck-meta a,.ai-copy>a{display:inline-flex;gap:9px;margin-top:25px;color:#111318;font-weight:790;text-decoration:none}.runtime-proof a b,.deck-meta a b,.ai-copy>a b{color:#1748d5;font-size:1.2rem}.runtime-loop{margin:0;border:1px solid #111318;background:#05070a}.runtime-loop picture,.runtime-loop img{display:block;width:100%;height:auto}.runtime-loop figcaption{padding:12px 15px;background:#fbf9f3;color:#62646b;font-size:.77rem;line-height:1.45}.runtime-loop figcaption strong{color:#111318}
    .ai-boundary{display:grid;grid-template-columns:minmax(260px,.7fr) minmax(0,1.3fr);gap:clamp(35px,8vw,124px);padding:clamp(88px,12vw,156px) 0;border-top:1px solid #cfc9bd}.ai-copy>p{max-width:56ch;margin:0 0 28px;color:#62646b;font-size:1.08rem;line-height:1.62}.approval-path{margin:0;padding:0;list-style:none;border-top:1px solid #cfc9bd}.approval-path li{display:grid;grid-template-columns:140px minmax(0,1fr);gap:25px;padding:18px 0;border-bottom:1px solid #cfc9bd}.approval-path strong{font-size:.88rem}.approval-path span{color:#62646b;font-size:.94rem}.ai-copy>a{margin-top:28px}
    .decks{padding:clamp(86px,12vw,156px) 0}.deck-intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,.64fr);gap:44px;align-items:end;padding-bottom:45px}.deck-intro p{max-width:35ch;margin:0;color:#62646b;font-size:1rem;line-height:1.6}.deck-row{display:grid;grid-template-columns:minmax(240px,.62fr) minmax(0,1.38fr);gap:clamp(36px,7vw,108px);align-items:center;padding:clamp(53px,8vw,100px) 0;border-top:1px solid #cfc9bd}.deck-row:last-child{border-bottom:1px solid #cfc9bd}.deck-meta>p{margin:0 0 14px;color:#1748d5;font-size:.75rem;font-weight:790;letter-spacing:.08em;text-transform:uppercase}.deck-meta>p span{color:#5e46a8}.deck-meta h3{max-width:11ch;margin:0;font-family:SourceSerif,Georgia,serif;font-size:clamp(2.15rem,3.7vw,4rem);font-weight:440;letter-spacing:-.04em;line-height:.96}.deck-meta>span{display:block;max-width:35ch;margin-top:19px;color:#62646b;font-size:.96rem;line-height:1.58}.deck-preview{border:1px solid #111318;background:#111318}.deck-preview-stage{position:relative;aspect-ratio:16/9;overflow:hidden;background:#0a101b}.deck-preview-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0;transition:opacity .36s ease}.deck-preview[data-live-ready] iframe{opacity:1}.deck-preview-loading{position:absolute;inset:0;display:grid;place-items:center;background:#0a101b;color:#f3f0e8;font-size:.72rem;font-weight:780;letter-spacing:.08em;text-transform:uppercase;transition:opacity .24s ease}.deck-preview[data-live-ready] .deck-preview-loading{opacity:0;pointer-events:none}.deck-preview-caption{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:11px 14px;background:#fbf9f3}.deck-preview-caption span{color:#62646b;font-size:.7rem;font-weight:790;letter-spacing:.07em;text-transform:uppercase}.deck-preview-caption a{display:inline-flex;align-items:center;gap:8px;color:#111318;font-size:.78rem;font-weight:790;text-decoration:none}.deck-preview-caption a:hover{color:#1748d5}.deck-preview-caption b{color:#1748d5;font-size:1.1rem}
    .install{display:grid;grid-template-columns:minmax(0,.86fr) minmax(0,1.14fr);gap:clamp(38px,8vw,130px);padding:clamp(88px,12vw,150px) 0}.install-copy{align-self:center}.install-copy p{max-width:35ch;margin:21px 0 0;color:#62646b;font-size:1.05rem;line-height:1.6}.install-meta{padding-top:3px}.install-meta .action{width:100%}.download-note{margin:13px 0 0;color:#62646b;font-size:.82rem;line-height:1.55}.source-command{margin:27px 0 0;padding:19px 22px;overflow:auto;border:1px solid #cfc9bd;background:#fbf9f3;color:#3c3d43;font-family:ui-monospace,monospace;font-size:.84rem;line-height:1.72}.source-command code{white-space:pre}.site-footer{display:flex;align-items:center;justify-content:space-between;gap:25px;padding:27px 0 42px;border-top:1px solid #cfc9bd;color:#62646b;font-size:.84rem}.site-footer nav{display:flex;flex-wrap:wrap;gap:19px}.site-footer a{color:#111318}.site-footer a:hover{color:#1748d5}
    @media(max-width:850px){.hero-copy,.evidence,.runtime-proof,.ai-boundary,.deck-intro,.install{grid-template-columns:1fr}.hero h1{max-width:11ch}.hero-aside{max-width:620px}.evidence{gap:45px}.runtime-proof,.ai-boundary{gap:37px}.proof-band>div{grid-template-columns:1fr}.proof-band article,.proof-band article:first-child{min-height:auto;padding:29px 0;border-right:0;border-left:0;border-bottom:1px solid #8ba8ff}.proof-band article:last-child{border-bottom:0}.proof-band h3{margin-bottom:13px}.deck-intro{gap:25px}.deck-row{grid-template-columns:1fr;gap:31px}.deck-preview{max-width:820px}.install{gap:35px}.site-footer{align-items:flex-start;flex-direction:column}}
    @media(max-width:590px){.shell{width:min(100% - 32px,1240px)}.site-header{align-items:flex-start;padding:16px 0}.site-header nav{justify-content:flex-start;gap:12px 16px}.site-header .source-link{min-height:32px;padding:0 8px}.hero{padding-top:46px}.hero h1{font-size:clamp(3.2rem,15.4vw,4.65rem)}.release-facts{gap:7px 13px}.release-facts li+li:before{margin-right:13px}.product-shot figcaption{grid-template-columns:1fr;gap:3px}.evidence-list li,.approval-path li{grid-template-columns:1fr;gap:5px}.decks{padding:76px 0}.deck-row{padding:55px 0}.deck-preview-stage{aspect-ratio:2 / 3}.deck-preview-caption{padding:10px 11px}.deck-preview-caption span{font-size:.61rem}.deck-preview-caption a{font-size:.75rem}.install{padding:78px 0}.source-command{padding:16px;font-size:.74rem}.site-footer{padding-bottom:28px}}
    .deck-preview-loading{align-content:center;gap:16px;padding:24px;background:#f3f0e8;color:#62646b;text-transform:none;letter-spacing:0;text-align:center}.deck-preview-loading button{justify-self:center;min-height:44px;padding:10px 18px;border:1px solid #1748d5;border-radius:9px;background:#1748d5;color:#fff;font:700 .9rem InstrumentSans,system-ui,sans-serif;cursor:pointer}.deck-preview-loading button:focus-visible{outline:2px solid #111318;outline-offset:4px}.deck-preview[data-live-ready] .deck-preview-loading{visibility:hidden}
    .hero-copy>*,.evidence>*,.runtime-proof>*,.ai-boundary>*,.deck-intro>*,.deck-row>*,.install>*{min-width:0}.deck-preview-loading button{font-family:Instrument,system-ui,sans-serif}@media(max-width:590px){.site-header{flex-direction:column;gap:16px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.action,.deck-preview-stage iframe,.deck-preview-loading{transition:none}.action:hover{transform:none}}
  </style>
</head>
<body>
  <header class="site-header shell">
    <a class="brand" href="./" aria-label="Gamma Presenter home"><img src="./assets/gamma-presenter-icon.svg" alt="Gamma Presenter logo">Gamma Presenter</a>
    <nav aria-label="Primary navigation"><a href="#proof">What it does</a><a href="#ai">AI boundary</a><a href="#live-gallery">Live gallery</a><a href="#download">Download</a><a class="source-link" href="${repositoryUrl}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.49c-2.23.49-2.7-.95-2.7-.95-.37-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.89.87 2.35.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.97 0-.88.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82A7.63 7.63 0 0 1 8 4.8c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.27.83 2.15 0 3.09-1.87 3.77-3.66 3.97.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>Source</a></nav>
  </header>
  <main>
<section class="hero shell" aria-labelledby="hero-title"><div class="hero-copy"><h1 id="hero-title">Presentations with a live operating system.</h1><div class="hero-aside"><p>Gamma Presenter is the native macOS workspace for decks that carry more than text: real visuals, a real stage, a real clock, and a local AI operator that asks before it acts.</p><div class="actions"><a class="action" href="${macDownloadUrl}">Download Gamma Presenter</a><a class="action secondary" href="${releaseUrl}">Release notes</a></div><ul class="release-facts" aria-label="Current release"><li>v${releaseVersion}</li><li>Apple silicon</li><li>ZIP + DMG</li><li>Unsigned</li></ul></div></div><figure class="product-shot"><picture><source media="(prefers-reduced-motion: no-preference)" srcset="./assets/gamma-presenter-immersive-runtime.gif" type="image/gif"><img src="./assets/gamma-presenter-author-rich.png" alt="The English Gamma Presenter workspace with a live architecture preview" fetchpriority="high"></picture><figcaption><strong>A running Gamma scene.</strong><span>This is a recorded product loop, not a mockup: the runtime stays interactive when the deck opens.</span><a href="./gamma-presenter-capabilities/">Explore the live tour <b aria-hidden="true">→</b></a></figcaption></figure></section>
    <div class="hero-rule" aria-hidden="true"></div>
    <section class="evidence shell" id="proof" aria-labelledby="proof-title"><h2 id="proof-title">Do not flatten the work to fit the slides.</h2><div class="evidence-copy"><p>Write an argument in Markdown. Keep a rich Gamma deck intact when the argument needs media, diagrams, charts, a browser scene, terminal output, or 3D. Then carry that same document into Stage.</p><ul class="evidence-list"><li><strong>Author</strong><span>Create, duplicate, reorder, inspect, and write slides in Markdown, YAML, or JSON without erasing advanced deck configuration.</span></li><li><strong>Compose</strong><span>Use project-local images, GIFs, video, audio, charts, diagrams, and GPU scenes as presentation content — not a screenshot workaround.</span></li><li><strong>Present</strong><span>Run Stage and Speaker View with notes, display selection, elapsed time, countdowns, cues, recording, and explicit recovery controls.</span></li><li><strong>Co-animate</strong><span>Connect a local Claude Code or Codex workflow through loopback MCP. Sensitive live actions queue visibly for the presenter to approve or reject.</span></li></ul></div></section>
    <section class="proof-band" aria-label="Gamma Presenter principles"><div class="shell"><article><h3>One document</h3><p>Fast source for the writer. Full fidelity for the runtime.</p></article><article><h3>One room</h3><p>Authoring, stagecraft, recording, and live operations stay connected.</p></article><article><h3>One boundary</h3><p>AI can assist the show. The operator retains the final action.</p></article></div></section>
    <section class="runtime-proof shell" aria-labelledby="runtime-title"><div><h2 id="runtime-title">Make the visual do the explaining.</h2><p>Build beyond static slides: cinematic scenes, charts, Archify diagrams, 3D, media, browser experiences, recording, and presenter controls are all native parts of the same deck.</p><a href="./immersive-data/">Open the immersive data demo <b aria-hidden="true">→</b></a></div><figure class="runtime-loop"><picture><source media="(prefers-reduced-motion: no-preference)" srcset="./assets/gamma-presenter-cinematic-runtime.gif" type="image/gif"><img src="./assets/gamma-presenter-control-room.png" alt="The Gamma Presenter Author workspace with its local presentation control room"></picture><figcaption><strong>Motion belongs to the argument.</strong> A second captured runtime loop shows a cinematic data scene; reduced-motion visitors receive the real Author workspace instead.</figcaption></figure></section>
    <section class="ai-boundary shell" id="ai" aria-labelledby="ai-title"><h2 id="ai-title">AI can propose the show. You keep the controls.</h2><div class="ai-copy"><p>Claude Code and Codex can inspect the source, generate a deck, validate it, and work through a local MCP endpoint while you rehearse. They never receive ambient access to the room.</p><ol class="approval-path"><li><strong>Write and validate</strong><span>Use the same editable Markdown, YAML, or JSON source the team will review and release.</span></li><li><strong>Request, don’t seize</strong><span>Stage, recording, capture, browser, terminal, and spoken-note actions arrive as named requests in the Author control room.</span></li><li><strong>Approve or reject</strong><span>The presenter decides each consequential action, with a visible local activity trail and no public MCP listener.</span></li></ol><a href="${repositoryUrl}/blob/main/docs/LLM_QUICKSTART.md">Read the Claude and Codex workflow <b aria-hidden="true">→</b></a></div></section>
    <section class="decks shell" id="live-gallery" aria-labelledby="decks-title"><div class="deck-intro"><h2 id="decks-title">A live gallery, not a wall of screenshots.</h2><p>Each viewport below is a lazy-loaded instance of a generated deck. Watch it move here; open the full demo to explore the controls, navigation, values, and source-linked output yourself.</p></div>${demos || '<p>No featured presentations have been deployed yet.</p>'}</section>
    <section class="install shell" id="download" aria-labelledby="download-title"><div class="install-copy"><h2 id="download-title">Install the app. Keep the runtime.</h2><p>Gamma Presenter is available now for Apple-silicon Macs. The release contains the Gamma Presenter app in a ZIP and is explicitly unsigned while Apple Developer signing credentials are not configured.</p>${releaseNote}</div><div class="install-meta"><a class="action" href="${macDownloadUrl}">Download for Apple silicon</a><p class="download-note">Direct GitHub Release download · v${releaseVersion} · ZIP + DMG · <a href="${releaseUrl}">checksums and release notes</a></p><pre class="source-command"><code>git clone ${repositoryUrl}.git
cd gamma-slides
bun install
bun run desktop</code></pre></div></section>
  </main>
  <footer class="site-footer shell"><span>Gamma Presenter is built on the Gamma Slides engine.</span><nav aria-label="Footer"><a href="${repositoryUrl}/blob/main/README.md">README</a><a href="${repositoryUrl}/blob/main/docs/gamma-presenter-macos.md">macOS guide</a><a href="${repositoryUrl}">GitHub</a></nav></footer>
  <script>
    (() => {
      const previews = Array.from(document.querySelectorAll('[data-live-preview]'));
      let activePreview;
      let readinessTimer;
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
      const stop = () => {
        clearInterval(readinessTimer);
        if (activePreview) {
          activePreview.removeAttribute('src');
          activePreview.closest('[data-live-preview-shell]').removeAttribute('data-live-ready');
          activePreview.closest('[data-live-preview-shell]').querySelector('[data-preview-status]').textContent = 'The full interactive deck, loaded on demand.';
        }
        activePreview = null;
      };
      const activate = frame => {
        if (frame === activePreview) return;
        stop();
        activePreview = frame;
        const shell = frame.closest('[data-live-preview-shell]');
        shell.querySelector('[data-preview-status]').textContent = 'Loading the live runtime';
        frame.src = frame.dataset.src;
        const started = Date.now();
        readinessTimer = setInterval(() => {
          let ready = false;
          try { ready = Boolean(frame.contentWindow.__GAMMA_READY__); } catch {}
          if (ready) { shell.setAttribute('data-live-ready', ''); clearInterval(readinessTimer); }
          else if (Date.now() - started > 15000) {
            stop();
            shell.querySelector('[data-preview-status]').textContent = 'Preview unavailable. Try again or open the full demo below.';
          }
        }, 100);
      };
      previews.forEach(frame => frame.closest('[data-live-preview-shell]').querySelector('[data-play-preview]').addEventListener('click', () => activate(frame)));
      const visible = new Map();
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => visible.set(entry.target, entry.intersectionRatio));
          if (document.hidden) { stop(); return; }
          if (reducedMotion.matches) { if (activePreview && !visible.get(activePreview)) stop(); return; }
          const best = previews.filter(frame => visible.get(frame) > 0).sort((a, b) => visible.get(b) - visible.get(a))[0];
          if (best) activate(best); else stop();
        }, { threshold: [0, .25, .5, .75, 1] });
        previews.forEach(frame => observer.observe(frame));
      }
      reducedMotion.addEventListener('change', stop);
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    })();
  </script>
</body>
</html>`;
}

function copyMarketingAssets(destination) {
  const assets = [
    ['build/icon.svg', 'gamma-presenter-icon.svg'],
    ['docs/images/gamma-presenter-control-room.png', 'gamma-presenter-control-room.png'],
    ['docs/images/gamma-presenter-author-rich.png', 'gamma-presenter-author-rich.png'],
    ['docs/images/gamma-presenter-immersive-runtime.gif', 'gamma-presenter-immersive-runtime.gif'],
    ['docs/images/gamma-presenter-cinematic-runtime.gif', 'gamma-presenter-cinematic-runtime.gif'],
    ['node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2', 'instrument-sans-latin-wght-normal.woff2'],
    ['node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2', 'source-serif-4-latin-wght-normal.woff2'],
  ];
  const assetDirectory = resolve(destination, 'assets');
  mkdirSync(assetDirectory, { recursive: true });
  assets.forEach(([source, target]) => copyFileSync(resolve(source), resolve(assetDirectory, target)));
}

export function buildPresentationLibrary({ inputDir = './presentations', outputDir = './_site', include = [], language = '', releaseVersion = process.env.GAMMA_PUBLIC_RELEASE_VERSION || packageVersion } = {}) {
  if (!/^\d+\.\d+\.\d+$/.test(releaseVersion)) throw new Error('Public release version must be a stable semantic version, such as 2.0.3.');
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
  writeFileSync(resolve(destination, 'index.html'), catalogHtml(entries, releaseVersion), 'utf-8');
  writeFileSync(resolve(destination, '.nojekyll'), '', 'utf-8');
  writeFileSync(resolve(destination, 'presentations.json'), JSON.stringify(entries, null, 2), 'utf-8');
  return { outputDir: destination, entries };
}
