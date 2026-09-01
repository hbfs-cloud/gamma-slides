import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

export function findBrowserExecutable() {
  const configured = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (configured) return configured;

  const candidates = process.platform === 'darwin'
    ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      ]
    : process.platform === 'win32'
      ? [
          `${process.env.PROGRAMFILES || ''}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env['PROGRAMFILES(X86)'] || ''}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
        ]
      : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

  return candidates.find(candidate => candidate && existsSync(candidate)) || undefined;
}

export function launchBrowser(options = {}) {
  const executablePath = options.executablePath || findBrowserExecutable();
  return puppeteer.launch({
    ...options,
    ...(executablePath ? { executablePath } : {}),
  });
}
