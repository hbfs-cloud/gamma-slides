import test from 'node:test';
import assert from 'node:assert/strict';
import { startDesktopMcp } from '../src/desktop/mcp-control.js';

const request = async (endpoint, token, body, sessionId) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${token}`, ...(sessionId ? { 'mcp-session-id': sessionId } : {}) },
    body: JSON.stringify(body),
  });
  return { response, body: await response.text() };
};

test('desktop MCP is loopback-token protected and operates only its supplied controller', async () => {
  const calls = [];
  const controller = {
    snapshot: () => ({ title: 'Test deck', currentIndex: 0, timing: { countdownRemainingMs: 0 } }),
    present: () => { calls.push('present'); return controller.snapshot(); },
    stop: () => { calls.push('stop'); return controller.snapshot(); },
    openSpeaker: () => { calls.push('open-speaker'); return controller.snapshot(); },
    navigate: target => { calls.push(['navigate', target]); return controller.snapshot(); },
    countdown: (action, seconds) => { calls.push(['countdown', action, seconds]); return controller.snapshot(); },
    cue: (text, level) => { calls.push(['cue', text, level]); return controller.snapshot(); },
    clearCue: () => { calls.push('clear-cue'); return controller.snapshot(); },
    requestOperatorAction: (action, note) => { calls.push(['operator-action', action, note]); return controller.snapshot(); },
  };
  const mcp = await startDesktopMcp(controller);
  try {
    const denied = await fetch(mcp.endpoint, { method: 'POST' });
    assert.equal(denied.status, 401);
    const initialized = await request(mcp.endpoint, mcp.token, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'desktop-test', version: '1.0.0' } } });
    assert.equal(initialized.response.status, 200);
    const session = initialized.response.headers.get('mcp-session-id');
    assert.ok(session);
    const tools = await request(mcp.endpoint, mcp.token, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, session);
    assert.equal(tools.response.status, 200);
    assert.match(tools.body, /presenter_countdown/);
    assert.match(tools.body, /presenter_cue/);
    assert.match(tools.body, /presenter_open_speaker/);
    assert.match(tools.body, /presenter_request_operator_action/);
    const cue = await request(mcp.endpoint, mcp.token, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'presenter_cue', arguments: { text: 'Land the decision.', level: 'urgent' } } }, session);
    assert.equal(cue.response.status, 200);
    assert.deepEqual(calls.at(-1), ['cue', 'Land the decision.', 'urgent']);
    const operatorAction = await request(mcp.endpoint, mcp.token, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'presenter_request_operator_action', arguments: { action: 'open-terminal', note: 'Show the benchmark command.' } } }, session);
    assert.equal(operatorAction.response.status, 200);
    assert.deepEqual(calls.at(-1), ['operator-action', 'open-terminal', 'Show the benchmark command.']);
  } finally { await mcp.close(); }
});
