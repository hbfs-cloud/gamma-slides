import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { acquireAssets } from '../src/shorts/assets.js';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>');

function fixture(items) {
  const directory = mkdtempSync(join(tmpdir(), 'gamma-shorts-assets-'));
  const file = join(directory, 'registry.json');
  const output = join(directory, 'output');
  writeFileSync(file, JSON.stringify({ items }));
  return { directory, file, output };
}

function card(overrides = {}) {
  return { ticker: 'HPE', company_name: 'Hewlett Packard Enterprise', issuer_verified: true, source_kind: 'official', asof: '2026-09-11', chart_url: 'https://images.example.test/chart', logo_url: 'https://images.example.test/logo', ...overrides };
}

async function withFetch(fetcher, action) {
  const original = globalThis.fetch;
  globalThis.fetch = fetcher;
  try { return await action(); } finally { globalThis.fetch = original; }
}

test('rejects HTML disguised as an image and blocks only that item', async () => {
  const f = fixture([card(), card({ ticker: 'DELL', chart_url: 'https://images.example.test/chart-ok' })]);
  try {
    await withFetch(async url => String(url).endsWith('chart-ok') ? new Response(png, { status: 200 }) : String(url).endsWith('logo') ? new Response(svg, { status: 200 }) : new Response('<!doctype html><html>not an image</html>', { status: 200, headers: { 'content-type': 'image/png' } }), async () => {
      const result = await acquireAssets({ file: f.file, output: f.output, asof: '2026-09-11' });
      assert.equal(result.items[0].status, 'blocked');
      assert.match(result.items[0].blocked[0], /verified PNG, JPEG, or SVG/);
      assert.equal(result.items[1].status, 'acquired');
    });
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('requires verified issuer identity before any fetch', async () => {
  const f = fixture([card({ issuer_verified: false })]);
  try {
    let calls = 0;
    await withFetch(async () => { calls += 1; throw Error('must not fetch'); }, async () => {
      const result = await acquireAssets({ file: f.file, output: f.output, asof: '2026-09-11' });
      assert.equal(result.items[0].status, 'blocked');
      assert.ok(result.items[0].blocked.includes('issuer_verified:true is required'));
      assert.equal(calls, 0);
    });
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('blocks mismatched registry dates and records manual, non-pixel date provenance', async () => {
  const f = fixture([card({ asof: '2026-09-10' })]);
  try {
    const result = await acquireAssets({ file: f.file, output: f.output, asof: '2026-09-11' });
    assert.equal(result.items[0].status, 'blocked');
    assert.ok(result.items[0].blocked.includes('registry asof must equal 2026-09-11'));
    assert.deepEqual(result.items[0].date, { asof: '2026-09-11', verification: 'manual_confirmation_required', pixel_verified: false });
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('caches logos but writes dated charts per ticker with hashes and relative paths', async () => {
  const f = fixture([card()]);
  try {
    const calls = [];
    await withFetch(async url => { calls.push(String(url)); return new Response(String(url).endsWith('logo') ? svg : png, { status: 200 }); }, async () => {
      const first = await acquireAssets({ file: f.file, output: f.output, asof: '2026-09-11' });
      const second = await acquireAssets({ file: f.file, output: f.output, asof: '2026-09-11' });
      assert.equal(first.items[0].status, 'acquired');
      assert.equal(second.items[0].assets.chart.path, 'HPE/chart-2026-09-11.png');
      assert.match(second.items[0].assets.logo.path, /^\.logo-cache\/[a-f0-9]{64}\.svg$/);
      assert.equal(calls.filter(url => url.endsWith('/logo')).length, 1);
      assert.equal(calls.filter(url => url.endsWith('/chart')).length, 2);
      assert.match(second.items[0].assets.chart.provenance.hash, /^[a-f0-9]{64}$/);
      const written = JSON.parse(readFileSync(join(f.output, 'assets-manifest.json'), 'utf8'));
      assert.equal(written.items[0].date.pixel_verified, false);
    });
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});
