// I521 param scan (EXPLORATION ONLY - not the tuning pass). Mirrors
// balance521.mjs isolated phantom1 protocol verbatim (fixed nearest, seed
// family 53100..53199) so numbers are directly comparable to results521.json.
import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";
import { CONFIG } from "../../src/core/config.js";

const DT = 1 / 60;
const ISOL_CAP = 5400;
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
  const arr = scratch;
  pushThreats(w, arr);
  const ship = w.ship.pos;
  let best = null;
  for (const t of arr) {
    const d = Math.hypot(ship.x - t.x, ship.y - t.y);
    const key = d - t.r;
    if (best === null || key < best.key) best = { x: t.x, y: t.y, r: t.r, d, key };
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

const aggro = (w, t, threats) => {
  const ship = w.ship.pos;
  const intent = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: true };
  const tgt = nearest(w);
  if (!tgt) {
    intent.thrust = { x: -ship.x / 26, y: -ship.y / 26 };
    return intent;
  }
  intent.aimPoint = { x: tgt.x, y: tgt.y };
  let tx = tgt.x - ship.x, ty = tgt.y - ship.y;
  for (const th of threats) {
    const ox = ship.x - th.x, oy = ship.y - th.y;
    const od = Math.hypot(ox, oy);
    const zone = th.r + 1.5;
    if (od < zone && od > 1e-6) {
      const f = (zone - od) / zone;
      tx += (ox / od) * f;
      ty += (oy / od) * f;
    }
  }
  const len = Math.hypot(tx, ty) || 1;
  const cl = Math.min(1, len / 4);
  intent.thrust = { x: (tx / len) * cl, y: (ty / len) * cl };
  return intent;
};

const PILOTS = { kiter, aggro };

function runIsolated(pilotName, seed) {
  const w = new World(new RNG(seed));
  w.begin();
  w.waves.state = "idle";
  w.waves.wave = 12;
  let total = 0;
  if (w.phantoms.spawn(w.ship.pos)) total++;
  const threats = [];
  const r = { seed, total, kills: 0, expired: 0, hits: 0, ttk: null, dead: false };
  const deathEv = "phantomDeath";
  for (let t = 0; t < ISOL_CAP; t++) {
    const intent = PILOTS[pilotName](w, t, threats);
    w.step(DT, intent);
    pushThreats(w, threats);
    for (const ev of w.drainEvents()) {
      if (ev.type === "kill" && ev.data.size === "phantom") {
        r.kills++;
        if (r.kills + r.expired === total) r.ttk = (t + 1) * DT;
      } else if (ev.type === deathEv && ev.data.self) r.expired++;
      else if (ev.type === "hit") r.hits++;
    }
    if (w.gameOver) { r.dead = true; break; }
    if (r.kills + r.expired === total) break;
  }
  return r;
}

function median(a) {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const base = { orbitR: CONFIG.phantom.orbitR, targetOpacity: CONFIG.phantom.targetOpacity };
console.log("baseline config: orbitR=" + base.orbitR + " targetOpacity=" + base.targetOpacity);
const rows = [];
const t0 = Date.now();

// Phase 1: orbitR scan (targetOpacity at baseline 0.5)
for (const orbitR of [11, 12, 13, 14, 15]) {
  CONFIG.phantom.orbitR = orbitR;
  for (const pilot of ["kiter", "aggro"]) {
    const runs = [];
    for (let i = 0; i < 100; i++) runs.push(runIsolated(pilot, 53100 + i));
    const ttks = runs.filter(x => x.ttk !== null).map(x => x.ttk);
    rows.push({ orbitR, targetOpacity: base.targetOpacity, pilot,
      medianTTK: median(ttks), killRate: ttks.length / 100,
      hitRate: runs.filter(x => x.hits > 0).length / 100,
      expiryRate: runs.filter(x => x.expired > 0).length / 100,
      deadRuns: runs.filter(x => x.dead).length });
  }
  console.log("orbitR=" + orbitR + " done (" + (Date.now() - t0) + " ms)");
}
CONFIG.phantom.orbitR = base.orbitR;

// Phase 2: targetOpacity scan (orbitR at baseline 11)
for (const targetOpacity of [0.5, 0.55, 0.6, 0.65, 0.7]) {
  CONFIG.phantom.targetOpacity = targetOpacity;
  for (const pilot of ["kiter", "aggro"]) {
    const runs = [];
    for (let i = 0; i < 100; i++) runs.push(runIsolated(pilot, 53100 + i));
    const ttks = runs.filter(x => x.ttk !== null).map(x => x.ttk);
    rows.push({ orbitR: base.orbitR, targetOpacity, pilot,
      medianTTK: median(ttks), killRate: ttks.length / 100,
      hitRate: runs.filter(x => x.hits > 0).length / 100,
      expiryRate: runs.filter(x => x.expired > 0).length / 100,
      deadRuns: runs.filter(x => x.dead).length });
  }
  console.log("targetOpacity=" + targetOpacity + " done (" + (Date.now() - t0) + " ms)");
}

CONFIG.phantom.orbitR = base.orbitR;
CONFIG.phantom.targetOpacity = base.targetOpacity;

console.log("\n=== SCAN (kiter / aggro medians) ===");
for (const row of rows) {
  console.log("orbitR=" + row.orbitR + " op=" + row.targetOpacity +
    " kiter=" + (row.pilot === "kiter" ? row.medianTTK : "-") +
    " aggro=" + (row.pilot === "aggro" ? row.medianTTK : "-"));
}
console.log("total ms:", Date.now() - t0);
