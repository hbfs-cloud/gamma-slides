const MAX_REVISIONS = 40;

function text(value) { return String(value ?? ''); }

function comparable(revision) {
  return JSON.stringify({ source: text(revision.source), sourceKind: text(revision.sourceKind), title: text(revision.title), theme: text(revision.theme), sourcePath: revision.sourcePath || null });
}

/** A bounded, local-only revision ledger. It never mutates a source file or a remote publication. */
export function appendRevision(history, document, { reason = 'Edited locally', createdAt = Date.now(), limit = MAX_REVISIONS } = {}) {
  const previous = Array.isArray(history) ? history : [];
  const revision = { id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Number(createdAt), reason: text(reason).slice(0, 120) || 'Edited locally', source: text(document?.source), sourceKind: text(document?.sourceKind), title: text(document?.title), theme: text(document?.theme), sourcePath: document?.sourcePath || null };
  if (!revision.source || !['markdown', 'yaml', 'json'].includes(revision.sourceKind)) return previous;
  if (previous.length && comparable(previous[previous.length - 1]) === comparable(revision)) return previous;
  return [...previous, revision].slice(-Math.max(1, Number(limit) || MAX_REVISIONS));
}

export function revisionSummaries(history) {
  return (Array.isArray(history) ? history : []).map(({ id, createdAt, reason, title, sourceKind, theme, sourcePath }) => ({ id, createdAt, reason, title, sourceKind, theme, sourcePath }));
}

export function findRevision(history, id) { return (Array.isArray(history) ? history : []).find(revision => revision.id === id) || null; }

export { MAX_REVISIONS };
