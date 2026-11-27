// ST-014: wave director tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveDirector } from '../src/core/waves.js';
import { AsteroidField } from '../src/core/asteroids.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const DT = CONFIG.wave.intermission + 0.01; // jump past intermission

function setup(seed = 1) {
  const field = new AsteroidField(new RNG(seed));
  const dir = new WaveDirector(new RNG(seed + 100), field);
  dir.start();
  return { field, dir };
}

test('waves: wave 1 spawns base+growth rocks at ramped speed', () => {
  const { field, dir } = setup();
  const ev = dir.step(DT);
  assert.equal(ev.startedWave, 1);
  assert.equal(dir.speedMult, 1 + CONFIG.wave.speedPerWave);
  assert.equal(field.count, CONFIG.wave.base + CONFIG.wave.growth * 1);
});

test('waves: speed and concurrency ramp with wave number (capped)', () => {
  const { field, dir } = setup();
  dir.step(DT); // wave 1
  // I39: derive the first wave where the speed ramp actually hits the cap,
  // so this probe stays correct if speedPerWave/speedCap get retuned.
  const capWave = Math.ceil((CONFIG.wave.speedCap - 1) / CONFIG.wave.speedPerWave) + 1;
  // force-clear to advance
  for (let i = 0; i < 60; i++) {
    field.clear();
    const ev = dir.step(DT);
    if (dir.wave >= capWave) break;
    if (ev.waveCleared === 0 && field.count > 0 && dir.toSpawn === 0) field.clear();
  }
  assert.ok(dir.wave >= capWave, `reached wave ${dir.wave}`);
  dir.activeMod = 'none'; // ST-051: probe the base ramp; modifier math lives in wavemods.test.js
  assert.ok(Math.abs(dir.speedMult - CONFIG.wave.speedCap) < 1e-9, 'speed capped');
  assert.equal(dir.concurrentLimit, CONFIG.wave.maxConcurrentCap, 'concurrency capped');
});

test('waves: wave 10 numbers per GDD ramp', () => {
  const { field, dir } = setup();
  dir.wave = 10; // direct probe of the formulas
  dir.activeMod = 'none'; // ST-051: base-ramp probe
  assert.ok(Math.abs(dir.speedMult - Math.min(CONFIG.wave.speedCap, 1 + CONFIG.wave.speedPerWave * 10)) < 1e-9);
  assert.equal(dir.concurrentLimit, Math.min(CONFIG.wave.maxConcurrentCap, 6 + CONFIG.wave.maxConcurrentGrowth * 10));
});

test('waves: intermission separates waves', () => {
  const { field, dir } = setup();
  dir.step(DT); // wave 1 active
  field.clear();
  dir.step(DT); // detects clear -> intermission
  assert.equal(dir.state, 'intermission');
  const ev = dir.step(0.5); // not yet
  assert.equal(ev.startedWave, 0);
  assert.equal(ev.waveCleared, 0);
  const ev2 = dir.step(CONFIG.wave.intermission + 0.5);
  assert.equal(ev2.startedWave, 2);
});

test('waves: no S rocks in first 3 waves', () => {
  const { field, dir } = setup(77);
  dir.step(DT);
  assert.ok(field.rocks.every(r => r.size !== 'S'), 'wave 1 has no S');
});

test('waves: deterministic size sequence per seed', () => {
  const mk = () => {
    const field = new AsteroidField(new RNG(5));
    const dir = new WaveDirector(new RNG(6), field);
    dir.start();
    dir.step(DT);
    return field.rocks.map(r => r.size).join('');
  };
  assert.equal(mk(), mk());
});

test('waves: trickle respects concurrent limit (spawns <= limit per step)', () => {
  const field = new AsteroidField(new RNG(3));
  const cfg = JSON.parse(JSON.stringify(CONFIG));
  cfg.wave.maxConcurrentCap = 24;
  const dir = new WaveDirector(new RNG(4), field, cfg);
  dir.start();
  dir.wave = 20; // limit = min(24, 6+40) = 24
  dir.state = 'active';
  dir.toSpawn = 100;
  dir.step(DT);
  assert.ok(field.count <= 24, `spawned ${field.count}`);
  assert.equal(dir.toSpawn, 100 - field.count);
});

