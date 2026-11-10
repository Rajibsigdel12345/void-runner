// Void Runner - adaptive quality (ST-073).
// Pure rolling-FPS state machine: when the rolling window average stays below
// thresholdFps for `confirmWindows` consecutive windows, the FX tier is downgraded
// high -> low exactly once. A user change of the FX setting (userSet) overrides the
// automation and locks it for the rest of the session. No DOM, no three.js - the
// render loop feeds real frame deltas via noteFrame; tier changes report via onTier.
export function createAdaptiveQuality(cfg = {}, onTier = null) {
  const windowSec = cfg.windowSec > 0 ? cfg.windowSec : 1.0;
  const threshold = cfg.thresholdFps > 0 ? cfg.thresholdFps : 45;
  const confirm = cfg.confirmWindows >= 1 ? cfg.confirmWindows : 2;
  let tier = "high";
  let autoLow = false; // current tier was chosen by the automation
  let userLocked = false; // user explicitly chose a tier (overrides automation)
  let frames = 0;
  let acc = 0;
  let belowStreak = 0;
  let lastFps = 0;
  function noteFrame(dt) {
    if (!(dt > 0)) return; // ignore clamped/zero/negative frames
    frames += 1;
    acc += dt;
    if (acc < windowSec) return;
    lastFps = frames / acc;
    frames = 0;
    acc = 0;
    if (lastFps < threshold) belowStreak += 1; else belowStreak = 0;
    if (!userLocked && tier === "high" && belowStreak >= confirm) {
      tier = "low";
      autoLow = true;
      if (typeof onTier === "function") onTier({ type: "autoDowngrade", tier, fps: lastFps });
    }
  }
  function userSet(t) {
    if (t !== "low" && t !== "high" && t !== "off") return; // ST-224: off is user-only; the ladder only ever fires from high
    userLocked = true;
    autoLow = false;
    tier = t;
    belowStreak = 0;
    if (typeof onTier === "function") onTier({ type: "user", tier });
  }
  function reset() {
    tier = "high"; autoLow = false; userLocked = false;
    belowStreak = 0; lastFps = 0; frames = 0; acc = 0;
  }
  return {
    noteFrame,
    userSet,
    reset,
    state() { return { tier, autoLow, userLocked, fps: lastFps, belowStreak, windowSec, threshold }; }
  };
}
