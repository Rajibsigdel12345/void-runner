// ST-454 (E64, I487): the race line - smooth bounded 3D flight path (curves + bank + elevation).
// Pure core: no three, no DOM, no RNG. Deterministic trochoid in the arena plane (world X-Z)
// + sinusoidal elevation (world +Y). C-infinity continuous (all terms are sinusoids of d).
// Extent bounded by (a1+a2) << arena.radius (26). Coordinate convention: ship (x,y) -> world
// (x, 0, y); world +Y up = elevation. Out param is written in place (no per-frame alloc).
import { CONFIG } from './config.js';
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export function pathPoint(d, cfg = CONFIG.flightPath, out = {}) {
  const dd = isFinite(Number(d)) ? Number(d) : 0;
  const t1 = cfg.f1*dd + cfg.p1, t2 = cfg.f2*dd + cfg.p2;
  const c1=Math.cos(t1), s1=Math.sin(t1), c2=Math.cos(t2), s2=Math.sin(t2);
  out.x = cfg.a1*c1 + cfg.a2*c2;
  out.y = cfg.a1*s1 - cfg.a2*s2;
  out.elev = cfg.elevBase + cfg.elevAmp*Math.sin(cfg.elevFreq*dd + cfg.elevPhase);
  const dx = -cfg.a1*cfg.f1*s1 - cfg.a2*cfg.f2*s2;
  const dy =  cfg.a1*cfg.f1*c1 - cfg.a2*cfg.f2*c2;
  const vl = Math.hypot(dx, dy);
  const inv = 1/(vl > cfg.tangentFloor ? vl : cfg.tangentFloor);
  out.tx = dx*inv; out.ty = dy*inv;
  const ddx = -cfg.a1*cfg.f1*cfg.f1*c1 - cfg.a2*cfg.f2*cfg.f2*c2;
  const ddy = -cfg.a1*cfg.f1*cfg.f1*s1 + cfg.a2*cfg.f2*cfg.f2*c2;
  const v2 = dx*dx + dy*dy;
  out.curv = v2 > 1e-9 ? (dx*ddy - dy*ddx)/v2 : 0;
  out.bankRaw = clamp(out.curv*cfg.turnScale, -1, 1);
  return out;
}
