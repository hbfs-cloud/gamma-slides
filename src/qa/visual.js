import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, extname, join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { launchBrowser } from '../browser.js';

function slugFromPath(filePath) {
  return basename(filePath, extname(filePath)).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
}

export async function runVisualQA(opts) {
  const filePath = resolve(opts.file);
  if (!existsSync(filePath)) throw new Error(`Presentation not found: ${filePath}`);
  const width = Number(opts.width || 1280);
  const height = Number(opts.height || 720);
  const dpr = Number(opts.dpr || 1);
  const live = opts.live === true;
  const outputDir = resolve(opts.output || join('output', `${slugFromPath(filePath)}-qa`));
  mkdirSync(outputDir, { recursive: true });

  const browser = await launchBrowser({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const errors = [];
  const consoleWarnings = [];
  const failedRequests = [];

  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
      if (message.type() === 'warning') consoleWarnings.push(message.text());
    });
    page.on('requestfailed', request => failedRequests.push(`${request.url()} · ${request.failure()?.errorText || 'failed'}`));
    await page.setViewport({ width, height, deviceScaleFactor: dpr });
    const presentationUrl = new URL(pathToFileURL(filePath));
    if (!live) presentationUrl.searchParams.set('gamma-export', '1');
    await page.goto(presentationUrl.href, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.waitForFunction(() => window.__GAMMA_READY__ === true, { timeout: 30_000 });

    let studio = null;
    if (live) {
      studio = await page.evaluate(() => {
        const dialog = document.querySelector('[data-gamma-studio], #gamma-studio-wizard, .gamma-studio-wizard, [role="dialog"]');
        return {
          present: Boolean(dialog),
          visible: Boolean(dialog && getComputedStyle(dialog).display !== 'none' && getComputedStyle(dialog).visibility !== 'hidden'),
          text: dialog?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 500) || '',
        };
      });
      const skip = await page.$('[data-studio-action="skip"], [data-action="skip"], .gamma-studio-skip, [data-gamma-skip]');
      if (skip) await skip.click();
      else await page.keyboard.press('Escape');
    }

    const slideCount = await page.evaluate(() => Reveal.getTotalSlides());
    const slides = [];
    for (let index = 0; index < slideCount; index++) {
      await page.evaluate(async slideIndex => {
        Reveal.slide(slideIndex);
        document.querySelectorAll('.fragment').forEach(fragment => fragment.classList.add('visible'));
        document.getAnimations().forEach(animation => {
          try { animation.finish(); } catch (_) {}
        });
        window.dispatchEvent(new Event('resize'));
        await document.fonts.ready;
        await new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
      }, index);
      await page.waitForFunction(slideIndex => {
        const current = Reveal.getCurrentSlide();
        return Reveal.getIndices(current).h === slideIndex && Number.parseFloat(getComputedStyle(current).opacity) > 0.99;
      }, { timeout: 5_000 }, index);
      if (live && await page.$('section.present [id^="chart_"]')) {
        await page.evaluate(() => new Promise(resolveSettle => setTimeout(resolveSettle, 900)));
      }

      const audit = await page.evaluate(({ viewportWidth, viewportHeight }) => {
        const slide = Reveal.getCurrentSlide();
        const rect = element => {
          const value = element.getBoundingClientRect();
          return { x: value.x, y: value.y, width: value.width, height: value.height, top: value.top, right: value.right, bottom: value.bottom, left: value.left };
        };
        const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const overlapArea = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
          * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const visible = element => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && bounds.width > 0 && bounds.height > 0;
        };

        const slideRect = rect(slide);
        const source = slide.querySelector(':scope > .slide-source');
        const sourceRect = source && visible(source) ? rect(source) : null;
        const contentRects = [...slide.children]
          .filter(element => !element.matches('.slide-source,.notes') && visible(element))
          .map(element => ({ node: element.className || element.tagName, bounds: rect(element) }));
        const sourceOverlaps = sourceRect
          ? contentRects.filter(item => intersects(sourceRect, item.bounds)).map(item => item.node)
          : [];
        const semanticOverlapPairs = [
          ['.cover-strip', '.cover-content'],
          ['.cover-strip', '.cover-index'],
        ];
        const semanticOverlaps = semanticOverlapPairs.flatMap(([firstSelector, secondSelector]) => {
          const first = slide.querySelector(firstSelector);
          const second = slide.querySelector(secondSelector);
          if (!first || !second || !visible(first) || !visible(second)) return [];
          return overlapArea(rect(first), rect(second)) > 16 ? [`${firstSelector} / ${secondSelector}`] : [];
        });
        const footer = document.querySelector('.footer-bar');
        const footerRect = footer && visible(footer) ? rect(footer) : null;

        const clipped = [...slide.querySelectorAll('*')].filter(element => {
          if (!visible(element) || element.closest('.notes')) return false;
          const bounds = element.getBoundingClientRect();
          return bounds.left < -1 || bounds.right > viewportWidth + 1 || bounds.top < -1 || bounds.bottom > viewportHeight + 1;
        }).slice(0, 20).map(element => element.className || element.tagName);

        const internalOverflow = [...slide.querySelectorAll('*')].filter(element => {
          if (!visible(element) || element.closest('.notes') || element.tagName === 'CANVAS') return false;
          const style = getComputedStyle(element);
          const clippedOverflow = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflow)
            || ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)
            || ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY);
          return clippedOverflow && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
        }).slice(0, 20).map(element => ({ node: element.className || element.tagName, client: [element.clientWidth, element.clientHeight], scroll: [element.scrollWidth, element.scrollHeight] }));

        const heading = slide.querySelector('h1,h2');
        const headingStyle = heading ? getComputedStyle(heading) : null;
        const revealScale = slide.offsetWidth ? slide.getBoundingClientRect().width / slide.offsetWidth : 1;
        const headingLines = heading && headingStyle ? Math.round(heading.getBoundingClientRect().height / (Number.parseFloat(headingStyle.lineHeight) * revealScale)) : 0;
        const canvases = [...slide.querySelectorAll('canvas')].map(canvas => ({ css: [canvas.clientWidth, canvas.clientHeight], backing: [canvas.width, canvas.height] }));
        const charts = [...slide.querySelectorAll('[id^="chart_"]')].map(chart => {
          const bounds = chart.getBoundingClientRect();
          const svg = chart.querySelector('svg');
          const canvas = chart.querySelector('canvas');
          const shapeCount = svg?.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon').length || 0;
          return {
            id: chart.id,
            size: [Math.round(bounds.width), Math.round(bounds.height)],
            renderer: svg ? 'svg' : canvas ? 'canvas' : 'missing',
            shapeCount,
            accessible: Boolean(chart.querySelector('[aria-label]') || chart.getAttribute('aria-label')),
          };
        });
        const badTokens = (slide.innerText.match(/\b(?:NaN|undefined|null)\b/g) || []);

        return {
          title: heading?.textContent?.trim() || `Slide ${Reveal.getIndices(slide).h + 1}`,
          layout: slide.dataset.layout,
          variant: slide.dataset.variant,
          slideRect,
          sourceRect,
          sourceOverlaps,
          semanticOverlaps,
          footerOverlap: footerRect ? contentRects.filter(item => intersects(footerRect, item.bounds)).map(item => item.node) : [],
          clipped,
          internalOverflow,
          badTokens,
          headingLines,
          fonts: {
            body: getComputedStyle(slide).fontFamily,
            heading: headingStyle?.fontFamily || null,
          },
          canvases,
          charts,
        };
      }, { viewportWidth: width, viewportHeight: height });

      const number = String(index + 1).padStart(2, '0');
      const screenshot = join(outputDir, `slide-${number}.png`);
      await page.screenshot({ path: screenshot, type: 'png' });
      slides.push({ index: index + 1, screenshot, ...audit });
    }

    const blockers = [];
    const warnings = [];
    for (const slide of slides) {
      if (slide.sourceOverlaps.length) blockers.push(`Slide ${slide.index}: source overlaps ${slide.sourceOverlaps.join(', ')}`);
      if (slide.semanticOverlaps.length) blockers.push(`Slide ${slide.index}: semantic regions overlap (${slide.semanticOverlaps.join(', ')})`);
      if (slide.footerOverlap.length) blockers.push(`Slide ${slide.index}: content overlaps footer`);
      if (slide.clipped.length) blockers.push(`Slide ${slide.index}: content outside viewport (${slide.clipped.join(', ')})`);
      if (slide.internalOverflow.length) blockers.push(`Slide ${slide.index}: clipped internal overflow`);
      if (slide.badTokens.length) blockers.push(`Slide ${slide.index}: invalid data token ${slide.badTokens.join(', ')}`);
      const headlineLimit = slide.variant === 'story' ? 6 : ['title', 'closing'].includes(slide.layout) ? 3 : 2;
      if (slide.headingLines > headlineLimit) warnings.push(`Slide ${slide.index}: headline uses ${slide.headingLines} lines (limit ${headlineLimit})`);
      for (const canvas of slide.canvases) {
        if (canvas.backing[0] + 1 < canvas.css[0] * dpr || canvas.backing[1] + 1 < canvas.css[1] * dpr) {
          warnings.push(`Slide ${slide.index}: chart canvas backing store is below DPR`);
        }
      }
      for (const chart of slide.charts) {
        if (chart.size[0] < 8 || chart.size[1] < 8) blockers.push(`Slide ${slide.index}: chart ${chart.id} has zero layout (${chart.size.join('×')})`);
        if (chart.renderer === 'missing') blockers.push(`Slide ${slide.index}: chart ${chart.id} has no renderer`);
        if (chart.renderer === 'svg' && chart.shapeCount === 0) blockers.push(`Slide ${slide.index}: chart ${chart.id} rendered an empty SVG`);
      }
    }
    errors.forEach(error => blockers.push(`Browser: ${error}`));
    consoleWarnings.filter(warning => /chart init error/i.test(warning)).forEach(warning => blockers.push(`Browser warning: ${warning}`));
    failedRequests.forEach(request => warnings.push(`Network: ${request}`));

    const contactHtml = `<!doctype html><style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#090d14;color:#dce2eb;font:12px system-ui}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.cell{background:#141b27;padding:7px}.cell img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.label{padding:7px 2px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style><div class="grid">${slides.map(slide => `<div class="cell"><img src="data:image/png;base64,${readFileSync(slide.screenshot).toString('base64')}"><div class="label">${slide.index}. ${slide.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</div></div>`).join('')}</div>`;
    const contactPage = await browser.newPage();
    await contactPage.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await contactPage.setContent(contactHtml, { waitUntil: 'load' });
    const contactSheet = join(outputDir, 'contact-sheet.png');
    await contactPage.screenshot({ path: contactSheet, type: 'png', fullPage: true });

    const report = {
      source: filePath,
      generatedAt: new Date().toISOString(),
      viewport: { width, height, dpr },
      mode: live ? 'live' : 'export',
      studio,
      slideCount,
      blockers,
      warnings,
      errors,
      consoleWarnings,
      failedRequests,
      slides,
      contactSheet,
      passed: blockers.length === 0,
    };
    const reportPath = join(outputDir, 'report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    return { ...report, reportPath, outputDir };
  } finally {
    await browser.close();
  }
}
