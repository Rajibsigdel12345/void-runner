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
