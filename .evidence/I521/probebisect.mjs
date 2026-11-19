// I521 bisection: which delta kills the kiter? (seeds 32800-32819, 120 s cap)
// V0 = probe328 as-is (I328 order + I328 scan + SkillModel)  [control: survives]
// V1 = V0 - SkillModel
// V2 = V0 + I521 loop order (pilot BEFORE pushThreats)
// V3 = V0 + I521 extended threat scan/nearest
import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";
import { SkillModel } from "../../src/core/skillModel.js";
import { CONFIG } from "../../src/core/config.js";

const DT = 1 / 60, CAP = 7200;
const W328 = { rock: 1, drone: 1.2, stinger: 1.5, flyer: 1.5, boss: 2 };
function pushThreats328(w, arr) {
  arr.length = 0;
  for (const r of w.field.rocks) arr.push({ x: r.pos.x, y: r.pos.y, r: r.radius, w: W328.rock });
  for (const d of w.drones.drones) if (!d.dead) arr.push({ x: d.pos.x, y: d.pos.y, r: d.radius, w: W328.drone });
  for (const s of w.stingers.stingers) if (!s.dead) arr.push({ x: s.pos.x, y: s.pos.y, r: s.radius, w: W328.stinger });
  for (const f of w.flyers.flyers) if (!f.dead) arr.push({ x: f.pos.x, y: f.pos.y, r: f.radius, w: W328.flyer });
  if (w.boss) arr.push({ x: w.boss.pos.x, y: w.boss.pos.y, r: w.boss.radius, w: W328.boss });
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
function runOne(seed, o) {
  const push = o.scan === "i521" ? pushThreats521 : pushThreats328;
  const pilot = makeKiter(o.scan === "i521" ? nearest521 : nearest328);
  const w = new World(new RNG(seed));
  w.begin();
  const model = o.model ? new SkillModel(CONFIG.skill, DT) : null;
  const threats = [];
  let waveReached = 0, hits = 0, firstHitTick = -1, steps = CAP;
  for (let t = 0; t < CAP; t++) {
    if (o.order === "i328") { push(w, threats); w.step(DT, pilot(w, t, threats)); }
    else { const intent = pilot(w, t, threats); w.step(DT, intent); push(w, threats); }
    if (model) {
      const pBefore = model.performance;
      for (const ev of w.drainEvents()) {
        model.onEvent(ev.type, ev.data);
        if (ev.type === "hit") { hits++; if (firstHitTick < 0) firstHitTick = t; }
        else if (ev.type === "wave") { const n = ev.data.n | 0; if (n > waveReached) waveReached = n; }
      }
      model.sample(w.ship.pos, threats);
    } else {
      for (const ev of w.drainEvents()) {
        if (ev.type === "hit") { hits++; if (firstHitTick < 0) firstHitTick = t; }
        else if (ev.type === "wave") { const n = ev.data.n | 0; if (n > waveReached) waveReached = n; }
      }
    }
    if (w.gameOver) { steps = t + 1; break; }
  }
  return { wave: waveReached, steps, hits, firstHitTick, dead: w.gameOver ? 1 : 0 };
}
function arm(label, o) {
  const t0 = Date.now();
  let mw = 0, dead = 0; const firsts = [];
  for (let i = 0; i < 20; i++) {
    const r = runOne(32800 + i, o);
    mw += r.wave; dead += r.dead; if (r.firstHitTick >= 0 && firsts.length < 4) firsts.push(r.firstHitTick);
  }
  console.log(label + " -> meanWave " + (mw / 20).toFixed(2) + " deaths " + dead + "/20 firstHits " + JSON.stringify(firsts) + " (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)");
}
arm("V0 i328-order i328-scan +model  ", { order: "i328", scan: "i328", model: true });
arm("V1 i328-order i328-scan -model  ", { order: "i328", scan: "i328", model: false });
arm("V2 i521-order i328-scan +model  ", { order: "i521", scan: "i328", model: true });
arm("V3 i328-order i521-scan +model  ", { order: "i328", scan: "i521", model: true });
