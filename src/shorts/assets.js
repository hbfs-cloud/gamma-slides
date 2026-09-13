import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

const TIMEOUT_MS = 20_000;
const RETRIES = 1;
const IMAGE_TYPES = new Map([
  ['png', { ext: 'png', mime: 'image/png' }],
  ['jpeg', { ext: 'jpg', mime: 'image/jpeg' }],
  ['svg', { ext: 'svg', mime: 'image/svg+xml' }],
  ['webp', { ext: 'webp', mime: 'image/webp' }],
]);

const hash = value => createHash('sha256').update(value).digest('hex');
const safeTicker = ticker => String(ticker).replace(/[^A-Za-z0-9._-]/g, '_');
const isText = value => typeof value === 'string' && value.trim().length > 0;

function normalizeItems(registry) {
  if (Array.isArray(registry)) return registry;
  if (Array.isArray(registry?.items)) return registry.items;
  throw Error('Asset registry must be a JSON array or an object with an items array');
}

function assetSource(item, kind) {
  return item[`${kind}_url`] ?? item[kind] ?? null;
}

function sourceUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) return null;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1' || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
  return url;
}

function detectImage(bytes) {
  if(bytes.length>=12&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return IMAGE_TYPES.get('webp');
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return IMAGE_TYPES.get('png');
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return IMAGE_TYPES.get('jpeg');
  const text = bytes.subarray(0, 16 * 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart();
  if (/^<html\b/i.test(text) || /<!doctype\s+html/i.test(text)) return null;
  if (/^(?:<\?xml[^>]*>\s*)?<svg\b/i.test(text)) return IMAGE_TYPES.get('svg');
  return null;
}

function relativePath(output, path) {
  const result = relative(output, path);
  if (!result || result.startsWith('..')) throw Error('Asset path escaped output directory');
  return result.split('\\').join('/');
}

async function fileExists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

async function writeAtomic(path, bytes) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, bytes);
  await rename(temporary, path);
}

async function fetchPublicImage(url, fetcher) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetcher(url, { signal: controller.signal, redirect: 'follow' });
      if (!response?.ok) throw Error(`HTTP ${response?.status ?? 'unknown'}`);
      if (response.url && !sourceUrl(response.url)) throw Error('Redirected asset is not a public HTTPS URL');
      const bytes = Buffer.from(await response.arrayBuffer());
      const type = detectImage(bytes);
      if (!type) throw Error('Response is not a verified PNG, JPEG, or SVG image');
      return { bytes, type, fetchedAt: new Date().toISOString() };
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? Error('Asset fetch failed');
}

async function readLocalImage(path) {
  const bytes = await readFile(path);
  const type = detectImage(bytes);
  if (!type) throw Error('Local file is not a verified PNG, JPEG, or SVG image');
  return { bytes, type, fetchedAt: new Date().toISOString() };
}

async function acquireOne({ source, registryDirectory, output, cache, kind, fetcher }) {
  if (!isText(source)) throw Error(`Missing ${kind} source`);
  const url = sourceUrl(source);
  if (url) {
    const cacheKey = hash(url.href);
    const cacheBase = cache ? join(cache, cacheKey) : null;
    if (cacheBase) {
      for (const type of IMAGE_TYPES.values()) {
        const candidate = `${cacheBase}.${type.ext}`;
        if (await fileExists(candidate)) {
          const local = await readLocalImage(candidate);
          return { ...local, provenance: { source: url.href, origin: 'https-cache' }, cachePath: candidate };
        }
      }
    }
    const remote = await fetchPublicImage(url.href, fetcher);
    const cachePath = cacheBase ? `${cacheBase}.${remote.type.ext}` : null;
    if (cachePath) await writeAtomic(cachePath, remote.bytes);
    return { ...remote, provenance: { source: url.href, origin: 'https' }, cachePath };
  }
  if (/^[a-z][\w+.-]*:/i.test(source) || source.startsWith('//')) throw Error(`${kind} must be a local path or public HTTPS URL`);
  const path = resolve(registryDirectory, source);
  const local = await readLocalImage(path);
  return { ...local, provenance: { source, origin: 'local' }, cachePath: null };
}

