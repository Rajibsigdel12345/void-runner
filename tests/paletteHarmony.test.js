// ST-248 (I258): bullet/tracer + explosion palette harmony invariants.
// Pure config data checks (DOM-free): player accent, overdrive heat, player/enemy
// contrast, FX-off luma-delta readability floor, warm ember explosion ramp.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/core/config.js';

const P = CONFIG.fx.palette;

// sRGB hex -> BT.709 gamma-space luma (0-255). Gamma-space on both sides of a
// delta keeps the floor test a conservative proxy for the displayed signal
// (ACES/tone-map is monotone per channel, so the relative ordering holds).
function luma(hex) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function dominantChannel(hex) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const m = Math.max(r, g, b);
  return m === b ? 'b' : m === g ? 'g' : 'r';
}

// ST-177 FX-off reference backgrounds (measured, not guessed):
// - nebula control: 43.9-51.0 luma (I257 bloom-band audit, .evidence/I257/25_bloom_*.png)
// - arena grid bright rings: CONFIG.arena.gridBright (0x1b2a55 -> 41.8)
const NEBULA_LUMA = 51;
const FLOOR = 50; // luma-delta floor a bullet must clear against BOTH backgrounds

test('ST-248: player L1 is the cockpit-cyan accent (bright, cool)', () => {
  const c = P.bulletLevel[0];
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  assert.ok(b >= g && g > r, 'cool cyan family: B >= G > R (0x' + c.toString(16) + ')');
  assert.ok(luma(c) >= 200, 'bright enough to read at kill rate, luma=' + luma(c).toFixed(1));
});

test('ST-248: overdrive heat shift - brighter, hue-preserving per level', () => {
  for (let i = 0; i < 3; i++) {
    const base = P.bulletLevel[i], ov = P.bulletLevelOverdrive[i];
    assert.ok(luma(ov) > luma(base), 'level ' + (i + 1) + ': overdrive luma ' + luma(ov).toFixed(1) + ' > base ' + luma(base).toFixed(1));
    assert.equal(dominantChannel(ov), dominantChannel(base), 'level ' + (i + 1) + ': hue preserved');
  }
});

test('ST-248: player vs enemy bullet contrast (luma separation)', () => {
  const player = luma(P.bulletLevel[0]);
  const enemy = luma(CONFIG.fx.enemyBullet.emissive);
  assert.ok(player - enemy >= 60, 'player ' + player.toFixed(1) + ' - enemy ' + enemy.toFixed(1) + ' >= 60');
});

test('ST-248: FX-off readability floor (ST-177) - bullets clear arena + nebula', () => {
  const bg = Math.max(NEBULA_LUMA, luma(CONFIG.arena.gridBright));
  for (const c of [P.bulletLevel[0], P.bulletLevelOverdrive[0], CONFIG.fx.enemyBullet.emissive]) {
    assert.ok(luma(c) - bg >= FLOOR, 'luma ' + luma(c).toFixed(1) + ' - bg ' + bg.toFixed(1) + ' >= ' + FLOOR);
  }
});

test('ST-248: rock explosion = warm ember ramp (hot core -> deep ember, R>=G>=B)', () => {
  const [core, mid, tail] = P.rock;
  for (const c of P.rock) {
    const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    assert.ok(r >= g && g >= b, 'warm ramp stop 0x' + c.toString(16) + ' is R>=G>=B');
  }
  assert.ok(luma(core) >= 240, 'hot ember core, luma=' + luma(core).toFixed(1));
  assert.ok(luma(tail) <= 130, 'deep ember tail, luma=' + luma(tail).toFixed(1));
  assert.ok(luma(core) > luma(mid) && luma(mid) > luma(tail), 'core > mid > tail');
});

test('ST-248: kill ring is amber (warm, mid-luma accent)', () => {
  const c = P.killRing;
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  assert.ok(r >= g && g >= b, 'amber family');
  const l = luma(c);
  assert.ok(l >= 150 && l <= 200, 'mid-luma accent, luma=' + l.toFixed(1));
});


// ST-249 (I259): pickup + golden/belt read audit post-palette invariants.

