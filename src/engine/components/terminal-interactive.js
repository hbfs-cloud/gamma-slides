/** Stream a PTY into xterm without sharing keystrokes with Reveal or recording controls. */
export function createInteractiveTerminal({terminal,output,input,status,cwd,bridge,writeLine}){
  let current=null,term=null,fit=null;
  const host=document.createElement('div');host.className='gamma-terminal-pty';host.hidden=true;output.after(host);
  const stop=document.createElement('button');stop.type='button';stop.className='gamma-terminal-button gamma-terminal-stop';stop.textContent='Stop';stop.setAttribute('aria-label','Stop command');stop.hidden=true;input.before(stop);
  const headers=()=>({'Content-Type':'application/json','X-Gamma-Token':bridge.token});
  const control=async(action,payload={})=>{
    const s=current;if(!s?.id)return;
    const response=await fetch('/__gamma/terminal/pty/'+s.id+'/'+action,{method:'POST',headers:headers(),body:JSON.stringify(payload),signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('Terminal connection was lost');
  };
  const snapshot=(history=false)=>{
    if(!term)return output.innerText;
    const b=term.buffer.active;let text='';for(let i=history?0:b.viewportY;i<(history?b.length:Math.min(b.length,b.viewportY+term.rows));i++){const line=b.getLine(i);text+=(text&&!(history&&line?.isWrapped)?'\n':'')+(line?.translateToString(true)||'');}return text.trimEnd();
  };
  window.__gammaTerminalText=()=>current?snapshot():output.innerText;
  const ensure=()=>{
    if(term)return;
    const palette=getComputedStyle(terminal);
    term=new Terminal({fontFamily:'monospace',fontSize:14,scrollback:1000,convertEol:false,allowProposedApi:false,theme:{background:palette.getPropertyValue('--studio-void').trim(),foreground:palette.getPropertyValue('--studio-ink').trim()}});
    fit=new FitAddon.FitAddon();term.loadAddon(fit);term.open(host);
    term.onData(data=>{if(current)current.input=current.input.then(()=>control('input',{data})).catch(()=>current?.abort.abort());});
    new ResizeObserver(()=>{if(!current||host.hidden)return;fit.fit();control('resize',{cols:term.cols,rows:term.rows}).catch(()=>{});}).observe(host);
  };
  const cancel=()=>{if(current){control('stop').catch(()=>{});current.abort.abort();}};
  stop.addEventListener('click',cancel);
  input.addEventListener('focus',()=>{if(current&&term)term.focus();});
  const run=async command=>{
    if(current)return;
    const s={abort:new AbortController(),id:null,input:Promise.resolve(),finished:false};current=s;
    terminal.classList.add('is-busy','has-pty');input.readOnly=true;stop.hidden=false;output.hidden=true;host.hidden=false;status.textContent='Connecting…';
    let heartbeat,reader;
    try{
      ensure();term.reset();fit.fit();term.focus();
      const response=await fetch('/__gamma/terminal/pty',{method:'POST',headers:headers(),body:JSON.stringify({command,cols:Math.max(20,term.cols),rows:Math.max(5,term.rows)}),signal:s.abort.signal});
      if(!response.ok){const error=await response.json();throw Error(error.error||'Terminal unavailable');}
      reader=response.body.getReader();const decoder=new TextDecoder();let pending='';
      while(true){const chunk=await reader.read();if(chunk.done)break;pending+=decoder.decode(chunk.value,{stream:true});let newline;
        while((newline=pending.indexOf('\n'))>=0){const line=pending.slice(0,newline);pending=pending.slice(newline+1);if(!line)continue;const message=JSON.parse(line);
          if(message.type==='ready'){s.id=message.id;status.textContent='Interactive · Ctrl+C to stop';heartbeat=setInterval(()=>control('heartbeat').catch(()=>s.abort.abort()),5000);}
          if(message.type==='data')await new Promise(resolve=>term.write(message.data,resolve));
          if(message.type==='exit'){s.finished=true;if(message.cwd){cwd.textContent=message.cwd;cwd.title=message.cwd;}status.textContent=message.error||'Finished · '+message.exitCode;if(message.error)writeLine(message.error,'gamma-terminal-error');}
        }
      }
      if(!s.finished)throw Error('Terminal connection interrupted');
    }catch(error){status.textContent=error.name==='AbortError'?'Command stopped':'Terminal unavailable';if(error.name!=='AbortError')writeLine(error.message,'gamma-terminal-error');}
    finally{
      clearInterval(heartbeat);reader?.releaseLock();
      const text=snapshot(true);if(text.trim())writeLine(text);
      current=null;terminal.classList.remove('is-busy','has-pty');input.readOnly=false;stop.hidden=true;host.hidden=true;output.hidden=false;
      if(terminal.classList.contains('is-visible')&&terminal.contains(document.activeElement))input.focus();
    }
  };
  window.addEventListener('pagehide',cancel);
  return {run,cancel,get busy(){return !!current;},focus(){if(current&&term)term.focus();else input.focus();}};
}
