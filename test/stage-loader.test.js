import test from 'node:test';
import assert from 'node:assert/strict';
import { createStageRevisionLoader } from '../src/desktop/stage-loader.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((next, fail) => { resolve = next; reject = fail; });
  return { promise, resolve, reject };
}

function stageFixture() {
  const requests = [];
  let destroyed = false;
  let active = 0;
  let maximumActive = 0;
  const stage = {
    isDestroyed: () => destroyed,
    loadURL(url) {
      const pending = deferred();
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      pending.promise.then(() => { active -= 1; }, () => { active -= 1; });
      requests.push({ url, pending });
      return pending.promise;
    },
  };
  return { stage, requests, destroy: () => { destroyed = true; }, maximumActive: () => maximumActive };
}

const settle = async () => { await Promise.resolve(); await new Promise(resolve => setImmediate(resolve)); };

test('Stage revision loader coalesces concurrent work and caches a completed revision', async () => {
  let revision = 7;
  const fixture = stageFixture();
  const load = createStageRevisionLoader({ getRevision: () => revision, getUrl: () => `gamma://deck/?revision=${revision}` });

  const first = load(fixture.stage);
  const second = load(fixture.stage);
  await settle();
  assert.deepEqual(fixture.requests.map(request => request.url), ['gamma://deck/?revision=7']);

  fixture.requests[0].pending.resolve();
  await Promise.all([first, second]);
  await load(fixture.stage);
  assert.equal(fixture.requests.length, 1, 'a completed current revision is cached');
});

test('Stage revision loader serializes pending revisions and resolves callers only after the latest revision', async () => {
  let revision = 7;
  const fixture = stageFixture();
  const load = createStageRevisionLoader({ getRevision: () => revision, getUrl: () => `gamma://deck/?revision=${revision}` });

  const first = load(fixture.stage);
  revision = 8;
  const second = load(fixture.stage);
  revision = 9;
  const third = load(fixture.stage);
  await settle();
  assert.deepEqual(fixture.requests.map(request => request.url), ['gamma://deck/?revision=7']);

  fixture.requests[0].pending.resolve();
  await settle();
  assert.deepEqual(fixture.requests.map(request => request.url), ['gamma://deck/?revision=7', 'gamma://deck/?revision=9']);
  assert.equal(fixture.maximumActive(), 1, 'a second load waits for the first loadURL to settle');

  fixture.requests[1].pending.resolve();
  await Promise.all([first, second, third]);
  assert.equal(revision, 9);
  assert.equal(fixture.maximumActive(), 1);
});

test('Stage revision loader releases a failed revision for an explicit retry', async () => {
  let revision = 4;
  const fixture = stageFixture();
  const load = createStageRevisionLoader({ getRevision: () => revision, getUrl: () => `gamma://deck/?revision=${revision}` });

  const failed = assert.rejects(load(fixture.stage), /simulated load failure/);
  await settle();
  fixture.requests[0].pending.reject(new Error('simulated load failure'));
  await failed;

  const retry = load(fixture.stage);
  await settle();
  assert.equal(fixture.requests.length, 2, 'the same revision can be retried after failure');
  fixture.requests[1].pending.resolve();
  await retry;
});

test('Stage revision loader rejects a destroyed Stage', async () => {
  const fixture = stageFixture();
  fixture.destroy();
  const load = createStageRevisionLoader({ getRevision: () => 1, getUrl: () => 'gamma://deck/?revision=1' });

  await assert.rejects(() => load(fixture.stage));
  assert.equal(fixture.requests.length, 0);
});
