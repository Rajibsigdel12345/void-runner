// Void Runner - music intensity mapping (ST-170, I170; extended ST-241, I249).
// Pure: maps world state (wave number, boss alive) to a music-intensity x in [0,1],
// which the render layer feeds to audio.musicIntensity(x) (audio.js: opens the drone
// filter + lifts the bus as tension rises). No DOM, no three.js, no AudioContext.
//
// Design (grounded in the difficulty curve, config.js): the run is endless with a
// boss every multiple of 5 and a speed ramp that caps ~wave 18, so tension rises
// with the wave via a smooth asymptote  1 - exp(-max(0, wave-1)/waveK)  scaled to
// waveCeil (the non-boss late game approaches but never reaches 1), and a live boss
// lifts the intensity to at least bossFloor (the peak-tension moment).
//
// ST-241 (I249): three levers so the boss arc feels composed instead of stepped:
//   (a) the boss floor EASES IN over the boss entrance window via boss.entered (0..1,
//       ST-135) - no new world state, and a legacy fixture without `entered` (or with
//       a non-finite one) is treated as fully entered, keeping ST-170 behavior exact.
//   (b) a small PHASE-2 LIFT while the boss is enraged (phase === 2, one-way at
//       hpFrac 0.5), capped at 1.0.
//   (c) a post-death RELEASE DECAY: world.bossRelease 1 -> 0 over
//       config music.intensity.releaseTime glides the intensity from the peak back to
//       the wave tension (release after the peak - I247 YouTube epic grounding).
function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
export function musicIntensityX(world, opts = {}) {
  const waveK = opts.waveK > 0 ? opts.waveK : 12;
  const waveCeil = opts.waveCeil != null ? opts.waveCeil : 0.75;
  const bossFloor = opts.bossFloor != null ? opts.bossFloor : 0.9;
  const phase2Lift = opts.phase2Lift != null ? opts.phase2Lift : 0.1; // ST-241
  const wave = world && world.wave > 0 ? world.wave : 1;
  const waveX = waveCeil * (1 - Math.exp(-Math.max(0, wave - 1) / waveK));
  const boss = world && world.boss;
  if (boss && boss.alive) {
    // (a) entry ramp: the floor fades in with the entrance; legacy fixtures (no
    // `entered`) keep the ST-170 full-floor behavior.
    const e = (boss.entered == null || !Number.isFinite(boss.entered)) ? 1 : clamp01(boss.entered);
    let x = waveX + (bossFloor - waveX) * e;
    if (boss.phase === 2) x += phase2Lift; // (b) enrage lift (capped below)
    return clamp01(x);
  }
  // (c) release: hold the peak (a boss always dies enraged, so the reference level
  // is the capped floor+lift) and decay back to the wave tension.
  const r = clamp01(world && world.bossRelease);
  if (r > 0) {
    const peak = Math.min(1, bossFloor + phase2Lift);
    return clamp01(waveX + (peak - waveX) * r);
  }
  return clamp01(waveX);
}
