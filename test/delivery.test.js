import assert from 'node:assert/strict';
import test from 'node:test';
import { createDesktopDelivery, execFileWithInput } from '../src/desktop/delivery.js';

const deck = `meta: { title: Desktop delivery }
theme: signal-room
slides:
  - layout: title
    title: Ready
`;
const gammaWorkflow = () => ({ stdout: JSON.stringify({ content: Buffer.from('run: bun bin/gamma-slides.js library -d presentations -o _site').toString('base64') }) });

function commandStub(handler) {
  const calls = [];
  return {
    calls,
    exec: async (file, args, options) => {
      calls.push({ file, args, options });
      return handler(file, args, options, calls);
    },
  };
}

test('desktop delivery exposes only boolean CLI status and never CLI credentials', async () => {
  const { exec, calls } = commandStub((file) => {
    if (file === 'gh') return { stdout: 'Logged in with token ghp_should_not_escape' };
    const error = Object.assign(new Error('not logged in with token secret'), { code: 1, stderr: 'token=secret' });
    throw error;
  });
  const result = await createDesktopDelivery({ exec }).status();
  assert.deepEqual(result.github, { available: true, authenticated: true });
  assert.equal(result.vercel.authenticated, false);
  assert.doesNotMatch(JSON.stringify(result), /secret|ghp_/i);
  assert.deepEqual(calls.map(call => [call.file, call.args]), [['gh', ['auth', 'status']], ['vercel', ['whoami']]]);
});

test('execFile adapter writes and closes stdin for gh --input - semantics', async () => {
  const result = await execFileWithInput(process.execPath, ['-e', 'let body=""; process.stdin.on("data", value => body += value); process.stdin.on("end", () => process.stdout.write("closed:" + body))'], { input: 'deck-source', timeout: 2_000 });
  assert.equal(result.stdout, 'closed:deck-source');
});

test('GitHub Pages updates only an existing workflow-backed Pages repository and marks it queued', async () => {
  const { exec, calls } = commandStub((_file, args) => {
    const path = args[1];
    if (path.endsWith('/pages')) return { stdout: JSON.stringify({ build_type: 'workflow' }) };
    if (path.endsWith('/contents/.github/workflows/pages.yml')) return gammaWorkflow();
    if (path.endsWith('/contents/presentations')) return { stdout: JSON.stringify([{ type: 'file', name: 'desktop-delivery.yaml', path: 'presentations/desktop-delivery.yaml', sha: 'current-sha' }]) };
    if (path.includes('/contents/presentations/desktop-delivery.yaml')) return { stdout: '{}' };
    throw new Error(`unexpected ${args.join(' ')}`);
  });
  const result = await createDesktopDelivery({ exec }).publishGitHubPages({ owner: 'acme', repo: 'gamma-pages', slug: 'Desktop delivery', deck });
  assert.equal(result.deployment, 'queued');
  assert.equal(result.verified, false);
  assert.match(result.message, /not been verified/i);
  assert.equal(result.url, 'https://acme.github.io/gamma-pages/desktop-delivery/');
  const put = calls.find(call => call.args.includes('PUT'));
  assert.ok(put);
  const body = JSON.parse(put.options.input);
  assert.equal(body.sha, 'current-sha');
  assert.equal(Buffer.from(body.content, 'base64').toString('utf8'), deck);
  assert.deepEqual(put.args, ['api', 'repos/acme/gamma-pages/contents/presentations/desktop-delivery.yaml', '--method', 'PUT', '--input', '-']);
});

test('GitHub Pages refuses missing or non-workflow Pages configuration before mutation', async () => {
  const { exec, calls } = commandStub((_file, args) => {
    if (args[1].endsWith('/pages')) return { stdout: JSON.stringify({ build_type: 'legacy' }) };
    throw new Error('must not mutate');
  });
  await assert.rejects(
    createDesktopDelivery({ exec }).publishGitHubPages({ owner: 'acme', repo: 'site', slug: 'deck', deck }),
    /will not be changed/,
  );
  assert.equal(calls.length, 1);
});

test('GitHub Pages refuses an unknown workflow before any source write', async () => {
  const { exec } = commandStub((_file, args) => {
    const path = args[1];
    if (path.endsWith('/pages')) return { stdout: JSON.stringify({ build_type: 'workflow' }) };
    if (path.endsWith('/contents/.github/workflows/pages.yml')) return { stdout: JSON.stringify({ content: Buffer.from('run: npm run another-site').toString('base64') }) };
    throw new Error('unexpected');
  });
  await assert.rejects(createDesktopDelivery({ exec }).publishGitHubPages({ owner: 'acme', repo: 'site', slug: 'deck', deck }), /not the Gamma presentation library/);
});

