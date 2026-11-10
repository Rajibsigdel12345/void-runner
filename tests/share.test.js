// ST-142: shareable result codec - unit tests. LF, node --test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/core/config.js';
import { encodeResult, decodeResult } from '../src/core/share.js';

test('config: share block shape', () => {
  assert.equal(typeof CONFIG.share.magic, 'string');
  assert.ok(CONFIG.share.magic.length > 0, 'magic non-empty');
});

test('round-trip: encode then decode returns the same result', () => {
  const r = { score: 15000, wave: 7, seed: 317547475, kills: 42 };
  const d = decodeResult(encodeResult(r));
  assert.equal(d.ok, true);
  assert.equal(d.score, r.score);
  assert.equal(d.wave, r.wave);
  assert.equal(d.seed, r.seed);
  assert.equal(d.kills, r.kills);
});

test('encode is deterministic (same input -> same string)', () => {
  const r = { score: 123, wave: 3, seed: 999, kills: 5 };
  assert.equal(encodeResult(r), encodeResult(r));
});

test('different results -> different strings', () => {
  const a = encodeResult({ score: 100, wave: 1, seed: 1, kills: 1 });
  const b = encodeResult({ score: 100, wave: 1, seed: 1, kills: 2 });
  assert.notEqual(a, b);
});

test('encoded string is compact and URL-safe (6 dot fields, base36, 2-char checksum)', () => {
  const s = encodeResult({ score: 987654, wave: 20, seed: 0xffffffff, kills: 300 });
  const parts = s.split('.');
  assert.equal(parts.length, 6, 'six dot-separated fields');
  assert.equal(parts[0], 'vr1', 'magic prefix');
  assert.equal(parts[5].length, 2, '2-char checksum');
  for (const p of parts) assert.equal(p, p.replace(/[^0-9a-z]/g, ''), 'base36 charset only: ' + p);
});

test('decode rejects invalid inputs safely', () => {
  assert.equal(decodeResult(null).ok, false);
  assert.equal(decodeResult(123).ok, false);
  assert.equal(decodeResult('').ok, false);
  assert.equal(decodeResult('garbage').ok, false);
  assert.equal(decodeResult('vr2.1.1.1.1.00').ok, false, 'wrong magic');
  const good = encodeResult({ score: 5, wave: 1, seed: 7, kills: 1 });
  const real = good.slice(-2);
  const alt = real === '00' ? '01' : '00';
  assert.equal(decodeResult(good.slice(0, -2) + alt).ok, false, 'corrupted checksum');
});

test('decode rejects uppercase / non-base36 characters', () => {
  const good = encodeResult({ score: 5, wave: 1, seed: 7, kills: 1 });
  assert.equal(decodeResult(good.slice(0, -1) + 'Z').ok, false, 'uppercase rejected');
  const spaced = good.replace(/./g, (m, i) => (i === 5 ? ' ' : m));
  assert.equal(decodeResult(spaced).ok, false, 'space rejected');
});

test('edge: zero score / zero seed / min wave round-trip', () => {
  const d = decodeResult(encodeResult({ score: 0, wave: 1, seed: 0, kills: 0 }));
  assert.deepEqual(d, { ok: true, seed: 0, score: 0, wave: 1, kills: 0 });
});

test('edge: large seed/score round-trip (32-bit seed, big score)', () => {
  const r = { score: 123456789, wave: 50, seed: 4294967295, kills: 999 };
  assert.deepEqual(decodeResult(encodeResult(r)), { ok: true, seed: r.seed, score: r.score, wave: r.wave, kills: r.kills });
});

test('decode rejects a wrong-magic string', () => {
  const s = encodeResult({ score: 5, wave: 1, seed: 7, kills: 1 });
  const parts = s.split('.');
  const body = ['vr9', parts[1], parts[2], parts[3], parts[4]].join('.');
  assert.equal(decodeResult(body + '.' + parts[5]).ok, false);
});
