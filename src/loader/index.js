import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { validateDeck } from '../schema/validate.js';
import { defaults, resolveVoice } from './defaults.js';

export function loadDeck(pathOrString) {
  let raw;
  let deck;

  // Detect if it's a file path or inline content
  if (pathOrString.trim().startsWith('{') || pathOrString.trim().startsWith('version') || pathOrString.trim().startsWith('slides')) {
    raw = pathOrString;
  } else {
    raw = readFileSync(resolve(pathOrString), 'utf-8');
  }

  // Parse YAML or JSON
  if (raw.trim().startsWith('{')) {
    deck = JSON.parse(raw);
  } else {
    deck = yaml.load(raw);
  }

  // Validate
  const { valid, errors } = validateDeck(deck);
  if (!valid) {
    const msgs = errors.map(e => `  ${e.instancePath || '/'}: ${e.message}`).join('\n');
    throw new Error(`Invalid deck specification:\n${msgs}`);
  }

  // Apply defaults (deep merge)
  deck = applyDefaults(deck);

  // Resolve voice from language if not explicit
  if (!deck.narration.voice || deck.narration.voice === defaults.narration.voice) {
    deck.narration.voice = resolveVoice(deck.meta.language, deck.narration.voice);
  }

  return deck;
}

function applyDefaults(deck) {
  return {
    version: deck.version || defaults.version,
    meta: { ...defaults.meta, ...deck.meta },
    branding: { ...defaults.branding, ...deck.branding },
    theme: deck.theme || defaults.theme,
    style: { ...defaults.style, ...deck.style },
    narration: { ...defaults.narration, ...deck.narration },
    music: { ...defaults.music, ...deck.music },
    video: {
      ...defaults.video,
      ...deck.video,
      thumbnail: { ...defaults.video.thumbnail, ...(deck.video?.thumbnail || {}) },
      youtube: { ...defaults.video.youtube, ...(deck.video?.youtube || {}) },
    },
    slides: (deck.slides || []).map(slide => ({
      layout: slide.layout || 'blank',
      transition: slide.transition || 'convex',
      columns: slide.columns || 3,
      ...slide,
    })),
  };
}
