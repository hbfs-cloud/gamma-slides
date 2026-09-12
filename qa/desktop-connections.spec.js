import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const desktop = new URL('../src/desktop/', import.meta.url);
const site = new URL('../src/site/', import.meta.url);
const fixtureAuthor = `
  import { initializeConnections } from './connections.js';

  window.__connectionsFixture = { applied: [], flushes: 0 };
  initializeConnections({
    applyState: state => window.__connectionsFixture.applied.push(state),
    flushSource: async () => {
      window.__connectionsFixture.flushes += 1;
      return { renderState: 'ready' };
    },
    title: () => 'QA presentation',
  });
`;

const files = new Map([
  ['/desktop/author.html', { type: 'text/html; charset=utf-8', body: readFileSync(new URL('author.html', desktop)) }],
  ['/desktop/desktop.css', { type: 'text/css; charset=utf-8', body: readFileSync(new URL('desktop.css', desktop)) }],
  ['/desktop/connections.js', { type: 'text/javascript; charset=utf-8', body: readFileSync(new URL('connections.js', desktop)) }],
  ['/site/sharing.js', { type: 'text/javascript; charset=utf-8', body: readFileSync(new URL('sharing.js', site)) }],
  ['/desktop/author.js', { type: 'text/javascript; charset=utf-8', body: fixtureAuthor }],
]);

let server;
let url;

