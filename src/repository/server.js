import { terminalHandler } from './terminal.js';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServer } from 'node:http';

/** Only expose the generated HTML and redacted receipt, never the author workspace or repository. */
export async function serveRepositoryPresentation(directory,{port=4173,terminal=false,cwd=process.cwd()}={}) {
  const root=resolve(directory),files=new Map([['/','index.html'],['/index.html','index.html'],['/proof.json','proof.json']]);
  if(!Number.isInteger(Number(port))||Number(port)<0||Number(port)>65535)throw new Error('Port must be an integer between 0 and 65535.');
  const shell=terminalHandler({enabled:terminal,cwd});
  const server=createServer(async(request,response)=>{
    const path=new URL(request.url,'http://localhost').pathname,file=files.get(path);
    if(await shell(request,response,path))return;
    if(!file||!['GET','HEAD'].includes(request.method)){response.writeHead(404);response.end('Not found');return;}
    try{const content=readFileSync(join(root,file));response.writeHead(200,{'Content-Type':file.endsWith('.json')?'application/json; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(request.method==='HEAD'?undefined:content);}catch{response.writeHead(404);response.end('Not found');}
  });
  await new Promise((res,rej)=>{server.once('error',rej);server.listen(Number(port),'127.0.0.1',res);});
  return {server,url:`http://127.0.0.1:${server.address().port}/`};
}
