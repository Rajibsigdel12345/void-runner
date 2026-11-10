// Void Runner - replay capture/playback codec (ST-190 / I190). Pure: no DOM, no three.
//
// A replay is a small self-describing payload. Two kinds:
//   kind 'tape'  - a quantized, RLE-compressed recording of the player's intent per substep
//   kind 'demo'  - the built-in DEMO PILOT: the canonical I076 deterministic script, run live
//
// Quantization: world positions are stored in 1/quant units (quant = 25 -> 1/25 resolution)
// clamped to +/-40*quant so a tampered tape can never carry a runaway coordinate into the sim.
//
// RLE tape entry = [n, tx, ty, a, ax, ay, f]:
//   n    - how many consecutive substeps share the same quantized intent
//   tx,ty- quantized thrust
//   a    - 0/1 aim-valid flag (1 => (ax,ay) is a real aim point; 0 => aim = null,
//          which disambiguates "no aim" from "aim at (0,0)")
//   ax,ay- quantized aim point (only meaningful when a === 1)
//   f    - 0/1 firing
//
// The codec is strict: decodeReplay() rejects anything not well-formed so a tampered
// localStorage blob can never drive the sim with a runaway seed / length / intent.

export const REPLAY_VERSION = 1;

const Q_DEFAULT = 25;     // 1/quant world-unit resolution
const CLAMP = 40;         // clamp quantized coords to +/-40*quant world units
const ENTRY_LEN = 7;      // [n, tx, ty, a, ax, ay, f]

function clampQ(v, q) {
  const m = CLAMP * q;
  const iv = Number.isFinite(v) ? Math.round(v) : 0;
  return Math.max(-m, Math.min(m, iv));
}

/** Quantize a raw intent {thrust:{x,y}, aimPoint:{x,y}|null, firing} -> [tx,ty,a,ax,ay,f]. */
export function quantizeIntent(intent, q = Q_DEFAULT) {
  const t = intent && intent.thrust ? intent.thrust : { x: 0, y: 0 };
  const a = intent && intent.aimPoint ? intent.aimPoint : null;
  const hasAim = !!(a && (Number.isFinite(a.x) || Number.isFinite(a.y)));
  return [
    clampQ((t.x || 0) * q, q),
    clampQ((t.y || 0) * q, q),
    hasAim ? 1 : 0,
    hasAim ? clampQ((a.x || 0) * q, q) : 0,
    hasAim ? clampQ((a.y || 0) * q, q) : 0,
    intent && intent.firing ? 1 : 0,
  ];
}

/** Expand a quantized [tx,ty,a,ax,ay,f] back to a raw intent. */
export function dequantizeIntent(e, q = Q_DEFAULT) {
  const [tx, ty, a, ax, ay, f] = e;
  return {
    thrust: { x: tx / q, y: ty / q },
    aimPoint: a ? { x: ax / q, y: ay / q } : null,
    firing: !!f,
  };
}

/**
 * Build an RLE recorder. record(intent) run-length-compresses consecutive identical
 * quantized intents; finish(meta) freezes it into a 'tape' payload. Bounded by maxSteps
 * and maxBytes (both set the truncated flag once exceeded).
 */
export function createRecorder(seed, opts = {}) {
  const q = opts.quant || Q_DEFAULT;
  const maxSteps = opts.maxSteps || 72000;
  const maxBytes = opts.maxTapeBytes || 700000;
  const tape = [];
  let steps = 0;
  let truncated = false;
  let lastKey = null;
  let sizeEst = 0;

  function record(intent) {
    if (truncated) return;
    if (steps >= maxSteps) { truncated = true; return; }
    const e = quantizeIntent(intent, q);
    const key = e.join(',');
    if (key === lastKey && tape.length > 0) {
      tape[tape.length - 1][0] += 1; // extend the run
    } else {
      tape.push([1, e[0], e[1], e[2], e[3], e[4], e[5]]);
      sizeEst += ENTRY_LEN * 8 + 4; // ~24 chars/entry + array delimiters
    }
    lastKey = key;
    steps += 1;
    if (sizeEst > maxBytes) truncated = true; // kept this entry; stop at the next
  }

  function finish(meta) {
    return { v: REPLAY_VERSION, kind: 'tape', seed, len: steps, q, truncated, meta: meta || {}, tape };
  }

  return { record, finish, get length() { return steps; }, get truncated() { return truncated; } };
}

/**
 * The built-in DEMO PILOT: the canonical I076 deterministic script (oscillating thrust,
 * always firing, aim the nearest live rock). Pure - driven by (world, substepIndex).
 * Shared by the in-menu demo replay and the determinism harness.
 */
