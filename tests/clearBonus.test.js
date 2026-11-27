// I631 (ST-590, E92 D2): clear reward beat - a true wave clear pays a flat, capped score
// bonus (ST-053 flat, ST-057 overdrive parity via bonus()); stall/grace advances (I42/I630)
// never pay. The event carries the bonus for the banner sub-line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const DT = 1 / 60;
const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };
const CB = CONFIG.wave.clearBonus;

function freshWorld(seed) { const w = new World(new RNG(seed)); w.begin(); return w; }

function forceActiveWave(w, wave) {
  w.waves.wave = wave; w.waves.state = 'active'; w.waves.toSpawn = 0;
  w.waves.waveElapsed = 0; w.waves.leftoverT = 0;
}

function clearedEvent(w) {
  for (let i = w.events.length - 1; i >= 0; i--) if (w.events[i].type === 'waveCleared') return w.events[i].data;
  return null;
}

test('clearBonus: a true clear pays the flat capped formula into the score (I631)', () => {
  const w = freshWorld(7101);
  forceActiveWave(w, 5);
  const before = w.score;
  w.step(DT, NOINTENT);
  const e = clearedEvent(w);
  assert.ok(e, 'waveCleared emitted');
  assert.equal(e.n, 5);
  const expect = Math.min(CB.cap, CB.base + CB.perWave * 5); // 275, below cap
  assert.ok(expect < CB.cap, 'test premise: wave 5 is under the cap');
  assert.equal(e.bonus, expect, 'mid-wave formula in the event');
  assert.equal(w.score, before + expect, 'bonus lands via scoreKeeper.bonus');
});

test('clearBonus: the formula caps at cap (I631)', () => {
  const w = freshWorld(7102);
  forceActiveWave(w, 20);
  const before = w.score;
  w.step(DT, NOINTENT);
  const e = clearedEvent(w);
  assert.ok(e, 'waveCleared emitted');
  const raw = CB.base + CB.perWave * 20; // 650, above the cap
  assert.ok(raw > CB.cap, 'test premise: wave 20 is past the cap crossing');
  assert.equal(e.bonus, CB.cap, 'capped bonus in the event');
  assert.equal(w.score, before + CB.cap, 'capped bonus in the score');
});

test('clearBonus: the grace/stall advance pays NO bonus and emits NO clear (I631)', () => {
  const w = freshWorld(7103);
  forceActiveWave(w, 5);
  for (const p of [[12, 12], [-12, 12], [12, -12]]) {
    const r = w.field.spawn('S', 1, { x: p[0], y: p[1] }); // signature verified vs tests/bombGenBonus.test.js
    r.vel = v2(0, 0);
    r.spin = 0;
  }
  assert.equal(w.field.killableCount, 3, 'three killable stragglers');
  let advanced = 0;
  for (let i = 0; i < Math.ceil((CONFIG.wave.stallTime + 0.5) / DT) + 4; i++) {
    const bl = w.events.length;
    w.step(DT, NOINTENT);
    const adv = w.events.slice(bl).find(ev => ev.type === 'wave' && ev.data.n === 6); // stall advance -> same 'wave' banner flow (game.js L255-257); later events (weaponLevelUp etc.) follow on the same tick
    if (adv) { advanced = adv.data.n; break; }
  }
  assert.equal(advanced, 6, 'the 45 s stall wall advanced the wave (grace cannot fire at 3 > max 2)');
  assert.equal(clearedEvent(w), null, 'no waveCleared event on a stall advance');
  assert.equal(w.score, 0, 'no bonus on a stall advance');
});
