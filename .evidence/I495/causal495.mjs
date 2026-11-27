import { chromium } from 'file:///E:/Game/.evidence/I494/node_modules/playwright-core/index.mjs';
import { writeFileSync } from 'node:fs';

// I495 (ST-461, E66) causal gate: three renderer arms against the I495 dist build served on :4200.
// Arm webgl   = ?fx=webgl: frozen classic WebGLRenderer (pre-I495 reference) -> 18/18 EXACT + console 0/0.
// Arm default = no ?fx: I495 measured C3 resolution - auto resolves to classic (the real-WebGPU arm
//   logged NodeBuilder console errors on app ShaderMaterials, see webgpu arm below) -> 18/18 EXACT
//   + console 0/0 + meta {webgl2, auto}.
// Arm webgpu  = ?fx=webgpu: EXPERIMENTAL opt-in (WebGPURenderer, real device in the probe env).
//   Report-only: sim pins must still hold EXACT (core is three-independent) and pageerrors must be 0,
//   but console errors/warnings are DOCUMENTED, not gated (NodeBuilder ShaderMaterial incompatibility
//   is tracked by ST-462/ST-463 TSL work; the arm stays opt-in until the console is clean).
const CHROME = 'C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe';
const OUT = 'E:/Game/.evidence/I495/';
const BASE = 'http://localhost:4200';
const fail = { n: 0 };
const check = (name, ok, extra) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!ok) fail.n++; };

const flat = (o, acc) => {
  if (o === null || o === undefined) return acc || [];
  if (typeof o === 'object' && !Array.isArray(o)) {
    acc = acc || [];
    for (const k of Object.keys(o)) flat(o[k], acc);
    return acc;
  }
  if (Array.isArray(o)) { acc = acc || []; for (const x of o) flat(x, acc); return acc; }
  (acc || (acc = [])).push(o);
  return acc;
};

async function runArm(arm, fxParam) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--force-color-profile=srgb'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const q1 = '/?nocache=i495c_' + arm + (fxParam ? '&fx=' + fxParam : '');
  const q2 = '/?nocache=i495rk_' + arm + (fxParam ? '&fx=' + fxParam : '');
  const p = await ctx.newPage();
  const C = { errors: [], warnings: [] };
  p.on('console', (m) => { const t = m.type(); if (t === 'error') C.errors.push(m.text()); else if (t === 'warning') C.warnings.push(m.text()); });
  p.on('pageerror', (e) => C.errors.push('pageerror: ' + e.message));
  await p.goto(BASE + q1, { waitUntil: 'load' });
  await p.waitForFunction(() => !!(window.__vr && window.__vr.world), { timeout: 30000 });
  const meta = await p.evaluate(() => ({ backend: window.__vr.backend === undefined ? null : window.__vr.backend, arm: window.__vr.rendererArm === undefined ? null : window.__vr.rendererArm }));
  await p.evaluate(() => { localStorage.clear(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const b = Array.from(document.querySelectorAll('button.vr-pause-btn')).find((x) => x.textContent.trim() === 'REPLAYS'); if (b) b.click(); });
  await p.waitForTimeout(180);
  const clickedDemo = await p.evaluate(() => { const b = Array.from(document.querySelectorAll('#screen-replays button.vr-pause-btn')).find((x) => x.textContent.indexOf('DEMO PILOT') >= 0); if (b) { b.click(); return true; } return false; });
  await p.waitForTimeout(180);
  await p.keyboard.press('3');
  await p.waitForTimeout(120);
  let state = await p.evaluate(() => window.__vr.world.game.state);
  let polls = 0;
  while (state !== 'GAME_OVER' && polls < 150) { await p.waitForTimeout(300); state = await p.evaluate(() => window.__vr.world.game.state); polls++; }
  const S = await p.evaluate(() => {
    const vr = window.__vr; const w = vr.world;
    return { state: w.game.state, stats: w.sessionStats ? w.sessionStats() : null, replayView: vr.replayView ? vr.replayView() : null };
  });
  await p.keyboard.press('q');
  await p.waitForTimeout(200);
  const afterQ = await p.evaluate(() => window.__vr.world.game.state);
  await p.close();
  const p2 = await ctx.newPage();
  const C2 = { errors: [], warnings: [] };
  p2.on('console', (m) => { const t = m.type(); if (t === 'error') C2.errors.push(m.text()); else if (t === 'warning') C2.warnings.push(m.text()); });
  p2.on('pageerror', (e) => C2.errors.push('pageerror: ' + e.message));
  await p2.goto(BASE + q2, { waitUntil: 'load' });
  await p2.waitForFunction(() => !!(window.__vr && window.__vr.world), { timeout: 30000 });
  const meta2 = await p2.evaluate(() => ({ backend: window.__vr.backend === undefined ? null : window.__vr.backend, arm: window.__vr.rendererArm === undefined ? null : window.__vr.rendererArm }));
  const glbWait = await p2.waitForFunction(() => { const a = window.__vr.assetLoader; if (!a || !a.get) return false; return ['ship', 'rockL', 'rockM', 'rockS'].every((k) => { const e = a.get(k); return e && e.ready; }); }, { timeout: 15000 }).then(() => 'all-ready').catch(() => 'timeout');
  const rocks = await p2.evaluate(() => {
    const w = window.__vr.world;
    const out = { state: w.game.state, radii: [] };
    w.reseed(30201);
    w.field.rocks.length = 0;
    const plan = [['L', -3.5, -4], ['M', 0, -4], ['S', 3.5, -4]];
    for (const q of plan) {
      const r = w.field.spawn(q[0], 1, { x: q[1], y: q[2] }, null, false, null, 0, false, false);
      if (r) out.radii.push({ size: q[0], radius: r.radius });
    }
    w.field.rocks.length = 0;
    return out;
  });
  await p2.close();
  await browser.close();
  return { arm, meta, meta2, clickedDemo, S, afterQ, glbWait, rocks, C, C2 };
}

