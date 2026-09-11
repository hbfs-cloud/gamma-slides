const SLIDE_BREAK = /(?:^|\r?\n)[ \t]*-{3,}[ \t]*(?=\r?\n|$)|\r?\n[ \t]*\r?\n[ \t]*\r?\n/gm;

function clean(value) {
  return String(value || '').trim();
}

function slugFromPath(filePath) {
  const leaf = clean(filePath).split(/[\\/]/).pop() || '';
  return leaf.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function splitSlides(markdown) {
  const blocks = clean(markdown).split(SLIDE_BREAK).map(clean).filter(Boolean);
  if (blocks.length > 1) return blocks;

  // iA-style writing also feels natural when every first-level heading starts a new beat.
  return clean(markdown)
    .split(/(?=^#\s+)/m)
    .map(clean)
    .filter(Boolean);
}

function parseSlide(block, index) {
  const lines = block.split(/\r?\n/);
  let title = '';
  let subtitle = '';
  let image = null;
  let media = null;
  const quoted = [];
  const tableRows = [];
  const items = [];
  const notes = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^\s)]+)\)$/i);
    if (imageMatch) {
      image = { alt: imageMatch[1] || 'Illustration', src: imageMatch[2] };
      continue;
    }
    const mediaMatch = line.match(/^@\[(video|audio)(?::\s*([^\]]+))?\]\(([^\s)]+)\)$/i);
    if (mediaMatch) {
      media = { kind: mediaMatch[1].toLowerCase(), alt: mediaMatch[2] || '', src: mediaMatch[3] };
      continue;
    }
    if (/^>\s?/.test(line)) {
      quoted.push(clean(line.replace(/^>\s?/, '')));
      continue;
    }
    if (/^\|.*\|$/.test(line)) {
      const cells = line.slice(1, -1).split('|').map(clean);
      if (!cells.every(cell => /^:?-{3,}:?$/.test(cell))) tableRows.push(cells);
      continue;
    }
    if (/^#\s+/.test(line)) {
      title ||= clean(line.replace(/^#\s+/, ''));
      continue;
    }
    if (/^##\s+/.test(line)) {
      const headline = clean(line.replace(/^##\s+/, ''));
      if (!subtitle) subtitle = headline;
      else items.push({ text: headline });
      continue;
    }
    if (/^(?:[-*+]\s+|\d+[.)]\s+)/.test(line)) {
      items.push({ text: clean(line.replace(/^(?:[-*+]\s+|\d+[.)]\s+)/, '')) });
      continue;
    }
    notes.push(line.replace(/^>\s?/, ''));
  }

  title ||= subtitle || `Slide ${index + 1}`;
  if (tableRows.length >= 2 && tableRows.every(row => row.length === tableRows[0].length)) {
    const [headers, ...rows] = tableRows;
    if (headers.length === 2) return { layout: 'comparison', title, subtitle, columns: headers.map((heading, column) => ({ heading, items: rows.map(row => row[column]) })), notes: notes.join('\n') };
    return { layout: 'table', title, subtitle, table: { headers, rows }, notes: notes.join('\n') };
  }
  if (quoted.length) {
    const citation = quoted.join(' ').match(/^(.*?)(?:\s+[—–]\s+|\s+--\s+)(.+)$/);
    return { layout: 'quote', title, quote: citation?.[1] || quoted.join(' '), author: citation?.[2] || '', notes: notes.join('\n') };
  }
  if (media) return { layout: 'media', title, subtitle, media, notes: notes.join('\n') };
  if (image) return { layout: 'image', title, subtitle, image, notes: notes.join('\n') };
  if (index === 0 && items.length === 0) {
    return { layout: 'title', title, subtitle, notes: notes.join('\n'), show_meta: false };
  }
  return {
    layout: 'bullets',
    title,
    subtitle: subtitle && subtitle !== title ? subtitle : undefined,
    items: items.length ? items : [{ text: 'Keep writing the points you want to show here.' }],
    notes: notes.join('\n'),
  };
}

/**
 * Convert the deliberately small Gamma Presenter Markdown dialect to a regular
 * Gamma Slides deck. The output remains plain deck data, so all downstream
 * renderers and exports continue to use the existing engine.
 */
export function markdownToDeck(markdown, { title, filePath, theme = 'signal-room' } = {}) {
  const source = clean(markdown);
  const blocks = splitSlides(source || '# New presentation\n\nWrite your story here.');
  const deckTitle = clean(title) || slugFromPath(filePath) || parseSlide(blocks[0], 0).title || 'New presentation';

  return {
    version: '1.0',
    meta: { title: deckTitle, language: 'en', presentation: 'direct' },
    theme,
    slides: blocks.map(parseSlide),
  };
}

export const starterMarkdown = `# A clear story
## The message your audience should remember

This is your through-line. It stays in your notes and is not projected.

---

# Three decisions, not fifteen
## Bring the essential idea forward
- One idea per line
- Details in notes
- A rhythm you can repeat

This note appears in the speaker view, at a comfortable size.\n`;
