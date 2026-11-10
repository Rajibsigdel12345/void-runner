// ST-172 (I172): bullet-time audio mapping (src/core/timeWarp.js).
// Pure core, DOM-free, node --test. The render layer (audio.js) consumes the
// output: pad/sub detune in cents + filter close; main.js drives it from
// world.enemyScale() with a change-cache (I170 pattern).
import test from "node:test";
import assert from "node:assert/strict";
import { timeWarpX, timeWarpCents } from "../src/core/timeWarp.js";

test("warp: normal time (scale >= 1) is zero warp", () => {
  assert.equal(timeWarpX(1), 0);
  assert.equal(timeWarpX(1.5), 0); // never "negative warp"
});

test("warp: dilated time maps to x = 1 - scale (slow-mo 0.4 -> 0.6)", () => {
  assert.ok(Math.abs(timeWarpX(0.4) - 0.6) < 1e-9);
  assert.ok(Math.abs(timeWarpX(0.25) - 0.75) < 1e-9);
});

test("warp: degenerate scales clamp to 0 (0, negative, NaN)", () => {
  assert.equal(timeWarpX(0), 0);
  assert.equal(timeWarpX(-0.5), 0);
  assert.equal(timeWarpX(NaN), 0);
});

test("cents: x 0 -> 0; full warp x 1 -> -centsMax (default 700)", () => {
  assert.equal(timeWarpCents(0), 0);
  assert.equal(timeWarpCents(1), -700);
  assert.equal(timeWarpCents(1, { centsMax: 300 }), -300);
  assert.equal(timeWarpCents(0.5, { centsMax: 300 }), -150);
});

test("cents: monotonic - more warp never raises the pitch", () => {
  let prev = 0;
  for (let i = 1; i <= 10; i++) {
    const c = timeWarpCents(i / 10);
    assert.ok(c <= prev + 1e-9, "cents must be non-increasing");
    prev = c;
  }
});

test("cents: x clamps outside [0,1] (negative, >1, NaN)", () => {
  assert.equal(timeWarpCents(-0.5), 0);
  assert.equal(timeWarpCents(1.7), -700);
  assert.equal(timeWarpCents(NaN), 0);
});

test("integration: the shipped slow-mo power-up (scale 0.4) lands at -420 cents", () => {
  const x = timeWarpX(0.4);
  assert.equal(timeWarpCents(x), -420); // major third +, audible but musical
});