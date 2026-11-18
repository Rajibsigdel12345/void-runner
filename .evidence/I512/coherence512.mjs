// I512 (ST-478, E68) fleet-coherence gate - the 5-item close gate per spec sections 6+7:
// (A) one-frame all-9 ladder + E57 rule-1 AND-test in the SHARED scene (bloom cross-talk
//     check) WITH a per-role SOLO control (same geometry, one role at a time) so the
//     cross-talk delta is quantified rather than conflated with geometry
// (B) 96px in-game silhouette board, front + back (R-SIL)
// (C) low-DPR accent survival at 0.5 DPR (I381-class check)
// (D) reduced-motion telegraph poses (motionOff=true) + scripted pose/glow asserts + stills
// (E) hero screenshots (all-9 frame, silhouette board, telegraph stills)
// Method: I511 in-game audit harness (headless SwiftShader, 1280x720, bloom in the render
// path, bg/fg diff measurement). Usage: node .evidence/I512/coherence512.mjs [tag]
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I512/";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5173";
const tag = process.argv[2] || "run";
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const consoleErrs = [];
p.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });
p.on("pageerror", (e) => consoleErrs.push(String(e)));
await p.goto(BASE + "/?nocache=i512" + tag, { waitUntil: "load" });
await p.waitForFunction(() => { const vr = window.__vr; if (!vr || !vr.assetLoader) return false; return ["rockL","rockM","rockS","ship","drone","stinger","flyer","hunter","gunship","sentry","wasp","warden","boss"].every((k) => { const e = vr.assetLoader.get(k); return e && e.ready; }); }, { timeout: 60000 });
for (let i = 0; i < 6; i++) { const cur = await p.evaluate(() => window.__vr.liveSettings().fx); if (cur === "high") break; await p.keyboard.press("f"); await p.waitForTimeout(120); }
const res = await p.evaluate(async () => {
  const vr = window.__vr;
  const T = await import("/vendor/three.module.js");
  for (const arr of [vr.rockRenders && vr.rockRenders.pool, vr.bullets && vr.bullets.pool, vr.enemyBulletRenders && vr.enemyBulletRenders.pool, vr.powerupRenders && vr.powerupRenders.pool]) if (Array.isArray(arr)) arr.forEach((m) => { if (m && m.visible !== undefined) m.visible = false; });
  if (vr.shockwaves && Array.isArray(vr.shockwaves.rings)) vr.shockwaves.rings.forEach((r) => { if (r && r.mesh) r.mesh.visible = false; });
  for (const k2 of ["shipGroup","reticle","shieldRing","vortexFx","engineTrail"]) { const o = vr[k2]; const m = o && (o.group || o.ring || o); if (m && m.visible !== undefined) m.visible = false; }
  if (vr.particles) vr.particles.sync(0);
  const POOLS = [vr.mineRenders, vr.droneRenders, vr.stingerRenders, vr.flyerRenders, vr.hunterRenders, vr.gunshipRenders, vr.sentryRenders, vr.waspRenders, vr.podRenders];
  const allEnemyObjs = () => {
    const objs = [];
    for (const rr of POOLS) if (rr && rr.pool) for (const m of rr.pool) objs.push(m);
    if (vr.wardenMesh) objs.push(vr.wardenMesh.mesh);
    if (vr.bossMesh) objs.push(vr.bossMesh.mesh);
    return objs;
  };
  const setAllVisible = (v) => allEnemyObjs().forEach((m) => { m.visible = v; });
  window.requestAnimationFrame = () => 0;
  const cam = vr.camera; const r = vr.renderer;
  let W = 1280, H = 720;
  const frameSet = (px) => { r.setPixelRatio(px); r.setSize(1280, 720); vr.bloom.resize(1280, 720); W = Math.round(1280 * px); H = Math.round(720 * px); };
  frameSet(1);
  const cv = r.domElement;
  const readPixels = () => {
    const tmp = document.createElement("canvas"); tmp.width = cv.width; tmp.height = cv.height;
    const tc = tmp.getContext("2d", { willReadFrequently: true }); tc.drawImage(cv, 0, 0);
    return tc.getImageData(0, 0, cv.width, cv.height).data;
  };
  const render2 = () => { vr.bloom.render(); r.info.reset(); vr.bloom.render(); };
  const shotURL = () => { const tmp = document.createElement("canvas"); tmp.width = cv.width; tmp.height = cv.height; tmp.getContext("2d").drawImage(cv, 0, 0); return tmp.toDataURL("image/png"); };
  const mvp = new T.Matrix4(); const ndc = new T.Vector3();
  const toPix = (v) => { ndc.copy(v).applyMatrix4(mvp); if (ndc.z > 1 || ndc.z < -1) return null; return [(ndc.x + 1) / 2 * W, (1 - ndc.y) / 2 * H]; };
  const frame = (pos, target) => {
    cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(0, 1, 0); cam.lookAt(target[0], target[1], target[2]);
    cam.fov = 60; cam.near = 0.05; cam.far = 400; cam.aspect = 1280 / 720;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    mvp.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    render2();
    return readPixels();
  };
  const projBBox = (obj) => {
    const box = new T.Box3().setFromObject(obj);
    if (box.isEmpty()) return null;
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, n = 0;
    for (let ix = 0; ix < 2; ix++) for (let iy = 0; iy < 2; iy++) for (let iz = 0; iz < 2; iz++) {
      const pt = toPix(new T.Vector3(ix ? box.max.x : box.min.x, iy ? box.max.y : box.min.y, iz ? box.max.z : box.min.z));
      if (!pt) continue;
      minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]);
      minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); n++;
    }
    if (n < 4) return null;
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY, r: Math.max(maxX - minX, maxY - minY) / 2 };
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
  // 96px silhouette from a full-res bg/fg pair over the projected bbox.
  const sil96 = (bb, bg, fg) => {
    const x0f = Math.max(0, Math.floor(bb.minX)), x1f = Math.min(W, Math.ceil(bb.maxX));
    const y0f = Math.max(0, Math.floor(bb.minY)), y1f = Math.min(H, Math.ceil(bb.maxY));
    if (x1f - x0f < 4 || y1f - y0f < 4) return { areaFrac96: 0, areaFracFull: 0, url: "" };
    const maskAt = (X, Y) => {
      if (X < 0 || Y < 0 || X >= W || Y >= H) return false;
      const i = (Y * W + X) * 4;
      const dR = Math.abs(fg[i] - bg[i]), dG = Math.abs(fg[i+1] - bg[i+1]), dB = Math.abs(fg[i+2] - bg[i+2]);
      return (0.2126 * dR + 0.7152 * dG + 0.0722 * dB) >= 10;
    };
    let areaF = 0;
    for (let Y = y0f; Y < y1f; Y++) for (let X = x0f; X < x1f; X++) if (maskAt(X, Y)) areaF++;
    const canvas = document.createElement("canvas"); canvas.width = 96; canvas.height = 96;
    const cctx = canvas.getContext("2d");
    const img = cctx.createImageData(96, 96);
    let area96 = 0;
    for (let yy = 0; yy < 96; yy++) for (let xx = 0; xx < 96; xx++) {
      const X = Math.round(bb.minX + (xx + 0.5) * bb.w / 96);
      const Y = Math.round(bb.minY + (yy + 0.5) * bb.h / 96);
      const on = maskAt(X, Y);
      if (on) area96++;
      const o = (yy * 96 + xx) * 4;
      img.data[o] = img.data[o+1] = img.data[o+2] = on ? 255 : 0; img.data[o+3] = 255;
    }
    cctx.putImageData(img, 0, 0);
    return { areaFrac96: +(area96 / 9216).toFixed(4), areaFracFull: +(areaF / ((x1f - x0f) * (y1f - y0f))).toFixed(4), url: canvas.toDataURL("image/png") };
  };
  // Section-A grid: 3x3 in SCREEN space. Cam (0,10,30) -> (0,10,-10) is exactly level
  // (horizon at v-center 360); slots unprojected from (x_px 280/640/1000, y_px 90/210/330)
  // at row depths 14/28/46 -> pure-sky backdrop (floor/ring below horizon) with >=120px
  // projected spacing so the neighbor-capped mask windows never collapse (the old world-grid
  // layout projected to 8-22px spacing = zero-area masks).
  // y = close-up height used by sections B/C (unchanged).
  const ROLES = [
    { name: "drone",   obj: () => vr.droneRenders.pool[0],   y: 1.0,  home: [-8.08, 16.06, 16] },
    { name: "stinger", obj: () => vr.stingerRenders.pool[0], y: 1.2,  home: [0, 16.06, 16] },
    { name: "flyer",   obj: () => vr.flyerRenders.pool[0],   y: 1.0,  home: [8.08, 16.06, 16] },
    { name: "hunter",  obj: () => vr.hunterRenders.pool[0],  y: 1.2,  home: [-16.17, 16.74, 2] },
    { name: "sentry",  obj: () => vr.sentryRenders.pool[0],  y: 1.3,  home: [0, 16.74, 2] },
    { name: "wasp",    obj: () => vr.waspRenders.pool[0],    y: 1.1,  home: [16.17, 16.74, 2] },
    { name: "gunship", obj: () => vr.gunshipRenders.pool[0], y: 1.8,  home: [0, 12.21, -16] },
    { name: "warden",  obj: () => vr.wardenMesh.mesh,        y: 2.3,  home: [-26.56, 12.21, -16] },
    { name: "boss",    obj: () => vr.bossMesh.mesh,          y: 4.0,  home: [26.56, 12.21, -16] },
  ];
  const CAM_A = [0, 10, 30], TGT_A = [0, 10, -10];
  const placeGrid = (onlyRole) => {
    for (const role of ROLES) {
      const o = role.obj();
      o.position.set(role.home[0], role.home[1], role.home[2]);
      o.rotation.set(0, 0, 0);
      o.visible = onlyRole === null || onlyRole === role.name;
    }
  };
  const measureRole = (bg, fg, role, centers) => {
    const bb = projBBox(role.obj());
    if (!bb) return { error: "no bbox" };
    let half = Math.max(20, Math.round(bb.r * 1.3));
    if (centers) {
      let minN = 1e9;
      for (const other of ROLES) if (other.name !== role.name) { const c = centers[other.name]; if (c) minN = Math.min(minN, Math.hypot(bb.cx - c[0], bb.cy - c[1])); }
      half = Math.min(half, Math.floor(minN / 2) - 6);
    }
    return statsMasked(bg, fg, bb.cx, bb.cy, half);
  };
  const ORDER = ["drone","wasp","sentry","warden","hunter","stinger","flyer","boss","gunship"];
  const hueDist = (a, b) => { if (a === null || b === null) return 999; const d = Math.abs(a - b); return Math.min(d, 360 - d); };
  const ladderSummary = (M) => {
    const pairs = [];
    for (let i = 0; i < 8; i++) {
      const pa = M[ORDER[i]], pb = M[ORDER[i+1]];
      const dluma = +(pa.p50 - pb.p50).toFixed(2); // >0 = frozen order holds for this pair
      const dhue = hueDist(pa.hue, pb.hue);
      pairs.push({ pair: ORDER[i] + ">" + ORDER[i+1], dluma, dhue: +dhue.toFixed(1), inverted: dluma < 0, collision: Math.abs(dluma) <= 10 && dhue <= 40 });
    }
    return { strictOrder: pairs.every((x) => !x.inverted), andTestPass: pairs.every((x) => !x.collision), pairs };
  };
  const sils = {};
  const out = {};
  // ============ (A) all-9 shared frame + per-role solo control (same geometry) ============
  placeGrid(null);
  setAllVisible(false); // bg: clean sky, no roles
  const bgA = frame(CAM_A, TGT_A);
  setAllVisible(true); // fg: all 9 in the shared frame (bloom cross-talk lives here)
  const fgA = frame(CAM_A, TGT_A);
  sils["hero_all9"] = shotURL();
  const centers = {};
  for (const role of ROLES) { const bb = projBBox(role.obj()); centers[role.name] = bb ? [bb.cx, bb.cy] : null; }
  const A = {}, solo = {};
  for (const role of ROLES) A[role.name] = measureRole(bgA, fgA, role, centers);
  for (const role of ROLES) {
    placeGrid(role.name);
    const o = role.obj();
    o.visible = false; // bg: this role hidden (same geometry/position as fg)
    const bgS = frame(CAM_A, TGT_A);
    o.visible = true;
    const fgS = frame(CAM_A, TGT_A);
    solo[role.name] = measureRole(bgS, fgS, role, null);
  }
  placeGrid(null);
  for (const role of ROLES) A[role.name].soloP50 = solo[role.name].p50;
  for (const role of ROLES) if (A[role.name].p50 !== undefined) A[role.name].crossTalk = +(A[role.name].p50 - A[role.name].soloP50).toFixed(2);
  A.solo = solo;
  A.summary = ladderSummary(A);
  A.soloSummary = ladderSummary(solo);
  out.A = A;
  // ============ (B) 96px silhouettes front + back ============
  const B = {};
  for (const role of ROLES) {
    const o = role.obj();
    B[role.name] = {};
    for (const view of ["front","back"]) {
      setAllVisible(false);
      o.position.set(0, role.y, -10);
      o.rotation.set(0, view === "back" ? Math.PI : 0, 0);
      const pos = view === "front" ? [10, role.y + 0.4, -10] : [-10, role.y + 0.4, -10];
      const bg = frame(pos, [0, role.y, -10]);
      o.visible = true;
      const bb = projBBox(o);
      if (!bb) { B[role.name][view] = { error: "no bbox" }; continue; }
      const fg = frame(pos, [0, role.y, -10]);
      const s = sil96(bb, bg, fg);
      B[role.name][view] = { areaFrac96: s.areaFrac96, areaFracFull: s.areaFracFull };
      sils[role.name + "_" + view] = s.url;
    }
  }
  out.B = B;
  // ============ (C) low-DPR accent survival (0.5 DPR) ============
  const C = {};
  frameSet(0.5);
  for (const role of ROLES) {
    setAllVisible(false);
    const o = role.obj();
    if (role.name === "hunter") vr.hunterRenders.sync({ hunters: [{ pos: { x: 0, y: -10 }, vel: { x: 1, y: 0 }, state: "telegraph", t: 99, aimDir: { x: 1, y: 0 }, tumblePhase: 0 }] }, 0.5, true);
    else if (role.name === "sentry") vr.sentryRenders.sync({ sentries: [{ pos: { x: 0, y: -10 }, vel: { x: 1, y: 0 }, state: "charge", t: 99, aimAngle: 0 }] }, 0.5, true);
    else if (role.name === "stinger") vr.stingerRenders.sync({ stingers: [{ pos: { x: 0, y: -10 }, vel: { x: 1, y: 0 }, state: "telegraph", t: 99, aimDir: { x: 1, y: 0 }, wobblePhase: 0 }] }, 0.5, true);
    else if (role.name === "boss") vr.bossMesh.sync({ alive: true, kind: "monolith", pos: { x: 0, y: -10 }, rot: 0, phase: 1, hitFlash: 0, entered: 1, radius: 3.4 }, 0.5, -1, -1, -1);
    else { o.position.set(0, role.y, -10); o.rotation.set(0, 0, 0); }
    const oy = o.position.y;
    const pos = [10, oy + 0.3, -10], tgt = [0, oy, -10];
    o.visible = false;
    const bg = frame(pos, tgt);
    o.visible = true;
    const bb = projBBox(o);
    if (!bb) { C[role.name] = { error: "no bbox" }; continue; }
    const fg = frame(pos, tgt);
    const half = Math.max(20, Math.round(bb.r * 1.8));
    const st = statsMasked(bg, fg, bb.cx, bb.cy, half);
    const bgSt = statsMasked(fg, bg, bb.cx, bb.cy, half);
    C[role.name] = { p50: st.p50, p90: st.p90, hue: st.hue, areaFrac: st.areaFrac, bgP50: bgSt.p50, margin: +(st.p90 - bgSt.p50).toFixed(2), n: st.n };
  }
  frameSet(1);
  out.C = C;
  // ============ (D) reduced-motion telegraph poses (motionOff=true) ============
  const D = {};
  {
    setAllVisible(false);
    const hr = vr.hunterRenders;
    const mk = (state, t) => ({ hunters: [{ pos: { x: 0, y: -10 }, vel: { x: 1, y: 0 }, state, t, aimDir: { x: 1, y: 0 }, tumblePhase: 0 }] });
    hr.sync(mk("cruise", 0), 0.5, true);
    const g = hr.pool[0];
    const finIdleZ = g.children[1].scale.z;
    hr.sync(mk("telegraph", 99), 0.5, true);
    const coreMat = g.children[2].material;
    D.hunter = { finIdleZ: +finIdleZ.toFixed(3), finTelegraphZ: +g.children[1].scale.z.toFixed(3), finDelta: +(g.children[1].scale.z - finIdleZ).toFixed(3), coreIntensity: +coreMat.emissiveIntensity.toFixed(2), coreRGB: [coreMat.emissive.r, coreMat.emissive.g, coreMat.emissive.b].map((v) => +v.toFixed(3)) };
    frame([10, 0.9, -10], [0, 0.7, -10]);
    sils["telegraph_hunter"] = shotURL();
  }
  {
    setAllVisible(false);
    const sr = vr.sentryRenders;
    sr.sync({ sentries: [{ pos: { x: 0, y: -10 }, vel: { x: 1, y: 0 }, state: "charge", t: 99, aimAngle: 0 }] }, 0.5, true);
    const cm = sr.pool[0].children[3].material;
    D.sentry = { chargeIntensity: +cm.emissiveIntensity.toFixed(2), chargeRGB: [cm.emissive.r, cm.emissive.g, cm.emissive.b].map((v) => +v.toFixed(3)) };
    frame([10, 0.9, -10], [0, 0.7, -10]);
    sils["telegraph_sentry"] = shotURL();
  }
  {
    setAllVisible(false);
    const tr = vr.stingerRenders;
    const mk = (t) => ({ stingers: [{ pos: { x: 0, y: -10 }, vel: { x: 1, y: 0 }, state: "telegraph", t, aimDir: { x: 1, y: 0 }, wobblePhase: 0 }] });
    tr.sync(mk(99), 0.5, true);
    const g = tr.pool[0];
    const cm = g.children[1].material;
    const posStill = g.position.x;
    tr.sync(mk(0.01), 0.01, false);
    const x1 = g.position.x;
    tr.sync(mk(0.03), 0.03, false);
    const x2 = g.position.x;
    tr.sync(mk(99), 0.5, true);
    D.stinger = { coreIntensity: +cm.emissiveIntensity.toFixed(2), coreRGB: [cm.emissive.r, cm.emissive.g, cm.emissive.b].map((v) => +v.toFixed(3)), posX_motionOff: +posStill.toFixed(5), wobbleOnDelta: +Math.abs(x2 - x1).toFixed(4), coreScale: +g.children[1].scale.x.toFixed(2) };
    frame([10, 1.0, -10], [0, 0.8, -10]);
    sils["telegraph_stinger"] = shotURL();
  }
  {
    setAllVisible(false);
    vr.bossMesh.sync({ alive: true, kind: "monolith", pos: { x: 0, y: -10 }, rot: 0, phase: 1, hitFlash: 0, entered: 1, radius: 3.4 }, 0.5, 0, 0, 0);
    const ts = vr.bossMesh.telestate();
    D.boss = { groupVisible: vr.bossMesh.mesh.visible, ringV: ts.ringV, ringS: +ts.ringS.toFixed(2), ringO: +ts.ringO.toFixed(3), coreI: +ts.coreI.toFixed(2), coreHex: ts.coreHex };
    frame([14, 5.5, -10], [0, 4.6, -10]);
    sils["telegraph_boss"] = shotURL();
  }
  out.D = D;
  // ============ (E) silhouette board (9 cols x 2 rows: front / back) ============
  const board = document.createElement("canvas"); board.width = 9 * 100 + 8; board.height = 2 * 100 + 8;
  const bctx = board.getContext("2d");
  bctx.fillStyle = "#141414"; bctx.fillRect(0, 0, board.width, board.height);
  for (let i = 0; i < ORDER.length; i++) {
    for (let row = 0; row < 2; row++) {
      const url = sils[ORDER[i] + "_" + (row === 0 ? "front" : "back")];
      if (!url) continue;
      const img = await new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = url; });
      bctx.drawImage(img, 8 + i * 100, 8 + row * 100, 96, 96);
    }
  }
  sils["board"] = board.toDataURL("image/png");
  setAllVisible(false);
  return { A: out.A, B: out.B, C: out.C, D: out.D, sils };
}, 600000);
writeFileSync(OUT + "coherence_" + tag + ".json", JSON.stringify(res, null, 1));
let pngCount = 0;
for (const [k, v] of Object.entries(res.sils)) { if (v && typeof v === "string" && v.indexOf("data:image/png") === 0 && v.length > 600) { writeFileSync(OUT + "img_" + tag + "_" + k + ".png", Buffer.from(v.split(",")[1], "base64")); pngCount++; } }
const s = res.A.summary, ss = res.A.soloSummary;
console.log("=== I512 coherence gate (tag " + tag + ") ===");
console.log("A all-9 (p50 / hue / soloP50 / crossTalk):");
for (const n of Object.keys(res.A)) if (n !== "solo" && n !== "summary" && n !== "soloSummary") { const a = res.A[n]; console.log("  " + n.padEnd(8) + " p50=" + String(a.p50).padStart(7) + " hue=" + a.hue + " solo=" + String(a.soloP50).padStart(7) + " xTalk=" + (a.crossTalk >= 0 ? "+" : "") + a.crossTalk + " areaFrac=" + a.areaFrac); }
console.log("  A all-9:  strictOrder=" + s.strictOrder + " andTestPass=" + s.andTestPass);
console.log("  A solo:   strictOrder=" + ss.strictOrder + " andTestPass=" + ss.andTestPass);
console.log("  A pairs (all9): " + s.pairs.map((x) => x.pair + "(dl " + x.dluma + ", dh " + x.dhue + (x.inverted ? " INV" : "") + (x.collision ? " COLLIDE" : "") + ")").join(" "));
console.log("  A pairs (solo): " + ss.pairs.map((x) => x.pair + "(dl " + x.dluma + ", dh " + x.dhue + (x.inverted ? " INV" : "") + (x.collision ? " COLLIDE" : "") + ")").join(" "));
console.log("B silhouettes (areaFrac96 front/back):");
for (const k of Object.keys(res.B)) console.log("  " + k.padEnd(8) + " front=" + res.B[k].front.areaFrac96 + " back=" + res.B[k].back.areaFrac96);
console.log("C low-DPR margins (p90 - bgP50):");
for (const k of Object.keys(res.C)) console.log("  " + k.padEnd(8) + " margin=" + res.C[k].margin + " p90=" + res.C[k].p90 + " hue=" + res.C[k].hue + " n=" + res.C[k].n);
console.log("D telegraphs: " + JSON.stringify(res.D));
console.log("E pngs written: " + pngCount);
console.log("consoleErrors:", consoleErrs.length, consoleErrs.slice(0, 5));
await browser.close();
