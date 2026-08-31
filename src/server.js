import express from 'express';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import open from 'open';

export async function servePresentation(opts) {
  const filePath = resolve(opts.file);

  if (!existsSync(filePath)) {
    console.error(chalk.red('✗') + ` Fichier non trouvé: ${filePath}`);
    console.log(chalk.dim('  Générez d\'abord une présentation avec: fipto-slides generate -t <template>'));
    process.exit(1);
  }

  const app = express();
  const port = parseInt(opts.port, 10);

  // Serve the output directory statically
  app.use(express.static(resolve(filePath, '..')));

  // Serve the HTML file at root
  app.get('/', (req, res) => {
    res.sendFile(filePath);
  });

  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('');
    console.log(chalk.hex('#2563EB').bold('  gamma-slides') + chalk.dim(' — Presentation preview'));
    console.log('');
    console.log(`  ${chalk.green('▸')} Local:   ${chalk.bold.cyan(url)}`);
    console.log(`  ${chalk.green('▸')} Fichier: ${chalk.dim(filePath)}`);
    console.log('');
    console.log(chalk.dim('  Reveal.js shortcuts:'));
    console.log(chalk.dim('  [F] Fullscreen  [S] Speaker view  [O] Overview  [ESC] Exit'));
    console.log('');
    console.log(chalk.dim('  Ctrl+C pour arrêter'));
    console.log('');

    open(url);
  });
}
