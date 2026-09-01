import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { launchBrowser } from '../browser.js';

export async function exportPDF(opts) {
  const filePath = resolve(opts.file);
  const defaultOutput = /\.html?$/i.test(opts.file)
    ? opts.file.replace(/\.html?$/i, '.pdf')
    : `${opts.file}.pdf`;
  const outputPath = resolve(opts.output || defaultOutput);

  if (!existsSync(filePath)) {
    throw new Error(`Fichier source non trouvé: ${filePath}`);
  }

  const spinner = ora({
    text: 'Lancement du navigateur...',
    color: 'magenta'
  }).start();

  const browser = await launchBrowser({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    spinner.text = 'Chargement de la présentation...';

    // Use print-pdf query param for Reveal.js
    const fileUrl = new URL(pathToFileURL(filePath));
    fileUrl.searchParams.set('print-pdf', '1');
    fileUrl.searchParams.set('gamma-export', '1');
    if (opts.theme) fileUrl.searchParams.set('theme', String(opts.theme).toLowerCase());
    await page.goto(fileUrl.href, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for Reveal.js to initialize
    await page.waitForFunction(() => {
      return typeof Reveal !== 'undefined' && Reveal.isReady() && window.__GAMMA_READY__ === true;
    }, { timeout: 30000 });

    spinner.text = 'Génération du PDF...';

    await page.pdf({
      path: outputPath,
      width: '1280px',
      height: '720px',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    spinner.succeed(chalk.green('PDF généré avec succès'));
  } finally {
    await browser.close();
  }

  return outputPath;
}
