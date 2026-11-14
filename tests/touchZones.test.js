// ST-268 (I283): dual-zone touch input.
// Part 1: the pure zone/dead-zone/auto-centre math (src/core/touchZones.js).
// Part 2: the input device (src/render/input.js) driven by dispatched pointer events
// (pointerType: 'touch') against a minimal window stub - test-only fixture, same boundary
// as tests/helpers/webaudio.js (the in-process runner only loads tests/*.test.js, so the
// stub exists only in this file; the production build never sees it).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONE, zoneFor, thrustFromDrag, knobOffset } from '../src/core/touchZones.js';
import { createInput } from '../src/render/input.js';

// --- zoneFor ---------------------------------------------------------------
test('ST-268 zoneFor: left/right split at the viewport midline (midline -> RIGHT)', () => {
  assert.equal(zoneFor(0, 800), ZONE.LEFT);
  assert.equal(zoneFor(399, 800), ZONE.LEFT);
  assert.equal(zoneFor(400, 800), ZONE.RIGHT);
  assert.equal(zoneFor(799, 800), ZONE.RIGHT);
  assert.equal(zoneFor(-50, 800), ZONE.LEFT);
  assert.equal(zoneFor(1000, 800), ZONE.RIGHT);
});

// --- thrustFromDrag --------------------------------------------------------
test('ST-268 thrustFromDrag: zero vector and dead-zone (boundary inclusive)', () => {
  assert.deepEqual(thrustFromDrag(0, 0, 24, 90), { x: 0, y: 0, mag: 0 });
  assert.deepEqual(thrustFromDrag(10, 10, 24, 90), { x: 0, y: 0, mag: 0 }); // m=14.14 <= 24
  assert.deepEqual(thrustFromDrag(0, 24, 24, 90), { x: 0, y: 0, mag: 0 });  // exactly at the dead-zone
  assert.deepEqual(thrustFromDrag(24, 0, 24, 90), { x: 0, y: 0, mag: 0 });
});

test('ST-268 thrustFromDrag: linear ramp just past the dead-zone, direction preserved', () => {
  const t = thrustFromDrag(25, 0, 24, 90);
  assert.ok(Math.abs(t.mag - 1 / 66) < 1e-12);
  assert.ok(Math.abs(t.x - 1 / 66) < 1e-12);
  assert.equal(t.y, 0);
  const up = thrustFromDrag(0, -50, 24, 90); // screen up
  assert.ok(up.y < 0);
  assert.ok(Math.abs(up.mag - 26 / 66) < 1e-12);
});

test('ST-268 thrustFromDrag: full at maxPx, clamped beyond', () => {
  assert.deepEqual(thrustFromDrag(90, 0, 24, 90), { x: 1, y: 0, mag: 1 });
  assert.deepEqual(thrustFromDrag(0, 90, 24, 90), { x: 0, y: 1, mag: 1 });
  assert.deepEqual(thrustFromDrag(200, 0, 24, 90), { x: 1, y: 0, mag: 1 });
  assert.deepEqual(thrustFromDrag(0, -200, 24, 90), { x: 0, y: -1, mag: 1 });
});

test('ST-268 thrustFromDrag: diagonal keeps unit direction with radial magnitude', () => {
  const t = thrustFromDrag(30, 40, 24, 90); // m = 50
  const f = 26 / 66;
  assert.ok(Math.abs(t.x - (30 / 50) * f) < 1e-12);
  assert.ok(Math.abs(t.y - (40 / 50) * f) < 1e-12);
  assert.ok(Math.abs(t.mag - f) < 1e-12);
  const big = thrustFromDrag(64, 64, 24, 90); // m = 90.51 > maxPx -> clamped unit direction
  assert.ok(Math.abs(big.x - Math.SQRT1_2) < 1e-12);
  assert.ok(Math.abs(big.y - Math.SQRT1_2) < 1e-12);
  assert.equal(big.mag, 1);
});

