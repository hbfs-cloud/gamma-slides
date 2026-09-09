import { execFileSync } from 'node:child_process';
import { realpathSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { githubRepository } from './inspect.js';

function github(path,method='GET',body) {
  const args=['api',path,'--method',method];
  if(body)args.push('--input','-');
  return JSON.parse(execFileSync('gh',args,{input:body?JSON.stringify(body):undefined,encoding:'utf8',maxBuffer:24*1024*1024,timeout:30_000}));
}
function optional(read) {try{return read();}catch(error){if(/HTTP 404/.test(error.stderr?.toString()||error.message))return null;throw error;}}

/** Publish the tested HTML bytes, not a YAML that a different remote renderer might rebuild. */
export async function publishRepositoryPresentation({siteDir,repo,slug='repository-review'}, {api=github,fetcher=fetch,log=console.log,wait=ms=>new Promise(r=>setTimeout(r,ms)),attempts=24}={}) {
  repo=githubRepository(repo);
  if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug))throw new Error('Publication slug must use lowercase letters, digits and hyphens.');
  siteDir=realpathSync(siteDir);
  const proofBytes=readFileSync(join(siteDir,'proof.json')),proof=JSON.parse(proofBytes),html=readFileSync(join(siteDir,'index.html'));
  const proofHash=createHash('sha256').update(proofBytes).digest('hex');
  if(!proof.validation?.passed||proof.htmlSha256!==createHash('sha256').update(html).digest('hex'))throw new Error('Publication requires a passed receipt matching the exact HTML bytes.');
  const pages=optional(()=>api(`repos/${repo}/pages`));
  if(pages&&(pages.build_type==='workflow'||pages.source?.branch!=='gh-pages'||pages.source?.path!=='/'))throw new Error('This repository has another Pages configuration. Use a dedicated Pages repository; existing hosting is preserved.');
  if(pages&&!optional(()=>api(`repos/${repo}/contents/.nojekyll?ref=gh-pages`)))throw new Error('Existing Pages site uses Jekyll. Choose a dedicated static Pages repository to preserve its rendering.');
  const ref=optional(()=>api(`repos/${repo}/git/ref/heads/gh-pages`));
  let parent=null,tree=null;
  if(ref){parent=ref.object.sha;tree=api(`repos/${repo}/git/commits/${parent}`).tree.sha;}
  else {const metadata=api(`repos/${repo}`);const head=optional(()=>api(`repos/${repo}/git/ref/heads/${encodeURIComponent(metadata.default_branch)}`));if(!head)throw new Error('Initialize the target repository with a README commit before publishing.');parent=head.object.sha;}
  const entries=[];
  for(const [path,content] of [[`${slug}/index.html`,html],[`${slug}/proof.json`,proofBytes],['.nojekyll',Buffer.from('')]]) {
    const blob=api(`repos/${repo}/git/blobs`,'POST',{content:content.toString('base64'),encoding:'base64'});
    entries.push({path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const nextTree=api(`repos/${repo}/git/trees`,'POST',{...(tree?{base_tree:tree}:{}),tree:entries});
  const commit=api(`repos/${repo}/git/commits`,'POST',{message:`slides: publish verified ${slug}`,tree:nextTree.sha,parents:[parent]});
  if(ref)api(`repos/${repo}/git/refs/heads/gh-pages`,'PATCH',{sha:commit.sha,force:false});
  else api(`repos/${repo}/git/refs`,'POST',{ref:'refs/heads/gh-pages',sha:commit.sha});
  const configured=pages||api(`repos/${repo}/pages`,'POST',{source:{branch:'gh-pages',path:'/'}});
  const base=configured.html_url||`https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/`;
  const url=new URL(`${slug}/`,base.endsWith('/')?base:base+'/').href;
  log(`Pages build requested: ${url}`);
  for(let attempt=0;attempt<attempts;attempt++) {
    try {
      const response=await fetcher(`${url}index.html?verify=${commit.sha}`,{signal:AbortSignal.timeout(15_000),cache:'no-store'});
      const receiptResponse=await fetcher(`${url}proof.json?verify=${commit.sha}`,{signal:AbortSignal.timeout(15_000),cache:'no-store'});
      if(response.ok&&receiptResponse.ok&&createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')===proof.htmlSha256&&createHash('sha256').update(Buffer.from(await receiptResponse.arrayBuffer())).digest('hex')===proofHash)return {url,commit:commit.sha,verified:true,htmlSha256:proof.htmlSha256};
    }catch{/* A pending Pages build is retried within the bounded window. */}
    if(attempt+1<attempts)await wait(5000);
  }
  throw new Error(`Pages commit ${commit.sha} was published, but the live HTML hash has not been verified yet: ${url}. Do not report this as a working deployment; inspect the Pages build.`);
}
