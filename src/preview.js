import express from 'express';
import { existsSync, watch } from 'fs';
import { dirname, resolve } from 'path';
import open from 'open';
import chalk from 'chalk';
import { randomBytes } from 'crypto';
import { execFile } from 'child_process';
import { loadDeckFile } from './loader/index.js';
import { renderDeck } from './engine/renderer.js';
import { escapeHtml } from './engine/html.js';

const LIVE_RELOAD_SCRIPT = `<script>
(() => {
  const storageKey = 'gamma-slides-position:' + location.pathname;
  if (typeof Reveal !== 'undefined') {
    Reveal.on('ready', () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey));
        if (saved) Reveal.slide(saved.h || 0, saved.v || 0, saved.f);
      } catch (_) {}
    });
    Reveal.on('slidechanged', event => {
      sessionStorage.setItem(storageKey, JSON.stringify({ h: event.indexh, v: event.indexv }));
    });
  }
  const events = new EventSource('/__gamma/events');
  events.addEventListener('reload', () => location.reload());
})();
<\/script>`;

export function injectLiveReload(html, terminalBridge) {
  const bridgeScript = `<script>window.__GAMMA_TERMINAL__=${JSON.stringify(terminalBridge)};<\/script>`;
  const withBridge = html.replace('<head>', `<head>\n${bridgeScript}`);
  const closingBody = withBridge.lastIndexOf('</body>');
  if (closingBody < 0) return `${withBridge}\n${LIVE_RELOAD_SCRIPT}`;
  return `${withBridge.slice(0, closingBody)}${LIVE_RELOAD_SCRIPT}\n${withBridge.slice(closingBody)}`;
}

function renderErrorPage(error) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
  <title>gamma-slides — Preview error</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090e1a;color:#f1f5f9;font:16px/1.6 system-ui,sans-serif;padding:32px}.card{width:min(760px,100%);padding:32px;border-radius:20px;background:#111a2c;border:1px solid #263858;box-shadow:0 24px 80px #0008}small{color:#60a5fa;text-transform:uppercase;letter-spacing:.12em;font-weight:700}h1{margin:.4em 0;font-size:2rem}pre{white-space:pre-wrap;color:#fca5a5;background:#070b13;padding:18px;border-radius:12px;overflow:auto}p{color:#94a3b8}</style></head>
  <body><main class="card"><small>Live preview</small><h1>Deck could not be rendered</h1><p>Fix the source file and save it. This page will reload automatically.</p><pre>${escapeHtml(error.message)}</pre></main>${LIVE_RELOAD_SCRIPT}</body></html>`;
}

export async function previewDeck(opts) {
  const sourcePath = resolve(opts.file);
  if (!existsSync(sourcePath)) throw new Error(`Deck not found: ${sourcePath}`);

  const port = Number.parseInt(opts.port || '3000', 10);
  const host = opts.host || '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port: ${opts.port}`);
  const isLoopback = ['127.0.0.1', 'localhost', '::1'].includes(host);
  if (opts.terminal && !isLoopback) throw new Error('The shell terminal can only be enabled on localhost');

  let pageHtml = '';
  let buildError = null;
  const clients = new Set();
  const terminalToken = randomBytes(24).toString('hex');
  const terminalBridge = { enabled: Boolean(opts.terminal), token: opts.terminal ? terminalToken : null, cwd: opts.terminal ? process.cwd() : null };
  let terminalCwd = process.cwd();

  const rebuild = () => {
    try {
      const deck = loadDeckFile(sourcePath);
      if (opts.theme) deck.theme = opts.theme;
      pageHtml = injectLiveReload(renderDeck(deck), terminalBridge);
      buildError = null;
      console.log(chalk.green('✓') + ` Rebuilt ${chalk.dim(new Date().toLocaleTimeString())}`);
    } catch (error) {
      buildError = error;
      console.error(chalk.red('✗') + ` ${error.message}`);
    }
  };

  rebuild();

  const app = express();
  app.use(express.json({ limit: '4kb' }));
  app.get('/__gamma/events', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => clients.delete(res));
  });
  app.get('/', (_req, res) => res.type('html').send(buildError ? renderErrorPage(buildError) : pageHtml));
  app.post('/__gamma/terminal', (req, res) => {
    if (!opts.terminal || req.get('X-Gamma-Token') !== terminalToken) return res.status(403).json({ error: 'Terminal bridge disabled' });
    const remote = req.socket.remoteAddress || '';
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) return res.status(403).json({ error: 'Local connections only' });
    const command = String(req.body?.command || '').trim();
    if (!command || command.length > 1000 || command.includes('\0')) return res.status(400).json({ error: 'Invalid command' });
    const shell = process.env.SHELL || '/bin/sh';
    const cwdMarker = `__GAMMA_CWD_${randomBytes(8).toString('hex')}__`;
    const wrappedCommand = `${command}\ngamma_status=$?\nprintf '\\n${cwdMarker}%s\\n' "$PWD"\nexit $gamma_status`;
    execFile(shell, ['-c', wrappedCommand], { cwd: terminalCwd, timeout: 30_000, maxBuffer: 1_000_000 }, (error, rawStdout, stderr) => {
      let stdout = rawStdout;
      const markerIndex = stdout.lastIndexOf(`\n${cwdMarker}`);
      if (markerIndex >= 0) {
        const cwdStart = markerIndex + cwdMarker.length + 1;
        const cwdEnd = stdout.indexOf('\n', cwdStart);
        const nextCwd = stdout.slice(cwdStart, cwdEnd < 0 ? undefined : cwdEnd).trim();
        if (nextCwd) terminalCwd = nextCwd;
        stdout = stdout.slice(0, markerIndex);
      }
      const payload = { stdout, stderr, exitCode: error?.code ?? 0, cwd: terminalCwd };
      if (error && error.killed) return res.status(408).json({ ...payload, error: 'Command timed out' });
      return res.status(error ? 422 : 200).json(payload);
    });
  });
  app.use(express.static(dirname(sourcePath)));

  const server = await new Promise((resolveListen, reject) => {
    const instance = app.listen(port, host, () => resolveListen(instance));
    instance.once('error', reject);
  });

  let debounceTimer;
  const watcher = watch(sourcePath, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      rebuild();
      for (const client of clients) client.write('event: reload\ndata: updated\n\n');
    }, 120);
  });

  const url = `http://${host}:${port}`;
  console.log(`\n${chalk.hex('#2563EB').bold('  gamma-slides')} ${chalk.dim('— Live preview')}`);
  console.log(`  ${chalk.green('▸')} URL:    ${chalk.bold.cyan(url)}`);
  console.log(`  ${chalk.green('▸')} Source: ${chalk.dim(sourcePath)}`);
  console.log(`  ${chalk.green('▸')} Shell:  ${opts.terminal ? chalk.yellow('enabled (localhost only)') : chalk.dim('disabled')}`);
  console.log(chalk.dim('  Save the deck to rebuild • Ctrl+C to stop\n'));
  if (opts.open !== false) await open(url);

  const close = () => {
    clearTimeout(debounceTimer);
    watcher.close();
    for (const client of clients) client.end();
    server.close();
  };
  return { server, watcher, url, close };
}
