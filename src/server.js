import {browserHandler} from './repository/browser.js';
import {terminalHandler} from './repository/terminal.js';
import express from 'express';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import open from 'open';

export async function servePresentation(opts) {
  const filePath = resolve(opts.file);

  if (!existsSync(filePath)) {
    console.error(chalk.red('✗') + ` File not found: ${filePath}`);
    console.log(chalk.dim('  Generate a presentation first with: gamma-slides generate -t <template>'));
    process.exit(1);
  }

  const app = express();
  const port = parseInt(opts.port, 10);

  const web=browserHandler({enabled:Boolean(opts.browser)}),shell=terminalHandler({enabled:Boolean(opts.terminal)});
  app.use(async(req,res,next)=>{if(!await web(req,res,req.path)&&!await shell(req,res,req.path))next();});
  // Serve the output directory statically
  app.use(express.static(resolve(filePath, '..'), {index:false}));

  // Serve the HTML file at root
  app.get('/', (req, res) => {
    res.sendFile(filePath);
  });

  const server=app.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log('');
    console.log(chalk.hex('#2563EB').bold('  gamma-slides') + chalk.dim(' — Presentation preview'));
    console.log('');
    console.log(`  ${chalk.green('▸')} Local:   ${chalk.bold.cyan(url)}`);
    console.log(`  ${chalk.green('▸')} Fichier: ${chalk.dim(filePath)}`);
    console.log('');
    console.log(chalk.dim('  Reveal.js shortcuts:'));
    console.log(chalk.dim('  [F] Fullscreen  [S] Speaker view  [O] Overview  [ESC] Exit'));
    console.log('');
    console.log(chalk.dim('  Ctrl+C to stop'));
    console.log('');

    if(opts.open!==false)open(url);
  });
  server.on('close',()=>web.close());
  return server;
}
