// I583 E82 (ST-550 APPLY round): post-lever VALIDATION of the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 (applied to src/core/config.js:300 this round - 1-char literal swap; Branch B fired at I582: B56 12/30 >= 12/30) through the SAME harness as sweep581.mjs (rules frozen in .evidence/I583/rules582.md) with fresh seeds 58200+i, 30 seeds, E82 FROZEN acceptance (a)-(d) (design/e82-monolith-wave5-wall-ii-research.md sec.6; (e) = the 5-harness gate EXACT, external). Pre-lever baselines: sweep577 B56 11/30, M56 7/30, M56' 11/30, median 9, reach>=13 6/30; sweep581 B56 12/30, M56 11/30, M56' 12/30, median 8, reach>=13 1/30. Deterministic. C1 on any (a)-(d) failure: git restore src/core/config.js + accept + P1/P2/P3 to E83+.
// 30 seeds 58200+i, FULL director from wave 1 (no isolation), kiter pilot
// (I328 frozen, VERBATIM as carried in .evidence/I574/sweep573.mjs), cap 36000 ticks
// at DT = 1/60. All rules frozen in .evidence/I583/rules582.md (lineage of rules581.md, E82 labels).
import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";
import { writeFileSync } from "node:fs";

const DT = 1 / 60;
const CAP = 36000;
const SEEDS = Array.from({ length: 30 }, (_, i) => 58200 + i);
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
  for (const e of w.sweepers.sweepers) if (!e.dead) push(e, 1.5); // I564 (E75 w18+)
  for (const e of w.beacons.beacons) if (!e.dead) push(e, 2); // I564 (E75 w19+, physical only - no direct bolt)
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
        const f = ((zone - od) / zone) * 2;
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

const TIMED = ["rapid", "spread", "shield", "magnet", "overdrive", "slowmo"];
const BASE_SPEEDS = [7, 8, 9, 10, 15];
const BULLET_LIFE_TICKS = Math.round(4 / DT); // 240

function plannedContent(w, n) {
  const adj = w.waves.activeAdj;
  return adj ? Math.round(w.waves.contentFor(n) * adj.d) : w.waves.contentFor(n);
}
function snapAdj(w) {
  const a = w.waves.activeAdj;
  return a && a.wave ? { d: a.d, b: a.b, mod: a.mod, lull: a.lull, reason: a.reason } : null;
}

// --- bullet attribution (rules525.md sec.5) ---
function attributeBullet(w, st, evData, tick) {
  // st = { prevBullets: Map id->{px,py,vx,vy,r}, mulHist: [mul per tick 0-idx] }
  const live = new Map();
  for (const b of w.enemyBullets.bullets) live.set(b.id, b);
  const cands = [];
  for (const [id, b] of st.prevBullets) {
    if (live.has(id)) continue; // still alive
    const px = b.px + b.vx * DT, py = b.py + b.vy * DT;
    const d = Math.hypot(px - evData.pos.x, py - evData.pos.y);
    if (d < b.r + w.cfg.ship.radius + 0.25) cands.push({ d, b });
  }
  if (cands.length === 0) return { cls: "bullet_unknown", detail: { why: "no-missing-bullet-near-ship" } };
  cands.sort((a, b) => a.d - b.d);
  const b = cands[0].b;
  const v = Math.hypot(b.vx, b.vy);
  if (Math.abs(b.r - 0.22) > 1e-3) {
    return { cls: "gunship", detail: { v, r: b.r, why: "heavy-radius" } };
  }
  const lo = Math.max(0, tick - BULLET_LIFE_TICKS - 1); // ticks [t-240, t-1], 0-idx
  const recentMul = new Set(st.mulHist.slice(lo, tick));
  const matched = BASE_SPEEDS.filter(s =>
    Array.from(recentMul).some(m => Math.abs(v - s * m) <= 1e-3));
  const detail = { v, r: b.r, recentMul: Array.from(recentMul), matched, ambiguity: false };
  if (matched.length === 0) return { cls: "bullet_unknown", detail: { ...detail, why: "no-speed-match" } };
  const bossAlive = !!(w.boss && w.boss.alive);
  const sentryAlive = w.sentries.sentries.some(s => !s.dead);
  const bulwarkAlive = w.bulwarks.bulwarks.some(x => !x.dead);
  const phantomAlive = w.phantoms.phantoms.some(x => !x.dead);
  const sweeperAlive = w.sweepers.sweepers.some(x => !x.dead); // I564 (E75)
  const resolve = s => {
    if (s === 8) return sweeperAlive ? "sweeper" : "mine"; // I564: sweeper (w18+) also fires speed-8 fan bolts -> ambiguity toward the newer source (rules564.md sec.3)
    if (s === 7) return bossAlive ? "boss_" + w.boss.kind : "bullet_unknown";
    if (s === 9) return bossAlive ? "boss_" + w.boss.kind : (sentryAlive ? "sentry" : "bullet_unknown");
    if (s === 10) return bulwarkAlive ? "bulwark" : "bullet_unknown";
    if (s === 15) return phantomAlive ? "phantom" : "bullet_unknown";
    return "bullet_unknown";
  };
  if (matched.length === 1) return { cls: resolve(matched[0]), detail };
  // ambiguity: priority boss > sentry(9) > bulwark(10) > phantom(15) > mine(8)
  detail.ambiguity = true;
  const prio = [
    [bossAlive ? null : -1, null],
  ];
  void prio;
  if (bossAlive) return { cls: "boss_" + w.boss.kind, detail };
  if (matched.includes(9) && sentryAlive) return { cls: "sentry", detail };
  if (matched.includes(10) && bulwarkAlive) return { cls: "bulwark", detail };
  if (matched.includes(15) && phantomAlive) return { cls: "phantom", detail };
  if (matched.includes(8)) return { cls: "mine", detail };
  return { cls: "bullet_unknown", detail: { ...detail, why: "ambiguous-fallback" } };
}