test('waves: stall advance after stallTime carries leftover rocks (I42)', () => {
  const { field, dir } = setup(36);
  dir.step(DT); // wave 1 active
  assert.equal(dir.wave, 1);
  const leftover = field.count;
  assert.ok(leftover > 0, 'field has rocks to carry');
  const S = 1 / 60;
  let stalled = 0;
  for (let i = 0; i < Math.ceil(CONFIG.wave.stallTime / S) + 2; i++) {
    const ev = dir.step(S);
    if (ev.stallAdvance) { stalled = ev.stallAdvance; break; }
  }
  assert.equal(stalled, 2, 'stall advanced to wave 2');
  assert.equal(dir.wave, 2);
  assert.equal(dir.toSpawn, CONFIG.wave.base + CONFIG.wave.growth * 2);
  assert.equal(field.count, leftover, 'leftover rocks carried, none deleted');
  assert.ok(dir.waveElapsed < CONFIG.wave.stallTime, 'stall timer reset');
});

test('waves: clear in time does not stall (I42)', () => {
  const { field, dir } = setup(37);
  dir.step(DT); // wave 1 active
  field.clear();
  const ev = dir.step(0.5);
  assert.equal(ev.waveCleared, 1, 'normal clear fires');
  assert.equal(ev.stallAdvance, 0, 'no stall on a real clear');
  assert.equal(dir.state, 'intermission');
  assert.equal(dir.waveElapsed, 0, 'timer reset on clear');
});

test('waves: repeated stalls keep escalating (I42)', () => {
  const { field, dir } = setup(38);
  dir.step(DT); // wave 1 active
  const S = 1 / 60;
  const stalls = [];
  for (let i = 0; i < 2 * (Math.ceil(CONFIG.wave.stallTime / S)) + 12; i++) {
    const ev = dir.step(S);
    if (ev.stallAdvance) {
      stalls.push(ev.stallAdvance);
      if (stalls.length === 2) break;
    }
  }
  assert.deepEqual(stalls, [2, 3], 'two consecutive stalls -> waves 2 then 3');
  assert.equal(dir.wave, 3);
  assert.ok(field.count > 0, 'leftover rocks persist (concurrent cap bounds density)');
});

// ---- ST-242: breather open density (I250) ----

test('ST-242: isBreatherWave flags exactly the wave right after each boss wave', () => {
  const { dir } = setup(7);
  for (const w of [6, 11, 16, 21]) assert.equal(dir.isBreatherWave(w), true, `wave ${w} is a breather`);
  for (const w of [1, 5, 7, 10, 12, 20]) assert.equal(dir.isBreatherWave(w), false, `wave ${w} is not a breather`);
});

test('ST-242: openBudgetFor is null on non-breather waves', () => {
  const { dir } = setup(7);
  for (const w of [1, 5, 7, 10, 20]) assert.equal(dir.openBudgetFor(w), null, `wave ${w} has no budget`);
});

test('ST-242: openBudgetFor caps the breather opening batch (0.5, floor 3)', () => {
  const { dir } = setup(7);
  // wave 6: content 10, limit 18 -> normal min(16,10,18)=10 -> floor(10*0.5)=5
  assert.equal(dir.openBudgetFor(6), 5);
  // wave 11: content 15, limit 24 -> min(16,15,24)=15 -> floor(15*0.5)=7
  assert.equal(dir.openBudgetFor(11), 7);
  // wave 16: content 20 (endless cap 36), limit 24 -> min(16,20,24)=16 -> floor(16*0.5)=8
  assert.equal(dir.openBudgetFor(16), 8);
});

test('ST-242: openBudgetFor floors at breatherMinRocks on a tiny fraction', () => {
  const cfg = { ...CONFIG, wave: { ...CONFIG.wave, breatherOpenFrac: 0.05 } };
  const field = new AsteroidField(new RNG(7));
  const dir = new WaveDirector(new RNG(107), field, cfg);
  // floor(10 * 0.05) = 0 -> floored to breatherMinRocks (3)
  assert.equal(dir.openBudgetFor(6), cfg.wave.breatherMinRocks);
  assert.equal(dir.openBudgetFor(6), 3);
});

test('ST-242: missing boss config disables breather detection', () => {
  const cfg = { ...CONFIG, boss: undefined };
  const field = new AsteroidField(new RNG(7));
  const dir = new WaveDirector(new RNG(107), field, cfg);
  assert.equal(dir.isBreatherWave(6), false);
  assert.equal(dir.openBudgetFor(6), null);
});

