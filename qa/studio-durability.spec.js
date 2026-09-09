import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { studioStorageJS } from '../src/engine/components/studio-storage.js';
import { studioAudioJS } from '../src/engine/components/studio-audio.js';
import { studioCaptureJS } from '../src/engine/components/studio-capture.js';

let server, url;
const evidence = resolve('output/studio-durability');
test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  const html = '<!doctype html><title>Studio durability</title><body><script>' + studioStorageJS() + studioAudioJS() + 'window.startStudioCapture=' + studioCaptureJS() + ';</script>';
  server = createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = 'http://127.0.0.1:' + server.address().port;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

test('recording prefix survives a real renderer crash and recovers playable video + audio', async ({ page, context }) => {
  test.setTimeout(45000);
  await page.goto(url);
  const info = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext('2d'); let frame = 0;
    const draw = () => { ctx.fillStyle = '#193a70'; ctx.fillRect(0, 0, 640, 360); ctx.fillStyle = '#ffbc14'; ctx.fillRect((frame++ * 4) % 600, 140, 40, 60); };
    draw(); window.drawTimer = setInterval(draw, 33);
    const source = new AudioContext(), oscillator = source.createOscillator(), dest = source.createMediaStreamDestination();
    oscillator.frequency.value = 440; oscillator.connect(dest); oscillator.start(); await source.resume();
    const mixer = await __gammaAudioMixer.create({ microphone: dest.stream });
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...mixer.stream.getAudioTracks()]);
    const mime = ['video/mp4;codecs=avc1.42001E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus'].find(type => MediaRecorder.isTypeSupported(type));
    const writer = await __gammaTakeStore.create({ filename: mime.includes('mp4') ? 'crash-recovery.mp4' : 'crash-recovery.webm', mime, dimensions: [640, 360] });
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2000000, videoKeyFrameIntervalDuration: 1000 });
    const start = Date.now(); recorder.ondataavailable = event => writer.append(event.data, { durationMs: Date.now() - start });
    window.activeRecorder = recorder; recorder.start(750);
    return { id: writer.id, mime };
  });
  await expect.poll(() => page.evaluate(async id => (await __gammaTakeStore.get(id)).chunks, info.id), { timeout: 12000 }).toBeGreaterThanOrEqual(4);
  const before = await page.evaluate(id => __gammaTakeStore.get(id), info.id);
  const crash = page.waitForEvent('crash');
  const cdp = await context.newCDPSession(page);
  cdp.send('Page.crash').catch(() => {});
  await crash;
  const recovered = await context.newPage(); await recovered.goto(url);
  const after = await recovered.evaluate(id => __gammaTakeStore.get(id), info.id);
  expect(after.size).toBeGreaterThanOrEqual(before.size);
  expect(after.status).toBe('recording');
  expect(after.chunks).toBeGreaterThanOrEqual(4);
  const data = await recovered.evaluate(async id => Array.from(new Uint8Array(await (await __gammaTakeStore.toBlob(id)).arrayBuffer())), info.id);
  const file = resolve(evidence, after.filename); writeFileSync(file, Buffer.from(data));
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }));
  expect(probe.streams.find(s => s.codec_type === 'video').nb_read_frames * 1).toBeGreaterThan(40);
  expect(probe.streams.find(s => s.codec_type === 'audio').nb_read_frames * 1).toBeGreaterThan(20);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-frames:v', '1', resolve(evidence, 'crash-decoded.png')]);
  const playback = await recovered.evaluate(async id => {
    const video = document.createElement('video'); video.muted = true; video.src = URL.createObjectURL(await __gammaTakeStore.toBlob(id)); document.body.append(video);
    await video.play(); await new Promise(resolve => setTimeout(resolve, 500));
    return { width: video.videoWidth, height: video.videoHeight, time: video.currentTime };
  }, info.id);
  expect(playback.width).toBe(640); expect(playback.time).toBeGreaterThan(0.2);
  // Exercise the streaming save contract with an OPFS destination: no Blob
  // assembly is needed for an arbitrarily large take on this path.
  const saved = await recovered.evaluate(async id => {
    const root = await navigator.storage.getDirectory(), handle = await root.getFileHandle('recovered.mp4', { create: true });
    const result = await __gammaTakeStore.save(id, { handle });
    return { result, size: (await handle.getFile()).size };
  }, info.id);
  expect(saved.result.saved).toBe(true); expect(saved.size).toBe(after.size);
  await recovered.evaluate(id => __gammaTakeStore.remove(id), info.id);
  expect(await recovered.evaluate(id => __gammaTakeStore.get(id), info.id)).toBeUndefined();
  writeFileSync(resolve(evidence, 'crash-proof.json'), JSON.stringify({ before, after, probe, playback, saved }, null, 2));
});

