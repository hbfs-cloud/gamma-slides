import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {browserHandler} from '../src/repository/browser.js';
import {serveRepositoryPresentation} from '../src/repository/server.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const closeServer=server=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));

function fakePage(){
 return {isClosed:()=>false,createCDPSession:async()=>({send:async method=>method==='Browser.getWindowForTarget'?{windowId:1}:{},detach:async()=>{}}),evaluate:async()=>({x:0,y:0}),setViewport:async()=>{},setRequestInterception:async()=>{},on:()=>{},goto:async()=>{},url:()=> 'https://example.test/',title:async()=> 'Fixture',keyboard:{type:async()=>{},press:async()=>{}},mouse:{click:async()=>{},wheel:async()=>{}}};
}

test('isolated browser close is shared and blocks a replacement launch until process close completes',async()=>{
 const gate=deferred();let launches=0,closes=0;
 const web=browserHandler({enabled:true,launch:async()=>{launches++;return {newPage:async()=>fakePage(),close:async()=>{closes++;await gate.promise;}};}});
 const server=createServer(async(req,res)=>{if(!await web(req,res,new URL(req.url,'http://localhost').pathname)){res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const {token}=await (await fetch(`${base}/__gamma/browser/session`)).json();const navigate=()=>fetch(`${base}/__gamma/browser`,{method:'POST',headers:{'Content-Type':'application/json','X-Gamma-Token':token},body:JSON.stringify({action:'navigate',url:'https://example.test/'})});
  assert.equal((await navigate()).status,200);assert.equal(launches,1);
  const first=web.close(),second=web.close();assert.strictEqual(first,second);await tick();assert.equal(closes,1);
  const replacement=navigate();await tick();assert.equal(launches,1,'replacement launch waits for the delayed close');
  gate.resolve();await first;assert.equal((await replacement).status,200);assert.equal(launches,2);
 }finally{await web.close();await closeServer(server);}
});

test('server close returns its Server, coalesces resource shutdown, and reports close errors to callbacks',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gamma-lifecycle-'));writeFileSync(join(dir,'index.html'),'deck');const gate=deferred();let calls=0;
 const web=Object.assign(async()=>false,{close:()=>{calls++;return gate.promise;}});
 const live=await serveRepositoryPresentation(dir,{port:0,browserHandlerFactory:()=>web});
 try{
  const results=[],callbacks=deferred(),record=error=>{results.push(error);if(results.length===2)callbacks.resolve();};assert.strictEqual(live.server.close(record),live.server);assert.strictEqual(live.server.close(record),live.server);await tick();assert.equal(calls,1);assert.equal(results.length,0);
  gate.resolve();await callbacks.promise;assert.deepEqual(results,[undefined,undefined]);
 }finally{rmSync(dir,{recursive:true,force:true});}

 const failingDir=mkdtempSync(join(tmpdir(),'gamma-lifecycle-'));writeFileSync(join(failingDir,'index.html'),'deck');const expected=Error('delayed isolated browser close failed');const failing=Object.assign(async()=>false,{close:()=>Promise.reject(expected)});const failed=await serveRepositoryPresentation(failingDir,{port:0,browserHandlerFactory:()=>failing});
 try{assert.strictEqual(await new Promise(resolve=>{const returned=failed.server.close(error=>resolve(error));assert.strictEqual(returned,failed.server);}),expected);}finally{rmSync(failingDir,{recursive:true,force:true});}
});
