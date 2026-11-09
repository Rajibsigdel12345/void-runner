// Void Runner - fixed-timestep frame clock (ST-078).
// Pure wall-clock accumulator: real ms timestamps in -> sim steps out. Huge gaps
// (tab switch, long pause, throttled rAF) are clamped to maxFrameDt and the backlog
// is dropped past maxSubsteps, so resuming a paused game can never fast-forward the
// simulation. No DOM, no three.js - unit-testable.
export function createClock(opts = {}) {
  const step = opts.step > 0 ? opts.step : 1 / 60;
  const maxFrameDt = opts.maxFrameDt > 0 ? opts.maxFrameDt : 0.25;
  const maxSubsteps = opts.maxSubsteps >= 1 ? opts.maxSubsteps : 8;
  let last = null;
  let acc = 0;
  function tick(now) {
    if (last == null) { last = now; return { steps: 0, dt: 0, clamped: false, dropped: false, backlog: 0 }; }
    let dt = (now - last) / 1000;
    last = now;
    let clamped = false;
    if (dt < 0) dt = 0; // backwards clock jump (NTP / clock correction): treat as zero
    if (dt > maxFrameDt) { dt = maxFrameDt; clamped = true; }
    acc += dt;
    let n = 0;
    while (acc >= step && n < maxSubsteps) { acc -= step; n++; }
    let dropped = false;
    if (n === maxSubsteps && acc >= step) { acc = 0; dropped = true; } // backlog over the cap is dropped, not queued
    return { steps: n, dt, clamped, dropped, backlog: acc };
  }
  /** Fresh clock: discards any pending backlog and baselines at now (ST-078 resume path). */
  function reset(now = null) { last = now; acc = 0; }
  function state() { return { last, acc, step, maxFrameDt, maxSubsteps }; }
  return { tick, reset, state };
}
