import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import puppeteer from 'puppeteer-core';

const execFile = promisify(execFileCallback);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = resolve(process.env.GAMMA_RUNTIME_GIF_EVIDENCE || join(root, 'output/runtime-gif-refresh'));
const executablePath = process.env.GAMMA_BROWSER_EXECUTABLE || process.env.PUPPETEER_EXECUTABLE_PATH;
const maxBytes = 3 * 1024 * 1024;
const frameRate = 10;
const frameCount = 36;
const captureOnly = process.argv.includes('--capture-only');
const encodeOnly = process.argv.includes('--encode-only');

if (!encodeOnly && !executablePath) throw new Error('Set GAMMA_BROWSER_EXECUTABLE to the dedicated Chromium executable before recording runtime GIFs.');
if (captureOnly && encodeOnly) throw new Error('Use either --capture-only or --encode-only, not both.');

const routes = [
  {
    name: 'immersive',
    input: join(root, '_site/immersive-data/index.html'),
    output: join(root, 'docs/images/gamma-presenter-immersive-runtime.gif'),
    viewport: { width: 960, height: 600 },
    slide: 0,
    ready: () => {
      const stage = document.querySelector('section.present .immersive-chart');
      return Boolean(stage?.querySelector('.spatial-viewport canvas') && stage.dataset.immersiveView === 'spatial' && Number(stage.dataset.spatialFrames) > 2);
    },
    frameCounter: () => Number(document.querySelector('section.present .immersive-chart')?.dataset.spatialFrames || 0),
    act: async (page, frame) => {
      if (frame === 6) await activate(page, 'section.present [data-spatial-action="profile"]');
      if (frame === 21) await activate(page, 'section.present [data-spatial-action="reset"]');
      if (frame === 28) await activate(page, 'section.present [data-spatial-action="right"]');
    },
  },
  {
    name: 'cinematic',
    input: join(root, '_site/cinematic-revenue/index.html'),
    output: join(root, 'docs/images/gamma-presenter-cinematic-runtime.gif'),
    viewport: { width: 960, height: 540 },
    slide: 1,
    ready: () => {
      const stage = document.querySelector('section.present .cinema-stage');
      return Boolean(stage?.querySelector('.cinema-canvas canvas') && stage.dataset.cinemaRenderer === 'webgl' && Number(stage.dataset.cinemaFrames) >= 1);
    },
    frameCounter: () => Number(document.querySelector('section.present .cinema-stage')?.dataset.cinemaFrames || 0),
    act: async (page, frame) => {
      const stage = await page.$('section.present .cinema-stage');
      const box = await stage.boundingBox();
      await page.mouse.move(box.x + box.width * (.36 + frame / frameCount * .28), box.y + box.height * (.52 - frame / frameCount * .12));
      if (frame === 7 || frame === 24) await activate(page, 'section.present [data-cinema-action="split"]');
    },
  },
];

const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
async function activate(page, selector) {
  await page.evaluate(query => {
    const control = document.querySelector(query);
    if (!(control instanceof HTMLButtonElement) || control.disabled) throw new Error(`Runtime control is unavailable: ${query}`);
    control.click();
  }, selector);
}

async function assertLiveRuntime(page, route) {
  try {
    await page.waitForFunction(route.ready, { timeout: 15_000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      ready: window.__GAMMA_READY__ === true,
      slide: document.querySelector('section.present')?.dataset.slideNumber || null,
      cinematic: [...document.querySelectorAll('.cinema-stage')].map(stage => ({
        renderer: stage.dataset.cinemaRenderer || null,
        frames: stage.dataset.cinemaFrames || null,
        canvas: Boolean(stage.querySelector('.cinema-canvas canvas')),
      })),
      immersive: [...document.querySelectorAll('.immersive-chart')].map(stage => ({
        view: stage.dataset.immersiveView || null,
        frames: stage.dataset.spatialFrames || null,
        canvas: Boolean(stage.querySelector('.spatial-viewport canvas')),
      })),
    }));
    throw new Error(`${route.name}: live scene readiness failed: ${JSON.stringify(diagnostic)}`, { cause: error });
  }
  const state = await page.evaluate(() => {
    const isVisible = element => {
      if (!element || element.hidden) return false;
      const style = getComputedStyle(element), rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    return {
      ready: window.__GAMMA_READY__ === true,
      language: document.documentElement.lang,
      chooserVisible: isVisible(document.querySelector('#gamma-theme-chooser')) || isVisible(document.querySelector('.gamma-studio-overlay.is-visible')),
      chooserCopyVisible: [...document.querySelectorAll('h1,h2')].some(node => node.textContent?.trim() === 'Choose your theme' && isVisible(node)),
    };
  });
  assert.equal(state.ready, true, `${route.name}: runtime did not signal ready`);
  assert.equal(state.language, 'en', `${route.name}: runtime is not English`);
  assert.equal(state.chooserVisible, false, `${route.name}: theme chooser is visible`);
  assert.equal(state.chooserCopyVisible, false, `${route.name}: theme chooser copy is visible`);
  return state;
}

