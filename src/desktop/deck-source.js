import yaml from 'js-yaml';

export const richLayouts = ['blank', 'bullets', 'image', 'visual', 'chart', 'diagram', 'quote', 'split', 'timeline', 'comparison'];

export function parseRichSource(source, sourceKind) {
  if (sourceKind === 'json') return JSON.parse(source);
  return yaml.load(source);
}

export function stringifyRichSource(document, sourceKind) {
  return sourceKind === 'json'
    ? `${JSON.stringify(document, null, 2)}\n`
    : yaml.dump(document, { lineWidth: 100, noRefs: true });
}

export function richSlideEditor(slide = {}) {
  const media = slide.media?.src
    ? { kind: 'media', src: slide.media.src }
    : slide.visual?.src
      ? { kind: 'visual', src: slide.visual.src }
      : slide.image?.src
        ? { kind: 'image', src: slide.image.src }
        : { kind: 'none', src: '' };
  return {
    title: slide.title || '',
    subtitle: slide.subtitle || '',
    notes: slide.notes || slide.narration || '',
    layout: slide.layout || 'blank',
    media,
    configuration: JSON.stringify(slide, null, 2),
  };
}

export function patchRichSlideSource(source, sourceKind, index, patch) {
  const document = parseRichSource(source, sourceKind);
  if (!document || !Array.isArray(document.slides) || !document.slides[index]) throw new Error('The selected slide no longer exists in the document.');
  const slide = document.slides[index];
  if (typeof patch.configuration === 'string') {
    const replacement = JSON.parse(patch.configuration);
    if (!replacement || Array.isArray(replacement) || typeof replacement !== 'object') throw new Error('The advanced configuration must be a slide JSON object.');
    document.slides[index] = replacement;
  } else {
    for (const key of ['title', 'subtitle', 'notes']) if (typeof patch[key] === 'string') slide[key] = patch[key];
    if (typeof patch.layout === 'string') {
      if (!richLayouts.includes(patch.layout)) throw new Error(`Unsupported layout: ${patch.layout}`);
      slide.layout = patch.layout;
    }
    if (patch.media && typeof patch.media === 'object') {
      delete slide.image;
      delete slide.visual;
      delete slide.media;
      const src = String(patch.media.src || '').trim();
      if (src && patch.media.kind === 'image') slide.image = { src, alt: slide.title || '' };
      if (src && patch.media.kind === 'visual') slide.visual = { src, alt: slide.title || '' };
      if (src && patch.media.kind === 'media') slide.media = { src };
    }
  }
  return stringifyRichSource(document, sourceKind);
}

export function richSlideRanges(source, sourceKind) {
  if (sourceKind === 'json') return jsonSlideRanges(source);
  const lines = String(source).split(/(?<=\n)/);
  const slidesLine = lines.findIndex(line => /^\s*slides\s*:\s*(?:#.*)?$/.test(line));
  if (slidesLine < 0) return [];
  const baseIndent = (lines[slidesLine].match(/^(\s*)/)?.[1].length || 0) + 2;
  const starts = [];
  let offset = lines.slice(0, slidesLine + 1).join('').length;
  for (const line of lines.slice(slidesLine + 1)) {
    if (new RegExp(`^ {${baseIndent}}-\\s`).test(line)) starts.push(offset);
    offset += line.length;
  }
  return starts.map((start, index) => ({ start, end: starts[index + 1] ?? source.length }));
}

const markdownSeparator = /\n\s*(?:---|\n\s*\n)\s*\n/g;
const defaultMarkdownSlide = '# New slide\n## The message to remember\n\nYour speaker note.\n';
const defaultRichSlide = () => ({
  layout: 'bullets',
  title: 'New slide',
  subtitle: 'The message to remember',
  items: [{ text: 'One idea worth showing.' }],
  notes: 'Your speaker note.',
});

function markdownBlocks(source) {
  const blocks = String(source || '').trim().split(markdownSeparator).map(block => block.trim()).filter(Boolean);
  return blocks.length ? blocks : [defaultMarkdownSlide.trim()];
}

function normalizedIndex(index, length) {
  return Math.max(0, Math.min(Number(index) || 0, Math.max(0, length - 1)));
}

function isMarkdownNote(line) {
  const value = String(line || '').trim();
  return Boolean(value)
    && !/^#{1,6}\s+/.test(value)
    && !/^(?:[-*+]\s+|\d+[.)]\s+)/.test(value)
    && !/^!\[[^\]]*\]\([^\s)]+\)$/.test(value)
    && !/^@\[(?:video|audio)(?::[^\]]*)?\]\([^\s)]+\)$/i.test(value)
    && !/^>\s?/.test(value)
    && !/^\|.*\|$/.test(value);
}

