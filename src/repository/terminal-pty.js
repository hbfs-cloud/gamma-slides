import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { chmodSync, existsSync, statSync } from 'node:fs';

const require=createRequire(import.meta.url);
// node-pty 1.1.0's Darwin prebuilt archive omits the helper's executable bit.
function loadPTY(){
  if(process.platform==='darwin'){
    const root=dirname(require.resolve('node-pty/package.json'));
    for(const rel of [`prebuilds/darwin-${process.arch}/spawn-helper`,'build/Release/spawn-helper']){
      const file=join(root,rel);if(existsSync(file)){const mode=statSync(file).mode;if(!(mode&0o100))chmodSync(file,mode|0o111);}
    }
  }
  return require('node-pty');
}
export function killTerminalProcess(child){
  if(!child)return;
  try{if(process.platform!=='win32')process.kill(-child.pid,'SIGKILL');else child.kill();}catch{try{child.kill('SIGKILL');}catch{}}
}

/** One authenticated foreground command at a time. Output is streamed, never accumulated. */
export function createPTYSession({getDirectory,setDirectory,idleMs=180_000,maxOutput=16_000_000}={}){
  let active=null;
  const close=()=>{if(active)active.stop('Terminal closed');};
  return {
    get busy(){return !!active;},close,
    control(id,action,body){
      const s=active;if(!s||s.id!==id)return {status:404,error:'Command finished or session unknown'};
      s.lastSeen=Date.now();
      if(action==='stop'){s.stop('Command interrupted');return {status:200};}
      if(action==='input'&&typeof body.data==='string'&&body.data.length<=4096){s.child.write(body.data);return {status:200};}
      if(action==='resize'&&Number.isInteger(body.cols)&&body.cols>=20&&body.cols<=300&&Number.isInteger(body.rows)&&body.rows>=5&&body.rows<=120){s.child.resize(body.cols,body.rows);return {status:200};}
      if(action==='heartbeat')return {status:200};
      return {status:400,error:'Invalid terminal control'};
    },
    start(response,{command,cols=80,rows=24}){
      if(active)throw Error('A command is already running');
      const id=randomBytes(24).toString('hex'),marker='GAMMA_CWD_'+randomBytes(12).toString('hex')+';';
      const script=`${command}\ngamma_status=$?\nprintf '\\033]777;${marker}%s\\007' "$PWD"\nexit $gamma_status`;
      const child=loadPTY().spawn(process.env.SHELL||'/bin/sh',['-c',script],{name:'xterm-256color',cols:Math.max(20,Math.min(300,cols)),rows:Math.max(5,Math.min(120,rows)),cwd:getDirectory(),env:{...process.env,TERM:'xterm-256color'}});
      response.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      let ended=false,tail='',bytes=0,reason='';
      const send=data=>{if(!response.destroyed&&!response.writableEnded)response.write(JSON.stringify(data)+'\n');};
      const s={id,child,lastSeen:Date.now(),stop(message){reason=message;killTerminalProcess(child);}};active=s;
      send({type:'ready',id});
      const timer=setInterval(()=>{if(Date.now()-s.lastSeen>idleMs)s.stop('Terminal connection lost');},Math.min(5000,idleMs));timer.unref();
      const onClose=()=>{if(!ended)s.stop('Terminal connection closed');};response.on('close',onClose);
      child.onData(data=>{
        bytes+=Buffer.byteLength(data);tail=(tail+data).slice(-16_384);
        // Bound sustained noisy commands and slow/abandoned HTTP readers.
        if(bytes>maxOutput||response.writableLength>1_000_000){s.stop('Output too large: command interrupted');return;}
        send({type:'data',data});
      });
      child.onExit(({exitCode,signal})=>{
        ended=true;clearInterval(timer);response.removeListener('close',onClose);
        const at=tail.lastIndexOf(marker),end=tail.indexOf('\x07',at);
        if(at>=0&&end>at){const next=tail.slice(at+marker.length,end);if(next)setDirectory(next);}
        if(active===s)active=null;
        send({type:'exit',exitCode,signal,cwd:getDirectory(),error:reason});response.end();
      });
    }
  };
}
