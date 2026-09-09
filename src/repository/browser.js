import {randomBytes} from 'node:crypto';
import {launchBrowser} from '../browser.js';

/** Explicitly enabled, isolated browser controlled only by the loopback presentation. */
export function browserHandler({enabled=false}={}) {
 const token=randomBytes(24).toString('hex');let browser,page,starting,busy=false;
 const getPage=async()=>{if(page&&!page.isClosed())return page;if(!starting)starting=(async()=>{browser=await launchBrowser({headless:true});page=await browser.newPage();await page.setViewport({width:1280,height:800});await page.setRequestInterception(true);page.on('request',r=>{const protocol=new URL(r.url()).protocol;if(['http:','https:','data:','blob:','about:'].includes(protocol))r.continue().catch(()=>{});else r.abort().catch(()=>{});});page.on('dialog',d=>d.dismiss());page.on('popup',p=>p.close());return page;})().finally(()=>starting=null);return starting;};
 const handler=async(req,res,path)=>{
  if(!path.startsWith('/__gamma/browser'))return false;
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const origin=`http://127.0.0.1:${req.socket.localPort}`;
  if(!enabled||req.headers.host!==new URL(origin).host||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&req.headers.origin!==origin){json(403,{error:'Navigateur local désactivé. Lancez le serveur avec --browser.'});return true;}
  if(path==='/__gamma/browser/session'&&req.method==='GET'){json(200,{token,enabled:true});return true;}
  if(req.headers['x-gamma-token']!==token){json(403,{error:'Session invalide'});return true;}
  if(busy){json(409,{error:'Navigateur occupé'});return true;}
  if(path==='/__gamma/browser/frame'&&req.method==='GET'){
   busy=true;try{const p=await getPage(),bytes=await p.screenshot({type:'jpeg',quality:80});res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Gamma-URL':encodeURIComponent(p.url())});res.end(bytes);}catch(e){json(500,{error:e.message});}finally{busy=false;}return true;
  }
  if(path!=='/__gamma/browser'||req.method!=='POST'){json(404,{error:'Not found'});return true;}
  let body='';try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192){json(413,{error:'Requête trop longue'});return true;}}}catch{return true;}
  let data;try{data=JSON.parse(body);}catch{json(400,{error:'JSON invalide'});return true;}
  if(!data||typeof data!=='object'){json(400,{error:'Commande invalide'});return true;}
  if(busy){json(409,{error:'Navigateur occupé'});return true;}busy=true;
  try{
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
   json(200,{url:p.url(),title:await p.title(),width:1280,height:800});
  }catch(e){json(400,{error:e.message});}finally{busy=false;}return true;
 };
 handler.close=async()=>{await starting?.catch(()=>{});await browser?.close();};return handler;
}