test('ST-242: wave 6 opens with the reduced batch, rest trickles in (integration)', () => {
  const { field, dir } = setup(393);
  dir.wave = 5; dir.state = 'intermission'; dir.intermission = 0.001;
  dir.toSpawn = 0; dir.waveElapsed = 0; dir.activeMod = 'none'; dir.openGate = null;
  field.clear();
  const S = 1 / 60;
  const e1 = dir.step(S);
  assert.equal(e1.startedWave, 6);
  assert.equal(dir.activeMod, 'none', 'breather = no modifier');
  assert.equal(dir.field.count, 5, 'opening batch capped at 5 (not the full 10)');
  assert.equal(dir.toSpawn, 5, '5 rocks still queued to trickle in');
  const e2 = dir.step(S);
  assert.equal(dir.field.count, 10, 'remaining 5 trickle in on the next tick');
  assert.equal(dir.toSpawn, 0);
  assert.equal(dir.openGate, null, 'gate retired after the burst completes');
  assert.equal(e2.waveCleared, 0);
});

test('ST-242: a non-breather wave still opens at full density (control)', () => {
  const { field, dir } = setup(393);
  dir.wave = 3; dir.state = 'intermission'; dir.intermission = 0.001;
  dir.toSpawn = 0; dir.waveElapsed = 0; dir.activeMod = 'none'; dir.openGate = null;
  field.clear();
  const S = 1 / 60;
  const e1 = dir.step(S);
  assert.equal(e1.startedWave, 4);
  assert.equal(dir.openGate, null, 'no gate on a non-breather wave');
  assert.equal(dir.field.count, 8, 'wave 4 content 8 all spawn on the first tick');
  assert.equal(dir.toSpawn, 0);
});

test('ST-242: a stall-advance into wave 11 also sets the breather gate', () => {
  const { field, dir } = setup(393);
  dir.wave = 10; dir.state = 'active'; dir.toSpawn = 0;
  dir.waveElapsed = CONFIG.wave.stallTime - 0.01; dir.activeMod = 'none'; dir.openGate = null;
  field.clear();
  field.spawn('M', 1, null, null, false, null, 0, false); // one leftover so the wave is not cleared this tick
  const S = 1 / 60;
  const e1 = dir.step(S);
  assert.equal(e1.stallAdvance, 11);
  assert.equal(dir.openGate, 7, 'wave 11 breather gate = floor(15 * 0.5)');
  const e2 = dir.step(S);
  assert.equal(dir.field.count, 8, 'leftover 1 + first 7 of content 15');
  assert.equal(dir.toSpawn, 8);
  assert.equal(dir.openGate, null);
});

test('ST-242: wave-6 opening is deterministic across identical stagings (x2)', () => {
  const sig = () => {
    const { field, dir } = setup(393);
    dir.wave = 5; dir.state = 'intermission'; dir.intermission = 0.001;
    dir.toSpawn = 0; dir.waveElapsed = 0; dir.activeMod = 'none'; dir.openGate = null;
    field.clear();
    const S = 1 / 60;
    dir.step(S); dir.step(S);
    return { n: field.count, pos: field.rocks.map((r) => `${r.pos.x.toFixed(3)},${r.pos.y.toFixed(3)}`).join('|') };
  };
  const a = sig();
  const b = sig();
  assert.equal(a.n, b.n);
  assert.equal(a.pos, b.pos);
});

// ---- I563: the ST-138 belt layer must not hold waves hostage on the stall timer ----

test('waves: killableCount excludes the ST-138 belt layer (I563)', () => {
  const { field, dir } = setup(5631);
  dir.step(DT); // wave 1 active - all wave-1 rocks spawned
  assert.ok(field.count > 0, 'wave 1 has rocks');
  assert.equal(dir.toSpawn, 0, 'wave 1 fully spawned');
  assert.equal(field.killableCount, field.count, 'no belt rocks yet -> counts agree');
  const belt = field.spawn('M', 1, null, null, false, null, 0, false, true);
  assert.ok(belt && belt.belt, 'belt rock spawned and marked');
  assert.equal(field.count, field.killableCount + 1, 'count includes the belt rock, killableCount excludes it');
});

