import { google } from 'googleapis';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import open from 'open';

const CONFIG_DIR = resolve(process.env.HOME || '~', '.gamma-slides');
const TOKEN_PATH = resolve(CONFIG_DIR, 'youtube-token.json');
const CREDENTIALS_PATH = resolve(CONFIG_DIR, 'youtube-credentials.json');

export function getCredentialsPath() { return CREDENTIALS_PATH; }
export function getConfigDir() { return CONFIG_DIR; }

export async function getAuthenticatedClient() {
  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `YouTube credentials not found.\n\n` +
      `  1. Go to https://console.cloud.google.com/apis/credentials\n` +
      `  2. Create an OAuth 2.0 Client ID (Desktop app)\n` +
      `  3. Download the JSON and save it to:\n` +
      `     ${CREDENTIALS_PATH}\n` +
      `  4. Enable the YouTube Data API v3 in your project\n\n` +
      `  Then run: gamma-slides youtube-auth`
    );
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web || {};

  if (!client_id || !client_secret) {
    throw new Error('Invalid credentials file. Expected OAuth 2.0 Client ID JSON.');
  }

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:9876');

  // Check for saved token
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
    oauth2Client.setCredentials(token);

    // Refresh if expired
    if (token.expiry_date && Date.now() > token.expiry_date - 60000) {
      try {
        const { credentials: refreshed } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(refreshed);
        writeFileSync(TOKEN_PATH, JSON.stringify(refreshed, null, 2));
      } catch {
        // Token invalid, need re-auth
        return await authorize(oauth2Client);
      }
    }

    return oauth2Client;
  }

  return await authorize(oauth2Client);
}

async function authorize(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
    ],
  });

  console.log('\n  Opening browser for YouTube authorization...\n');

  return new Promise((resolveAuth, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost:9876');
        const code = url.searchParams.get('code');

        if (!code) {
          res.writeHead(400);
          res.end('No authorization code received.');
          return;
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        mkdirSync(CONFIG_DIR, { recursive: true });
        writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0B1120; color: #F1F5F9;">
            <div style="text-align: center;">
              <h1 style="background: linear-gradient(135deg, #2563EB, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Authorized!</h1>
              <p>You can close this tab and return to the terminal.</p>
            </div>
          </body></html>
        `);

        server.close();
        resolveAuth(oauth2Client);
      } catch (err) {
        res.writeHead(500);
        res.end('Authorization failed.');
        server.close();
        reject(err);
      }
    });

    server.listen(9876, () => {
      open(authUrl);
    });
  });
}
