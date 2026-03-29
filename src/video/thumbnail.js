import puppeteer from 'puppeteer';
import { resolve } from 'path';

export async function generateThumbnail(opts) {
  const { htmlPath, slideIndex = 0, textOverlay, outputPath } = opts;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.waitForFunction(() => typeof Reveal !== 'undefined' && Reveal.isReady(), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate((idx) => Reveal.slide(idx), slideIndex);
  await new Promise(r => setTimeout(r, 800));

  // Add text overlay if requested
  if (textOverlay) {
    await page.evaluate((text) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; bottom: 40px; left: 40px; right: 40px;
        text-align: center; font-size: 48px; font-weight: 900;
        font-family: Inter, system-ui, sans-serif;
        color: white; text-shadow: 0 4px 20px rgba(0,0,0,0.8);
        z-index: 9999; padding: 20px;
        background: linear-gradient(180deg, transparent, rgba(0,0,0,0.7));
        border-radius: 16px;
      `;
      overlay.textContent = text;
      document.body.appendChild(overlay);
    }, textOverlay);
    await new Promise(r => setTimeout(r, 200));
  }

  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();

  return outputPath;
}
