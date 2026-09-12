import {request as httpRequest} from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync,symlinkSync,readlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {githubRepository,evidencePaths,inspectRepository} from '../src/repository/inspect.js';
import {archifyChildEnvironment,compileDiagram} from '../src/engine/archify.js';
import {presentRepository,serveRepositoryPresentation} from '../src/repository/present.js';
import {publishRepositoryPresentation} from '../src/repository/publish.js';

test('CLI exposes repository workflow without duplicate commands or parse errors',()=>{
  const help=execFileSync(process.execPath,['bin/gamma-slides.js','repo-present','--help'],{encoding:'utf8'});assert.match(help,/--local/);assert.match(help,/--publish/);
});
test('repository identity cannot point to an arbitrary host or Git option',()=>{
  assert.equal(githubRepository('https://github.com/owner/repo.git'),'owner/repo');
  for(const bad of ['https://evil.test/a/b','--upload-pack=bad','../repo','a/b/../../c','file:///tmp/repo'])assert.throws(()=>githubRepository(bad));
  assert.deepEqual(evidencePaths(['src/vendor/a/README.md','.env','README.md','package.json','secrets/README.md']),['README.md','package.json']);
});
test('local dossier pins committed bytes and rejects mismatched GitHub provenance',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'gamma-repo-test-'));const git=args=>execFileSync('git',args,{cwd:dir,stdio:'pipe',encoding:'utf8'});
  try{git(['init']);git(['config','user.email','test@example.test']);git(['config','user.name','Test']);writeFileSync(join(dir,'README.md'),'committed');git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/actual.git']);writeFileSync(join(dir,'README.md'),'uncommitted');
    const brief=await inspectRepository({localPath:dir},{fetcher:async()=>({ok:false,status:404})});assert.equal(brief.evidence[0].content,'committed');assert.equal(brief.repository,'example/actual');assert.equal(brief.statistics,null);
    await assert.rejects(inspectRepository({localPath:dir,repository:'example/other'}),/does not match/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('remote dossier uses the resolved commit and reports truncated trees',async()=>{
  const calls=[];const fetcher=async url=>{calls.push(url);const content=url.endsWith('/languages')?{JavaScript:12}:url.includes('/git/blobs/')?{encoding:'base64',content:Buffer.from('# Real readme').toString('base64')}:url.includes('/git/trees/')?{truncated:true,tree:[{type:'blob',path:'README.md',sha:'blob',size:13}]}:url.includes('/commits/')?{sha:'pinned'}:{default_branch:'main',html_url:'https://github.com/o/r'};return {ok:true,json:async()=>content};};
  const brief=await inspectRepository({repository:'o/r'}, {fetcher});assert.equal(brief.revision,'pinned');assert.ok(calls.some(url=>url.includes('/git/trees/pinned')));assert.match(brief.evidence[0].url,/blob\/pinned/);assert.ok(brief.limitations.some(line=>line.includes('truncated tree')));
});
for(const type of ['architecture','workflow','sequence','dataflow','lifecycle'])test(`real Archify ${type} passes nine strict checks`,()=>{
  const spec=JSON.parse(readFileSync(`presentations/diagrams/repository.${type}.json`));const result=compileDiagram({type,spec});assert.equal(result.receipt.validation.checksPassed,9);assert.equal(result.receipt.validation.errors,0);assert.match(result.html,/Archify.guidedViews/);assert.match(result.svg,/<svg/);
});
test('invalid graph fails instead of using last successful output',()=>{
  const spec=JSON.parse(readFileSync('presentations/diagrams/repository.architecture.json'));spec.connections[0].to='missing-node';assert.throws(()=>compileDiagram({type:'architecture',spec}),/Archify/);
});
test('Archify compiler enters Node mode when invoked by packaged Electron',()=>{
  const environment=archifyChildEnvironment({PATH:'/usr/bin',KEEP:'value'},{electron:'44.3.0'});
  assert.equal(environment.ELECTRON_RUN_AS_NODE,'1');assert.equal(environment.ARCHIFY_UPDATE_CHECK_DISABLED,'1');assert.equal(environment.KEEP,'value');
  assert.equal(archifyChildEnvironment({PATH:'/usr/bin'},{node:'22'}).ELECTRON_RUN_AS_NODE,undefined);
});
test('loopback server excludes source evidence and arbitrary paths',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'gamma-serve-test-'));writeFileSync(join(dir,'index.html'),'<h1>deck</h1>');writeFileSync(join(dir,'private.txt'),'secret');const live=await serveRepositoryPresentation(dir,{port:0});
  try{assert.equal(await (await fetch(live.url)).text(),'<h1>deck</h1>');assert.equal((await fetch(live.url+'private.txt')).status,404);assert.equal((await fetch(live.url+'../private.txt')).status,404);}finally{await new Promise(r=>live.server.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('failed QA preserves the currently served build',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'gamma-promote-test-'));mkdirSync(join(dir,'old'));writeFileSync(join(dir,'old/index.html'),'old');symlinkSync('old',join(dir,'site'));
  const brief={repository:'hbfs-cloud/gamma-slides',revision:'e2f999677748f1630fcd3f6ab0d4c45734e26be0',evidence:[],limitations:[]};
  try{await assert.rejects(presentRepository({output:dir,deck:'presentations/repository-review.yaml'},{inspect:async()=>brief,verify:async()=>({passed:false,errors:['fixture failure'],viewports:[]}),log:()=>{}}),/Hosting withheld/);assert.equal(readlinkSync(join(dir,'site')),'old');assert.equal(readFileSync(join(dir,'site/index.html'),'utf8'),'old');}finally{rmSync(dir,{recursive:true,force:true});}
});
test('Pages preserves other configurations and verifies both HTML and proof',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'gamma-publish-test-'));const html=Buffer.from('<h1>review</h1>');const proof=Buffer.from(JSON.stringify({validation:{passed:true},htmlSha256:createHash('sha256').update(html).digest('hex')}));writeFileSync(join(dir,'index.html'),html);writeFileSync(join(dir,'proof.json'),proof);
  try{
    await assert.rejects(publishRepositoryPresentation({siteDir:dir,repo:'o/r'},{api:()=>({build_type:'workflow'})}),/another Pages/);
    const calls=[];const api=(path,method='GET',body)=>{calls.push({path,method,body});if(path.endsWith('/pages'))return {source:{branch:'gh-pages',path:'/'},html_url:'https://o.github.io/r/'};if(path.includes('.nojekyll'))return {type:'file'};if(path.includes('/git/ref/'))return {object:{sha:'head'}};if(path.endsWith('/git/commits/head'))return {tree:{sha:'old-tree'}};return {sha:'new-sha'};};
    const fetched=[];const result=await publishRepositoryPresentation({siteDir:dir,repo:'o/r'},{api,fetcher:async url=>{fetched.push(url);return {ok:true,arrayBuffer:async()=>url.includes('proof.json')?proof:html};},log:()=>{},attempts:1});assert.equal(result.verified,true);assert.equal(fetched.length,2);assert.equal(calls.find(c=>c.path.endsWith('/git/trees')).body.base_tree,'old-tree');assert.equal(calls.find(c=>c.method==='PATCH').body.force,false);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('autonomous author workflow repairs once, pins the retry and promotes only the accepted build',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'gamma-author-test-'));const source=readFileSync('presentations/repository-review.yaml');
  const brief={repository:'hbfs-cloud/gamma-slides',revision:'e2f999677748f1630fcd3f6ab0d4c45734e26be0',collectedAt:'2026-09-09T08:52:35Z',evidence:[],limitations:[]};
  let authors=0,checks=0;const refs=[];
  try{
    const result=await presentRepository({repo:brief.repository,output:dir},{inspect:async opts=>{refs.push(opts.ref);return brief;},author:async(binary,args,{cwd})=>{assert.equal(binary,'codex');assert.ok(args.includes('--sandbox'));authors++;writeFileSync(join(cwd,'deck.yaml'),source);},verify:async()=>({passed:++checks===2,checkedAt:'now',errors:checks===1?['fixture check']:[],viewports:[]}),log:()=>{}});
    assert.equal(authors,2);assert.equal(refs[1],brief.revision);assert.equal(result.receipt.validation.passed,true);assert.equal(readFileSync(join(dir,'site/index.html'),'utf8').includes('Archify'),true);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('verified server terminal is opt-in, origin/token protected and keeps HTML bytes unchanged',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gamma-terminal-test-'));writeFileSync(join(dir,'index.html'),'verified bytes');
 const disabled=await serveRepositoryPresentation(dir,{port:0});
 try{assert.equal((await fetch(disabled.url+'__gamma/terminal/session')).status,403);}finally{await new Promise(r=>disabled.server.close(r));}
 const live=await serveRepositoryPresentation(dir,{port:0,terminal:true,cwd:dir});
 try{
  assert.equal(await(await fetch(live.url)).text(),'verified bytes');
  assert.equal((await fetch(live.url+'__gamma/terminal/session',{headers:{Origin:'https://example.com'}})).status,403);
  assert.equal(await new Promise((resolve,reject)=>{const req=httpRequest(live.url+'__gamma/terminal/session',{headers:{Host:'evil.test'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();}),403);
  assert.equal((await fetch(live.url+'__gamma/terminal',{method:'POST',body:'{"command":"pwd"}'})).status,403);
  const session=await(await fetch(live.url+'__gamma/terminal/session')).json();
  const run=command=>fetch(live.url+'__gamma/terminal',{method:'POST',headers:{'Content-Type':'application/json','X-Gamma-Token':session.token},body:JSON.stringify({command})});
  const pwd=await(await run('pwd')).json();assert.equal(pwd.stdout.trim(),pwd.cwd);assert.ok(pwd.cwd.endsWith(dir.split('/').at(-1)));
  assert.equal((await run('')).status,400);assert.equal((await run('exit 7')).status,422);
 }finally{await new Promise(r=>live.server.close(r));rmSync(dir,{recursive:true,force:true});}
});
