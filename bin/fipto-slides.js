#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { generatePresentation } from '../src/generator.js';
import { servePresentation } from '../src/server.js';
import { exportPDF } from '../src/export/pdf.js';
import { listTemplates } from '../src/templates/index.js';
import { generateVideo } from '../src/video/generate.js';

const program = new Command();

program
  .name('fipto-slides')
  .description(chalk.hex('#6C5CE7')('Fipto Slides') + ' — Générateur de présentations comptables')
  .version('1.0.0');

program
  .command('generate')
  .alias('g')
  .description('Générer une présentation')
  .requiredOption('-t, --template <name>', 'Template: fec, consolidation, revenue-model')
  .option('-o, --output <path>', 'Fichier de sortie', './output/presentation.html')
  .option('-d, --data <path>', 'Fichier de données JSON (optionnel)')
  .option('--title <title>', 'Titre personnalisé')
  .option('--theme <theme>', 'Thème: fipto (default), dark, light', 'fipto')
  .action(async (opts) => {
    try {
      const result = await generatePresentation(opts);
      console.log(chalk.green('✓') + ` Présentation générée: ${chalk.bold(result.outputPath)}`);
      console.log(chalk.dim(`  ${result.slideCount} slides • template: ${opts.template} • thème: ${opts.theme}`));
    } catch (err) {
      console.error(chalk.red('✗') + ` Erreur: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('serve')
  .alias('s')
  .description('Lancer un serveur local pour prévisualiser')
  .option('-f, --file <path>', 'Fichier HTML à servir', './output/presentation.html')
  .option('-p, --port <port>', 'Port', '3000')
  .action(async (opts) => {
    await servePresentation(opts);
  });

program
  .command('export')
  .alias('e')
  .description('Exporter en PDF')
  .option('-f, --file <path>', 'Fichier HTML source', './output/presentation.html')
  .option('-o, --output <path>', 'Fichier PDF de sortie', './output/presentation.pdf')
  .action(async (opts) => {
    try {
      await exportPDF(opts);
      console.log(chalk.green('✓') + ` PDF exporté: ${chalk.bold(opts.output)}`);
    } catch (err) {
      console.error(chalk.red('✗') + ` Erreur export: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('video')
  .alias('v')
  .description('Generate a narrated video from a presentation')
  .requiredOption('-t, --template <name>', 'Template: fec, consolidation, revenue-model')
  .option('-f, --file <path>', 'Source HTML file (auto-detected from template if omitted)')
  .option('-o, --output <path>', 'Output video file', './output/presentation.mp4')
  .action(async (opts) => {
    try {
      const file = opts.file || `./output/${opts.template}.html`;
      const output = opts.output === './output/presentation.mp4'
        ? `./output/${opts.template}.mp4`
        : opts.output;
      const result = await generateVideo({ template: opts.template, file, output });
      console.log('');
      console.log(chalk.green('✓') + ` Video generated: ${chalk.bold(result.outputPath)}`);
      console.log(chalk.dim(`  ${result.slides} slides • ${result.duration.toFixed(0)}s • ${result.outputPath}`));
    } catch (err) {
      console.error(chalk.red('✗') + ` Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('Lister les templates disponibles')
  .action(() => {
    listTemplates();
  });

program.parse();