function runSweep(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  const st = { prevBullets: new Map(), mulHist: [] };
  const r = {
    seed, died: false, deathTick: null, ticks: 0, totalHits: 0,
    waveTable: {}, bossDeaths: [], killingBlow: null, hitLog: [],
  };
  const threats = [];
  for (let t = 0; t < CAP; t++) {
    const tick = t + 1;
    const intent = PILOTS.kiter(w, t, threats);
    w.step(DT, intent);
    pushThreats(w, threats);
    for (const ev of w.drainEvents()) {
      if (ev.type === "wave") {
        r.waveTable[ev.data.n] = {
          startTick: tick, clearTick: null,
          planned: plannedContent(w, ev.data.n), adj: snapAdj(w),
          fieldCountAtStart: w.field.count,
        };
      } else if (ev.type === "waveCleared") {
        const wt = r.waveTable[ev.data.n];
        if (wt) wt.clearTick = tick;
      } else if (ev.type === "bossDeath") {
        r.bossDeaths.push({ kind: ev.data.kind, tick });
      } else if (ev.type === "hit") {
        r.totalHits++;
        const d = ev.data;
        if (d.source === "bullet") {
          const att = attributeBullet(w, st, d, tick);
          d.attributed = att.cls;
          d.attribDetail = att.detail;
        }
        r.hitLog.push({ tick, source: d.source, lives: d.lives, attributed: d.attributed || null });
        if (d.lives === 0 && !r.killingBlow) {
          // monolithProbable (rules525.md sec.6)
          let mp = false;
          if (d.source === "rock_M" || d.source === "rock_S") {
            const bossMonolithAlive = !!(w.boss && w.boss.alive && w.boss.kind === "monolith");
            const recent = r.bossDeaths.some(x => x.kind === "monolith" && x.tick > tick - 90 && x.tick <= tick);
            mp = bossMonolithAlive || recent;
          }
          let clsExact, clsPrimary;
          const BMAP = { boss_monolith: "MONOLITH", boss_splicer: "SPLICER" };
          if (d.source === "bullet") { clsExact = d.attributed; clsPrimary = BMAP[d.attributed] || d.attributed; }
          else if (d.source === "rock_M" || d.source === "rock_S") { clsExact = d.source; clsPrimary = mp ? "MONOLITH" : d.source; }
          else if (d.source === "boss_monolith") { clsExact = "MONOLITH"; clsPrimary = "MONOLITH"; }
          else if (d.source === "boss_splicer") { clsExact = "SPLICER"; clsPrimary = "SPLICER"; }
          else if (d.source === "warden") { clsExact = "WARDEN"; clsPrimary = "WARDEN"; }
          else if (d.source === "mine") { clsExact = "MINE"; clsPrimary = "MINE"; }
          else { clsExact = d.source; clsPrimary = d.source; }
          const boss = w.boss;
          r.killingBlow = {
            tick, source: d.source, clsExact, clsPrimary, monolithProbable: mp,
            attribDetail: d.attribDetail || null,
            wave: w.waves.wave,
            resources: {
              hitsTaken: r.totalHits,
              livesUsed: w.cfg.ship.lives - w.lives,
              weaponLevel: w._wlevel,
              shield: { hits: w.powerups.shieldHits, timeLeft: w.powerups.timeLeft.shield },
              activePowerups: TIMED.filter(x => w.powerups.timeLeft[x] > 0),
              bombs: null,
            },
            heavyweight: {
              boss: boss ? {
                kind: boss.kind, alive: boss.alive, hp: boss.hp, maxHp: boss.maxHp,
                phase: boss.phase, spawnWave: boss.spawnWave,
              } : null,
              warden: w.warden ? { alive: w.warden.alive, armor: w.warden.armor, hp: w.warden.hp, maxHp: w.warden.maxHp } : null,
            },
            score: {
              kills: w.scoreKeeper.kills, score: w.scoreKeeper.score,
              combo: w.scoreKeeper.combo, maxCombo: w.scoreKeeper.maxCombo,
            },
          };
        }
      }
    }
    // end-of-tick snapshot (rules525.md sec.5)
    st.prevBullets.clear();
    for (const b of w.enemyBullets.bullets) st.prevBullets.set(b.id, { px: b.pos.x, py: b.pos.y, vx: b.vel.x, vy: b.vel.y, r: b.radius });
    st.mulHist.push(w.enemyBullets.speedMul);
    r.ticks = tick;
    if (w.gameOver) { r.died = true; r.deathTick = tick; break; }
  }
  return r;
}

