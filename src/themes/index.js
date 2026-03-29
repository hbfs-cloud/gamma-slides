import { corporate } from './corporate.js';
import { startup } from './startup.js';
import { dark } from './dark.js';
import { neon } from './neon.js';
import { minimal } from './minimal.js';
import { nature } from './nature.js';

const themeRegistry = { corporate, startup, dark, neon, minimal, nature };

export function getTheme(name, overrides = {}) {
  const theme = themeRegistry[name];
  if (!theme) {
    const available = Object.keys(themeRegistry).join(', ');
    throw new Error(`Unknown theme "${name}". Available: ${available}`);
  }

  // Merge style overrides
  const merged = { ...theme };
  if (overrides.primary_color) merged.primary = overrides.primary_color;
  if (overrides.secondary_color) merged.secondary = overrides.secondary_color;
  if (overrides.accent_color) merged.accent = overrides.accent_color;
  if (overrides.font_heading) merged.fontHeading = overrides.font_heading;
  if (overrides.font_body) merged.fontBody = overrides.font_body;
  if (overrides.font_mono) merged.fontMono = overrides.font_mono;

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
