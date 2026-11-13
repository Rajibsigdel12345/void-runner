// ST-290 (I311): boss attack telegraph window math - pure, DOM-free, three-free (testable).
// The render layer (src/render/bossMesh.js) feeds the public game-time attack timers
// through these helpers to map each attack last moments to a 0..1 anticipation
// progress: 0 at the window edge, 1 at the fire moment. Slow-mo safe by construction:
// the timers are game-time advanced (edt) and the mapping is a stateless function of
// the timer value, so a slow-mo frame reads the exact same progress as a real-time one.

/** 0..1 anticipation progress for a timer counting down to a fire at 0 within `window` seconds.
 * Out-of-window (timer < 0 sentinel, timer > window, non-finite, or degenerate window) -> 0. */
export function teleProgress(timer, window) {
  if (!(window > 0)) return 0;
  if (typeof timer !== "number" || !Number.isFinite(timer)) return 0;
  if (timer < 0 || timer > window) return 0;
  return 1 - timer / window; // 0 at the window edge -> 1 at the fire moment
}

/** Urgency easing over anticipation progress (pow curve: slow start, accelerates into the fire).
 * exp >= 1 gives the "closing in" read; exp = 1 is linear; exp < 1 falls back to a clamped
 * linear pass-through (keeps the curve monotone and bounded for any config value). */
export function teleUrgency(progress, exp = 1) {
  const p = (typeof progress === "number" && Number.isFinite(progress)) ? Math.max(0, Math.min(1, progress)) : 0;
  if (!(exp >= 1)) return p;
  return Math.pow(p, exp);
}