function blocked(item, reasons, asof) {
  return {
    ticker: item?.ticker ?? null,
    company_name: item?.company_name ?? null,
    source_kind: item?.source_kind ?? null,
    status: 'blocked',
    blocked: reasons,
    identity: { issuer_verified: item?.issuer_verified === true, company_name: item?.company_name ?? null },
    date: { asof, verification: 'manual_confirmation_required', pixel_verified: false },
  };
}

/**
 * Acquire verified chart and logo assets for a local JSON registry.
 * `asof` is an operator-confirmed label: image pixels are never treated as date verification.
 */
export async function acquireAssets({ file, output, asof }) {
  if (!isText(file) || !isText(output) || !/^\d{4}-\d{2}-\d{2}$/.test(asof ?? '')) throw Error('file, output, and YYYY-MM-DD asof are required');
  const registryPath = resolve(file);
  const outputPath = resolve(output);
  const registry = JSON.parse(await readFile(registryPath, 'utf8'));
  const items = normalizeItems(registry);
  const registryDirectory = dirname(registryPath);
  const cache = join(outputPath, '.logo-cache');
  const fetcher = globalThis.fetch;
  if (typeof fetcher !== 'function') throw Error('fetch is unavailable');
  await mkdir(outputPath, { recursive: true });

  const manifest = {
    schema: 'shorts-assets/v1',
    generatedAt: new Date().toISOString(),
    asof: { value: asof, verification: 'manual_confirmation_required', pixel_verified: false },
    items: [],
  };

  for (const item of items) {
    const reasons = [];
    if (!isText(item?.ticker)) reasons.push('ticker is required');
    if (!isText(item?.company_name)) reasons.push('company_name is required');
    if (item?.issuer_verified !== true) reasons.push('issuer_verified:true is required');
    if (!isText(item?.source_kind)) reasons.push('source_kind is required');
    if (item?.asof !== asof) reasons.push(`registry asof must equal ${asof}`);
    if (!isText(assetSource(item ?? {}, 'chart'))) reasons.push('chart source is required');
    if (!isText(assetSource(item ?? {}, 'logo'))) reasons.push('logo source is required');
    if (reasons.length) { manifest.items.push(blocked(item, reasons, asof)); continue; }

    try {
      const results = await Promise.allSettled([
        acquireOne({ source: assetSource(item, 'chart'), registryDirectory, output: outputPath, cache: null, kind: 'chart', fetcher }),
        acquireOne({ source: assetSource(item, 'logo'), registryDirectory, output: outputPath, cache, kind: 'logo', fetcher }),
      ]);
      const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
      const [chart,logo]=results.map(r=>r.value);
      const tickerDirectory = join(outputPath, safeTicker(item.ticker));
      const chartPath = join(tickerDirectory, `chart-${asof}.${chart.type.ext}`);
      await writeAtomic(chartPath, chart.bytes);
      const logoPath = logo.cachePath ?? join(tickerDirectory, `logo.${logo.type.ext}`);
      if (!logo.cachePath) await writeAtomic(logoPath, logo.bytes);
      manifest.items.push({
        ticker: item.ticker,
        company_name: item.company_name,
        source_kind: item.source_kind,
        status: 'acquired',
        asof, chart: relativePath(outputPath, chartPath), logo: relativePath(outputPath, logoPath),
        source_url:item.chart_url||item.source_url||null,
        coverage_warning:item.coverage_warning||null,
        identity: { issuer_verified: true, company_name: item.company_name },
        date: { asof, verification: 'manual_confirmation_required', pixel_verified: false },
        assets: {
          chart: { path: relativePath(outputPath, chartPath), type: chart.type.mime, provenance: { ...chart.provenance, hash: hash(chart.bytes), fetchedAt: chart.fetchedAt } },
          logo: { path: relativePath(outputPath, logoPath), type: logo.type.mime, provenance: { ...logo.provenance, hash: hash(logo.bytes), fetchedAt: logo.fetchedAt } },
        },
      });
    } catch (error) {
      manifest.items.push(blocked(item, [error instanceof Error ? error.message : String(error)], asof));
    }
  }

  const manifestPath = join(outputPath, 'assets-manifest.json');
  await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { ...manifest, manifestPath };
}
