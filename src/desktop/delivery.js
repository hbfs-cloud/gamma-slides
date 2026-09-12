import { execFile as nodeExecFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { loadDeck } from '../loader/index.js';
import { presentationSlug, presentationUrl } from '../site/github-pages.js';

const DEFAULT_TIMEOUT = 30_000;
const VERCEL_TIMEOUT = 120_000;
const DEFAULT_MAX_OUTPUT = 1_000_000;
const maxHtmlBytes = 20 * 1024 * 1024;

const defaultFs = { mkdtemp, mkdir, readFile, rm, writeFile };

/** `execFile` has no `input` option: explicitly close stdin for gh --input -. */
export function execFileWithInput(file, args, options = {}) {
  const { input, ...commandOptions } = options;
  return new Promise((resolveCommand, rejectCommand) => {
    let child;
    try {
      child = nodeExecFile(file, args, commandOptions, (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout;
          error.stderr = stderr;
          rejectCommand(error);
        } else resolveCommand({ stdout, stderr });
      });
      if (input !== undefined) child.stdin.end(input);
    } catch (error) {
      rejectCommand(error);
    }
  });
}

function publicMessage(value, fallback = 'The local command could not complete.') {
  return String(value || fallback)
    .replace(/(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|(?:token|authorization)\s*[:=]\s*\S+)/gi, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300) || fallback;
}

function commandFailure(error) {
  const output = `${error?.stderr || ''}\n${error?.stdout || ''}`;
  return Object.assign(new Error(publicMessage(output, error?.code === 'ENOENT' ? 'Command-line tool is not installed.' : undefined)), {
    code: error?.code,
    status: error?.code,
    rawOutput: output,
  });
}

function repoName({ owner, repo }) {
  const suppliedOwner = String(owner || '').trim();
  const suppliedRepo = String(repo || '').trim();
  const combined = !suppliedOwner && suppliedRepo.includes('/') ? suppliedRepo.split('/') : null;
  const actualOwner = combined ? combined[0] : suppliedOwner;
  const actualRepo = combined ? combined[1] : suppliedRepo;
  if (!/^[A-Za-z0-9_.-]+$/.test(actualOwner) || !/^[A-Za-z0-9_.-]+$/.test(actualRepo) || (combined && combined.length !== 2)) {
    throw new Error('Supply an explicit GitHub owner and repository name.');
  }
  return `${actualOwner}/${actualRepo}`;
}

function richDeckPayload(deck) {
  const source = typeof deck === 'string' ? deck : JSON.stringify(deck);
  if (!source || source.length > maxHtmlBytes) throw new Error('A bounded rich YAML or JSON deck payload is required.');
  const parsed = loadDeck(source);
  return { source, parsed };
}

function isNotFound(error) {
  return error?.status === 404 || /(?:HTTP )?404|not found/i.test(error?.rawOutput || error?.message || '');
}

function outputUrl(output) {
  return String(output || '').match(/https:\/\/[^\s]+/i)?.[0]?.replace(/[),.]$/, '') || null;
}

/**
 * Backend-only delivery adapter.  Its seams keep Electron's main process
 * asynchronous and make credential-bearing CLIs unnecessary in tests.
 */
