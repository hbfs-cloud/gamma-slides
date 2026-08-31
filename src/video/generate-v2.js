import { execFileSync } from 'child_process';
import { dirname, join, resolve } from 'path';
import { tmpdir } from 'os';
import { pathToFileURL } from 'url';
import { existsSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { generateYouTubeMetadata, writeMetadataFiles } from './metadata.js';
import { launchBrowser } from '../browser.js';

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function generateSRT(slides, audioDurations, srtPath) {
  const lines = [];
  let cursor = 0;
  let index = 1;

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
    const text = slides[slideIndex].narration;
    if (!text) {
      cursor += (audioDurations[slideIndex] || 0) + 1.5;
      continue;
    }

    const start = cursor + 0.5;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let current = '';
    for (const sentence of sentences) {
      if ((current + sentence).length > 120 && current.length > 0) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    const chunkDuration = audioDurations[slideIndex] / chunks.length;
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      lines.push(String(index++));
      lines.push(`${formatSrtTime(start + chunkIndex * chunkDuration)} --> ${formatSrtTime(start + (chunkIndex + 1) * chunkDuration)}`);
      lines.push(chunks[chunkIndex]);
      lines.push('');
    }
    cursor += audioDurations[slideIndex] + 1.5;
  }

  writeFileSync(srtPath, lines.join('\n'), 'utf-8');
}

function run(binary, args, options = {}) {
  return execFileSync(binary, args, {
    encoding: options.encoding,
    stdio: options.encoding ? ['ignore', 'pipe', 'pipe'] : 'pipe',
    maxBuffer: 8 * 1024 * 1024,
  });
}

function parseResolution(value) {
  const match = String(value || '1920x1080').match(/^(\d{3,4})x(\d{3,4})$/);
  if (!match) throw new Error(`Invalid video resolution: ${value}`);
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 640 || height < 360 || width > 3840 || height > 2160) {
    throw new Error(`Unsupported video resolution: ${width}x${height}`);
  }
  return { width, height };
}

function probeDuration(audioPath) {
  return Number.parseFloat(run('ffprobe', [
    '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioPath,
  ], { encoding: 'utf-8' }).trim());
}

function makeNarrationAudio(slide, outputPath, voice, rate, pitch) {
  if (!slide.narration) {
    run('ffmpeg', [
      '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '3', '-q:a', '9', outputPath,
    ]);
    return 3;
  }

  const text = String(slide.narration).replace(/\s+/g, ' ').trim();
  run('edge-tts', [
    '--voice', voice,
    `--rate=${rate}`,
    `--pitch=${pitch}`,
    '--text', text,
    '--write-media', outputPath,
  ]);
  const duration = probeDuration(outputPath);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not determine narration duration');
  return duration;
}

function makeSegment({ imagePath, audioPath, segmentPath, duration, width, height, fps }) {
  const fadeOutStart = Math.max(0, duration - 0.35).toFixed(3);
  const filter = [
    `[0:v]scale=${width}:${height}:flags=lanczos,format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=${fadeOutStart}:d=0.35[v]`,
    `[1:a]adelay=350|350,apad,atrim=0:${duration.toFixed(3)}[a]`,
  ].join(';');

  run('ffmpeg', [
    '-y', '-loop', '1', '-i', imagePath, '-i', audioPath,
    '-filter_complex', filter,
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-t', duration.toFixed(3), '-r', String(fps), segmentPath,
  ]);
}

