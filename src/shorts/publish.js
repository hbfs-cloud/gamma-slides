/** Publish reviewed Shorts with durable receipts; uncertain inserts require reconciliation. */
import {readFileSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {google} from 'googleapis';
import {getAuthenticatedClient} from '../youtube/auth.js';
import {uploadVideoResumable} from '../youtube/upload.js';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,value)=>{writeFileSync(p+'.partial',JSON.stringify(value,null,2)+'\n');renameSync(p+'.partial',p);};
export const youtubeText=text=>String(text).replace(/</g,' less than ').replace(/>/g,' greater than ');
export function validateUpload(folder){
 const receipt=read(join(folder,'receipt.json')),meta=read(join(folder,'youtube.json'));
 if(typeof meta.title!=='string'||typeof meta.description!=='string')throw Error('INVALID_METADATA');
 meta.title=youtubeText(meta.title);meta.description=youtubeText(meta.description);
 const videoPath=join(folder,'short.mp4');
 const hash=createHash('sha256').update(readFileSync(videoPath)).digest('hex');
 if(!receipt.passed||!Number.isFinite(receipt.duration)||receipt.duration<=0||receipt.duration>=30||receipt.frames!==870||receipt.width!==1080||receipt.height!==1920||hash!==receipt.videoHash)throw Error('LOCAL_QA_OR_HASH_MISMATCH');
 if(!meta.title||meta.title.length>100||!meta.description||Buffer.byteLength(meta.description,'utf8')>5000)throw Error('INVALID_METADATA');
 if(!meta.description.includes('https://dailytickers.substack.com')||meta.description.includes('https://articles.dailytickers.com'))throw Error('PROMOTIONAL_LINK_MISMATCH');
 return {receipt,meta,videoPath,hash,tag:'dt-'+hash.slice(0,24)};
}
export function verifiedPublic(video,channelId){
 return video?.snippet?.channelId===channelId&&video.status?.privacyStatus==='public'&&video.status?.uploadStatus==='processed'&&video.processingDetails?.processingStatus==='succeeded'&&video.contentDetails?.definition==='hd';
}
export function publicationDecision(row,hash){
 if(row&&row.hash!==hash)throw Error('PUBLISHED_ASSET_CHANGED');
 if(row?.videoId)return 'verify';
 if(row?.state==='upload_pending'||row?.state==='uncertain')return 'reconcile';
 return 'upload';
}
async function inventory(y,playlistId){
 const ids=[];let cursor;
 do{const r=await y.playlistItems.list({part:['contentDetails'],playlistId,maxResults:50,pageToken:cursor});ids.push(...(r.data.items||[]).map(x=>x.contentDetails.videoId));cursor=r.data.nextPageToken;}while(cursor);
 const videos=[];
 for(let i=0;i<ids.length;i+=50){const r=await y.videos.list({part:['snippet','status','processingDetails','contentDetails'],id:ids.slice(i,i+50)});videos.push(...(r.data.items||[]));}
 return videos;
}
export async function publishBatch(root,{publish=false}={}){
 root=resolve(root);const config=read(join(root,'youtube-publish-config.json'));
 if(!config.channelId)throw Error('TARGET_CHANNEL_REQUIRED');
 const path=join(root,'youtube-publication.json');
 const ledger=existsSync(path)?read(path):{channelId:config.channelId,items:[]};
 if(ledger.channelId!==config.channelId)throw Error('LEDGER_CHANNEL_MISMATCH');
 const auth=await getAuthenticatedClient(),y=google.youtube({version:'v3',auth});
 const channels=(await y.channels.list({part:['contentDetails'],mine:true})).data.items||[];
 const channel=channels.find(x=>x.id===config.channelId);if(!channel)throw Error('TARGET_CHANNEL_MISMATCH');
 let remote=await inventory(y,channel.contentDetails.relatedPlaylists.uploads);
 if(publish){
  const cards=read(join(root,'editorial.json'));const items=Array.isArray(cards)?cards:cards.items;
  const prepared=items.map(c=>({ticker:c.ticker,...validateUpload(join(root,'output',c.ticker))}));
  for(const item of prepared){
   let row=ledger.items.find(x=>x.ticker===item.ticker);
   const action=publicationDecision(row,item.hash);if(action==='verify')continue;
   const matches=remote.filter(x=>x.snippet?.tags?.includes(item.tag));
   if(matches.length>1)throw Error('DUPLICATE_REMOTE_MARKER');
   if(matches.length===1){row||={ticker:item.ticker,hash:item.hash};Object.assign(row,{videoId:matches[0].id,state:'uploaded'});if(!ledger.items.includes(row))ledger.items.push(row);save(path,ledger);continue;}
   if(action==='reconcile')throw Error('UPLOAD_OUTCOME_UNCERTAIN_REVIEW_REQUIRED');
   if(row){ledger.attempts||=[];ledger.attempts.push({...row});Object.assign(row,{state:'upload_pending',startedAt:new Date().toISOString()});}
   else{row={ticker:item.ticker,hash:item.hash,state:'upload_pending',startedAt:new Date().toISOString()};ledger.items.push(row);}
   save(path,ledger);
   try{
    const quietAuth={request:options=>auth.request({...options,params:options.method==='POST'?{...options.params,notifySubscribers:false}:options.params})};
    const response=await uploadVideoResumable({auth:quietAuth,videoPath:item.videoPath,requestBody:{
     snippet:{title:item.meta.title,description:item.meta.description,tags:[...item.meta.tags,item.tag],categoryId:item.meta.categoryId||'27',defaultLanguage:'en',defaultAudioLanguage:'en'},
     status:{privacyStatus:'public',selfDeclaredMadeForKids:false,containsSyntheticMedia:true}
    }});
    if(!response?.id)throw Error('UPLOAD_ID_MISSING');
    Object.assign(row,{videoId:response.id,state:'uploaded',uploadedAt:new Date().toISOString(),url:'https://www.youtube.com/shorts/'+response.id});save(path,ledger);
    console.log(JSON.stringify({ticker:item.ticker,uploaded:true,videoId:row.videoId}));
   }catch(error){row.state='uncertain';row.errorStatus=error.response?.status||error.code||'UPLOAD_ERROR';row.errorReasons=(error.response?.data?.error?.errors||[]).map(x=>x.reason).filter(x=>/^[A-Za-z]+$/.test(x));save(path,ledger);throw Error('UPLOAD_OUTCOME_UNCERTAIN_REVIEW_REQUIRED');}
  }
 }
 const ids=ledger.items.map(x=>x.videoId).filter(Boolean);remote=[];
 for(let i=0;i<ids.length;i+=50){remote.push(...((await y.videos.list({part:['snippet','status','processingDetails','contentDetails'],id:ids.slice(i,i+50)})).data.items||[]));}
 for(const row of ledger.items){const v=remote.find(x=>x.id===row.videoId);row.verified=verifiedPublic(v,config.channelId);row.remoteStatus=v?{privacy:v.status?.privacyStatus,upload:v.status?.uploadStatus,processing:v.processingDetails?.processingStatus,definition:v.contentDetails?.definition,duration:v.contentDetails?.duration}:null;row.checkedAt=new Date().toISOString();row.url=row.videoId?'https://www.youtube.com/shorts/'+row.videoId:undefined;if(row.verified)row.state='verified';}
 ledger.checkedAt=new Date().toISOString();save(path,ledger);
 console.log(JSON.stringify({total:ledger.items.length,verified:ledger.items.filter(x=>x.verified).length}));return ledger;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv[2])throw Error('Usage: node src/shorts/publish.js batch-directory [--publish]');
 try{await publishBatch(process.argv[2],{publish:process.argv.includes('--publish')});}
 catch(e){console.error(JSON.stringify({failed:true,reason:/^[A-Z_]+$/.test(e.message)?e.message:'YOUTUBE_OPERATION_FAILED',status:e.response?.status||e.code||null}));process.exitCode=1;}
}