test('bounded pending writes reject overload while keeping the durable prefix', async ({ page }) => {
  await page.goto(url);
  const result = await page.evaluate(async () => {
    const writer = await __gammaTakeStore.create({ filename: 'bounds.webm', mime: 'video/webm' }, { maxPendingBytes: 1024, maxPendingChunks: 2 });
    await writer.append(new Blob(['durable prefix']), { durationMs: 750 });
    let error;
    try { await writer.append(new Blob([new Uint8Array(2048)])); } catch (e) { error = e.name; }
    const take = await writer.finish({ durationMs: 9000 });
    return { error, take, pending: writer.pendingBytes, text: await (await __gammaTakeStore.toBlob(writer.id)).text() };
  });
  expect(result.error).toBe('BackpressureError'); expect(result.pending).toBe(0);
  expect(result.take.status).toBe('interrupted'); expect(result.take.durationMs).toBe(750);
  expect(result.text).toBe('durable prefix');
});

test('real browser quota failure preserves committed chunks and reports interruption', async ({ page, context }) => {
  await page.goto(url);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Storage.overrideQuotaForOrigin', { origin: url, quotaSize: 128 * 1024 });
  const id = await page.evaluate(async () => {
    const writer = await __gammaTakeStore.create({ filename: 'quota.webm', mime: 'video/webm' });
    await writer.append(new Blob(['durable before quota']), { durationMs: 1000 }); window.quotaWriter = writer; return writer.id;
  });
  const result = await page.evaluate(async () => {
    let error;
    try { await quotaWriter.append(new Blob([new Uint8Array(1024 * 1024)])); } catch (e) { error = e.name; }
    const take = await quotaWriter.finish();
    return { error, take, text: await (await __gammaTakeStore.toBlob(quotaWriter.id)).text() };
  });
  expect(result.error).toBe('QuotaExceededError'); expect(result.take.status).toBe('interrupted');
  expect(result.text).toBe('durable before quota');
  await page.reload(); expect((await page.evaluate(id => __gammaTakeStore.get(id), id)).chunks).toBe(1);
});

test('audio buses have independent gain, clipping feedback, output ceiling and mic reconnection', async ({ page }) => {
  await page.goto(url);
  await page.evaluate(async () => {
    const source = new AudioContext(); await source.resume();
    const tone = (frequency, amplitude) => { const osc = source.createOscillator(), gain = source.createGain(), dest = source.createMediaStreamDestination(); osc.frequency.value = frequency; gain.gain.value = amplitude; osc.connect(gain); gain.connect(dest); osc.start(); return dest.stream; };
    window.audioFixture = { source, mic: tone(440, 0.2), shared: tone(880, 0.2) };
    window.testMixer = await __gammaAudioMixer.create({ microphone: audioFixture.mic, shared: audioFixture.shared, micGain: 1, sharedGain: 1 });
  });
  await expect.poll(() => page.evaluate(() => testMixer.snapshot().mic)).toBeGreaterThan(0.1);
  await page.evaluate(() => testMixer.setGains({ mic: 0 })); await page.waitForTimeout(250);
  let levels = await page.evaluate(() => testMixer.snapshot());
  expect(levels.mic).toBeLessThan(0.005); expect(levels.shared).toBeGreaterThan(0.1);
  await page.evaluate(() => { testMixer.setGains({ mic: 1, shared: 1 }); testMixer.setDucking(true); });
  await expect.poll(() => page.evaluate(() => testMixer.snapshot().ducked)).toBe(true);
  await page.waitForTimeout(400); levels = await page.evaluate(() => testMixer.snapshot());
  expect(levels.shared).toBeLessThan(0.07);
  await page.evaluate(() => { testMixer.setMicrophone(null); });
  await expect.poll(() => page.evaluate(() => testMixer.snapshot().mic)).toBeLessThan(0.005);
  await page.evaluate(() => testMixer.setMicrophone(audioFixture.mic));
  await expect.poll(() => page.evaluate(() => testMixer.snapshot().mic)).toBeGreaterThan(0.1);
  await page.evaluate(() => {
    const osc = audioFixture.source.createOscillator(), gain = audioFixture.source.createGain(), dest = audioFixture.source.createMediaStreamDestination();
    gain.gain.value = 1.8; osc.connect(gain); gain.connect(dest); osc.start(); testMixer.setDucking(false); testMixer.setMicrophone(dest.stream); testMixer.setGains({ mic: 2, shared: 2 });
  });
  await expect.poll(() => page.evaluate(() => testMixer.snapshot().clipping)).toBe(true);
  levels = await page.evaluate(() => testMixer.snapshot());
  expect(levels.mix).toBeGreaterThan(1); expect(levels.output).toBeLessThanOrEqual(0.98);
  writeFileSync(resolve(evidence, 'audio-proof.json'), JSON.stringify(levels, null, 2));
  await page.evaluate(() => testMixer.dispose());
});

