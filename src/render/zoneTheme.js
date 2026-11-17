// ST-455 (E64, I488): zone palette crossfade driver (render layer - owns the fade,
// main.js owns the paint). Holds the painted state (dome color + opacity,
// grid/floor/accent tints) and fades current -> target over
// CONFIG.zoneTheme.blendDur seconds.
// - setStars callback fires immediately on target change (discrete star uniform,
//   E60 precedent - stars are NOT blended).
// - Reduced motion (rm = true) snaps the fade in one frame.
// - Idle (t >= 1) = zero per-frame work: endless + MENU stay bit-exact.
import { themeState, blendState } from "../core/zonePalette.js";

export function createZoneTheme(paint, blendDur, bases, setStars) {
  const aState = { sky: bases.sky, grid: bases.grid, floor: bases.floor, accent: bases.accent, opacity: 0 };
  const bState = { sky: bases.sky, grid: bases.grid, floor: bases.floor, accent: bases.accent, opacity: 0 };
  const out = { sky: bases.sky, grid: bases.grid, floor: bases.floor, accent: bases.accent, opacity: 0 };
  let t = 1; // 1 = settled at target (idle = zero work)
  function paintNow() {
    if (t >= 1) { out.sky = bState.sky; out.grid = bState.grid; out.floor = bState.floor; out.accent = bState.accent; out.opacity = bState.opacity; }
    else blendState(aState, bState, t, out);
    paint(out);
  }
  function setTarget(theme, snap) {
    if (setStars) setStars(theme); // discrete star tint first (E60 shape)
    aState.sky = out.sky; aState.grid = out.grid; aState.floor = out.floor; aState.accent = out.accent; aState.opacity = out.opacity; // fade from what is painted now
    themeState(theme, bases, bState);
    t = snap || blendDur <= 0 ? 1 : 0;
    paintNow();
  }
  function update(dt, rm) {
    if (t >= 1) return; // idle = zero work
    t = rm ? 1 : Math.min(1, t + dt / blendDur);
    paintNow();
  }
  function cancel() { setTarget(null, true); } // immediate identity (endless theme swap / menu / run start wins)
  function state() { return { t, painted: { sky: out.sky, grid: out.grid, floor: out.floor, accent: out.accent, opacity: out.opacity } }; }
  paintNow(); // initial paint: identity state (no-op for the materials at boot)
  return { setTarget, update, cancel, state };
}