test('ST-268 thrustFromDrag: degenerate maxPx <= thresh ramps straight to full', () => {
  assert.deepEqual(thrustFromDrag(100, 0, 24, 24), { x: 1, y: 0, mag: 1 });
});

// --- knobOffset (ST-321) ---------------------------------------------------
test('ST-321 knobOffset: zero + dead-zone (boundary inclusive) -> not active', () => {
  assert.deepEqual(knobOffset(0, 0, 24, 90), { x: 0, y: 0, mag: 0, active: false });
  assert.deepEqual(knobOffset(10, 10, 24, 90), { x: 10, y: 10, mag: Math.hypot(10, 10) / 90, active: false });
  assert.deepEqual(knobOffset(24, 0, 24, 90), { x: 24, y: 0, mag: 24 / 90, active: false }); // at the dead-zone
});

test('ST-321 knobOffset: within the ring, displacement = the raw drag, mag = |d|/maxPx', () => {
  const k = knobOffset(25, 0, 24, 90); // just past the dead-zone -> active
  assert.equal(k.x, 25);
  assert.equal(k.y, 0);
  assert.ok(Math.abs(k.mag - 25 / 90) < 1e-12);
  assert.equal(k.active, true);
  const up = knobOffset(0, -50, 24, 90);
  assert.equal(up.x, 0);
  assert.equal(up.y, -50);
  assert.ok(Math.abs(up.mag - 50 / 90) < 1e-12);
  assert.equal(up.active, true);
});

test('ST-321 knobOffset: clamps to maxPx beyond the ring, keeps unit direction', () => {
  assert.deepEqual(knobOffset(90, 0, 24, 90), { x: 90, y: 0, mag: 1, active: true }); // exactly at maxPx
  assert.deepEqual(knobOffset(0, 90, 24, 90), { x: 0, y: 90, mag: 1, active: true });
  assert.deepEqual(knobOffset(200, 0, 24, 90), { x: 90, y: 0, mag: 1, active: true }); // clamped
  assert.deepEqual(knobOffset(0, -200, 24, 90), { x: 0, y: -90, mag: 1, active: true });
  const diag = knobOffset(64, 64, 24, 90); // m = 90.51 > 90 -> clamped, direction preserved
  assert.equal(diag.mag, 1);
  assert.equal(diag.active, true);
  assert.ok(Math.abs(Math.hypot(diag.x, diag.y) - 90) < 1e-9);
  assert.ok(Math.abs(diag.x - diag.y) < 1e-12);
});

test('ST-321 knobOffset: degenerate maxPx (<= drag) clamps to the ring', () => {
  const k = knobOffset(100, 0, 24, 24);
  assert.equal(k.x, 24);
  assert.equal(k.y, 0);
  assert.equal(k.mag, 1);
  assert.equal(k.active, true);
});

// --- input.js dual-zone behaviour ------------------------------------------
// Minimal window stub: input.js only uses addEventListener/removeEventListener, innerWidth,
// innerHeight. Saved/restored per test so the in-process runner stays clean.
function installWindow(width = 800, height = 450) {
  const handlers = {};
  const stub = {
    handlers,
    addEventListener: (t, f) => { handlers[t] = f; },
    removeEventListener: (t) => { delete handlers[t]; },
    innerWidth: width,
    innerHeight: height,
  };
  const prev = globalThis.window;
  globalThis.window = stub;
  return {
    handlers,
    restore() { if (prev === undefined) delete globalThis.window; else globalThis.window = prev; },
  };
}
const T = (id, x, y) => ({ pointerType: 'touch', pointerId: id, clientX: x, clientY: y });
const thrustXY = (input) => ({ x: input.state.thrust.x, y: input.state.thrust.y });
const approxZero = (v) => Math.abs(v) < 1e-12;

