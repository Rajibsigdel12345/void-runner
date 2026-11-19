// I521 intent-diff: seed 32800, ticks 0-400, V0 (i328 scan) vs V3 (i521 scan).
// Log per tick: thrust, aimPoint, firing, rock-count, list-sizes, first divergent tick.
import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";

const DT = 1 / 60;
function pushThreats328(w, arr) {
  arr.length = 0;
  for (const r of w.field.rocks) arr.push({ x: r.pos.x, y: r.pos.y, r: r.radius });
  for (const d of w.drones.drones) if (!d.dead) arr.push({ x: d.pos.x, y: d.pos.y, r: d.radius });
  for (const s of w.stingers.stingers) if (!s.dead) arr.push({ x: s.pos.x, y: s.pos.y, r: s.radius });
  for (const f of w.flyers.flyers) if (!f.dead) arr.push({ x: f.pos.x, y: f.pos.y, r: f.radius });
  if (w.boss) arr.push({ x: w.boss.pos.x, y: w.boss.pos.y, r: w.boss.radius });
}
const scratch = [];
function pushThreats521(w, arr) {
  arr.length = 0;
  const push = (e, g) => arr.push({ x: e.pos.x, y: e.pos.y, r: e.radius, wgt: g });
  for (const e of w.field.rocks) push(e, 1);
  for (const e of w.drones.drones) if (!e.dead) push(e, 1.2);
  for (const e of w.stingers.stingers) if (!e.dead) push(e, 1.5);
  for (const e of w.flyers.flyers) if (!e.dead) push(e, 1.5);
  for (const e of w.hunters.hunters) if (!e.dead) push(e, 1.5);
  for (const e of w.gunships.gunships) if (!e.dead) push(e, 2);
  for (const e of w.sentries.sentries) if (!e.dead) push(e, 1.5);
  for (const e of w.wasps.wasps) if (!e.dead) push(e, 1.5);
  for (const e of w.pods.pods) if (!e.dead) push(e, 1.2);
  for (const e of w.mines.mines) push(e, 1);
  for (const e of w.phantoms.phantoms) if (!e.dead) push(e, 1.5);
  for (const e of w.haulers.haulers) if (!e.dead) push(e, 2);
  for (const e of w.bulwarks.bulwarks) if (!e.dead) push(e, 2);
  if (w.boss && w.boss.alive) push(w.boss, 3);
}
function nearest328(w) {
  const ship = w.ship.pos; let best = null;
  const cand = (x, y, r) => { const d = Math.hypot(ship.x - x, ship.y - y); const key = d - r; if (best === null || key < best.key) best = { x, y, r, d, key }; };
  for (const rk of w.field.rocks) cand(rk.pos.x, rk.pos.y, rk.radius);
  for (const dr of w.drones.drones) if (!dr.dead) cand(dr.pos.x, dr.pos.y, dr.radius);
  for (const st of w.stingers.stingers) if (!st.dead) cand(st.pos.x, st.pos.y, st.radius);
  for (const fl of w.flyers.flyers) if (!fl.dead) cand(fl.pos.x, fl.pos.y, fl.radius);
  if (w.boss) cand(w.boss.pos.x, w.boss.pos.y, w.boss.radius);
  return best;
}
function nearest521(w) {
  pushThreats521(w, scratch);
  const ship = w.ship.pos; let best = null;
  for (const t of scratch) { const d = Math.hypot(ship.x - t.x, ship.y - t.y); const key = d - t.r; if (best === null || key < best.key) best = { x: t.x, y: t.y, r: t.r, d }; }
  return best;
}
function makeKiter(nearest) {
  return (w, t, threats) => {
    const ship = w.ship.pos;
    const intent = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
    const tgt = nearest(w);
    if (!tgt) { intent.thrust = { x: -ship.x / 26, y: -ship.y / 26 }; intent.firing = t % 30 === 0; return intent; }
    const dx = ship.x - tgt.x, dy = ship.y - tgt.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const weave = Math.sin(t / 90) * 4;
    const desX = tgt.x + ux * 12 - uy * weave;
    const desY = tgt.y + uy * 12 + ux * weave;
    intent.aimPoint = { x: tgt.x, y: tgt.y };
    intent.firing = tgt.d < 18;
    let tx = desX - ship.x, ty = desY - ship.y;
    for (const th of threats) {
      const ox = ship.x - th.x, oy = ship.y - th.y;
      const od = Math.hypot(ox, oy);
      const zone = th.r + 3.5;
      if (od < zone && od > 1e-6) { const f = ((zone - od) / zone) * 2; tx += (ox / od) * f; ty += (oy / od) * f; }
    }
    const len = Math.hypot(tx, ty) || 1;
    const cl = Math.min(1, len / 4);
    intent.thrust = { x: (tx / len) * cl, y: (ty / len) * cl };
    return intent;
  };
}
function run(seed, scan) {
  const push = scan === "i521" ? pushThreats521 : pushThreats328;
  const pilot = makeKiter(scan === "i521" ? nearest521 : nearest328);
  const w = new World(new RNG(seed));
  w.begin();
  const threats = [];
  const log = [];
  for (let t = 0; t < 400; t++) {
    push(w, threats);
    const intent = pilot(w, t, threats);
    w.step(DT, intent);
    for (const ev of w.drainEvents()) {}
    if (t < 40 || t % 50 === 0) {
      log.push({ t, tx: +intent.thrust.x.toFixed(9), ty: +intent.thrust.y.toFixed(9), fire: intent.firing,
        aim: intent.aimPoint ? [ +intent.aimPoint.x.toFixed(6), +intent.aimPoint.y.toFixed(6) ] : null,
        rocks: w.field.rocks.length,
        sizes: [w.drones.drones.length, w.stingers.stingers.length, w.flyers.flyers.length, w.hunters.hunters.length,
                w.gunships.gunships.length, w.sentries.sentries.length, w.wasps.wasps.length, w.pods.pods.length,
                w.mines.mines.length, w.phantoms.phantoms.length, w.haulers.haulers.length, w.bulwarks.bulwarks.length, w.boss ? 1 : 0],
        ship: [ +w.ship.pos.x.toFixed(6), +w.ship.pos.y.toFixed(6) ] });
    }
    if (w.gameOver) break;
  }
  return log;
}
const A = run(32800, "i328");
const B = run(32800, "i521");
const n = Math.max(A.length, B.length);
let firstDiff = -1;
for (let i = 0; i < n; i++) {
  const a = A[i] || {}, b = B[i] || {};
  if (JSON.stringify(a) !== JSON.stringify(b)) { firstDiff = i; break; }
}
console.log("entries A=" + A.length + " B=" + B.length + " firstDiffEntry=" + firstDiff);
if (firstDiff >= 0) {
  for (let i = Math.max(0, firstDiff - 2); i < Math.min(n, firstDiff + 3); i++) {
    console.log("A[" + i + "] " + JSON.stringify(A[i]));
    console.log("B[" + i + "] " + JSON.stringify(B[i]));
  }
} else {
  console.log("A[0] " + JSON.stringify(A[0]));
  console.log("B[0] " + JSON.stringify(B[0]));
  console.log("A[3] " + JSON.stringify(A[3]));
  console.log("B[3] " + JSON.stringify(B[3]));
  console.log("A[39] " + JSON.stringify(A[39]));
  console.log("B[39] " + JSON.stringify(B[39]));
}
