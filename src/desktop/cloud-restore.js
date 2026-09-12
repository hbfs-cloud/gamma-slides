import { extname, basename } from 'node:path';
import { loadDeck } from '../loader/index.js';
import { markdownToDeck } from './markdown.js';

/** Validate before touching the current draft. A cloud source never inherits a local save destination. */
export function cloudRestoreDraft(backup, theme = 'signal-room') {
  const extension = extname(backup.name || '').toLowerCase();
  if (!['.md', '.markdown', '.yaml', '.yml', '.json'].includes(extension)) throw new Error('This backup is not a supported presentation source.');
  const source = new TextDecoder('utf-8', { fatal: true }).decode(backup.content);
  const sourceKind = extension === '.json' ? 'json' : /ya?ml/.test(extension) ? 'yaml' : 'markdown';
  const title = basename(backup.name, extension).replace(/^Gamma Presenter backup — /, '');
  const deck = sourceKind === 'markdown' ? markdownToDeck(source, { title, theme }) : loadDeck(source);
  return { source, sourceKind, sourcePath: null, title: deck.meta.title || title, theme: deck.theme || theme, currentIndex: 0, dirty: true, recoveryRestored: true, error: null, renderState: 'rendering' };
}
