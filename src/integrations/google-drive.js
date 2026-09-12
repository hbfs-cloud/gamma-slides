import { google } from 'googleapis';
import { createServer } from 'http';
import { chmodSync, createReadStream, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { homedir } from 'os';
import { randomBytes } from 'crypto';
import open from 'open';

const CONFIG_DIR = resolve(homedir(), '.gamma-slides');
const CREDENTIALS_PATH = resolve(CONFIG_DIR, 'google-credentials.json');
const TOKEN_PATH = resolve(CONFIG_DIR, 'google-drive-token.json');
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_QUERY = "appProperties has { key='gammaPresenter' and value='true' }";
const SOURCE_EXTENSIONS = new Map([
  ['.yaml', 'application/x-yaml'], ['.yml', 'application/x-yaml'], ['.json', 'application/json'],
  ['.md', 'text/markdown'], ['.markdown', 'text/markdown'],
]);
export const MAX_GOOGLE_DRIVE_BACKUP_BYTES = 10 * 1024 * 1024;
export const GOOGLE_DRIVE_DOWNLOAD_TIMEOUT_MS = 30_000;
export const GOOGLE_DRIVE_CONSENT_TIMEOUT_MS = 5 * 60_000;
const localFs = { chmodSync, createReadStream, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync };

export function googleDrivePaths() { return { configDir: CONFIG_DIR, credentialsPath: CREDENTIALS_PATH, tokenPath: TOKEN_PATH }; }

function secureDirectory({ paths = googleDrivePaths(), fs = localFs } = {}) { fs.mkdirSync(paths.configDir, { recursive: true, mode: 0o700 }); fs.chmodSync(paths.configDir, 0o700); }
function sourceMimeType(name) { return SOURCE_EXTENSIONS.get(extname(String(name || '')).toLowerCase()) || ''; }
function parseJson(value, message) { try { return typeof value === 'string' || Buffer.isBuffer(value) ? JSON.parse(String(value)) : value; } catch { throw new Error(message); } }

/** Validate only the public shape; callers never receive an OAuth secret back. */
export function validateGoogleDriveCredentials(value) {
  const parsed = parseJson(value, 'Invalid Google OAuth credentials. Expected a Desktop OAuth client JSON file.');
  const installed = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed.installed : null;
  if (!installed || typeof installed !== 'object' || typeof installed.client_id !== 'string' || !installed.client_id.trim() || typeof installed.client_secret !== 'string' || !installed.client_secret.trim()) throw new Error('Invalid Google OAuth credentials. Expected a Desktop OAuth client JSON file.');
  return { client_id: installed.client_id, client_secret: installed.client_secret };
}

function credentials({ paths = googleDrivePaths(), fs = localFs, secure = true } = {}) {
  if (!fs.existsSync(paths.credentialsPath)) {
    throw new Error(`Google credentials not found. Create a Desktop OAuth client with the Google Drive API enabled, then save its JSON to ${paths.credentialsPath}. Gamma Presenter will request only Drive file access for its own backups.`);
  }
  if (secure) fs.chmodSync(paths.credentialsPath, 0o600);
  return validateGoogleDriveCredentials(fs.readFileSync(paths.credentialsPath, 'utf8'));
}

function storedToken({ paths = googleDrivePaths(), fs = localFs } = {}) { if (!fs.existsSync(paths.tokenPath)) return null; return parseJson(fs.readFileSync(paths.tokenPath, 'utf8'), 'Invalid local Google Drive token. Disconnect and connect Google Drive again.'); }

/** Local-only status; it deliberately never exposes OAuth or refresh-token values. */
export function googleDriveConnectionStatus({ paths = googleDrivePaths(), fs = localFs, now = Date.now() } = {}) {
  let credentialState = 'missing'; let tokenState = 'missing';
  if (fs.existsSync(paths.credentialsPath)) { try { credentials({ paths, fs, secure: false }); credentialState = 'ready'; } catch { credentialState = 'invalid'; } }
  if (fs.existsSync(paths.tokenPath)) {
    try {
      const token = storedToken({ paths, fs });
      tokenState = token && typeof token === 'object' && (typeof token.refresh_token === 'string' || typeof token.access_token === 'string') ? (Number.isFinite(token.expiry_date) && Number(now) > token.expiry_date - 60_000 ? 'expired' : 'stored') : 'invalid';
    } catch { tokenState = 'invalid'; }
  }
  return { configured: credentialState === 'ready', connected: credentialState === 'ready' && (tokenState === 'stored' || tokenState === 'expired'), needsConsent: tokenState !== 'stored' && tokenState !== 'expired', credentials: credentialState, token: tokenState };
}

/** Persist a user-owned Desktop OAuth client with owner-only file permissions. */
export function importGoogleDriveCredentials({ credentials: input, paths = googleDrivePaths(), fs = localFs } = {}) {
  const incoming = validateGoogleDriveCredentials(input);
  if (fs.existsSync(paths.tokenPath)) {
    let existing = null; try { existing = credentials({ paths, fs, secure: false }); } catch { /* A token without a valid client cannot be safely reassigned. */ }
    if (!existing || existing.client_id !== incoming.client_id) throw new Error('Disconnect Google Drive before replacing its Desktop OAuth client.');
  }
  const parsed = parseJson(input, 'Invalid Google OAuth credentials. Expected a Desktop OAuth client JSON file.');
  secureDirectory({ paths, fs }); fs.writeFileSync(paths.credentialsPath, JSON.stringify(parsed, null, 2), { mode: 0o600 }); fs.chmodSync(paths.credentialsPath, 0o600);
  return googleDriveConnectionStatus({ paths, fs });
}

export async function authorizeGoogleDrive(client, { paths = googleDrivePaths(), fs = localFs, createServerImpl = createServer, openBrowser = open, randomBytesImpl = randomBytes, consentTimeoutMs = GOOGLE_DRIVE_CONSENT_TIMEOUT_MS } = {}) {
  const state = randomBytesImpl(24).toString('base64url');
  const url = client.generateAuthUrl({ access_type: 'offline', scope: [DRIVE_SCOPE], prompt: 'consent', state });
  return new Promise((resolveAuth, reject) => {
    let settled = false; let timeout;
    const settle = (callback, value) => {
      if (settled) return; settled = true; clearTimeout(timeout);
      try { server.close(); } catch { /* The server may already be closed after a callback failure. */ }
      callback(value);
    };
    const fail = error => settle(reject, error);
    const server = createServerImpl(async (request, response) => {
      const rejectCallback = message => { response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }); response.end(message); };
      try {
        const callback = new URL(request.url, 'http://127.0.0.1:9877');
        if (callback.searchParams.get('state') !== state) { rejectCallback('Google authorization state did not match this backup request.'); return; }
        const code = callback.searchParams.get('code');
        if (!code) { rejectCallback('Google did not return an authorization code.'); return; }
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens); secureDirectory({ paths, fs }); fs.writeFileSync(paths.tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 }); fs.chmodSync(paths.tokenPath, 0o600);
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end('<!doctype html><title>Gamma Presenter</title><p>Google Drive backup connected. You can close this window.</p>');
        settle(resolveAuth, client);
      } catch (error) {
        rejectCallback('Google authorization could not complete.'); fail(error);
      }
    });
    server.once('error', fail);
    timeout = setTimeout(() => fail(new Error('Google authorization timed out. Try connecting Google Drive again.')), consentTimeoutMs);
    server.listen(9877, '127.0.0.1', () => { Promise.resolve().then(() => openBrowser(url)).catch(fail); });
  });
}

