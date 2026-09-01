#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loadDeckFile } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';
import { generateVideoFromDeck } from '../src/video/generate-v2.js';
import { generateThumbnail } from '../src/video/thumbnail.js';
import { listThemes } from '../src/themes/index.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { execFileSync } from 'child_process';
import { buildStaticSite } from '../src/site/build.js';
import { buildPresentationLibrary } from '../src/site/library.js';
import {
  DEFAULT_PAGES_REPO,
  deletePresentation,
  deployPresentationFile,
  listPresentations,
  pullPresentation,
  presentationUrl,
} from '../src/site/github-pages.js';
import { setupAgentClients } from '../src/integrations/setup.js';

const program = new Command();

program
  .name('gamma-slides')
  .description(chalk.hex('#2563EB')('gamma-slides') + ' — Professional presentation & video generator')
  .version('2.0.0');

program
  .command('generate')
  .alias('g')
  .description('Generate HTML presentation from a deck spec')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .option('-o, --output <path>', 'Output HTML path')
  .option('--theme <name>', 'Override theme')
  .action(async (opts) => {
    try {
      const deck = loadDeckFile(opts.file);
      if (opts.theme) deck.theme = opts.theme;
      const html = renderDeck(deck);
      const slug = (deck.meta?.title || 'presentation').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
      const outPath = resolve(opts.output || `./output/${slug}.html`);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, html, 'utf-8');
      console.log(chalk.green('✓') + ` Generated: ${chalk.bold(outPath)}`);
      console.log(chalk.dim(`  ${deck.slides.length} slides • theme: ${deck.theme} • ${deck.meta?.title || ''}`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('site')
  .description('Build a static presentation site ready for GitHub Pages')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .option('-o, --output <dir>', 'Static site directory', './site')
  .option('--theme <name>', 'Override theme')
  .action(async (opts) => {
    try {
      const deck = loadDeckFile(opts.file);
      if (opts.theme) deck.theme = opts.theme;
      const result = buildStaticSite(deck, opts.output);
      console.log(chalk.green('✓') + ` Site ready: ${chalk.bold(result.siteDir)}`);
      console.log(chalk.dim(`  ${result.slides} slides • theme: ${result.theme} • entry: ${result.indexPath}`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('library')
  .description('Build a static library containing every managed presentation')
  .option('-d, --directory <dir>', 'Directory containing managed YAML/JSON decks', './presentations')
  .option('-i, --include <path...>', 'Additional deck files to include')
  .option('-o, --output <dir>', 'Static library directory', './_site')
  .action((opts) => {
    try {
      const result = buildPresentationLibrary({ inputDir: opts.directory, outputDir: opts.output, include: opts.include || [] });
      console.log(chalk.green('✓') + ` Library ready: ${chalk.bold(result.outputDir)}`);
      console.log(chalk.dim(`  ${result.entries.length} presentation${result.entries.length === 1 ? '' : 's'} • index.html + presentations.json`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Connect Gamma Slides to Claude Code and Codex in one command')
  .option('--client <name>', 'Client: all, claude, or codex', 'all')
  .option('--repo <owner/repo>', 'Repository used for managed GitHub Pages deployments', process.env.GAMMA_SLIDES_REPO || DEFAULT_PAGES_REPO)
  .action((opts) => {
    try {
      const result = setupAgentClients(opts.client, opts.repo);
      result.results.forEach(item => {
        if (item.configured) console.log(chalk.green('✓') + ` ${item.client}: Gamma Slides connected`);
        else console.log(chalk.yellow('•') + ` ${item.client}: skipped (${item.reason})`);
      });
      console.log(chalk.dim(`  MCP runner: ${result.runner}`));
      console.log(chalk.dim(`  Deployment library: ${result.repo}`));
      console.log(`  Ask your agent: ${chalk.cyan('Create, validate, and deploy a Gamma Slides presentation…')}`);
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Create or update a presentation on the free GitHub Pages library')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .option('--slug <slug>', 'Stable public slug; defaults to the deck title')
  .option('--repo <owner/repo>', 'GitHub Pages repository', process.env.GAMMA_SLIDES_REPO || DEFAULT_PAGES_REPO)
  .option('--open', 'Open the public presentation URL after deployment')
  .action(async (opts) => {
    try {
      const result = deployPresentationFile({ file: opts.file, repo: opts.repo, slug: opts.slug });
      console.log(chalk.green('✓') + ` Presentation ${result.action}: ${chalk.bold(result.title)}`);
      console.log(chalk.cyan(result.url));
      console.log(chalk.dim(`  ${result.slides} slides • ${result.theme} • source: ${result.repo}/${result.path}`));
      console.log(chalk.dim(`  Deployment status: ${result.actionsUrl}`));
      if (opts.open) (await import('open')).default(result.url);
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('sites')
  .description('List every managed presentation and its public URL')
  .option('--repo <owner/repo>', 'GitHub Pages repository', process.env.GAMMA_SLIDES_REPO || DEFAULT_PAGES_REPO)
  .action((opts) => {
    try {
      const sites = listPresentations(opts.repo);
      if (!sites.length) console.log(chalk.yellow('No managed presentations yet.'));
      sites.forEach(site => {
        console.log(`${chalk.bold(site.slug)}  ${site.title}`);
        console.log(chalk.dim(`  ${site.slides} slides • ${site.theme}`));
        console.log(`  ${chalk.cyan(site.url)}`);
      });
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('pull <slug>')
  .description('Download a deployed presentation source for editing')
  .option('-o, --output <path>', 'Local YAML output path')
  .option('--repo <owner/repo>', 'GitHub Pages repository', process.env.GAMMA_SLIDES_REPO || DEFAULT_PAGES_REPO)
  .action((slug, opts) => {
    try {
      const result = pullPresentation({ repo: opts.repo, slug, output: opts.output });
      console.log(chalk.green('✓') + ` Downloaded: ${chalk.bold(result.outputPath)}`);
      console.log(chalk.dim(`  Edit it, then run deploy with the same slug to update the live site.`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('open-site <slug>')
  .description('Open a deployed presentation in the browser')
  .option('--repo <owner/repo>', 'GitHub Pages repository', process.env.GAMMA_SLIDES_REPO || DEFAULT_PAGES_REPO)
  .action(async (slug, opts) => {
    const url = presentationUrl(opts.repo, slug);
    console.log(chalk.cyan(url));
    (await import('open')).default(url);
  });

program
  .command('delete-site <slug>')
  .description('Delete a managed presentation from the public library')
  .option('--repo <owner/repo>', 'GitHub Pages repository', process.env.GAMMA_SLIDES_REPO || DEFAULT_PAGES_REPO)
  .option('--yes', 'Confirm permanent deletion of the deployed source')
  .action((slug, opts) => {
    if (!opts.yes) {
      console.error(chalk.yellow(`Confirmation required. Re-run with: gamma-slides delete-site ${slug} --yes`));
      process.exit(1);
    }
    try {
      const result = deletePresentation({ repo: opts.repo, slug });
      console.log(chalk.green('✓') + ` Deleted: ${chalk.bold(result.slug)}`);
      console.log(chalk.dim(`  GitHub Pages will remove it when the deployment workflow completes.`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('video')
  .alias('v')
  .description('Generate narrated video from a deck spec')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .option('-o, --output <path>', 'Output video path')
  .option('--no-srt', 'Skip subtitle generation')
  .option('--theme <name>', 'Override theme')
  .action(async (opts) => {
    try {
      const deck = loadDeckFile(opts.file);
      if (opts.theme) deck.theme = opts.theme;
      const html = renderDeck(deck);
      const slug = (deck.meta?.title || 'presentation').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
      const htmlPath = resolve(`./output/${slug}.html`);
      const videoPath = resolve(opts.output || `./output/${slug}.mp4`);
      mkdirSync(dirname(htmlPath), { recursive: true });
      writeFileSync(htmlPath, html, 'utf-8');
      const result = await generateVideoFromDeck(deck, htmlPath, videoPath, { srt: opts.srt !== false });
      console.log('');
      console.log(chalk.green('✓') + ` Video: ${chalk.bold(result.outputPath)}`);
      if (result.srtPath) console.log(chalk.green('✓') + ` Subtitles: ${chalk.bold(result.srtPath)}`);
      console.log(chalk.green('✓') + ` Metadata: ${chalk.bold(result.metaFiles.meta)}`);
      console.log(chalk.dim(`  ${result.slides} slides • ${result.duration.toFixed(0)}s`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('preview')
  .alias('dev')
  .description('Preview a deck with live reload')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .option('-p, --port <port>', 'Port', '3000')
  .option('--host <host>', 'Host', '127.0.0.1')
  .option('--theme <name>', 'Override theme')
  .option('--terminal', 'Enable the localhost shell bridge for the embedded terminal')
  .option('--no-open', 'Do not open the browser')
  .action(async (opts) => {
    try {
      const { previewDeck } = await import('../src/preview.js');
      await previewDeck(opts);
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('serve')
  .alias('s')
  .description('Preview a presentation in browser')
  .option('-f, --file <path>', 'HTML file to serve', './output/presentation.html')
  .option('-p, --port <port>', 'Port', '3000')
  .action(async (opts) => {
    const { servePresentation } = await import('../src/server.js');
    await servePresentation(opts);
  });

program
  .command('export')
  .alias('e')
  .description('Export to PDF')
  .requiredOption('-f, --file <path>', 'Source HTML file')
  .option('-o, --output <path>', 'Output PDF path')
  .option('--theme <name>', 'Presentation theme to export')
  .action(async (opts) => {
    try {
      const { exportPDF } = await import('../src/export/pdf.js');
      const outputPath = await exportPDF(opts);
      console.log(chalk.green('✓') + ` PDF: ${chalk.bold(outputPath)}`);
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('thumbnail')
  .description('Generate a thumbnail image')
  .requiredOption('-f, --file <path>', 'HTML presentation file')
  .option('-s, --slide <n>', 'Slide index (0-based)', '0')
  .option('-t, --text <text>', 'Text overlay')
  .option('-o, --output <path>', 'Output PNG path')
  .action(async (opts) => {
    try {
      const out = opts.output || opts.file.replace(/\.html$/, '_thumb.png');
      await generateThumbnail({ htmlPath: resolve(opts.file), slideIndex: parseInt(opts.slide), textOverlay: opts.text, outputPath: resolve(out) });
      console.log(chalk.green('✓') + ` Thumbnail: ${chalk.bold(out)}`);
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a deck spec')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .action((opts) => {
    try {
      const deck = loadDeckFile(opts.file);
      console.log(chalk.green('✓') + ` Valid deck: ${deck.slides.length} slides, theme: ${deck.theme}`);
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('qa')
  .description('Run visual QA and create slide captures plus a contact sheet')
  .requiredOption('-f, --file <path>', 'Generated HTML presentation')
  .option('-o, --output <dir>', 'QA output directory')
  .option('--width <px>', 'Viewport width', '1280')
  .option('--height <px>', 'Viewport height', '720')
  .option('--dpr <ratio>', 'Device pixel ratio', '1')
  .option('--theme <name>', 'Presentation theme: analyst-proof, cutting-room, or signal-room')
  .option('--live', 'Audit the interactive presentation instead of export mode')
  .action(async opts => {
    try {
      const { runVisualQA } = await import('../src/qa/visual.js');
      const report = await runVisualQA({
        file: opts.file,
        output: opts.output,
        width: Number(opts.width),
        height: Number(opts.height),
        dpr: Number(opts.dpr),
        theme: opts.theme,
        live: Boolean(opts.live),
      });
      console.log(`${report.passed ? chalk.green('✓') : chalk.red('✗')} Visual QA: ${report.slideCount} slides · ${report.blockers.length} blockers · ${report.warnings.length} warnings`);
      console.log(chalk.dim(`  Report: ${report.reportPath}`));
      console.log(chalk.dim(`  Contact sheet: ${report.contactSheet}`));
      if (!report.passed) {
        report.blockers.slice(0, 12).forEach(item => console.log(chalk.red(`  • ${item}`)));
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('themes')
  .description('List available themes')
  .action(() => {
    const themes = listThemes();
    console.log('\n' + chalk.hex('#2563EB').bold('  Available Themes') + '\n');
    for (const t of themes) {
      console.log(`  ${chalk.bold(t.name.padEnd(14))} ${t.description}`);
      console.log(`  ${''.padEnd(14)} ${chalk.dim(`${t.mode} • primary: ${t.primary} • bg: ${t.background}`)}\n`);
    }
  });

program
  .command('voices')
  .description('List available TTS voices')
  .option('-l, --lang <code>', 'Filter by language (en, fr, es...)', 'en')
  .action((opts) => {
    try {
      const language = String(opts.lang).trim();
      if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language)) {
        throw new Error('Language must look like en, fr, or en-US');
      }
      const voices = execFileSync('edge-tts', ['--list-voices'], { encoding: 'utf-8' });
      const matches = voices.split('\n').filter(line => line.includes(`${language}-`) || line.includes(language)).join('\n');
      console.log(matches || chalk.yellow(`No voices found for ${language}`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('publish')
  .alias('p')
  .description('Publish a video to YouTube')
  .requiredOption('-f, --file <path>', 'Video MP4 file')
  .option('--html <path>', 'HTML file (for thumbnail generation)')
  .option('--privacy <level>', 'Privacy: public, unlisted, private', 'unlisted')
  .option('--publish-at <iso>', 'Schedule publication (ISO 8601; video is uploaded private)')
  .option('--playlist-id <id>', 'Add the video to an existing playlist ID')
  .option('--thumb-slide <n>', 'Slide index for thumbnail', '0')
  .option('--thumb-text <text>', 'Text overlay on thumbnail')
  .action(async (opts) => {
    try {
      const { publishToYouTube } = await import('../src/youtube/publish.js');
      const result = await publishToYouTube({
        videoPath: opts.file,
        htmlPath: opts.html,
        privacy: opts.privacy,
        publishAt: opts.publishAt,
        playlistId: opts.playlistId,
        thumbnailSlide: parseInt(opts.thumbSlide),
        thumbnailText: opts.thumbText,
      });
      console.log('');
      console.log(chalk.green('✓') + ` Published: ${chalk.bold.cyan(result.videoUrl)}`);
      console.log(chalk.dim(`  Video ID: ${result.videoId} • Privacy: ${opts.privacy}`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('youtube')
  .alias('yt')
  .description('Create a narrated video and publish it through YouTube Publisher')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .option('--theme <name>', 'Override theme')
  .option('--keep-video', 'Keep a local MP4 after upload')
  .option('-o, --output <path>', 'Local MP4 path when --keep-video is enabled')
  .action(async (opts) => {
    try {
      const { createAndPublishDeck } = await import('../src/youtube/pipeline.js');
      const result = await createAndPublishDeck({
        deckPath: opts.file,
        theme: opts.theme,
        keepVideo: opts.keepVideo,
        output: opts.output,
      });
      console.log('');
      console.log(chalk.green('✓') + ` YouTube: ${chalk.bold.cyan(result.videoUrl)}`);
      if (result.publishAt) console.log(chalk.dim(`  Scheduled: ${result.publishAt}`));
      console.log(chalk.dim(`  ${result.slides} slides • ${result.duration.toFixed(0)}s • temporary files released`));
      if (result.localVideoPath) console.log(chalk.green('✓') + ` Local master: ${chalk.bold(result.localVideoPath)}`);
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('youtube-auth')
  .description('Authenticate with YouTube (one-time setup)')
  .action(async (opts) => {
    try {
      const { getAuthenticatedClient, getCredentialsPath, getConfigDir } = await import('../src/youtube/auth.js');
      console.log('');
      console.log(chalk.hex('#2563EB').bold('  YouTube Authentication'));
      console.log(chalk.dim(`  Credentials: ${getCredentialsPath()}`));
      console.log('');
      const client = await getAuthenticatedClient();
      console.log(chalk.green('✓') + ' YouTube authenticated and token saved.');
      console.log(chalk.dim(`  Token: ${getConfigDir()}/youtube-token.json`));
    } catch (err) {
      console.error(chalk.red('✗') + ` ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('mcp')
  .description('Start MCP server (for LLM integration)')
  .action(async () => {
    await import('../src/mcp/server.js');
  });

program.parse();
