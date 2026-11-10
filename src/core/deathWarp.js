// I174 (ST-174): death slow-mo dilation amount for the audio bed. Pure,
// DOM-free (unit-testable), same shape as timeWarp.js (I172).
// On a ship hit, main.js starts a dur-second window (deathT = dur) and
// syncVisuals calls deathWarpX(remain, dur, deathScale) each frame:
// x is (1 - deathScale) at the moment of the hit and falls linearly to
// 0 as the window closes. main.js composes it with the I172 power-up
// warp via max() so the deeper dilation wins while both are active.
// Composing with timeWarpX: with p = clamp(remain/dur, 0, 1), the
// implied enemy scale is 1 - (1 - deathScale) * p, so
// timeWarpX(that) === (1 - deathScale) * p === this function - the
// linear-in-remain form is the exact timeWarpX composition, not an
// approximation.
export function deathWarpX(remain, dur, deathScale = 0.25) {
  if (!(dur > 0)) return 0;
  const p = Math.max(0, Math.min(1, remain / dur));
  return (1 - deathScale) * p;
}
