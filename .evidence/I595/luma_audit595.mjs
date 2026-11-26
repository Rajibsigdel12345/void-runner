// I595/I596 (ST-562, E85) full-fleet in-game rendered-luma + hue audit - clone of .evidence/I519/luma_audit519.mjs with ONLY: OUT -> .evidence/I595/; nocache i595; TARGETS worldR drone 1.5 -> 1.6, stinger 2.0 -> 2.6, flyer 1.75 -> 1.9 (WITH MEASUREMENT from the I592 v2 extents: stinger x -1.67..2.345 maxR ~2.43, flyer maxR ~1.72, drone v2 per I591; warden 3.2 unchanged - v3 maxR 2.4790 covered). Everything else verbatim (13 targets, sky/floor backdrops, fx=high, 16-asset ready wait, statsMasked). I480/I381/I383/I506/I511/I519 method.
// ST-562 is the measure + re-pin story of E85: pre-audit BEFORE any config change, apply the G1/H1/N1 re-pins to the 4 config.js levers, post-audit AFTER, then E57 rule-1 re-check (E1) + R1 regression.
// Usage: node .evidence/I595/luma_audit595.mjs <tag>   -> writes luma_<tag>.json
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I595/";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5173";
const tag = process.argv[2] || "run";
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const consoleErrs = [];
p.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });
p.on("pageerror", (e) => consoleErrs.push(String(e)));
await p.goto(BASE + "/?nocache=i595" + tag, { waitUntil: "load" });
await p.waitForFunction(() => { const vr = window.__vr; if (!vr || !vr.assetLoader) return false; return ["rockL","rockM","rockS","ship","drone","stinger","flyer","hunter","gunship","sentry","wasp","warden","phantom","hauler","bulwark","boss"].every((k) => { const e = vr.assetLoader.get(k); return e && e.ready; }); }, { timeout: 60000 });
for (let i = 0; i < 6; i++) { const cur = await p.evaluate(() => window.__vr.liveSettings().fx); if (cur === "high") break; await p.keyboard.press("f"); await p.waitForTimeout(120); }
const res = await p.evaluate(async () => {
  const vr = window.__vr;
  const T = await import("/vendor/three.module.js");
  const W = 1280, H = 720;
  for (const arr of [vr.rockRenders && vr.rockRenders.pool, vr.bullets && vr.bullets.pool, vr.enemyBulletRenders && vr.enemyBulletRenders.pool, vr.powerupRenders && vr.powerupRenders.pool]) if (Array.isArray(arr)) arr.forEach((m) => { if (m && m.visible !== undefined) m.visible = false; });
  if (vr.shockwaves && Array.isArray(vr.shockwaves.rings)) vr.shockwaves.rings.forEach((r) => { if (r && r.mesh) r.mesh.visible = false; });
  for (const k2 of ["shipGroup","reticle","shieldRing","vortexFx","engineTrail"]) { const o = vr[k2]; const m = o && (o.group || o.ring || o); if (m && m.visible !== undefined) m.visible = false; }
  if (vr.particles) vr.particles.sync(0);
  const POOLS = [vr.mineRenders, vr.droneRenders, vr.stingerRenders, vr.flyerRenders, vr.hunterRenders, vr.gunshipRenders, vr.sentryRenders, vr.waspRenders, vr.podRenders, vr.phantomRenders, vr.haulerRenders, vr.bulwarkRenders];
  for (const rr of POOLS) if (rr && rr.pool) rr.pool.forEach((m) => { m.visible = false; });
  if (vr.wardenMesh) vr.wardenMesh.mesh.visible = false;
  if (vr.bossMesh) vr.bossMesh.mesh.visible = false;
  window.requestAnimationFrame = () => 0;
  const scene = vr.arenaFloor.parent;
  const cam = vr.camera; const r = vr.renderer;
  r.setPixelRatio(1); r.setSize(W, H); vr.bloom.resize(W, H);
  const cv = r.domElement;
  const readPixels = () => {
    const tmp = document.createElement("canvas"); tmp.width = cv.width; tmp.height = cv.height;
    const tc = tmp.getContext("2d", { willReadFrequently: true }); tc.drawImage(cv, 0, 0);
    return tc.getImageData(0, 0, cv.width, cv.height).data;
  };
  const render2 = () => { vr.bloom.render(); r.info.reset(); vr.bloom.render(); };
  const mvp = new T.Matrix4(); const ndc = new T.Vector3();
  const toPix = (v) => { ndc.copy(v).applyMatrix4(mvp); if (ndc.z > 1 || ndc.z < -1) return null; return [(ndc.x + 1) / 2 * W, (1 - ndc.y) / 2 * H]; };
  const backdrops = { sky: { pos: [0, 2.0, 2] }, floor: { pos: [0, 7.5, -2] } };
  const frame = (y, bdName) => {
    const bd = backdrops[bdName];
    const center = new T.Vector3(0, y, -10);
    cam.position.set(bd.pos[0], bd.pos[1], bd.pos[2]);
    cam.up.set(0, 1, 0); cam.lookAt(center.x, center.y + (bdName === "floor" ? -0.3 : 0.2), center.z);
    cam.fov = 60; cam.near = 0.05; cam.far = 400; cam.aspect = W / H;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    mvp.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    render2();
    return readPixels();
  };
  const statsMasked = (bg, fg, cx, cy, half) => {
    const vals = [], rs = [], gs = [], bs = [];
    let area = 0;
    for (let yy = -half; yy <= half; yy++) for (let xx = -half; xx <= half; xx++) {
      const X = Math.round(cx + xx), Y = Math.round(cy + yy);
      if (X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue;
      const i = (Y * cv.width + X) * 4;
      const dR = Math.abs(fg[i] - bg[i]), dG = Math.abs(fg[i+1] - bg[i+1]), dB = Math.abs(fg[i+2] - bg[i+2]);
      const dL = 0.2126 * dR + 0.7152 * dG + 0.0722 * dB;
      if (dL < 6 && (dR + dG + dB) < 30) continue;
      area++;
      vals.push(0.2126 * fg[i] + 0.7152 * fg[i+1] + 0.0722 * fg[i+2]);
      rs.push(fg[i]); gs.push(fg[i+1]); bs.push(fg[i+2]);
    }
    if (!vals.length) return { n: 0 };
    vals.sort((a, b) => a - b);
    const q = (f) => vals[Math.min(vals.length - 1, Math.floor(f * vals.length))];
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const R = mean(rs), G = mean(gs), B = mean(bs);
    const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
    let hue = null;
    if (d > 1.0) {
      if (mx === R) hue = 60 * (((G - B) / d) % 6);
      else if (mx === G) hue = 60 * ((B - R) / d + 2);
      else hue = 60 * ((R - G) / d + 4);
      if (hue < 0) hue += 360;
    }
    return { n: vals.length, areaFrac: +(area / ((half * 2 + 1) ** 2)).toFixed(3), p50: +q(0.5).toFixed(2), p90: +q(0.9).toFixed(2), rgb: { r: +R.toFixed(1), g: +G.toFixed(1), b: +B.toFixed(1) }, hue: hue === null ? null : +hue.toFixed(1) };
  };
  const auditShot = (setVisible, y, worldR, bdName) => {
    setVisible(false); const bg = frame(y, bdName);
    setVisible(true);
    const center = new T.Vector3(0, y, -10);
    const cpx = toPix(center);
    const sideP = toPix(new T.Vector3(center.x + worldR, center.y, center.z));
    const Rpx = Math.hypot(sideP[0] - cpx[0], sideP[1] - cpx[1]);
    const fg = frame(y, bdName);
    const half = Math.max(30, Math.round(Rpx * 1.6));
    return statsMasked(bg, fg, cpx[0], cpx[1], half);
  };
  const hideAllTargets = () => {
    for (const rr of POOLS) if (rr && rr.pool) rr.pool.forEach((m) => { m.visible = false; });
    if (vr.wardenMesh) vr.wardenMesh.mesh.visible = false;
    if (vr.bossMesh) vr.bossMesh.mesh.visible = false;
    if (vr.shipGroup) vr.shipGroup.visible = false;
  };
  const out = { fleet: {} };
  // worldR = audit mask-window parameter only (zero src/ usage). I595 re-pin for the v2
  // remastered-4 extents (I591/I592): drone 1.5 -> 1.6, stinger 2.0 -> 2.6 (maxR ~2.43),
  // flyer 1.75 -> 1.9 (maxR ~1.72); warden 3.2 unchanged (v3 maxR 2.4790 covered).
  const TARGETS = [
    { name: "drone",   pool: "droneRenders",   y: 0.6, worldR: 1.6 },
    { name: "stinger", pool: "stingerRenders", y: 0.6, worldR: 2.6 },
    { name: "flyer",   pool: "flyerRenders",   y: 0.8, worldR: 1.9 },
    { name: "hunter",  pool: "hunterRenders",  y: 0.6, worldR: 1.9 },
    { name: "warden",  mesh: "wardenMesh",     y: 0.8, worldR: 3.2 },
    { name: "sentry",  pool: "sentryRenders",  y: 0.6, worldR: 2.1 },
    { name: "wasp",    pool: "waspRenders",    y: 0.6, worldR: 1.7 },
    { name: "phantom", pool: "phantomRenders", y: 0.6, worldR: 0.8 },
    { name: "hauler",  pool: "haulerRenders",  y: 0.6, worldR: 1.1 },
    { name: "bulwark", pool: "bulwarkRenders", y: 0.6, worldR: 1.2 },
    { name: "gunship", pool: "gunshipRenders", y: 0.9, worldR: 2.9 },
    { name: "boss",    mesh: "bossMesh",       y: 1.0, worldR: 5.0 },
    { name: "ship",    grp: "shipGroup",       y: 0.8, worldR: 2.6 },
  ];
  for (const t of TARGETS) {
    const obj = t.pool ? vr[t.pool].pool[0] : (t.mesh ? vr[t.mesh].mesh : (t.grp ? vr[t.grp] : null));
    if (!obj) { out.fleet[t.name] = { error: "no object" }; continue; }
    obj.position.set(0, t.y, -10);
    obj.rotation.set(0, 0, 0);
    if (t.name === "phantom") obj.traverse((o) => { if (o.isMesh && o.material) o.material.opacity = 1; });
    for (const bdName of ["sky", "floor"]) {
      hideAllTargets();
      out.fleet[t.name] = out.fleet[t.name] || {};
      out.fleet[t.name][bdName] = auditShot((v) => { obj.visible = v; }, t.y, t.worldR, bdName);
    }
  }
  hideAllTargets();
  return out;
});
writeFileSync(OUT + "luma_" + tag + ".json", JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
console.log("consoleErrors:", consoleErrs.length, consoleErrs.slice(0, 5));
await browser.close();