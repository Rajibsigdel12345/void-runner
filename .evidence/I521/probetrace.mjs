// I521 RNG-stream trace: seed 32800, 160 ticks, i328 vs i521 scan arms.
// Wraps w.rng.next to log every draw; diffs the sequences; logs rock positions at t=150.
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
function run(seed, scan, ticks) {
  const push = scan === "i521" ? pushThreats521 : pushThreats328;
  const pilot = makeKiter(scan === "i521" ? nearest521 : nearest328);
  const w = new World(new RNG(seed));
  const draws = [];
  const origNext = w.rng.next;
  w.rng.next = function () { const v = origNext.call(this); draws.push(v); return v; };
  w.begin();
  const threats = [];
  const perTickDraws = [];
  let rocksAt150 = null;
  for (let t = 0; t < ticks; t++) {
    const before = draws.length;
    push(w, threats);
    const intent = pilot(w, t, threats);
    w.step(DT, intent);
    for (const ev of w.drainEvents()) {}
    perTickDraws.push(draws.length - before);
    if (t === 150) rocksAt150 = w.field.rocks.map(r => [+r.pos.x.toFixed(4), +r.pos.y.toFixed(4), +r.vel.x.toFixed(4), +r.vel.y.toFixed(4), r.radius]);
    if (w.gameOver) break;
  }
  return { draws, perTickDraws, rocksAt150 };
}
const A = run(32800, "i328", 160);
const B = run(32800, "i521", 160);
console.log("draw counts: A=" + A.draws.length + " B=" + B.draws.length);
let firstDiff = -1;
const n = Math.min(A.draws.length, B.draws.length);
for (let i = 0; i < n; i++) if (A.draws[i] !== B.draws[i]) { firstDiff = i; break; }
console.log("first draw-value diff at index: " + firstDiff);
if (firstDiff >= 0) {
  // which tick did that draw happen in, for each arm?
  const tickOf = (perTick, idx) => { let s = 0; for (let t = 0; t < perTick.length; t++) { if (idx < s + perTick[t]) return t; s += perTick[t]; } return perTick.length; };
  console.log("A: draw index " + firstDiff + " in tick " + tickOf(A.perTickDraws, firstDiff));
  console.log("B: draw index " + firstDiff + " in tick " + tickOf(B.perTickDraws, firstDiff));
  const tA = tickOf(A.perTickDraws, firstDiff), tB = tickOf(B.perTickDraws, firstDiff);
  console.log("A perTickDraws around: " + JSON.stringify(A.perTickDraws.slice(Math.max(0, tA - 3), tA + 4)));
  console.log("B perTickDraws around: " + JSON.stringify(B.perTickDraws.slice(Math.max(0, tB - 3), tB + 4)));
}
console.log("A perTickDraws 95..160: " + JSON.stringify(A.perTickDraws.slice(95)));
console.log("B perTickDraws 95..160: " + JSON.stringify(B.perTickDraws.slice(95)));
console.log("A rocks@150: " + JSON.stringify(A.rocksAt150));
console.log("B rocks@150: " + JSON.stringify(B.rocksAt150));
