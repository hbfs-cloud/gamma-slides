import { parseRichSource, stringifyRichSource } from './deck-source.js';

const color = value => typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value) ? value : '';
const label = value => String(value || '').trim().slice(0, 120);

/** Normalizes only deck-level identity. Slide-level content and overrides are never touched. */
export function normalizeCorporateProfile(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const branding = source.branding && typeof source.branding === 'object' ? source.branding : {};
  const style = source.style && typeof source.style === 'object' ? source.style : {};
  const normalized = {
    name: label(source.name) || 'Corporate profile',
    company: label(source.company),
    theme: label(source.theme),
    apply_to_new_rich_decks: Boolean(source.apply_to_new_rich_decks),
    branding: Object.fromEntries(Object.entries({ logo: label(branding.logo), watermark: label(branding.watermark), favicon: label(branding.favicon), company_url: label(branding.company_url) }).filter(([, value]) => value)),
    style: Object.fromEntries(Object.entries({ primary_color: color(style.primary_color), secondary_color: color(style.secondary_color), accent_color: color(style.accent_color), font_heading: label(style.font_heading), font_body: label(style.font_body), font_mono: label(style.font_mono) }).filter(([, value]) => value)),
  };
  return normalized;
}

export function applyCorporateProfileSource(source, sourceKind, profile) {
  if (!['yaml', 'json'].includes(sourceKind)) throw new Error('Corporate profiles apply to rich YAML or JSON decks. Convert a Markdown document to a rich deck when it needs a formal brand system.');
  const document = parseRichSource(source, sourceKind);
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('The presentation source must be a deck object.');
  const normalized = normalizeCorporateProfile(profile);
  if (normalized.company) document.meta = { ...(document.meta || {}), company: normalized.company };
  if (normalized.theme) document.theme = normalized.theme;
  document.branding = { ...(document.branding || {}), ...normalized.branding };
  document.style = { ...(document.style || {}), ...normalized.style };
  return stringifyRichSource(document, sourceKind);
}

export function corporateProfileSummary(profile) {
  const value = normalizeCorporateProfile(profile);
  return { name: value.name, company: value.company, theme: value.theme, applyToNewRichDecks: value.apply_to_new_rich_decks, hasLogo: Boolean(value.branding.logo), colorCount: Object.keys(value.style).filter(key => key.endsWith('_color')).length };
}
