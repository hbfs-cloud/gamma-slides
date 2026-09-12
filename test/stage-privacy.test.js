import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('public Stage keeps private cue state out of its injected renderer code', () => {
  const main = source('../src/desktop/main.js');
  const stageWindow = main.slice(main.indexOf('function createStageWindow()'), main.indexOf('async function ensureStageWindow()'));

  assert.match(stageWindow, /gamma:stage-change/);
  assert.match(stageWindow, /openSpeaker/);
  assert.doesNotMatch(stageWindow, /gamma-presenter-live-hud|gammaStage\?\.onState|cue\.text|state\?\.cue/);
  assert.match(source('../src/desktop/speaker.js'), /display\.cue\.textContent = cue\?\.text \|\| ''/);
  assert.match(source('../src/desktop/mcp-control.js'), /private cue in the speaker view/);
  assert.doesNotMatch(source('../src/desktop/mcp-control.js'), /stage control overlay/);
});
