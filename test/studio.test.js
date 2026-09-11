import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {serveRepositoryPresentation} from '../src/repository/server.js';
import {loadDeck} from '../src/loader/index.js';
import {buildEChartsConfig} from '../src/engine/components/chart-builder.js';
import {getTheme} from '../src/themes/index.js';
import {findBrowserExecutable} from '../src/browser.js';
import {browserHandler} from '../src/repository/browser.js';
test('native ECharts keeps declarative options and rejects missing options',()=>{const option={xAxis:{type:'category',data:['A']},yAxis:{},series:[{type:'bar',data:[4]}],dataZoom:[{type:'inside'}]};const deck=loadDeck(JSON.stringify({slides:[{layout:'chart',chart:{type:'echarts',data:{},options:{echarts:option}}}]}));const config=buildEChartsConfig(deck.slides[0].chart,getTheme('signal-room'));assert.deepEqual(config.series,option.series);assert.deepEqual(config.dataZoom,option.dataZoom);config.series[0].data[0]=5;assert.equal(option.series[0].data[0],4);assert.throws(()=>loadDeck('slides: [{layout: chart, chart: {type: echarts, data: {}}}]'));});
test('local visual and media assets are embedded for portable HTML',()=>{const dir=mkdtempSync(join(tmpdir(),'gamma-assets-'));try{writeFileSync(join(dir,'art.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');writeFileSync(join(dir,'deck.yaml'),'slides:\n - layout: visual\n   title: Signal\n   visual: {src: art.svg, alt: Illustration}\n');const deck=loadDeck(join(dir,'deck.yaml'));assert.match(deck.slides[0].visual.src,/^data:image\/svg\+xml;base64,/);assert.throws(()=>loadDeck('slides: [{layout: browser, browser: {url: "javascript:alert(1)"}}]'));}finally{rmSync(dir,{recursive:true,force:true});}});
test('isolated browser latches a launch failure until an explicit close',async()=>{
 let launches=0;const web=browserHandler({enabled:true,launch:async()=>{launches++;throw Error('mock browser crash');}});
 const server=createServer(async(req,res)=>{if(!await web(req,res,new URL(req.url,'http://localhost').pathname)){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const {token}=await (await fetch(`${base}/__gamma/browser/session`)).json();const call=body=>fetch(`${base}/__gamma/browser`,{method:'POST',headers:{'Content-Type':'application/json','X-Gamma-Token':token},body:JSON.stringify(body)});
  const first=await call({action:'navigate',url:'https://example.com'}),second=await call({action:'navigate',url:'https://example.com'});assert.equal(first.status,400);assert.equal(second.status,400);assert.match((await first.json()).error,/will not be retried/i);assert.equal(launches,1);
  assert.equal((await fetch(`${base}/__gamma/browser/close`,{method:'POST',headers:{'Content-Type':'application/json','X-Gamma-Token':token},body:'{}'})).status,200);assert.equal((await call({action:'navigate',url:'https://example.com'})).status,400);assert.equal(launches,2);
 }finally{await new Promise(r=>server.close(r));}
});
test('isolated browser is opt-in, token protected, navigates and interacts',{skip:!findBrowserExecutable()&&'requires GAMMA_BROWSER_EXECUTABLE or PUPPETEER_EXECUTABLE_PATH on this platform'},async()=>{
 const fixture=createServer((req,res)=>{res.setHeader('X-Frame-Options','DENY');res.end('<title>Browser proof</title><input id="text" oninput="document.title=this.value"><button onclick="document.title=document.querySelector(\'input\').value">Apply</button><div style="height:2000px">Scrollable</div>');});await new Promise(r=>fixture.listen(0,'127.0.0.1',r));const dir=mkdtempSync(join(tmpdir(),'gamma-browser-'));writeFileSync(join(dir,'index.html'),'slide');const off=await serveRepositoryPresentation(dir,{port:0}),on=await serveRepositoryPresentation(dir,{port:0,browser:true});
 try{assert.equal((await fetch(off.url+'__gamma/browser/session')).status,403);assert.equal((await fetch(on.url+'__gamma/browser/session',{headers:{Origin:'https://bad.example'}})).status,403);const {token}=await (await fetch(on.url+'__gamma/browser/session')).json();const call=async body=>fetch(on.url+'__gamma/browser',{method:'POST',headers:{'Content-Type':'application/json','X-Gamma-Token':token},body:JSON.stringify(body)});assert.equal((await fetch(on.url+'__gamma/browser',{method:'POST',body:'{}'})).status,403);assert.equal((await call({action:'navigate',url:'file:///etc/passwd'})).status,400);assert.equal((await call({action:'navigate',url:`http://127.0.0.1:${fixture.address().port}/`})).status,200);await call({action:'click',x:40,y:18});await call({action:'text',text:'Typed from slides'});await call({action:'click',x:185,y:18});const state=await (await call({action:'key',key:'Enter'})).json();assert.equal(state.title,'Typed from slides');const frame=await fetch(on.url+'__gamma/browser/frame',{headers:{'X-Gamma-Token':token}});assert.equal(frame.headers.get('content-type'),'image/jpeg');assert.ok((await frame.arrayBuffer()).byteLength>1000);assert.equal((await call({action:'wheel',y:600})).status,200);
 }finally{await Promise.all([off,on].map(s=>new Promise(r=>s.server.close(r))));await new Promise(r=>fixture.close(r));rmSync(dir,{recursive:true,force:true});}
});
