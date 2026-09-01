import { readFileSync, writeFileSync } from 'fs';
import { dirname, extname, resolve } from 'path';
import { mkdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { loadDeck, loadDeckFile } from '../loader/index.js';

export const DEFAULT_PAGES_REPO = 'hbfs-cloud/gamma-slides';

export function presentationSlug(value) {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  if (!slug) throw new Error('Presentation slug must contain at least one letter or number.');
  return slug;
}

export function normalizePagesRepo(value = DEFAULT_PAGES_REPO) {
  const repo = String(value || DEFAULT_PAGES_REPO).trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error('GitHub repository must look like owner/repository.');
  }
  return repo;
}

export function presentationUrl(repo, slug) {
  const [owner, name] = normalizePagesRepo(repo).split('/');
  return `https://${owner}.github.io/${name}/${presentationSlug(slug)}/`;
}

function runGh(args, { allowNotFound = false } = {}) {
  const result = spawnSync('gh', args, { encoding: 'utf-8' });
  if (result.error?.code === 'ENOENT') {
    throw new Error('GitHub CLI is required. Install gh, then run `gh auth login`.');
  }
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || 'GitHub command failed').trim();
    if (allowNotFound && /(?:HTTP )?404|Not Found/i.test(message)) return null;
    throw new Error(message);
  }
  return result.stdout;
}

function contentsEndpoint(repo, path = 'presentations') {
  return `repos/${normalizePagesRepo(repo)}/contents/${path}`;
}

function decodeContent(encoded) {
  return Buffer.from(String(encoded || '').replace(/\s/g, ''), 'base64').toString('utf-8');
}

function getRemoteFile(repo, path, { allowNotFound = false } = {}) {
  const output = runGh(['api', contentsEndpoint(repo, path)], { allowNotFound });
  return output ? JSON.parse(output) : null;
}

function remoteEntries(repo) {
  const output = runGh(['api', contentsEndpoint(repo)], { allowNotFound: true });
  if (!output) return [];
  const entries = JSON.parse(output);
  return Array.isArray(entries)
    ? entries.filter(item => item.type === 'file' && /\.(?:ya?ml|json)$/i.test(item.name))
    : [];
}

function findRemoteEntry(repo, slug) {
  const normalized = presentationSlug(slug);
  return remoteEntries(repo).find(item => presentationSlug(item.name.replace(/\.(?:ya?ml|json)$/i, '')) === normalized) || null;
}

export function deployPresentationFile({ file, repo = DEFAULT_PAGES_REPO, slug }) {
  const deck = loadDeckFile(file);
  const source = readFileSync(resolve(file), 'utf-8');
  return deployPresentationSource({
    deck: source,
    repo,
    slug: slug || deck.meta?.title || 'presentation',
    title: deck.meta?.title,
  });
}

export function deployPresentationSource({ deck: source, repo = DEFAULT_PAGES_REPO, slug, title }) {
  const parsed = loadDeck(source);
  const normalizedRepo = normalizePagesRepo(repo);
  const normalizedSlug = presentationSlug(slug || parsed.meta?.title || 'presentation');
  const existing = findRemoteEntry(normalizedRepo, normalizedSlug);
  const path = existing?.path || `presentations/${normalizedSlug}.yaml`;
  const args = [
    'api', '--method', 'PUT', contentsEndpoint(normalizedRepo, path),
    '-f', `message=slides: ${existing ? 'update' : 'deploy'} ${normalizedSlug}`,
    '-f', `content=${Buffer.from(source, 'utf-8').toString('base64')}`,
  ];
  if (existing?.sha) args.push('-f', `sha=${existing.sha}`);
  runGh(args);
  return {
    action: existing ? 'updated' : 'created',
    repo: normalizedRepo,
    slug: normalizedSlug,
    title: title || parsed.meta?.title || normalizedSlug,
    slides: parsed.slides.length,
    theme: parsed.theme,
    path,
    url: presentationUrl(normalizedRepo, normalizedSlug),
    actionsUrl: `https://github.com/${normalizedRepo}/actions/workflows/pages.yml`,
  };
}

export function listPresentations(repo = DEFAULT_PAGES_REPO) {
  const normalizedRepo = normalizePagesRepo(repo);
  return remoteEntries(normalizedRepo).map(entry => {
    const metadata = getRemoteFile(normalizedRepo, entry.path);
    const source = decodeContent(metadata.content);
    const deck = loadDeck(source);
    const slug = presentationSlug(entry.name.replace(/\.(?:ya?ml|json)$/i, ''));
    return {
      slug,
      title: deck.meta?.title || slug,
      slides: deck.slides.length,
      theme: deck.theme,
      path: entry.path,
      url: presentationUrl(normalizedRepo, slug),
    };
  });
}

export function getPresentation({ repo = DEFAULT_PAGES_REPO, slug }) {
  const normalizedRepo = normalizePagesRepo(repo);
  const entry = findRemoteEntry(normalizedRepo, slug);
  if (!entry) throw new Error(`Presentation not found: ${presentationSlug(slug)}`);
  const metadata = getRemoteFile(normalizedRepo, entry.path);
  const source = decodeContent(metadata.content);
  const deck = loadDeck(source);
  return {
    slug: presentationSlug(entry.name.replace(/\.(?:ya?ml|json)$/i, '')),
    title: deck.meta?.title || slug,
    slides: deck.slides.length,
    theme: deck.theme,
    path: entry.path,
    source,
    url: presentationUrl(normalizedRepo, slug),
  };
}

export function pullPresentation({ repo = DEFAULT_PAGES_REPO, slug, output }) {
  const result = getPresentation({ repo, slug });
  const outputPath = resolve(output || `${result.slug}.yaml`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, result.source, 'utf-8');
  return { ...result, outputPath };
}

export function deletePresentation({ repo = DEFAULT_PAGES_REPO, slug }) {
  const normalizedRepo = normalizePagesRepo(repo);
  const entry = findRemoteEntry(normalizedRepo, slug);
  if (!entry) throw new Error(`Presentation not found: ${presentationSlug(slug)}`);
  runGh([
    'api', '--method', 'DELETE', contentsEndpoint(normalizedRepo, entry.path),
    '-f', `message=slides: delete ${presentationSlug(slug)}`,
    '-f', `sha=${entry.sha}`,
  ]);
  return { repo: normalizedRepo, slug: presentationSlug(slug), path: entry.path };
}
