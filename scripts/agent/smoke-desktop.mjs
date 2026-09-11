#!/usr/bin/env bun
import { spawn } from 'child_process';
import { access, mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { basename, dirname, join, resolve } from 'path';
import puppeteer from 'puppeteer-core';

const requestedApp = process.env.GAMMA_DESKTOP_APP || process.argv[2];
if (!requestedApp) throw new Error('Set GAMMA_DESKTOP_APP to a packaged Gamma Presenter.app (or pass it as the first argument).');
const appBundle = resolve(requestedApp);
const appArgument = process.env.GAMMA_DESKTOP_APP_ARGUMENT ? resolve(process.env.GAMMA_DESKTOP_APP_ARGUMENT) : null;
const screenshotPath = process.env.GAMMA_DESKTOP_SCREENSHOT ? resolve(process.env.GAMMA_DESKTOP_SCREENSHOT) : null;
const templateScreenshotPath = process.env.GAMMA_DESKTOP_TEMPLATE_SCREENSHOT ? resolve(process.env.GAMMA_DESKTOP_TEMPLATE_SCREENSHOT) : null;
const themeScreenshotDirectory = process.env.GAMMA_DESKTOP_THEME_SCREENSHOT_DIR ? resolve(process.env.GAMMA_DESKTOP_THEME_SCREENSHOT_DIR) : null;
const themeReportPath = process.env.GAMMA_DESKTOP_THEME_REPORT ? resolve(process.env.GAMMA_DESKTOP_THEME_REPORT) : null;
const executable = appBundle.endsWith('.app') ? join(appBundle, 'Contents', 'MacOS', 'Gamma Presenter') : appBundle;
await access(executable);

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
async function mcpRequest(endpoint, token, body, sessionId) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${token}`, ...(sessionId ? { 'mcp-session-id': sessionId } : {}) },
    body: JSON.stringify(body),
  });
}
async function eventually(label, attempt, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { const result = await attempt(); if (result) return result; } catch (error) { lastError = error; }
    await delay(150);
  }
  throw new Error(`${label} did not become ready.${lastError ? ` ${lastError.message}` : ''}`);
}

const profile = await mkdtemp(join(tmpdir(), 'gamma-presenter-desktop-smoke-'));
const port = await freePort();
const processLog = [];
const child = spawn(executable, [...(appArgument ? [appArgument] : []), `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--enable-logging=stderr'], { stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.on('data', chunk => processLog.push(chunk.toString()));
child.stderr.on('data', chunk => processLog.push(chunk.toString()));
let browser;
let lastAuthorState;
const pageErrors = [];
const consoleMessages = [];
try {
  const endpoint = `http://127.0.0.1:${port}`;
  await eventually('Electron DevTools endpoint', async () => (await fetch(`${endpoint}/json/version`)).ok, 20_000);
  browser = await puppeteer.connect({ browserURL: endpoint });
  const author = await eventually('Author window', async () => (await browser.pages()).find(page => page.url().endsWith('/author.html')));
  author.on('pageerror', error => pageErrors.push(error.message));
  author.on('console', message => consoleMessages.push(`${message.type()}: ${message.text()}`));
  await author.waitForSelector('#source');
  if (themeScreenshotDirectory) {
    await mkdir(themeScreenshotDirectory, { recursive: true });
    await author.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  }
  const authorRealm = author.mainFrame().mainRealm();
  let initial;
  try {
    initial = await eventually('Author document state', async () => {
      const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
      lastAuthorState = snapshot;
      return snapshot?.slideCount && snapshot.renderState === 'ready' ? snapshot : null;
    });
  } catch (error) { const session = await author.createCDPSession(); const realm = await session.send('Runtime.evaluate', { expression: '({ bridge: typeof window.gammaDesktop, keys: Object.keys(window).filter(key => /gamma/i.test(key)) })', returnByValue: true }).catch(() => ({})); await session.detach().catch(() => {}); throw new Error(`${error.message} Last author snapshot: ${JSON.stringify(lastAuthorState)} Main realm: ${JSON.stringify(realm.result?.value)} Renderer errors: ${pageErrors.join(' | ')} Console: ${consoleMessages.join(' | ')}`); }
  if (!initial?.slideCount || initial.stageVisible) throw new Error('Author did not start as the sole working window.');
  if (!initial.mcp?.endpoint || !initial.mcp?.token) throw new Error('Desktop MCP endpoint was not exposed to the Author control room.');
  if (!initial.copilot?.available?.codex || !initial.copilot?.available?.claude) throw new Error('The installed Codex and Claude CLIs were not detected by the Author control room.');
  if (!Array.isArray(initial.templates) || initial.templates.length < 5) throw new Error('Author did not expose the complete built-in template gallery.');
  await author.click('#open-templates');
  await author.waitForSelector('#template-dialog[open]');
  if (await author.$$('[data-template-id]').then(items => items.length) !== initial.templates.length) throw new Error('Template gallery contents do not match the packaged template catalog.');
  if (templateScreenshotPath) { await author.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 }); await author.screenshot({ path: templateScreenshotPath }); }
  await author.click('[data-template-id="architecture"]');
  const templated = await eventually('runnable architecture template', async () => {
    const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
    return snapshot?.sourceKind === 'yaml' && snapshot?.slideCount >= 3 && snapshot?.title === 'Architecture review · live model' && snapshot.renderState === 'ready' ? snapshot : null;
  });
  const templateFrame = await eventually('architecture template renderer', async () => {
    const candidate = author.frames().find(item => item.url().startsWith('gamma://deck/'));
    return candidate && await candidate.mainRealm().evaluate(() => Boolean(window.__GAMMA_PRESENTER_READY__) && document.body.dataset.presentationTheme === 'signal-room') ? candidate : null;
  });
  const templateDiagram = await templateFrame.mainRealm().evaluate(() => Boolean(document.querySelector('[data-gamma-runtime*="archify"], .archify-diagram, .diagram-container')));
  if (!templateDiagram) throw new Error('The packaged architecture template did not render its live diagram.');
  lastAuthorState = templated;
  const themeProof = [];
  for (const theme of ['analyst-proof', 'cutting-room', 'signal-room']) {
    const beforeRevision = lastAuthorState?.rendererRevision || 0;
    await authorRealm.evaluate(nextTheme => window.gammaDesktop.setTheme(nextTheme), theme);
    const themed = await eventually(`${theme} desktop theme`, async () => {
      const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
      lastAuthorState = snapshot;
      return snapshot?.theme === theme && snapshot.rendererRevision > beforeRevision && snapshot.renderState === 'ready' ? snapshot : null;
    });
    const frame = await eventually(`${theme} preview frame`, async () => {
      const candidate = author.frames().find(item => item.url().startsWith('gamma://deck/'));
      return candidate && await candidate.mainRealm().evaluate(() => Boolean(window.__GAMMA_PRESENTER_READY__)) ? candidate : null;
    });
    // Theme editions intentionally animate their first composition; capture only after that authored entrance settles.
    await delay(900);
    const visual = await frame.mainRealm().evaluate(() => {
      const title = document.querySelector('.reveal .slides section.present h1, .reveal .slides section.present h2');
      const rectangle = element => element ? Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Math.round(element.getBoundingClientRect()[key])])) : null;
      return {
        theme: document.body.dataset.presentationTheme,
        background: getComputedStyle(document.body).backgroundColor,
        headingFont: title ? getComputedStyle(title).fontFamily : '',
        titleTransform: title ? getComputedStyle(title).textTransform : '',
        titleColor: title ? getComputedStyle(title).color : '',
        titleOpacity: title ? getComputedStyle(title).opacity : '',
        titleVisibility: title ? getComputedStyle(title).visibility : '',
        titleText: title?.textContent || '',
        viewport: { width: innerWidth, height: innerHeight },
        reveal: rectangle(document.querySelector('.reveal')),
        slide: rectangle(document.querySelector('.reveal .slides section.present')),
        cover: rectangle(document.querySelector('.cover-content')),
        title: rectangle(title),
      };
    });
    if (visual.theme !== theme || !visual.background || !visual.headingFont) throw new Error(`Desktop theme ${theme} did not reach the embedded Gamma renderer.`);
    themeProof.push(visual);
    if (themeScreenshotDirectory) await (await author.$('#renderer-preview')).screenshot({ path: join(themeScreenshotDirectory, `${theme}.png`) });
    lastAuthorState = themed;
  }
  if (new Set(themeProof.map(proof => proof.background)).size !== 3 || new Set(themeProof.map(proof => proof.headingFont)).size !== 3) {
    throw new Error(`Desktop themes collapsed to visual variants: ${JSON.stringify(themeProof)}`);
  }
  if (themeReportPath) await writeFile(themeReportPath, `${JSON.stringify(themeProof, null, 2)}\n`, 'utf8');
  const initializedMcp = await mcpRequest(initial.mcp.endpoint, initial.mcp.token, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'desktop-smoke', version: '1.0.0' } } });
  const sessionId = initializedMcp.headers.get('mcp-session-id');
  if (!initializedMcp.ok || !sessionId) throw new Error(`Desktop MCP initialization failed (${initializedMcp.status}).`);
  const listedTools = await mcpRequest(initial.mcp.endpoint, initial.mcp.token, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, sessionId);
  const listedToolText = await listedTools.text();
  if (!listedTools.ok || !listedToolText.includes('presenter_cue') || !listedToolText.includes('presenter_request_operator_action')) throw new Error('Desktop MCP did not expose the complete presentation co-pilot tools.');
  const requestedAction = await mcpRequest(initial.mcp.endpoint, initial.mcp.token, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'presenter_request_operator_action', arguments: { action: 'open-studio', note: 'Prepare the recording controls.' } } }, sessionId);
  if (!requestedAction.ok) throw new Error(`Desktop MCP live-action request failed (${requestedAction.status}).`);
  const requestedSnapshot = await eventually('pending live action', async () => {
    const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
    return snapshot?.operatorRequests?.find(request => request.status === 'pending') ? snapshot : null;
  });
  const pendingRequest = requestedSnapshot.operatorRequests.find(request => request.status === 'pending');
  if (screenshotPath) { await author.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 }); await author.mainFrame().mainRealm().evaluate(() => document.querySelector('.approvals-section')?.scrollIntoView({ block: 'center' })); await delay(100); await author.screenshot({ path: screenshotPath, fullPage: true }); }
  await authorRealm.evaluate(id => window.gammaDesktop.resolveOperatorAction(id, true), pendingRequest.id);
  const approvedSnapshot = await eventually('approved live action', async () => {
    const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
    return snapshot?.operatorRequests?.find(request => request.id === pendingRequest.id && request.status === 'completed') ? snapshot : null;
  });
  if (approvedSnapshot.operatorRequests.find(request => request.id === pendingRequest.id)?.result !== 'Presenter Studio opened.') throw new Error('Author approval did not execute the bounded Stage action.');
  await author.click('#add-slide');
  await author.waitForFunction(() => document.querySelector('#document-meta')?.textContent?.includes('3 slides'));
  await author.click('#present');
  const stage = await eventually('Stage window', async () => (await browser.pages()).find(page => page.url().startsWith('gamma://deck/')));
  const stageErrors = [];
  const stageConsole = [];
  stage.on('pageerror', error => stageErrors.push(error.message));
  stage.on('console', message => stageConsole.push(`${message.type()}: ${message.text()}`));
  try { await eventually('Stage renderer', () => stage.mainFrame().mainRealm().evaluate(() => Boolean(window.__GAMMA_PRESENTER_READY__)), 25_000); }
  catch (error) { const session = await stage.createCDPSession(); const realm = await session.send('Runtime.evaluate', { expression: '({ url: location.href, ready: window.__GAMMA_PRESENTER_READY__, reveal: typeof window.Reveal, body: document.body?.textContent?.slice(0,300) })', returnByValue: true }).catch(() => ({})); await session.detach().catch(() => {}); throw new Error(`${error.message} Stage realm: ${JSON.stringify(realm.result?.value)} Renderer errors: ${stageErrors.join(' | ')} Console: ${stageConsole.join(' | ')}`); }
  const state = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
  if (state.slideCount !== 3 || !state.stageVisible) throw new Error('Author-to-Stage transition did not preserve the expected desktop state.');
  console.log(JSON.stringify({ app: basename(appBundle), author: true, mcp: true, stage: true, slides: state.slideCount, rendererReady: true, themes: themeProof }));
} finally {
  await browser?.disconnect().catch(() => {});
  if (!child.killed) child.kill('SIGTERM');
  await Promise.race([new Promise(resolveExit => child.once('exit', resolveExit)), delay(5_000)]);
  await rm(profile, { recursive: true, force: true });
  if (child.exitCode && child.exitCode !== 0) throw new Error(`Gamma Presenter smoke process exited with ${child.exitCode}: ${processLog.join('').trim()}`);
}