const t0 = Date.now();
const runs = SEEDS.map(runSweep);
const out = {
  tag: "sweep582", dt: DT, cap: CAP, seeds: SEEDS,
  frozen: ".evidence/I583/rules582.md",
  runs: runs.map(r => ({
    seed: r.seed, died: r.died, deathTick: r.deathTick, ticks: r.ticks,
    totalHits: r.totalHits, killingBlow: r.killingBlow,
    bossDeaths: r.bossDeaths,
    hitLog: r.hitLog,
    waveTable: Object.fromEntries(Object.entries(r.waveTable).filter(([n]) => Number(n) <= 24).map(([n, wt]) => [n, { ...wt, clearSecs: wt.clearTick ? +(((wt.clearTick - wt.startTick) * DT).toFixed(3)) : null }])),
  })),
};
writeFileSync(new URL("./sweep582.json", import.meta.url), JSON.stringify(out, null, 1));

// ---------- branch evaluation (rules525.md sec.9) ----------
const H = (primary) => runs.filter(r => r.died && r.killingBlow &&
  ["MONOLITH", "SPLICER", "WARDEN"].includes(primary(r))).length;
const primary = r => r.killingBlow.clsPrimary;
const strictOf = r => r.killingBlow.monolithProbable ? r.killingBlow.clsExact : r.killingBlow.clsPrimary;
const hPrimary = H(primary);
const hStrict = H(strictOf);
const tally = (fn) => {
  const t = {};
  for (const r of runs) if (r.died && r.killingBlow) {
    const c = fn(r);
    t[c] = (t[c] || 0) + 1;
  }
  return t;
};
const tPrimary = tally(primary);
const tStrict = tally(strictOf);
// ---------- E82 acceptance (rules582.md sec.3, FROZEN - (a)-(d) in-sweep, (e) external; metric code VERBATIM from sweep581.mjs per rules582.md sec.5) ----------
const b56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6)).length;
const m56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6) && r.killingBlow.clsPrimary === "MONOLITH").length; // E81 def - reported for R-6 comparability only, NOT adjudicated on
const m56p = runs.filter(r => {
  if (!r.died || !r.killingBlow) return false;
  const kb = r.killingBlow;
  if (kb.wave !== 5 && kb.wave !== 6) return false;
  if (kb.clsPrimary === "MONOLITH") return true;
  if (kb.clsPrimary === "bullet_unknown") {
    return (r.bossDeaths || []).some(b => b.kind === "monolith" && b.tick <= kb.tick && kb.tick - b.tick <= 180);
  }
  return false;
}).length; // M56' FROZEN (E82 doc sec.6; 180-tick = 3 s window sized by the measured post-kill residuals)

