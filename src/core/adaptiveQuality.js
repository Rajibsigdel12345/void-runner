// Void Runner - adaptive quality (ST-073).
// Pure rolling-FPS state machine: when the rolling window average stays below
// thresholdFps for `confirmWindows` consecutive windows, the FX tier is downgraded
// high -> low exactly once. A user change of the FX setting (userSet) overrides the
// automation and locks it for the rest of the session. No DOM, no three.js - the
// render loop feeds real frame deltas via noteFrame; tier changes report via onTier.
export function createAdaptiveQuality(cfg = {}, onTier = null, initialTier = "high") {
  const windowSec = cfg.windowSec > 0 ? cfg.windowSec : 1.0;
  const threshold = cfg.thresholdFps > 0 ? cfg.thresholdFps : 45;
  const confirm = cfg.confirmWindows >= 1 ? cfg.confirmWindows : 2;
  // I255: initialize the ladder from the stored FX tier so a persisted non-default choice
  // ('low'/'off') is respected as an explicit prior user choice and is NEVER overridden by a
  // phantom high->low auto-downgrade (ST-225 "stored choice never overwritten"). A default
  // 'high' (or an invalid value) stays auto-manageable (unlocked, tier 'high').
  const bootTier = initialTier === "low" || initialTier === "off" ? initialTier : "high";
  let tier = bootTier;
  let autoLow = false; // current tier was chosen by the automation
  let userLocked = bootTier !== "high"; // a stored 'low'/'off' is an explicit prior user choice
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
    tier = bootTier; autoLow = false; userLocked = bootTier !== "high";
    belowStreak = 0; lastFps = 0; frames = 0; acc = 0;
  }
  return {
    noteFrame,
    userSet,
    reset,
    state() { return { tier, autoLow, userLocked, fps: lastFps, belowStreak, windowSec, threshold }; }
  };
}
