import { execSync, exec } from 'child_process';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, readdirSync, unlinkSync, readFileSync } from 'fs';
import { narrations } from './narration.js';
import { launchBrowser } from '../browser.js';

const VOICE = 'en-US-AndrewNeural';
const RATE = '-5%';  // Slightly slower for clarity
const PITCH = '+0Hz';

export async function generateVideo(opts) {
  const { template, file, output } = opts;
  const htmlPath = resolve(file);
  const outputPath = resolve(output);
  const tmpDir = resolve('./output/.video-tmp');

  if (!existsSync(htmlPath)) {
    throw new Error(`HTML file not found: ${htmlPath}`);
  }

  const narration = narrations[template];
  if (!narration) {
    throw new Error(`No narration found for template: ${template}. Available: ${Object.keys(narrations).join(', ')}`);
  }

  // Clean and create tmp dir
  if (existsSync(tmpDir)) {
    readdirSync(tmpDir).forEach(f => unlinkSync(join(tmpDir, f)));
  } else {
    mkdirSync(tmpDir, { recursive: true });
  }

  console.log(`\n  Generating video for: ${template}`);
  console.log(`  Voice: ${VOICE}`);
  console.log(`  Slides: ${narration.length}\n`);

  // Step 1: Generate audio for each slide
  console.log('  [1/4] Generating narration audio...');
  const audioDurations = [];

  for (let i = 0; i < narration.length; i++) {
    const audioFile = join(tmpDir, `slide_${String(i).padStart(2, '0')}.mp3`);
    const text = narration[i].replace(/'/g, "'\\''");

    execSync(
      `edge-tts --voice "${VOICE}" --rate="${RATE}" --pitch="${PITCH}" --text '${text}' --write-media "${audioFile}" 2>/dev/null`,
      { stdio: 'pipe' }
    );

    // Get audio duration with ffprobe
    const duration = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioFile}"`,
      { encoding: 'utf-8' }
    ).trim();
    const durationSec = parseFloat(duration);
    audioDurations.push(durationSec);

    const bar = '█'.repeat(Math.round(durationSec / 2)) + '░'.repeat(Math.max(0, 15 - Math.round(durationSec / 2)));
    console.log(`    Slide ${i + 1}/${narration.length}  ${bar}  ${durationSec.toFixed(1)}s`);
  }

  const totalDuration = audioDurations.reduce((a, b) => a + b, 0);
  console.log(`    Total narration: ${totalDuration.toFixed(1)}s\n`);

  // Step 2: Capture each slide as screenshot
  console.log('  [2/4] Capturing slide screenshots...');
  const browser = await launchBrowser({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for Reveal.js
  await page.waitForFunction(() => typeof Reveal !== 'undefined' && Reveal.isReady(), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500)); // Let animations settle

  for (let i = 0; i < narration.length; i++) {
    // Navigate to slide
    await page.evaluate((idx) => Reveal.slide(idx), i);
    await new Promise(r => setTimeout(r, 800)); // Wait for transition + animation

    const imgFile = join(tmpDir, `slide_${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: imgFile, type: 'png' });
    console.log(`    Captured slide ${i + 1}/${narration.length}`);
  }

  await browser.close();

  // Step 3: Build video segments for each slide (image + audio) with fade transitions
  console.log('\n  [3/4] Compositing video segments...');

  const segmentFiles = [];
  for (let i = 0; i < narration.length; i++) {
    const imgFile = join(tmpDir, `slide_${String(i).padStart(2, '0')}.png`);
    const audioFile = join(tmpDir, `slide_${String(i).padStart(2, '0')}.mp3`);
    const segFile = join(tmpDir, `segment_${String(i).padStart(2, '0')}.mp4`);

    // Add 1.5s padding: 0.5s before (for transition) + 1s after (pause between slides)
    const segDuration = audioDurations[i] + 1.5;

    execSync(
      `ffmpeg -y -loop 1 -i "${imgFile}" -i "${audioFile}" ` +
      `-filter_complex "[0:v]scale=1920:1080,format=yuv420p,` +
      `fade=t=in:st=0:d=0.5,fade=t=out:st=${segDuration - 0.5}:d=0.5[v];` +
      `[1:a]adelay=500|500,apad,atrim=0:${segDuration}[a]" ` +
      `-map "[v]" -map "[a]" ` +
      `-c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k ` +
      `-t ${segDuration} -r 30 "${segFile}" 2>/dev/null`,
      { stdio: 'pipe' }
    );

    segmentFiles.push(segFile);
    console.log(`    Segment ${i + 1}/${narration.length}  (${segDuration.toFixed(1)}s)`);
  }

  // Step 4: Concatenate all segments
  console.log('\n  [4/4] Concatenating final video...');

  const concatList = join(tmpDir, 'concat.txt');
  const concatContent = segmentFiles.map(f => `file '${f}'`).join('\n');
  const { writeFileSync } = await import('fs');
  writeFileSync(concatList, concatContent);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" ` +
    `-c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k ` +
    `-movflags +faststart "${outputPath}" 2>/dev/null`,
    { stdio: 'pipe' }
  );

  // Cleanup tmp
  readdirSync(tmpDir).forEach(f => unlinkSync(join(tmpDir, f)));

  const finalDuration = audioDurations.reduce((a, b) => a + b + 1.5, 0);
  return { outputPath, duration: finalDuration, slides: narration.length };
}