async function hideCaptureChrome(page) {
  const chrome = await page.evaluate(() => {
    const orbit = document.querySelector('.gamma-orbit');
    if (!orbit) return { clean: document.documentElement.classList.contains('gamma-clean-stage'), visible: false };
    const style = getComputedStyle(orbit), rect = orbit.getBoundingClientRect();
    return { clean: document.documentElement.classList.contains('gamma-clean-stage'), visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 };
  });
  assert.equal(chrome.clean, true, 'gamma-clean capture mode is not active');
  assert.equal(chrome.visible, false, 'capture chrome is visible');
}

async function encodeGif(frameDirectory, output) {
  const palette = join(frameDirectory, 'palette.png');
  const temporary = output + '.new.gif';
  const frames = join(frameDirectory, 'frame-%03d.png');
  let bytes = Infinity;
  for (const colors of [96, 72, 56, 40]) {
    await execFile('ffmpeg', ['-v', 'error', '-y', '-framerate', String(frameRate), '-i', frames, '-vf', `palettegen=max_colors=${colors}:stats_mode=diff`, palette]);
    await execFile('ffmpeg', ['-v', 'error', '-y', '-framerate', String(frameRate), '-i', frames, '-i', palette, '-lavfi', 'paletteuse=dither=bayer:bayer_scale=3', '-loop', '0', '-an', temporary]);
    bytes = (await stat(temporary)).size;
    if (bytes < maxBytes) break;
  }
  assert.ok(bytes < maxBytes, `${output} is ${bytes} bytes; expected under ${maxBytes}`);
  await rename(temporary, output);
  return bytes;
}

async function capture(browser, route) {
  assert.ok(await stat(route.input), `Missing generated route: ${route.input}`);
  const routeEvidence = join(evidence, route.name);
  const frameDirectory = join(routeEvidence, 'frames');
  const page = await browser.newPage();
  try {
    await page.setViewport({ ...route.viewport, deviceScaleFactor: 1 });
    const url = pathToFileURL(route.input).href + '?gamma-preview=1&gamma-clean=gallery&theme=signal-room';
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__GAMMA_READY__ === true, { timeout: 15_000 });
    await page.evaluate(slide => Reveal.slide(slide), route.slide);
    await page.waitForFunction(() => document.querySelector('section.present'), { timeout: 15_000 });
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations()
        .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map(animation => animation.finished.catch(() => {})));
    });
    const state = await assertLiveRuntime(page, route);
    await hideCaptureChrome(page);
    const framesBefore = await page.evaluate(route.frameCounter);
    await mkdir(routeEvidence, { recursive: true });
    await rm(frameDirectory, { recursive: true, force: true });
    await mkdir(frameDirectory, { recursive: true });
    for (let frame = 0; frame < frameCount; frame++) {
      await route.act(page, frame);
      const path = join(frameDirectory, `frame-${String(frame).padStart(3, '0')}.png`);
      await page.screenshot({ path });
      if (frame === 0 || frame === Math.floor(frameCount / 2) || frame === frameCount - 1) {
        await copyFile(path, join(routeEvidence, `${frame === 0 ? 'first' : frame === frameCount - 1 ? 'last' : 'middle'}.png`));
      }
      await delay(1000 / frameRate);
    }
    const framesAfter = await page.evaluate(route.frameCounter);
    assert.ok(framesAfter > framesBefore, `${route.name}: live runtime did not advance during recording`);
    const captureInfo = { name: route.name, route: url + '#/' + route.slide, viewport: route.viewport, frames: frameCount, frameRate, durationSeconds: frameCount / frameRate, noChooserReady: state, frameChanges: { before: framesBefore, after: framesAfter }, output: route.output, evidence: routeEvidence, frameDirectory };
    await writeFile(join(routeEvidence, 'capture.json'), JSON.stringify(captureInfo, null, 2));
    return captureInfo;
  } finally {
    await page.close().catch(() => {});
  }
}

async function encode(captureInfo) {
  await mkdir(dirname(captureInfo.output), { recursive: true });
  const bytes = await encodeGif(captureInfo.frameDirectory, captureInfo.output);
  const proof = { ...captureInfo, bytes, audio: false };
  delete proof.frameDirectory;
  await writeFile(join(captureInfo.evidence, 'proof.json'), JSON.stringify(proof, null, 2));
  await rm(captureInfo.frameDirectory, { recursive: true, force: true });
  return { name: captureInfo.name, bytes, evidence: captureInfo.evidence };
}

await mkdir(evidence, { recursive: true });
let captures;
if (encodeOnly) {
  captures = await Promise.all(routes.map(async route => JSON.parse(await readFile(join(evidence, route.name, 'capture.json'), 'utf8'))));
} else {
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  try {
    captures = [];
    for (const route of routes) captures.push(await capture(browser, route));
  } finally {
    await browser.close();
  }
  process.stdout.write(JSON.stringify({ browserCaptureComplete: captures.map(({ name, evidence: routeEvidence }) => ({ name, evidence: routeEvidence })) }) + '\n');
}
if (!captureOnly) process.stdout.write(JSON.stringify({ results: await Promise.all(captures.map(encode)) }, null, 2) + '\n');