export function pilotIntent(world, i) {
  let nearest = null;
  let best = Infinity;
  for (const r of world.field.rocks) {
    if (r.dead) continue;
    const dx = r.pos.x - world.ship.pos.x;
    const dy = r.pos.y - world.ship.pos.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) { best = d2; nearest = r; }
  }
  return {
    thrust: { x: Math.cos(i * 0.013) * 0.8, y: Math.sin(i * 0.011) * 0.8 },
    aimPoint: nearest ? { x: nearest.pos.x, y: nearest.pos.y } : null,
    firing: true,
  };
}

/** A built-in demo replay payload (plays the canonical pilot live from seed for len substeps). */
export function demoReplay(seed, len) {
  return {
    v: REPLAY_VERSION, kind: 'demo', seed, len,
    meta: { score: 0, wave: 0, kills: 0, time: 0, mode: 'demo' },
  };
}

/**
 * Build a player for a decoded replay -> { length, intent(world, i) }.
 *   demo: drives the canonical pilotIntent live (neutral intent past the end).
 *   tape: expands the RLE entries into a per-substep intent (neutral intent past the end).
 */
export function createPlayer(data) {
  if (!data) throw new Error('createPlayer: no data');
  const neutral = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
  if (data.kind === 'demo') {
    const len = data.len;
    return {
      length: len,
      intent: (world, i) => (i < len ? pilotIntent(world, i) : neutral),
    };
  }
  const q = data.q;
  const steps = [];
  for (const entry of data.tape) {
    const n = entry[0];
    for (let k = 0; k < n; k++) steps.push(dequantizeIntent(entry.slice(1), q)); // entry[0] is the run length
  }
  const len = steps.length;
  return { length: len, intent: (world, i) => (i < len ? steps[i] : neutral) };
}

function isInt(v) { return Number.isInteger(v); }

/** Coerce + clamp the meta block so a tampered blob cannot push NaN/huge values into the HUD. */
function sanitizeMeta(meta) {
  const m = (meta && typeof meta === 'object') ? meta : {};
  const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0);
  const mode = ['normal', 'daily', 'demo'].includes(m.mode) ? m.mode : 'normal';
  const dailyKey = (typeof m.dailyKey === 'string' && m.dailyKey.length <= 16) ? m.dailyKey : '';
  return { score: num(m.score), wave: num(m.wave), kills: num(m.kills), time: num(m.time), mode, dailyKey };
}

/**
 * Validate + sanitize a raw replay payload. Returns {ok:true, data} or {ok:false, error}.
 * Strict: version, kind, seed (32-bit int), len (1..maxLen), quant (4..1000), and (for tape)
 * every entry being 7 ints within the clamp with matching run total.
 */
export function decodeReplay(obj, opts = {}) {
  const maxLen = opts.maxLen || 72000;
  if (!obj || typeof obj !== 'object') return { ok: false, error: 'not an object' };
  if (obj.v !== REPLAY_VERSION) return { ok: false, error: 'bad version' };
  if (obj.kind !== 'tape' && obj.kind !== 'demo') return { ok: false, error: 'bad kind' };
  if (!isInt(obj.seed) || obj.seed < -2147483648 || obj.seed > 2147483647) return { ok: false, error: 'bad seed' };
  if (!isInt(obj.len) || obj.len < 1 || obj.len > maxLen) return { ok: false, error: 'bad len' };

  const meta = sanitizeMeta(obj.meta);

  if (obj.kind === 'demo') {
    return { ok: true, data: { v: REPLAY_VERSION, kind: 'demo', seed: obj.seed, len: obj.len, meta } };
  }

  // kind 'tape'
  const q = obj.q;
  if (!isInt(q) || q < 4 || q > 1000) return { ok: false, error: 'bad quant' };
  if (!Array.isArray(obj.tape)) return { ok: false, error: 'no tape' };
  const clamp = CLAMP * q;
  let total = 0;
  for (const e of obj.tape) {
    if (!Array.isArray(e) || e.length !== ENTRY_LEN) return { ok: false, error: 'bad entry len' };
    const [n, tx, ty, a, ax, ay, f] = e;
    if (!isInt(n) || n < 1) return { ok: false, error: 'bad run n' };
    for (const v of [tx, ty, ax, ay]) {
      if (!isInt(v) || v < -clamp || v > clamp) return { ok: false, error: 'bad coord' };
    }
    if (a !== 0 && a !== 1) return { ok: false, error: 'bad aim flag' };
    if (f !== 0 && f !== 1) return { ok: false, error: 'bad fire flag' };
    total += n;
  }
  if (total !== obj.len) return { ok: false, error: 'tape length mismatch' };

  return {
    ok: true,
    data: { v: REPLAY_VERSION, kind: 'tape', seed: obj.seed, len: obj.len, q, truncated: obj.truncated === true, meta, tape: obj.tape },
  };
}
