import { app, BrowserWindow, Menu, Tray, dialog, ipcMain, nativeImage, Notification, protocol, screen, session } from 'electron';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { access, copyFile, mkdir, readFile, writeFile, unlink } from 'fs/promises';
import { extname, basename, dirname, relative, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { renderDeck } from '../engine/renderer.js';
import { loadDeck } from '../loader/index.js';
import { embedDeckAssets } from '../loader/assets.js';
import { listThemes } from '../themes/index.js';
import { markdownToDeck, starterMarkdown } from './markdown.js';
import { insertMediaSlideSource, mutateSlidesSource, parseRichSource, patchMarkdownSlideSource, patchRichSlideSource, richLayouts, richSlideEditor, richSlideRanges, stringifyRichSource } from './deck-source.js';
import { renderHandoutHtml } from './handout.js';
import { writeDeckPptx } from './pptx.js';
import { startDesktopMcp } from './mcp-control.js';

protocol.registerSchemesAsPrivileged([{ scheme: 'gamma', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }]);
const root = dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);
const desktopFile = name => resolve(root, name);
const desktopIcon = () => resolve(app.getAppPath(), 'build', 'icon.svg.png');
const recoveryFile = () => resolve(app.getPath('userData'), 'presenter-recovery.json');
app.setName('Gamma Presenter');
const state = { source: starterMarkdown, sourcePath: null, title: 'New presentation', theme: 'signal-room', deck: null, rawDeck: null, html: '', currentIndex: 0, stageDisplayId: null, sourceKind: 'markdown', revision: 0, editRevision: 0, dirty: false, renderState: 'idle', error: null, sourceRanges: [], recoveryRestored: false, presentationStartedAt: 0, slideStartedAt: 0, countdownRemainingMs: 0, countdownEndsAt: 0, countdownExpired: false, cue: null, activity: [], operatorRequests: [], copilot: { available: {}, running: false, output: '', status: 'Choose a local CLI to draft a private co-pilot response.' } };
let authorWindow; let stageWindow; let speakerWindow; let recoveryTimer; let tray; let desktopMcp; let timingTicker;
const indexOf = value => Math.max(0, Math.min(Number(value) || 0, Math.max((state.deck?.slides?.length || 1) - 1, 0)));
const operatorActions = Object.freeze({
  'open-studio': 'Open Presenter Studio',
  'open-terminal': 'Open Stage Console',
  'open-browser': 'Open browser demonstration',
  'open-video-output': 'Open clean video output',
  'toggle-camera': 'Toggle camera',
  'toggle-microphone': 'Toggle microphone',
  'choose-screen-share': 'Choose screen or tab to share',
  'start-recording': 'Start recording',
  'stop-recording': 'Stop recording',
  'speak-note': 'Speak co-pilot note aloud',
});
const rendererUrl = () => `gamma://deck/presentation.html?revision=${state.revision}`;

