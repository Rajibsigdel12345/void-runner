import { test } from "node:test";
import assert from "node:assert/strict";
import { clamp01, lerp, lerpHex, DOME_OPACITY, zoneThemeFor, themeState, blendState } from "../src/core/zonePalette.js";
import { CONFIG } from "../src/core/config.js";

test("lerpHex: endpoints exact (t=0 -> a, t=1 -> b)", () => {
  assert.equal(lerpHex(0x1a130d, 0xffffff, 0), 0x1a130d);
  assert.equal(lerpHex(0x1a130d, 0xffffff, 1), 0xffffff);
  assert.equal(lerpHex(0x05080f, 0x1a130d, 0), 0x05080f);
  assert.equal(lerpHex(0x05080f, 0x1a130d, 1), 0x1a130d);
});

test("lerpHex: midpoint exact per channel", () => {
  assert.equal(lerpHex(0x000000, 0xffffff, 0.5), 0x808080); // round(127.5) = 128 per channel
  assert.equal(lerpHex(0x1a130d, 0xffffff, 0.5), 0x8d8986); // r round(140.5)=141, g 137, b 134
});

test("lerpHex: clamped to 0..0xffffff, no NaN on garbage", () => {
  for (const [a, b] of [[-1, 0xffffff], [0x1fffff, 0], [NaN, 0x123456], [0x123456, "x"], [null, 1]]) {
    const v = lerpHex(a, b, 0.5);
    assert.equal(typeof v, "number");
    assert.ok(Number.isFinite(v), "finite for a=" + a + " b=" + b);
    assert.ok(v >= 0 && v <= 0xffffff, "in range for a=" + a + " b=" + b);
  }
});

test("lerpHex: monotone (non-decreasing) over t when b is brighter", () => {
  let prev = 0;
  for (let i = 0; i <= 20; i++) {
    const v = lerpHex(0x1a130d, 0xffffff, i / 20);
    assert.ok(v >= prev, "non-decreasing at t=" + i / 20);
    prev = v;
  }
});

test("clamp01 + lerp basics", () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0.25), 0.25);
  assert.equal(clamp01(2), 1);
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 1), 20);
});

test("zoneThemeFor: known id exact (drift-2)", () => {
  const t = zoneThemeFor("drift-2", CONFIG.levels.palettes);
  assert.deepEqual(t, { sky: 0x05080f, stars: 0xdce8ff, floor: 0x483728, grid: 0x1a130d, accent: 0x59d8ff });
});

test("zoneThemeFor: null / unknown / empty -> null", () => {
  assert.equal(zoneThemeFor("drift-1", CONFIG.levels.palettes), null); // null palette = identity
  assert.equal(zoneThemeFor(null, CONFIG.levels.palettes), null);
  assert.equal(zoneThemeFor("nope", CONFIG.levels.palettes), null);
  assert.equal(zoneThemeFor("drift-2", null), null);
  assert.equal(zoneThemeFor("x", { x: {} }), null); // empty palette object = identity
});

test("zoneThemeFor: sanitizes garbage to 0..0xffffff ints", () => {
  const t = zoneThemeFor("bad", { bad: { sky: 0x1ffffff, stars: -5, floor: NaN, grid: "z", accent: 1e9 } });
  assert.deepEqual(t, { sky: 0xffffff, stars: 0, floor: 0, grid: 0, accent: 0xffffff });
});

test("themeState: identity (null theme) = bases, opacity 0", () => {
  const base = { sky: 0x000000, grid: 0xffffff, floor: 0xffffff, accent: 0xdfe9ff };
  const out = {};
  themeState(null, base, out);
  assert.deepEqual(out, { sky: 0, grid: 0xffffff, floor: 0xffffff, accent: 0xdfe9ff, opacity: 0 });
});

test("themeState: themed, missing channels fall back to base", () => {
  const base = { sky: 0x000000, grid: 0xffffff, floor: 0xffffff, accent: 0xdfe9ff };
  const out = {};
  themeState({ sky: 0x05080f, grid: 0x1a130d }, base, out);
  assert.equal(out.sky, 0x05080f);
  assert.equal(out.grid, 0x1a130d);
  assert.equal(out.floor, 0xffffff); // base fallback
  assert.equal(out.accent, 0xdfe9ff); // base fallback
  assert.equal(out.opacity, DOME_OPACITY);
});

test("blendState: endpoints + midpoint + determinism", () => {
  const a = { sky: 0x000000, grid: 0xffffff, floor: 0xffffff, accent: 0xdfe9ff, opacity: 0 };
  const b = { sky: 0x05080f, grid: 0x1a130d, floor: 0x483728, accent: 0x59d8ff, opacity: DOME_OPACITY };
  const o1 = {}, o2 = {};
  blendState(a, b, 0, o1);
  assert.equal(o1.sky, a.sky); assert.equal(o1.grid, a.grid); assert.equal(o1.floor, a.floor); assert.equal(o1.accent, a.accent); assert.equal(o1.opacity, 0);
  blendState(a, b, 1, o1);
  assert.equal(o1.sky, b.sky); assert.equal(o1.grid, b.grid); assert.equal(o1.floor, b.floor); assert.equal(o1.accent, b.accent); assert.equal(o1.opacity, DOME_OPACITY);
  blendState(a, b, 0.5, o1);
  blendState(a, b, 0.5, o2);
  assert.deepEqual(o1, o2);
  assert.equal(o1.grid, lerpHex(0xffffff, 0x1a130d, 0.5));
});

test("blendState: no throw on garbage input", () => {
  const a = {}, b = {}, out = {};
  assert.doesNotThrow(() => blendState(a, b, 0.5, out));
  assert.doesNotThrow(() => blendState(a, b, NaN, out));
  assert.doesNotThrow(() => blendState(a, b, -5, out));
});
