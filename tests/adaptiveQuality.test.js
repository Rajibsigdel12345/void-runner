// ST-073: adaptive quality - pure rolling-FPS downgrade state machine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdaptiveQuality } from '../src/core/adaptiveQuality.js';

// windowSec 1.0: dt=0.05 -> 20fps (bad window); dt=1/60 -> ~60fps (good window).
const BAD = 0.05;
const GOOD = 1 / 60;
function feed(aq, dt, n) { for (let i = 0; i < n; i++) aq.noteFrame(dt); }
const badWindow = (aq) => feed(aq, BAD, 20);
const goodWindow = (aq) => feed(aq, GOOD, 60);

test('downgrades high -> low after confirmWindows consecutive bad windows', () => {
  const events = [];
  const aq = createAdaptiveQuality({ windowSec: 1.0, thresholdFps: 45, confirmWindows: 2 }, (e) => events.push(e));
  badWindow(aq);
  assert.equal(aq.state().tier, "high"); // one bad window is not enough
  badWindow(aq);
  assert.equal(aq.state().tier, "low");
  assert.equal(aq.state().autoLow, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "autoDowngrade");
  assert.equal(events[0].tier, "low");
  assert.ok(events[0].fps > 0 && events[0].fps < 45);
});

test('a good window resets the below-threshold streak', () => {
  const events = [];
  const aq = createAdaptiveQuality({ windowSec: 1.0, thresholdFps: 45, confirmWindows: 2 }, (e) => events.push(e));
  badWindow(aq);
  goodWindow(aq); // resets streak
  badWindow(aq);
  assert.equal(aq.state().tier, "high");
  assert.equal(aq.state().belowStreak, 1);
  assert.equal(events.length, 0);
});

test('window average (not instantaneous) is what matters', () => {
  const aq = createAdaptiveQuality({ windowSec: 1.0, thresholdFps: 45, confirmWindows: 1 });
  goodWindow(aq);
  assert.ok(aq.state().fps >= 45);
  badWindow(aq);
  assert.equal(aq.state().tier, "low"); // confirmWindows 1: single bad window
});

test('user FX choice overrides automation (overridable)', () => {
  const events = [];
  const aq = createAdaptiveQuality({ windowSec: 1.0, thresholdFps: 45, confirmWindows: 2 }, (e) => events.push(e));
  aq.userSet("high");
  badWindow(aq); badWindow(aq); badWindow(aq);
  assert.equal(aq.state().tier, "high"); // locked by user
  assert.equal(aq.state().userLocked, true);
  assert.equal(events.filter((e) => e.type === "autoDowngrade").length, 0);
});

test('userSet("low") applies immediately without an autoDowngrade event', () => {
  const events = [];
  const aq = createAdaptiveQuality({ windowSec: 1.0, thresholdFps: 45, confirmWindows: 1 }, (e) => events.push(e));
  aq.userSet("low");
  assert.equal(aq.state().tier, "low");
  assert.equal(aq.state().autoLow, false);
  assert.deepEqual(events, [{ type: "user", tier: "low" }]);
});

test('invalid userSet values are ignored', () => {
  const aq = createAdaptiveQuality();
  aq.userSet("ultra"); aq.userSet(undefined); aq.userSet(0);
  assert.equal(aq.state().tier, "high");
  assert.equal(aq.state().userLocked, false);
});

test('userSet("off") locks the off tier; the ladder never auto-produces off (ST-224)', () => {
  const events = [];
  const aq = createAdaptiveQuality({ windowSec: 1.0, thresholdFps: 45, confirmWindows: 1 }, (e) => events.push(e));
  aq.userSet("off");
  assert.equal(aq.state().tier, "off");
  assert.equal(aq.state().userLocked, true);
  assert.equal(aq.state().autoLow, false);
  assert.deepEqual(events, [{ type: "user", tier: "off" }]);
  badWindow(aq); badWindow(aq);
  assert.equal(aq.state().tier, "off"); // ladder only fires from high - off is untouched
  assert.equal(events.filter((e) => e.type === "autoDowngrade").length, 0);
  // any userSet locks automation for the session (existing contract) - reset() re-arms it
  aq.reset();
  badWindow(aq); badWindow(aq);
  assert.equal(aq.state().tier, "low"); // ladder works again after a session reset
});

test('non-positive dt is ignored (no NaN, no frame count)', () => {
  const aq = createAdaptiveQuality({ windowSec: 0.5, thresholdFps: 45, confirmWindows: 1 });
  aq.noteFrame(0); aq.noteFrame(-1); aq.noteFrame(NaN);
  assert.equal(aq.state().fps, 0);
  assert.equal(aq.state().tier, "high");
});

test('reset restores defaults', () => {
  const aq = createAdaptiveQuality({ windowSec: 1.0, thresholdFps: 45, confirmWindows: 1 });
  badWindow(aq);
  assert.equal(aq.state().tier, "low");
  aq.reset();
  const s = aq.state();
  assert.equal(s.tier, "high"); assert.equal(s.autoLow, false); assert.equal(s.userLocked, false); assert.equal(s.belowStreak, 0); assert.equal(s.fps, 0);
});

test('defaults are used when cfg is omitted', () => {
  const aq = createAdaptiveQuality();
  const s = aq.state();
  assert.equal(s.windowSec, 1.0);
  assert.equal(s.threshold, 45);
  assert.equal(s.tier, "high");
});