test('capture stops on native quota failure with a playable durable prefix and no chunk array', async ({ page, context }) => {
  test.setTimeout(30000);
  await page.goto(url);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Storage.overrideQuotaForOrigin', { origin: url, quotaSize: 256 * 1024 });
  await page.evaluate(async () => {
    const source = document.createElement('canvas'); source.width = 640; source.height = 360;
    const ctx = source.getContext('2d'); window.noise = false;
    const image = ctx.createImageData(640, 360);
    const draw = () => {
      if (!window.noise) { ctx.fillStyle = '#193a70'; ctx.fillRect(0, 0, 640, 360); }
      else { for (let i = 0; i < image.data.length; i += 4) { image.data[i] = Math.random() * 255; image.data[i + 1] = Math.random() * 255; image.data[i + 2] = Math.random() * 255; image.data[i + 3] = 255; } ctx.putImageData(image, 0, 0); }
    };
    draw(); setInterval(draw, 33);
    const camera = document.createElement('div'); camera.innerHTML = '<video></video>';
    const badge = document.createElement('div'); badge.innerHTML = '<span class="gamma-record-state"></span><b></b><button></button>';
    const button = document.createElement('button'); document.body.append(camera, badge, button);
    const state = window.captureState = { phase: 'ready', options: { captureMode: 'external', output: 'source' }, displayStream: source.captureStream(30), mediaStream: new MediaStream() };
    window.captureNotices = [];
    const release = async () => { state.recordingResources?.dispose(); state.displayStream?.getTracks().forEach(t => t.stop()); state.recordingResources?.canvasStream.getTracks().forEach(t => t.stop()); clearInterval(state.recordTimer); state.recordingResources = null; state.phase = 'ready'; };
    const stop = () => { if (state.recorder?.state === 'recording') { state.phase = 'finalizing'; state.recorder.stop(); } };
    await startStudioCapture({ state, camera, recordingBadge: badge, actionButton: () => button, readiness: () => ({ screenReady: true }), showNotice: message => captureNotices.push(message), openRecordingReview: () => {}, clearLastRecording: () => {}, releaseRecordingResources: release, stopRecording: stop, syncPauseUI: () => {} });
  });
  await expect.poll(() => page.evaluate(() => captureState.storageStatus?.bytes || 0), { timeout: 7000 }).toBeGreaterThan(1000);
  await page.evaluate(() => window.noise = true);
  await expect.poll(() => page.evaluate(() => captureState.phase), { timeout: 10000 }).toBe('ready');
  const result = await page.evaluate(async () => ({
    notices: captureNotices, retainedChunks: captureState.chunks.length, storage: captureState.storageStatus,
    take: await __gammaTakeStore.get(captureState.lastRecording.storageId),
    bytes: Array.from(new Uint8Array(await captureState.lastRecording.blob.arrayBuffer())),
  }));
  expect(result.notices.join(' ')).toContain('stockage local plein');
  expect(result.retainedChunks).toBe(0); expect(result.take.size).toBeGreaterThan(1000); expect(result.storage.error).toBeTruthy();
  // A completely full quota can also prevent persisting the final status;
  // unfinished ('recording') takes are recovery candidates after a restart.
  expect(['recording', 'interrupted']).toContain(result.take.status);
  const file = resolve(evidence, 'quota-capture.mp4'); writeFileSync(file, Buffer.from(result.bytes));
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', file], { encoding: 'utf8' }));
  expect(Number(probe.streams.find(s => s.codec_type === 'video').nb_read_frames)).toBeGreaterThan(10);
  writeFileSync(resolve(evidence, 'quota-capture-proof.json'), JSON.stringify({ notices: result.notices, retainedChunks: result.retainedChunks, storage: result.storage, take: result.take, probe }, null, 2));
});

