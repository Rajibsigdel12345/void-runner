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

// ST-293 (I315): two-segment radial falloff with a mid-arena REST BAND.
// The single-exponent (1 - t)^pow ramp (ST-257) read as one smooth monotone
// fade with no readable plateau (I315 floorab_v3 audit: PLAYING hub->mid
// drop = 31.5% of the hub->rim total vs the <=15% readability target).
// This reshapes the curve so the inner arena holds a consistent, readable
// brightness (the "rest band") and the fade concentrates in the outer
// region (a sharper rim "depth cut").
//
//   t <= restT : 1 - (1 - restHold) * (t / restT)^restPowA
//                hub (f=1) fades to the plateau level (f=restHold); a small
//                restPowA fades quickly near the hub, then goes flat.
//   t >  restT : restHold * (1 - (t - restT) / (1 - restT))^restPowB
//                the plateau drops to 0 at the rim; larger restPowB = a
//                steeper depth cut.
// Continuous at t = restT (both segments equal restHold); f(0) = 1;
// f(1) = 0; monotone non-increasing. Pure (no three.js, no DOM).
export function restFalloff(t, restT, restHold, restPowA, restPowB) {
  const x = Math.min(Math.max(t, 0), 1);
  if (x <= restT) {
    const u = restT > 0 ? x / restT : 1;
    return 1 - (1 - restHold) * Math.pow(u, restPowA);
  }
  const v = 1 - restT > 0 ? (x - restT) / (1 - restT) : 1;
  return restHold * Math.pow(1 - v, restPowB);
}

// sRGB color at normalized radius t on the two-segment rest-band curve.
export function restGridColorAt(dim, bright, t, restT, restHold, restPowA, restPowB) {
  return mixRGB(dim, bright, restFalloff(t, restT, restHold, restPowA, restPowB));
}

// Ring radii, innermost first: radius/rings * (i+1), i = 0..rings-1.
export function ringRadii(radius, rings) {
  const out = [];
  for (let i = 0; i < rings; i++) out.push((radius / rings) * (i + 1));
  return out;
}

// ST-328 (I359): full ring layout = main rings + hub rings + one rim ring.
// The main rings keep the ST-293 rest-band falloff (restFalloff); hub rings
// (config hubRings, fractions of radius) render at hubF (default 1 = full bright
// anchor); the rim ring (config rimRing) renders at rimF (default 0.5, moderate).
// Pure: the render layer (arenaFloor.js) maps each entry to one colored ring loop.
// kind is a label for tests/probes only (the render does not read it).
export function totalRingCount(grid) {
  const hub = grid.hubRings ? grid.hubRings.length : 0;
  const rim = grid.rimRing != null ? 1 : 0;
  return grid.rings + hub + rim;
}

export function fullRingLayout(radius, grid) {
  const out = [];
  const main = ringRadii(radius, grid.rings);
  for (let i = 0; i < main.length; i++) {
    const r = main[i];
    out.push({ r, f: restFalloff(r / radius, grid.restT, grid.restHold, grid.restPowA, grid.restPowB), kind: "main" });
  }
  const hub = grid.hubRings || [];
  const hubF = grid.hubF != null ? grid.hubF : 1;
  for (let i = 0; i < hub.length; i++) out.push({ r: radius * hub[i], f: hubF, kind: "hub" });
  if (grid.rimRing != null) out.push({ r: radius * grid.rimRing, f: grid.rimF != null ? grid.rimF : 0.5, kind: "rim" });
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
