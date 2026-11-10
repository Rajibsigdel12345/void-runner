// I194: security audit - untrusted-input totality tests (ST-194). node --test.
// Pins the audit claim that every decoder on the untrusted-input path (pasted
// share codes, tampered localStorage blobs, forged replay payloads) is TOTAL:
// it never throws, it never mutates Object.prototype, and it returns only
// well-typed values. Deterministic: all junk comes from a seeded RNG (ST-193 rule).
import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeResult } from '../src/core/share.js';
import { decodeReplay } from '../src/core/replay.js';
import { migratePayload } from '../src/core/storage.js';
import { RNG } from '../src/core/rng.js';

const rng = new RNG(194);
const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
function junkB36(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += B36[rng.int(0, 35)] + (rng.chance(0.2) ? '.' : '');
  return s;
}

test('decodeResult: never throws on adversarial strings, always typed', () => {
  const cases = [
    junkB36(64),
    junkB36(1024),
    junkB36(1024 * 1024),
    'vr1.9999999999999999999999999999999999.1.1.1.00',
    '...'.repeat(100000),
    String.fromCharCode(0xfffd).repeat(1000),
    JSON.stringify({ deep: { a: 1 } }),
    '<script>alert(1)</script>',
    'vr1.1.1.1.1.00'.repeat(50),
  ];
  for (const c of cases) {
    let r;
    assert.doesNotThrow(() => { r = decodeResult(c); }, 'must not throw: ' + c.slice(0, 40));
    assert.equal(typeof r.ok, 'boolean');
    if (r.ok) {
      for (const k of ['seed', 'score', 'wave', 'kills']) {
        assert.ok(Number.isInteger(r[k]), k + ' is integer: ' + c.slice(0, 40));
        assert.ok(r[k] >= 0, k + ' non-negative');
        assert.ok(k === 'seed' ? r[k] <= 0xffffffff : r[k] <= 0x7fffffff, k + ' in range');
      }
    }
  }
});

test('decodeResult: non-string inputs rejected without throwing', () => {
  for (const v of [undefined, null, 0, 1e100, {}, [], true, /re/, new Map()]) {
    let r;
    assert.doesNotThrow(() => { r = decodeResult(v); });
    assert.equal(r.ok, false, 'non-string rejected: ' + String(v));
  }
});

test('decodeReplay: never throws on adversarial payloads, always typed', () => {
  const tape3 = [[1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0]];
  const cases = [
    null, undefined, 'string', 42, [], NaN, true,
    {},
    { v: 'x' },
    { v: 2 },
    { v: 1, kind: 'evil' },
    { v: 1, kind: 'tape', seed: 3.5, len: 3, q: 10, tape: tape3 },
    { v: 1, kind: 'tape', seed: -9, len: 3, q: 10, tape: tape3 },
    { v: 1, kind: 'tape', seed: 2 ** 40, len: 3, q: 10, tape: tape3 },
    { v: 1, kind: 'tape', seed: 42, len: 0, q: 10, tape: [] },
    { v: 1, kind: 'tape', seed: 42, len: 99999999, q: 10, tape: [] },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 3, tape: tape3 },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 1001, tape: tape3 },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: NaN, tape: tape3 },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: 'nope' },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: null },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: [[1, 0, 0, 0, 0, 0]] },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: [[1, 0, 0, 0, 0, 0, 0, 9]] },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: ['junk', 0, 0, 0, 0, 0, 0] },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: [[0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0, 0]] },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: [[1, -401, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0]] },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: [[1, 0, 0, 2, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0]] },
    { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: [[1, 0, 0, 0, 0, 0, 0.5], [1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0]] },
    { v: 1, kind: 'tape', seed: 42, len: 4, q: 10, tape: tape3 },
    Object.assign(Object.create(null), { v: 1, kind: 'tape', seed: 42, len: 3, q: 10, tape: tape3 }),
  ];
  for (const c of cases) {
    let r;
    assert.doesNotThrow(() => { r = decodeReplay(c); }, 'must not throw');
    assert.equal(typeof r.ok, 'boolean');
    assert.ok(!r.ok || (r.ok && r.data && typeof r.data === 'object'), 'typed result');
  }
});

test('decodeReplay: prototype-pollution payload rejected cleanly, no leak', () => {
  const raw = JSON.parse('{"v":1,"kind":"demo","seed":7,"len":10,"__proto__":{"polluted":true}}');
  let r;
  assert.doesNotThrow(() => { r = decodeReplay(raw); });
  assert.equal(Object.prototype.polluted, undefined, 'Object.prototype not polluted');
  assert.equal({}.polluted, undefined, 'plain object not polluted');
});

test('decodeReplay: tampered meta is sanitized (no NaN/Infinity/unknown mode leaks)', () => {
  const r = decodeReplay({ v: 1, kind: 'demo', seed: 7, len: 100, meta: { score: NaN, wave: Infinity, time: -1, mode: 'evil', dailyKey: 'a'.repeat(99) } });
  assert.equal(r.ok, true, 'demo kind with sanitizable meta decodes');
  assert.equal(r.data.meta.score, 0);
  assert.equal(r.data.meta.wave, 0);
  assert.equal(r.data.meta.time, 0);
  assert.equal(r.data.meta.mode, 'normal');
  assert.equal(r.data.meta.dailyKey, '');
});

test('decodeReplay: legitimate max-size tape (72000 one-step entries) accepted', () => {
  const tape = [];
  for (let i = 0; i < 72000; i++) tape.push([1, 0, 0, 0, 0, 0, 0]);
  const r = decodeReplay({ v: 1, kind: 'tape', seed: 1, len: 72000, q: 1000, meta: {}, tape });
  assert.equal(r.ok, true);
  assert.equal(r.data.len, 72000);
});

test('migratePayload: never throws, rejects corrupt/future versions and non-objects', () => {
  for (const [v, d] of [
    [null, null],
    ['junk', {}],
    [1.5, {}],
    [-1, {}],
    [0, {}],
    [999999, {}],
    [NaN, {}],
    [1, null],
    [1, 'str'],
    [1, []],
    [1, 42],
    [1, true],
  ]) {
    let r;
    assert.doesNotThrow(() => { r = migratePayload(v, d); }, 'must not throw: v=' + v);
    assert.equal(r, null, 'rejected: v=' + v);
  }
  assert.deepEqual(migratePayload(null, { best: 5 }), { best: 5 }, 'null version defaults to v1');
  assert.deepEqual(migratePayload(1, { best: 5, settings: { sound: false } }), { best: 5, settings: { sound: false } });
});

test('no Object.prototype pollution after the whole battery', () => {
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.prototype.score, undefined);
  assert.equal({}.polluted, undefined);
});
