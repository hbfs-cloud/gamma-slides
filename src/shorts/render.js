import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {launchBrowser} from '../browser.js';
import {DURATION,fingerprint,loadBatch,metadata,stableAsset} from './cards.js';
import {renderShort} from './template.js';
const run=promisify(execFile);
const here=dirname(fileURLToPath(import.meta.url));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function probe(file) {
 const {stdout}=await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]);
 return JSON.parse(stdout);
}
export function checkMedia(p) {
 const v=p.streams.find(x=>x.codec_type==='video'),a=p.streams.find(x=>x.codec_type==='audio');
 const issues=[];if(!v||v.width!==1080||v.height!==1920||v.codec_name!=='h264')issues.push('video must be H264 1080x1920');
 if(!a||a.codec_name!=='aac')issues.push('AAC audio required');
 const duration=Number(p.format.duration);
 if(duration>=30||Math.abs(duration-DURATION)>.12)issues.push('duration must be 29 seconds, strictly under 30');
 if(Number(v?.nb_frames)!==DURATION*30)issues.push('exactly 870 frames required');
 if(issues.length)throw Error(issues.join('; '));return {duration,width:v.width,height:v.height,frames:Number(v.nb_frames),audio:a.codec_name};
}
export async function renderBatch(opts) {
 const root=resolve(opts.output);await mkdir(root,{recursive:true});
 const all=loadBatch(opts.file),wanted=opts.tickers?.split(',');
 const cards=wanted?all.filter(c=>wanted.includes(c.ticker)):all;
 if(!cards.length)throw Error('No selected cards');
 const index=JSON.parse(await readFile(opts.assets,'utf8'));
 const entries=Array.isArray(index)?index:index.assets||index.items||index;
 const byTicker=Array.isArray(entries)?Object.fromEntries(entries.map(a=>[a.ticker,a])):entries;
 const voice=JSON.parse(await readFile(resolve(opts.voice,'manifest.json'),'utf8'));
 const browser=await launchBrowser({headless:true,executablePath:opts.browser});
 const report=[], failures=[];
 try{
  const page=await browser.newPage();await page.setViewport({width:1080,height:1920,deviceScaleFactor:1});
  const fontPath=resolve(here,'../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2');
  const font=`data:font/woff2;base64,${readFileSync(fontPath).toString('base64')}`;
  for(const card of cards){
   try{
   const a=byTicker[card.ticker];if(!a||a.blocked)throw Error(`${card.ticker}: verified chart and logo required`);
   const chart=resolve(dirname(opts.assets),a.chart||a.chart_path),logo=resolve(dirname(opts.assets),a.logo||a.logo_path);
   if(a.asof!==card.asof)throw Error(`${card.ticker}: chart reference date mismatch`);
   const v=voice.items.find(x=>x.ticker===card.ticker);if(!v)throw Error(`${card.ticker}: voice missing`);
   if(v.text!==card.narration)throw Error(`${card.ticker}: voice text differs from card`);
   if(v.duration>27.8)throw Error(`${card.ticker}: narration too long, shorten text instead of speeding it up`);
   const audio=resolve(opts.voice,v.path);const dir=join(root,card.ticker);await mkdir(dir,{recursive:true});
   const fp=fingerprint(card,[chart,logo,audio,join(here,'template.js'),join(here,'render.js'),join(here,'cards.js'),fontPath],{week:opts.week,asset:stableAsset(a)});
   try{const old=JSON.parse(await readFile(join(dir,'receipt.json'),'utf8'));if(old.fingerprint===fp&&old.passed&&old.videoHash===createHash('sha256').update(await readFile(join(dir,'short.mp4'))).digest('hex')){report.push(old);console.log(JSON.stringify({ticker:card.ticker,cached:true}));continue;}}catch{}
   const html=renderShort(card,{...a,chart,logo},{week:opts.week,font});
   await writeFile(join(dir,'index.html'),html);await writeFile(join(dir,'card.json'),JSON.stringify(card,null,2));
   await writeFile(join(dir,'youtube.json'),JSON.stringify(metadata(card,opts.week),null,2));
   await page.goto(pathToFileURL(join(dir,'index.html')).href,{waitUntil:'networkidle0'});
   await page.evaluate(()=>document.fonts.ready);
   const imageProblems=await page.evaluate(()=>[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.alt));
   if(imageProblems.length)throw Error(`${card.ticker}: missing images ${imageProblems.join(', ')}`);
   for(const [i,seconds] of [0,7,14,22].entries()){
    await page.evaluate(seconds=>{document.querySelectorAll('.panel').forEach(x=>x.style.transition='none');window.shortTime(seconds)},seconds);
    const overflow=await page.evaluate(()=>{
     const panel=document.querySelector('.panel.active');return {body:document.body.scrollWidth>1080||document.body.scrollHeight>1920,panel:panel.scrollHeight>525,children:[...panel.children].filter(x=>x.getBoundingClientRect().bottom>1440).map(x=>x.textContent)};
    });
    if(overflow.body||overflow.panel||overflow.children.length)throw Error(`${card.ticker}: layout overflow ${JSON.stringify(overflow)}`);
    await page.screenshot({path:join(dir,`frame-${i}.png`)});
   }
   const args=['-hide_banner','-loglevel','error','-y','-filter_complex_threads','1'];
   for(let i=0;i<4;i++)args.push('-loop','1','-framerate','30','-t',String([6.45,7.45,8.45,8][i]),'-i',join(dir,`frame-${i}.png`));
   args.push('-i',audio,'-filter_complex',
    '[0:v][1:v]xfade=transition=fade:duration=0.45:offset=6[v1];[v1][2:v]xfade=transition=fade:duration=0.45:offset=13[v2];[v2][3:v]xfade=transition=fade:duration=0.45:offset=21,format=yuv420p[v];[4:a]loudnorm=I=-18:TP=-1.5:LRA=7,adelay=450|450,apad[a]',
    '-map','[v]','-map','[a]','-t',String(DURATION),'-r','30','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','192k','-movflags','+faststart',join(dir,'short.mp4'));
   console.log(JSON.stringify({ticker:card.ticker,encoding:true}));await run('ffmpeg',args,{maxBuffer:1024*1024});
   const media=checkMedia(await probe(join(dir,'short.mp4')));
   await run('ffmpeg',['-v','error','-xerror','-i',join(dir,'short.mp4'),'-f','null','-']);
   const receipt={ticker:card.ticker,passed:true,videoHash:createHash('sha256').update(await readFile(join(dir,'short.mp4'))).digest('hex'),fingerprint:fp,...media,asof:card.asof,source_kind:a.source_kind,source_urls:card.source_urls,voiceDuration:v.duration,createdAt:new Date().toISOString()};
   await writeFile(join(dir,'receipt.json'),JSON.stringify(receipt,null,2));report.push(receipt);
   await writeFile(join(root,'batch-receipt.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ticker:card.ticker,complete:true}));
   }catch(error){if(!opts.keepGoing)throw error;failures.push({ticker:card.ticker,error:error.message});console.error(JSON.stringify(failures.at(-1)));}
  }
 }finally{await browser.close()}
 await writeFile(join(root,'batch-receipt.json'),JSON.stringify(report,null,2));
 await writeFile(join(root,'failures.json'),JSON.stringify(failures,null,2));
 await writeFile(join(root,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Signal Room Shorts</title><style>body{background:#05070a;color:#f3f6f2;font:18px system-ui;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}article{max-width:400px}video{width:100%;aspect-ratio:9/16;background:#000}a{color:#ffb000}p{line-height:1.5}</style><h1>Signal Room · ${escape(opts.week)}</h1><p>${report.length} Shorts · 1080 × 1920 · 29 seconds · English<br>Reference data: ${escape(cards[0].asof)}. Conditional research; entry confidence unconfirmed.</p><main>${report.map(r=>`<article><h2>${escape(r.ticker)}</h2><video controls preload="none" poster="${r.ticker}/frame-0.png" src="${r.ticker}/short.mp4"></video><p><a href="${r.ticker}/short.mp4" download>Download MP4</a> · <a href="${r.ticker}/youtube.json">Metadata</a> · <a href="${r.ticker}/card.json">Source card</a></p></article>`).join('')}</main></html>`);
 if(failures.length)throw Error(`${failures.length} Shorts blocked; see failures.json. Successful exports are retained.`);
 return report;
}
