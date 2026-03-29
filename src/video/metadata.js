import { writeFileSync } from 'fs';

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function generateYouTubeMetadata(deck, audioDurations) {
  const yt = deck.video?.youtube || {};
  const meta = deck.meta || {};

  // Title
  const title = yt.title || meta.title || 'Presentation';

  // Chapters
  const chapters = [];
  let cursor = 0;
  for (let i = 0; i < deck.slides.length; i++) {
    const slide = deck.slides[i];
    const slideTitle = slide.title || `Slide ${i + 1}`;
    chapters.push({ time: cursor, title: slideTitle });
    cursor += (audioDurations[i] || 0) + 1.5;
  }

  const chaptersText = chapters.map(c => `${formatTimestamp(c.time)} ${c.title}`).join('\n');

  // Description
  const description = [
    yt.description || meta.description || '',
    '',
    '📑 Chapters:',
    chaptersText,
    '',
    `🏢 ${meta.company || ''}`,
    meta.author ? `👤 Presented by ${meta.author}` : '',
    meta.date ? `📅 ${meta.date}` : '',
    '',
    '🎬 Generated with gamma-slides',
    yt.playlist ? `📋 Playlist: ${yt.playlist}` : '',
  ].filter(Boolean).join('\n');

  // Tags
  const tags = [
    ...(yt.tags || []),
    ...(meta.tags || []),
    meta.company,
    'presentation',
  ].filter(Boolean);

  const metadata = {
    title,
    description,
    tags,
    category: yt.category || 'Education',
    chapters,
    chaptersText,
    playlist: yt.playlist || null,
  };

  return metadata;
}

export function writeMetadataFiles(metadata, basePath) {
  const base = basePath.replace(/\.[^.]+$/, '');

  // YouTube description file
  writeFileSync(`${base}.description.txt`, metadata.description, 'utf-8');

  // Tags file
  writeFileSync(`${base}.tags.txt`, metadata.tags.join(', '), 'utf-8');

  // Full metadata JSON
  writeFileSync(`${base}.meta.json`, JSON.stringify(metadata, null, 2), 'utf-8');

  return {
    description: `${base}.description.txt`,
    tags: `${base}.tags.txt`,
    meta: `${base}.meta.json`,
  };
}
