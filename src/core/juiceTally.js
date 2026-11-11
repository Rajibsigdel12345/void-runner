// ST-183: per-run juice-channel firing tally (pure, DOM-free).
//
// Records which feel channels ACTUALLY fired per event type, after the
// motion gate - the render layer (src/main.js) calls record() only inside a
// branch that triggered the channel. This is the "Telemetry Need" from
// design/feel-balance.md (ST-179): feel tuning should ride on what fired,
// not on guess. An empty tally under reduced motion is a feature: it proves
// the gate, and it is the data baseline for the I202 human playtest.
export const JUICE_CHANNELS = ["flash", "shake", "punch", "hitStop", "fovKick", "ring"]; // ST-238 (I245): + ring (the shockwave channel)

function newRow() {
  const row = {};
  for (const c of JUICE_CHANNELS) row[c] = 0;
  return row;
}

export function createJuiceTally() {
  const tally = {};
  return {
    // channels: a subset of JUICE_CHANNELS. Unknown keys are ignored (the
    // schema stays stable for the probe), and a call with no known channel
    // flagged creates no row (an event with no fired channel is invisible).
    record(type, channels) {
      if (!type || !channels) return;
      const keys = JUICE_CHANNELS.filter((c) => channels[c]);
      if (!keys.length) return;
      let row = tally[type];
      if (!row) row = tally[type] = newRow();
      for (const c of keys) row[c] += 1;
    },
    // Plain deep copy: safe to hand to __vr / JSON / screenshots.
    snapshot() {
      const out = {};
      for (const t in tally) out[t] = Object.assign({}, tally[t]);
      return out;
    },
    // Per-run boundary: called from startRun / restartRun (src/main.js).
    reset() {
      for (const t in tally) delete tally[t];
    },
    // One (type, channel) cell; 0 when absent.
    total(type, channel) {
      const row = tally[type];
      return row && row[channel] ? row[channel] : 0;
    },
  };
}