test('waves: wave clears in one tick once killables die, belt persists (I563)', () => {
  const { field, dir } = setup(5632);
  dir.step(DT); // wave 1 active
  const belt = field.spawn('M', 1, null, null, false, null, 0, false, true);
  assert.ok(belt, 'belt rock in the field');
  for (const r of field.rocks) if (!r.belt) r.dead = true; // player dealt with every killable
  field.compact();
  assert.equal(field.count, 1, 'only the belt rock remains');
  const ev = dir.step(1 / 60); // ONE tick - pre-I563 this needed the full 45 s stall
  assert.equal(ev.waveCleared, 1, 'normal clear fires with the belt present');
  assert.equal(ev.stallAdvance, 0, 'no stall wait');
  assert.equal(dir.state, 'intermission');
  assert.equal(field.count, 1, 'belt rock survives the clear');
});

test('waves: belt-only field clears and both belt rocks persist (I563)', () => {
  const { field, dir } = setup(5633);
  dir.step(DT); // wave 1 active
  for (const r of field.rocks) r.dead = true; // everything dealt with
  field.compact();
  dir.toSpawn = 0;
  const b1 = field.spawn('M', 1, null, null, false, null, 0, false, true);
  const b2 = field.spawn('L', 1, null, null, false, null, 0, false, true);
  assert.ok(b1 && b2, 'two belt rocks in the field');
  const ev = dir.step(1 / 60);
  assert.equal(ev.waveCleared, 1, 'belt-only field clears normally');
  assert.equal(dir.state, 'intermission');
  assert.equal(field.count, 2, 'both belt rocks persist');
  assert.equal(field.killableCount, 0);
});

test('waves: leftover grace - 2 stragglers advance the wave after leftover.stall (I630)', () => {
  const { field, dir } = setup(901);
  dir.step(DT); // wave 1 active
  const keep = field.rocks.slice(0, 2);
  for (const r of field.rocks) if (keep.indexOf(r) === -1) r.dead = true;
  field.compact();
  assert.equal(field.killableCount, 2, 'two stragglers left');
  const S = 1 / 60;
  let adv = 0;
  for (let i = 0; i < Math.ceil((CONFIG.wave.leftover.stall - 0.5) / S); i++) { const ev = dir.step(S); if (ev.stallAdvance) { adv = ev.stallAdvance; break; } }
  assert.equal(adv, 0, 'no advance before the grace window');
  for (let i = 0; i < 60; i++) { const ev = dir.step(S); if (ev.stallAdvance) { adv = ev.stallAdvance; break; } }
  assert.equal(adv, 2, 'grace advanced to wave 2');
  assert.equal(field.count, 2, 'stragglers carried, none deleted');
});

test('waves: leftover grace - max+1 stragglers never fire the grace (stallTime backstop only) (I630/I639)', () => {
  const { field, dir } = setup(902);
  dir.step(DT); // wave 1 active
  // wave 1 spawns base + growth = 5 rocks = leftover.max + 1 (max = 4 since I639); keep them all
  assert.equal(field.killableCount, CONFIG.wave.leftover.max + 1, 'max+1 stragglers left');
  const S = 1 / 60;
  let adv = 0, atStep = -1;
  for (let i = 1; i <= Math.ceil(CONFIG.wave.stallTime / S) + 2; i++) { const ev = dir.step(S); if (ev.stallAdvance) { adv = ev.stallAdvance; atStep = i; break; } }
  assert.equal(adv, 2, 'advanced via the backstop');
  assert.ok(DT + atStep * S >= CONFIG.wave.stallTime - 1e-6, 'advance at the 45 s stall wall (incl. the first-step DT), not the grace: step ' + atStep);
});

test('waves: leftover grace - timer resets when the killable count rises above max again (I630/I639)', () => {
  const { field, dir } = setup(903);
  dir.step(DT); // wave 1 active (5 rocks = max + 1)
  const max = CONFIG.wave.leftover.max;
  for (let i = 0; i < field.killableCount - max; i++) field.rocks[i].dead = true; // kill down to exactly max
  field.compact();
  assert.equal(field.killableCount, max, 'max stragglers left -> grace band');
  const S = 1 / 60;
  for (let i = 0; i < 8 / S; i++) dir.step(S); // 8 s of the grace window
  assert.ok(dir.leftoverT > 7.9, 'grace timer running: ' + dir.leftoverT);
  field.spawn('M', 1); // one more killable appears -> max + 1
  dir.step(S);
  assert.equal(dir.leftoverT, 0, 'timer reset while count > max');
  const extra = field.rocks[field.rocks.length - 1];
  extra.dead = true; field.compact(); // kill it again -> back to max
  assert.equal(field.killableCount, max);
  for (let i = 0; i < Math.ceil((CONFIG.wave.leftover.stall - 1) / S); i++) { const ev = dir.step(S); assert.equal(ev.stallAdvance, 0, 'timer restarted from zero'); }
  for (let i = 0; i < 60; i++) { const ev = dir.step(S); if (ev.stallAdvance) break; }
  assert.equal(dir.wave, 2, 'advance only after a full fresh grace window');
});