const localStatus = (overrides = {}) => ({
  google: { configured: false, connected: false },
  delivery: {
    github: { available: true, authenticated: false },
    vercel: { available: true, authenticated: false },
  },
  message: 'Local connection status checked.',
  ...overrides,
});

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const entry = files.get(new URL(request.url, 'http://127.0.0.1').pathname);
    if (!entry) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': entry.type });
    response.end(entry.body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/desktop/author.html`;
});

test.afterAll(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__connectionCalls = [];
    window.__connectionHandler = async action => ({ message: `Unexpected ${action}` });
    window.gammaDesktop = {
      connection: async (action, options) => {
        window.__connectionCalls.push({ action, options });
        return window.__connectionHandler(action, options);
      },
    };
  });
  await page.goto(url);
});

async function openConnections(page) {
  await page.locator('#backup-google-drive').click();
  await expect(page.locator('#connections-dialog')).toHaveAttribute('open', '');
}

test('a long Writer document keeps the preview and editing controls inside the desktop window', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.evaluate(() => {
    const prose = 'Private speaker notes remain scrollable without displacing the slide preview.\n'.repeat(80);
    document.querySelector('#source').value = prose;
    document.querySelector('#writer-highlights').textContent = prose;
    document.querySelector('.thumbnail-list').textContent = 'A slide\n'.repeat(100);
  });
  const regions = await page.evaluate(() => ['.editor-pane', '.editor-footer', '.thumbnail-footer', '#renderer-preview'].map(selector => {
    const bounds = document.querySelector(selector).getBoundingClientRect();
    return { selector, top: bounds.top, bottom: bounds.bottom, height: bounds.height, viewportHeight: innerHeight };
  }));
  for (const region of regions) {
    expect(region.top, region.selector).toBeGreaterThanOrEqual(0);
    expect(region.bottom, region.selector).toBeLessThanOrEqual(region.viewportHeight + 1);
    expect(region.height, region.selector).toBeGreaterThan(0);
  }
  expect(await page.locator('#renderer-preview').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(180);
});

test('opening the connection dialog only reads status; import then connect exposes local states', async ({ page }) => {
  await page.evaluate(status => {
    window.__connectionHandler = async action => {
      if (action === 'status') return status;
      if (action === 'google-import') return { google: { configured: true, connected: false }, message: 'OAuth client imported locally.' };
      if (action === 'google-connect') return { google: { configured: true, connected: true }, message: 'Google Drive session stored locally.' };
      throw new Error(`Unexpected action: ${action}`);
    };
  }, localStatus());

  await openConnections(page);
  await expect(page.locator('#drive-status')).toContainText('Not configured');
  await expect(page.locator('[data-connection="google-connect"]')).toBeDisabled();
  expect(await page.evaluate(() => window.__connectionCalls.map(call => call.action))).toEqual(['status']);

  await page.locator('[data-connection="google-import"]').click();
  await expect(page.locator('[data-connection="google-connect"]')).toBeEnabled();
  await expect(page.locator('[data-connection="google-list"]')).toBeDisabled();
  await page.locator('[data-connection="google-connect"]').click();
  await expect(page.locator('#drive-status')).toContainText('Session stored locally');
  await expect(page.locator('[data-connection="google-list"]')).toBeEnabled();
  expect(await page.evaluate(() => window.__connectionCalls.map(call => call.action))).toEqual(['status', 'google-import', 'google-connect']);
});

test('lists Drive source backups, keeps controls busy, and opens a selected backup through the callback', async ({ page }) => {
  await page.evaluate(status => {
    window.__connectionHandler = async (action, options) => {
      if (action === 'status') return status;
      if (action === 'google-list') return { backups: [{ id: 'backup-1', name: 'Quarterly review.yaml', modifiedTime: '2026-09-12T10:00:00.000Z' }], message: 'One backup found.' };
      if (action === 'google-restore') return { snapshot: { title: 'Restored quarterly review', source: 'title: restored' }, message: `Opened ${options.id} as a draft.` };
      throw new Error(`Unexpected action: ${action}`);
    };
  }, localStatus({ google: { configured: true, connected: true } }));

  await openConnections(page);
  await page.locator('[data-connection="google-list"]').click();
  const restore = page.getByRole('button', { name: 'Open Quarterly review.yaml as an unsaved draft' });
  await expect(restore).toBeVisible();
  await restore.click();
  await expect.poll(() => page.evaluate(() => window.__connectionsFixture.applied)).toEqual([{ title: 'Restored quarterly review', source: 'title: restored' }]);
  expect(await page.evaluate(() => ({ calls: window.__connectionCalls, flushes: window.__connectionsFixture.flushes }))).toEqual({
    calls: [{ action: 'status', options: {} }, { action: 'google-list', options: {} }, { action: 'google-restore', options: { id: 'backup-1' } }],
    flushes: 1,
  });

  await page.evaluate(() => {
    window.__connectionHandler = action => action === 'google-backup'
      ? new Promise(resolve => { window.__finishBackup = resolve; })
      : Promise.resolve({ message: 'Unexpected action' });
  });
  await page.locator('[data-connection="google-backup"]').click();
  await expect(page.locator('#connections-controls')).toHaveJSProperty('disabled', true);
  await expect(page.locator('[data-connection="google-backup"]')).toBeDisabled();
  await expect(page.locator('#connections-dialog')).toHaveAttribute('aria-busy', 'true');
  await page.evaluate(() => window.__finishBackup({ message: 'Backup stored.' }));
  await expect(page.locator('#connections-controls')).toHaveJSProperty('disabled', false);
  await expect(page.locator('[data-connection="google-backup"]')).toBeEnabled();
  await expect(page.locator('#connections-dialog')).not.toHaveAttribute('aria-busy');
});

test('a failed action releases controls and a retry can succeed', async ({ page }) => {
  await page.evaluate(status => {
    let attempts = 0;
    window.__connectionHandler = async action => {
      if (action === 'status') return status;
      if (action === 'google-list' && attempts++ === 0) throw new Error('Drive temporarily unavailable.');
      if (action === 'google-list') return { backups: [], message: 'Backups refreshed.' };
      throw new Error(`Unexpected action: ${action}`);
    };
  }, localStatus({ google: { configured: true, connected: true } }));

  await openConnections(page);
  const list = page.locator('[data-connection="google-list"]');
  await list.click();
  await expect(page.locator('#connections-status')).toHaveText('Drive temporarily unavailable.');
  await expect(page.locator('#connections-status')).toHaveClass(/is-error/);
  await expect(page.locator('#connections-controls')).toBeEnabled();
  await list.click();
  await expect(page.locator('#connections-status')).toHaveText('Backups refreshed.');
  await expect(page.locator('#connections-status')).not.toHaveClass(/is-error/);
  expect(await page.evaluate(() => window.__connectionCalls.filter(call => call.action === 'google-list').length)).toBe(2);
});

test('a deployment without a URL remains submitted rather than being reported as failed', async ({ page }) => {
  await page.evaluate(status => {
    window.__connectionHandler = async action => {
      if (action === 'status') return status;
      if (action === 'github-publish') return { publication: { provider: 'github', url: null }, message: 'GitHub Pages deployment submitted.' };
      throw new Error(`Unexpected action: ${action}`);
    };
  }, localStatus({ delivery: { github: { available: true, authenticated: true }, vercel: { available: true, authenticated: false } } }));

  await openConnections(page);
  await page.locator('#share-url').fill('https://previous.example/deck');
  await page.locator('[data-connection="github-publish"]').click();
  await expect(page.locator('#publication-result')).toContainText('Deployment submitted; availability has not been verified.');
  await expect(page.locator('#publication-result')).toContainText('Check the provider dashboard');
  await expect(page.locator('#publication-result a')).toHaveCount(0);
  await expect(page.locator('#share-url')).toHaveValue('');
  await expect(page.locator('#connections-status')).toHaveText('GitHub Pages deployment submitted.');
});

test('sharing rejects a local or otherwise non-public URL before using the clipboard', async ({ page }) => {
  await page.evaluate(() => { window.__connectionHandler = async action => action === 'status' ? { message: 'Ready.' } : { message: 'Unexpected action' }; });
  await openConnections(page);
  await page.locator('#share-url').fill('http://localhost:4173/deck');
  await page.getByRole('button', { name: 'Copy iframe' }).click();
  await expect(page.locator('#connections-status')).toHaveText('Embed and share links must use a public HTTPS URL, never a local address.');
  await expect(page.locator('#connections-status')).toHaveClass(/is-error/);
  await expect(page.locator('#connections-status')).toBeInViewport();
  await expect(page.locator('#close-connections')).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('connections-share-error.png') });
});
