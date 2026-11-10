// ST-176: reduced-motion damage vignette envelope. Pure core (DOM-free):
// a steady-then-fade opacity multiplier for one hit. Holds at 1.0 for
// `hold` seconds, then falls linearly to 0 over `fade` seconds. Opacity
// only - no motion, no strobe: the reduced-motion policy kills the
// full-screen #flash burst and the decaying juice spike, but the edge
// tint that says "you were hit" stays, steady and slow.
export function dangerVignetteX(t, hold, fade) {
  if (!(hold >= 0) || !(fade >= 0)) return 0;
  if (t <= 0) return 1;
  if (t > hold && fade <= 0) return 0; // pure step: held at 1, then off
  if (t >= hold + fade) return 0;
  if (t <= hold) return 1;
  return 1 - (t - hold) / fade;
}