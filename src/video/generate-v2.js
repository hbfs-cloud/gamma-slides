import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { generateYouTubeMetadata, writeMetadataFiles } from './metadata.js';

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
  let idx = 1;

  for (let i = 0; i < slides.length; i++) {
    const text = slides[i].narration;
    if (!text) { cursor += (audioDurations[i] || 0) + 1.5; continue; }

    const start = cursor + 0.5;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > 120 && current.length > 0) { chunks.push(current.trim()); current = s; }
      else current += s;
    }
    if (current.trim()) chunks.push(current.trim());

    const chunkDur = audioDurations[i] / chunks.length;
    for (let c = 0; c < chunks.length; c++) {
      lines.push(`${idx++}`);
      lines.push(`${formatSrtTime(start + c * chunkDur)} --> ${formatSrtTime(start + (c + 1) * chunkDur)}`);
      lines.push(chunks[c]);
      lines.push('');
    }
    cursor += audioDurations[i] + 1.5;
  }
  writeFileSync(srtPath, lines.join('\n'), 'utf-8');
}

export async function generateVideoFromDeck(deck, htmlPath, outputPath, opts = {}) {
  const absHtml = resolve(htmlPath);
  const absOutput = resolve(outputPath);
  const tmpDir = resolve('./output/.video-tmp');
  const srtPath = absOutput.replace(/\.mp4$/, '.srt');

  if (!existsSync(absHtml)) throw new Error(`HTML not found: ${absHtml}`);

  const voice = deck.narration?.voice || 'en-US-AndrewNeural';
  const rate = deck.narration?.rate || '-5%';
  const pitch = deck.narration?.pitch || '+0Hz';
  const slidesWithNarration = deck.slides.filter(s => s.narration);

  if (slidesWithNarration.length === 0) throw new Error('No slides have narration text.');

  // Clean tmp
  if (existsSync(tmpDir)) readdirSync(tmpDir).forEach(f => unlinkSync(join(tmpDir, f)));
  else mkdirSync(tmpDir, { recursive: true });

  const music = deck.music?.track && existsSync(resolve(deck.music.track)) ? resolve(deck.music.track) : null;
  const steps = music ? 5 : 4;

  console.log(`\n  Generating video: ${deck.meta?.title || 'Untitled'}`);
  console.log(`  Voice: ${voice} • Slides: ${deck.slides.length}\n`);

  // Step 1: TTS
  console.log(`  [1/${steps}] Generating narration...`);
  const audioDurations = [];

  for (let i = 0; i < deck.slides.length; i++) {
    const slide = deck.slides[i];
    const audioFile = join(tmpDir, `slide_${String(i).padStart(2, '0')}.mp3`);

    if (!slide.narration) {
      // Silent slide — 3 seconds
      execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 -q:a 9 "${audioFile}" 2>/dev/null`, { stdio: 'pipe' });
      audioDurations.push(3);
      console.log(`    Slide ${i + 1}/${deck.slides.length}  (silent 3.0s)`);
      continue;
    }

    const text = slide.narration.replace(/'/g, "'\\''").replace(/\n/g, ' ');
    execSync(`edge-tts --voice "${voice}" --rate="${rate}" --pitch="${pitch}" --text '${text}' --write-media "${audioFile}" 2>/dev/null`, { stdio: 'pipe' });

    const dur = parseFloat(execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioFile}"`, { encoding: 'utf-8' }).trim());
    audioDurations.push(dur);

    const bar = '█'.repeat(Math.round(dur / 2)) + '░'.repeat(Math.max(0, 15 - Math.round(dur / 2)));
    console.log(`    Slide ${i + 1}/${deck.slides.length}  ${bar}  ${dur.toFixed(1)}s`);
  }

  const totalNarration = audioDurations.reduce((a, b) => a + b, 0);
  console.log(`    Total: ${totalNarration.toFixed(1)}s\n`);

  // SRT
  if (opts.srt !== false) {
    generateSRT(deck.slides, audioDurations, srtPath);
    console.log(`    Subtitles: ${srtPath}\n`);
  }

  // Step 2: Screenshots
  console.log(`  [2/${steps}] Capturing slides...`);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(`file://${absHtml}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => typeof Reveal !== 'undefined' && Reveal.isReady(), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  for (let i = 0; i < deck.slides.length; i++) {
    await page.evaluate(idx => Reveal.slide(idx), i);
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: join(tmpDir, `slide_${String(i).padStart(2, '0')}.png`), type: 'png' });
    console.log(`    Slide ${i + 1}/${deck.slides.length}`);
  }
  await browser.close();

  // Step 3: Composite segments
  console.log(`\n  [3/${steps}] Compositing segments...`);
  const segFiles = [];
  for (let i = 0; i < deck.slides.length; i++) {
    const img = join(tmpDir, `slide_${String(i).padStart(2, '0')}.png`);
    const audio = join(tmpDir, `slide_${String(i).padStart(2, '0')}.mp3`);
    const seg = join(tmpDir, `seg_${String(i).padStart(2, '0')}.mp4`);
    const segDur = audioDurations[i] + 1.5;

    execSync(
      `ffmpeg -y -loop 1 -i "${img}" -i "${audio}" ` +
      `-filter_complex "[0:v]scale=1920:1080,format=yuv420p,fade=t=in:st=0:d=0.5,fade=t=out:st=${segDur - 0.5}:d=0.5[v];` +
      `[1:a]adelay=500|500,apad,atrim=0:${segDur}[a]" ` +
      `-map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k ` +
      `-t ${segDur} -r 30 "${seg}" 2>/dev/null`, { stdio: 'pipe' }
    );
    segFiles.push(seg);
    console.log(`    Segment ${i + 1}/${deck.slides.length}  (${segDur.toFixed(1)}s)`);
  }

  // Step 4: Concat
  console.log(`\n  [4/${steps}] Concatenating...`);
  const concatFile = join(tmpDir, 'concat.txt');
  writeFileSync(concatFile, segFiles.map(f => `file '${f}'`).join('\n'));
  const concatOut = music ? join(tmpDir, 'concat_raw.mp4') : absOutput;
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "${concatOut}" 2>/dev/null`, { stdio: 'pipe' });

  // Step 5: Music
  if (music) {
    console.log(`\n  [5/${steps}] Mixing music...`);
    const totalDur = audioDurations.reduce((a, b) => a + b + 1.5, 0);
    const vol = deck.music?.volume || 0.08;
    const fadeOut = deck.music?.fade_out || 4;
    const fadeIn = deck.music?.fade_in || 3;
    execSync(
      `ffmpeg -y -i "${concatOut}" -stream_loop -1 -i "${music}" ` +
      `-filter_complex "[1:a]volume=${vol},afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${totalDur - fadeOut}:d=${fadeOut}[bg];` +
      `[0:a]volume=1.0[narr];[narr][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]" ` +
      `-map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "${absOutput}" 2>/dev/null`, { stdio: 'pipe' }
    );
    unlinkSync(concatOut);
  }

  // YouTube metadata
  const ytMeta = generateYouTubeMetadata(deck, audioDurations);
  const metaFiles = writeMetadataFiles(ytMeta, absOutput);
  console.log(`    Metadata: ${metaFiles.meta}`);

  // Cleanup
  readdirSync(tmpDir).forEach(f => unlinkSync(join(tmpDir, f)));

  const finalDur = audioDurations.reduce((a, b) => a + b + 1.5, 0);
  return { outputPath: absOutput, srtPath: opts.srt !== false ? srtPath : null, metaFiles, duration: finalDur, slides: deck.slides.length };
}
