// Void Runner - deterministic bot playtest harness (I129, ST-129)
// Headless (DOM-free): runs the full World with a simple competent bot and
// reports per-wave + per-run balance data. Usage:
//   node scripts/playtest.mjs <seed> <minutes>
// The bot: leads its target (bullet-flight-time prediction), flees from ANY
// threat inside 4.5s time-to-impact, kills nearby drones (cheap, fast),
// strafes around the boss, collects drops when safe, otherwise drifts center.
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { v2, v2Len, v2Dist, v2Norm } from '../src/core/math.js';
import { CONFIG } from '../src/core/config.js';

const DT = 1 / 60;
const seed = Number(process.argv[2] || 11);
const maxMinutes = Number(process.argv[3] || 30);
const maxSteps = Math.floor(maxMinutes * 60 * 60);
const BULLET_SPEED = 34;

let dropSince = null; // [dropPos, simT] to time out drop-chase
function botIntent(w, simT) {
  const s = w.ship.pos;
  const threats = [];
  const consider = (pos, vel, radius, kind) => {
    const d = v2Dist(s, pos) - radius * 0.5;
    if (d <= 0) return;
    const closing = vel ? Math.max(0.4, -((pos.x - s.x) * vel.x + (pos.y - s.y) * vel.y) / Math.max(0.1, d)) : 0.4;
    const score = d / closing; // seconds to contact
    if (d < 24) threats.push({ pos, vel, radius, kind, score, d });
  };
  for (const r of w.field.rocks) consider(r.pos, r.vel, r.radius, 'rock');
  for (const d of w.drones.drones) if (!d.dead) consider(d.pos, d.vel, 0.8, 'drone');
  for (const b of w.enemyBullets.bullets) if (!b.dead) consider(b.pos, b.vel, b.radius, 'eb');
  for (const m of w.mines.mines) if (!m.dead) consider(m.pos, m.vel, m.radius, 'mine');
  const boss = w.boss && w.boss.alive ? w.boss : null;
  let aim = null, thrust = null;
  if (boss) {
    aim = { x: boss.pos.x, y: boss.pos.y };
    const d = v2Dist(s, boss.pos);
    const away = v2Norm(v2(s.x - boss.pos.x, s.y - boss.pos.y));
    const side = v2(-away.y, away.x); // strafe
    thrust = d < 12 ? away : (d > 20 ? v2((boss.pos.x - s.x) * 0.1, (boss.pos.y - s.y) * 0.1) : v2(side.x * 0.6 + away.x * 0.2, side.y * 0.6 + away.y * 0.2));
  }
  if (threats.length) {
    threats.sort((a, b) => a.score - b.score);
    // Drones are cheap to kill and fast: aim them if close
    const aimable = threats.filter(t => t.kind === 'rock' || t.kind === 'drone');
    const nearDrone = aimable.find(t => t.kind === 'drone' && t.d < 14);
    const primary = nearDrone || aimable[0];
    if (!primary) { return { thrust, aimPoint: aim, firing: !!aim }; }
    const t = v2Dist(s, primary.pos) / BULLET_SPEED;
    const px = primary.pos.x + (primary.vel ? primary.vel.x * t : 0);
    const py = primary.pos.y + (primary.vel ? primary.vel.y * t : 0);
    if (!boss || v2Dist(s, { x: px, y: py }) < v2Dist(s, boss.pos) * 1.1) aim = { x: px, y: py };
    // Flee from ANY imminent threat, not just the primary
    const imminent = threats.find(t2 => t2.score < 3.0);
    if (imminent) thrust = v2Norm(v2(s.x - imminent.pos.x, s.y - imminent.pos.y));
  }
  if (!thrust) {
    let drop = null, dp = Infinity;
    for (const p of w.powerups.drops) {
      const dd = v2Dist(s, p.pos);
      if (dd < dp) { dp = dd; drop = p; }
    }
    if (drop && dp < 10 && (!dropSince || dropSince[0] === drop.pos && (simT - dropSince[1]) < 3)) {
      thrust = v2Norm(v2(drop.pos.x - s.x, drop.pos.y - s.y));
      dropSince = [drop.pos, simT];
    } else if (drop && dp >= 10) dropSince = null;
  }
  if (!thrust) {
    const t = v2(-s.x, -s.y);
    thrust = v2Len(t) > 0.5 ? v2Norm(t) : v2(0, 0);
  }
  return { thrust, aimPoint: aim, firing: !!aim };
}

function newWaveRow(wave, t0, score0) {
  return { wave, t0, score0, hits: 0, kills: 0, shieldedKills: 0, shieldedHits: 0, droneKills: 0, droneDeaths: 0, droneDecays: 0, bossKills: 0, nearmiss: 0, bombs: 0, goldenKills: 0, dropsTaken: {}, dropsSpawned: {}, shots: { 1: 0, 2: 0, 3: 0 } };
}
function closeRow(waves, cur, w, simT) {
  if (cur.wave < 1) return;
  waves.push({
    wave: cur.wave, clearSec: +(simT - cur.t0).toFixed(1), hits: cur.hits, kills: cur.kills,
    shieldedKills: cur.shieldedKills, shieldedHits: cur.shieldedHits, droneKills: cur.droneKills,
    droneDeaths: cur.droneDeaths, droneDecays: cur.droneDecays, bossKills: cur.bossKills, nearmiss: cur.nearmiss, bombs: cur.bombs,
    goldenKills: cur.goldenKills, dropsTaken: { ...cur.dropsTaken }, dropsSpawned: { ...cur.dropsSpawned },
    shots: { ...cur.shots },
    scoreDelta: w.score - cur.score0,
    shieldedAliveAtEnd: w.field.rocks.filter(r => r.shielded).length,
  });
}

