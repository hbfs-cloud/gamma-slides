/** Shared recording engine; permission and presentation UI stay with Presenter Studio. */
async function startStudioCapture(h) {
  const { state, camera, recordingBadge, actionButton, readiness, showNotice,
    openRecordingReview, clearLastRecording, releaseRecordingResources,
    stopRecording, syncPauseUI } = h;
  if (['starting', 'recording', 'paused', 'countdown', 'finalizing'].includes(state.phase)) return;
  if (state.lastRecording && !state.lastRecording.saved) {
    openRecordingReview('Keep or delete the previous take before starting again.'); return;
  }
  if (!readiness().screenReady) { showNotice('Choose the recording source in Studio.', 'error'); return; }
  const track = state.displayStream.getVideoTracks()[0];
  if ((state.options.captureMode || 'clean') === 'clean' && track.getCaptureHandle?.()?.handle !== window.__gammaCleanHandle) {
    showNotice('Source rejected: select only the VIDEO OUTPUT tab.', 'error'); return;
  }
  if (state.lastRecording) clearLastRecording();
  state.phase = 'starting'; actionButton('record').classList.add('is-starting');
  const emit = () => window.dispatchEvent(new Event('gamma:studio-state'));
  let writer, mixer, screenVideo, drawTimer, videoCallback, canvasStream;
  const stems = [];
  const duration = () => Math.max(0, Date.now() - state.recordStartedAt - state.pausedTotal - (state.pausedAt ? Date.now() - state.pausedAt : 0));
  try {
    if (!window.__gammaTakeStore || !window.__gammaAudioMixer) throw new Error('Studio storage or audio mixing is unavailable.');
    screenVideo = document.createElement('video');
    screenVideo.srcObject = state.displayStream; screenVideo.muted = true; screenVideo.playsInline = true;
    await screenVideo.play();
    const sourceWidth = screenVideo.videoWidth || track.getSettings().width;
    const sourceHeight = screenVideo.videoHeight || track.getSettings().height;
    const profile = state.options.output || 'source', ratio = sourceWidth / sourceHeight;
    const even = n => Math.max(2, Math.floor(n / 2) * 2);
    const dimensions = profile === 'portrait' ? [1080, 1920] : profile === 'landscape' ? [1920, 1080] : profile === 'square' ? [1080, 1080] : ratio >= 1
      ? [even(Math.min(1920, sourceWidth)), even(Math.min(1920, sourceWidth) / ratio)]
      : [even(Math.min(1920, sourceHeight) * ratio), even(Math.min(1920, sourceHeight))];
    if (!sourceWidth || !sourceHeight) throw new Error('The video source did not provide dimensions.');
    if (sourceWidth < dimensions[0] || sourceHeight < dimensions[1]) {
      throw new Error('Source ' + sourceWidth + ' × ' + sourceHeight + ' is too small for ' + dimensions.join(' × ') + '. Enlarge output or choose Source dimensions.');
    }
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = dimensions;
    const ctx = canvas.getContext('2d');
    const handle = track.getCaptureHandle?.()?.handle;
    const ownTab = handle ? handle === window.__gammaCaptureHandle || handle === window.__gammaCleanHandle : state.options.captureMode !== 'external';
    const cameraVideo = camera.querySelector('video');
    let sourceTooSmall = false, storageError = null;
    const draw = () => {
      const w = screenVideo.videoWidth || sourceWidth, height = screenVideo.videoHeight || sourceHeight;
      if (w < canvas.width || height < canvas.height) {
        if (!sourceTooSmall) {
          sourceTooSmall = true;
          showNotice('The source dropped below the selected resolution. The take stopped without artificial upscaling.', 'error');
          stopRecording();
        }
        return;
      }
      const scale = Math.min(canvas.width / w, canvas.height / height), dw = w * scale, dh = height * scale;
      ctx.fillStyle = '#05070A'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(screenVideo, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      if (!ownTab && state.options.camera && camera.classList.contains('is-visible') && cameraVideo.readyState >= 2 && state.mediaStream?.getVideoTracks().some(t => t.readyState === 'live' && t.enabled)) {
        const rect = camera.getBoundingClientRect();
        const cw = Math.min(canvas.width, Math.max(80, rect.width / innerWidth * canvas.width)), ch = cw * rect.height / rect.width;
        const x = Math.max(0, Math.min(canvas.width - cw, rect.left / innerWidth * canvas.width)), y = Math.max(0, Math.min(canvas.height - ch, rect.top / innerHeight * canvas.height));
        ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 12); ctx.clip();
        ctx.translate(x + cw, y); ctx.scale(-1, 1); ctx.drawImage(cameraVideo, 0, 0, cw, ch); ctx.restore();
      }
    };
    draw(); canvasStream = canvas.captureStream(30);
    mixer = await window.__gammaAudioMixer.create({
      microphone: state.mediaStream,
      shared: state.options.systemAudio ? state.displayStream : null,
      micGain: state.options.micGain, sharedGain: state.options.sharedGain, ducking: state.options.ducking,
    });
    const combined = new MediaStream([...canvasStream.getVideoTracks(), ...mixer.stream.getAudioTracks()]);
    drawTimer = setInterval(draw, 1000 / 30);
    const drawVideo = () => { draw(); videoCallback = screenVideo.requestVideoFrameCallback?.(drawVideo); };
    videoCallback = screenVideo.requestVideoFrameCallback?.(drawVideo);
    state.recordingResources = {
      canvasStream, audioContext: mixer.context, mixer, combined, dimensions, ownTab,
      connectMicrophone: () => mixer.setMicrophone(state.mediaStream),
      dispose() {
        clearInterval(drawTimer);
        if (videoCallback) screenVideo.cancelVideoFrameCallback?.(videoCallback);
        screenVideo.pause(); screenVideo.srcObject = null;
        mixer.dispose();
      },
    };
    const mimeType = ['video/mp4;codecs=avc1.42001E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    state.chunks = []; // Compatibility only: encoded fragments are never retained here.
    const recorder = new MediaRecorder(combined, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 12000000, audioBitsPerSecond: 192000, videoKeyFrameIntervalDuration: 1000 });
    state.recorder = recorder;
    const mime = recorder.mimeType || mimeType || 'video/webm', extension = mime.includes('mp4') ? 'mp4' : 'webm';
    const filename = 'gamma-presentation-' + new Date().toISOString().replace(/[:.]/g, '-') + '.' + extension;
    writer = await window.__gammaTakeStore.create({ mime, filename, dimensions, audio: true });
    state.recordingResources.writer = writer;
    state.storageStatus = { id: writer.id, bytes: 0, pendingBytes: 0 };
    const failStorage = error => {
      if (storageError) return;
      storageError = error;
      state.storageStatus.error = error.message || error.name;
      showNotice('Write interrupted: ' + (error.name === 'QuotaExceededError' ? 'local storage is full.' : error.message) + ' Already-recorded segments can be recovered in Studio.', 'error');
      stopRecording(); emit();
    };
    if (state.options.audioStems) {
      const stemMime = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      if (!stemMime) throw new Error('This browser does not support separate audio tracks. Disable this option to record the mix.');
      const roles = ['mic', ...(state.options.systemAudio && state.displayStream.getAudioTracks().length ? ['shared'] : [])];
      for (const role of roles) {
        const label = role === 'mic' ? 'Voice' : 'Media', suffix = stemMime.includes('mp4') ? 'm4a' : 'webm';
        const stemWriter = await window.__gammaTakeStore.create({
          parentId: writer.id, role, label, mime: stemMime, filename: filename.replace(/\.[^.]+$/, '') + '-' + (role === 'mic' ? 'voix' : 'medias') + '.' + suffix,
          dimensions: null, audio: true,
        });
        const stemRecorder = new MediaRecorder(mixer.stems[role], { mimeType: stemMime, audioBitsPerSecond: 192000 });
        const stem = { writer: stemWriter, recorder: stemRecorder, role };
        stem.finished = new Promise(resolve => {
          stemRecorder.onstop = async () => {
            try { resolve(await stemWriter.finish({ durationMs: duration() })); }
            catch (error) { failStorage(error); resolve(null); }
          };
        });
        stemRecorder.ondataavailable = event => {
          if (event.data.size) stemWriter.append(event.data, { durationMs: duration() }).catch(failStorage);
        };
        stemRecorder.onerror = event => failStorage(event.error || new Error('An audio track was interrupted.'));
        stems.push(stem);
      }
    }
    recorder.ondataavailable = e => {
      if (!e.data.size || storageError) return;
      const write = writer.append(e.data, { durationMs: duration() });
      state.storageStatus.pendingBytes = writer.pendingBytes;
      write.then(take => { state.storageStatus.bytes = take.size; state.storageStatus.pendingBytes = writer.pendingBytes; emit(); }).catch(failStorage);
    };
    recorder.onpause = () => {
      syncPauseUI(true);
      for (const stem of stems) if (stem.recorder.state === 'recording') stem.recorder.pause();
      emit();
    };
    recorder.onresume = () => {
      syncPauseUI(false);
      for (const stem of stems) if (stem.recorder.state === 'paused') stem.recorder.resume();
      emit();
    };
    recorder.onerror = e => { showNotice('Recording error: ' + (e.error?.message || 'capture interrupted'), 'error'); stopRecording(); };
    recorder.onstop = async () => {
      const durationMs = duration();
      let take;
      try {
        for (const stem of stems) if (stem.recorder.state !== 'inactive') stem.recorder.stop();
        await Promise.all(stems.map(stem => stem.finished));
        take = await writer.finish({ durationMs, status: sourceTooSmall || storageError ? 'interrupted' : 'complete', error: storageError?.message || storageError?.name });
        state.storageStatus = { id: take.id, bytes: take.size, pendingBytes: 0, ...(take.error ? { error: take.error } : {}) };
      } catch (error) {
        showNotice('Finalization interrupted: ' + error.message + '. Recover retained segments in Studio.', 'error');
        try { take = await window.__gammaTakeStore.get(writer.id); } catch {}
      } finally {
        try { await releaseRecordingResources(); }
        catch (error) { showNotice('Sources stopped; check the retained take: ' + error.message, 'error'); }
        state.recorder = null;
        recordingBadge.querySelectorAll('button').forEach(button => button.disabled = false);
        emit();
      }
      if (!take?.size) {
        showNotice('Empty take. Choose the source again and retry.', 'error'); emit(); return;
      }
      let blob = null;
      if (take.size <= window.__gammaTakeStore.previewLimit) {
        try { blob = await window.__gammaTakeStore.toBlob(take.id); }
        catch (error) { showNotice('The take remains on disk; preview unavailable: ' + error.message, 'error'); }
      }
      state.lastRecording = {
        storageId: take.id, size: take.size, mime, filename, blob,
        url: blob ? URL.createObjectURL(blob) : null, durableOnly: !blob,
        saved: false, dimensions, durationMs: take.durationMs, audio: true,
      };
      openRecordingReview(storageError ? 'Take interrupted. Written segments are retained; check the recovered video.' : 'Take retained in this browser and recoverable after reload. Save a copy to disk.');
      emit();
    };
    track.addEventListener('capturehandlechange', () => {
      if ((state.options.captureMode || 'clean') === 'clean' && track.getCaptureHandle?.()?.handle !== window.__gammaCleanHandle) {
        showNotice('Video output changed. The take stopped to protect its content.', 'error'); stopRecording();
      }
    }, { once: true });
    track.addEventListener('ended', () => { showNotice('Sharing ended. Finalizing take.'); stopRecording(); }, { once: true });
    state.recordStartedAt = Date.now(); state.pausedTotal = 0; state.pausedAt = 0;
    for (const stem of stems) stem.recorder.start(1000);
    recorder.start(1000); state.phase = 'recording';
    state.recordTimer = setInterval(() => {
      const seconds = Math.floor(duration() / 1000);
      recordingBadge.querySelector('b').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); emit();
    }, 250);
    recordingBadge.classList.add('is-visible'); recordingBadge.querySelector('.gamma-record-state').textContent = 'Recording';
    actionButton('record').classList.remove('is-starting'); actionButton('record').classList.add('is-recording'); emit();
  } catch (error) {
    for (const stem of stems) {
      if (stem.recorder.state !== 'inactive') stem.recorder.stop();
      else await stem.writer.finish({ status: 'interrupted', error: error.message }).catch(() => {});
    }
    await writer?.finish({ status: 'interrupted', error: error.message }).catch(() => {});
    clearInterval(drawTimer);
    if (videoCallback) screenVideo?.cancelVideoFrameCallback?.(videoCallback);
    canvasStream?.getTracks().forEach(t => t.stop());
    await mixer?.dispose();
    if (screenVideo) { screenVideo.pause(); screenVideo.srcObject = null; }
    await releaseRecordingResources(); state.recorder = null;
    showNotice('Unable to record: ' + error.message, 'error'); emit();
  }
}
export const studioCaptureJS = () => startStudioCapture.toString();
