import puppeteer from 'puppeteer';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

export async function exportPDF(opts) {
  const filePath = resolve(opts.file);
  const outputPath = resolve(opts.output);

  if (!existsSync(filePath)) {
    throw new Error(`Fichier source non trouvé: ${filePath}`);
  }

  const spinner = ora({
    text: 'Lancement du navigateur...',
    color: 'magenta'
  }).start();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();

    spinner.text = 'Chargement de la présentation...';

    // Use print-pdf query param for Reveal.js
    const fileUrl = `file://${filePath}?print-pdf`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for Reveal.js to initialize
    await page.waitForFunction(() => {
      return typeof Reveal !== 'undefined' && Reveal.isReady();
    }, { timeout: 10000 });

    // Wait a bit for charts to render
    await new Promise(r => setTimeout(r, 2000));

    spinner.text = 'Génération du PDF...';

    await page.pdf({
      path: outputPath,
      width: '1280px',
      height: '720px',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    spinner.succeed(chalk.green('PDF généré avec succès'));
  } finally {
    await browser.close();
  }
}
