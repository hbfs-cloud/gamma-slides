import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadDeck } from '../loader/index.js';
import { renderDeck } from '../engine/renderer.js';
import { generateVideoFromDeck } from '../video/generate-v2.js';
import { generateThumbnail } from '../video/thumbnail.js';
import { listThemes } from '../themes/index.js';
import { schema } from '../schema/validate.js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';

const server = new McpServer({
  name: 'gamma-slides',
  version: '2.0.0',
});

// Tool: Generate HTML deck
server.tool('gamma_generate_deck', 'Generate an HTML presentation from a YAML/JSON deck spec', {
  deck: z.string().describe('Deck specification as YAML or JSON string'),
  output_dir: z.string().optional().describe('Output directory (default: ./output/)'),
  theme: z.string().optional().describe('Override theme'),
}, async ({ deck: deckStr, output_dir, theme }) => {
  const d = loadDeck(deckStr);
  if (theme) d.theme = theme;
  const html = renderDeck(d);
  const outDir = resolve(output_dir || './output');
  mkdirSync(outDir, { recursive: true });
  const slug = (d.meta?.title || 'presentation').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const outPath = resolve(outDir, `${slug}.html`);
  writeFileSync(outPath, html, 'utf-8');
  return { content: [{ type: 'text', text: `Presentation generated: ${outPath}\n${d.slides.length} slides, theme: ${d.theme}` }] };
});

// Tool: Generate video
server.tool('gamma_generate_video', 'Generate a narrated MP4 video with TTS, transitions, and subtitles', {
  deck: z.string().describe('Deck specification as YAML/JSON string'),
  output_path: z.string().optional().describe('Output video path'),
  subtitles: z.boolean().optional().describe('Generate SRT subtitles'),
}, async ({ deck: deckStr, output_path, subtitles }) => {
  const d = loadDeck(deckStr);
  const html = renderDeck(d);
  const slug = (d.meta?.title || 'presentation').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const htmlPath = resolve('./output', `${slug}.html`);
  const videoPath = resolve(output_path || `./output/${slug}.mp4`);
  mkdirSync(dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, html, 'utf-8');
  const result = await generateVideoFromDeck(d, htmlPath, videoPath, { srt: subtitles !== false });
  return { content: [{ type: 'text', text: `Video generated: ${result.outputPath}\n${result.slides} slides, ${result.duration.toFixed(0)}s\nSubtitles: ${result.srtPath || 'none'}\nMetadata: ${result.metaFiles.meta}` }] };
});

// Tool: Validate deck
server.tool('gamma_validate_deck', 'Validate a deck spec against the schema', {
  deck: z.string().describe('Deck specification to validate'),
}, async ({ deck: deckStr }) => {
  try {
    const d = loadDeck(deckStr);
    return { content: [{ type: 'text', text: `Valid deck: ${d.slides.length} slides, theme: ${d.theme}` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Invalid: ${err.message}` }] };
  }
});

// Tool: List themes
server.tool('gamma_list_themes', 'List all available themes', {}, async () => {
  const themes = listThemes();
  const text = themes.map(t => `${t.name}: ${t.description} (${t.mode}, primary: ${t.primary})`).join('\n');
  return { content: [{ type: 'text', text }] };
});

// Tool: List voices
server.tool('gamma_list_voices', 'List available TTS voices', {
  language: z.string().optional().describe('Filter by language code (en, fr, es...)'),
}, async ({ language }) => {
  const filter = language ? `"${language}-"` : '"en-"';
  const voices = execSync(`edge-tts --list-voices 2>/dev/null | grep ${filter} | head -30`, { encoding: 'utf-8' });
  return { content: [{ type: 'text', text: voices || 'No voices found' }] };
});

// Tool: Get schema
server.tool('gamma_get_schema', 'Get the full deck JSON Schema', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }] };
});

// Tool: Generate thumbnail
server.tool('gamma_generate_thumbnail', 'Generate a thumbnail from a slide', {
  html_path: z.string().describe('Path to generated HTML'),
  slide_index: z.number().optional().describe('Slide index (0-based)'),
  text_overlay: z.string().optional().describe('Text to overlay'),
  output_path: z.string().optional().describe('Output image path'),
}, async ({ html_path, slide_index, text_overlay, output_path }) => {
  const out = output_path || html_path.replace(/\.html$/, '_thumb.png');
  await generateThumbnail({ htmlPath: resolve(html_path), slideIndex: slide_index || 0, textOverlay: text_overlay, outputPath: resolve(out) });
  return { content: [{ type: 'text', text: `Thumbnail: ${out}` }] };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