function presentError(error) {
  const message = error instanceof Error ? error.message : 'Unable to update the presentation.';
  return Number.isInteger(error?.mark?.line) ? { message: message.split('\n')[0], line: error.mark.line + 1, column: error.mark.column + 1 } : { message };
}
function slideSummary(index) {
  const slide = state.deck?.slides?.[index] || {}, raw = state.rawDeck?.slides?.[index];
  return { title: slide.title || `Slide ${index + 1}`, subtitle: slide.subtitle || '', notes: slide.notes || slide.narration || '', layout: slide.layout || 'blank', image: slide.image?.src || slide.visual?.src || slide.media?.poster || '', hasMedia: Boolean(slide.media?.src), hasChart: slide.layout === 'chart', hasDiagram: slide.layout === 'diagram', editor: raw ? richSlideEditor(raw) : null };
}
function stageVisible() { return Boolean(stageWindow && !stageWindow.isDestroyed() && stageWindow.isVisible()); }
function formatClock(milliseconds) { const seconds = Math.max(0, Math.ceil(milliseconds / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function timing() { const now = Date.now(), remaining = state.countdownEndsAt ? Math.max(0, state.countdownEndsAt - now) : state.countdownRemainingMs; return { presentationElapsedMs: state.presentationStartedAt ? now - state.presentationStartedAt : 0, slideElapsedMs: state.slideStartedAt ? now - state.slideStartedAt : 0, countdownRemainingMs: remaining, countdownRunning: Boolean(state.countdownEndsAt), overdue: Boolean(state.countdownExpired) }; }
function addActivity(message, level = 'normal') { state.activity = [{ message: String(message).slice(0, 500), level, at: Date.now() }, ...state.activity].slice(0, 16); }
function notify(title, body) { if (Notification.isSupported()) new Notification({ title, body, silent: false }).show(); }
function snapshot() {
  const slides = state.deck?.slides || [], currentIndex = indexOf(state.currentIndex);
  return { source: state.source, sourceKind: state.sourceKind, sourceLanguage: state.sourceKind === 'markdown' ? 'Markdown' : state.sourceKind === 'json' ? 'JSON' : 'YAML', title: state.title, sourcePath: state.sourcePath, theme: state.theme, themes: listThemes(), slideCount: slides.length, currentIndex, currentSlide: slideSummary(currentIndex), nextSlide: slideSummary(indexOf(currentIndex + 1)), slides: slides.map((_slide, index) => slideSummary(index)), rendererUrl: rendererUrl(), rendererRevision: state.revision, stageVisible: stageVisible(), stageDisplayId: state.stageDisplayId, displays: screen.getAllDisplays().map((display, index) => ({ id: String(display.id), label: `Stage · display ${index + 1}` })), dirty: state.dirty, renderState: state.renderState, error: state.error, sourceRanges: state.sourceRanges, richLayouts, recoveryRestored: state.recoveryRestored, timing: timing(), cue: state.cue, activity: state.activity, operatorRequests: state.operatorRequests, operatorActions, mcp: desktopMcp ? { endpoint: desktopMcp.endpoint, token: desktopMcp.token, connected: desktopMcp.connected, scope: 'Loopback only · ephemeral bearer token' } : { endpoint: '', token: '', connected: 0, scope: state.mcpError || 'Starting local MCP…' }, copilot: state.copilot };
}
function controlMenu() { const live = stageVisible(), liveTiming = timing(); return [{ label: live ? `Live · ${formatClock(liveTiming.presentationElapsedMs)}` : 'Gamma Presenter ready', enabled: false }, { type: 'separator' }, { label: live ? 'Stop presenting' : 'Present now', click: () => live ? stopPresenting() : present().catch(() => {}) }, { label: 'Open speaker view', click: createSpeakerWindow }, { type: 'separator' }, { label: 'Previous slide', enabled: state.currentIndex > 0, click: () => navigate('previous') }, { label: 'Next slide', enabled: state.currentIndex < Math.max(0, (state.deck?.slides.length || 1) - 1), click: () => navigate('next') }, { type: 'separator' }, { label: liveTiming.countdownRunning ? `Pause countdown · ${formatClock(liveTiming.countdownRemainingMs)}` : 'Start countdown', click: () => controlCountdown(liveTiming.countdownRunning ? 'pause' : 'start') }, { label: 'Show Gamma Presenter', click: () => { authorWindow?.show(); authorWindow?.focus(); } }]; }
function updateNativeControls() { const menu = Menu.buildFromTemplate(controlMenu()); if (process.platform === 'darwin' && app.dock) app.dock.setMenu(menu); if (tray) { tray.setContextMenu(menu); const live = stageVisible(); tray.setTitle(live ? `Γ ${formatClock(timing().presentationElapsedMs)}` : 'Γ'); tray.setToolTip(live ? `Gamma Presenter · ${formatClock(timing().presentationElapsedMs)} live` : 'Gamma Presenter'); } }
function broadcast() { const data = snapshot(); [authorWindow, stageWindow, speakerWindow].forEach(win => { if (win && !win.isDestroyed()) win.webContents.send('presenter:state', data); }); updateNativeControls(); }
function bridgeRenderer(html) {
  const script = `<script>(()=>{const ready=async()=>{for(let i=0;i<160&&(!window.Reveal||!window.__GAMMA_READY__);i+=1)await new Promise(r=>setTimeout(r,25));if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});window.__GAMMA_PRESENTER_READY__=Boolean(window.Reveal&&window.__GAMMA_READY__);window.parent?.postMessage({type:'gamma-presenter-ready'},'*')};window.addEventListener('message',e=>{if(e.data?.type==='gamma-presenter-navigate'&&window.Reveal)window.Reveal.slide(Math.max(0,Number(e.data.index)||0))});ready()})()</script>`;
  // Runtime bundles (notably ECharts) legitimately contain literal `</body>`
  // strings. Injecting at the first occurrence breaks that bundle's JavaScript.
  const closingBody = html.toLowerCase().lastIndexOf('</body>');
  return closingBody < 0 ? `${html}${script}` : `${html.slice(0, closingBody)}${script}${html.slice(closingBody)}`;
}
async function loadStageRevision(stage) { if (stage.__gammaRevision === state.revision) return; const revision = state.revision; await stage.loadURL(rendererUrl()); if (revision === state.revision) stage.__gammaRevision = revision; }
async function rebuild({ preserveSlide = true, expectedRevision = state.editRevision } = {}) {
  const source = state.source, kind = state.sourceKind;
  try {
    const rawDeck = kind === 'markdown' ? null : parseRichSource(source, kind);
    const draft = kind === 'markdown' ? markdownToDeck(source, { title: state.title, filePath: state.sourcePath, theme: state.theme }) : loadDeck(source);
    draft.theme = state.theme || draft.theme;
    const deck = embedDeckAssets(draft, state.sourcePath ? dirname(state.sourcePath) : process.cwd());
    const html = bridgeRenderer(renderDeck(deck));
    if (expectedRevision !== state.editRevision || source !== state.source) return false;
    state.deck = deck; state.rawDeck = rawDeck; state.title = deck.meta.title; state.sourceRanges = rawDeck ? richSlideRanges(source, kind) : [];
    if (!preserveSlide) state.currentIndex = 0;
    state.currentIndex = indexOf(state.currentIndex); state.html = html; state.revision += 1; state.error = null; state.renderState = 'ready';
    if (stageWindow && !stageWindow.isDestroyed()) await loadStageRevision(stageWindow);
  } catch (error) {
    if (expectedRevision !== state.editRevision || source !== state.source) return false;
    state.error = presentError(error); state.renderState = 'invalid';
  }
  broadcast(); return !state.error;
}
function scheduleRecovery() { clearTimeout(recoveryTimer); recoveryTimer = setTimeout(() => writeFile(recoveryFile(), JSON.stringify({ source: state.source, sourceKind: state.sourceKind, title: state.title, theme: state.theme, sourcePath: state.sourcePath }), 'utf8').catch(() => {}), 500); }
async function clearRecovery() { await unlink(recoveryFile()).catch(() => {}); }
async function restoreRecovery() { try { const saved = JSON.parse(await readFile(recoveryFile(), 'utf8')); if (!saved?.source || !['markdown', 'yaml', 'json'].includes(saved.sourceKind)) return; Object.assign(state, { source: String(saved.source), sourceKind: saved.sourceKind, title: String(saved.title || state.title), theme: String(saved.theme || state.theme), sourcePath: saved.sourcePath || null, dirty: true, recoveryRestored: true }); } catch {} }
async function updateSource(source) { state.source = String(source); state.dirty = true; state.editRevision += 1; state.error = null; state.renderState = 'rendering'; scheduleRecovery(); broadcast(); return rebuild({ expectedRevision: state.editRevision }); }
async function openDeck(path) {
  const extension = extname(path).toLowerCase(); if (!/\.(?:md|markdown|txt|yaml|yml|json)$/i.test(extension)) throw new Error('Supported formats: Markdown, YAML and JSON.');
  state.source = await readFile(path, 'utf8'); state.sourcePath = path; state.sourceKind = extension === '.json' ? 'json' : /\.ya?ml$/i.test(extension) ? 'yaml' : 'markdown'; state.title = basename(path, extension); state.dirty = false; state.recoveryRestored = false; state.editRevision += 1; await rebuild({ preserveSlide: false, expectedRevision: state.editRevision }); return snapshot();
}
async function chooseAndOpen() { const result = await dialog.showOpenDialog(authorWindow, { properties: ['openFile'], filters: [{ name: 'Presentations', extensions: ['md', 'markdown', 'txt', 'yaml', 'yml', 'json'] }] }); return !result.canceled && result.filePaths[0] ? openDeck(result.filePaths[0]) : snapshot(); }
async function saveSource(forcePath = false) {
  const extensions = state.sourceKind === 'markdown' ? ['md', 'markdown', 'txt'] : state.sourceKind === 'json' ? ['json'] : ['yaml', 'yml'];
  if (!state.sourcePath || forcePath || !new RegExp(`\\.(?:${extensions.join('|')})$`, 'i').test(state.sourcePath)) { const format = state.sourceKind === 'markdown' ? 'Markdown' : state.sourceKind === 'json' ? 'JSON' : 'YAML'; const result = await dialog.showSaveDialog(authorWindow, { defaultPath: `${state.title || 'presentation'}.${extensions[0]}`, filters: [{ name: format, extensions }] }); if (result.canceled || !result.filePath) return snapshot(); state.sourcePath = result.filePath; }
  await writeFile(state.sourcePath, state.source, 'utf8'); state.title = basename(state.sourcePath, extname(state.sourcePath)); state.dirty = false; state.recoveryRestored = false; await clearRecovery(); broadcast(); return snapshot();
}
async function patchRichSlide(index, patch) { if (state.sourceKind === 'markdown') throw new Error('The rich inspector is available for YAML and JSON documents only.'); await updateSource(patchRichSlideSource(state.source, state.sourceKind, indexOf(index), patch || {})); return snapshot(); }
async function patchMarkdownSlide(index, patch) { if (state.sourceKind !== 'markdown') throw new Error('The Markdown inspector is available for Markdown documents only.'); await updateSource(patchMarkdownSlideSource(state.source, indexOf(index), patch || {})); return snapshot(); }
async function mutateSlides(action, index, targetIndex) {
  const result = mutateSlidesSource(state.source, state.sourceKind, action, indexOf(index), targetIndex);
  state.currentIndex = result.currentIndex;
  await updateSource(result.source);
  return snapshot();
}
function mediaKind(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (extension === '.gif') return 'visual';
  if (['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'].includes(extension)) return 'image';
  if (['.mp4', '.mov', '.m4v', '.webm', '.ogv'].includes(extension)) return 'video';
  if (['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.oga', '.flac'].includes(extension)) return 'audio';
  return null;
}
async function uniqueAssetPath(directory, fileName) {
  const extension = extname(fileName), stem = basename(fileName, extension).replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'media';
  for (let index = 0; index < 10_000; index += 1) {
    const candidate = resolve(directory, `${stem}${index ? `-${index + 1}` : ''}${extension.toLowerCase()}`);
    try { await access(candidate); } catch { return candidate; }
  }
  throw new Error('Unable to allocate a safe local media filename.');
}
async function importMediaPath(path, index) {
  const selectedPath = resolve(String(path || '')), kind = mediaKind(selectedPath);
  if (!kind) throw new Error('This file is not a supported image, animation, video, or audio file.');
  if (!state.sourcePath) await saveSource();
  if (!state.sourcePath) throw new Error('Save the presentation before importing local media.');
  const assetDirectory = resolve(dirname(state.sourcePath), 'media');
  await mkdir(assetDirectory, { recursive: true });
  const destination = dirname(selectedPath) === assetDirectory ? selectedPath : await uniqueAssetPath(assetDirectory, basename(selectedPath));
  if (destination !== selectedPath) await copyFile(selectedPath, destination);
  const reference = relative(dirname(state.sourcePath), destination).split(sep).join('/');
  const inserted = insertMediaSlideSource(state.source, state.sourceKind, indexOf(index), { src: reference, kind, alt: basename(selectedPath, extname(selectedPath)) });
  state.currentIndex = inserted.currentIndex;
  await updateSource(inserted.source);
  return snapshot();
}
async function importMedia(index) {
  const result = await dialog.showOpenDialog(authorWindow, { properties: ['openFile'], filters: [{ name: 'Media', extensions: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'svg', 'gif', 'mp4', 'mov', 'm4v', 'webm', 'ogv', 'mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'flac'] }] });
  return result.canceled || !result.filePaths[0] ? snapshot() : importMediaPath(result.filePaths[0], index);
}
async function runDesktopTerminal(command) {
  const value = String(command || '').trim();
  if (!value || value.length > 4_000 || value.includes('\0')) throw new Error('Enter a local command up to 4,000 characters.');
  const cwd = state.sourcePath ? dirname(state.sourcePath) : process.cwd();
  try {
    const { stdout, stderr } = await execFileAsync(process.env.SHELL || '/bin/zsh', ['-lc', value], { cwd, timeout: 30_000, maxBuffer: 1_000_000 });
    return { stdout, stderr, exitCode: 0, cwd };
  } catch (error) {
    return { stdout: String(error.stdout || ''), stderr: String(error.stderr || error.message || ''), exitCode: Number.isInteger(error.code) ? error.code : 1, cwd };
  }
}
async function detectCopilotCli(name) { try { const { stdout } = await execFileAsync('/usr/bin/which', [name], { timeout: 2_000 }); return stdout.trim(); } catch { return ''; } }
async function detectCopilots() { const [codex, claude] = await Promise.all([detectCopilotCli('codex'), detectCopilotCli('claude')]); state.copilot.available = { codex: Boolean(codex), claude: Boolean(claude) }; if (!codex && !claude) state.copilot.status = 'Codex CLI and Claude Code were not found on PATH.'; broadcast(); return snapshot(); }
async function runCopilot(cli, prompt) {
  const name = String(cli || '').toLowerCase(), instruction = String(prompt || '').trim();
  if (!['codex', 'claude'].includes(name)) throw new Error('Choose Codex CLI or Claude Code.');
  if (!state.copilot.available[name]) throw new Error(`${name === 'codex' ? 'Codex CLI' : 'Claude Code'} is not available on PATH.`);
  if (!instruction || instruction.length > 12_000 || instruction.includes('\0')) throw new Error('Enter a local co-pilot instruction up to 12,000 characters.');
  const cwd = state.sourcePath ? dirname(state.sourcePath) : process.cwd();
  state.copilot = { ...state.copilot, running: true, output: '', status: `${name === 'codex' ? 'Codex CLI' : 'Claude Code'} is drafting locally…` }; addActivity(`Started ${name === 'codex' ? 'Codex CLI' : 'Claude Code'} co-pilot`, 'normal'); broadcast();
  const args = name === 'codex' ? ['exec', '--skip-git-repo-check', '--sandbox', 'read-only', instruction] : ['-p', '--permission-mode', 'plan', instruction];
  try {
    const { stdout, stderr } = await execFileAsync(name, args, { cwd, timeout: 120_000, maxBuffer: 1_000_000 });
    state.copilot = { ...state.copilot, running: false, output: `${stdout}${stderr ? `\n${stderr}` : ''}`.trim() || 'The local CLI completed without text output.', status: `${name === 'codex' ? 'Codex CLI' : 'Claude Code'} completed in read-only/plan mode.` }; addActivity(`${name === 'codex' ? 'Codex CLI' : 'Claude Code'} co-pilot completed`, 'normal');
  } catch (error) {
    const output = `${String(error.stdout || '')}${error.stderr ? `\n${error.stderr}` : ''}`.trim();
    state.copilot = { ...state.copilot, running: false, output: output || String(error.message || 'Local CLI failed.'), status: `${name === 'codex' ? 'Codex CLI' : 'Claude Code'} could not complete the instruction.` }; addActivity(`${name === 'codex' ? 'Codex CLI' : 'Claude Code'} co-pilot failed`, 'urgent');
  }
  broadcast(); return snapshot();
}
function setCue(message, level = 'normal') { const text = String(message || '').trim(); state.cue = text ? { text: text.slice(0, 500), level: level === 'urgent' ? 'urgent' : 'normal', createdAt: Date.now() } : null; if (text) { addActivity(`Co-pilot cue: ${text}`, state.cue.level); if (state.cue.level === 'urgent') notify('Gamma Presenter · urgent cue', text); } broadcast(); return snapshot(); }
function clearCue() { state.cue = null; addActivity('Cleared co-pilot cue'); broadcast(); return snapshot(); }
function requestOperatorAction(action, note = '') {
  const requestedAction = String(action || '');
  if (!operatorActions[requestedAction]) throw new Error('That live Stage action is not available.');
  const detail = String(note || '').trim().slice(0, 500);
  const request = { id: randomUUID(), action: requestedAction, label: operatorActions[requestedAction], note: detail, status: 'pending', requestedAt: Date.now(), resolvedAt: 0, result: '' };
  state.operatorRequests = [request, ...state.operatorRequests.filter(item => item.status === 'pending')].slice(0, 16);
  addActivity(`Co-pilot requested operator approval: ${request.label}${detail ? ` — ${detail}` : ''}`, 'normal');
  notify('Gamma Presenter · operator approval', `${request.label}${detail ? ` — ${detail}` : ''}`);
  broadcast();
  return snapshot();
}
async function executeApprovedOperatorAction(action, note = '') {
  await present();
  const stage = await ensureStageWindow();
  const result = await stage.webContents.executeJavaScript(`(() => {
    const action = ${JSON.stringify(action)};
    const note = ${JSON.stringify(String(note || '').trim().slice(0, 500))};
    const openStudio = () => {
      const panel = document.querySelector('.gamma-live-panel');
      if (!panel || panel.hidden) document.querySelector('[data-orbit="studio"]')?.click();
      return document.querySelector('.gamma-live-panel');
    };
    const studio = () => window.__gammaStudio;
    const ready = () => {
      openStudio();
      if (!studio()) return { ok: false, message: 'Presenter Studio is still loading. Try again in a moment.' };
      return null;
    };
    if (action === 'open-studio') { openStudio(); return { ok: true, message: 'Presenter Studio opened.' }; }
    if (action === 'open-terminal') { window.dispatchEvent(new Event('gamma:terminal-request')); return { ok: true, message: 'Stage Console opened.' }; }
    if (action === 'open-browser') { window.dispatchEvent(new Event('gamma:browser-open')); return { ok: true, message: 'Browser demonstration opened.' }; }
    if (action === 'open-video-output') { return window.__gammaOpenOutput?.() ? { ok: true, message: 'Clean video output opened.' } : { ok: false, message: 'macOS blocked the output window. Allow it and retry.' }; }
    if (action === 'speak-note') {
      if (!note) return { ok: false, message: 'Add the exact text to speak in the co-pilot request.' };
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return { ok: false, message: 'Speech synthesis is unavailable in this Stage.' };
      window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(note); utterance.lang = document.documentElement.lang || 'en-US'; window.speechSynthesis.speak(utterance);
      return { ok: true, message: 'Co-pilot note is being spoken aloud.' };
    }
    const waiting = ready(); if (waiting) return waiting;
    if (action === 'toggle-camera') return Promise.resolve(studio().camera()).then(() => ({ ok: true, message: 'Camera control updated.' }));
    if (action === 'toggle-microphone') return Promise.resolve(studio().microphone()).then(() => ({ ok: true, message: 'Microphone control updated.' }));
    if (action === 'choose-screen-share') return Promise.resolve(studio().source()).then(ok => ({ ok: Boolean(ok), message: ok ? 'Screen-share picker opened.' : 'Screen sharing was not started.' }));
    if (action === 'start-recording') return Promise.resolve(studio().record()).then(() => ({ ok: true, message: 'Recording was requested; Studio validates the source before starting.' }));
    if (action === 'stop-recording') return Promise.resolve(studio().stop()).then(() => ({ ok: true, message: 'Recording stop was requested.' }));
    return { ok: false, message: 'Unsupported approved action.' };
  })()`, true);
  if (!result?.ok) throw new Error(result?.message || 'The Stage could not complete that action.');
  return result.message;
}
async function resolveOperatorAction(id, approved) {
  const request = state.operatorRequests.find(item => item.id === String(id));
  if (!request || request.status !== 'pending') throw new Error('That operator request is no longer pending.');
  if (!approved) {
    request.status = 'rejected'; request.resolvedAt = Date.now(); request.result = 'Rejected by operator';
    addActivity(`Operator rejected: ${request.label}`, 'normal'); broadcast(); return snapshot();
  }
  request.status = 'running'; request.resolvedAt = Date.now(); request.result = 'Operator approved';
  addActivity(`Operator approved: ${request.label}`, 'normal'); broadcast();
  try {
    request.result = await executeApprovedOperatorAction(request.action, request.note); request.status = 'completed';
    addActivity(`Stage action completed: ${request.label}`, 'normal');
  } catch (error) {
    request.status = 'failed'; request.result = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
    addActivity(`Stage action failed: ${request.label}`, 'urgent');
  }
  broadcast(); return snapshot();
}
function controlCountdown(action, seconds) {
  const current = timing().countdownRemainingMs;
  if (action === 'clear') { state.countdownRemainingMs = 0; state.countdownEndsAt = 0; state.countdownExpired = false; addActivity('Cleared presentation countdown'); }
  else if (action === 'set') { state.countdownRemainingMs = Math.min(14_400_000, Math.max(1_000, Number(seconds || 0) * 1_000)); state.countdownEndsAt = 0; state.countdownExpired = false; addActivity(`Set countdown to ${formatClock(state.countdownRemainingMs)}`); }
  else if (action === 'pause') { state.countdownRemainingMs = current; state.countdownEndsAt = 0; addActivity('Paused presentation countdown'); }
  else { state.countdownRemainingMs = current || 300_000; state.countdownEndsAt = Date.now() + state.countdownRemainingMs; state.countdownExpired = false; addActivity(`Started countdown at ${formatClock(state.countdownRemainingMs)}`); }
  broadcast(); return snapshot();
}
async function setTheme(theme) { if (!listThemes().some(candidate => candidate.name === theme)) return snapshot(); state.theme = theme; if (state.sourceKind !== 'markdown') { const document = parseRichSource(state.source, state.sourceKind); document.theme = theme; await updateSource(stringifyRichSource(document, state.sourceKind)); } else { state.dirty = true; state.editRevision += 1; scheduleRecovery(); await rebuild({ expectedRevision: state.editRevision }); } return snapshot(); }
async function exportHtml() { const result = await dialog.showSaveDialog(authorWindow, { defaultPath: `${state.title}.html`, filters: [{ name: 'HTML', extensions: ['html'] }] }); if (!result.canceled && result.filePath) await writeFile(result.filePath, state.html, 'utf8'); }
async function handoutPdf(html) {
  const handoutWindow = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  hardenWindow(handoutWindow);
  try {
    await handoutWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    return await handoutWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
  } finally { if (!handoutWindow.isDestroyed()) handoutWindow.destroy(); }
}
async function exportHandout(format) {
  const extension = format === 'pdf' ? 'pdf' : 'html';
  const result = await dialog.showSaveDialog(authorWindow, { defaultPath: `${state.title}-handout.${extension}`, filters: [{ name: format === 'pdf' ? 'PDF' : 'HTML', extensions: [extension] }] });
  if (result.canceled || !result.filePath) return;
  const html = renderHandoutHtml(state.deck);
  await writeFile(result.filePath, format === 'pdf' ? await handoutPdf(html) : html, format === 'pdf' ? undefined : 'utf8');
}
async function exportPptx() {
  const result = await dialog.showSaveDialog(authorWindow, { defaultPath: `${state.title}.pptx`, filters: [{ name: 'PowerPoint', extensions: ['pptx'] }] });
  if (!result.canceled && result.filePath) await writeDeckPptx(state.deck, result.filePath, { sourceDirectory: state.sourcePath ? dirname(state.sourcePath) : process.cwd() });
}
async function settleStage(stage, index) {
  const settled = await stage.webContents.executeJavaScript(`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<120&&!window.__GAMMA_PRESENTER_READY__;i+=1)await wait(25);if(!window.Reveal||!window.__GAMMA_PRESENTER_READY__)return false;window.Reveal.slide(${indexOf(index)});await Promise.all([...document.images].map(i=>i.complete?i.decode?.().catch(()=>{}):new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true})})));await Promise.all([...document.querySelectorAll('video')].map(v=>v.readyState>=1?Promise.resolve():new Promise(r=>{v.addEventListener('loadedmetadata',r,{once:true});v.addEventListener('error',r,{once:true})})));if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));return true})()`, true);
  if (!settled) throw new Error('Gamma render did not signal readiness.');
}
async function exportPdf() { const result = await dialog.showSaveDialog(authorWindow, { defaultPath: `${state.title}.pdf`, filters: [{ name: 'PDF', extensions: ['pdf'] }] }); if (result.canceled || !result.filePath) return; const stage = await ensureStageWindow(); await settleStage(stage, state.currentIndex); await writeFile(result.filePath, await stage.webContents.printToPDF({ printBackground: true, landscape: true, pageSize: 'A4' })); }
async function exportImages() { const result = await dialog.showOpenDialog(authorWindow, { buttonLabel: 'Export here', properties: ['openDirectory', 'createDirectory'] }); if (result.canceled || !result.filePaths[0]) return; const original = state.currentIndex, stage = await ensureStageWindow(); for (let index = 0; index < state.deck.slides.length; index += 1) { await settleStage(stage, index); const image = await stage.webContents.capturePage(); await writeFile(resolve(result.filePaths[0], `${String(index + 1).padStart(2, '0')}-${state.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`), image.toPNG()); } navigate(original); }
function hardenWindow(win) { win.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); win.webContents.on('will-navigate', event => event.preventDefault()); }
function createStageWindow() { stageWindow = new BrowserWindow({ width: 1440, height: 900, minWidth: 960, minHeight: 540, title: 'Stage — Gamma Presenter', icon: desktopIcon(), backgroundColor: '#05070A', show: false, webPreferences: { preload: desktopFile('preload-stage.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } }); hardenWindow(stageWindow); stageWindow.webContents.on('did-finish-load', () => stageWindow.webContents.executeJavaScript(`(()=>{const report=()=>{const i=window.Reveal?.getIndices?.()||{h:0};window.dispatchEvent(new CustomEvent('gamma:stage-change',{detail:{index:i.h||0}}))};const hud=state=>{const timing=state?.timing||{},cue=state?.cue;let node=document.querySelector('#gamma-presenter-live-hud');if(!node){node=document.createElement('aside');node.id='gamma-presenter-live-hud';node.setAttribute('aria-live','polite');node.style.cssText='position:fixed;z-index:2147483647;right:22px;bottom:22px;min-width:184px;padding:12px 14px;border:1px solid rgba(255,255,255,.22);border-radius:16px;background:rgba(5,9,18,.86);color:#fff;font:600 13px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;backdrop-filter:blur(12px);box-shadow:0 14px 30px rgba(0,0,0,.28);pointer-events:none';document.body.append(node)};const clock=ms=>{const s=Math.max(0,Math.ceil((ms||0)/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};node.innerHTML='<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#aebbd1">Gamma control room</div><div style="margin-top:4px">Slide '+clock(timing.slideElapsedMs)+' · Total '+clock(timing.presentationElapsedMs)+'</div>'+(timing.countdownRemainingMs?'<div style="margin-top:3px;color:'+(timing.overdue?'#ff5d62':'#ffb000')+'">'+(timing.overdue?'Time is up':'Countdown '+clock(timing.countdownRemainingMs))+'</div>':'')+(cue?'<div style="margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.15);color:'+(cue.level==='urgent'?'#ff6b6b':'#dce7ff')+'">'+String(cue.text).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>':'')};window.gammaStage?.onState?.(hud);hud({});const bind=()=>{if(!window.__GAMMA_PRESENTER_READY__||!window.Reveal)return setTimeout(bind,50);window.Reveal.on('slidechanged',report);report();document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='s'&&!e.target.closest('input,textarea,[contenteditable]')){e.preventDefault();e.stopImmediatePropagation();window.gammaStage?.openSpeaker?.()}},true)};bind()})()`).catch(() => {})); stageWindow.on('hide', broadcast); stageWindow.on('show', broadcast); stageWindow.on('closed', () => { stageWindow = undefined; broadcast(); }); }
async function ensureStageWindow() { if (!stageWindow || stageWindow.isDestroyed()) createStageWindow(); await loadStageRevision(stageWindow); return stageWindow; }
function moveStage(displayId) { const display = screen.getAllDisplays().find(candidate => String(candidate.id) === String(displayId)) || screen.getPrimaryDisplay(); state.stageDisplayId = String(display.id); if (stageWindow && !stageWindow.isDestroyed()) stageWindow.setBounds(display.workArea); broadcast(); }
async function present() { const stage = await ensureStageWindow(); if (!state.presentationStartedAt) { state.presentationStartedAt = Date.now(); state.slideStartedAt = Date.now(); addActivity('Presentation started'); } moveStage(state.stageDisplayId || screen.getPrimaryDisplay().id); stage.show(); stage.focus(); broadcast(); return snapshot(); }
function createSpeakerWindow() { if (speakerWindow && !speakerWindow.isDestroyed()) { speakerWindow.show(); speakerWindow.focus(); return; } speakerWindow = new BrowserWindow({ width: 1120, height: 760, minWidth: 700, minHeight: 480, title: 'Speaker view — Gamma Presenter', icon: desktopIcon(), backgroundColor: '#050912', webPreferences: { preload: desktopFile('preload-speaker.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } }); hardenWindow(speakerWindow); speakerWindow.loadFile(desktopFile('speaker.html')); speakerWindow.on('closed', () => { speakerWindow = undefined; }); }
function createAuthorWindow() { authorWindow = new BrowserWindow({ width: 1280, height: 850, minWidth: 780, minHeight: 620, titleBarStyle: 'hiddenInset', title: 'Gamma Presenter', icon: desktopIcon(), backgroundColor: '#050912', webPreferences: { preload: desktopFile('preload-author.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } }); hardenWindow(authorWindow); authorWindow.loadFile(desktopFile('author.html')); authorWindow.on('closed', () => { authorWindow = undefined; }); }
function navigate(action) { const count = state.deck?.slides?.length || 1, before = state.currentIndex; state.currentIndex = action === 'previous' ? Math.max(0, state.currentIndex - 1) : action === 'next' ? Math.min(count - 1, state.currentIndex + 1) : Math.min(count - 1, Math.max(0, Number(action) || 0)); if (state.currentIndex !== before) { state.slideStartedAt = Date.now(); addActivity(`Moved to slide ${state.currentIndex + 1}`); } broadcast(); if (stageWindow && !stageWindow.isDestroyed()) stageWindow.webContents.executeJavaScript(`window.Reveal?.slide(${state.currentIndex})`).catch(() => {}); return snapshot(); }
function stopPresenting() { if (speakerWindow && !speakerWindow.isDestroyed()) speakerWindow.close(); if (stageWindow && !stageWindow.isDestroyed()) stageWindow.hide(); if (state.countdownEndsAt) controlCountdown('pause'); state.presentationStartedAt = 0; state.slideStartedAt = 0; addActivity('Presentation stopped'); authorWindow?.show(); authorWindow?.focus(); broadcast(); return snapshot(); }
function buildMenu() { Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'Gamma Presenter', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit' }] }, { label: 'File', submenu: [{ label: 'Open…', accelerator: 'CommandOrControl+O', click: chooseAndOpen }, { label: 'Save', accelerator: 'CommandOrControl+S', click: saveSource }, { label: 'Save As…', accelerator: 'CommandOrControl+Shift+S', click: () => saveSource(true) }, { type: 'separator' }, { label: 'Export PDF…', accelerator: 'CommandOrControl+P', click: exportPdf }, { label: 'Export HTML…', click: exportHtml }, { label: 'Export PowerPoint…', click: exportPptx }, { label: 'Export speaker handout as PDF…', click: () => exportHandout('pdf') }, { label: 'Export speaker handout as HTML…', click: () => exportHandout('html') }, { label: 'Export slides as PNG…', click: exportImages }] }, { label: 'Presentation', submenu: [{ label: 'Present', accelerator: 'CommandOrControl+Return', click: () => present().catch(() => {}) }, { label: 'Stop presenting', accelerator: 'Option+CommandOrControl+P', click: stopPresenting }, { label: 'Open speaker view', accelerator: 'CommandOrControl+Shift+Return', click: createSpeakerWindow }, { type: 'separator' }, { label: 'Start countdown', click: () => controlCountdown('start') }, { label: 'Pause countdown', click: () => controlCountdown('pause') }, { label: 'Clear countdown', click: () => controlCountdown('clear') }, { type: 'separator' }, { label: 'Next slide', accelerator: 'Right', click: () => navigate('next') }, { label: 'Previous slide', accelerator: 'Left', click: () => navigate('previous') }, { type: 'separator' }, { label: 'Move stage to', submenu: screen.getAllDisplays().map((display, index) => ({ label: `Display ${index + 1}`, click: () => moveStage(display.id) })) }] }])); }
ipcMain.handle('presenter:snapshot', snapshot); ipcMain.on('presenter:update-source', (_event, source) => { updateSource(source).catch(() => {}); }); ipcMain.handle('presenter:patch-rich-slide', (_event, index, patch) => patchRichSlide(index, patch)); ipcMain.handle('presenter:patch-markdown-slide', (_event, index, patch) => patchMarkdownSlide(index, patch)); ipcMain.handle('presenter:mutate-slides', (_event, action, index, targetIndex) => mutateSlides(action, index, targetIndex)); ipcMain.handle('presenter:import-media', (_event, index) => importMedia(index)); ipcMain.handle('presenter:import-media-path', (event, path, index) => { if (!authorWindow || authorWindow.isDestroyed() || event.sender.id !== authorWindow.webContents.id) throw new Error('Local media can be imported from the Author window only.'); return importMediaPath(path, index); }); ipcMain.handle('presenter:terminal-run', (event, command) => { if (!stageWindow || stageWindow.isDestroyed() || event.sender.id !== stageWindow.webContents.id) throw new Error('Local commands are available from the active stage only.'); return runDesktopTerminal(command); }); ipcMain.handle('presenter:copilot-detect', detectCopilots); ipcMain.handle('presenter:copilot-run', (event, cli, prompt) => { if (!authorWindow || authorWindow.isDestroyed() || event.sender.id !== authorWindow.webContents.id) throw new Error('Local co-pilot commands are available from the Author window only.'); return runCopilot(cli, prompt); }); ipcMain.handle('presenter:countdown', (_event, action, seconds) => controlCountdown(action, seconds)); ipcMain.handle('presenter:cue', (_event, cue, level) => setCue(cue, level)); ipcMain.handle('presenter:clear-cue', clearCue); ipcMain.handle('presenter:operator-action', (event, id, approved) => { if (!authorWindow || authorWindow.isDestroyed() || event.sender.id !== authorWindow.webContents.id) throw new Error('Only the Author window can approve a live Stage action.'); return resolveOperatorAction(id, Boolean(approved)); }); ipcMain.handle('presenter:set-theme', (_event, theme) => setTheme(theme)); ipcMain.handle('presenter:open-document', chooseAndOpen); ipcMain.handle('presenter:save-document', saveSource); ipcMain.handle('presenter:save-document-as', () => saveSource(true)); ipcMain.handle('presenter:export-pdf', exportPdf); ipcMain.on('presenter:present', () => { present().catch(() => {}); }); ipcMain.on('presenter:open-speaker', createSpeakerWindow); ipcMain.on('presenter:move-stage', (_event, id) => moveStage(id)); ipcMain.on('presenter:navigate', (_event, action) => navigate(action)); ipcMain.on('presenter:stop-presenting', stopPresenting); ipcMain.on('presenter:stage-change', (_event, detail) => { const next = indexOf(detail?.index); if (next !== state.currentIndex) { state.currentIndex = next; state.slideStartedAt = Date.now(); addActivity(`Moved to slide ${next + 1}`); } broadcast(); });
function createTray() { const image = nativeImage.createFromPath(desktopIcon()); tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: 18, height: 18 })); tray.on('click', () => { authorWindow?.show(); authorWindow?.focus(); }); updateNativeControls(); }
app.whenReady().then(async () => { const isStagePermission = contents => Boolean(stageWindow && !stageWindow.isDestroyed() && contents.id === stageWindow.webContents.id && contents.getURL().startsWith('gamma://deck/')); session.defaultSession.setPermissionCheckHandler((contents, permission) => isStagePermission(contents) && ['media', 'display-capture'].includes(permission)); session.defaultSession.setPermissionRequestHandler((contents, permission, callback) => callback(isStagePermission(contents) && ['media', 'display-capture'].includes(permission))); protocol.handle('gamma', () => new Response(state.html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })); await restoreRecovery(); try { desktopMcp = await startDesktopMcp({ snapshot, present, stop: stopPresenting, openSpeaker: () => { createSpeakerWindow(); return snapshot(); }, navigate, countdown: controlCountdown, cue: setCue, clearCue, requestOperatorAction }); addActivity('Local MCP co-pilot endpoint is ready'); } catch (error) { state.mcpError = `Local MCP unavailable: ${error.message}`; } await detectCopilots(); createAuthorWindow(); buildMenu(); if (process.platform === 'darwin') { const icon = nativeImage.createFromPath(desktopIcon()); if (!icon.isEmpty() && app.dock) app.dock.setIcon(icon); createTray(); } timingTicker = setInterval(() => { const liveTiming = timing(); if (state.countdownEndsAt && liveTiming.countdownRemainingMs === 0 && !state.countdownExpired) { state.countdownEndsAt = 0; state.countdownRemainingMs = 0; state.countdownExpired = true; setCue('Time is up — land the point or move on.', 'urgent'); } else if (stageVisible() || state.countdownEndsAt) broadcast(); }, 1_000); await rebuild({ preserveSlide: false }); const argument = process.argv.slice(2).find(value => /\.(?:md|markdown|txt|yaml|yml|json)$/i.test(value)); if (argument) { try { await openDeck(resolve(argument)); } catch (error) { state.error = presentError(error); state.renderState = 'invalid'; broadcast(); } } });
app.on('before-quit', () => { clearInterval(timingTicker); desktopMcp?.close().catch(() => {}); }); app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); }); app.on('activate', () => { if (!authorWindow) createAuthorWindow(); });
