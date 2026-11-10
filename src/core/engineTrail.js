// Void Runner - engine trail emission (I213, ST-213). Pure core module:
// decides WHEN the render layer should emit a small additive engine-trail
// puff while the ship thrusts. No three.js, no DOM, no Math.random - the
// accumulator is deterministic so tests can pin its long-run rate.
//
// Emissions are quantized (at most cfg.maxPerUpdate per update call); the
// dt clamp (cfg.dtMax) keeps a tab-restore giant frame from bursting a
// giant puff, and the accumulator overflow clamp keeps state bounded.

export function createEngineTrail(cfg) {
  const rate = cfg.rate;                 // puffs/s at full thrust
  const minThrust = cfg.minThrust;       // thrust fraction below which: silent
  const dtMax = cfg.dtMax;               // dt clamp (s)
  const maxPerUpdate = cfg.maxPerUpdate; // hard cap on puffs per update
  let acc = 0;
  return {
    /**
     * Advance the trail emitter.
     * @param {number} dt seconds since last update
     * @param {number} thrust 0..1 normalized thrust magnitude
     * @param {boolean} active trail allowed (e.g. PLAYING and not reduced-motion)
     * @returns {number} number of puffs to emit this update (0..maxPerUpdate)
     */
    update(dt, thrust, active) {
      if (!active || thrust < minThrust) { acc = 0; return 0; } // gate off: drain
      acc += Math.min(dt, dtMax) * rate;
      let n = 0;
      while (acc >= 1 && n < maxPerUpdate) { acc -= 1; n += 1; }
      if (n === maxPerUpdate) acc = Math.min(acc, 1); // bound leftover at the cap
      return n;
    },
    /** Reset the accumulator (e.g. on run restart). */
    reset() { acc = 0; },
    /** Current accumulator (0..1) - test/telemetry probe. */
    get() { return acc; },
  };
}