test('GitHub Pages surfaces a concurrent update instead of overwriting it', async () => {
  let writes = 0;
  const { exec } = commandStub((_file, args) => {
    const path = args[1];
    if (path.endsWith('/pages')) return { stdout: JSON.stringify({ build_type: 'workflow' }) };
    if (path.endsWith('/contents/.github/workflows/pages.yml')) return gammaWorkflow();
    if (path.endsWith('/contents/presentations')) return { stdout: JSON.stringify([{ type: 'file', name: 'deck.yaml', path: 'presentations/deck.yaml', sha: 'old' }]) };
    if (path.includes('/contents/presentations/deck.yaml')) {
      writes += 1;
      throw Object.assign(new Error('HTTP 409 conflict'), { code: 409, stderr: 'HTTP 409 conflict' });
    }
    throw new Error('unexpected');
  });
  await assert.rejects(createDesktopDelivery({ exec }).publishGitHubPages({ owner: 'acme', repo: 'site', slug: 'deck', deck }), /changed on GitHub.*operator/i);
  assert.equal(writes, 1);
});

test('GitHub Pages serializes a rich deck as JSON when preserving an existing JSON entry', async () => {
  const { exec, calls } = commandStub((_file, args) => {
    const path = args[1];
    if (path.endsWith('/pages')) return { stdout: JSON.stringify({ build_type: 'workflow' }) };
    if (path.endsWith('/contents/.github/workflows/pages.yml')) return gammaWorkflow();
    if (path.endsWith('/contents/presentations')) return { stdout: JSON.stringify([{ type: 'file', name: 'deck.json', path: 'presentations/deck.json', sha: 'json-sha' }]) };
    if (path.endsWith('/contents/presentations/deck.json')) return { stdout: '{}' };
    throw new Error('unexpected');
  });
  await createDesktopDelivery({ exec }).publishGitHubPages({ owner: 'acme', repo: 'site', slug: 'deck', deck });
  const put = calls.find(call => call.args.includes('PUT'));
  const stored = Buffer.from(JSON.parse(put.options.input).content, 'base64').toString('utf8');
  assert.doesNotThrow(() => JSON.parse(stored));
  assert.equal(JSON.parse(stored).slides[0].title, 'Ready');
});

test('Vercel stages only generated index.html and the existing project binding', async () => {
  const files = new Map([['/authorized/.vercel/project.json', JSON.stringify({ projectId: 'project-id', orgId: 'org-id', ignored: 'not copied' })]]);
  const fs = {
    async readFile(path) { return files.get(path); },
    async mkdtemp() { return '/tmp/gamma-delivery'; },
    async mkdir(path) { files.set(`${path}/`, 'dir'); },
    async writeFile(path, value) { files.set(path, Buffer.from(value).toString('utf8')); },
    async rm(path) { files.set(path, 'removed'); },
  };
  const { exec, calls } = commandStub((file, args, options) => {
    assert.equal(file, 'vercel');
    assert.deepEqual(args, ['deploy', '--prod', '--yes']);
    assert.equal(options.cwd, '/tmp/gamma-delivery');
    assert.equal(options.timeout, 120_000);
    return { stdout: 'https://deck.vercel.app\n' };
  });
  const result = await createDesktopDelivery({ exec, fs, tempDirectory: () => '/tmp' }).publishVercel({ projectDirectory: '/authorized', html: '<!doctype html><title>Deck</title>' });
  assert.equal(result.url, 'https://deck.vercel.app');
  assert.equal(result.verified, false);
  assert.equal(files.get('/tmp/gamma-delivery/index.html'), '<!doctype html><title>Deck</title>');
  assert.deepEqual(JSON.parse(files.get('/tmp/gamma-delivery/.vercel/project.json')), { projectId: 'project-id', orgId: 'org-id' });
  assert.equal(files.get('/tmp/gamma-delivery'), 'removed');
  assert.equal(calls.length, 1);
});

test('Vercel rejects an unlinked directory without running a deployment command', async () => {
  const { exec, calls } = commandStub(() => ({ stdout: '' }));
  await assert.rejects(
    createDesktopDelivery({ exec, fs: { readFile: async () => { throw new Error('ENOENT'); } } }).publishVercel({ projectDirectory: '/missing', html: '<html></html>' }),
    /authorized project directory/,
  );
  assert.equal(calls.length, 0);
});

test('Vercel requires an explicit directory and rejects option-like project bindings', async () => {
  const { exec, calls } = commandStub(() => ({ stdout: '' }));
  await assert.rejects(createDesktopDelivery({ exec }).publishVercel({ html: '<html></html>' }), /Choose the existing authorized/);
  await assert.rejects(
    createDesktopDelivery({ exec, fs: { readFile: async () => JSON.stringify({ projectId: '--token', orgId: 'team_ok' }) } }).publishVercel({ projectDirectory: '/authorized', html: '<html></html>' }),
    /incomplete or unsafe/,
  );
  assert.equal(calls.length, 0);
});