export async function generateVideoFromDeck(deck, htmlPath, outputPath, opts = {}) {
  const absHtml = resolve(htmlPath);
  const absOutput = resolve(outputPath);
  if (!existsSync(absHtml)) throw new Error(`HTML not found: ${absHtml}`);

  const { width, height } = parseResolution(deck.video?.resolution);
  const fps = Math.max(24, Math.min(60, Number(deck.video?.fps || 30)));
  const voice = deck.narration?.voice || 'en-US-AndrewNeural';
  const rate = deck.narration?.rate || '-5%';
  const pitch = deck.narration?.pitch || '+0Hz';
  const hasNarration = deck.slides.some(slide => slide.narration);
  if (!hasNarration) throw new Error('No slides have narration text.');

  mkdirSync(dirname(absOutput), { recursive: true });
  const workBase = opts.workDir ? resolve(opts.workDir) : tmpdir();
  mkdirSync(workBase, { recursive: true });
  const workDir = mkdtempSync(join(workBase, 'gamma-video-'));
  const audioDurations = [];
  const segmentFiles = [];
  let browser;

  const emit = (stage, current, total, detail = '') => {
    opts.onProgress?.({ stage, current, total, percent: Math.round((current / total) * 100), detail });
  };

  console.log(`\n  Generating video: ${deck.meta?.title || 'Untitled'}`);
  console.log(`  ${width}×${height} · ${fps} fps · bounded temporary workspace\n`);

  try {
    browser = await launchBrowser({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const presentationUrl = new URL(pathToFileURL(absHtml));
    presentationUrl.searchParams.set('gamma-export', '1');
    await page.goto(presentationUrl.href, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.waitForFunction(() => window.__GAMMA_READY__ === true, { timeout: 30_000 });

    console.log('  [1/2] Rendering slides and narration as a rolling stream…');
    for (let slideIndex = 0; slideIndex < deck.slides.length; slideIndex++) {
      const ordinal = String(slideIndex).padStart(3, '0');
      const audioPath = join(workDir, `audio-${ordinal}.mp3`);
      const imagePath = join(workDir, `frame-${ordinal}.png`);
      const segmentPath = join(workDir, `segment-${ordinal}.mp4`);

      const narrationDuration = makeNarrationAudio(deck.slides[slideIndex], audioPath, voice, rate, pitch);
      audioDurations.push(narrationDuration);

      await page.evaluate(async index => {
        Reveal.slide(index);
        document.querySelectorAll('.fragment').forEach(fragment => fragment.classList.add('visible'));
        await document.fonts.ready;
        await new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
        window.dispatchEvent(new Event('resize'));
      }, slideIndex);
      await page.waitForFunction(index => {
        const current = Reveal.getCurrentSlide();
        return Reveal.getIndices(current).h === index && Number.parseFloat(getComputedStyle(current).opacity) > 0.99;
      }, { timeout: 5_000 }, slideIndex);
      await page.screenshot({ path: imagePath, type: 'png' });

      const segmentDuration = narrationDuration + 1.5;
      makeSegment({
        imagePath,
        audioPath,
        segmentPath,
        duration: segmentDuration,
        width,
        height,
        fps,
      });
      segmentFiles.push(segmentPath);
      unlinkSync(imagePath);
      unlinkSync(audioPath);

      emit('render', slideIndex + 1, deck.slides.length, deck.slides[slideIndex].title || `Slide ${slideIndex + 1}`);
      console.log(`    ${String(slideIndex + 1).padStart(2)}/${deck.slides.length} · ${(segmentDuration).toFixed(1)}s · source assets released`);
    }

    await browser.close();
    browser = null;

    console.log('\n  [2/2] Assembling the master…');
    emit('assemble', 0, 1, 'Combining compressed slide segments');
    const concatPath = join(workDir, 'concat.txt');
    writeFileSync(concatPath, segmentFiles.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join('\n'));
    const musicPath = deck.music?.track && existsSync(resolve(deck.music.track)) ? resolve(deck.music.track) : null;
    const concatOutput = musicPath ? join(workDir, 'silent-master.mp4') : absOutput;

    run('ffmpeg', [
      '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
      '-c', 'copy', '-movflags', '+faststart', concatOutput,
    ]);

    if (musicPath) {
      const totalDuration = audioDurations.reduce((sum, duration) => sum + duration + 1.5, 0);
      const volume = Math.max(0, Math.min(1, Number(deck.music?.volume ?? 0.08)));
      const fadeIn = Math.max(0, Number(deck.music?.fade_in ?? 3));
      const fadeOut = Math.max(0, Number(deck.music?.fade_out ?? 4));
      const musicFilter = [
        `[1:a]volume=${volume},afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${Math.max(0, totalDuration - fadeOut)}:d=${fadeOut}[bg]`,
        '[0:a]volume=1[narr]',
        '[narr][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]',
      ].join(';');
      run('ffmpeg', [
        '-y', '-i', concatOutput, '-stream_loop', '-1', '-i', musicPath,
        '-filter_complex', musicFilter,
        '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart', absOutput,
      ]);
    }
    emit('assemble', 1, 1, 'Upload master ready');

    const srtPath = absOutput.replace(/\.mp4$/i, '.srt');
    if (opts.srt !== false && opts.sidecars !== false) generateSRT(deck.slides, audioDurations, srtPath);

    const metadata = generateYouTubeMetadata(deck, audioDurations);
    const metaFiles = opts.sidecars === false ? null : writeMetadataFiles(metadata, absOutput);
    const duration = audioDurations.reduce((sum, value) => sum + value + 1.5, 0);
    emit('complete', deck.slides.length, deck.slides.length, absOutput);

    return {
      outputPath: absOutput,
      srtPath: opts.srt !== false && opts.sidecars !== false ? srtPath : null,
      metaFiles,
      metadata,
      audioDurations,
      duration,
      slides: deck.slides.length,
      storageMode: 'bounded-temp',
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (!opts.keepWorkDir) rmSync(workDir, { recursive: true, force: true });
  }
}
