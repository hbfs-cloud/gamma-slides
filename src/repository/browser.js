import {randomBytes} from 'node:crypto';
import {launchBrowser} from '../browser.js';

/** Opt-in, isolated Chrome. Only its target tab is captured, never the user's desktop. */
export function browserHandler({enabled=false}={}) {
 const token=randomBytes(24).toString('hex'),captureTitle=`GAMMA_REMOTE_${randomBytes(12).toString('hex')}`;
 let browser,page,controller,starting,busy=false,streamEpoch=0,closePending=0;
 const dimensions={width:1920,height:1080};
 const getPage=async()=>{
  if(page&&!page.isClosed())return page;
  if(!starting)starting=(async()=>{
   browser=await launchBrowser({headless:true,defaultViewport:null,ignoreDefaultArgs:['--mute-audio'],args:[`--auto-select-tab-capture-source-by-title=${captureTitle}`,'--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
   page=await browser.newPage();const cdp=await page.createCDPSession(),win=await cdp.send('Browser.getWindowForTarget'),frame=await page.evaluate(()=>({x:outerWidth-innerWidth,y:outerHeight-innerHeight}));await cdp.send('Browser.setWindowBounds',{windowId:win.windowId,bounds:{width:dimensions.width+frame.x,height:dimensions.height+frame.y}});await cdp.detach();await page.setViewport(dimensions);await page.setRequestInterception(true);
   page.on('request',r=>{let allowed=false;try{allowed=['http:','https:','data:','blob:','about:'].includes(new URL(r.url()).protocol);}catch{}(allowed?r.continue():r.abort()).catch(()=>{});});
   page.on('dialog',d=>d.dismiss());page.on('popup',p=>p.close());return page;
  })().finally(()=>starting=null);
  return starting;
 };
 const close=async()=>{streamEpoch++;closePending=0;await starting?.catch(()=>{});const old=browser;browser=page=controller=null;await old?.close();};
 const finish=async()=>{try{if(closePending===streamEpoch&&closePending)await close().catch(()=>{});}finally{busy=false;}};
 const answer=async(origin,offer)=>{
  const epoch=++streamEpoch,p=await getPage();
  if(!controller||controller.isClosed()){
   controller=await browser.newPage();await controller.setViewport(dimensions);await controller.setRequestInterception(true);
   const host=`${origin}/__gamma/browser/capture-host`;
   controller.on('request',r=>{if(r.isNavigationRequest()&&r.url()===host)r.respond({status:200,contentType:'text/html',body:'<!doctype html><title>Gamma private capture controller</title>'}).catch(()=>{});else r.abort().catch(()=>{});});
   await controller.goto(host);await controller.exposeFunction('__gammaPeerEnded',async epoch=>{if(epoch!==streamEpoch)return;if(busy){closePending=epoch;return;}busy=true;try{await close();}finally{await finish();}});const oldTitle=await p.title();await p.evaluate(title=>document.title=title,captureTitle);
   let captureTimer;try{await Promise.race([controller.evaluate(async()=>{window.capture=await navigator.mediaDevices.getDisplayMedia({video:{width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30,max:30}},audio:{suppressLocalAudioPlayback:true,echoCancellation:false,noiseSuppression:false,autoGainControl:false},systemAudio:'exclude'});}),new Promise((_,reject)=>{captureTimer=setTimeout(()=>reject(Error('La capture du navigateur a expiré. Fermez puis rouvrez le navigateur.')),15000);})]);}
   finally{clearTimeout(captureTimer);await p.evaluate(title=>document.title=title,oldTitle).catch(()=>{});}
  }
  return controller.evaluate(async({description,epoch})=>{
   window.peer?.close();const peer=window.peer=new RTCPeerConnection({iceServers:[]});peer.onconnectionstatechange=()=>{if(['failed','disconnected'].includes(peer.connectionState))setTimeout(()=>{if(window.peer===peer&&['failed','disconnected'].includes(peer.connectionState))window.__gammaPeerEnded(epoch);},3000);};
   for(const track of window.capture.getTracks()){const sender=peer.addTrack(track,window.capture);if(track.kind==='video'){track.contentHint='detail';const params=sender.getParameters();if(params.encodings?.length){params.encodings[0].maxBitrate=12000000;await sender.setParameters(params);}}}
   await peer.setRemoteDescription(description);await peer.setLocalDescription(await peer.createAnswer());
   if(peer.iceGatheringState!=='complete')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Signalisation WebRTC expirée')),10000);peer.addEventListener('icegatheringstatechange',()=>{if(peer.iceGatheringState==='complete'){clearTimeout(timer);resolve();}});});
   return {description:peer.localDescription.toJSON(),audio:window.capture.getAudioTracks().length>0,captureWidth:window.capture.getVideoTracks()[0].getSettings().width,captureHeight:window.capture.getVideoTracks()[0].getSettings().height};
  },{description:offer,epoch});
 };
 const handler=async(req,res,path)=>{
  if(!path.startsWith('/__gamma/browser'))return false;
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const origin=`http://127.0.0.1:${req.socket.localPort}`;
  if(!enabled||req.headers.host!==new URL(origin).host||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&req.headers.origin!==origin){json(403,{error:'Navigateur local désactivé. Lancez le serveur avec --browser.'});return true;}
  if(path==='/__gamma/browser/session'&&req.method==='GET'){json(200,{token,enabled:true,transport:'webrtc',...dimensions});return true;}
  if(req.headers['x-gamma-token']!==token){json(403,{error:'Session invalide'});return true;}
  if(busy){json(409,{error:'Navigateur occupé'});return true;}
  // Retained for a single still export and existing CLI consumers; the studio uses WebRTC.
  if(path==='/__gamma/browser/frame'&&req.method==='GET'){
   busy=true;try{const p=await getPage(),bytes=await p.screenshot({type:'jpeg',quality:80});res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Gamma-URL':encodeURIComponent(p.url())});res.end(bytes);}catch(e){json(500,{error:e.message});}finally{await finish();}return true;
  }
  if(!['/__gamma/browser','/__gamma/browser/stream','/__gamma/browser/close'].includes(path)||req.method!=='POST'){json(404,{error:'Not found'});return true;}
  let body='';try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>65536){json(413,{error:'Requête trop longue'});return true;}}}catch{return true;}
  let data;try{data=JSON.parse(body);}catch{json(400,{error:'JSON invalide'});return true;}
  if(!data||typeof data!=='object'){json(400,{error:'Commande invalide'});return true;}
  if(busy){json(409,{error:'Navigateur occupé'});return true;}busy=true;
  try{
   if(path==='/__gamma/browser/close'){await close();json(200,{closed:true});return true;}
   if(path==='/__gamma/browser/stream'){
    if(data.type!=='offer'||typeof data.sdp!=='string'||data.sdp.length>60000)throw Error('Offre WebRTC invalide');
    json(200,{...await answer(origin,{type:data.type,sdp:data.sdp}),...dimensions});return true;
   }
   const p=await getPage();
   if(data.action==='navigate'){const url=new URL(data.url);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Utilisez une URL HTTP ou HTTPS sans identifiants.');await p.goto(url.href,{waitUntil:'domcontentloaded',timeout:20000});}
   else if(data.action==='back')await p.goBack({waitUntil:'domcontentloaded',timeout:20000});
   else if(data.action==='forward')await p.goForward({waitUntil:'domcontentloaded',timeout:20000});
   else if(data.action==='reload')await p.reload({waitUntil:'domcontentloaded',timeout:20000});
   else if(data.action==='click'){const {width,height}=p.viewport();if(!Number.isFinite(data.x)||!Number.isFinite(data.y)||data.x<0||data.y<0||data.x>width||data.y>height)throw new Error('Coordonnées invalides');await p.mouse.click(data.x,data.y);}
   else if(data.action==='wheel')await p.mouse.wheel({deltaY:Math.max(-2000,Math.min(2000,Number(data.y)||0)),deltaX:0});
   else if(data.action==='text'){if(typeof data.text!=='string'||data.text.length>4000)throw new Error('Texte invalide');await p.keyboard.type(data.text);}
   else if(data.action==='key'){if(!['Enter','Tab','Backspace','Delete','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown','Space'].includes(data.key))throw new Error('Touche non prise en charge');await p.keyboard.press(data.key);}
   else throw new Error('Commande inconnue');
   json(200,{url:p.url(),title:await p.title(),...dimensions});
  }catch(e){if(path==='/__gamma/browser/stream')await close().catch(()=>{});json(400,{error:e.message});}finally{await finish();}return true;
 };
 handler.close=close;return handler;
}