function runPlaytest(seed, maxSteps, setup = null, startWave = 0, cfg = null) {
  const w = new World(new RNG(seed), cfg || CONFIG);
  w.begin();
  if (setup) setup(w);
  const waves = [];
  let cur = newWaveRow(startWave, 0, 0);
  let simT = 0, endReason = 'time';
  for (let i = 0; i < maxSteps; i++) {
    w.step(DT, botIntent(w, simT));
    simT += DT;
    for (const e of w.drainEvents()) {
      if (e.type === 'wave') {
        closeRow(waves, cur, w, simT);
        cur = newWaveRow(e.data.n, simT, w.score);
      } else if (e.type === 'hit') cur.hits++;
      else if (e.type === 'rockShieldHit') cur.shieldedHits++;
      else if (e.type === 'kill') {
        cur.kills++;
        if (e.data.shielded) cur.shieldedKills++;
        if (e.data.drone) cur.droneKills++;
        if (e.data.boss) cur.bossKills++;
        if (e.data.golden) cur.goldenKills++;
      } else if (e.type === 'droneExplode') cur.droneDeaths++;
      else if (e.type === 'droneDecay') cur.droneDecays++; // I129: seeker battery expired
      else if (e.type === 'nearmiss') cur.nearmiss++;
      else if (e.type === 'powerup') cur.dropsTaken[e.data.type] = (cur.dropsTaken[e.data.type] || 0) + 1;
      else if (e.type === 'powerupDrop') cur.dropsSpawned[e.data.type] = (cur.dropsSpawned[e.data.type] || 0) + 1;
      else if (e.type === 'instant' && e.data.type === 'bomb') cur.bombs++;
      else if (e.type === 'fire') { const lv = e.data.level || 1; cur.shots[lv] = (cur.shots[lv] || 0) + 1; }
      else if (e.type === 'gameover') { endReason = 'gameOver'; }
    }
    if (w.game.state === 'GAME_OVER') { endReason = 'lives'; break; }
  }
  closeRow(waves, cur, w, simT);
  if (waves.length && waves[waves.length - 1].wave === 0) waves.pop();
  const sum = (k) => waves.reduce((a, x) => a + (x[k] || 0), 0);
  const sumShots = (k) => waves.reduce((a, x) => a + ((x.shots && x.shots[k]) || 0), 0);
  return {
    seed, endState: w.game.state, endReason, wave: w.wave, score: w.score, lives: w.lives,
    simMinutes: +(simT / 60).toFixed(1),
    waveClears: waves,
    totals: {
      kills: sum('kills'), shieldedKills: sum('shieldedKills'), shieldedHits: sum('shieldedHits'),
      droneKills: sum('droneKills'), droneDeaths: sum('droneDeaths'), droneDecays: sum('droneDecays'), goldenKills: sum('goldenKills'),
      hits: sum('hits'), nearmiss: sum('nearmiss'), bombs: sum('bombs'),
      shotsL1: sumShots(1), shotsL2: sumShots(2), shotsL3: sumShots(3),
      stallAdvances: waves.filter(x => x.clearSec >= 44).length,
    },
  };
}

// Scenario mode: force a single wave N with its real content (boss on boss
// waves, cumulative drone pressure capped at maxConcurrent) and play 150 s.
const args = process.argv.slice(2);
let r;
if (args[0] === 'scenario') {
  const N = Number(args[1] || 8);
  const preFix = args[2] === 'infinite'; // I129 pre-fix arm: no seeker battery (maxAge Infinity)
  const cfg = preFix ? { ...CONFIG, drone: { ...CONFIG.drone, maxAge: Infinity } } : null;
  r = runPlaytest(100 + N, 150 * 60, (w) => {
    w.waves.state = 'active';
    w.waves.wave = N;
    w.waves.waveElapsed = 0;
    w.waves.activeMod = 'none';
    w.waves.toSpawn = w.waves.contentFor(N);
    w.spawnBossForWave(N);
    const dmax = Math.min(w.cfg.drone.maxConcurrent, Math.max(0, N - w.cfg.drone.firstWave + 1));
    for (let i = 0; i < dmax; i++) {
      const dn = w.drones.spawn(w.ship.pos);
      if (dn) dn.age = (dmax - 1 - i) * 18; // I129: cumulative drones arrive aged (one per prior wave, ~18 s avg clear)
    }
  }, N, cfg);
  r.scenario = N;
  if (preFix) r.arm = 'pre-fix (maxAge Infinity)';
} else {
  r = runPlaytest(seed, maxSteps);
}
console.log(JSON.stringify(r, null, 1));
