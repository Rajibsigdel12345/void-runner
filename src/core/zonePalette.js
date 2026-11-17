// ST-455 (E64, I488): zone-identity palette helpers (pure core - no three, no DOM).
// Zone palettes (CONFIG.levels.palettes) use the E57 stage-theme shape
// {sky, stars, floor, grid, accent}. null / unknown / empty id = arena identity
// (no visual change) - the campaign starts at identity so the bit-exact baseline
// holds (drift-1 = null, ST-452 model).
//
// Math only: resolve palette id -> sanitized theme, and blend two painted states
// (dome color + opacity, grid/floor/accent tints) for the crossfade. Stars are NOT
// blended (E60 precedent: discrete uniform tint on target change - a half-tinted
// starfield reads as a muddy smudge).

export function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }

export function lerp(a, b, t) { return a + (b - a) * t; }

// Per-channel hex lerp: a, b = 0xRRGGBB ints -> rounded, clamped 0..0xffffff int.
export function lerpHex(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t) & 0xff;
  const g = Math.round(ag + (bg - ag) * t) & 0xff;
  const bl = Math.round(ab + (bb - ab) * t) & 0xff;
  return (r << 16) | (g << 8) | bl;
}

// Dome opacity when a theme is active (matches themeDome.js initial value).
export const DOME_OPACITY = 0.6;

const _san = (v) => (typeof v === "number" && Number.isFinite(v) ? (Math.min(0xffffff, Math.max(0, Math.round(v))) & 0xffffff) : 0);

// Resolve a palette id to a renderable theme, or null for identity/unknown/empty.
// Every channel is sanitized to a 0..0xffffff int so a bad config row can never
// produce a NaN tint.
export function zoneThemeFor(paletteId, palettes) {
  if (!paletteId || !palettes) return null;
  const p = palettes[paletteId];
  if (!p) return null;
  if (p.sky === undefined && p.stars === undefined && p.floor === undefined && p.grid === undefined && p.accent === undefined) return null; // empty palette object = identity
  return { sky: _san(p.sky), stars: _san(p.stars), floor: _san(p.floor), grid: _san(p.grid), accent: _san(p.accent) };
}

// Painted-state snapshot of what a zone fade writes to materials:
// {sky, grid, floor, accent, opacity}. themeState resolves a target theme
// (null = identity) against the captured bases, falling back per channel so a
// partial theme only tints what it names.
export function themeState(theme, base, out) {
  out.sky = theme && theme.sky !== undefined ? theme.sky : base.sky;
  out.grid = theme && theme.grid !== undefined ? theme.grid : base.grid;
  out.floor = theme && theme.floor !== undefined ? theme.floor : base.floor;
  out.accent = theme && theme.accent !== undefined ? theme.accent : base.accent;
  out.opacity = theme ? DOME_OPACITY : 0;
  return out;
}

// Blend painted states a -> b by t in [0,1] into out. Stars intentionally excluded.
export function blendState(a, b, t, out) {
  out.sky = lerpHex(a.sky, b.sky, t);
  out.grid = lerpHex(a.grid, b.grid, t);
  out.floor = lerpHex(a.floor, b.floor, t);
  out.accent = lerpHex(a.accent, b.accent, t);
  out.opacity = lerp(a.opacity, b.opacity, t);
  return out;
}
