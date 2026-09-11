import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createPTYSession, killTerminalProcess } from './terminal-pty.js';

/** Local, opt-in shell. Session discovery does not alter the verified HTML bytes. */
export function terminalHandler({enabled=false,cwd=process.cwd()}={}) {
  const token=randomBytes(24).toString('hex');let directory=cwd,busy=false;
  let legacyChild=null;
  const pty=createPTYSession({getDirectory:()=>directory,setDirectory:next=>{directory=next;}});
  const handler=async (request,response,path)=>{
    if(!path.startsWith('/__gamma/terminal'))return false;
    const json=(status,data)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(JSON.stringify(data));};
    const origin=`http://127.0.0.1:${request.socket.localPort}`;
    if(!enabled||request.headers.host!==new URL(origin).host||!['127.0.0.1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress)||request.headers['sec-fetch-site']==='cross-site'||(request.headers.origin&&request.headers.origin!==origin)){json(403,{error:'Local terminal unavailable'});return true;}
    if(path==='/__gamma/terminal/session'&&request.method==='GET'){json(200,{enabled:true,pty:true,token,cwd:directory});return true;}
    if(request.method!=='POST'){json(404,{error:'Not found'});return true;}
    if(request.headers['x-gamma-token']!==token){json(403,{error:'Invalid terminal session'});return true;}
    let body='';try{for await(const chunk of request){body+=chunk;if(Buffer.byteLength(body)>4096){json(413,{error:'Command too large'});return true;}}}catch{return true;}
    let payload;try{payload=JSON.parse(body);}catch{json(400,{error:'Invalid JSON'});return true;}
    if(!payload||typeof payload!=='object'||Array.isArray(payload)){json(400,{error:'Invalid JSON object'});return true;}
    const control=path.match(/^\/__gamma\/terminal\/pty\/([a-f0-9]{48})\/(input|resize|stop|heartbeat)$/);
    if(control){const result=pty.control(control[1],control[2],payload);json(result.status,result);return true;}
    if(!['/__gamma/terminal','/__gamma/terminal/pty'].includes(path)){json(404,{error:'Not found'});return true;}
    const command=payload?.command;
    if(typeof command!=='string'||!command.trim()||command.length>1000||command.includes('\0')){json(400,{error:'Invalid command'});return true;}
    if(busy||pty.busy){json(409,{error:'A command is already running'});return true;}
    if(path.endsWith('/pty')){
      if(!Number.isInteger(payload.cols)||payload.cols<20||payload.cols>300||!Number.isInteger(payload.rows)||payload.rows<5||payload.rows>120){json(400,{error:'Invalid terminal size'});return true;}
      try{pty.start(response,payload);}catch(error){json(503,{error:'Interactive terminal unavailable: '+error.message});}return true;
    }
    busy=true;const marker=`__GAMMA_CWD_${randomBytes(8).toString('hex')}__`;
    const script=`${command}\ngamma_status=$?\nprintf '\\n${marker}%s\\n' "$PWD"\nexit $gamma_status`;
    legacyChild=execFile(process.env.SHELL||'/bin/sh',['-c',script],{cwd:directory,detached:process.platform!=='win32',timeout:30_000,killSignal:'SIGKILL',maxBuffer:1_000_000},(error,stdout,stderr)=>{
      const at=stdout.lastIndexOf('\n'+marker);if(at>=0){const next=stdout.slice(at+marker.length+1).split('\n')[0];if(next)directory=next;stdout=stdout.slice(0,at);}busy=false;
      legacyChild=null;if(!response.destroyed)json(error?.killed?408:error?422:200,{stdout,stderr,exitCode:error?.code??0,cwd:directory,...(error?.killed?{error:'Command timed out'}:{})});
    });
    const child=legacyChild,timer=setTimeout(()=>killTerminalProcess(child),30_000);timer.unref();
    child.once('close',()=>clearTimeout(timer));response.once('close',()=>{if(!response.writableEnded)killTerminalProcess(child);});
    return true;
  };
  handler.close=()=>{pty.close();killTerminalProcess(legacyChild);};return handler;
}
