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
  .description(chalk.hex('#6C5CE7')('Fipto Slides') + ' — accounting presentation generator')
  .version('1.0.0');

program
  .command('generate')
  .alias('g')
  .description('Generate a presentation')
  .requiredOption('-t, --template <name>', 'Template: fec, consolidation, revenue-model')
  .option('-o, --output <path>', 'Output file', './output/presentation.html')
  .option('-d, --data <path>', 'JSON data file (optional)')
  .option('--title <title>', 'Custom title')
  .option('--theme <theme>', 'Theme: fipto (default), dark, light', 'fipto')
  .action(async (opts) => {
    try {
      const result = await generatePresentation(opts);
      console.log(chalk.green('✓') + ` Presentation generated: ${chalk.bold(result.outputPath)}`);
      console.log(chalk.dim(`  ${result.slideCount} slides • template: ${opts.template} • theme: ${opts.theme}`));
    } catch (err) {
      console.error(chalk.red('✗') + ` Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('serve')
  .alias('s')
  .description('Run a local preview server')
  .option('-f, --file <path>', 'HTML file to serve', './output/presentation.html')
  .option('-p, --port <port>', 'Port', '3000')
  .action(async (opts) => {
    await servePresentation(opts);
  });

program
  .command('export')
  .alias('e')
  .description('Export to PDF')
  .option('-f, --file <path>', 'Source HTML file', './output/presentation.html')
  .option('-o, --output <path>', 'Output PDF file', './output/presentation.pdf')
  .action(async (opts) => {
    try {
      await exportPDF(opts);
      console.log(chalk.green('✓') + ` PDF exported: ${chalk.bold(opts.output)}`);
    } catch (err) {
      console.error(chalk.red('✗') + ` Export error: ${err.message}`);
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
  .description('List available templates')
  .action(() => {
    listTemplates();
  });

program.parse();
