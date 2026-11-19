// I521 / ST-487 balance harness (node-only, deterministic; no DOM, no three).
// Pre-registered rules: .evidence/I521/rules.md (written BEFORE first run).
//
// Protocol (frozen in rules.md):
//   isolated: fresh World(new RNG(seed)) -> begin() -> waves.state="idle"
//     (director step() early-returns; zero spawns) + waves.wave=12 (weapon L3
//     debut context: all 3 types debut wave >= 13 where pilots hold L3)
//     -> spawn target(s) -> 60 Hz pilot loop to resolve / gameover / 90 s cap.
//   sweep: fresh World, full director, kiter pilot, to wave-20 clear / gameover
//     / 600 s cap. Per-wave hits + non-boss wave-clear times + kill tally.
// Pilots: the I328 frozen trio (kiter / aggro / cautious), VERBATIM from
// .evidence/I328/baseline328.mjs, with the threat scan extended to
// phantom/hauler/bulwark + mines (avoid-only). Stateless, RNG-free.
//
// Output: .evidence/I521/results521.json + stdout rule verdicts R1-R8.

import { writeFileSync } from "node:fs";
import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";

const DT = 1 / 60;
const ISOL_CAP = 5400; // 90 s
const SWEEP_CAP = 36000; // 600 s
const BOSS_WAVES = new Set([5, 10, 15, 20]);

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

const PILOTS = {
  // I328 frozen kiter (VERBATIM from .evidence/I328/baseline328.mjs): 12 u
  // standoff off the nearest threat, weave, fire within 18 u.
  kiter: (w, t, threats) => {
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
        const f = ((zone - od) / zone) * 2; // x2 repulsion
        tx += (ox / od) * f;
        ty += (oy / od) * f;
      }
    }
    const len = Math.hypot(tx, ty) || 1;
    const cl = Math.min(1, len / 4);
    intent.thrust = { x: (tx / len) * cl, y: (ty / len) * cl };
    return intent;
  },
  // I328 frozen aggro (VERBATIM): dive at the nearest threat, always firing.
  aggro: (w, t, threats) => {
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
        const f = (zone - od) / zone; // x1 repulsion
        tx += (ox / od) * f;
        ty += (oy / od) * f;
      }
    }
    const len = Math.hypot(tx, ty) || 1;
    const cl = Math.min(1, len / 4);
    intent.thrust = { x: (tx / len) * cl, y: (ty / len) * cl };
    return intent;
  },
  // I328 frozen cautious (VERBATIM): 20 u standoff, center bias x0.5,
  // fire within 15 u, wide x2.5 repulsion.
  cautious: (w, t, threats) => {
    const ship = w.ship.pos;
    const intent = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
    const tgt = nearest(w);
    if (!tgt) {
      intent.thrust = { x: -ship.x / 52, y: -ship.y / 52 }; // 0.5x center drift
      intent.firing = t % 60 === 0;
      return intent;
    }
    const dx = ship.x - tgt.x, dy = ship.y - tgt.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    let desX = ship.x + ux * 20;
    let desY = ship.y + uy * 20;
    desX *= 0.5; // center bias
    desY *= 0.5;
    intent.aimPoint = { x: tgt.x, y: tgt.y };
    intent.firing = tgt.d < 15;
    let tx = desX - ship.x, ty = desY - ship.y;
    for (const th of threats) {
      const ox = ship.x - th.x, oy = ship.y - th.y;
      const od = Math.hypot(ox, oy);
      const zone = th.r + 6;
      if (od < zone && od > 1e-6) {
        const f = ((zone - od) / zone) * 2.5; // x2.5 repulsion
        tx += (ox / od) * f;
        ty += (oy / od) * f;
      }
    }
    const len = Math.hypot(tx, ty) || 1;
    const cl = Math.min(1, len / 4);
    intent.thrust = { x: (tx / len) * cl, y: (ty / len) * cl };
    return intent;
  },
};

const CONDS = ["phantom1", "phantom2", "hauler1", "bulwark1"];
const COND_TYPE = { phantom1: "phantom", phantom2: "phantom", hauler1: "hauler", bulwark1: "bulwark" };

