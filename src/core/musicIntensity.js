// Void Runner - music intensity mapping (ST-170, I170).
// Pure: maps world state (wave number, boss alive) to a music-intensity x in [0,1],
// which the render layer feeds to audio.musicIntensity(x) (audio.js: opens the drone
// filter + lifts the bus as tension rises). No DOM, no three.js, no AudioContext.
//
// Design (grounded in the difficulty curve, config.js): the run is endless with a
// boss every multiple of 5 and a speed ramp that caps ~wave 18, so tension rises
// with the wave via a smooth asymptote  1 - exp(-max(0, wave-1)/waveK)  scaled to
// waveCeil (the non-boss late game approaches but never reaches 1), and a live boss
// lifts the intensity to at least bossFloor (the peak-tension moment).
export function musicIntensityX(world, opts = {}) {
  const waveK = opts.waveK > 0 ? opts.waveK : 12;
  const waveCeil = opts.waveCeil != null ? opts.waveCeil : 0.75;
  const bossFloor = opts.bossFloor != null ? opts.bossFloor : 0.9;
  const wave = world && world.wave > 0 ? world.wave : 1;
  const bossAlive = !!(world && world.boss && world.boss.alive);
  const t = 1 - Math.exp(-Math.max(0, wave - 1) / waveK);
  let x = waveCeil * t;
  if (bossAlive) x = Math.max(x, bossFloor);
  return Math.max(0, Math.min(1, x));
}