// Void Runner - bullet-time (slow-mo) audio mapping (ST-172, I172).
// Pure: maps the world's time scale (world.enemyScale(): 1 = normal,
// 0.4 while the slow-mo power-up is active) to a time-warp amount x in [0,1]
// and a pitch shift in cents, which the render layer feeds to audio.timeWarp
// (detunes the drone + closes its filter). Grounding: bullet-time audio in
// games (Max Payne lineage) = time-stretched sound, pitch drops as the world
// slows - see design/audio-music.md (research notes).
//
//   x = clamp(1 - scale, 0, 1)   ->  scale 0.4 (slow-mo power-up) => x 0.6
//   cents = -x * centsMax        ->  x 0.6, centsMax 700 => -420 cents
// A full proportional drop (freq * scale, ~-1586 cents at 0.4x) is far too
// extreme for a music bed, so the shift is capped by centsMax - the game
// references drop by semitones/thirds, not octaves.
export function timeWarpX(scale) {
  if (!(scale > 0)) return 0; // 0 / negative / NaN -> normal
  if (scale >= 1) return 0;
  return Math.min(1, 1 - scale);
}
export function timeWarpCents(x, opts = {}) {
  const centsMax = opts.centsMax > 0 ? opts.centsMax : 700;
  const cx = Math.max(0, Math.min(1, x || 0));
  return cx === 0 ? 0 : -cx * centsMax; // explicit 0 (not -0)
}