// ST-322 (I353): unit tests for the touch-haptics module (src/render/haptics.js).
// The pattern table + patternFor() are PURE/DOM-free; createHaptics gating is exercised with a
// stubbed globalThis.navigator (same boundary as the window stub in tests/touchZones.test.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { HAPTIC_PATTERNS, patternFor, createHaptics } from '../src/render/haptics.js';

test('haptics: patternFor maps each of the four kinds to its exact pattern', () => {
  assert.deepEqual(patternFor('hit'), 20);
  assert.deepEqual(patternFor('death'), [40, 30, 60]);
  assert.deepEqual(patternFor('bomb'), 50);
  assert.deepEqual(patternFor('pickup'), 15);
});

test('haptics: patternFor returns null for an unknown/empty kind', () => {
  assert.equal(patternFor('nope'), null);
  assert.equal(patternFor(''), null);
  assert.equal(patternFor(undefined), null);
});

test('haptics: HAPTIC_PATTERNS has exactly the four kinds (no stray cue)', () => {
  assert.deepEqual(Object.keys(HAPTIC_PATTERNS).sort(), ['bomb', 'death', 'hit', 'pickup']);
});

function stubNavigator(nv) {
  const prev = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', { value: nv, configurable: true, writable: true });
  return () => {
    if (prev === undefined) delete globalThis.navigator;
    else Object.defineProperty(globalThis, 'navigator', { value: prev, configurable: true, writable: true });
  };
}

test('haptics: coarse + vibrate-present fires each pattern exactly', () => {
  const calls = [];
  const restore = stubNavigator({ vibrate: (p) => { calls.push(p); return true; } });
  try {
    const h = createHaptics(true);
    assert.equal(h.enabled, true);
    assert.equal(h.pulse('hit'), true);
    assert.equal(h.pulse('death'), true);
    assert.equal(h.pulse('bomb'), true);
    assert.equal(h.pulse('pickup'), true);
    assert.deepEqual(calls, [20, [40, 30, 60], 50, 15]);
  } finally { restore(); }
});

test('haptics: coarse + vibrate-present ignores an unknown kind (no vibrate)', () => {
  const calls = [];
  const restore = stubNavigator({ vibrate: (p) => { calls.push(p); return true; } });
  try {
    const h = createHaptics(true);
    assert.equal(h.pulse('nope'), false);
    assert.deepEqual(calls, []);
  } finally { restore(); }
});

test('haptics: fine-pointer (coarse=false) is a no-op even when vibrate exists', () => {
  const calls = [];
  const restore = stubNavigator({ vibrate: (p) => { calls.push(p); return true; } });
  try {
    const h = createHaptics(false);
    assert.equal(h.enabled, false);
    assert.equal(h.pulse('hit'), false);
    assert.deepEqual(calls, []);
  } finally { restore(); }
});

test('haptics: coarse but no vibrate (iOS Safari) is a no-op', () => {
  const calls = [];
  const restore = stubNavigator({}); // no vibrate property
  try {
    const h = createHaptics(true);
    assert.equal(h.enabled, false);
    assert.equal(h.pulse('hit'), false);
    assert.deepEqual(calls, []);
  } finally { restore(); }
});
