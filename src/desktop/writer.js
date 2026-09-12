const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

const writerPrefixes = {
  headline: '# ',
  supporting: '## ',
  point: '- ',
  quote: '> ',
};

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
 * Keep Markdown as the portable source format while making the normal editor
 * read like a document. The marker occupies its original space (so textarea
 * selection and the visual layer stay aligned) but is not shown as syntax.
 */
export function writerLinePresentation(line) {
  const value = String(line || '');
  const kind = writerLineKind(value);
  const marker = kind === 'headline' ? '# '
    : kind === 'supporting' ? '## '
      : kind === 'point' ? value.match(/^(?:[-*+]\s+|\d+[.)]\s+)/)?.[0] || ''
        : kind === 'quote' ? value.match(/^>\s?/)?.[0] || ''
          : kind === 'moment' ? value : '';
  const content = marker ? value.slice(marker.length) : value;
  const label = kind === 'moment' ? 'New slide' : '';
  return { kind, marker, content, label };
}

/** Apply a document-writing action without exposing the storage syntax. */
export function formatWriterLine(line, command) {
  const value = String(line || '');
  const prefix = writerPrefixes[command];
  if (!prefix) return value;
  const indent = value.match(/^\s*/)?.[0] || '';
  const content = value.slice(indent.length).replace(/^(?:#{1,6}\s+|[-*+]\s+|>\s?)/, '').trimStart();
  return `${indent}${prefix}${content}`;
}

/** Three returns remain a natural, non-syntactic way to begin the next slide. */
export function writerMomentGap(before) {
  const value = String(before || '');
  return value.endsWith('\n\n\n') ? '' : value.endsWith('\n\n') ? '\n' : value.endsWith('\n') ? '\n\n' : '\n\n\n';
}

function isNaturalMomentBreak(lines, index) {
  return !lines[index] && !lines[index - 1] && Boolean(lines[index + 1]?.trim());
}

/**
 * Escape and mark each writer line for the non-editable highlighting layer.
 * The file remains plain Markdown and no user text becomes executable HTML.
 */
export function highlightMarkdownWriter(source) {
  const lines = String(source || '').split(/\r?\n/);
  return lines.map((line, index) => {
    const presentation = writerLinePresentation(line);
    const naturalBreak = presentation.kind === 'space' && isNaturalMomentBreak(lines, index);
    const kind = naturalBreak ? 'moment writer-natural-moment' : presentation.kind;
    const label = presentation.label || (naturalBreak ? 'New slide' : '');
    const marker = presentation.marker ? `<span class="writer-marker">${escapeHtml(presentation.marker)}</span>` : '';
    const content = presentation.content ? escapeHtml(presentation.content) : '&#8203;';
    return `<span class="writer-line writer-${kind}" data-writer-line="${index}"${label ? ` data-writer-label="${escapeHtml(label)}"` : ''}>${marker}<span class="writer-content">${content}</span></span>`;
  }).join('\n');
}
