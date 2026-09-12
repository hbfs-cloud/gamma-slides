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
const writerScreenshotPath = process.env.GAMMA_DESKTOP_WRITER_SCREENSHOT ? resolve(process.env.GAMMA_DESKTOP_WRITER_SCREENSHOT) : null;
const richScreenshotPath = process.env.GAMMA_DESKTOP_RICH_SCREENSHOT ? resolve(process.env.GAMMA_DESKTOP_RICH_SCREENSHOT) : null;
const templateScreenshotPath = process.env.GAMMA_DESKTOP_TEMPLATE_SCREENSHOT ? resolve(process.env.GAMMA_DESKTOP_TEMPLATE_SCREENSHOT) : null;
const connectionsScreenshotPath = process.env.GAMMA_DESKTOP_CONNECTIONS_SCREENSHOT ? resolve(process.env.GAMMA_DESKTOP_CONNECTIONS_SCREENSHOT) : null;
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
    signal: AbortSignal.timeout(15_000),
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
  browser = await puppeteer.connect({ browserURL: endpoint, defaultViewport: null, protocolTimeout: 45_000 });
  const author = await eventually('Author window', async () => (await browser.pages()).find(page => page.url().endsWith('/author.html')));
  author.on('pageerror', error => pageErrors.push(error.message));
  author.on('console', message => consoleMessages.push(`${message.type()}: ${message.text()}`));
  await author.waitForSelector('#source');
  if (themeScreenshotDirectory) {
    await mkdir(themeScreenshotDirectory, { recursive: true });

  }
  const authorRealm = author.mainFrame().mainRealm();
  let initial;
  try {
    initial = await eventually('Author document state', async () => {
      const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
      lastAuthorState = snapshot;
      return snapshot?.slideCount && snapshot.renderState === 'ready' ? snapshot : null;
    });
  } catch (error) { const session = await author.createCDPSession(); const realm = await session.send('Runtime.evaluate', { expression: '({ bridge: typeof window.gammaDesktop, keys: Object.keys(window).filter(key => /gamma/i.test(key)) })', returnByValue: true }).catch(() => ({})); await session.detach().catch(() => {}); throw new Error(`${error.message} Last author snapshot: ${JSON.stringify(lastAuthorState && { title: lastAuthorState.title, sourceKind: lastAuthorState.sourceKind, slideCount: lastAuthorState.slideCount, renderState: lastAuthorState.renderState, error: lastAuthorState.error })} Main realm: ${JSON.stringify(realm.result?.value)} Renderer errors: ${pageErrors.join(' | ')} Console: ${consoleMessages.join(' | ')}`); }
  if (!initial?.slideCount || initial.stageVisible) throw new Error('Author did not start as the sole working window.');
  if (!initial.mcp?.endpoint || !initial.mcp?.token) throw new Error('Desktop MCP endpoint was not exposed to the Author control room.');
  if (typeof initial.copilot?.available?.codex !== 'boolean' || typeof initial.copilot?.available?.claude !== 'boolean') throw new Error('The Author control room did not report local CLI availability.');
  if (!Array.isArray(initial.templates) || initial.templates.length < 5) throw new Error('Author did not expose the complete built-in template gallery.');
  const writerSurface = await authorRealm.evaluate(() => ({
    label: document.querySelector('#source-language')?.textContent,
    headline: Boolean(document.querySelector('#writer-highlights .writer-headline')),
    momentControl: Boolean(document.querySelector('[data-writer-command="moment"]')),
    sourceMode: document.querySelector('#toggle-raw-source')?.textContent,
  }));
  if (writerSurface.label !== 'Writer' || !writerSurface.headline || !writerSurface.momentControl || writerSurface.sourceMode !== 'Markdown') throw new Error(`Author did not expose the document-first Markdown writer: ${JSON.stringify(writerSurface)}`);
  const writerLayout = await authorRealm.evaluate(() => ({
    height: innerHeight,
    regions: ['.editor-pane', '.editor-footer', '.thumbnail-footer', '#renderer-preview'].map(selector => {
      const bounds = document.querySelector(selector).getBoundingClientRect();
      return { selector, top: bounds.top, bottom: bounds.bottom, height: bounds.height };
    }),
  }));
  if (writerLayout.regions.some(region => region.top < 0 || region.bottom > writerLayout.height + 1 || region.height < 1)) throw new Error(`Writer chrome or live preview escaped the native window: ${JSON.stringify(writerLayout)}`);
  console.log('PASS Writer preview and editing controls fit the native window');
  if (writerScreenshotPath) {

    await eventually('Writer preview', async () => {
      const frame = author.frames().find(item => item.url().startsWith('gamma://deck/'));
      return frame && frame.mainRealm().evaluate(() => Boolean(window.__GAMMA_PRESENTER_READY__));
    });
    await delay(900);
    await author.screenshot({ path: writerScreenshotPath });
  }
  await author.click('#source');
  // CDP does not dispatch AppKit edit-menu accelerators. Select the editable
  // range, then send real keyboard text and exercise the visible Writer actions.
  await author.$eval('#source', element => element.select());
  await author.keyboard.type('A last-minute decision\nMy private speaker notes.');
  await authorRealm.evaluate(() => document.querySelector('#source').setSelectionRange(0, 0));
  await author.click('[data-writer-command="headline"]');
  const edited = await eventually('Writer headline and private notes', async () => {
    const value = await authorRealm.evaluate(() => window.gammaDesktop.getSnapshot());
    if (value.source.startsWith('# A last-minute decision') && value.renderState === 'ready') return value;
    throw new Error(JSON.stringify({ source: value.source.slice(0, 400), renderState: value.renderState, error: value.error, visibleSource: await author.$eval('#source', element => element.value.slice(0, 400)), pageErrors }));
  });
  await author.click('#toggle-raw-source');
  await author.waitForFunction(() => document.querySelector('#writer-shell').classList.contains('raw-source'));
  await author.click('#toggle-raw-source');
  if (await author.$eval('#source', element => element.value) !== edited.source) throw new Error('Writer/Markdown toggling changed the source.');
  console.log('PASS Writer typing, visible headline action, and reversible Markdown');
  await author.click('#backup-google-drive');
  console.log('Checking the native connections panel');
  await author.waitForSelector('#connections-dialog[open]');
  await eventually('connection status controls', () => authorRealm.evaluate(() => !document.querySelector('#connections-controls').disabled), 35_000);
  const connectionState = await author.$eval('#connections-status', element => element.textContent);
  if (connectionState !== 'Connection status updated.') throw new Error(`The connection panel failed: ${connectionState}`);
  await author.type('#share-url', 'http://localhost:3000');
  await author.click('[data-share="iframe"]');
  await author.waitForFunction(() => document.querySelector('#connections-status').classList.contains('is-error'));
  if (connectionsScreenshotPath) {  await author.screenshot({ path: connectionsScreenshotPath }); }
  await author.click('#close-connections');
  console.log('PASS local connection status and share URL recovery');
  author.once('dialog', dialog => dialog.accept());
  await author.click('#open-templates');
  await author.waitForSelector('#template-dialog[open]');
  if (await author.$$('[data-template-id]').then(items => items.length) !== initial.templates.length) throw new Error('Template gallery contents do not match the packaged template catalog.');
  const architectureOption = await author.$('[data-template-id="architecture"]');
  await authorRealm.evaluate(() => window.gammaDesktop.clearCue());
  await delay(150);
  if (!await architectureOption.evaluate(element => element.isConnected)) throw new Error('A state update replaced the template button during interaction.');
  if (templateScreenshotPath) {  await author.screenshot({ path: templateScreenshotPath }); }
  await author.click('[data-template-id="architecture"]');
  const templated = await eventually('runnable architecture template', async () => {
    const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
    if (snapshot?.sourceKind === 'yaml' && snapshot?.slideCount >= 3 && snapshot?.title === 'Architecture review · live model' && snapshot.renderState === 'ready') return snapshot;
    throw new Error(JSON.stringify({ kind: snapshot?.sourceKind, count: snapshot?.slideCount, title: snapshot?.title, renderState: snapshot?.renderState, error: snapshot?.error, feedback: await author.$eval('#feedback', element => element.textContent), pageErrors, consoleMessages: consoleMessages.slice(-4) }));
  });
  const templateFrame = await eventually('architecture template renderer', async () => {
    const candidate = author.frames().find(item => item.url().startsWith('gamma://deck/'));
    return candidate && await candidate.mainRealm().evaluate(() => Boolean(window.__GAMMA_PRESENTER_READY__) && document.body.dataset.presentationTheme === 'signal-room') ? candidate : null;
  });
  await authorRealm.evaluate(() => window.gammaDesktop.navigate(1));
  await eventually('live template architecture scene', () => templateFrame.mainRealm().evaluate(() =>
    document.querySelector('section.present .archify-slide')?.dataset.ready === 'true'));
  if (richScreenshotPath) { await delay(900); await author.screenshot({ path: richScreenshotPath }); }
  await authorRealm.evaluate(() => window.gammaDesktop.navigate(0));
  console.log('PASS built-in architecture template with a live Archify scene');
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
    const blockingChooser = await frame.mainRealm().evaluate(() => Boolean(document.querySelector('#gamma-theme-chooser.is-visible, .gamma-studio-wizard.is-visible')));
    if (visual.theme !== theme || !visual.background || !visual.headingFont || blockingChooser) throw new Error(`Desktop theme ${theme} did not reach the visible embedded Gamma renderer.`);
    themeProof.push(visual);
    if (themeScreenshotDirectory) await (await author.$('#renderer-preview')).screenshot({ path: join(themeScreenshotDirectory, `${theme}.png`) });
    lastAuthorState = themed;
  }
  if (new Set(themeProof.map(proof => proof.background)).size !== 3 || new Set(themeProof.map(proof => proof.headingFont)).size !== 3) {
    throw new Error(`Desktop themes collapsed to visual variants: ${JSON.stringify(themeProof)}`);
  }
  if (themeReportPath) await writeFile(themeReportPath, `${JSON.stringify(themeProof, null, 2)}\n`, 'utf8');
  console.log('PASS three visually distinct desktop themes');
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
  if (screenshotPath) {  await author.mainFrame().mainRealm().evaluate(() => document.querySelector('.approvals-section')?.scrollIntoView({ block: 'center' })); await delay(100); await author.screenshot({ path: screenshotPath, fullPage: true }); }
  await authorRealm.evaluate(id => window.gammaDesktop.resolveOperatorAction(id, true), pendingRequest.id);
  const approvedSnapshot = await eventually('approved live action', async () => {
    const snapshot = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
    return snapshot?.operatorRequests?.find(request => request.id === pendingRequest.id && request.status === 'completed') ? snapshot : null;
  });
  if (approvedSnapshot.operatorRequests.find(request => request.id === pendingRequest.id)?.result !== 'Presenter Studio opened.') throw new Error('Author approval did not execute the bounded Stage action.');
  const stage = await eventually('Stage window', async () => (await browser.pages()).find(page => page.url().startsWith('gamma://deck/')));
  const stageErrors = [];
  const stageConsole = [];
  stage.on('pageerror', error => stageErrors.push(error.message));
  stage.on('console', message => stageConsole.push(`${message.type()}: ${message.text()}`));
  console.log('PASS authenticated MCP and an operator-approved Stage action');
  // Return through the native presentation lifecycle. CDP bringToFront is not
  // implemented reliably for Electron's separate native Stage window.
  await authorRealm.evaluate(() => window.gammaDesktop.stopPresenting());
  await eventually('return to Author', async () => !(await authorRealm.evaluate(() => window.gammaDesktop.getSnapshot())).stageVisible);
  console.log('PASS stop presentation and return to Author');
  await author.click('#add-slide');
  await eventually('add slide after the approved action', async () => {
    const value = await authorRealm.evaluate(() => window.gammaDesktop.getSnapshot());
    if (value.slideCount === templated.slideCount + 1 && value.renderState === 'ready') return true;
    throw new Error(JSON.stringify({ slideCount: value.slideCount, renderState: value.renderState, error: value.error }));
  });
  console.log('PASS slide editing after returning to Author');
  await authorRealm.evaluate(() => {
    window.__gammaSmokePresentClicks = 0;
    document.querySelector('#present').addEventListener('click', () => { window.__gammaSmokePresentClicks += 1; });
  });
  await author.click('#present');
  await eventually('visible Stage after Present', async () => {
    const value = await authorRealm.evaluate(async () => ({ live: (await window.gammaDesktop.getSnapshot()).stageVisible, clicks: window.__gammaSmokePresentClicks, feedback: document.querySelector('#feedback')?.textContent, button: document.querySelector('#present')?.getBoundingClientRect().toJSON(), viewport: [innerWidth, innerHeight] }));
    if (value.live) return true;
    throw new Error(JSON.stringify(value));
  });
  try { await eventually('Stage renderer', () => stage.mainFrame().mainRealm().evaluate(() => Boolean(window.__GAMMA_PRESENTER_READY__)), 25_000); }
  catch (error) { const session = await stage.createCDPSession(); const realm = await session.send('Runtime.evaluate', { expression: '({ url: location.href, ready: window.__GAMMA_PRESENTER_READY__, reveal: typeof window.Reveal, body: document.body?.textContent?.slice(0,300) })', returnByValue: true }).catch(() => ({})); await session.detach().catch(() => {}); throw new Error(`${error.message} Stage realm: ${JSON.stringify(realm.result?.value)} Renderer errors: ${stageErrors.join(' | ')} Console: ${stageConsole.join(' | ')}`); }
  const state = await authorRealm.evaluate(() => window.gammaDesktop?.getSnapshot());
  if (state.slideCount !== templated.slideCount + 1 || !state.stageVisible) throw new Error('Author-to-Stage transition did not preserve the expected desktop state.');
  const privateCue = 'PRIVATE QA CUE — operator only';
  await authorRealm.evaluate(cue => window.gammaDesktop.setCue(cue, 'normal'), privateCue);
  await authorRealm.evaluate(() => window.gammaDesktop.openSpeaker());
  const speaker = await eventually('Speaker window', async () => (await browser.pages()).find(page => page.url().endsWith('/speaker.html')));
  await eventually('private cue in Speaker', () => speaker.mainFrame().mainRealm().evaluate(cue => document.querySelector('#speaker-cue')?.textContent.includes(cue), privateCue));
  const cueLeak = await stage.mainFrame().mainRealm().evaluate(cue => document.body.textContent.includes(cue) || Boolean(document.querySelector('#gamma-presenter-live-hud')), privateCue);
  if (cueLeak) throw new Error('The public Stage exposed a private operator cue or HUD.');
  console.log('PASS private cue visible in Speaker and absent from public Stage');
  if (pageErrors.length || stageErrors.length) throw new Error(`Renderer errors: ${[...pageErrors, ...stageErrors].join(' | ')}`);
  console.log(JSON.stringify({ app: basename(appBundle), author: true, mcp: true, stage: true, slides: state.slideCount, rendererReady: true, themes: themeProof }));
} finally {
  await browser?.disconnect().catch(() => {});
  if (!child.killed) child.kill('SIGTERM');
  await Promise.race([new Promise(resolveExit => child.once('exit', resolveExit)), delay(5_000)]);
  await rm(profile, { recursive: true, force: true });
  if (child.exitCode && child.exitCode !== 0) throw new Error(`Gamma Presenter smoke process exited with ${child.exitCode}: ${processLog.join('').trim()}`);
}
