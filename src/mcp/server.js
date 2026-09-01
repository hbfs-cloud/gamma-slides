import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadDeck } from '../loader/index.js';
import { renderDeck } from '../engine/renderer.js';
import { buildStaticSite } from '../site/build.js';
import {
  DEFAULT_PAGES_REPO,
  deletePresentation,
  deployPresentationSource,
  getPresentation,
  listPresentations,
} from '../site/github-pages.js';
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
  instructions: 'Create presentation sites in this order: inspect gamma://schema/deck and gamma://examples/flagship when needed, choose one of the three presentation themes, draft a coherent narrative, validate with gamma_validate_deck, then call gamma_generate_deck, gamma_build_site, or gamma_deploy_site. Prefer real sourced data, concise slide copy, varied layouts, native ECharts, persistent brand identity, and speaker narration. Never invent financial facts. Deployments are CRUD-managed by stable slug: list or read first, deploy the same slug to update, and delete only after explicit user confirmation.',
});
const managedPagesRepo = process.env.GAMMA_SLIDES_REPO || DEFAULT_PAGES_REPO;

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

server.registerTool('gamma_deploy_site', {
  title: 'Create or update a GitHub Pages presentation',
  description: 'Validate a deck and create or update its stable public URL in the managed GitHub Pages library.',
  inputSchema: {
    deck: z.string().describe('Complete deck specification as YAML or JSON'),
    slug: z.string().optional().describe('Stable public slug; defaults to the deck title. Reuse it to update.'),
    repo: z.string().optional().describe(`GitHub repository, default: ${managedPagesRepo}`),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async ({ deck, slug, repo }) => {
  const result = deployPresentationSource({ deck, slug, repo: repo || managedPagesRepo });
  return { content: [{ type: 'text', text: `Presentation ${result.action}: ${result.title}\nPublic URL: ${result.url}\nSource: ${result.repo}/${result.path}\nDeployment status: ${result.actionsUrl}` }] };
});

server.registerTool('gamma_list_sites', {
  title: 'List deployed presentations',
  description: 'List managed presentation slugs, titles, metadata, and public URLs.',
  inputSchema: { repo: z.string().optional().describe(`GitHub repository, default: ${managedPagesRepo}`) },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async ({ repo }) => {
  const sites = listPresentations(repo || managedPagesRepo);
  const text = sites.length
    ? sites.map(site => `${site.slug}\n  ${site.title} · ${site.slides} slides · ${site.theme}\n  ${site.url}`).join('\n')
    : 'No managed presentations yet.';
  return { content: [{ type: 'text', text }] };
});

server.registerTool('gamma_get_site', {
  title: 'Read a deployed presentation',
  description: 'Retrieve the editable YAML/JSON source and public metadata for one managed presentation.',
  inputSchema: {
    slug: z.string().describe('Presentation slug'),
    repo: z.string().optional().describe(`GitHub repository, default: ${managedPagesRepo}`),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async ({ slug, repo }) => {
  const site = getPresentation({ slug, repo: repo || managedPagesRepo });
  return { content: [{ type: 'text', text: `Slug: ${site.slug}\nTitle: ${site.title}\nPublic URL: ${site.url}\n\n${site.source}` }] };
});

server.registerTool('gamma_delete_site', {
  title: 'Delete a deployed presentation',
  description: 'Permanently delete a managed presentation source. Call only after the user explicitly confirms the exact slug.',
  inputSchema: {
    slug: z.string().describe('Exact presentation slug confirmed by the user'),
    repo: z.string().optional().describe(`GitHub repository, default: ${managedPagesRepo}`),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
}, async ({ slug, repo }) => {
  const result = deletePresentation({ slug, repo: repo || managedPagesRepo });
  return { content: [{ type: 'text', text: `Deleted presentation: ${result.slug}\nGitHub Pages will remove the public route after the deployment workflow completes.` }] };
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
