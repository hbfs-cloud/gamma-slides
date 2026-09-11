import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

export function findBrowserExecutable() {
  const configured = process.env.GAMMA_BROWSER_EXECUTABLE || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (configured) return configured;

  const candidates = process.platform === 'darwin'
    // Do not launch a user's primary browser implicitly on macOS. Apart from
    // surprising the user, a broken Chrome / LaunchServices installation can
    // abort before Puppeteer receives an error and leave callers retrying it.
    ? []
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
  if (!executablePath) {
    throw new Error(
      process.platform === 'darwin'
        ? 'No isolated browser is configured. Set GAMMA_BROWSER_EXECUTABLE (or PUPPETEER_EXECUTABLE_PATH) to a compatible Chromium executable.'
        : 'No compatible Chromium executable was found. Set GAMMA_BROWSER_EXECUTABLE (or PUPPETEER_EXECUTABLE_PATH).',
    );
  }
  return puppeteer.launch({
    ...options,
    ...(executablePath ? { executablePath } : {}),
  });
}
