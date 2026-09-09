import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { escapeHtml } from '../src/engine/html.js';
import { embeddedFontCSS } from '../src/engine/runtime-assets.js';
import { getTheme } from '../src/themes/index.js';

const directory = resolve('output/flagship-review');
const read = name => JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
const desktop = read('desktop-manifest.json');
const mobile = read('mobile-manifest.json');
const cards = desktop.slides.map((slide, index) => {
  const phone = mobile.slides[index];
  const capture = (name, label) => `<a href="${escapeHtml(name)}" target="_blank" rel="noopener"><img loading="lazy" src="${escapeHtml(name)}" alt="${escapeHtml(label)}"><span>${escapeHtml(label)}</span></a>`;
  return `<article><h2><span>${String(index + 1).padStart(2, '0')}</span> ${escapeHtml(slide.title)}</h2><div class="pair">${capture(slide.captures[0], 'Desktop')}${capture(phone.captures[0], 'Mobile — début')}</div>${phone.captures.length > 1 ? `<details><summary>Suite mobile · ${phone.captures.length - 1} capture(s)</summary><div class="continuation">${phone.captures.slice(1).map((name, index) => capture(name, `Mobile — partie ${index + 2}`)).join('')}</div></details>` : ''}</article>`;
}).join('');

writeFileSync(resolve(directory, 'index.html'), `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revue visuelle · Flagship</title><style>${embeddedFontCSS(getTheme('signal-room'))}
:root{color-scheme:dark;font-family:Archivo,system-ui,sans-serif;color:#F3F6F2;background:#05070A}*{box-sizing:border-box}body{margin:0 auto;max-width:1600px;padding:32px}header{max-width:850px;margin-bottom:48px}h1{font-size:32px;letter-spacing:-.025em}p{color:#A3ADB8;line-height:1.6}a{color:#8BA8FF;text-underline-offset:4px}nav{display:flex;gap:24px;flex-wrap:wrap}main{display:grid;grid-template-columns:1fr 1fr;gap:40px}article{border-top:1px solid #26313D;padding-top:16px;min-width:0}h2{font-size:16px;line-height:1.4;min-height:44px;margin:0 0 16px}h2>span{color:#FFB000;margin-right:12px}.pair{display:grid;grid-template-columns:3fr 1fr;gap:12px;align-items:start}article a{display:block;font-size:12px}article img{display:block;width:100%;height:auto;margin-bottom:12px}summary{cursor:pointer;min-height:44px;padding:16px 0;font-size:12px;color:#A3ADB8}.continuation{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.scene{display:grid;grid-template-columns:3fr 1fr;gap:24px;margin:48px 0}.scene img{width:100%}.scene a{min-width:0}a:focus-visible,summary:focus-visible{outline:2px solid #FFB000;outline-offset:4px}@media(max-width:800px){body{padding:20px}main{grid-template-columns:1fr}.scene{grid-template-columns:2fr 1fr}}
</style><header><h1>38 slides, examinées en desktop et mobile.</h1><p>Captures réelles du fichier HTML ouvert localement dans Chrome : desktop 1440 × 900, mobile tactile 390 × 844 à DPR 2. Les parties mobiles sous le pli sont accessibles sous chaque slide. Cliquer sur une image ouvre le fichier original.</p><nav><a href="../flagship-demo.html">Ouvrir la présentation</a><a href="desktop-manifest.json">Contrôles desktop</a><a href="mobile-manifest.json">Contrôles mobile</a><a href="gpu-manifest.json">Preuves GPU</a></nav><p>Les vérifications techniques portent sur les valeurs, le rendu, les contrastes, la navigation et les débordements. Elles ne constituent pas une note esthétique.</p></header><main>${cards}</main><section><h1>Exploration Three.js — croissance, multiple et marge</h1><div class="scene"><a href="desktop-3d-21.png"><img src="desktop-3d-21.png" alt="Exploration Three.js desktop"></a><a href="mobile-3d-21.png"><img src="mobile-3d-21.png" alt="Exploration Three.js mobile"></a></div></section></html>`);
console.log(resolve(directory, 'index.html'));
