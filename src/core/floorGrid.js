// ST-257 (I269): arena floor grid layout + radial falloff color math.
// Pure (no three.js, no DOM) - the render layer (src/render/arenaFloor.js)
// builds one static LineSegments from these tables (1 draw call, same as
// the old PolarGridHelper it replaces).
//
// Design (E20 readability arc): the old grid was busy COOL BLUE graph paper
// (12 spokes + 8 alternating rings, uniform luma ~38-42) that fought the
// warm E18 world. The new grid is WARM NEUTRAL (R>G>B), SPARSER (8 spokes +
// 5 rings) and SOFTER with RADIAL FADE: brightest at the center hub, dim
// band at the edge receding into the boundary ring.
//
// Colors are sRGB triples [r,g,b] in 0..255. The render layer converts them
// to linear working space (three ColorManagement) and writes vertex colors
// on a toneMapped:false LineBasicMaterial, so the displayed luma ~ the
// configured sRGB values (the ST-177 FX-off floor is checked on exactly
// those values).

// Radial falloff: 1 at the center (t=0), 0 at the arena edge (t=1).
// t is normalized radius (r / arena.radius). Clamped for safety.
export function falloff(t, pow) {
  const x = Math.min(Math.max(t, 0), 1);
  return Math.pow(1 - x, pow);
}

// Linear mix of two sRGB triples: result = dim + (bright - dim) * f.
export function mixRGB(dim, bright, f) {
  const k = Math.min(Math.max(f, 0), 1);
  return [
    Math.round(dim[0] + (bright[0] - dim[0]) * k),
    Math.round(dim[1] + (bright[1] - dim[1]) * k),
    Math.round(dim[2] + (bright[2] - dim[2]) * k),
  ];
}

// sRGB color at normalized radius t (one curve for both rings and spokes).
export function gridColorAt(dim, bright, t, pow) {
  return mixRGB(dim, bright, falloff(t, pow));
}

// Ring radii, innermost first: radius/rings * (i+1), i = 0..rings-1.
export function ringRadii(radius, rings) {
  const out = [];
  for (let i = 0; i < rings; i++) out.push((radius / rings) * (i + 1));
  return out;
}

// Vertex/segment bookkeeping (tests + budget). Each ring is a closed loop
// of divisions segments (2 verts each). Each spoke is split into spokeSegs
// linear segments (2 verts each) so the pow-falloff reads smoothly instead
// of one straight linear ramp.
export function gridVertexCount(rings, sectors, divisions, spokeSegs) {
  return rings * divisions * 2 + sectors * spokeSegs * 2;
}

export function gridSegmentCount(rings, sectors, divisions, spokeSegs) {
  return rings * divisions + sectors * spokeSegs;
}

// ST-277 (I294): radial gradient stops for the floor disc - [t, r, g, b] sRGB triples.
// t = 0 at the hub, 1 at the arena edge; brighter center -> darker rim (the "arena
// depth cut"). Pure: the render layer (src/render/floorDisc.js) samples these into a
// canvas radial gradient.
export function discGradientStops(disc) {
  const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const c = hex(disc.center);
  const m = hex(disc.mid);
  const r = hex(disc.rim);
  return [
    [0, c[0], c[1], c[2]],
    [disc.midT, m[0], m[1], m[2]],
    [1, r[0], r[1], r[2]],
  ];
}
