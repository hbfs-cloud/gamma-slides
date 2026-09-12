const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

/** Classify the small Markdown vocabulary as writing cues, not source code. */
export function writerLineKind(line) {
  const value = String(line || '');
  if (/^#\s+/.test(value)) return 'headline';
  if (/^##\s+/.test(value)) return 'supporting';
  if (/^(?:[-*+]\s+|\d+[.)]\s+)/.test(value)) return 'point';
  if (/^>\s?/.test(value)) return 'quote';
  if (/^!\[[^\]]*\]\([^\s)]+\)$/.test(value) || /^@\[(?:video|audio)(?::[^\]]*)?\]\([^\s)]+\)$/i.test(value)) return 'asset';
  if (/^\|.*\|$/.test(value)) return 'table';
  if (/^\s*-{3,}\s*$/.test(value)) return 'moment';
  return value.trim() ? 'prose' : 'space';
}

/**
 * Escape and mark each writer line for the non-editable highlighting layer.
 * The file remains plain Markdown and no user text becomes executable HTML.
 */
export function highlightMarkdownWriter(source) {
  return String(source || '').split(/\r?\n/).map((line, index) => {
    const value = line ? escapeHtml(line) : '&#8203;';
    return `<span class="writer-line writer-${writerLineKind(line)}" data-writer-line="${index}">${value}</span>`;
  }).join('\n');
}
