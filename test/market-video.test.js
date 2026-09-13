import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkedPlan, isFullFrame, options } from '../src/video/market-capture.mjs';

test('market timing uses exact frames, preserves every reviewed paragraph, and never speeds narration', () => {
  const root = mkdtempSync(join(tmpdir(), 'gamma-market-video-'));
  try {
    const deck = { slides: [{ title: 'One', narration: 'First paragraph.\n\nSecond paragraph.' }, { title: 'Two', narration: 'Third paragraph.' }] };
    const voice = { items: [
      { scene: 0, part: 0, text: 'First paragraph.', path: 'a.wav', duration: 1.2 },
      { scene: 0, part: 1, text: 'Second paragraph.', path: 'b.wav', duration: 2.1 },
      { scene: 1, part: 0, text: 'Third paragraph.', path: 'c.wav', duration: 1.7 },
    ] };
    const deckPath = join(root, 'deck.json'), voicePath = join(root, 'segments.json'), output = join(root, 'output');
    writeFileSync(deckPath, JSON.stringify(deck)); writeFileSync(voicePath, JSON.stringify(voice));
    const run = spawnSync('python3', [resolve('src/video/market-mix.py'), '--deck', deckPath, '--voice-manifest', voicePath,
      '--output', output, '--target-seconds', '20', '--plan-only'], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const timing = JSON.parse(readFileSync(join(output, 'timing.json'), 'utf8'));
    assert.equal(timing.total, 20); assert.equal(timing.tempo_modified, false); assert.equal(timing.fps, 30);
    assert.equal(timing.scenes.reduce((sum, scene) => sum + scene.frames, 0), 600);
    assert.deepEqual(timing.segments.map(segment => segment.text), voice.items.map(item => item.text));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('market timing rejects an overlong script instead of modifying its tempo', () => {
  const root = mkdtempSync(join(tmpdir(), 'gamma-market-video-'));
  try {
    const deckPath = join(root, 'deck.json'), voicePath = join(root, 'segments.json');
    writeFileSync(deckPath, JSON.stringify({ slides: [{ narration: 'Reviewed narration.' }] }));
    writeFileSync(voicePath, JSON.stringify({ items: [{ scene: 0, part: 0, text: 'Reviewed narration.', path: 'a.wav', duration: 21 }] }));
    const run = spawnSync('python3', [resolve('src/video/market-mix.py'), '--deck', deckPath, '--voice-manifest', voicePath,
      '--output', join(root, 'output'), '--target-seconds', '20', '--plan-only'], { encoding: 'utf8' });
    assert.notEqual(run.status, 0); assert.match(run.stderr, /shorten.*never speed/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('market timing accepts a list manifest and rejects invalid measured durations', () => {
  const root = mkdtempSync(join(tmpdir(), 'gamma-market-video-'));
  try {
    const deckPath = join(root, 'deck.json'), voicePath = join(root, 'segments.json');
    writeFileSync(deckPath, JSON.stringify({ slides: [{ narration: 'Reviewed narration.' }] }));
    writeFileSync(voicePath, JSON.stringify([{ scene: 0, part: 0, text: 'Reviewed narration.', path: 'a.wav', duration: 1 }]));
    const args = ['src/video/market-mix.py', '--deck', deckPath, '--voice-manifest', voicePath, '--output', join(root, 'output'), '--target-seconds', '10', '--plan-only'];
    assert.equal(spawnSync('python3', args, { encoding: 'utf8' }).status, 0);
    writeFileSync(voicePath, JSON.stringify([{ scene: 0, part: 0, text: 'Reviewed narration.', path: 'a.wav', duration: 0 }]));
    const failed = spawnSync('python3', args, { encoding: 'utf8' });
    assert.notEqual(failed.status, 0); assert.match(failed.stderr, /positive finite/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('scene capture only accepts timing aligned with the reviewed deck', () => {
  assert.deepEqual(options(['--html', 'deck.html', '--deck', 'deck.json', '--timing', 'timing.json', '--output', 'clips']).output, 'clips');
  assert.equal(checkedPlan({ slides: [{}] }, { fps: 30, tempo_modified: false, scenes: [{ index: 0, frames: 30, duration: 1 }] }).length, 1);
  assert.throws(() => checkedPlan({ slides: [{}] }, { fps: 25, tempo_modified: false, scenes: [{ index: 0, frames: 30, duration: 1 }] }), /30fps/);
  assert.equal(isFullFrame({ x: 0, y: 0, width: 1920, height: 1080 }), true);
  assert.equal(isFullFrame({ x: 1.1, y: 0, width: 1920, height: 1080 }), false);
});