/** Update one Markdown slide without changing its media, list, quote, or table syntax. */
export function patchMarkdownSlideSource(source, index, patch = {}) {
  const blocks = markdownBlocks(source);
  const current = normalizedIndex(index, blocks.length);
  const lines = blocks[current].split(/\r?\n/);
  const setHeading = (level, value) => {
    if (typeof value !== 'string') return;
    const match = new RegExp(`^${'#'.repeat(level)}\\s+`);
    const at = lines.findIndex(line => match.test(line.trim()));
    const next = value.trim();
    if (at >= 0 && next) lines[at] = `${'#'.repeat(level)} ${next}`;
    else if (at >= 0) lines.splice(at, 1);
    else if (next) {
      const titleIndex = lines.findIndex(line => /^#\s+/.test(line.trim()));
      lines.splice(level === 1 ? 0 : Math.max(1, titleIndex + 1), 0, `${'#'.repeat(level)} ${next}`);
    }
  };
  setHeading(1, patch.title);
  setHeading(2, patch.subtitle);
  if (typeof patch.notes === 'string') {
    const noteIndexes = lines.map((line, lineIndex) => isMarkdownNote(line) ? lineIndex : -1).filter(lineIndex => lineIndex >= 0);
    for (const noteIndex of noteIndexes.reverse()) lines.splice(noteIndex, 1);
    const notes = patch.notes.trim();
    if (notes) {
      while (lines.length && !lines.at(-1).trim()) lines.pop();
      lines.push('', ...notes.split(/\r?\n/));
    }
  }
  blocks[current] = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { source: `${blocks.join('\n\n---\n\n')}\n`, currentIndex: current };
}

/**
 * Apply a slide-list action without exposing parser details to the Electron UI.
 * Rich documents are round-tripped through their native source format, so fields
 * Gamma understands but the visual inspector does not expose remain intact.
 */
export function mutateSlidesSource(source, sourceKind, action, index, targetIndex) {
  if (!['add', 'duplicate', 'delete', 'move'].includes(action)) throw new Error(`Unsupported slide action: ${action}`);
  if (sourceKind === 'markdown') {
    const blocks = markdownBlocks(source);
    const current = normalizedIndex(index, blocks.length);
    let selectedIndex = current;
    if (action === 'add') { blocks.splice(current + 1, 0, defaultMarkdownSlide.trim()); selectedIndex = current + 1; }
    if (action === 'duplicate') { blocks.splice(current + 1, 0, blocks[current]); selectedIndex = current + 1; }
    if (action === 'delete') {
      if (blocks.length === 1) blocks[0] = defaultMarkdownSlide.trim();
      else { blocks.splice(current, 1); selectedIndex = Math.min(current, blocks.length - 1); }
    }
    if (action === 'move' && blocks.length > 1) {
      const destination = normalizedIndex(targetIndex, blocks.length);
      const [slide] = blocks.splice(current, 1);
      blocks.splice(destination, 0, slide);
      selectedIndex = destination;
    }
    return { source: `${blocks.join('\n\n---\n\n')}\n`, currentIndex: selectedIndex };
  }

  const document = parseRichSource(source, sourceKind);
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('A rich presentation must be a document object.');
  if (!Array.isArray(document.slides)) document.slides = [];
  if (!document.slides.length) document.slides.push(defaultRichSlide());
  const current = normalizedIndex(index, document.slides.length);
  let selectedIndex = current;
  if (action === 'add') { document.slides.splice(current + 1, 0, defaultRichSlide()); selectedIndex = current + 1; }
  if (action === 'duplicate') { document.slides.splice(current + 1, 0, structuredClone(document.slides[current])); selectedIndex = current + 1; }
  if (action === 'delete') {
    if (document.slides.length === 1) document.slides[0] = defaultRichSlide();
    else { document.slides.splice(current, 1); selectedIndex = Math.min(current, document.slides.length - 1); }
  }
  if (action === 'move' && document.slides.length > 1) {
    const destination = normalizedIndex(targetIndex, document.slides.length);
    const [slide] = document.slides.splice(current, 1);
    document.slides.splice(destination, 0, slide);
    selectedIndex = destination;
  }
  return { source: stringifyRichSource(document, sourceKind), currentIndex: selectedIndex };
}

function assetTitle(value) {
  return String(value || 'Media').split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

/** Insert an imported asset as its own, fully editable slide after the selection. */
export function insertMediaSlideSource(source, sourceKind, index, { src, kind, alt } = {}) {
  const location = String(src || '').trim();
  if (!location) throw new Error('Choose a local media file first.');
  if (!['image', 'visual', 'video', 'audio'].includes(kind)) throw new Error(`Unsupported media kind: ${kind}`);
  const title = String(alt || assetTitle(location)).trim() || 'Media';
  if (sourceKind === 'markdown') {
    const blocks = markdownBlocks(source);
    const current = normalizedIndex(index, blocks.length);
    const media = kind === 'image' || kind === 'visual'
      ? `![${title}](${location})`
      : `@[${kind}: ${title}](${location})`;
    blocks.splice(current + 1, 0, `# ${title}\n${media}\n\nDescribe what the audience should notice.`);
    return { source: `${blocks.join('\n\n---\n\n')}\n`, currentIndex: current + 1 };
  }
  const document = parseRichSource(source, sourceKind);
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('A rich presentation must be a document object.');
  if (!Array.isArray(document.slides)) document.slides = [];
  const hasSlides = document.slides.length > 0;
  const current = normalizedIndex(index, Math.max(1, document.slides.length));
  const slide = { title, subtitle: 'Describe what the audience should notice.', notes: 'Add the context you want to say aloud.' };
  if (kind === 'image') Object.assign(slide, { layout: 'image', image: { src: location, alt: title } });
  if (kind === 'visual') Object.assign(slide, { layout: 'visual', visual: { src: location, alt: title } });
  if (kind === 'video' || kind === 'audio') Object.assign(slide, { layout: 'media', media: { kind, src: location, alt: title } });
  document.slides.splice(hasSlides ? current + 1 : 0, 0, slide);
  return { source: stringifyRichSource(document, sourceKind), currentIndex: hasSlides ? current + 1 : 0 };
}

function jsonSlideRanges(source) {
  const key = /"slides"\s*:\s*\[/.exec(source);
  if (!key) return [];
  const ranges = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let start = -1;
  for (let index = key.index + key[0].length; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') { inString = true; continue; }
    if (character === '{') { if (depth === 0) start = index; depth += 1; continue; }
    if (character === '}') { depth -= 1; if (depth === 0 && start >= 0) ranges.push({ start, end: index + 1 }); continue; }
    if (character === ']' && depth === 0) break;
  }
  return ranges;
}
