// I521 2x2 harness-bug test: loop order x seed family.
// Arm B: I328 order (pushThreats -> step(pilot)) + seeds 52700-52709
// Arm C: I521 order (step(pilot) -> pushThreats)  + seeds 32800-32809
// (Arm A = the recorded I521 sweep result: I521 order + 52700 seeds -> 10/10 dead waves 1-2)
import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";

const DT = 1 / 60;
const SWEEP_CAP = 36000;
const scratch = [];
function pushThreats(w, arr) {
  arr.length = 0;
  const push = (e, wgt) => arr.push({ x: e.pos.x, y: e.pos.y, r: e.radius, wgt });
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
function nearest(w) {
  pushThreats(w, scratch);
  const ship = w.ship.pos;
  let best = null;
  for (const t of scratch) {
    const d = Math.hypot(ship.x - t.x, ship.y - t.y);
    const key = d - t.r;
    if (best === null || key < best.key) best = { x: t.x, y: t.y, r: t.r, d };
  }
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
function runSweep(seed, i328Order) {
  const w = new World(new RNG(seed));
  w.begin();
  const threats = [];
  let wave = 0, firstHitTick = -1;
  let deaths = 0, waveReached = 0;
  const r = { seed, waveReached: 0, deaths: 0, gameOver: false, firstHitTick: -1 };
  for (let t = 0; t < SWEEP_CAP; t++) {
    if (i328Order) {
      pushThreats(w, threats);
      w.step(DT, kiter(w, t, threats));
    } else {
      const intent = kiter(w, t, threats);
      w.step(DT, intent);
      pushThreats(w, threats);
    }
    for (const ev of w.drainEvents()) {
      if (ev.type === "wave") { wave = ev.data.n; waveReached = Math.max(waveReached, wave); }
      else if (ev.type === "hit") { deaths++; if (firstHitTick < 0) firstHitTick = t; }
    }
    if (w.gameOver) { r.gameOver = true; break; }
  }
  r.deaths = deaths; r.waveReached = waveReached; r.firstHitTick = firstHitTick;
  return r;
}
function arm(label, i328Order, seedBase) {
  const t0 = Date.now();
  const runs = [];
  for (let i = 0; i < 10; i++) runs.push(runSweep(seedBase + i, i328Order));
  const mw = runs.reduce((a, r) => a + r.waveReached, 0) / 10;
  const dead = runs.filter(r => r.gameOver).length;
  console.log("=== " + label + ": meanWave " + mw.toFixed(2) + " gameOver " + dead + "/10 ===");
  for (const r of runs) console.log("seed " + r.seed + " wave " + r.waveReached + " deaths " + r.deaths + " firstHitTick " + r.firstHitTick + (r.gameOver ? " [DEAD]" : ""));
  console.log(("    arm done in " + ((Date.now() - t0) / 1000).toFixed(1) + " s").padStart(0));
}
arm("ARM B: I328 order + seeds 52700s", true, 52700);
arm("ARM C: I521 order + seeds 32800s", false, 32800);