test('ST-268 left-only drag = thrust WITHOUT firing; auto-centres on release', () => {
  const w = installWindow(800, 450);
  const input = createInput({});
  const h = w.handlers;
  h.pointerdown(T(1, 100, 200));
  assert.deepEqual(thrustXY(input), { x: 0, y: 0 }); // at the stick origin
  assert.equal(input.state.firing, false);
  assert.equal(input.rightAimActive, false);
  h.pointermove(T(1, 120, 200)); // dx = 20 <= 24 dead-zone
  assert.deepEqual(thrustXY(input), { x: 0, y: 0 });
  assert.equal(input.touchDrag, null);
  h.pointermove(T(1, 180, 200)); // dx = 80 -> f = (80-24)/(90-24)
  const f = 56 / 66;
  assert.ok(Math.abs(input.state.thrust.x - f) < 1e-12);
  assert.ok(approxZero(input.state.thrust.y));
  assert.equal(input.state.firing, false); // SILENT MOVE: left-only never fires
  assert.ok(input.touchDrag && Math.abs(input.touchDrag.x - 1) < 1e-12 && approxZero(input.touchDrag.y));
  h.pointerup(T(1, 180, 200));
  assert.deepEqual(thrustXY(input), { x: 0, y: 0 }); // AUTO-CENTRE
  assert.equal(input.state.firing, false);
  w.restore();
});

test('ST-268 right zone = aim + fire; tap tail keeps the release shot alive', () => {
  const w = installWindow(800, 450);
  const input = createInput({});
  const h = w.handlers;
  h.pointerdown(T(2, 600, 100));
  assert.equal(input.state.firing, true);
  assert.equal(input.rightAimActive, true);
  assert.ok(Math.abs(input.pointer.ndc.x - 0.5) < 1e-12);
  assert.ok(Math.abs(input.pointer.ndc.y - (1 - 2 * ((100 - 48) / 450))) < 1e-12); // ST-322 (I352): aim 48 px ABOVE the fingertip (documented spec delta vs the ST-268 touch-position contract)
  h.pointermove(T(2, 650, 120));
  assert.ok(Math.abs(input.pointer.ndc.x - 0.625) < 1e-12); // aim follows the right finger (x is unaffected by the offset)
  assert.ok(Math.abs(input.pointer.ndc.y - (1 - 2 * ((120 - 48) / 450))) < 1e-12); // ST-322: still 48 px above after the move
  h.pointerup(T(2, 650, 120));
  assert.equal(input.rightAimActive, false);
  assert.equal(input.state.firing, true); // FIRE_TAIL: a tap still launches >=1 bullet
  assert.equal(input.pointer.active, false); // the touch no longer owns the aim
  input.tick(0.3); // tail (0.22 s) decays
  assert.equal(input.state.firing, false);
  w.restore();
});

test('ST-268 cross-zone fingers = thrust + fire together (NO pause)', () => {
  const w = installWindow(800, 450);
  let paused = 0;
  const input = createInput({ onPause: () => paused++ });
  const h = w.handlers;
  h.pointerdown(T(1, 100, 200)); // left
  h.pointerdown(T(2, 600, 100)); // right
  assert.equal(paused, 0); // the core dual-zone loop must not pause
  assert.equal(input.state.firing, true);
  h.pointermove(T(1, 140, 200)); // left drag dx = 40 -> f = 16/66
  assert.ok(Math.abs(input.state.thrust.x - 16 / 66) < 1e-12);
  assert.equal(input.state.firing, true); // thrust + fire simultaneously
  assert.ok(Math.abs(input.pointer.ndc.x - 0.5) < 1e-12); // aim still from the right finger
  w.restore();
});

test('ST-268 same-zone second finger = pause + visual confirmation, cooldown-gated', () => {
  const w = installWindow(800, 450);
  let paused = 0, confirmed = 0;
  const input = createInput({ onPause: () => paused++, onPauseConfirm: () => confirmed++ });
  const h = w.handlers;
  h.pointerdown(T(1, 100, 200));
  h.pointerdown(T(2, 200, 300)); // second finger, same (left) zone
  assert.equal(paused, 1);
  assert.equal(confirmed, 1); // visual confirmation fired with the pause
  assert.equal(input.state.firing, false);
  h.pointerup(T(2, 200, 300)); // the pause finger was never tracked: release is a no-op
  assert.deepEqual(thrustXY(input), { x: 0, y: 0 });
  h.pointerdown(T(3, 300, 250)); // immediate same-zone down again: cooldown blocks it
  assert.equal(paused, 1);
  h.pointerup(T(3, 300, 250));
  input.tick(0.5); // PAUSE_COOLDOWN 0.45 s elapses
  h.pointerdown(T(4, 150, 300));
  assert.equal(paused, 2);
  assert.equal(confirmed, 2);
  w.restore();
});

