import { spawn } from 'child_process';
import { mkdir, readFile } from 'fs/promises';
import { createServer } from 'net';
import { dirname, join, resolve } from 'path';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const valueFor = name => args[args.indexOf(name) + 1];
const appBundle = valueFor('--app');
const input = valueFor('--input');
const output = valueFor('--output');
const width = Number(valueFor('--width') || 1440);
const height = Number(valueFor('--height') || 1000);

if (!appBundle || !input || !output || !Number.isFinite(width) || !Number.isFinite(height)) {
  throw new Error('Usage: bun scripts/agent/capture-page.mjs --app <Gamma Presenter.app> --input <HTML> --output <PNG> [--width 1440 --height 1000]');
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(error => error ? reject(error) : resolvePort(address.port));
    });
  });
}

const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
async function eventually(label, attempt, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { const result = await attempt(); if (result) return result; } catch (error) { lastError = error; }
    await delay(150);
  }
  throw new Error(`${label} did not become ready.${lastError ? ` ${lastError.message}` : ''}`);
}

const executable = join(resolve(appBundle), 'Contents', 'MacOS', 'Gamma Presenter');
const port = await freePort();
const child = spawn(executable, [`--remote-debugging-port=${port}`, '--enable-logging=stderr'], { stdio: 'ignore' });
let browser;
try {
  const endpoint = `http://127.0.0.1:${port}`;
  await eventually('Electron DevTools endpoint', async () => (await fetch(`${endpoint}/json/version`)).ok);
  browser = await puppeteer.connect({ browserURL: endpoint });
  const page = await eventually('Gamma Presenter Author window', async () => (await browser.pages()).find(candidate => candidate.url().endsWith('/author.html')));
  await page.setBypassCSP(true);
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const session = await page.createCDPSession();
  await session.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const html = await readFile(resolve(input), 'utf8');
  const base = `file://${dirname(resolve(input))}/`;
  await page.setContent(html.replace('<head>', `<head><base href="${base}">`), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts?.ready);
  await mkdir(dirname(resolve(output)), { recursive: true });
  await page.screenshot({ path: resolve(output), fullPage: true });
  await session.detach();
} finally {
  await browser?.disconnect().catch(() => {});
  if (!child.killed) child.kill('SIGTERM');
}