/** OAuth is user-owned and local. No Google credential or token is put in a deck, repo, or publication. */
export async function authenticatedGoogleDrive({ paths = googleDrivePaths(), fs = localFs, googleApi = google, oauthClient, authorizeClient = authorizeGoogleDrive } = {}) {
  const auth = credentials({ paths, fs });
  const client = oauthClient || new googleApi.auth.OAuth2(auth.client_id, auth.client_secret, 'http://127.0.0.1:9877');
  const token = storedToken({ paths, fs });
  if (token) {
    client.setCredentials(token);
    if (!token.expiry_date || Date.now() <= token.expiry_date - 60_000) return googleApi.drive({ version: 'v3', auth: client });
    try {
      const { credentials: refreshed } = await client.refreshAccessToken(); const persisted = { ...token, ...refreshed, refresh_token: refreshed.refresh_token || token.refresh_token }; client.setCredentials(persisted); secureDirectory({ paths, fs }); fs.writeFileSync(paths.tokenPath, JSON.stringify(persisted, null, 2), { mode: 0o600 }); fs.chmodSync(paths.tokenPath, 0o600);
      return googleApi.drive({ version: 'v3', auth: client });
    } catch { /* Re-consent with the same intentionally narrow scope. */ }
  }
  await authorizeClient(client, { paths, fs });
  return googleApi.drive({ version: 'v3', auth: client });
}

/** Revoke the stored refresh token when possible, then remove the local token. Credentials remain for an explicit future reconnect. */
export async function disconnectGoogleDrive({ revoke = true, paths = googleDrivePaths(), fs = localFs, oauthClient, googleApi = google } = {}) {
  let token = null; try { token = storedToken({ paths, fs }); } catch { /* Corrupt tokens can be cleared locally but cannot be revoked. */ }
  let remoteRevoked = false;
  if (revoke && token?.refresh_token) {
    const client = oauthClient || new googleApi.auth.OAuth2();
    if (typeof client.revokeToken !== 'function') throw new Error('Google OAuth client cannot revoke the stored refresh token.');
    await client.revokeToken(token.refresh_token); remoteRevoked = true;
  }
  if (fs.existsSync(paths.tokenPath)) fs.unlinkSync(paths.tokenPath);
  return { disconnected: true, remoteRevoked, status: googleDriveConnectionStatus({ paths, fs }) };
}

