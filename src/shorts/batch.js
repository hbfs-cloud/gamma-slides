/** One-command, resumable local production from a reviewed configuration. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {loadBatch} from './cards.js';
import {renderBatch} from './render.js';
export async function produceBatch(configFile){
 const root=dirname(resolve(configFile)),c=JSON.parse(readFileSync(configFile,'utf8'));
 for(const key of ['file','assets','voice','voiceProfile','model','python','browser','output']){
  if(typeof c[key]!=='string'||!c[key])throw Error(`Configuration requires ${key}`);
  c[key]=resolve(root,c[key]);
 }
 if(!c.week)throw Error('Configuration requires a weekly label');
 loadBatch(c.file);
 for(const key of ['assets','voiceProfile','model','python','browser'])if(!existsSync(c[key]))throw Error(`Missing ${key}: ${c[key]}`);
 const args=[resolve(dirname(fileURLToPath(import.meta.url)),'voice.py'),'--file',c.file,'--output',c.voice,'--model',c.model,'--profile',c.voiceProfile];
 if(c.tickers)args.push('--tickers',c.tickers);
 await new Promise((ok,fail)=>{const p=spawn(c.python,args,{stdio:'inherit'});p.on('error',fail);p.on('exit',code=>code===0?ok():fail(Error(`Voice stage exited ${code}`)));});
 return renderBatch({...c,keepGoing:true});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv[2])throw Error('Usage: node src/shorts/batch.js batch-config.json');
 try{const r=await produceBatch(process.argv[2]);console.log(JSON.stringify({complete:true,shorts:r.length}));}catch(e){console.error(e.message);process.exitCode=1;}
}
