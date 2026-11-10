import { test } from "node:test";
import assert from "node:assert/strict";
import { createJuiceTally, JUICE_CHANNELS } from "../src/core/juiceTally.js";

test("the five channels are the fixed schema", () => {
  assert.deepEqual([...JUICE_CHANNELS].sort(), ["flash", "fovKick", "hitStop", "punch", "shake"]);
});

test("a fresh tally is empty", () => {
  assert.deepEqual(createJuiceTally().snapshot(), {});
});

test("record counts one per channel per call", () => {
  const t = createJuiceTally();
  t.record("hit", { shake: 1, flash: 1 });
  const s = t.snapshot();
  assert.equal(s.hit.shake, 1);
  assert.equal(s.hit.flash, 1);
  assert.equal(s.hit.punch, 0);
  assert.equal(s.hit.hitStop, 0);
  assert.equal(s.hit.fovKick, 0);
});

test("record accumulates across calls and types stay independent", () => {
  const t = createJuiceTally();
  t.record("hit", { flash: 1 });
  t.record("hit", { flash: 1, shake: 1 });
  t.record("bomb", { flash: 1, shake: 1, punch: 1, hitStop: 1, fovKick: 1 });
  const s = t.snapshot();
  assert.equal(s.hit.flash, 2);
  assert.equal(s.hit.shake, 1);
  assert.equal(s.hit.punch, 0);
  assert.equal(s.bomb.punch, 1);
  assert.equal(s.bomb.hitStop, 1);
});

test("an event with no fired channel leaves no row (the reduced-motion tally stays empty)", () => {
  const t = createJuiceTally();
  t.record("powerup", {});
  t.record("powerup", null);
  assert.deepEqual(t.snapshot(), {});
});

test("unknown channel keys are ignored (stable schema)", () => {
  const t = createJuiceTally();
  t.record("hit", { flash: 1, bogus: 1 });
  const s = t.snapshot();
  assert.equal(s.hit.flash, 1);
  assert.ok(!("bogus" in s.hit));
});

test("invalid args are a no-op without throwing", () => {
  const t = createJuiceTally();
  t.record(null, { flash: 1 });
  t.record("hit", null);
  t.record("hit");
  assert.deepEqual(t.snapshot(), {});
});

test("reset clears everything and the tally stays usable", () => {
  const t = createJuiceTally();
  t.record("hit", { flash: 1 });
  t.reset();
  assert.deepEqual(t.snapshot(), {});
  t.record("bomb", { punch: 1 });
  assert.equal(t.total("bomb", "punch"), 1);
});

test("total reads one (type, channel) cell, 0 when absent", () => {
  const t = createJuiceTally();
  assert.equal(t.total("hit", "flash"), 0);
  t.record("hit", { flash: 1, shake: 1 });
  assert.equal(t.total("hit", "flash"), 1);
  assert.equal(t.total("hit", "punch"), 0);
  assert.equal(t.total("nope", "flash"), 0);
});

test("snapshot is a deep copy (mutating it cannot corrupt the tally)", () => {
  const t = createJuiceTally();
  t.record("bomb", { punch: 1 });
  const s = t.snapshot();
  s.bomb.punch = 99;
  s.bomb.faked = 1;
  assert.equal(t.total("bomb", "punch"), 1);
  assert.ok(!("faked" in t.snapshot().bomb));
});
