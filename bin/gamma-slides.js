#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';
import { generateVideoFromDeck } from '../src/video/generate-v2.js';
import { generateThumbnail } from '../src/video/thumbnail.js';
import { listThemes } from '../src/themes/index.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';

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
      const deck = loadDeck(opts.file);
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
  .command('video')
  .alias('v')
  .description('Generate narrated video from a deck spec')
  .requiredOption('-f, --file <path>', 'Deck YAML/JSON file')
  .option('-o, --output <path>', 'Output video path')
  .option('--no-srt', 'Skip subtitle generation')
  .option('--theme <name>', 'Override theme')
  .action(async (opts) => {
    try {
      const deck = loadDeck(opts.file);
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
  .option('-f, --file <path>', 'Source HTML file')
  .option('-o, --output <path>', 'Output PDF path')
  .action(async (opts) => {
    try {
      const { exportPDF } = await import('../src/export/pdf.js');
      await exportPDF(opts);
      console.log(chalk.green('✓') + ` PDF: ${chalk.bold(opts.output)}`);
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
      const deck = loadDeck(opts.file);
      console.log(chalk.green('✓') + ` Valid deck: ${deck.slides.length} slides, theme: ${deck.theme}`);
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
    const voices = execSync(`edge-tts --list-voices 2>/dev/null | grep "${opts.lang}-"`, { encoding: 'utf-8' });
    console.log(voices);
  });

program
  .command('publish')
  .alias('p')
  .description('Publish a video to YouTube')
  .requiredOption('-f, --file <path>', 'Video MP4 file')
  .option('--html <path>', 'HTML file (for thumbnail generation)')
  .option('--privacy <level>', 'Privacy: public, unlisted, private', 'unlisted')
  .option('--thumb-slide <n>', 'Slide index for thumbnail', '0')
  .option('--thumb-text <text>', 'Text overlay on thumbnail')
  .action(async (opts) => {
    try {
      const { publishToYouTube } = await import('../src/youtube/publish.js');
      const result = await publishToYouTube({
        videoPath: opts.file,
        htmlPath: opts.html,
        privacy: opts.privacy,
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
