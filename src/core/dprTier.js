// Void Runner - load-reactive DPR (ST-225).
// Pure: maps an FX tier to a renderer pixel-ratio cap. High -> min(dpr, caps.high),
// low/off -> min(dpr, caps.low). Invalid tiers normalize to high (defensive mirror of
// storage). Invalid dpr clamps to 1. No DOM, no three.js.
export function dprForTier(tier, dpr, caps = {}) {
  const high = caps.high > 0 && isFinite(caps.high) ? caps.high : 2;
  const low = caps.low > 0 && isFinite(caps.low) ? caps.low : 1.5;
  const cap = tier === 'low' || tier === 'off' ? low : high;
  const d = dpr > 0 && isFinite(dpr) ? dpr : 1;
  return Math.min(d, cap);
}