const med = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[(s.length >> 1) - 1] + s[s.length >> 1]) / 2; };
const deathWaves = runs.filter(r => r.died).map(r => r.killingBlow.wave);
const medWave = med(deathWaves);
const reach13 = runs.filter(r => {
  const reached = r.died
    ? r.killingBlow.wave
    : (Object.keys(r.waveTable).length ? Math.max(...Object.keys(r.waveTable).map(Number)) : 0);
  return reached >= 13;
}).length;
const accA = b56 <= 9;
const accB = m56p <= 7;
const accC = medWave !== null && medWave >= 9;
const accD = reach13 >= 3;
const acceptance = "(a) B56 <= 9/30: " + (accA ? "PASS" : "FAIL") + " [" + b56 + "/" + runs.length + ", baseline 11/30] | (b) M56' <= 7/30: " + (accB ? "PASS" : "FAIL") + " [" + m56p + "/" + runs.length + ", baseline 11/30] | (c) median death wave >= 9: " + (accC ? "PASS" : "FAIL") + " [measured " + medWave + "] | (d) >= 3/30 reach wave >= 13: " + (accD ? "PASS" : "FAIL") + " [measured " + reach13 + "/" + runs.length + "; sweep577 6/30; sweep581 1/30] | (e) 5-harness gate EXACT no re-pin: EXTERNAL (run_gate583.cjs)";
const perRun = runs.map(r => {
  const kb = r.killingBlow;
  return "seed " + r.seed + ": " + (r.died
    ? "died tick " + r.deathTick + " (wave " + kb.wave + ") source=" + kb.source + " clsPrimary=" + kb.clsPrimary + (kb.monolithProbable ? " [MP]" : "") + " hits=" + r.totalHits + " score=" + kb.score.score + " kills=" + kb.score.kills
    : "ALIVE at cap (wave " + (Object.keys(r.waveTable).length ? Math.max(...Object.keys(r.waveTable).map(Number)) : 0) + ")");
});
const lines = [];
lines.push("I583 E82 (30 seeds 58200+i, full director, kiter, cap " + CAP + " ticks) - post-lever VALIDATION of the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 (ST-550/I583; acceptance (a)-(d) per rules582.md sec.3; (e) = 5-harness gate EXACT, external)");
lines.push("rules: .evidence/I583/rules582.md   generated " + new Date().toISOString() + "   wall ms " + (Date.now() - t0));
lines.push("");
lines.push("PER-RUN:");
for (const l of perRun) lines.push(l);
lines.push("");
lines.push("KILLING-BLOW TALLY (primary, incl. monolithProbable rocks): " + JSON.stringify(tPrimary));
lines.push("KILLING-BLOW TALLY (strict, probable rocks excluded):        " + JSON.stringify(tStrict));
lines.push("H primary: " + hPrimary + "/" + runs.length + "   H strict: " + hStrict + "/" + runs.length + "  " );
lines.push("died runs: " + runs.filter(r => r.died).length + "/" + runs.length + "   median death wave: " + med(deathWaves));
lines.push("");
lines.push("FRACTION H primary: " + (hPrimary/runs.length).toFixed(3) + " (" + hPrimary + "/" + runs.length + ")   ACCEPTANCE (a)-(e): " + acceptance);
lines.push("ADJUDICATION INPUTS: B56 " + b56 + "/" + runs.length + " (wave 5-6 band, any attribution) | M56 " + m56 + "/" + runs.length + " (band AND clsPrimary MONOLITH; E81 def - R-6 comparability only) | M56' " + m56p + "/" + runs.length + " (band AND [MONOLITH primary OR bullet_unknown + monolithDeath within 180 ticks BEFORE death]; FROZEN E82 def - ADJUDICATED ON M56')");
lines.push("");
lines.push("PER-WAVE 1-20 (median across runs; plannedContent per wave from first run):");
for (let n = 1; n <= 20; n++) {
  const rows = runs.map(r => r.waveTable && r.waveTable[n]).filter(Boolean);
  const cleared = rows.map(x => x.clearTick ? (x.clearTick - x.startTick) * DT : null).filter(x => x !== null);
  const planned = rows.length ? rows[0].planned : null;
  lines.push("wave " + n + ": startedRuns=" + rows.length + " clearedRuns=" + cleared.length + " medianClearSecs=" + (cleared.length ? med(cleared) : null) + " plannedContent(run0)=" + planned);
}
writeFileSync(new URL("./results582.txt", import.meta.url), lines.join("\n") + "\n");
console.log(lines.join("\n"));