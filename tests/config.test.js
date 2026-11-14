import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/core/config.js';

test('config: schema sanity - required sections exist', () => {
  for (const key of ['arena', 'ship', 'weapon', 'asteroid', 'wave', 'combo', 'powerup', 'fx', 'storage']) {
    assert.ok(CONFIG[key], `missing section: ${key}`);
  }
});

test('config: numeric tunables are positive finite', () => {
  const check = (v, name) => {
    assert.ok(Number.isFinite(v) && v > 0, `${name} must be positive finite, got ${v}`);
  };
  check(CONFIG.arena.radius, 'arena.radius');
  check(CONFIG.ship.accel, 'ship.accel');
  check(CONFIG.ship.maxSpeed, 'ship.maxSpeed');
  check(CONFIG.ship.damping, 'ship.damping');
  check(CONFIG.ship.invulnTime, 'ship.invulnTime');
  assert.ok(CONFIG.ship.lives >= 1, 'ship.lives');
  check(CONFIG.weapon.fireInterval, 'weapon.fireInterval');
  check(CONFIG.weapon.bulletSpeed, 'weapon.bulletSpeed');
  check(CONFIG.weapon.bulletLife, 'weapon.bulletLife');
  assert.ok(CONFIG.weapon.maxBullets >= 1, 'weapon.maxBullets');
  check(CONFIG.combo.window, 'combo.window');
  assert.ok(CONFIG.combo.capLow >= 1, 'combo.capLow');
  assert.ok(CONFIG.combo.capHigh >= CONFIG.combo.capLow, 'combo.capHigh >= capLow');
  assert.ok(CONFIG.combo.capHighWave >= 1, 'combo.capHighWave');

  assert.ok(CONFIG.combo.step > 0, 'combo.step');
  assert.ok(CONFIG.powerup.dropChance >= 0 && CONFIG.powerup.dropChance <= 1, 'powerup.dropChance in [0,1]');
  check(CONFIG.powerup.magnetAccel, 'powerup.magnetAccel');
});

test('config: asteroid size chain L->M->S with decreasing radius', () => {
  const s = CONFIG.asteroid.sizes;
  assert.ok(s.L.radius > s.M.radius && s.M.radius > s.S.radius, 'radii decrease down the chain');
  assert.equal(s.L.child, 'M');
  assert.equal(s.M.child, 'S');
  assert.equal(s.S.child, null);
  assert.deepEqual(s.S.splits, [], 'small rocks do not split');
  for (const size of Object.values(s)) {
    assert.ok(size.speed[0] > 0 && size.speed[1] >= size.speed[0], `${size} speed range valid`);
    assert.ok(size.score > 0, 'score positive');
  }
  // GDD: smaller rocks score more
  assert.ok(s.S.score > s.M.score && s.M.score > s.L.score, 'score increases as size decreases');
});

test('config: wave ramp values per GDD', () => {
  const w = CONFIG.wave;
  assert.ok(w.base >= 2, 'wave.base');
  assert.ok(w.speedPerWave > 0, 'wave.speedPerWave');
  assert.ok(w.speedCap >= 1, 'wave.speedCap');
  assert.ok(w.maxConcurrentCap >= w.base, 'wave caps consistent');
  assert.ok(w.intermission > 0, 'wave.intermission');
});

test('config: powerup types complete with durations', () => {
  const types = CONFIG.powerup.types;
  for (const t of ['rapid', 'spread', 'shield', 'bomb', 'magnet']) {
    assert.ok(types[t], `missing powerup type: ${t}`);
  }
  assert.ok(types.spread.count >= 2, 'spread needs >=2 shots');
  assert.ok(types.spread.arc > 0, 'spread arc');
});

test('config: fx.bloom values are sane (I35)', () => {
  const b = CONFIG.fx.bloom;
  assert.ok(Number.isFinite(b.strength) && b.strength > 0, 'strength positive finite');
  assert.ok(Number.isFinite(b.radius) && b.radius > 0, 'radius positive finite');
  assert.ok(b.threshold >= 0 && b.threshold <= 1, 'threshold in [0,1]');
});
import { createRecorder, decodeReplay } from '../src/core/replay.js';

