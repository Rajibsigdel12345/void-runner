// I520 (ST-486, E69) zone-palette rendered-luma + hue audit - L4 "Necro Reef" reef-1..4 backdrops.
// I480/I519 method. Measures the PURE backdrop (skybox + theme-dome tint + grid/floor) with every
// dynamic actor + stars + arena ring hidden, per reef palette (2 frames each: sky + floor), and
// settles the R4 palette decision (a) vs (b) WITH MEASUREMENT:
//   A1  (a) deep-teal candidate lands dhue <= 12 from the debris-1/debris-4 0x2dd4bf accents (config comment claim).
//   A2  (b) reef accents clear the L1 "Debris Field" accent band (150.7..193.6 deg) by > 40 deg.
//   A3  E57 rule-1 AND test (collision iff dluma <= 10 AND dhue <= 40): 0 collisions for reef accents
//       vs co-occurring / ladder identities (drift-2..4, ember-1..4 accents + the L4 abyssal boss hull).
//   A4  rendered stats finite (no NaN).
//   A5  consoleErrors === 0 (browser smoke, quality-bar gate 3).
// Cross-level boss hulls (monolith 0x7a4dff / prime 0xd9a441 / splicer 0x2dd4bf) never render
// concurrently with a reef palette (reef = L4-only; each hull = its own level; endless = drift/ember),
// so they are reported WITH MEASUREMENT as reference margins, not gated.
// Usage: node .evidence/I520/zone_palette_audit520.mjs   -> writes luma_i520.json
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I520/";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5173";
const REEF = ["reef-1", "reef-2", "reef-3", "reef-4"];
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const consoleErrs = [];
p.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });
p.on("pageerror", (e) => consoleErrs.push(String(e)));
await p.goto(BASE + "/?nocache=i520a", { waitUntil: "load" });
await p.waitForFunction(() => { const vr = window.__vr; if (!vr || !vr.assetLoader) return false; return ["rockL","rockM","rockS","ship","boss"].every((k) => { const e = vr.assetLoader.get(k); return e && e.ready; }); }, { timeout: 60000 });
for (let i = 0; i < 6; i++) { const cur = await p.evaluate(() => window.__vr.liveSettings().fx); if (cur === "high") break; await p.keyboard.press("f"); await p.waitForTimeout(120); }
const res = await p.evaluate(async () => {
  const vr = window.__vr;
  const REEF = ["reef-1", "reef-2", "reef-3", "reef-4"];
  const W = 1280, H = 720;
  // -- hide every dynamic actor (pure backdrop measurement) --
  for (const arr of [vr.rockRenders && vr.rockRenders.pool, vr.bullets && vr.bullets.pool, vr.enemyBulletRenders && vr.enemyBulletRenders.pool, vr.powerupRenders && vr.powerupRenders.pool]) if (Array.isArray(arr)) arr.forEach((m) => { if (m && m.visible !== undefined) m.visible = false; });
  const POOLS = [vr.mineRenders, vr.droneRenders, vr.stingerRenders, vr.flyerRenders, vr.hunterRenders, vr.gunshipRenders, vr.sentryRenders, vr.waspRenders, vr.podRenders, vr.phantomRenders, vr.haulerRenders, vr.bulwarkRenders];
  for (const rr of POOLS) if (rr && rr.pool) rr.pool.forEach((m) => { m.visible = false; });
  if (vr.shockwaves && Array.isArray(vr.shockwaves.rings)) vr.shockwaves.rings.forEach((r) => { if (r && r.mesh) r.mesh.visible = false; });
  if (vr.debris && Array.isArray(vr.debris.pool)) vr.debris.pool.forEach((m) => { if (m && m.visible !== undefined) m.visible = false; });
  for (const k2 of ["shipGroup","reticle","shieldRing","vortexFx","engineTrail"]) { const o = vr[k2]; const m = o && (o.group || o.ring || o); if (m && m.visible !== undefined) m.visible = false; }
  if (vr.particles) vr.particles.sync(0);
  if (vr.wardenMesh) vr.wardenMesh.mesh.visible = false;
  if (vr.bossMesh) vr.bossMesh.mesh.visible = false;
  if (vr.stars) vr.stars.visible = false; // I520: stars are discrete-tint (not blended) - hide for pure backdrop
  const ar = vr.arenaRing && vr.arenaRing.group && vr.arenaRing.group(); if (ar) ar.visible = false;
  const vg = vr.scene.getObjectByName("vistaRingGroup"); if (vg) vg.visible = false;
  window.requestAnimationFrame = () => 0; // freeze the main loop
  const r = vr.renderer; const cam = vr.camera;
  r.setPixelRatio(1); r.setSize(W, H); vr.bloom.resize(W, H);
  const cv = r.domElement;
  const readPixels = () => {
    const tmp = document.createElement("canvas"); tmp.width = cv.width; tmp.height = cv.height;
    const tc = tmp.getContext("2d", { willReadFrequently: true }); tc.drawImage(cv, 0, 0);
    return tc.getImageData(0, 0, cv.width, cv.height).data;
  };
  const render2 = () => { vr.bloom.render(); r.info.reset(); vr.bloom.render(); };
  const cfg = (await import("/src/core/config.js")).CONFIG;
  const zp = await import("/src/core/zonePalette.js");
  const stats = (data) => { // full-frame stride-3 pixel sample
    const lumas = [], rs = [], gs = [], bs = [];
    for (let i = 0; i < data.length; i += 12) {
      lumas.push(0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2]);
      rs.push(data[i]); gs.push(data[i+1]); bs.push(data[i+2]);
    }
    lumas.sort((a, b) => a - b);
    const q = (f) => lumas[Math.min(lumas.length - 1, Math.floor(f * lumas.length))];
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const R = mean(rs), G = mean(gs), B = mean(bs);
    const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
    let hue = null; let sat = 0;
    if (d > 1.0) {
      if (mx === R) hue = 60 * (((G - B) / d) % 6);
      else if (mx === G) hue = 60 * ((B - R) / d + 2);
      else hue = 60 * ((R - G) / d + 4);
      if (hue < 0) hue += 360;
      const L = (mx + mn) / 255;
      sat = d / (1 - Math.abs(2 * L - 1)) / 255;
    }
    return { p10: +q(0.1).toFixed(2), p50: +q(0.5).toFixed(2), p90: +q(0.9).toFixed(2), rgb: { r: +R.toFixed(1), g: +G.toFixed(1), b: +B.toFixed(1) }, hue: hue === null ? null : +hue.toFixed(1), sat: +sat.toFixed(3) };
  };
  const frame = (pos, look) => {
    cam.position.set(pos[0], pos[1], pos[2]);
    cam.up.set(0, 1, 0); cam.lookAt(look[0], look[1], look[2]);
    cam.fov = 60; cam.near = 0.05; cam.far = 400; cam.aspect = W / H;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    render2();
    return readPixels();
  };
  const out = { rendered: {}, allPalettes: {} };
  for (const id of REEF) {
    const pal = cfg.levels.palettes[id];
    const theme = zp.zoneThemeFor(id, cfg.levels.palettes);
    vr.zoneTheme.setTarget(theme, true); // snap (rm path) - instant paint
    out.rendered[id] = {
      config: { sky: pal.sky, stars: pal.stars, floor: pal.floor, grid: pal.grid, accent: pal.accent },
      painted: vr.zoneTheme.state().painted,
      sky: stats(frame([0, 2.0, 2], [0, 2.2, -10])),
      floor: stats(frame([0, 7.5, -2], [0, 7.2, -10]))
    };
  }
  for (const id of Object.keys(cfg.levels.palettes)) if (cfg.levels.palettes[id]) out.allPalettes[id] = cfg.levels.palettes[id];
  return out;
});
await browser.close();
// ---------------- node-side hue gate (config space, WITH MEASUREMENT) ----------------
const hexRgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const lumaOf = (h) => { const [R, G, B] = hexRgb(h); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
const hueOf = (h) => {
  const [R, G, B] = hexRgb(h);
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  if (d <= 0) return 0;
  let hue;
  if (mx === R) hue = 60 * (((G - B) / d) % 6);
  else if (mx === G) hue = 60 * ((B - R) / d + 2);
  else hue = 60 * ((R - G) / d + 4);
  if (hue < 0) hue += 360;
  return hue;
};
const dhue = (a, b) => { const d = Math.abs(hueOf(a) - hueOf(b)); return Math.min(d, 360 - d); };
const dluma = (a, b) => Math.abs(lumaOf(a) - lumaOf(b));
const andTest = (a, b) => dluma(a, b) <= 10 && dhue(a, b) <= 40; // E57 rule 1: collision iff BOTH
const hex = (h) => "0x" + h.toString(16).padStart(6, "0");
const P = res.allPalettes;
const L1 = ["debris-1", "debris-2", "debris-3", "debris-4"].map((k) => P[k].accent);
const LADDER = ["drift-2", "drift-3", "drift-4", "ember-1", "ember-2", "ember-3", "ember-4"].map((k) => ({ id: k, h: P[k].accent }));
const BOSS_HULLS = { monolith: 0x7a4dff, splicer: 0x2dd4bf, prime: 0xd9a441, abyssal: 0xd12b7a }; // bossMesh.js line 235 + config abyssal.body
const A_LOW = 0x14b8a6, A_HIGH = 0x2dd4bf; // (a) deep-teal candidate family (config comment)
const reefAccents = REEF.map((id) => P[id].accent);
// A1: (a) rejection - dhue <= 12 from the 0x2dd4bf members (debris-1 / debris-4)
const a1rows = [];
for (const [label, hh] of [["a_low " + hex(A_LOW), A_LOW], ["a_high " + hex(A_HIGH), A_HIGH]])
  a1rows.push({ candidate: label, hue: +hueOf(hh).toFixed(1), vs_debris1: +dhue(hh, P["debris-1"].accent).toFixed(1), vs_debris4: +dhue(hh, P["debris-4"].accent).toFixed(1), vs_debris2: +dhue(hh, P["debris-2"].accent).toFixed(1), vs_debris3: +dhue(hh, P["debris-3"].accent).toFixed(1) });
const a1max = Math.max(a1rows[0].vs_debris1, a1rows[0].vs_debris4, a1rows[1].vs_debris1, a1rows[1].vs_debris4);
// A2: (b) clears the full L1 accent band
const a2pairs = [];
let a2min = 1e9;
for (const id of REEF) for (const la of L1) { const d = dhue(P[id].accent, la); a2pairs.push({ reef: id, l1: hex(la), dhue: +d.toFixed(1) }); a2min = Math.min(a2min, d); }
// A3: E57 AND test vs ladder accents + abyssal hull (co-occurring / ladder identities)
const a3pairs = [];
let a3collisions = [];
for (const id of REEF) {
  for (const l of LADDER) { const pair = { reef: id, vs: l.id, dhue: +dhue(P[id].accent, l.h).toFixed(1), dluma: +dluma(P[id].accent, l.h).toFixed(1), andCollision: andTest(P[id].accent, l.h) }; a3pairs.push(pair); if (pair.andCollision) a3collisions.push(pair); }
  const pair = { reef: id, vs: "abyssal hull " + hex(BOSS_HULLS.abyssal), dhue: +dhue(P[id].accent, BOSS_HULLS.abyssal).toFixed(1), dluma: +dluma(P[id].accent, BOSS_HULLS.abyssal).toFixed(1), andCollision: andTest(P[id].accent, BOSS_HULLS.abyssal) }; a3pairs.push(pair); if (pair.andCollision) a3collisions.push(pair);
}
// A4: rendered stats finite
let a4bad = [];
for (const id of REEF) for (const bd of ["sky", "floor"]) {
  const st = res.rendered[id][bd];
  for (const k of ["p10", "p50", "p90", "hue", "sat"]) { if (typeof st[k] === "number" ? !Number.isFinite(st[k]) : st[k] === null) a4bad.push(id + "." + bd + "." + k); }
  for (const k of ["r", "g", "b"]) if (!Number.isFinite(st.rgb[k])) a4bad.push(id + "." + bd + ".rgb." + k);
}
// cross-level hull reference (NOT gated - see header scoping note)
const hullRef = {};
for (const id of REEF) {
  const row = {};
  for (const [name, h] of Object.entries(BOSS_HULLS)) if (name !== "abyssal") row[name + " " + hex(h)] = { dhue: +dhue(P[id].accent, h).toFixed(1), dluma: +dluma(P[id].accent, h).toFixed(1), andTestWouldBeCollision: andTest(P[id].accent, h) };
  hullRef[id] = row;
}
const L1band = { minHue: +Math.min(...L1.map(hueOf)).toFixed(1), maxHue: +Math.max(...L1.map(hueOf)).toFixed(1) };
const reefHues = REEF.map((id) => ({ id, accent: hex(P[id].accent), hue: +hueOf(P[id].accent).toFixed(1), luma: +lumaOf(P[id].accent).toFixed(1) }));
const A = [
  { id: "A1", claim: "(a) deep-teal candidate accent lands dhue <= 12 from the debris-1/debris-4 0x2dd4bf accents (config comment + spec R4)", measured: "max dhue vs 0x2dd4bf members = " + a1max.toFixed(1) + " deg", threshold: "<= 12", pass: a1max <= 12 },
  { id: "A2", claim: "(b) reef accents clear the L1 Debris Field accent band (" + L1band.minHue + ".." + L1band.maxHue + " deg) by > 40 deg", measured: "min dhue = " + a2min.toFixed(1) + " deg", threshold: "> 40", pass: a2min > 40 },
  { id: "A3", claim: "E57 rule-1 AND test (dluma<=10 AND dhue<=40): 0 collisions for reef accents vs drift/ember ladder accents + abyssal L4 boss hull", measured: a3collisions.length + " collisions / " + a3pairs.length + " pairs", threshold: "0", pass: a3collisions.length === 0 },
  { id: "A4", claim: "rendered backdrop stats finite (no NaN) for all 4 palettes x sky/floor", measured: a4bad.length + " non-finite", threshold: "0", pass: a4bad.length === 0 },
  { id: "A5", claim: "browser smoke: console errors === 0 (quality-bar gate 3)", measured: consoleErrs.length + " errors", threshold: "0", pass: consoleErrs.length === 0 },
];
const out = {
  tag: "I520 ST-486 zone-palette rendered-luma + hue audit (L4 Necro Reef reef-1..4)",
  method: "I480/I519 - headless chrome, fx=high, RAF frozen, all actors+stars+arenaRing+vista hidden, 2 bloom renders/frame, 2d-canvas pixel read, stride-3 full-frame sample",
  L1band, reefHues, a1rows, a2pairs, a3pairs, hullReference_notGated: Object.assign({ scoping: "monolith/prime/splicer hulls render only in their own levels (L1/L3) and never concurrently with a reef palette (reef = L4-only; endless = drift/ember stage palettes) -> reference margin only" }, hullRef),
  rendered: res.rendered,
  assertions: A,
  consoleErrors: consoleErrs.length,
  consoleErrorSample: consoleErrs.slice(0, 5),
};
writeFileSync(OUT + "luma_i520.json", JSON.stringify(out, null, 1));
console.log("A1", a1rows);
console.log("A2 min dhue:", +a2min.toFixed(1), "A3 collisions:", a3collisions.length, "A4 bad:", a4bad.length, "A5 consoleErrors:", consoleErrs.length);
for (const id of REEF) console.log(id, "sky", JSON.stringify(res.rendered[id].sky), "floor", JSON.stringify(res.rendered[id].floor));
console.log("ALL_ASSERTIONS_PASS:", A.every((a) => a.pass));
if (!A.every((a) => a.pass)) process.exit(1);