function makeWorld(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  w.waves.state = "idle"; // isolated: director never spawns
  w.waves.wave = 12; // weapon L3 debut context (minWave 10 -> level 3)
  return w;
}

function runIsolated(cond, pilotName, seed) {
  const type = COND_TYPE[cond];
  const w = makeWorld(seed);
  let total = 0;
  if (cond === "phantom1" || cond === "phantom2") {
    const n = cond === "phantom1" ? 1 : 2;
    for (let i = 0; i < n; i++) if (w.phantoms.spawn(w.ship.pos)) total++;
  } else if (cond === "hauler1") {
    if (w.haulers.spawn(w.ship.pos, w.ship.aim)) total++;
  } else if (cond === "bulwark1") {
    if (w.bulwarks.spawn(w.ship.pos)) total++;
  }
  const threats = [];
  const r = { seed, cond, pilot: pilotName, total, kills: 0, expired: 0, hits: 0,
              negates: 0, stuns: 0, dead: false, ttk: null, ticks: 0 };
  const deathEv = type + "Death";
  for (let t = 0; t < ISOL_CAP; t++) {
    const intent = PILOTS[pilotName](w, t, threats);
    w.step(DT, intent);
    pushThreats(w, threats);
    for (const ev of w.drainEvents()) {
      if (ev.type === "kill" && ev.data.size === type) {
        r.kills++;
        if (r.kills + r.expired === total) r.ttk = (t + 1) * DT;
      } else if (ev.type === deathEv && ev.data.self) {
        r.expired++;
      } else if (ev.type === "hit") r.hits++;
      else if (ev.type === "bulwarkNegate") r.negates++;
      else if (ev.type === "bulwarkStun") r.stuns++;
    }
    r.ticks = t + 1;
    if (w.gameOver) { r.dead = true; break; }
    if (r.kills + r.expired === total) break; // resolved (TTK set only if last event was a kill)
  }
  return r;
}

function runSweep(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  const threats = [];
  let wave = 0, waveStartTick = 0;
  const clearTime = {}; // wave -> seconds (first clear per wave)
  const hitsByWave = {};
  const killsByType = {};
  const bossClear = {};
  const r = { seed, waveReached: 0, deaths: 0, clearTime, hitsByWave, killsByType,
              wave20: false, gameOver: false, ticks: 0, bossClear };
  const stopAfter20 = { at: null };
  for (let t = 0; t < SWEEP_CAP; t++) {
    const intent = PILOTS.kiter(w, t, threats);
    w.step(DT, intent);
    pushThreats(w, threats);
    for (const ev of w.drainEvents()) {
      if (ev.type === "wave") {
        wave = ev.data.n;
        waveStartTick = t + 1;
        r.waveReached = Math.max(r.waveReached, wave);
      } else if (ev.type === "waveCleared" && !(ev.data.n in clearTime)) {
        clearTime[ev.data.n] = ((t + 1) - waveStartTick) * DT;
        if (ev.data.n === 20) { r.wave20 = true; stopAfter20.at = t; }
      } else if (ev.type === "hit") {
        r.deaths++;
        hitsByWave[wave] = (hitsByWave[wave] || 0) + 1;
      } else if (ev.type === "kill") {
        const k = ev.data.size;
        killsByType[k] = (killsByType[k] || 0) + 1;
      } else if (ev.type === "bossDeath") {
        if (BOSS_WAVES.has(wave)) bossClear[wave] = ((t + 1) - waveStartTick) * DT;
      }
    }
    r.ticks = t + 1;
    if (w.gameOver) { r.gameOver = true; break; }
    if (stopAfter20.at !== null && t - stopAfter20.at > 600) break; // 10 s grace
  }
  return r;
}

function median(a) {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function p90(a) {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)];
}

const runs = [];
for (let i = 0; i < 100; i++) {
  runs.push(runIsolated("phantom1", "kiter", 52100 + (["phantom1", "phantom2", "hauler1", "bulwark1"].indexOf("phantom1") + 1) * 10000 + i));
}
console.log("V6:", runs.map(r => r.ttk === null ? "x" : (r.ttk * 60).toFixed(0)).join(" "));
