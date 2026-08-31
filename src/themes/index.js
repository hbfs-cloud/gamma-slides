import { corporate } from './corporate.js';
import { startup } from './startup.js';
import { dark } from './dark.js';
import { neon } from './neon.js';
import { minimal } from './minimal.js';
import { nature } from './nature.js';
import { boardroom } from './boardroom.js';

const themeRegistry = { boardroom, corporate, startup, dark, neon, minimal, nature };

function sanitizeColor(value, field) {
  const color = String(value).trim();
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${[...color.slice(1)].map(character => character.repeat(2)).join('')}`.toUpperCase();
  }
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`Invalid CSS color in style.${field}; use #RRGGBB`);
  return color.toUpperCase();
}

function sanitizeFont(value, field) {
  const font = String(value).trim();
  if (!font || font.length > 80 || !/^[\p{L}\p{N} _-]+$/u.test(font)) {
    throw new Error(`Invalid font family in style.${field}`);
  }
  return font;
}

export function getTheme(name, overrides = {}) {
  const theme = themeRegistry[name];
  if (!theme) {
    const available = Object.keys(themeRegistry).join(', ');
    throw new Error(`Unknown theme "${name}". Available: ${available}`);
  }

  // Merge style overrides
  const merged = { ...theme };
  if (overrides.primary_color) merged.primary = sanitizeColor(overrides.primary_color, 'primary_color');
  if (overrides.secondary_color) merged.secondary = sanitizeColor(overrides.secondary_color, 'secondary_color');
  if (overrides.accent_color) merged.accent = sanitizeColor(overrides.accent_color, 'accent_color');
  if (overrides.font_heading) merged.fontHeading = sanitizeFont(overrides.font_heading, 'font_heading');
  if (overrides.font_body) merged.fontBody = sanitizeFont(overrides.font_body, 'font_body');
  if (overrides.font_mono) merged.fontMono = sanitizeFont(overrides.font_mono, 'font_mono');

  // Recompute gradient if colors changed
  if (overrides.primary_color || overrides.secondary_color) {
    merged.gradient = `linear-gradient(135deg, ${merged.primary} 0%, ${merged.secondary} 100%)`;
  }

  return merged;
}

export function listThemes() {
  return Object.entries(themeRegistry).map(([key, t]) => ({
    name: key,
    label: t.label,
    description: t.description,
    primary: t.primary,
    secondary: t.secondary,
    background: t.background,
    mode: t.mode,
  }));
}
