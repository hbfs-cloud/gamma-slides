import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import {
  MAX_GOOGLE_DRIVE_BACKUP_BYTES,
  GOOGLE_DRIVE_DOWNLOAD_TIMEOUT_MS,
  authenticatedGoogleDrive,
  authorizeGoogleDrive,
  disconnectGoogleDrive,
  downloadGoogleDriveBackup,
  googleDriveConnectionStatus,
  importGoogleDriveCredentials,
  listGoogleDriveBackups,
  validateGoogleDriveCredentials,
} from '../src/integrations/google-drive.js';

function fixture() {
  const configDir = mkdtempSync(join(tmpdir(), 'gamma-google-drive-status-'));
  return { configDir, credentialsPath: join(configDir, 'google-credentials.json'), tokenPath: join(configDir, 'google-drive-token.json') };
}

function desktopCredentials(secret = 'private-client-secret') {
  return JSON.stringify({ installed: { client_id: 'desktop-client.apps.googleusercontent.com', client_secret: secret, redirect_uris: ['http://localhost'] } });
}

test('Google Drive credential import validates Desktop OAuth JSON, reports local status, and never returns secrets', () => {
  const paths = fixture();
  try {
    assert.deepEqual(googleDriveConnectionStatus({ paths }), { configured: false, connected: false, needsConsent: true, credentials: 'missing', token: 'missing' });
    assert.throws(() => validateGoogleDriveCredentials(JSON.stringify({ web: { client_id: 'web', client_secret: 'secret' } })), /Desktop OAuth/);

    const status = importGoogleDriveCredentials({ credentials: desktopCredentials(), paths });
    assert.deepEqual(status, { configured: true, connected: false, needsConsent: true, credentials: 'ready', token: 'missing' });
    assert.equal(statSync(paths.credentialsPath).mode & 0o777, 0o600);
    assert.match(readFileSync(paths.credentialsPath, 'utf8'), /private-client-secret/);
    assert.doesNotMatch(JSON.stringify(status), /private-client-secret|desktop-client/);

    writeFileSync(paths.tokenPath, JSON.stringify({ refresh_token: 'private-refresh-token', expiry_date: Date.now() + 120_000 })); chmodSync(paths.tokenPath, 0o600);
    const connected = googleDriveConnectionStatus({ paths });
    assert.equal(connected.connected, true);
    assert.equal(connected.token, 'stored');
    assert.doesNotMatch(JSON.stringify(connected), /private-refresh-token/);
    chmodSync(paths.credentialsPath, 0o644);
    googleDriveConnectionStatus({ paths });
    assert.equal(statSync(paths.credentialsPath).mode & 0o777, 0o644, 'status is read-only');
    assert.throws(() => importGoogleDriveCredentials({ credentials: desktopCredentials('replacement-secret').replace('desktop-client', 'other-client'), paths }), /Disconnect Google Drive/);
  } finally { rmSync(paths.configDir, { recursive: true, force: true }); }
});

test('Google Drive disconnect uses an injected OAuth revoker and preserves only local credentials', async () => {
  const paths = fixture(); let revoked = '';
  try {
    importGoogleDriveCredentials({ credentials: desktopCredentials(), paths });
    writeFileSync(paths.tokenPath, JSON.stringify({ refresh_token: 'private-refresh-token' })); chmodSync(paths.tokenPath, 0o600);
    const result = await disconnectGoogleDrive({ paths, oauthClient: { revokeToken: async token => { revoked = token; } } });
    assert.equal(revoked, 'private-refresh-token');
    assert.equal(result.remoteRevoked, true);
    assert.equal(result.status.configured, true);
    assert.equal(result.status.token, 'missing');
    assert.equal(existsSync(paths.tokenPath), false);
    assert.doesNotMatch(JSON.stringify(result), /private-refresh-token/);

    writeFileSync(paths.tokenPath, JSON.stringify({ refresh_token: 'retry-this-token' }));
    await assert.rejects(() => disconnectGoogleDrive({ paths, oauthClient: { revokeToken: async () => { throw new Error('network unavailable'); } } }), /network unavailable/);
    assert.equal(existsSync(paths.tokenPath), true, 'a failed remote revoke keeps the local token available for retry');
  } finally { rmSync(paths.configDir, { recursive: true, force: true }); }
});

test('Google Drive lists only valid source backups tagged by this app through an injected Drive client', async () => {
  let request;
  const backups = await listGoogleDriveBackups({
    drive: { files: { list: async value => {
      request = value;
      return { data: { files: [
        { id: 'ours', name: 'Gamma Presenter backup — board.yaml', mimeType: 'application/x-yaml', modifiedTime: '2026-09-12T08:00:00.000Z', size: '18', appProperties: { gammaPresenter: 'true' } },
        { id: 'foreign', name: 'notes.md', size: '8', appProperties: { gammaPresenter: 'false' } },
        { id: 'media', name: 'recording.mp4', size: '10', appProperties: { gammaPresenter: 'true' } },
      ] } };
    } } },
  });
  assert.match(request.q, /gammaPresenter/);
  assert.match(request.fields, /appProperties/);
  assert.deepEqual(backups, [{ id: 'ours', name: 'Gamma Presenter backup — board.yaml', mimeType: 'application/x-yaml', modifiedTime: '2026-09-12T08:00:00.000Z', size: 18, webViewLink: '' }]);
});

