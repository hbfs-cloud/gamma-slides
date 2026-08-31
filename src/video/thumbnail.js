import { dirname, resolve } from 'path';
import { pathToFileURL } from 'url';
import { mkdirSync } from 'fs';
import { launchBrowser } from '../browser.js';

export async function generateThumbnail(opts) {
  const { htmlPath, slideIndex = 0, textOverlay, outputPath } = opts;
  const absHtml = resolve(htmlPath);
  const absOutput = resolve(outputPath);
  mkdirSync(dirname(absOutput), { recursive: true });

  const browser = await launchBrowser({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const url = new URL(pathToFileURL(absHtml));
    url.searchParams.set('gamma-export', '1');
    await page.goto(url.href, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.waitForFunction(() => window.__GAMMA_READY__ === true, { timeout: 30_000 });

    await page.evaluate(async index => {
      const count = Reveal.getTotalSlides();
      Reveal.slide(Math.max(0, Math.min(index, count - 1)));
      document.querySelectorAll('.fragment').forEach(fragment => fragment.classList.add('visible'));
      await document.fonts.ready;
      await new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
      window.dispatchEvent(new Event('resize'));
    }, Number(slideIndex) || 0);
    await page.waitForFunction(index => {
      const current = Reveal.getCurrentSlide();
      return Reveal.getIndices(current).h === Math.max(0, Math.min(index, Reveal.getTotalSlides() - 1))
        && Number.parseFloat(getComputedStyle(current).opacity) > 0.99;
    }, { timeout: 5_000 }, Number(slideIndex) || 0);

    if (textOverlay) {
      await page.evaluate(text => {
        const overlay = document.createElement('div');
        overlay.className = 'gamma-thumbnail-overlay';
        overlay.style.cssText = [
          'position:fixed', 'left:92px', 'bottom:84px', 'max-width:1120px',
          'padding:22px 30px', 'border-left:7px solid #2453FF',
          'background:rgba(11,15,23,.92)', 'color:#F7F4EC',
          'font:650 54px/1.04 Instrument Sans,system-ui,sans-serif',
          'letter-spacing:-.045em', 'z-index:9999', 'text-align:left',
        ].join(';');
        overlay.textContent = text;
        document.body.appendChild(overlay);
      }, String(textOverlay));
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(resolveFrame)));
    }

    await page.screenshot({ path: absOutput, type: 'png' });
    return absOutput;
  } finally {
    await browser.close();
  }
}
