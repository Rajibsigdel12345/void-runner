// Pure 2D math helpers (no three.js, no DOM).
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// frame-rate independent exponential smoothing
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const v2 = (x = 0, y = 0) => ({ x, y });
export const v2Len = (v) => Math.hypot(v.x, v.y);
export const v2Dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const v2Scale = (v, s) => v2(v.x * s, v.y * s);
export const v2Add = (a, b) => v2(a.x + b.x, a.y + b.y);
export const v2Sub = (a, b) => v2(a.x - b.x, a.y - b.y);
export const v2Norm = (v) => { const l = v2Len(v) || 1; return v2(v.x / l, v.y / l); };
export const v2Set = (out, x, y) => { out.x = x; out.y = y; return out; };
export const v2Copy = (out, v) => { out.x = v.x; out.y = v.y; return out; };
export const v2FromAngle = (a, out = v2()) => v2Set(out, Math.cos(a), Math.sin(a));
// shortest signed angle from a to b in (-PI, PI]
export const angDiff = (a, b) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
// frame-rate independent angle smoothing along shortest arc
export const dampAngle = (a, b, lambda, dt) => a + angDiff(a, b) * (1 - Math.exp(-lambda * dt));
