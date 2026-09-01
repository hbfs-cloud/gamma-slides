import { spawnSync } from 'child_process';

const MCP_RUNNER = ['npx', '-y', 'github:hbfs-cloud/gamma-slides', 'mcp'];

function available(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf-8' });
  return !result.error && result.status === 0;
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, { encoding: 'utf-8' });
  if (result.status !== 0 && !allowFailure) {
    throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  }
  return result;
}

export function setupAgentClients(client = 'all', repo = 'hbfs-cloud/gamma-slides') {
  const requested = String(client || 'all').toLowerCase();
  if (!['all', 'claude', 'codex'].includes(requested)) throw new Error('Client must be all, claude, or codex.');
  const results = [];
  if (requested === 'all' || requested === 'claude') {
    if (available('claude')) {
      run('claude', ['mcp', 'remove', 'gamma-slides', '--scope', 'user'], { allowFailure: true });
      run('claude', ['mcp', 'add', '--scope', 'user', '--env', `GAMMA_SLIDES_REPO=${repo}`, '--transport', 'stdio', 'gamma-slides', '--', ...MCP_RUNNER]);
      results.push({ client: 'Claude Code', configured: true });
    } else results.push({ client: 'Claude Code', configured: false, reason: 'claude command not found' });
  }
  if (requested === 'all' || requested === 'codex') {
    if (available('codex')) {
      run('codex', ['mcp', 'remove', 'gamma-slides'], { allowFailure: true });
      run('codex', ['mcp', 'add', 'gamma-slides', '--env', `GAMMA_SLIDES_REPO=${repo}`, '--', ...MCP_RUNNER]);
      results.push({ client: 'Codex', configured: true });
    } else results.push({ client: 'Codex', configured: false, reason: 'codex command not found' });
  }
  if (!results.some(result => result.configured)) {
    throw new Error(`No supported client was configured (${results.map(result => result.reason).filter(Boolean).join(', ')}).`);
  }
  return { results, repo, runner: MCP_RUNNER.join(' ') };
}
