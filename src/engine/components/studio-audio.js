/** Production mix: independent buses, voice ducking, peak feedback and safety ceiling. */
function initStudioAudio() {
  async function create(options = {}) {
    const Context = window.AudioContext || window.webkitAudioContext;
    const context = new Context({ sampleRate: 48000 });
    await context.resume();
    const micGain = context.createGain(), sharedGain = context.createGain();
    const micMeter = context.createAnalyser(), sharedMeter = context.createAnalyser(), mixMeter = context.createAnalyser(), outputMeter = context.createAnalyser();
    for (const meter of [micMeter, sharedMeter, mixMeter, outputMeter]) meter.fftSize = 2048;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -6; compressor.knee.value = 6; compressor.ratio.value = 12;
    compressor.attack.value = 0.003; compressor.release.value = 0.15;
    // The compressor alone is not a brick-wall limiter. Clamp its output so a
    // transient during attack cannot send samples above the safety ceiling.
    const ceiling = context.createWaveShaper(), curve = new Float32Array(4097);
    for (let i = 0; i < curve.length; i++) curve[i] = Math.max(-0.97, Math.min(0.97, i * 2 / (curve.length - 1) - 1));
    ceiling.curve = curve;
    const destination = context.createMediaStreamDestination();
    // Raw source stems remain independent of gain, ducking and compression.
    // Source-track muting still applies, so a muted microphone stays private.
    const micStem = context.createMediaStreamDestination(), sharedStem = context.createMediaStreamDestination();
    micGain.connect(micMeter); micMeter.connect(mixMeter);
    sharedGain.connect(sharedMeter); sharedMeter.connect(mixMeter);
    mixMeter.connect(compressor); compressor.connect(ceiling); ceiling.connect(outputMeter); outputMeter.connect(destination);
    let microphoneSource, sharedSources = [], disposed = false, clippedAt = 0;
    const levels = { mic: 0, shared: 0, mix: 0, output: 0, clipping: false, reduction: 0, ducked: false };
    const gains = { mic: Number.isFinite(options.micGain) ? options.micGain : 1, shared: Number.isFinite(options.sharedGain) ? options.sharedGain : 0.65 };
    let ducking = !!options.ducking;
    const samples = new Float32Array(2048);
    const peak = meter => { meter.getFloatTimeDomainData(samples); let value = 0; for (const sample of samples) value = Math.max(value, Math.abs(sample)); return value; };
    const validGain = value => Math.max(0, Math.min(2, Number.isFinite(Number(value)) ? Number(value) : 1));
    const setGains = next => {
      if (next.mic !== undefined) gains.mic = validGain(next.mic);
      if (next.shared !== undefined) gains.shared = validGain(next.shared);
      micGain.gain.setTargetAtTime(gains.mic, context.currentTime, 0.015);
      sharedGain.gain.setTargetAtTime(gains.shared * (levels.ducked ? 0.25 : 1), context.currentTime, 0.05);
    };
    const setMicrophone = stream => {
      microphoneSource?.disconnect(); microphoneSource = null;
      const track = stream?.getAudioTracks().find(t => t.readyState === 'live');
      if (track) { microphoneSource = context.createMediaStreamSource(new MediaStream([track])); microphoneSource.connect(micGain); microphoneSource.connect(micStem); }
    };
    const setShared = stream => {
      sharedSources.forEach(source => source.disconnect()); sharedSources = [];
      for (const track of stream?.getAudioTracks() || []) {
        const source = context.createMediaStreamSource(new MediaStream([track])); source.connect(sharedGain); source.connect(sharedStem); sharedSources.push(source);
      }
    };
    setGains(gains); setMicrophone(options.microphone); setShared(options.shared);
    const timer = setInterval(() => {
      if (disposed) return;
      levels.mic = peak(micMeter); levels.shared = peak(sharedMeter); levels.mix = peak(mixMeter); levels.output = peak(outputMeter);
      if (levels.mix >= 0.98) clippedAt = performance.now();
      levels.clipping = performance.now() - clippedAt < 1500 && clippedAt > 0;
      levels.reduction = compressor.reduction;
      const ducked = ducking && levels.mic > 0.025;
      if (ducked !== levels.ducked) { levels.ducked = ducked; setGains(gains); }
      window.dispatchEvent(new CustomEvent('gamma:studio-audio', { detail: { ...levels, gains: { ...gains }, ducking } }));
    }, 80);
    return {
      context, stream: destination.stream, stems: { mic: micStem.stream, shared: sharedStem.stream }, setMicrophone, setShared, setGains,
      setDucking(value) { ducking = !!value; },
      snapshot: () => ({ ...levels, gains: { ...gains }, ducking }),
      async dispose() {
        if (disposed) return; disposed = true; clearInterval(timer);
        microphoneSource?.disconnect(); sharedSources.forEach(source => source.disconnect());
        for (const output of [destination, micStem, sharedStem]) output.stream.getTracks().forEach(track => track.stop());
        await context.close().catch(() => {});
      },
    };
  }
  window.__gammaAudioMixer = { create };
}
export const studioAudioJS = () => `(${initStudioAudio.toString()})();`;