export function backupMetadata(file, now = new Date()) {
  const absolute = resolve(file); const mimeType = sourceMimeType(absolute);
  if (!mimeType) throw new Error('Google Drive backup accepts a presentation source file (.yaml, .yml, .json, .md, or .markdown).');
  return { absolute, name: `Gamma Presenter backup — ${basename(absolute)}`, mimeType, appProperties: { gammaPresenter: 'true', backedUpAt: now.toISOString(), sourceName: basename(absolute) } };
}

function normalizedBackup(file, { maxBytes = MAX_GOOGLE_DRIVE_BACKUP_BYTES } = {}) {
  if (!file || file.appProperties?.gammaPresenter !== 'true') throw new Error('Google Drive file is not a Gamma Presenter source backup.');
  const name = String(file.name || ''); const fallbackMimeType = sourceMimeType(name); const size = Number(file.size);
  if (!fallbackMimeType) throw new Error('Google Drive backup has an unsupported source extension.');
  if (!Number.isSafeInteger(size) || size < 0 || size > maxBytes) throw new Error(`Google Drive backup exceeds the ${maxBytes} byte safety limit.`);
  if (!String(file.id || '').trim()) throw new Error('Google Drive backup is missing its file id.');
  return { id: String(file.id), name, mimeType: file.mimeType || fallbackMimeType, modifiedTime: String(file.modifiedTime || ''), size, webViewLink: String(file.webViewLink || '') };
}

/** List only backups tagged by Gamma Presenter; foreign Drive files are never surfaced. */
export async function listGoogleDriveBackups({ drive, maxBytes = MAX_GOOGLE_DRIVE_BACKUP_BYTES } = {}) {
  const client = drive || await authenticatedGoogleDrive();
  const result = await client.files.list({ q: BACKUP_QUERY, spaces: 'drive', orderBy: 'modifiedTime desc', pageSize: 100, fields: 'files(id,name,mimeType,modifiedTime,size,appProperties,webViewLink)' });
  return (result?.data?.files || []).flatMap(file => { try { return [normalizedBackup(file, { maxBytes })]; } catch { return []; } });
}

async function responseBuffer(stream, maxBytes) {
  if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') throw new Error('Google Drive did not return a downloadable backup stream.');
  const chunks = []; let size = 0;
  try {
    for await (const chunk of stream) {
      const value = Buffer.from(chunk); size += value.length;
      if (size > maxBytes) {
        const error = new Error(`Google Drive backup exceeds the ${maxBytes} byte safety limit.`);
        if (typeof stream.destroy === 'function') stream.destroy(error);
        throw error;
      }
      chunks.push(value);
    }
  } catch (error) {
    if (typeof stream.destroy === 'function' && !stream.destroyed) stream.destroy(error);
    throw error;
  }
  return Buffer.concat(chunks, size);
}

/** Download bytes only. This intentionally does not write, overwrite, or restore a local presentation. */
export async function downloadGoogleDriveBackup({ id, drive, maxBytes = MAX_GOOGLE_DRIVE_BACKUP_BYTES, timeoutMs = GOOGLE_DRIVE_DOWNLOAD_TIMEOUT_MS } = {}) {
  if (!String(id || '').trim()) throw new Error('A Google Drive backup id is required.');
  const client = drive || await authenticatedGoogleDrive();
  const metadataResponse = await client.files.get({ fileId: String(id), fields: 'id,name,mimeType,modifiedTime,size,appProperties,webViewLink' }, { timeout: timeoutMs });
  const backup = normalizedBackup(metadataResponse?.data, { maxBytes });
  const mediaResponse = await client.files.get({ fileId: backup.id, alt: 'media' }, { responseType: 'stream', timeout: timeoutMs });
  const content = await responseBuffer(mediaResponse?.data, maxBytes);
  if (content.length !== backup.size) throw new Error('Google Drive backup size did not match its metadata.');
  return { ...backup, content };
}

export async function backupPresentationToGoogleDrive({ file, drive, now = new Date() }) {
  const metadata = backupMetadata(file, now);
  if (!existsSync(metadata.absolute)) throw new Error(`Presentation source not found: ${metadata.absolute}`);
  const client = drive || await authenticatedGoogleDrive();
  const result = await client.files.create({ requestBody: { name: metadata.name, mimeType: metadata.mimeType, appProperties: metadata.appProperties }, media: { mimeType: metadata.mimeType, body: createReadStream(metadata.absolute) }, fields: 'id,name,webViewLink,modifiedTime' });
  if (!result?.data?.id) throw new Error('Google Drive did not return a backup file id.');
  return { id: result.data.id, name: result.data.name || metadata.name, webViewLink: result.data.webViewLink || '', modifiedTime: result.data.modifiedTime || '', source: metadata.absolute };
}
