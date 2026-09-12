import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const archifyRoot = fileURLToPath(new URL('../vendor/archify/', import.meta.url));
export const diagramTypes = ['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle'];
const cache = new Map();

/**
 * `process.execPath` is Electron itself in the packaged Author app.  Its
 * Archify compiler and the compiler's renderer children are ordinary Node
 * scripts, so preserve Electron's supported Node mode for this process tree.
 */
export function archifyChildEnvironment(environment = process.env, versions = process.versions) {
  const childEnvironment = { ...environment, ARCHIFY_UPDATE_CHECK_DISABLED: '1' };
  if (versions?.electron) childEnvironment.ELECTRON_RUN_AS_NODE = '1';
  return childEnvironment;
}

/** Run the pinned, unmodified Archify delivery pipeline; never accept last-good output after failure. */
export function compileDiagram(diagram) {
  if (!diagramTypes.includes(diagram?.type) || !diagram.spec || diagram.spec.diagram_type !== diagram.type) throw new Error('Archify requires a supported type and a matching typed spec.');
  const source = JSON.stringify(diagram.spec);
  const key = createHash('sha256').update(source).digest('hex');
  if (cache.has(key)) return cache.get(key);
  const directory = mkdtempSync(join(tmpdir(), 'gamma-archify-'));
  try {
    const input = join(directory, 'diagram.json'), output = join(directory, 'diagram.html');
    writeFileSync(input, source);
    const child = spawnSync(process.execPath, [join(archifyRoot, 'bin/archify.mjs'), 'deliver', diagram.type, input, output, '--quality', 'showcase', '--json'], {
      encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
      env: archifyChildEnvironment(),
    });
    let receipt;
    try { receipt = JSON.parse(child.stdout); } catch { /* Surface the upstream diagnostic below. */ }
    if (child.error || child.status !== 0 || !receipt?.ok) throw new Error(`Archify ${diagram.type}: ${receipt?.error || child.error?.message || child.stderr || child.stdout || 'delivery failed'}`);
    const html = readFileSync(output, 'utf8');
    const svg = html.match(/<svg\b[^>]*data-diagram-type[\s\S]*?<\/svg>/)?.[0] || html.match(/<svg\b[^>]*role="img"[\s\S]*?<\/svg>/)?.[0];
    if (!svg) throw new Error('Archify delivered no semantic SVG diagram.');
    const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n');
    const result = { html, svg, css, sourceHash: key, receipt };
    if (cache.size >= 32) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    return result;
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