test('ST-268 same-zone pause also works in the right zone (two thumbs, right half)', () => {
  const w = installWindow(800, 450);
  let paused = 0;
  const input = createInput({ onPause: () => paused++ });
  const h = w.handlers;
  h.pointerdown(T(1, 600, 100));
  h.pointerdown(T(2, 700, 200));
  assert.equal(paused, 1);
  w.restore();
});

test('ST-268 extra (3rd) fingers ignored; onBlur clears everything', () => {
  const w = installWindow(800, 450);
  let paused = 0;
  const input = createInput({ onPause: () => paused++ });
  const h = w.handlers;
  h.pointerdown(T(1, 100, 200));
  h.pointerdown(T(2, 600, 100));
  h.pointerdown(T(3, 500, 100)); // 3rd finger: ignored, not tracked, no pause
  assert.equal(paused, 0);
  assert.equal(input.state.firing, true);
  h.pointerup(T(3, 500, 100)); // no-op
  assert.equal(input.state.firing, true);
  h.blur();
  assert.deepEqual(thrustXY(input), { x: 0, y: 0 });
  assert.equal(input.state.firing, false);
  assert.equal(input.pointer.active, false);
  assert.equal(input.rightAimActive, false);
  assert.equal(input.touchDrag, null);
  h.pointerup(T(1, 100, 200)); // no-ops after blur
  h.pointerup(T(2, 600, 100));
  assert.equal(input.state.firing, false);
  w.restore();
});

test('ST-268 keyboard + mouse paths 100% intact (ST-033 regressions none)', () => {
  const w = installWindow(800, 450);
  const input = createInput({});
  const h = w.handlers;
  h.keydown({ code: 'KeyW', preventDefault() {} });
  assert.deepEqual(thrustXY(input), { x: 0, y: -1 });
  h.keydown({ code: 'Space', preventDefault() {} });
  assert.equal(input.state.firing, true);
  h.keyup({ code: 'Space' });
  h.keyup({ code: 'KeyW' });
  assert.deepEqual(thrustXY(input), { x: 0, y: 0 });
  assert.equal(input.state.firing, false);
  // keyboard outranks the left stick
  h.pointerdown(T(1, 100, 200));
  h.pointermove(T(1, 200, 200));
  assert.ok(Math.abs(input.state.thrust.x - 1) < 1e-12);
  h.keydown({ code: 'KeyD', preventDefault() {} });
  assert.deepEqual(thrustXY(input), { x: 1, y: 0 });
  h.keyup({ code: 'KeyD' });
  // mouse: button 0 holds the fire, moves set the ndc
  h.pointerup(T(1, 200, 200));
  h.pointerdown({ pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 });
  assert.equal(input.state.firing, true);
  h.pointerup({ pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 });
  assert.equal(input.state.firing, false);
  h.pointermove({ pointerType: 'mouse', clientX: 800, clientY: 0 });
  assert.ok(Math.abs(input.pointer.ndc.x - 1) < 1e-12);
  assert.equal(input.pointer.active, true);
  w.restore();
});

test('ST-268 duplicate pointerdown for the same id is a no-op (no pause, no re-track)', () => {
  const w = installWindow(800, 450);
  let paused = 0;
  const input = createInput({ onPause: () => paused++ });
  const h = w.handlers;
  h.pointerdown(T(1, 100, 200));
  h.pointerdown(T(1, 100, 200));
  assert.equal(paused, 0);
  h.pointerup(T(1, 100, 200));
  assert.deepEqual(thrustXY(input), { x: 0, y: 0 });
  w.restore();
});