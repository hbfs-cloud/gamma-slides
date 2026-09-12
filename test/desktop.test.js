import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToDeck } from '../src/desktop/markdown.js';
import { formatWriterLine, highlightMarkdownWriter, writerLineKind, writerLinePresentation, writerMomentGap } from '../src/desktop/writer.js';
import { getPresentationTemplate, listPresentationTemplates } from '../src/desktop/templates.js';
import { appendRevision, findRevision, revisionSummaries } from '../src/desktop/revisions.js';
import { applyCorporateProfileSource, corporateProfileSummary, normalizeCorporateProfile } from '../src/desktop/corporate-profiles.js';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';
import { themePickerCSS } from '../src/engine/components/theme-picker.js';
import { insertMediaSlideSource, mutateSlidesSource, parseRichSource, patchMarkdownSlideSource, patchRichSlideSource, richSlideRanges } from '../src/desktop/deck-source.js';
import { renderHandoutHtml } from '../src/desktop/handout.js';
import { writeDeckPptx } from '../src/desktop/pptx.js';
import { mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFileSync } from 'fs';

test('Present waits for the latest draft and reports native launch failures', () => {
  const author = readFileSync(new URL('../src/desktop/author.js', import.meta.url), 'utf8');
  assert.match(author, /await flushSource\(\); await window\.gammaDesktop\.present\(\); setFeedback\('Stage opened/);
  for (const file of ['preload-author.js', 'preload-author.cjs']) {
    assert.match(readFileSync(new URL(`../src/desktop/${file}`, import.meta.url), 'utf8'), /present: \(\) => ipcRenderer\.invoke\('presenter:present'\)/);
  }
  assert.match(readFileSync(new URL('../src/desktop/main.js', import.meta.url), 'utf8'), /ipcMain\.handle\('presenter:present', \(\) => present\(\)\)/);
});

test('Gamma Presenter Markdown keeps stage copy distinct from speaker notes', () => {
  const deck = markdownToDeck(`# Une histoire\n## Le message visible\n- Une preuve\n\nLa note privée.\n\n---\n\n# La suite\nTexte de téléprompteur.`);
  assert.equal(deck.slides.length, 2);
  assert.equal(deck.slides[0].layout, 'bullets');
  assert.equal(deck.slides[0].title, 'Une histoire');
  assert.equal(deck.slides[0].subtitle, 'Le message visible');
  assert.deepEqual(deck.slides[0].items, [{ text: 'Une preuve' }]);
  assert.equal(deck.slides[0].notes, 'La note privée.');
  assert.equal(deck.slides[1].notes, 'Texte de téléprompteur.');
});

test('Gamma Presenter treats Markdown as a document writer, not a syntax-only input', () => {
  const prose = '# The decision\n## What the audience should remember\n\nThis stays in the private script.\n\n\n# The next moment\n- One proof';
  const deck = markdownToDeck(prose);
  assert.equal(deck.slides.length, 2, 'three returns create a new moment without a visible separator');
  assert.equal(deck.slides[0].notes, 'This stays in the private script.');
  assert.equal(deck.slides[1].items[0].text, 'One proof');
  assert.equal(writerLineKind('# The decision'), 'headline');
  assert.equal(writerLineKind('## What the audience should remember'), 'supporting');
  assert.equal(writerLineKind('This stays private.'), 'prose');
  assert.equal(writerLineKind('![Chart](media/chart.png)'), 'asset');
  assert.deepEqual(writerLinePresentation('# The decision'), { kind: 'headline', marker: '# ', content: 'The decision', label: '' });
  assert.equal(formatWriterLine('  > Existing thought', 'headline'), '  # Existing thought');
  assert.equal(formatWriterLine('The proof', 'point'), '- The proof');
  assert.equal(writerMomentGap('A line'), '\n\n\n');
  assert.equal(writerMomentGap('A line\n\n'), '\n');
  const documentSurface = highlightMarkdownWriter('# The decision\nOrdinary <prose>\n\n\n# The next moment');
  assert.match(documentSurface, /writer-headline/);
  assert.match(documentSurface, /writer-marker"># <\/span><span class="writer-content">The decision/);
  assert.match(documentSurface, /Ordinary &lt;prose&gt;/);
  assert.match(documentSurface, /writer-natural-moment/);
  const [author, css] = [
    readFileSync(new URL('../src/desktop/author.html', import.meta.url), 'utf8'),
    readFileSync(new URL('../src/desktop/desktop.css', import.meta.url), 'utf8'),
  ];
  assert.match(author, /Show headline/);
  assert.match(author, /id="toggle-raw-source"[^>]*>Markdown/);
  assert.match(css, /\.writer-marker \{ color: transparent/);
  assert.match(css, /\.writer-natural-moment::after/);
});

test('Gamma Presenter owns one macOS instance and a branded native icon', () => {
  const main = readFileSync(new URL('../src/desktop/main.js', import.meta.url), 'utf8');
  const icon = readFileSync(new URL('../build/icon.svg', import.meta.url), 'utf8');
  assert.match(main, /app\.setName\('Gamma Presenter'\)/);
  assert.match(main, /app\.requestSingleInstanceLock\(\)/);
  assert.match(main, /app\.on\('second-instance'/);
  assert.match(main, /app\.dock\.setIcon\(icon\)/);
  assert.match(icon, /aria-label="Gamma Presenter"/);
  assert.match(icon, /fill="#315DFF"/);
});

test('Author preview uses the selected theme without onboarding overlays or Markdown tools for rich source', () => {
  const main = readFileSync(new URL('../src/desktop/main.js', import.meta.url), 'utf8');
  const author = readFileSync(new URL('../src/desktop/author.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/desktop/desktop.css', import.meta.url), 'utf8');
  assert.match(main, /theme=\$\{encodeURIComponent\(state\.theme\)\}/);
  assert.match(author, /state\.rendererUrl\}&gamma-preview=1/);
  assert.match(css, /\.writer-actions\[hidden\] \{ display: none; \}/);
});

test('Gamma Presenter Markdown supports an image slide and its local reference', () => {
  const deck = markdownToDeck('# Signal\n![Le graphique](assets/graph.png)\n\nDécrire la lecture.');
  assert.equal(deck.slides[0].layout, 'image');
  assert.equal(deck.slides[0].image.src, 'assets/graph.png');
  assert.equal(deck.slides[0].notes, 'Décrire la lecture.');
});

test('Gamma Presenter Markdown supports local video and audio slides', () => {
  const video = markdownToDeck('# Demo\n@[video: Product demo](media/demo.mp4)\n\nIntroduce the demo.');
  const audio = markdownToDeck('# Voice\n@[audio](media/voice.m4a)');
  assert.deepEqual(video.slides[0].media, { kind: 'video', alt: 'Product demo', src: 'media/demo.mp4' });
  assert.equal(audio.slides[0].layout, 'media');
  assert.equal(audio.slides[0].media.kind, 'audio');
});

test('Gamma Presenter ships editable, runnable models in the packaged template gallery', () => {
  const templates = listPresentationTemplates();
  assert.deepEqual(templates.map(template => template.id), ['blank', 'narrative', 'board-update', 'architecture', 'live-rehearsal']);
  assert.equal(Object.hasOwn(templates[0], 'source'), false);
  assert.equal(getPresentationTemplate('unavailable'), null);

  for (const summary of templates) {
    const template = getPresentationTemplate(summary.id);
    assert.equal(template.themeName, summary.themeName);
    const deck = template.sourceKind === 'markdown'
      ? markdownToDeck(template.source, { title: template.deckTitle, theme: template.themeName })
      : loadDeck(template.source);
    assert.ok(deck.slides.length >= 2, `${template.title} needs multiple runnable slides`);
    assert.equal(deck.theme, template.themeName);
    assert.match(renderDeck(deck), /data-presentation-theme=/);
  }

  const board = loadDeck(getPresentationTemplate('board-update').source);
  assert.equal(board.slides[1].chart.type, 'bar');
  const architecture = loadDeck(getPresentationTemplate('architecture').source);
  assert.equal(architecture.slides[1].diagram.type, 'architecture');
  const rehearsal = loadDeck(getPresentationTemplate('live-rehearsal').source);
  assert.equal(rehearsal.slides[2].visual.mechanism.type, 'queue');
});

test('Gamma Presenter keeps a bounded local-only revision ledger for safe last-minute recovery', () => {
  const document = { source: '# Brief\n## Decision', sourceKind: 'markdown', title: 'Brief', theme: 'signal-room', sourcePath: '/tmp/brief.md' };
  const one = appendRevision([], document, { createdAt: 1, reason: 'Saved locally' });
  assert.equal(one.length, 1);
  assert.equal(appendRevision(one, document, { createdAt: 2 }).length, 1);
  const next = appendRevision(one, { ...document, source: '# Brief\n## Updated' }, { createdAt: 3, reason: 'Edited locally' });
  assert.equal(findRevision(next, next[1].id).source, '# Brief\n## Updated');
  assert.deepEqual(Object.keys(revisionSummaries(next)[0]).sort(), ['createdAt', 'id', 'reason', 'sourceKind', 'sourcePath', 'theme', 'title']);
  let bounded = [];
  for (let index = 0; index < 45; index += 1) bounded = appendRevision(bounded, { ...document, source: `# ${index}` }, { createdAt: index + 10, limit: 40 });
  assert.equal(bounded.length, 40);
  assert.equal(bounded[0].source, '# 5');
});

test('Gamma Presenter flushes and durably preserves the current source before local history restore', () => {
  const [main, author] = [
    readFileSync(new URL('../src/desktop/main.js', import.meta.url), 'utf8'),
    readFileSync(new URL('../src/desktop/author.js', import.meta.url), 'utf8'),
  ];
  assert.match(author, /historyList\.addEventListener\('click', async event => \{[\s\S]*?await flushSource\(\);[\s\S]*?restoreRevision/);
  assert.match(main, /async function restoreRevision\(id\) \{[\s\S]*?await syncAuthorDraft\(\);[\s\S]*?await writeFile\(revisionsFile\(\), JSON\.stringify\(preserved\), 'utf8'\);[\s\S]*?await syncAuthorDraft\(\);[\s\S]*?state\.editRevision !== expectedRevision[\s\S]*?sourcePath: null/);
});

test('Gamma Presenter applies a portable corporate profile at deck level without changing slide content', () => {
  const profile = normalizeCorporateProfile({ name: 'Northstar', company: 'Northstar Capital', theme: 'analyst-proof', apply_to_new_rich_decks: true, branding: { logo: 'https://example.test/logo.svg', watermark: 'Confidential', company_url: 'northstar.example' }, style: { primary_color: '#315DFF', accent_color: '#F5A623', font_heading: 'Inter' } });
  const source = `meta:\n  title: Board review\nslides:\n  - layout: title\n    title: Keep this decision\n    subtitle: Slide content survives\n`;
  const applied = applyCorporateProfileSource(source, 'yaml', profile);
  const deck = loadDeck(applied);
  assert.equal(deck.meta.company, 'Northstar Capital');
  assert.equal(deck.branding.watermark, 'Confidential');
  assert.equal(deck.style.accent_color, '#F5A623');
  assert.equal(deck.slides[0].title, 'Keep this decision');
  assert.deepEqual(corporateProfileSummary(profile), { name: 'Northstar', company: 'Northstar Capital', theme: 'analyst-proof', applyToNewRichDecks: true, hasLogo: true, colorCount: 2 });
  assert.throws(() => applyCorporateProfileSource('# Markdown', 'markdown', profile), /rich YAML or JSON/);
});

test('Gamma Presenter exposes corporate identity as a guided form instead of requiring JSON editing', () => {
  const [author, script, css] = [
    readFileSync(new URL('../src/desktop/author.html', import.meta.url), 'utf8'),
    readFileSync(new URL('../src/desktop/author.js', import.meta.url), 'utf8'),
    readFileSync(new URL('../src/desktop/desktop.css', import.meta.url), 'utf8'),
  ];
  for (const id of ['name', 'company', 'theme', 'logo', 'watermark', 'url', 'primary', 'secondary', 'accent', 'heading-font', 'body-font', 'mono-font']) assert.match(author, new RegExp(`id="corporate-profile-${id}"`));
  assert.doesNotMatch(author, /Corporate profile JSON/);
  assert.match(script, /function syncCorporateProfile/);
  assert.match(script, /branding: \{ logo: corporateProfileFields\.logo\.value/);
  assert.match(css, /\.corporate-profile-form \{ display: grid/);
});

test('Gamma Presenter makes local draft and publish boundaries visible in the Author titlebar', () => {
  const [author, script, css] = [
    readFileSync(new URL('../src/desktop/author.html', import.meta.url), 'utf8'),
    readFileSync(new URL('../src/desktop/author.js', import.meta.url), 'utf8'),
    readFileSync(new URL('../src/desktop/desktop.css', import.meta.url), 'utf8'),
  ];
  assert.match(author, /id="document-status"[^>]*>New local draft/);
  assert.match(script, /function syncDocumentStatus/);
  assert.match(script, /Draft · not published/);
  assert.match(script, /Saved locally/);
  assert.match(css, /\.document-status\[data-tone="error"\]/);
});

test('Gamma Presenter exposes Google Drive backup only as an explicit Author action and packages its integration', async () => {
  const [main, preload, author, packageJson] = await Promise.all([
    readFile(new URL('../src/desktop/main.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/desktop/preload-author.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/desktop/author.html', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ]);
  assert.match(main, /presenter:google-backup/);
  assert.match(main, /Google Drive backup can be started from the Author window only/);
  assert.match(main, /await import\('\.\.\/integrations\/google-drive\.js'\)/);
  assert.match(preload, /backupToGoogleDrive/);
  assert.match(author, /id="backup-google-drive"/);
  assert.match(packageJson, /"src\/integrations\/\*\*"/);
});

test('Gamma Presenter Markdown chooses quote, comparison, and table layouts from plain semantic patterns', () => {
  const quote = markdownToDeck('# Evidence\n> “Clarity beats volume.” — Ada Lovelace\n\nUse this as the close.');
  const comparison = markdownToDeck('# Choice\n| Before | After |\n| --- | --- |\n| Manual | Automated |\n| Slow | Fast |');
  const table = markdownToDeck('# Metrics\n| Team | Status | Owner |\n| --- | --- | --- |\n| Platform | Active | Lee |');
  assert.equal(quote.slides[0].layout, 'quote');
  assert.equal(quote.slides[0].author, 'Ada Lovelace');
  assert.equal(comparison.slides[0].layout, 'comparison');
  assert.deepEqual(comparison.slides[0].columns[1].items, ['Automated', 'Fast']);
  assert.equal(table.slides[0].layout, 'table');
  assert.deepEqual(table.slides[0].table.headers, ['Team', 'Status', 'Owner']);
});

test('Gamma Presenter keeps the full Gamma renderer for rich YAML decks', () => {
  const deck = loadDeck(`
meta: { title: Runtime riche }
slides:
  - layout: visual
    title: Illustration
    visual:
      src: https://example.test/illustration.gif
      alt: Illustration animée
  - layout: chart
    title: Signal
    chart:
      type: bar
      data:
        labels: [A, B]
        datasets:
          - { label: Valeur, values: [2, 5] }
`);
  const html = renderDeck(deck);
  assert.equal(deck.slides[0].visual.src, 'https://example.test/illustration.gif');
  assert.match(html, /data-gamma-runtime="echarts@6\.1\.0"/);
  assert.match(html, /studio-visual/);
  assert.match(html, /chart-/);
});

test('Gamma Presenter themes are separate publishing systems, not three palette aliases', () => {
  const deck = { meta: { title: 'Theme proof', presentation: 'direct' }, slides: [{ layout: 'title', title: 'One decision', subtitle: 'Keep the content stable while changing the edition.' }] };
  const analyst = renderDeck({ ...deck, theme: 'analyst-proof' });
  const cutting = renderDeck({ ...deck, theme: 'cutting-room' });
  const signal = renderDeck({ ...deck, theme: 'signal-room' });

  assert.match(analyst, /data-presentation-theme="analyst-proof"/);
  assert.match(analyst, /background:#F3F0E8/);
  assert.match(analyst, /writing-mode:vertical-rl/);
  assert.match(cutting, /data-presentation-theme="cutting-room"/);
  assert.match(cutting, /background:#080808/);
  assert.match(cutting, /text-transform:uppercase/);
  assert.match(cutting, /repeating-linear-gradient\(90deg,#FF5A1F/);
  assert.match(signal, /data-presentation-theme="signal-room"/);
  assert.match(signal, /background:#05070A/);
  assert.match(signal, /font-family:'Azeret Mono',monospace/);
  assert.match(signal, /@keyframes signalDepth/);
  assert.notEqual(analyst, cutting);
  assert.notEqual(cutting, signal);
});

test('Gamma Presenter gives a plain Markdown opening slide the selected theme composition', () => {
  const deck = markdownToDeck('# A clear story\n## The message your audience should remember', { theme: 'cutting-room' });
  const html = renderDeck(deck);

  assert.match(html, /class="editorial-cover"/);
  assert.match(html, /class="cover-index"><span>A clear story<\/span><strong>01<\/strong>/);
  assert.match(html, /class="cover-content">[\s\S]*<h1>A clear story<\/h1>/);
  assert.doesNotMatch(html, /Board material|>Q4</);
});

test('Gamma Presenter theme chooser keeps every theme swatch isolated from the active deck class', () => {
  const css = themePickerCSS();
  for (const theme of ['analyst-proof', 'cutting-room', 'signal-room']) {
    assert.match(css, new RegExp(`\\.gamma-theme-option\\.theme-${theme} \\.gamma-theme-preview`));
    assert.doesNotMatch(css, new RegExp(`(?<!gamma-theme-option)\\.theme-${theme} \\.gamma-theme-preview`));
  }
});

test('Gamma Presenter rich inspector patches YAML source without dropping chart structure', () => {
  const source = `meta: { title: Runtime riche }
theme: signal-room
slides:
  - layout: chart
    title: Signal
    notes: Ancienne note
    chart:
      type: bar
      data: { labels: [A, B], datasets: [{ label: Valeur, values: [2, 5] }] }
`;
  const patched = patchRichSlideSource(source, 'yaml', 0, { title: 'Signal mis à jour', notes: 'Nouvelle note', layout: 'chart', media: { kind: 'none', src: '' } });
  const deck = loadDeck(patched);
  assert.equal(deck.slides[0].title, 'Signal mis à jour');
  assert.equal(deck.slides[0].notes, 'Nouvelle note');
  assert.equal(deck.slides[0].chart.data.datasets[0].values[1], 5);
  assert.deepEqual(richSlideRanges(patched, 'yaml'), [{ start: patched.indexOf('  - layout:'), end: patched.length }]);
});

test('Gamma Presenter rich inspector preserves a first-class YouTube slide', () => {
  const source = `meta: { title: Embedded source, language: en }
slides:
  - layout: media
    title: Watch it live
`;
  const patched = patchRichSlideSource(source, 'yaml', 0, {
    layout: 'media',
    media: { kind: 'youtube', src: 'https://www.youtube.com/watch?v=o8NiE3XMPrM' },
  });
  const deck = loadDeck(patched);
  assert.equal(deck.slides[0].media.kind, 'youtube');
  assert.equal(deck.slides[0].media.src, 'https://www.youtube.com/watch?v=o8NiE3XMPrM');
});

test('Gamma Presenter locates JSON slides for source-aware rich editing', () => {
  const source = '{\n  "meta": { "title": "JSON" },\n  "slides": [\n    { "layout": "blank", "title": "A" },\n    { "layout": "blank", "title": "B" }\n  ]\n}';
  const ranges = richSlideRanges(source, 'json');
  assert.equal(ranges.length, 2);
  assert.equal(source.slice(ranges[1].start, ranges[1].end).includes('"B"'), true);
});

test('Gamma Presenter slide operations preserve Markdown content and keep one editable slide', () => {
  const source = '# First\n\nNote one.\n\n---\n\n# Second\n\nNote two.\n';
  const duplicated = mutateSlidesSource(source, 'markdown', 'duplicate', 0);
  assert.match(duplicated.source, /# First[\s\S]*---[\s\S]*# First[\s\S]*---[\s\S]*# Second/);
  assert.equal(duplicated.currentIndex, 1);
  const moved = mutateSlidesSource(duplicated.source, 'markdown', 'move', 1, 2);
  assert.equal(moved.source.indexOf('# Second') < moved.source.lastIndexOf('# First'), true);
  const onlySlide = mutateSlidesSource('# Only', 'markdown', 'delete', 0);
  assert.match(onlySlide.source, /# New slide/);
});

test('Gamma Presenter Markdown inspector patches only the selected slide semantics', () => {
  const source = '# Original\n## Old subtitle\n![Chart](media/chart.png)\n- Keep evidence\n\nOld note.\n\n---\n\n# Second\n\nUntouched note.\n';
  const patched = patchMarkdownSlideSource(source, 0, { title: 'Updated', subtitle: 'New subtitle', notes: 'New note.\nSecond sentence.' });
  assert.match(patched.source, /# Updated\n## New subtitle\n!\[Chart\]\(media\/chart\.png\)\n- Keep evidence\n\nNew note\.\nSecond sentence\./);
  assert.match(patched.source, /# Second\n\nUntouched note\./);
  assert.equal(patched.currentIndex, 0);
});

test('Gamma Presenter slide operations retain unsupported rich Gamma properties', () => {
  const source = `meta: { title: Technical deck }
slides:
  - layout: chart
    title: Signal
    chart:
      type: bar
      data: { labels: [A], datasets: [{ label: Value, values: [5] }] }
    animation: { type: cinematic }
  - layout: blank
    title: Terminal
    terminal: { command: echo hello }
`;
  const duplicated = mutateSlidesSource(source, 'yaml', 'duplicate', 0);
  const deck = parseRichSource(duplicated.source, 'yaml');
  assert.equal(deck.slides.length, 3);
  assert.equal(deck.slides[1].chart.data.datasets[0].values[0], 5);
  assert.equal(deck.slides[1].animation.type, 'cinematic');
  const moved = mutateSlidesSource(duplicated.source, 'yaml', 'move', 2, 0);
  assert.equal(parseRichSource(moved.source, 'yaml').slides[0].title, 'Terminal');
  const json = mutateSlidesSource('{"slides":[{"title":"A","three":{"scene":"network"}}]}', 'json', 'add', 0);
  assert.equal(JSON.parse(json.source).slides[0].three.scene, 'network');
  assert.equal(JSON.parse(json.source).slides.length, 2);
});

test('Gamma Presenter inserts portable local media as a new Markdown or rich slide', () => {
  const markdown = insertMediaSlideSource('# Story', 'markdown', 0, { src: 'media/launch.mp4', kind: 'video', alt: 'Launch demo' });
  const markdownDeck = markdownToDeck(markdown.source);
  assert.equal(markdown.currentIndex, 1);
  assert.equal(markdownDeck.slides[1].media.src, 'media/launch.mp4');
  const rich = insertMediaSlideSource('slides:\n  - layout: blank\n    title: Existing\n', 'yaml', 0, { src: 'media/loop.gif', kind: 'visual', alt: 'Loop' });
  const richDeck = parseRichSource(rich.source, 'yaml');
  assert.equal(rich.currentIndex, 1);
  assert.equal(richDeck.slides[1].visual.src, 'media/loop.gif');
});

test('Gamma Presenter handouts preserve speaker material without allowing source markup', () => {
  const html = renderHandoutHtml({ meta: { title: '<Quarterly>' }, slides: [{ title: 'Proof', items: [{ text: 'One <two>' }], quote: 'Trust & verify', author: 'A. Person', notes: 'Say the useful part.', media: { kind: 'video', src: 'media/demo.mp4', alt: 'Demo' }, table: { headers: ['Metric'], rows: [['<safe>']] } }] });
  assert.match(html, /Speaker handout/);
  assert.match(html, /Say the useful part\./);
  assert.match(html, /&lt;Quarterly&gt;/);
  assert.match(html, /&lt;safe&gt;/);
  assert.doesNotMatch(html, /<Quarterly>|<safe>/);
});

test('Gamma Presenter writes a PowerPoint that retains semantic content and notes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gamma-presenter-pptx-'));
  const fileName = join(directory, 'deck.pptx');
  await writeDeckPptx({ meta: { title: 'Board update' }, slides: [{ title: 'Decision', subtitle: 'One clear choice', items: [{ text: 'Evidence' }], notes: 'Say this.' }, { title: 'Comparison', columns: [{ heading: 'Before', items: ['Manual'] }, { heading: 'After', items: ['Automated'] }] }] }, fileName, { sourceDirectory: directory });
  const bytes = await readFile(fileName);
  assert.equal(bytes.subarray(0, 2).toString(), 'PK');
  assert.ok(bytes.byteLength > 4_000);
});
