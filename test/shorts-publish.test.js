import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {validateUpload,publicationDecision,verifiedPublic,youtubeText} from '../src/shorts/publish.js';
test('publication never repeats a completed or uncertain insert',()=>{
 assert.equal(publicationDecision(undefined,'hash'),'upload');
 assert.equal(publicationDecision({hash:'hash',videoId:'id'},'hash'),'verify');
 for(const state of ['uncertain','upload_pending'])assert.equal(publicationDecision({hash:'hash',state},'hash'),'reconcile');
 assert.throws(()=>publicationDecision({hash:'old',videoId:'id'},'new'),/ASSET_CHANGED/);
});
test('remote verification requires target channel, public, processed and HD',()=>{
 const v={snippet:{channelId:'channel'},status:{privacyStatus:'public',uploadStatus:'processed'},processingDetails:{processingStatus:'succeeded'},contentDetails:{definition:'hd'}};
 assert.equal(verifiedPublic(v,'channel'),true);assert.equal(verifiedPublic(v,'other'),false);
 for(const [group,key,value] of [['status','privacyStatus','private'],['status','uploadStatus','uploaded'],['processingDetails','processingStatus','processing'],['contentDetails','definition','sd']]){
  const copy=structuredClone(v);copy[group][key]=value;assert.equal(verifiedPublic(copy,'channel'),false);
 }
});
test('upload validates current media bytes and preserves strict inequalities in YouTube text',()=>{
 const dir=mkdtempSync(join(tmpdir(),'short-publish-test-'));
 try{
  writeFileSync(join(dir,'short.mp4'),'reviewed bytes');
  const receipt={passed:true,duration:29,frames:870,width:1080,height:1920,videoHash:createHash('sha256').update('reviewed bytes').digest('hex')};
  writeFileSync(join(dir,'receipt.json'),JSON.stringify(receipt));
  writeFileSync(join(dir,'youtube.json'),JSON.stringify({title:'HPE',description:'C < ask ≤ cap\nhttps://dailytickers.substack.com'}));
  assert.equal(validateUpload(dir).meta.description.includes('<'),false);
  assert.match(youtubeText('price > stop'),/greater than/);
  writeFileSync(join(dir,'short.mp4'),'different bytes');assert.throws(()=>validateUpload(dir),/HASH_MISMATCH/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
