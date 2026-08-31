import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { validateDeck } from '../schema/validate.js';
import { defaults, resolveVoice } from './defaults.js';

export function loadDeck(pathOrString) {
  const candidate = String(pathOrString);
  const resolvedPath = resolve(candidate);
  const raw = !candidate.includes('\n') && existsSync(resolvedPath)
    ? readFileSync(resolvedPath, 'utf-8')
    : candidate;

  return parseDeck(raw);
}

export function loadDeckFile(filePath) {
  return parseDeck(readFileSync(resolve(filePath), 'utf-8'));
}

export function parseDeck(raw) {
  let deck;

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
  const hasExplicitVoice = Boolean(deck.narration?.voice);
  deck = applyDefaults(deck);

  // Resolve voice from language if not explicit
  if (!hasExplicitVoice) {
    deck.narration.voice = resolveVoice(deck.meta.language);
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
      ...slide,
    })),
  };
}
