import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadDeck } from '../loader/index.js';
import { renderDeck } from '../engine/renderer.js';
import { buildStaticSite } from '../site/build.js';
import { generateVideoFromDeck } from '../video/generate-v2.js';
import { generateThumbnail } from '../video/thumbnail.js';
import { listThemes } from '../themes/index.js';
import { schema } from '../schema/validate.js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { execFileSync } from 'child_process';

const server = new McpServer({
  name: 'gamma-slides',
  version: '2.0.0',
}, {
  instructions: 'Create presentation sites in this order: inspect gamma://schema/deck and gamma://examples/flagship when needed, choose one of the three presentation themes, draft a coherent narrative, validate with gamma_validate_deck, then call gamma_generate_deck or gamma_build_site. Prefer real sourced data, concise slide copy, varied layouts, native ECharts, a persistent brand identity, and speaker narration. Never invent financial facts. gamma_build_site produces a self-contained index.html ready for static hosting.',
});

server.registerResource('deck-schema', 'gamma://schema/deck', {
  title: 'Gamma Slides deck schema',
  description: 'Authoritative JSON Schema for YAML or JSON presentation specifications.',
  mimeType: 'application/json',
}, async uri => ({
  contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(schema, null, 2) }],
}));

server.registerResource('flagship-example', 'gamma://examples/flagship', {
  title: 'Gamma Finance flagship deck',
  description: 'Complete reference deck demonstrating layouts, live ECharts, branding, tables, narration, and the three presentation themes.',
  mimeType: 'application/yaml',
}, async uri => ({
  contents: [{
    uri: uri.href,
    mimeType: 'application/yaml',
    text: readFileSync(new URL('../schema/examples/corporate-demo.yaml', import.meta.url), 'utf-8'),
  }],
}));

server.registerPrompt('create_presentation', {
  title: 'Create a premium Gamma Slides presentation',
  description: 'Plan, author, validate, and generate a polished presentation site.',
  argsSchema: {
    topic: z.string().describe('Presentation subject and available facts or source material'),
    audience: z.string().describe('Who will view the presentation'),
    objective: z.string().describe('Decision, understanding, or action the deck should produce'),
    language: z.string().optional().describe('Deck language, default: en'),
    slide_count: z.string().optional().describe('Approximate slide count, default: 10-14'),
  },
}, ({ topic, audience, objective, language = 'en', slide_count = '10-14' }) => ({
  description: 'Gamma Slides authoring workflow',
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `Create a premium ${slide_count}-slide Gamma Slides presentation in ${language}.\n\nTopic and facts:\n${topic}\n\nAudience: ${audience}\nObjective: ${objective}\n\nBuild a clear narrative arc, select the theme whose purpose matches the audience, vary layouts intentionally, use native ECharts for quantitative claims, keep copy concise, and include discreet branding plus useful narration. Do not invent facts. Read the schema and flagship resource as needed, validate the complete YAML, fix every validation error, then build the static site. Return the generated index.html path and a short narrative summary.`,
    },
  }],
}));

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

server.tool('gamma_build_site', 'Build a self-contained static presentation site ready for GitHub Pages or any static host', {
  deck: z.string().describe('Deck specification as a YAML or JSON string'),
  output_dir: z.string().optional().describe('Site directory (default: ./site) containing index.html'),
  theme: z.string().optional().describe('Override presentation theme'),
}, async ({ deck: deckStr, output_dir, theme }) => {
  const d = loadDeck(deckStr);
  if (theme) d.theme = theme;
  const result = buildStaticSite(d, output_dir || './site');
  return { content: [{ type: 'text', text: `Static site ready: ${result.siteDir}\nEntry: ${result.indexPath}\n${result.slides} slides, theme: ${result.theme}\nPublish this directory with GitHub Pages or another static host.` }] };
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
  const filter = `${language || 'en'}-`;
  const voices = execFileSync('edge-tts', ['--list-voices'], { encoding: 'utf-8' })
    .split('\n')
    .filter(line => line.includes(filter))
    .slice(0, 30)
    .join('\n');
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