test('waves: true clear stays immediate and resets the grace state (I630)', () => {
  const { field, dir } = setup(904);
  dir.step(DT); // wave 1 active
  const keep = field.rocks.slice(0, 2);
  for (const r of field.rocks) if (keep.indexOf(r) === -1) r.dead = true;
  field.compact();
  const S = 1 / 60;
  for (let i = 0; i < 5 / S; i++) dir.step(S); // 5 s of the grace window
  assert.ok(dir.leftoverT > 4.9, 'grace timer running');
  field.clear(); // the last two die
  const ev = dir.step(S);
  assert.equal(ev.waveCleared, 1, 'immediate clear - no grace wait');
  assert.equal(ev.stallAdvance, 0);
  assert.equal(dir.leftoverT, 0, 'grace state reset on a true clear');
  assert.equal(dir.state, 'intermission');
});

test('waves: hold getter - null outside a hold (I639)', () => {
  const { field, dir } = setup(911);
  assert.equal(dir.hold, null, 'null in intermission before the first wave');
  dir.step(DT); // wave 1 active (5 rocks, toSpawn 0)
  for (const r of field.rocks) r.dead = true;
  field.compact();
  assert.equal(dir.hold, null, 'null when the killables are gone (the clear is pending, not a hold)');
  const ev = dir.step(1 / 60);
  assert.equal(ev.waveCleared, 1);
  assert.equal(dir.hold, null, 'null back in intermission');
});

test('waves: hold getter - null while toSpawn > 0 (I639)', () => {
  const { field, dir } = setup(912);
  dir.step(DT); // wave 1 active (all 5 spawned on the first tick)
  assert.ok(dir.hold, 'holding while 5 stragglers survive');
  dir.toSpawn = 2; // internal guard check - a wave that is still spawning is not "held"
  assert.equal(dir.hold, null);
});

test('waves: hold getter - grace band reports remaining/timeLeft/graced (I639)', () => {
  const { field, dir } = setup(913);
  dir.step(DT); // wave 1 active (5 rocks)
  field.rocks[0].dead = true; field.compact(); // 4 = leftover.max stragglers
  const S = 1 / 60;
  for (let i = 0; i < 3 / S; i++) dir.step(S); // 3 s into the grace window
  const h = dir.hold;
  assert.ok(h, 'holding');
  assert.equal(h.remaining, CONFIG.wave.leftover.max);
  assert.equal(h.graced, true, 'k <= leftover.max -> grace band');
  assert.ok(Math.abs(h.timeLeft - Math.max(0, CONFIG.wave.leftover.stall - dir.leftoverT)) < 1e-9, 'timeLeft = stall - leftoverT: ' + h.timeLeft);
  assert.ok(h.timeLeft > 6 && h.timeLeft <= 10, '~3 s into the 10 s grace: ' + h.timeLeft);
});

test('waves: hold getter - backstop band when k > leftover.max (I639)', () => {
  const { field, dir } = setup(914);
  dir.step(DT); // wave 1: 5 rocks = max + 1, all alive, toSpawn 0
  const S = 1 / 60;
  for (let i = 0; i < 2 / S; i++) dir.step(S);
  const h = dir.hold;
  assert.ok(h, 'holding');
  assert.equal(h.remaining, CONFIG.wave.leftover.max + 1);
  assert.equal(h.graced, false, 'k > leftover.max -> backstop band');
  assert.ok(Math.abs(h.timeLeft - Math.max(0, CONFIG.wave.stallTime - dir.waveElapsed)) < 1e-9, 'timeLeft = stallTime - waveElapsed: ' + h.timeLeft);
});

test('waves: hold getter - the leftover.max boundary (I639)', () => {
  const { field, dir } = setup(915);
  dir.step(DT); // wave 1: 5 = max + 1
  assert.equal(dir.hold.graced, false, 'max+1 -> backstop');
  field.rocks[0].dead = true; field.compact();
  assert.equal(field.killableCount, CONFIG.wave.leftover.max);
  dir.step(1 / 60);
  assert.equal(dir.hold.graced, true, 'max -> grace');
});