test('Google Drive download validates tagged source metadata and returns bytes without writing a local file', async () => {
  const calls = []; const payload = 'meta:\n  title: Restorable source\n';
  const drive = { files: { get: async (...args) => {
    calls.push(args);
    if (args[0].alt === 'media') return { data: Readable.from([Buffer.from(payload)]) };
    return { data: { id: 'ours', name: 'Gamma Presenter backup — board.yaml', size: String(Buffer.byteLength(payload)), appProperties: { gammaPresenter: 'true' }, modifiedTime: '2026-09-12T08:00:00.000Z' } };
  } } };
  const backup = await downloadGoogleDriveBackup({ id: 'ours', drive });
  assert.equal(backup.content.toString(), payload);
  assert.equal(backup.name, 'Gamma Presenter backup — board.yaml');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0][1], { timeout: GOOGLE_DRIVE_DOWNLOAD_TIMEOUT_MS });
  assert.deepEqual(calls[1][1], { responseType: 'stream', timeout: GOOGLE_DRIVE_DOWNLOAD_TIMEOUT_MS });

  await assert.rejects(() => downloadGoogleDriveBackup({
    id: 'too-large', maxBytes: 10,
    drive: { files: { get: async () => ({ data: { id: 'too-large', name: 'board.yaml', size: String(MAX_GOOGLE_DRIVE_BACKUP_BYTES), appProperties: { gammaPresenter: 'true' } } }) } },
  }), /safety limit/);

  await assert.rejects(() => downloadGoogleDriveBackup({
    id: 'truncated',
    drive: { files: { get: async (...args) => args[0].alt === 'media'
      ? { data: Readable.from([Buffer.from('short')]) }
      : { data: { id: 'truncated', name: 'board.yaml', size: '6', appProperties: { gammaPresenter: 'true' } } } } },
  }), /size did not match/);

  let destroyed = false;
  const overflow = Readable.from([Buffer.from('abc'), Buffer.from('def')]);
  const destroy = overflow.destroy.bind(overflow);
  overflow.destroy = error => { destroyed = true; return destroy(error); };
  await assert.rejects(() => downloadGoogleDriveBackup({
    id: 'overflow', maxBytes: 4,
    drive: { files: { get: async (...args) => args[0].alt === 'media'
      ? { data: overflow }
      : { data: { id: 'overflow', name: 'board.yaml', size: '4', appProperties: { gammaPresenter: 'true' } } } } },
  }), /safety limit/);
  assert.equal(destroyed, true, 'overflow destroys the response stream instead of continuing to buffer it');
});

test('Google Drive authorization cleans up on opener failure and keeps listening after a wrong callback state', async () => {
  let server; let closes = 0;
  const createServerImpl = handler => (server = {
    handler,
    once: () => {},
    listen: (_port, _host, callback) => callback(),
    close: callback => { closes += 1; callback?.(); },
  });
  const client = { generateAuthUrl: () => 'https://accounts.example.test/authorize', getToken: async () => ({ tokens: { refresh_token: 'test-token' } }), setCredentials: () => {} };
  await assert.rejects(() => authorizeGoogleDrive(client, { createServerImpl, openBrowser: async () => { throw new Error('opener unavailable'); }, consentTimeoutMs: 50 }), /opener unavailable/);
  assert.equal(closes, 1);
  closes = 0;
  await assert.rejects(() => authorizeGoogleDrive(client, { createServerImpl, openBrowser: async () => {}, consentTimeoutMs: 5 }), /timed out/);
  assert.equal(closes, 1, 'abandoned consent closes the loopback server');

  const paths = fixture(); closes = 0;
  try {
    const authorize = authorizeGoogleDrive(client, {
      paths, createServerImpl, openBrowser: async () => {}, consentTimeoutMs: 100,
      randomBytesImpl: () => ({ toString: () => 'expected-state' }),
    });
    await new Promise(resolve => setImmediate(resolve));
    const rejected = { status: 0, writeHead(status) { this.status = status; }, end() {} };
    await server.handler({ url: '/?state=wrong&code=ignored' }, rejected);
    assert.equal(rejected.status, 400);
    assert.equal(closes, 0, 'a wrong state must not cancel a valid pending consent flow');
    const accepted = { status: 0, writeHead(status) { this.status = status; }, end() {} };
    await server.handler({ url: '/?state=expected-state&code=accepted' }, accepted);
    await authorize;
    assert.equal(accepted.status, 200);
    assert.equal(closes, 1);
  } finally { rmSync(paths.configDir, { recursive: true, force: true }); }
});

test('Google Drive refresh preserves the original refresh token when Google omits it', async () => {
  const paths = fixture(); const saved = [];
  try {
    importGoogleDriveCredentials({ credentials: desktopCredentials(), paths });
    writeFileSync(paths.tokenPath, JSON.stringify({ refresh_token: 'retain-me', access_token: 'old', expiry_date: 0 }));
    const oauthClient = { setCredentials: value => saved.push(value), refreshAccessToken: async () => ({ credentials: { access_token: 'new', expiry_date: Date.now() + 60_000 } }) };
    const drive = await authenticatedGoogleDrive({ paths, oauthClient, googleApi: { drive: options => ({ options }) }, authorizeClient: async () => assert.fail('refresh should not require consent') });
    assert.equal(drive.options.auth, oauthClient);
    assert.equal(JSON.parse(readFileSync(paths.tokenPath, 'utf8')).refresh_token, 'retain-me');
    assert.equal(saved.at(-1).refresh_token, 'retain-me');
  } finally { rmSync(paths.configDir, { recursive: true, force: true }); }
});
