import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';

/** Local, opt-in shell. Session discovery does not alter the verified HTML bytes. */
export function terminalHandler({enabled=false,cwd=process.cwd()}={}) {
  const token=randomBytes(24).toString('hex');let directory=cwd,busy=false;
  return async (request,response,path)=>{
    if(!path.startsWith('/__gamma/terminal'))return false;
    const json=(status,data)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(JSON.stringify(data));};
    const origin=`http://127.0.0.1:${request.socket.localPort}`;
    if(!enabled||request.headers.host!==new URL(origin).host||!['127.0.0.1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress)||request.headers['sec-fetch-site']==='cross-site'||(request.headers.origin&&request.headers.origin!==origin)){json(403,{error:'Local terminal unavailable'});return true;}
    if(path==='/__gamma/terminal/session'&&request.method==='GET'){json(200,{enabled:true,token,cwd:directory});return true;}
    if(path!=='/__gamma/terminal'||request.method!=='POST'){json(404,{error:'Not found'});return true;}
    if(request.headers['x-gamma-token']!==token){json(403,{error:'Invalid terminal session'});return true;}
    if(busy){json(409,{error:'A command is already running'});return true;}
    let body='';try{for await(const chunk of request){body+=chunk;if(Buffer.byteLength(body)>4096){json(413,{error:'Command too large'});return true;}}}catch{return true;}
    let command;try{command=JSON.parse(body).command;}catch{json(400,{error:'Invalid JSON'});return true;}
    if(typeof command!=='string'||!command.trim()||command.length>1000||command.includes('\0')){json(400,{error:'Invalid command'});return true;}
    if(busy){json(409,{error:'A command is already running'});return true;}
    busy=true;const marker=`__GAMMA_CWD_${randomBytes(8).toString('hex')}__`;
    const script=`${command}\ngamma_status=$?\nprintf '\\n${marker}%s\\n' "$PWD"\nexit $gamma_status`;
    execFile(process.env.SHELL||'/bin/sh',['-c',script],{cwd:directory,timeout:30_000,maxBuffer:1_000_000},(error,stdout,stderr)=>{
      const at=stdout.lastIndexOf('\n'+marker);if(at>=0){const next=stdout.slice(at+marker.length+1).split('\n')[0];if(next)directory=next;stdout=stdout.slice(0,at);}busy=false;
      json(error?.killed?408:error?422:200,{stdout,stderr,exitCode:error?.code??0,cwd:directory,...(error?.killed?{error:'Command timed out'}:{})});
    });return true;
  };
}