export function createDesktopDelivery({
  exec = execFileWithInput,
  fs = defaultFs,
  tempDirectory = tmpdir,
  timeout = DEFAULT_TIMEOUT,
  maxOutput = DEFAULT_MAX_OUTPUT,
} = {}) {
  async function run(file, args, options = {}) {
    try {
      return await exec(file, args, { timeout, maxBuffer: maxOutput, ...options });
    } catch (error) {
      throw commandFailure(error);
    }
  }

  async function cliStatus(file, args) {
    try {
      await run(file, args);
      return { available: true, authenticated: true };
    } catch (error) {
      return {
        available: error.code !== 'ENOENT',
        authenticated: false,
        message: error.code === 'ENOENT' ? `${file} is not installed.` : `${file} is available but is not authenticated.`,
      };
    }
  }

  async function status() {
    const [github, vercel] = await Promise.all([
      cliStatus('gh', ['auth', 'status']),
      cliStatus('vercel', ['whoami']),
    ]);
    return { github, vercel };
  }

  async function githubApi(path, method = 'GET', body) {
    const args = ['api', path, '--method', method];
    const options = {};
    if (body !== undefined) {
      args.push('--input', '-');
      options.input = JSON.stringify(body);
    }
    const result = await run('gh', args, options);
    try {
      return result.stdout ? JSON.parse(result.stdout) : {};
    } catch {
      throw new Error('GitHub returned an unexpected response.');
    }
  }

  async function existingPagesConfiguration(repo) {
    let pages;
    try {
      pages = await githubApi(`repos/${repo}/pages`);
    } catch (error) {
      if (isNotFound(error)) throw new Error('GitHub Pages must already be configured for this repository.');
      throw error;
    }
    if (pages.build_type !== 'workflow') {
      throw new Error('This repository is not configured for the Gamma Pages workflow; its Pages settings will not be changed.');
    }
    let workflow;
    try {
      workflow = await githubApi(`repos/${repo}/contents/.github/workflows/pages.yml`);
    } catch (error) {
      if (isNotFound(error)) throw new Error('This repository does not contain the Gamma Pages workflow; no source was changed.');
      throw error;
    }
    const source = Buffer.from(String(workflow.content || '').replace(/\s/g, ''), 'base64').toString('utf8');
    if (!/gamma-slides(?:\.js)?\s+library/.test(source) || !/-d\s+presentations\b/.test(source)) {
      throw new Error('This repository Pages workflow is not the Gamma presentation library; no source was changed.');
    }
    return pages;
  }

  async function sourceEntry(repo, slug) {
    try {
      const entries = await githubApi(`repos/${repo}/contents/presentations`);
      if (!Array.isArray(entries)) return null;
      return entries.find(entry => entry.type === 'file'
        && /\.(?:ya?ml|json)$/i.test(entry.name || '')
        && presentationSlug(String(entry.name).replace(/\.(?:ya?ml|json)$/i, '')) === slug) || null;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  /** Publish source to an already configured Gamma Pages repository. */
  async function publishGitHubPages({ owner, repo, slug, deck }) {
    const target = repoName({ owner, repo });
    const normalizedSlug = presentationSlug(slug);
    const { source, parsed } = richDeckPayload(deck);
    await existingPagesConfiguration(target);

    const existing = await sourceEntry(target, normalizedSlug);
    const path = existing?.path || `presentations/${normalizedSlug}.yaml`;
    // A .json source must remain valid JSON.  New source keeps the exact rich
    // YAML/JSON serialization supplied by the Author application.
    const destinationSource = /\.json$/i.test(path) ? JSON.stringify(parsed, null, 2) : source;
    const body = {
      message: `slides: ${existing ? 'update' : 'deploy'} ${normalizedSlug}`,
      content: Buffer.from(destinationSource, 'utf8').toString('base64'),
      ...(existing?.sha ? { sha: existing.sha } : {}),
    };
    try {
      await githubApi(`repos/${target}/contents/${path}`, 'PUT', body);
    } catch (error) {
      if (error?.status === 409 || /(?:HTTP )?409|(?:HTTP )?422|sha.*(?:mismatch|does not match)|conflict/i.test(error?.rawOutput || error?.message || '')) {
        throw new Error('This presentation changed on GitHub after it was read. Refresh the remote source and ask the operator to review before publishing again.');
      }
      throw error;
    }
    return {
      provider: 'github-pages',
      action: existing ? 'updated' : 'created',
      repo: target,
      slug: normalizedSlug,
      title: parsed.meta?.title || normalizedSlug,
      slides: parsed.slides.length,
      theme: parsed.theme,
      path,
      url: presentationUrl(target, normalizedSlug),
      actionsUrl: `https://github.com/${target}/actions/workflows/pages.yml`,
      deployment: 'queued',
      verified: false,
      message: 'Source was queued for the existing GitHub Pages workflow. Public availability has not been verified.',
    };
  }

  /** Deploy exactly one generated HTML file into a pre-linked Vercel project. */
  async function publishVercel({ projectDirectory, html }) {
    if (typeof projectDirectory !== 'string' || !projectDirectory.trim()) throw new Error('Choose the existing authorized Vercel project directory.');
    const projectDir = resolve(projectDirectory);
    const htmlBytes = Buffer.isBuffer(html) ? html : Buffer.from(String(html || ''), 'utf8');
    if (!htmlBytes.length || htmlBytes.length > maxHtmlBytes) throw new Error('A bounded generated index.html payload is required.');

    const bindingPath = join(projectDir, '.vercel', 'project.json');
    let binding;
    try {
      binding = JSON.parse(await fs.readFile(bindingPath, 'utf8'));
    } catch {
      throw new Error('Vercel publishing requires an existing authorized project directory with .vercel/project.json.');
    }
    const safeBindingId = value => /^[A-Za-z0-9_.-]{1,200}$/.test(value || '') && !String(value).startsWith('-');
    if (!safeBindingId(binding?.projectId) || !safeBindingId(binding?.orgId)) throw new Error('The Vercel project binding is incomplete or unsafe. Run Vercel link in the authorized project directory first.');

    const stagingDirectory = await fs.mkdtemp(join(tempDirectory(), 'gamma-presenter-vercel-'));
    try {
      await fs.mkdir(join(stagingDirectory, '.vercel'), { recursive: true });
      await fs.writeFile(join(stagingDirectory, 'index.html'), htmlBytes);
      await fs.writeFile(join(stagingDirectory, '.vercel', 'project.json'), JSON.stringify({ projectId: binding.projectId, orgId: binding.orgId }));
      const result = await run('vercel', ['deploy', '--prod', '--yes'], { cwd: stagingDirectory, timeout: VERCEL_TIMEOUT });
      return {
        provider: 'vercel',
        deployment: 'submitted',
        verified: false,
        url: outputUrl(`${result.stdout || ''}\n${result.stderr || ''}`),
        message: 'Vercel accepted the generated index.html deployment. Public availability has not been verified.',
      };
    } finally {
      await fs.rm(stagingDirectory, { recursive: true, force: true }).catch(() => {});
    }
  }

  return { status, publishGitHubPages, publishVercel };
}

export const getDeliveryStatus = options => createDesktopDelivery(options).status();
export const publishGitHubPages = (request, options) => createDesktopDelivery(options).publishGitHubPages(request);
export const publishVercel = (request, options) => createDesktopDelivery(options).publishVercel(request);
