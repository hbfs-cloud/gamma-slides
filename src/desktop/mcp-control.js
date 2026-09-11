import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const text = value => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const failure = error => ({ isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] });
const isLoopback = address => address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

function createServerFor(controller) {
  const server = new McpServer({ name: 'gamma-presenter-control', version: '2.0.0' }, {
    instructions: 'You are the local presentation co-pilot. Inspect status before changing a live presentation. Keep cues concise and only use urgent cues when time-critical. This server controls the currently open Gamma Presenter deck only.',
  });
  const action = async callback => { try { return text(await callback()); } catch (error) { return failure(error); } };

  server.registerTool('presenter_status', {
    title: 'Inspect live presentation status',
    description: 'Read the active deck, slide, timer, countdown, and co-pilot cue. This tool never changes the presentation.',
    annotations: { readOnlyHint: true },
  }, () => text(controller.snapshot()));
  server.registerTool('presenter_present', {
    title: 'Open the presentation stage',
    description: 'Open the current deck on the configured stage display.',
    annotations: { readOnlyHint: false, idempotentHint: true },
  }, () => action(() => controller.present()));
  server.registerTool('presenter_stop', {
    title: 'Stop presenting',
    description: 'Hide the stage and return focus to Gamma Presenter.',
    annotations: { readOnlyHint: false, idempotentHint: true },
  }, () => action(() => controller.stop()));
  server.registerTool('presenter_open_speaker', {
    title: 'Open the speaker view',
    description: 'Open the private speaker window with notes, timers, and co-pilot cues.',
    annotations: { readOnlyHint: false, idempotentHint: true },
  }, () => action(() => controller.openSpeaker()));
  server.registerTool('presenter_navigate', {
    title: 'Navigate the presentation',
    description: 'Move to a relative slide or an exact zero-based slide index.',
    inputSchema: { target: z.union([z.enum(['next', 'previous']), z.number().int().min(0)]) },
    annotations: { readOnlyHint: false },
  }, ({ target }) => action(() => controller.navigate(target)));
  server.registerTool('presenter_countdown', {
    title: 'Control the presentation countdown',
    description: 'Set, start, pause, or clear the visible presenter countdown. Time values are seconds.',
    inputSchema: {
      action: z.enum(['set', 'start', 'pause', 'clear']),
      seconds: z.number().int().min(1).max(14_400).optional(),
    },
    annotations: { readOnlyHint: false },
  }, ({ action: countdownAction, seconds }) => action(() => controller.countdown(countdownAction, seconds)));
  server.registerTool('presenter_cue', {
    title: 'Set a speaker co-pilot cue',
    description: 'Show a concise private cue in the speaker view and stage control overlay. Urgent cues are red and trigger a local notification.',
    inputSchema: {
      text: z.string().max(500),
      level: z.enum(['normal', 'urgent']).default('normal'),
    },
    annotations: { readOnlyHint: false },
  }, ({ text: cue, level }) => action(() => controller.cue(cue, level)));
  server.registerTool('presenter_clear_cue', {
    title: 'Clear the speaker co-pilot cue',
    description: 'Remove the active private cue from the speaker view.',
    annotations: { readOnlyHint: false, idempotentHint: true },
  }, () => action(() => controller.clearCue()));
  server.registerTool('presenter_request_operator_action', {
    title: 'Request an approved live Stage action',
    description: 'Queue a bounded live-production action for the on-site operator. Gamma Presenter never activates camera, microphone, screen sharing, recording, a browser, or the terminal from an LLM request alone: the operator must explicitly approve it in the Author control room.',
    inputSchema: {
      action: z.enum(['open-studio', 'open-terminal', 'open-browser', 'open-video-output', 'toggle-camera', 'toggle-microphone', 'choose-screen-share', 'start-recording', 'stop-recording', 'speak-note']),
      note: z.string().max(500).optional(),
    },
    annotations: { readOnlyHint: false },
  }, ({ action: requestedAction, note }) => action(() => controller.requestOperatorAction(requestedAction, note)));
  return server;
}

export async function startDesktopMcp(controller) {
  const token = randomBytes(24).toString('base64url');
  const sessions = new Map();
  const httpServer = createServer(async (request, response) => {
    if (!isLoopback(request.socket.remoteAddress)) { response.writeHead(403).end('Loopback connections only'); return; }
    if (request.url?.split('?')[0] !== '/mcp') { response.writeHead(404).end('Not found'); return; }
    if (request.headers.authorization !== `Bearer ${token}`) { response.writeHead(401, { 'www-authenticate': 'Bearer' }).end('Missing or invalid bearer token'); return; }
    const sessionId = request.headers['mcp-session-id'];
    let connection = sessionId ? sessions.get(sessionId) : undefined;
    if (!connection) {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
      const server = createServerFor(controller);
      connection = { server, transport };
      transport.onclose = () => { if (transport.sessionId) sessions.delete(transport.sessionId); };
      await server.connect(transport);
      if (sessionId) { response.writeHead(404).end('Unknown MCP session'); return; }
    }
    await connection.transport.handleRequest(request, response);
    if (connection.transport.sessionId) sessions.set(connection.transport.sessionId, connection);
  });
  await new Promise((resolve, reject) => { httpServer.once('error', reject); httpServer.listen(0, '127.0.0.1', resolve); });
  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    endpoint: `http://127.0.0.1:${port}/mcp`,
    token,
    get connected() { return sessions.size; },
    async close() {
      for (const { server, transport } of sessions.values()) { await transport.close().catch(() => {}); await server.close().catch(() => {}); }
      sessions.clear();
      await new Promise(resolve => httpServer.close(() => resolve()));
    },
  };
}
