import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudRestoreDraft } from '../src/desktop/cloud-restore.js';

test('a cloud backup becomes a validated, unsaved draft without inheriting a local destination', () => {
  const draft = cloudRestoreDraft({ name: 'Gamma Presenter backup — quarterly.md', content: Buffer.from('# Quarterly\n\nPrivate notes') });
  assert.equal(draft.sourcePath, null);
  assert.equal(draft.dirty, true);
  assert.equal(draft.sourceKind, 'markdown');
  assert.match(draft.source, /Private notes/);
  const rich = cloudRestoreDraft({ name: 'board.json', content: Buffer.from(JSON.stringify({ meta: { title: 'Board' }, theme: 'analyst-proof', slides: [{ layout: 'title', title: 'Decision' }] })) });
  assert.equal(rich.theme, 'analyst-proof');
  assert.equal(rich.title, 'Board');
});

test('unsupported, corrupt and invalid cloud sources are rejected before a draft is returned', () => {
  assert.throws(() => cloudRestoreDraft({ name: 'payload.html', content: Buffer.from('x') }), /supported/);
  assert.throws(() => cloudRestoreDraft({ name: 'broken.md', content: Buffer.from([0xff]) }), /encoded data/);
  assert.throws(() => cloudRestoreDraft({ name: 'broken.json', content: Buffer.from('{') }));
});