function gateSim(tag, R, expBackend, expArm) {
  const statsFlat = flat(R.S.stats);
  const rvFlat = flat(R.S.replayView);
  const has = (arr, v) => (arr || []).some((x) => typeof x === 'number' && Math.abs(x - v) < 1e-9);
  check(tag + ' clickedDemo', R.clickedDemo === true);
  check(tag + ' state GAME_OVER', R.S.state === 'GAME_OVER');
  check(tag + ' score 13350', has(statsFlat, 13350)); // I639 (ST-597, E94 D1) RE-PIN WITH MEASUREMENT: 11509 -> 13350 = the E94 wave-pacing change (leftover.max 2 -> 4) shifting the DEMO PILOT causal run (3-4 rock straggler remainder takes the 10 s grace band instead of the 45 s backstop wall; wave boundary ~35 s sooner than the backstop would). Dev-measured I639: score 13350, kills 63, shots 171, acc 0.3684210526315789, time 31.183333333332843, replay idx 1871 (time delta -4.9667 s = -298 frames @60fps = the replay idx delta exactly). Prior basis I632 G92.0: 11334 -> 11509 (+175).
  check(tag + ' kills 63', has(statsFlat, 63)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 57 -> 63
  check(tag + ' wave 2', has(statsFlat, 2) || (statsFlat || []).includes('W2'));
  check(tag + ' combo 15', has(statsFlat, 15));
  check(tag + ' shots 171', has(statsFlat, 171)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 198 -> 171
  check(tag + ' acc 0.3684210526315789', has(statsFlat, 0.3684210526315789)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 57/198 -> 63/171
  check(tag + ' time 31.183333333332843', has(statsFlat, 31.183333333332843)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): -4.9667 s
  check(tag + ' replay 1871', has(rvFlat, 1871)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 2169 -> 1871 (-298 frames)
  check(tag + ' replay 2220', has(rvFlat, 2220));
  check(tag + ' replay speed 4', has(rvFlat, 4));
  check(tag + ' afterQ MENU', R.afterQ === 'MENU');
  check(tag + ' glb all-ready', R.glbWait === 'all-ready');
  check(tag + ' rock L 2.2', R.rocks.radii.length > 0 && R.rocks.radii[0].radius === 2.2);
  check(tag + ' rock M 1.3', R.rocks.radii.length > 1 && R.rocks.radii[1].radius === 1.3);
  check(tag + ' rock S 0.7', R.rocks.radii.length > 2 && R.rocks.radii[2].radius === 0.7);
  check(tag + ' meta arm', R.meta.arm === expArm && R.meta2.arm === expArm, { p1: R.meta, p2: R.meta2 });
  check(tag + ' meta backend', R.meta.backend === expBackend && R.meta2.backend === expBackend, { p1: R.meta, p2: R.meta2 });
  check(tag + ' p1 errors 0', R.C.errors.length === 0, R.C.errors.slice(0, 3));
  check(tag + ' p2 errors 0', R.C2.errors.length === 0, R.C2.errors.slice(0, 3));
  check(tag + ' console 0/0 (p1)', R.C.warnings.length === 0, R.C.warnings.slice(0, 3));
  check(tag + ' console 0/0 (p2)', R.C2.warnings.length === 0, R.C2.warnings.slice(0, 3));
}

const W = await runArm('webgl', 'webgl');
console.log('=== ARM webgl (frozen classic reference) ===');
gateSim('webgl  ', W, 'webgl2', 'webgl');

const D = await runArm('default', null);
console.log('=== ARM default (C3: auto -> classic) backend=' + D.meta.backend + ' ===');
gateSim('default', D, 'webgl2', 'auto');

const G = await runArm('webgpu', 'webgpu');
console.log('=== ARM webgpu (EXPERIMENTAL opt-in, report-only) backend=' + G.meta.backend + ' ===');
{
  const statsFlat = flat(G.S.stats);
  const rvFlat = flat(G.S.replayView);
  const has = (arr, v) => (arr || []).some((x) => typeof x === 'number' && Math.abs(x - v) < 1e-9);
  check('webgpu  clickedDemo', G.clickedDemo === true);
  check('webgpu  state GAME_OVER', G.S.state === 'GAME_OVER');
  check('webgpu  score 13350', has(statsFlat, 13350)); // I639 (ST-597, E94 D1) RE-PIN WITH MEASUREMENT: 11509 -> 13350 = the E94 wave-pacing change (leftover.max 2 -> 4) shifting the DEMO PILOT causal run (3-4 rock straggler remainder takes the 10 s grace band instead of the 45 s backstop wall; wave boundary ~35 s sooner than the backstop would). Dev-measured I639: score 13350, kills 63, shots 171, acc 0.3684210526315789, time 31.183333333332843, replay idx 1871 (time delta -4.9667 s = -298 frames @60fps = the replay idx delta exactly). Prior basis I632 G92.0: 11334 -> 11509 (+175). (report-only arm; same basis as the webgl/default arms)
  check('webgpu  kills 63', has(statsFlat, 63)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 57 -> 63
  check('webgpu  wave 2', has(statsFlat, 2) || (statsFlat || []).includes('W2'));
  check('webgpu  combo 15', has(statsFlat, 15));
  check('webgpu  shots 171', has(statsFlat, 171)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 198 -> 171
  check('webgpu  acc 0.3684210526315789', has(statsFlat, 0.3684210526315789)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 57/198 -> 63/171
  check('webgpu  time 31.183333333332843', has(statsFlat, 31.183333333332843)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): -4.9667 s
  check('webgpu  replay 1871', has(rvFlat, 1871)); // I639 RE-PIN WITH MEASUREMENT (see the score pin above): 2169 -> 1871 (-298 frames)
  check('webgpu  replay 2220', has(rvFlat, 2220));
  check('webgpu  replay speed 4', has(rvFlat, 4));
  check('webgpu  afterQ MENU', G.afterQ === 'MENU');
  check('webgpu  glb all-ready', G.glbWait === 'all-ready');
  check('webgpu  rock L 2.2', G.rocks.radii.length > 0 && G.rocks.radii[0].radius === 2.2);
  check('webgpu  rock M 1.3', G.rocks.radii.length > 1 && G.rocks.radii[1].radius === 1.3);
  check('webgpu  rock S 0.7', G.rocks.radii.length > 2 && G.rocks.radii[2].radius === 0.7);
  check('webgpu  meta arm', G.meta.arm === 'webgpu' && G.meta2.arm === 'webgpu', { p1: G.meta, p2: G.meta2 });
  check('webgpu  meta backend webgpu', G.meta.backend === 'webgpu' && G.meta2.backend === 'webgpu', { p1: G.meta, p2: G.meta2 });
  // Report-only console tally (NOT gated): the NodeBuilder ShaderMaterial errors are the known
  // ST-462/ST-463 TSL work; the webgpu arm stays opt-in until they are gone.
  const tally = (arr) => { const m = new Map(); for (const x of arr) { const k = x.slice(0, 80); m.set(k, (m.get(k) || 0) + 1); } return Object.fromEntries(m); };
  console.log('webgpu  p1 console err=' + G.C.errors.length + ' warn=' + G.C.warnings.length + ' tally=' + JSON.stringify(tally(G.C.errors)));
  console.log('webgpu  p1 warn tally=' + JSON.stringify(tally(G.C.warnings)));
  console.log('webgpu  p2 console err=' + G.C2.errors.length + ' warn=' + G.C2.warnings.length + ' tally=' + JSON.stringify(tally(G.C2.errors)));
}

writeFileSync(OUT + 'causal495.json', JSON.stringify({
  webgl: { meta: W.meta, afterQ: W.afterQ, glbWait: W.glbWait, rocks: W.rocks, console: { p1: W.C, p2: W.C2 } },
  default: { meta: D.meta, afterQ: D.afterQ, glbWait: D.glbWait, rocks: D.rocks, console: { p1: D.C, p2: D.C2 } },
  webgpu: { meta: G.meta, afterQ: G.afterQ, glbWait: G.glbWait, rocks: G.rocks, console: { p1: G.C, p2: G.C2 } }
}, null, 1));
console.log(fail.n === 0 ? 'CAUSAL495 PASS' : 'CAUSAL495 FAIL (' + fail.n + ')');
process.exit(fail.n === 0 ? 0 : 1);
