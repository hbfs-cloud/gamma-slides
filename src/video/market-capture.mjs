#!/usr/bin/env node
/** Capture every reviewed Gamma market-video scene to a timing.json plan. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from '../browser.js';

const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
const FRAME_CSS = `
html, body { margin: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; background: #080c13 !important; }
.experience-masthead, .experience-nav, .experience-more, .gamma-orbit, .gamma-studio-toolbar,
.footer-bar, .watermark, .explainer-actions, .controls, .progress, .slide-number { display: none !important; }
body.gamma-experience .reveal, .reveal { position: absolute !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; }
.reveal .slides { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; transform: none !important; zoom: 1 !important; }
.reveal .slides > section { box-sizing: border-box !important; position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; transform: none !important; }
.reveal .slides > section:has(> .gamma-sandboxed-html) { padding: 0 !important; }
.gamma-sandboxed-html { display: block !important; width: 100% !important; height: 100% !important; }
`;

export function isFullFrame(rect, width = 1920, height = 1080, tolerance = 1) {
  return Math.abs(rect.x) <= tolerance && Math.abs(rect.y) <= tolerance
    && Math.abs(rect.width - width) <= tolerance && Math.abs(rect.height - height) <= tolerance;
}

export function options(argv) {
  const value = key => {
    const index = argv.indexOf(key);
    if (index < 0 || !argv[index + 1]) return undefined;
    return argv[index + 1];
  };
  return {
    html: value('--html'), deck: value('--deck'), timing: value('--timing'), output: value('--output'),
    browser: value('--browser'), start: Number(value('--start') || 0), end: value('--end'),
    ffmpeg: value('--ffmpeg-capture') || 'ffmpeg',
  };
}

export function checkedPlan(deck, timing) {
  if (!Array.isArray(deck?.slides) || !Array.isArray(timing?.scenes) || !timing.scenes.length) {
    throw Error('Deck slides and non-empty timing scenes are required');
  }
  if (deck.slides.length !== timing.scenes.length || timing.fps !== 30 || timing.tempo_modified !== false) {
    throw Error('Deck and timing must have matching scenes at 30fps with unchanged narration tempo');
  }
  for (const [index, scene] of timing.scenes.entries()) {
    if (scene.index !== index || !Number.isInteger(scene.frames) || scene.frames <= 0 || scene.duration <= 0) {
      throw Error(`Invalid timing scene ${index}`);
    }
  }
  return timing.scenes;
}

async function main() {
  const args = options(process.argv.slice(2));
  if (!args.html || !args.deck || !args.timing || !args.output) {
    throw Error('Usage: node src/video/market-capture.mjs --html deck.html --deck deck.json --timing timing.json --output clips [--browser chromium] [--start N --end N]');
  }
  const [deck, timing] = await Promise.all([
    readFile(resolve(args.deck), 'utf8').then(JSON.parse), readFile(resolve(args.timing), 'utf8').then(JSON.parse),
  ]);
  const scenes = checkedPlan(deck, timing);
  const start = args.start;
  const end = args.end === undefined ? scenes.length : Number(args.end);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > scenes.length || start >= end) {
    throw Error('start/end must select one or more timing scenes');
  }
  const output = resolve(args.output);
  await mkdir(output, { recursive: true });
  const browser = await launchBrowser({ headless: true, executablePath: args.browser, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${pathToFileURL(resolve(args.html)).href}?gamma-preview=1&gamma-clean=gallery&theme=signal-room`, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.waitForFunction(() => window.__GAMMA_READY__ === true, { timeout: 30_000 });
    await page.addStyleTag({ content: FRAME_CSS });
    await page.evaluate(() => Reveal.configure({
      width: 1920, height: 1080, margin: 0, center: false, controls: false,
      progress: false, slideNumber: false, transition: 'fade', transitionSpeed: 'slow',
    }));
    await page.evaluate(() => new Promise(frame => requestAnimationFrame(() => requestAnimationFrame(frame))));
    for (let index = start; index < end; index++) {
      const scene = scenes[index];
      const base = resolve(output, `scene-${String(index).padStart(2, '0')}`);
      await page.evaluate(async sceneIndex => {
        Reveal.slide(sceneIndex);
        const current = Reveal.getCurrentSlide();
        for (const animation of current.getAnimations({ subtree: true })) { animation.cancel(); animation.play(); }
        await document.fonts.ready;
        await new Promise(frame => requestAnimationFrame(() => requestAnimationFrame(frame)));
      }, index);
      await page.waitForFunction(sceneIndex => Reveal.getIndices().h === sceneIndex, { timeout: 5_000 }, index);
      const rect = await page.evaluate(() => Reveal.getCurrentSlide().getBoundingClientRect().toJSON());
      if (!isFullFrame(rect)) {
        throw Error(`Scene ${index} is not full-frame 1920x1080: ${JSON.stringify(rect)}`);
      }
      const recorder = await page.screencast({ path: `${base}.mkv`, format: 'webm', fps: 30, quality: 18, ffmpegPath: args.ffmpeg });
      await delay(scene.duration * 1000);
      await recorder.stop();
      await page.screenshot({ path: `${base}.png` });
      const proof = { ...(await page.evaluate(() => ({
        slide: Reveal.getIndices().h,
        charts: document.querySelectorAll('div[_echarts_instance_]').length,
      }))), rect };
      if (errors.length) throw Error(`Runtime errors: ${errors.join('; ')}`);
      await writeFile(`${base}.json`, JSON.stringify({ complete: true, scene: index, duration: scene.duration,
        videoPath: `${base}.mkv`, frames: scene.frames, proof, pageErrors: errors }, null, 2));
      console.log(JSON.stringify({ complete: index, duration: scene.duration, frames: scene.frames }));
    }
    await page.close();
  } finally { await browser.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