test('config: replay section is decoder-compatible (I191/ST-192)', () => {
  const r = CONFIG.replay;
  assert.ok(Number.isInteger(r.quant) && r.quant >= 4 && r.quant <= 1000, 'replay.quant ' + r.quant + ' must stay inside the decoder range 4..1000');
  assert.ok(Number.isInteger(r.maxSteps) && r.maxSteps > 0, 'replay.maxSteps positive int');
  assert.ok(Number.isInteger(r.maxTapeBytes) && r.maxTapeBytes > 0, 'replay.maxTapeBytes positive int');
  assert.ok(Number.isInteger(r.demoLen) && r.demoLen > 0, 'replay.demoLen positive int');
  assert.ok(Number.isInteger(r.demoSeed) && r.demoSeed >= 0 && r.demoSeed <= 0xffffffff, 'replay.demoSeed is a 32-bit seed');
  // config->codec end-to-end: a tape recorded with the live config must decode.
  // If someone sets quant outside the decoder range, this fails even though the
  // codec tests (which pass their own quants) would still pass.
  const rec = createRecorder(r.demoSeed, { quant: r.quant, maxSteps: r.maxSteps, maxTapeBytes: r.maxTapeBytes });
  rec.record({ thrust: { x: 1, y: 0 }, aimPoint: { x: 0.5, y: 0.25 }, firing: true });
  rec.record({ thrust: { x: -1, y: 1 }, aimPoint: null, firing: false });
  const payload = rec.finish({ score: 5, wave: 1, kills: 0, time: 1, mode: 'normal', dailyKey: '' });
  const d = decodeReplay(payload, { maxLen: r.maxSteps });
  assert.ok(d.ok, 'config-driven tape must decode: ' + (d.error || ''));
});

test('config: storage caps and keys are sane (ST-192)', () => {
  const st = CONFIG.storage;
  assert.ok(Number.isInteger(st.highScoresMax) && st.highScoresMax >= 1, 'highScoresMax positive int');
  assert.ok(Number.isInteger(st.replaysMax) && st.replaysMax >= 1, 'replaysMax positive int');
  const keys = [st.bestKey, st.settingsKey, st.highScoresKey, st.replaysKey];
  for (const k of keys) assert.ok(typeof k === 'string' && k.length > 0, 'key non-empty: ' + k);
  assert.equal(new Set(keys).size, keys.length, 'storage keys are distinct');
});


test('config: render.tone - tone pipeline knobs (ST-236)', () => {
  const tone = CONFIG.render.tone;
  assert.ok(tone, 'render.tone exists');
  assert.ok(['none', 'acesFilmic'].includes(tone.mapping), `mapping in [none, acesFilmic], got ${tone.mapping}`);
  assert.ok(Number.isFinite(tone.exposure) && tone.exposure > 0 && tone.exposure <= 4, `exposure in (0,4], got ${tone.exposure}`);
});


test('config: starfield - v6 knot-correlation tunables (ST-334)', () => {
  const sf = CONFIG.starfield;
  assert.ok(sf, 'starfield exists');
  assert.ok(Number.isInteger(sf.seed) && sf.seed >= 0, 'seed is a non-negative int');
  for (const name of ['near', 'far']) {
    const sh = sf[name];
    assert.ok(Number.isInteger(sh.count) && sh.count > 0, name + '.count positive int');
    assert.ok(sh.rMin > 0 && sh.rMin < sh.rMax, name + '.rMin < rMax');
    assert.ok(sh.size > 0, name + '.size > 0');
    assert.ok(sh.opacity > 0 && sh.opacity <= 1, name + '.opacity in (0,1]');
    assert.ok(sh.parallax >= 0 && sh.parallax <= 1, name + '.parallax in [0,1]');
  }
  const kn = sf.knot;
  assert.ok(kn.u >= 0 && kn.u < 1, 'knot.u in [0,1)');
  assert.ok(Math.abs(kn.latDeg) < 90, 'knot.latDeg in (-90,90)');
  assert.ok(kn.sizeUDeg > 0 && kn.sizeLatDeg > 0, 'knot sizes > 0');
  assert.ok(kn.p > 0 && kn.p < 1, 'knot.p in (0,1)');
  assert.ok(kn.bright > 1 && kn.bright <= 1.5, 'knot.bright in (1,1.5]');
  const sec = sf.secondary;
  assert.ok(sec.u >= 0 && sec.u < 1, 'secondary.u in [0,1)');
  assert.ok(Math.abs(sec.latDeg) < 90, 'secondary.latDeg in (-90,90)');
  assert.ok(sec.p >= 0 && sec.p < 1, 'secondary.p in [0,1)');
  assert.ok(sec.bright > 1 && sec.bright <= 1.5, 'secondary.bright in (1,1.5]');
  assert.ok(kn.p + sec.p <= 1, 'mix weights sum <= 1');
});
