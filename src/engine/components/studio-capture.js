/** Shared recording engine; UI and permissions stay with Presenter Studio. */
async function startStudioCapture(h) {
  const {state,camera,recordingBadge,actionButton,readiness,showNotice,openWizard,openRecordingReview,clearLastRecording,releaseRecordingResources,stopRecording,syncPauseUI}=h;
  if(['starting','recording','paused','countdown','finalizing'].includes(state.phase))return;
  if(state.lastRecording&&!state.lastRecording.saved){openRecordingReview('Conservez ou supprimez la prise précédente avant de recommencer.');return;}
  if(!readiness().screenReady){showNotice('Choisissez la source à enregistrer dans Studio.','error');return;}
  if((state.options.captureMode||'clean')==='clean'&&state.displayStream?.getVideoTracks()[0]?.getCaptureHandle?.()?.handle!==window.__gammaCleanHandle){showNotice('Source refusée : sélectionnez uniquement l’onglet SORTIE VIDÉO.','error');return;}
  if(state.lastRecording)clearLastRecording();state.phase='starting';actionButton('record').classList.add('is-starting');
  const emit=()=>window.dispatchEvent(new Event('gamma:studio-state'));
  try {
    const track=state.displayStream.getVideoTracks()[0],screenVideo=document.createElement('video');screenVideo.srcObject=state.displayStream;screenVideo.muted=true;screenVideo.playsInline=true;await screenVideo.play();
    const sourceWidth=screenVideo.videoWidth||track.getSettings().width||1920,sourceHeight=screenVideo.videoHeight||track.getSettings().height||1080;
    const profile=state.options.output||'source',ratio=sourceWidth/sourceHeight,even=n=>Math.max(2,Math.round(n/2)*2);
    const dimensions=profile==='portrait'?[1080,1920]:profile==='landscape'?[1920,1080]:profile==='square'?[1080,1080]:ratio>=1?[even(Math.min(1920,sourceWidth)),even(Math.min(1920,sourceWidth)/ratio)]:[even(Math.min(1920,sourceHeight)*ratio),even(Math.min(1920,sourceHeight))];
    const canvas=document.createElement('canvas');[canvas.width,canvas.height]=dimensions;const ctx=canvas.getContext('2d');
    const captureHandle=track.getCaptureHandle?.()?.handle;
    const ownTab=captureHandle?captureHandle===window.__gammaCaptureHandle||captureHandle===window.__gammaCleanHandle:state.options.captureMode!=='external';
    const cameraVideo=camera.querySelector('video');
    const draw=()=>{
      const w=screenVideo.videoWidth||sourceWidth,h=screenVideo.videoHeight||sourceHeight,scale=Math.min(canvas.width/w,canvas.height/h),width=w*scale,height=h*scale;
      ctx.fillStyle='#05070A';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(screenVideo,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
      if(!ownTab&&state.options.camera&&cameraVideo.readyState>=2&&state.mediaStream?.getVideoTracks().some(t=>t.readyState==='live'&&t.enabled)){
        const rect=camera.getBoundingClientRect(),cw=Math.min(canvas.width,Math.max(80,rect.width/innerWidth*canvas.width)),ch=cw*rect.height/rect.width,x=Math.max(0,Math.min(canvas.width-cw,rect.left/innerWidth*canvas.width)),y=Math.max(0,Math.min(canvas.height-ch,rect.top/innerHeight*canvas.height));
        ctx.save();ctx.beginPath();ctx.roundRect(x,y,cw,ch,12);ctx.clip();ctx.translate(x+cw,y);ctx.scale(-1,1);ctx.drawImage(cameraVideo,0,0,cw,ch);ctx.restore();
      }
    };
    draw();const canvasStream=canvas.captureStream(30),Context=window.AudioContext||window.webkitAudioContext,audioContext=new Context({sampleRate:48000});await audioContext.resume();
    const destination=audioContext.createMediaStreamDestination();let microphoneSource=null;
    const connectMicrophone=()=>{microphoneSource?.disconnect();microphoneSource=null;const t=state.mediaStream?.getAudioTracks().find(t=>t.readyState==='live');if(t){microphoneSource=audioContext.createMediaStreamSource(new MediaStream([t]));microphoneSource.connect(destination);}};
    if(state.options.systemAudio)state.displayStream.getAudioTracks().forEach(t=>audioContext.createMediaStreamSource(new MediaStream([t])).connect(destination));
    connectMicrophone();const combined=new MediaStream([...canvasStream.getVideoTracks(),...destination.stream.getAudioTracks()]);
    // Source video callbacks follow incoming capture frames; interval also keeps
    // composition current when the browser defers a video callback.
    const drawTimer=setInterval(draw,1000/30);let videoCallback;
    const drawVideo=()=>{draw();videoCallback=screenVideo.requestVideoFrameCallback?.(drawVideo);};videoCallback=screenVideo.requestVideoFrameCallback?.(drawVideo);
    state.recordingResources={canvasStream,audioContext,combined,connectMicrophone,dimensions,ownTab,dispose(){clearInterval(drawTimer);if(videoCallback)screenVideo.cancelVideoFrameCallback?.(videoCallback);screenVideo.pause();screenVideo.srcObject=null;microphoneSource?.disconnect();}};
    const mimeType=['video/mp4;codecs=avc1.42001E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
    state.chunks=[];state.recorder=new MediaRecorder(combined,{...(mimeType?{mimeType}:{}),videoBitsPerSecond:12000000,audioBitsPerSecond:192000});
    state.recorder.ondataavailable=e=>{if(e.data.size)state.chunks.push(e.data);};state.recorder.onpause=()=>{syncPauseUI(true);emit();};state.recorder.onresume=()=>{syncPauseUI(false);emit();};
    state.recorder.onerror = e=>{showNotice('Erreur d’enregistrement : '+(e.error?.message||'capture interrompue'),'error');stopRecording();};
    state.recorder.onstop=async()=>{
      const mime=state.recorder.mimeType||mimeType||'video/webm',blob=new Blob(state.chunks,{type:mime}),extension=mime.includes('mp4')?'mp4':'webm';
      const durationMs=Date.now()-state.recordStartedAt-state.pausedTotal-(state.pausedAt?Date.now()-state.pausedAt:0);
      await releaseRecordingResources();state.recorder=null;recordingBadge.querySelectorAll('button').forEach(b=>b.disabled=false);
      if(!blob.size){showNotice('Prise vide. Choisissez à nouveau la source puis réessayez.','error');emit();return;}
      state.lastRecording={blob,filename:'gamma-presentation-'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+extension,url:URL.createObjectURL(blob),saved:false,dimensions,durationMs,audio:true};
      openRecordingReview('Prise conservée dans cette page. Vérifiez la vidéo avant de l’enregistrer.');emit();
    };
    track.addEventListener('capturehandlechange',()=>{if((state.options.captureMode||'clean')==='clean'&&track.getCaptureHandle?.()?.handle!==window.__gammaCleanHandle){showNotice('La sortie vidéo a changé. La prise est arrêtée pour protéger son contenu.','error');stopRecording();}},{once:true});
    track.addEventListener('ended',()=>{showNotice('Partage terminé. Finalisation de la prise.');stopRecording();},{once:true});
    state.recorder.start(250);state.phase='recording';state.recordStartedAt=Date.now();state.pausedTotal=0;state.pausedAt=0;
    state.recordTimer=setInterval(()=>{const seconds=Math.max(0,Math.floor((Date.now()-state.recordStartedAt-state.pausedTotal-(state.phase==='paused'?Date.now()-state.pausedAt:0))/1000));recordingBadge.querySelector('b').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');emit();},250);
    recordingBadge.classList.add('is-visible');recordingBadge.querySelector('.gamma-record-state').textContent='Enregistrement';actionButton('record').classList.remove('is-starting');actionButton('record').classList.add('is-recording');emit();
  }catch(error){await releaseRecordingResources();state.recorder=null;showNotice('Enregistrement impossible : '+error.message,'error');emit();}
}
export const studioCaptureJS=()=>startStudioCapture.toString();