test('ST-249: golden kill ring is the brightest kill accent (5x value reads)', () => {
  const l = luma(P.golden[0]);
  assert.ok(l >= 230, 'golden ring bright, luma=' + l.toFixed(1));
  assert.ok(l - luma(P.killRing) >= 40, 'golden ring ' + l.toFixed(1) + ' - killRing ' + luma(P.killRing).toFixed(1) + ' >= 40');
});

test('ST-249: golden burst = saturated gold family (no near-white, R>=G>=B, above rock mid)', () => {
  for (const c of P.golden) {
    const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    assert.ok(r >= g && g >= b, 'gold family 0x' + c.toString(16));
  }
  for (const c of P.golden.slice(1)) {
    const l = luma(c);
    assert.ok(l < 245, 'no near-white stop (white belongs to the bomb), luma=' + l.toFixed(1));
    assert.ok(l >= luma(P.rock[1]), 'brighter than the rock-kill mid stop');
  }
});

test('ST-249: the white-hot zone is bomb + stinger only (golden burst no longer intrudes)', () => {
  const whites = [];
  const scan = (name, vals) => { for (const c of vals) if (luma(c) >= 250) whites.push(name + ' 0x' + c.toString(16)); };
  scan('bomb', P.bomb);
  for (const k of ['rock','golden','mine','drone','stinger','flyer','engine','belt','boss','bossKill','shield','hit','power','graze']) scan(k, P[k]);
  assert.deepEqual(whites, ['bomb 0xffffff', 'stinger 0xffffff'], 'white-hot zone = bomb + stinger telegraph only (golden burst no longer intrudes): ' + whites.join(', '));
});

test('ST-249: pickup orbs clear the FX-off floor (ST-177) with margin', () => {
  const bg = Math.max(NEBULA_LUMA, luma(CONFIG.arena.gridBright));
  for (const [t, c] of Object.entries(P.pickup)) {
    assert.ok(luma(c) - bg >= 59, t + ': luma ' + luma(c).toFixed(1) + ' - bg ' + bg.toFixed(1) + ' >= 59');
  }
});

test('ST-249: belt clink stays cool (B-dominant) - warm/cool separation from the I257 rocks', () => {
  for (const c of P.belt) {
    const r = (c >> 16) & 255, b = c & 255;
    assert.ok(b > r, 'cool steel 0x' + c.toString(16) + ': B ' + b + ' > R ' + r);
  }
});

// ST-251 (I262): player-ship hero palette invariants (CONFIG.ship.palette; E19).
test('ST-251: ship body = warm brass-steel (R>B, mid-luma above the warm rocks)', () => {
  const c = CONFIG.ship.palette.body.color;
  const r = (c >> 16) & 255, b = c & 255;
  assert.ok(r > b, 'warm: R ' + r + ' > B ' + b + ' (0x' + c.toString(16) + ')');
  const l = luma(c);
  assert.ok(l >= 120 && l <= 150, 'mid-luma body, luma=' + l.toFixed(1));
});

test('ST-251: ship wing = dark umber shadow tone (luma 50-80)', () => {
  const l = luma(CONFIG.ship.palette.wing.color);
  assert.ok(l >= 50 && l <= 80, 'dark wing, luma=' + l.toFixed(1));
});

test('ST-251: body vs wing two-tone separation (>= 50 luma)', () => {
  const d = luma(CONFIG.ship.palette.body.color) - luma(CONFIG.ship.palette.wing.color);
  assert.ok(d >= 50, 'body-wing delta ' + d.toFixed(1) + ' >= 50');
});

test('ST-251: cockpit cyan emissive is the FROZEN identity (0x59d8ff)', () => {
  assert.equal(CONFIG.ship.palette.cockpit.emissive, 0x59d8ff, 'identity pin');
});

test('ST-251: ship body clears the enemy-bullet luma zone (>= 20 above 0xff4a2a)', () => {
  const d = luma(CONFIG.ship.palette.body.color) - luma(CONFIG.fx.enemyBullet.emissive);
  assert.ok(d >= 20, 'body ' + luma(CONFIG.ship.palette.body.color).toFixed(1) + ' vs enemy ' + luma(CONFIG.fx.enemyBullet.emissive).toFixed(1) + ', delta ' + d.toFixed(1) + ' >= 20');
});