test('separate raw voice and media takes follow pause/resume and remain independently editable', async ({ page }) => {
  test.setTimeout(30000);
  await page.goto(url);
  await page.evaluate(async () => {
    const audio = new AudioContext(); await audio.resume();
    const tone = frequency => { const osc = audio.createOscillator(), gain = audio.createGain(), output = audio.createMediaStreamDestination(); osc.frequency.value = frequency; gain.gain.value = 0.2; osc.connect(gain); gain.connect(output); osc.start(); return output.stream; };
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext('2d'); const draw = () => { ctx.fillStyle = '#193a70'; ctx.fillRect(0, 0, 640, 360); };
    draw(); setInterval(draw, 33);
    const display = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...tone(880).getAudioTracks()]);
    const camera = document.createElement('div'); camera.innerHTML = '<video></video>';
    const badge = document.createElement('div'); badge.innerHTML = '<span class="gamma-record-state"></span><b></b><button></button>';
    const button = document.createElement('button'); document.body.append(camera, badge, button);
    // Both mix gains are zero: the raw stems must nevertheless retain their
    // sources, so an editor can correct a bad live mix after the session.
    const state = window.captureState = { phase: 'ready', options: { captureMode: 'external', output: 'source', systemAudio: true, audioStems: true, micGain: 0, sharedGain: 0 }, displayStream: display, mediaStream: tone(440) };
    const release = async () => { state.recordingResources?.dispose(); state.displayStream?.getTracks().forEach(t => t.stop()); state.recordingResources?.canvasStream.getTracks().forEach(t => t.stop()); clearInterval(state.recordTimer); state.recordingResources = null; state.phase = 'ready'; };
    const stop = window.stopCapture = () => { if (['recording', 'paused'].includes(state.recorder?.state)) { state.phase = 'finalizing'; state.recorder.stop(); } };
    const syncPauseUI = paused => { if (paused) { state.pausedAt = Date.now(); state.phase = 'paused'; } else { state.pausedTotal += Date.now() - state.pausedAt; state.pausedAt = 0; state.phase = 'recording'; } };
    window.captureNotices = [];
    await startStudioCapture({ state, camera, recordingBadge: badge, actionButton: () => button, readiness: () => ({ screenReady: true }), showNotice: m => captureNotices.push(m), openRecordingReview: () => {}, clearLastRecording: () => {}, releaseRecordingResources: release, stopRecording: stop, syncPauseUI });
  });
  await page.waitForTimeout(1700);
  await page.evaluate(() => captureState.recorder.pause());
  await expect.poll(() => page.evaluate(() => captureState.phase)).toBe('paused');
  await page.waitForTimeout(1300);
  await page.evaluate(() => captureState.recorder.resume());
  await expect.poll(() => page.evaluate(() => captureState.phase)).toBe('recording');
  await page.waitForTimeout(1700); await page.evaluate(() => stopCapture());
  await expect.poll(() => page.evaluate(() => !!captureState.lastRecording)).toBe(true);
  const takes = await page.evaluate(async () => {
    const all = await __gammaTakeStore.list();
    return Promise.all(all.map(async take => ({ ...take, bytes: Array.from(new Uint8Array(await (await __gammaTakeStore.toBlob(take.id)).arrayBuffer())) })));
  });
  expect(takes).toHaveLength(3);
  const main = takes.find(t => !t.role), voice = takes.find(t => t.role === 'mic'), media = takes.find(t => t.role === 'shared');
  expect(voice.parentId).toBe(main.id); expect(media.parentId).toBe(main.id);
  const reports = [];
  for (const take of takes) {
    expect(take.status).toBe('complete'); expect(take.durationMs).toBeGreaterThan(3000); expect(take.durationMs).toBeLessThan(4000);
    const file = resolve(evidence, take.role ? take.role + (take.mime.includes('mp4') ? '.m4a' : '.webm') : 'stems-mix.mp4'); writeFileSync(file, Buffer.from(take.bytes));
    const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1'], { maxBuffer: 5000000 });
    const seconds = pcm.length / 4 / 48000;
    expect(seconds).toBeGreaterThan(3); expect(seconds).toBeLessThan(4);
    const amplitude = frequency => { let re = 0, im = 0, count = 0; for (let i = 24000; i < 48000; i++) { const value = pcm.readFloatLE(i * 4); re += value * Math.cos(2 * Math.PI * frequency * i / 48000); im += value * Math.sin(2 * Math.PI * frequency * i / 48000); count++; } return 2 * Math.hypot(re, im) / count; };
    const a440 = amplitude(440), a880 = amplitude(880);
    if (take.role === 'mic') { expect(a440).toBeGreaterThan(0.1); expect(a880).toBeLessThan(0.01); }
    else if (take.role === 'shared') { expect(a880).toBeGreaterThan(0.1); expect(a440).toBeLessThan(0.01); }
    else { expect(a440).toBeLessThan(0.005); expect(a880).toBeLessThan(0.005); }
    reports.push({ role: take.role || 'mix', seconds, a440, a880, durationMs: take.durationMs });
  }
  // Event-level alignment is bounded here; this does not assert sample-perfect
  // synchronization between independent MediaRecorder instances.
  expect(Math.max(...reports.map(r => r.seconds)) - Math.min(...reports.map(r => r.seconds))).toBeLessThan(0.25);
  writeFileSync(resolve(evidence, 'stems-proof.json'), JSON.stringify(reports, null, 2));
});
