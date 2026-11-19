// I521 root-cause probe: I328 VERBATIM protocol (kiter, I328 threat scan,
// 120 s cap) run against CURRENT code. Two arms: director default (on) and
// director.enabled=false. 20 seeds = 32800..32819 (the recorded I328 window).
import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";
import { SkillModel } from "../../src/core/skillModel.js";
import { CONFIG } from "../../src/core/config.js";

const DT = 1 / 60;
const CAP = 7200;
const WEIGHTS = { rock: 1, drone: 1.2, stinger: 1.5, flyer: 1.5, boss: 2 };

function pushThreats(w, arr) {
  arr.length = 0;
  for (const r of w.field.rocks) arr.push({ x: r.pos.x, y: r.pos.y, r: r.radius, w: WEIGHTS.rock });
  for (const d of w.drones.drones) if (!d.dead) arr.push({ x: d.pos.x, y: d.pos.y, r: d.radius, w: WEIGHTS.drone });
  for (const s of w.stingers.stingers) if (!s.dead) arr.push({ x: s.pos.x, y: s.pos.y, r: s.radius, w: WEIGHTS.stinger });
  for (const f of w.flyers.flyers) if (!f.dead) arr.push({ x: f.pos.x, y: f.pos.y, r: f.radius, w: WEIGHTS.flyer });
  if (w.boss) arr.push({ x: w.boss.pos.x, y: w.boss.pos.y, r: w.boss.radius, w: WEIGHTS.boss });
}
function nearest(w) {
  const ship = w.ship.pos;
  let best = null;
  const cand = (x, y, r) => {
    const d = Math.hypot(ship.x - x, ship.y - y);
    const key = d - r;
    if (best === null || key < best.key) best = { x, y, r, d, key };
  };
  for (const rk of w.field.rocks) cand(rk.pos.x, rk.pos.y, rk.radius);
  for (const dr of w.drones.drones) if (!dr.dead) cand(dr.pos.x, dr.pos.y, dr.radius);
  for (const st of w.stingers.stingers) if (!st.dead) cand(st.pos.x, st.pos.y, st.radius);
  for (const fl of w.flyers.flyers) if (!fl.dead) cand(fl.pos.x, fl.pos.y, fl.radius);
  if (w.boss) cand(w.boss.pos.x, w.boss.pos.y, w.boss.radius);
  return best;
}
const kiter = (w, t, threats) => {
  const ship = w.ship.pos;
  const intent = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
  const tgt = nearest(w);
  if (!tgt) {
    intent.thrust = { x: -ship.x / 26, y: -ship.y / 26 };
    intent.firing = t % 30 === 0;
    return intent;
  }
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
    if (od < zone && od > 1e-6) {
      const f = ((zone - od) / zone) * 2;
      tx += (ox / od) * f;
      ty += (oy / od) * f;
    }
  }
  const len = Math.hypot(tx, ty) || 1;
  const cl = Math.min(1, len / 4);
  intent.thrust = { x: (tx / len) * cl, y: (ty / len) * cl };
  return intent;
};

function runOne(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  const model = new SkillModel(CONFIG.skill, DT);
  const threats = [];
  let waveReached = 0, firstHitTick = -1, hits = 0;
  let steps = CAP;
  for (let t = 0; t < CAP; t++) {
    pushThreats(w, threats);
    w.step(DT, kiter(w, t, threats));
    const pBefore = model.performance;
    for (const ev of w.drainEvents()) {
      model.onEvent(ev.type, ev.data);
      if (ev.type === "hit") { hits += 1; if (firstHitTick < 0) firstHitTick = t; }
      else if (ev.type === "wave") { const n = ev.data.n | 0; if (n > waveReached) waveReached = n; }
    }
    model.sample(w.ship.pos, threats);
    if (w.gameOver) { steps = t + 1; break; }
  }
  return { seed, wave: waveReached, steps, hits, firstHitTick, lethal: w.gameOver ? 1 : 0 };
}

function arm(label, nOff) {
  if (nOff) CONFIG.director.enabled = false; else CONFIG.director.enabled = true;
  const runs = [];
  for (let i = 0; i < 20; i++) runs.push(runOne(32800 + i));
  const mw = runs.reduce((a, r) => a + r.wave, 0) / 20;
  const dead = runs.filter(r => r.lethal).length;
  console.log("=== ARM " + label + ": meanWave " + mw.toFixed(2) + " deaths " + dead + "/20 ===");
  for (const r of runs) console.log("seed " + r.seed + " wave " + r.wave + " steps " + r.steps + " hits " + r.hits + " firstHitTick " + r.firstHitTick);
  CONFIG.director.enabled = true;
}
const t0 = Date.now();
arm("director-ON (default)");
arm("director-OFF (enabled=false)");
console.log("elapsed " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
