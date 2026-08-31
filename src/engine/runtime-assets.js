import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);

function readPackageText(specifier) {
  return readFileSync(require.resolve(specifier), 'utf8');
}

function readPackageBinary(specifier) {
  return readFileSync(require.resolve(specifier)).toString('base64');
}

function protectInlineScript(source) {
  // A dependency must never be able to terminate the containing script node.
  return source
    .replace(/<\/script/giu, '<\\/script')
    .replace(/\.onerror\b/gu, "['onerror']")
    .replace(/^\s*\/\/# sourceMappingURL=.*$/gmu, '');
}

function protectInlineStyle(source) {
  return source
    .replace(/<\/style/giu, '<\\/style')
    .replace(/\/\*# sourceMappingURL=.*?\*\//gsu, '');
}

const revealCss = protectInlineStyle(readPackageText('reveal.js/dist/reveal.css'));
const revealJs = protectInlineScript(readPackageText('reveal.js/dist/reveal.js'));
const revealNotesJs = protectInlineScript(readPackageText('reveal.js/plugin/notes/notes.js'));
const echartsJs = protectInlineScript(readPackageText('echarts/dist/echarts.min.js'));

export const deckRuntimeAssets = Object.freeze({
  revealCss,
  revealJs,
  revealNotesJs,
  echartsJs,
});

let legacyRuntimeAssets;

export function getLegacyRuntimeAssets() {
  if (legacyRuntimeAssets) return legacyRuntimeAssets;

  const chartEntry = require.resolve('chart.js');
  const chartUmdPath = join(dirname(chartEntry), 'chart.umd.js');
  legacyRuntimeAssets = Object.freeze({
    revealCss,
    revealThemeCss: protectInlineStyle(readPackageText('reveal.js/dist/theme/black.css')),
    revealJs,
    chartJs: protectInlineScript(readFileSync(chartUmdPath, 'utf8')),
  });
  return legacyRuntimeAssets;
}

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

function fontFace({ family, specifier, weight, style = 'normal', stretch, unicodeRange, format = 'woff2-variations' }) {
  const encoded = readPackageBinary(specifier);
  return `@font-face {
    font-family: '${family}';
    font-style: ${style};
    font-display: block;
    font-weight: ${weight};
    ${stretch ? `font-stretch: ${stretch};` : ''}
    src: url(data:font/woff2;base64,${encoded}) format('${format}');
    unicode-range: ${unicodeRange};
  }`;
}

function pairedVariableFaces({ family, packageName, fileStem, suffix, weight, style, stretch, format }) {
  return [
    fontFace({
      family,
      specifier: `${packageName}/files/${fileStem}-latin-ext-${suffix}.woff2`,
      weight,
      style,
      stretch,
      format,
      unicodeRange: LATIN_EXT,
    }),
    fontFace({
      family,
      specifier: `${packageName}/files/${fileStem}-latin-${suffix}.woff2`,
      weight,
      style,
      stretch,
      format,
      unicodeRange: LATIN,
    }),
  ].join('\n');
}

const fontBundles = new Map();

function boardroomFonts() {
  if (fontBundles.has('boardroom')) return fontBundles.get('boardroom');
  const css = [
    pairedVariableFaces({
      family: 'Instrument Sans',
      packageName: '@fontsource-variable/instrument-sans',
      fileStem: 'instrument-sans',
      suffix: 'standard-normal',
      weight: '400 700',
      stretch: '75% 100%',
    }),
    pairedVariableFaces({
      family: 'Source Serif 4',
      packageName: '@fontsource-variable/source-serif-4',
      fileStem: 'source-serif-4',
      suffix: 'standard-italic',
      weight: '200 900',
      style: 'italic',
    }),
    ...[400, 500, 600].map(weight => pairedVariableFaces({
      family: 'IBM Plex Mono',
      packageName: '@fontsource/ibm-plex-mono',
      fileStem: 'ibm-plex-mono',
      suffix: `${weight}-normal`,
      weight: String(weight),
      format: 'woff2',
    })),
  ].join('\n');
  fontBundles.set('boardroom', css);
  return css;
}

function standardFonts() {
  if (fontBundles.has('standard')) return fontBundles.get('standard');
  const css = [
    pairedVariableFaces({
      family: 'Inter',
      packageName: '@fontsource-variable/inter',
      fileStem: 'inter',
      suffix: 'standard-normal',
      weight: '100 900',
    }),
    pairedVariableFaces({
      family: 'JetBrains Mono',
      packageName: '@fontsource-variable/jetbrains-mono',
      fileStem: 'jetbrains-mono',
      suffix: 'wght-normal',
      weight: '100 800',
    }),
  ].join('\n');
  fontBundles.set('standard', css);
  return css;
}

export function embeddedFontCSS(theme = {}) {
  const names = [theme.fontHeading, theme.fontBody, theme.fontDisplay, theme.fontMono, theme.fontFamily]
    .filter(Boolean)
    .join(' ');
  const bundles = [];
  if (/Instrument Sans|Source Serif 4|IBM Plex Mono/u.test(names)) bundles.push(boardroomFonts());
  if (/\bInter\b|JetBrains Mono/u.test(names)) bundles.push(standardFonts());
  return bundles.join('\n');
}
