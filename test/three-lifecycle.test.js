import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { teardownThreeRenderer, transitionThreeMode, threeExplorationJS } from '../src/engine/components/three-exploration.js';

test('2D transition tears down Three before notifying Pixi', () => {
  const events = [], state = { active: true };
  const changed = transitionThreeMode(state, false, {
    update: active => events.push(`update:${active}`),
    dispose: () => events.push('dispose'),
    notify: () => events.push('notify'),
    build: () => events.push('build'),
  });
  assert.equal(changed, true);
  assert.equal(state.active, false);
  assert.deepEqual(events, ['update:false', 'dispose', 'notify']);
});

test('Three teardown detaches its loss listener before a deferred one-time context release', () => {
  const events = [], timers = [], listeners = new Map();
  const canvas = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { events.push(`remove:${type}`); assert.equal(listeners.get(type), listener); listeners.delete(type); },
    remove() { events.push('canvas:remove'); },
  };
  const renderer = {
    domElement: canvas,
    dispose() { events.push('renderer:dispose'); },
    getContext() { return { isContextLost: () => false }; },
    forceContextLoss() { events.push('renderer:lose'); listeners.get('webglcontextlost')?.({ preventDefault() { events.push('prevent'); } }); },
  };
  const state = { renderer, disposed: false, onContextLost: () => events.push('old-listener') };
  canvas.addEventListener('webglcontextlost', state.onContextLost);
  teardownThreeRenderer(state, callback => timers.push(callback));
  assert.equal(state.renderer, null);
  assert.equal(state.disposed, true);
  assert.equal(state.onContextLost, null);
  assert.deepEqual(events, ['remove:webglcontextlost', 'renderer:dispose', 'canvas:remove']);
  assert.equal(timers.length, 1);
  timers.shift()();
  assert.deepEqual(events, ['remove:webglcontextlost', 'renderer:dispose', 'canvas:remove', 'renderer:lose']);
});

test('already-lost context is never force-lost a second time', () => {
  let forced = 0;
  const renderer = {
    domElement: { remove() {} },
    dispose() {},
    getContext() { return { isContextLost: () => true }; },
    forceContextLoss() { forced += 1; },
  };
  const timers = [], state = { renderer, onContextLost: null };
  teardownThreeRenderer(state, callback => timers.push(callback));
  timers.shift()();
  assert.equal(forced, 0);
});

test('generated browser runtime includes the lifecycle helpers used by initThreeExploration', () => {
  const browser = vm.createContext({});
  vm.runInContext(`${threeExplorationJS()}\nglobalThis.lifecycle = { teardownThreeRenderer, transitionThreeMode };`, browser);
  const events = [], state = { active: true };
  browser.lifecycle.transitionThreeMode(state, false, {
    update: active => events.push(`update:${active}`),
    dispose: () => events.push('dispose'),
    notify: () => events.push('notify'),
    build: () => events.push('build'),
  });
  assert.deepEqual(events, ['update:false', 'dispose', 'notify']);
  const timers = [], renderer = {
    domElement: { remove() {} }, dispose() { events.push('renderer:dispose'); },
    getContext() { return { isContextLost: () => true }; }, forceContextLoss() { events.push('renderer:lose'); },
  };
  browser.lifecycle.teardownThreeRenderer({ renderer, onContextLost: null }, callback => timers.push(callback));
  timers.shift()();
  assert.deepEqual(events, ['update:false', 'dispose', 'notify', 'renderer:dispose']);
});
