// I473 (ST-440) re-tag of the I471 harness (enemy v5 detail pass; A pin holds - MENU frame has no enemies; B pin MEASURED first with per-type visible counts, then re-pinned with the decomposition below): playframe fresh re-run at the I466 pins (A 22/14,530 + 11/180, B 52/32,826) - E60 close regression; the I466 FX pass moved the pins by the documented B3 +1 (composer leftover) / +2 (autoReset=false double-count) and nothing has changed since - expect deterministic PASS.
// = MENU frame 21/14,530 + 10/180; Part B = PLAYING frame 50/31,406 (ship v4 draws twice:
// composer frame + frozen plain frame, per the I443 airtight decomposition). These pins
// supersede the I451 21/12,654 + 10/180 / 50/27,654 (stale after ST-424 by construction).
// I542 (ST-508 G73.0 gate): re-pin WITH MEASUREMENT (A 22/25781 -> 22/32717, B 52/55400 -> 52/69272 = the I541 ship v7 swap delta propagated from the I541 I491 re-pin; boss swap contributes 0 to both windows). // I503 (ST-469 boss v2): re-pin WITH MEASUREMENT (A 22/17397 -> 22/25781, B 52/38560 -> 52/55400 = the ST-467 ship v6 delta propagated from the I501 I491 re-pin; boss swap contributes 0 to both windows) + ship-ready gate in readyFn below.
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I483/";
const BASE = "http://localhost:5173";
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const C = { A: { e: [], w: [] }, B: { e: [], w: [] } };
const wire = (p, k) => { p.on("console", (m) => { if (m.type() === "error") C[k].e.push(m.text()); else if (m.type() === "warning") C[k].w.push(m.text()); }); p.on("pageerror", (e) => C[k].e.push("pageerror: " + e.message)); };
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.arenaFloor || !vr.debris || !vr.assetLoader) return false; return ["ship", "rockL", "rockM", "rockS", "rockComet", "debrisChunk", "debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); }; // I503: +ship-ready gate (581 KB v6 GLB swap-in race; pin values unchanged = post-swap state)
const setFx = async (p, tier) => { for (let i = 0; i < 6; i++) { const cur = await p.evaluate(() => window.__vr.liveSettings().fx); if (cur === tier) return cur; await p.keyboard.press("f"); await p.waitForTimeout(120); } return p.evaluate(() => window.__vr.liveSettings().fx); };

// ---------------- PART A ----------------
const pA = await ctx.newPage(); wire(pA, "A");
await pA.goto(BASE + "/?nocache=i483pa", { waitUntil: "load" });
await pA.waitForFunction(readyFn, { timeout: 30000 });
const fxA = await setFx(pA, "off");
const RA = await pA.evaluate(() => {
  const vr = window.__vr;
  const r = vr.renderer;
  window.requestAnimationFrame = () => 0;
  const L = { calls: r.info.render.calls, tris: r.info.render.tris || r.info.render.triangles };
  vr.world.reseed(71200);
  vr.shipGroup.visible = false;
  if (vr.reticle && vr.reticle.visible !== undefined) vr.reticle.visible = false;
  const pool = vr.rockRenders.pool;
  const poolVis = pool.map((m) => m.visible);
  pool.forEach((m) => { m.visible = false; });
  vr.particles.sync(0);
  const cam = vr.camera;
  cam.position.set(0, 48, 0.001); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  cam.fov = 60; cam.near = 0.1; cam.far = 400;
  r.setPixelRatio(1); r.setSize(1280, 720);
  cam.aspect = 1280 / 720; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  r.info.reset();
  vr.render();
  const P = { calls: r.info.render.calls, tris: r.info.render.tris || r.info.render.triangles };
  pool.forEach((m, i) => { m.visible = poolVis[i]; });
  vr.shipGroup.visible = true;
  if (vr.reticle) vr.reticle.visible = true;
  return { state: vr.world.game.state, fx: vr.liveSettings().fx, L, P, calls: P.calls, tris: P.tris, debrisLive: vr.debrisLive(), debrisVis: vr.debris.meshes.map((m) => m.visible), debrisCount: vr.debris.meshes.map((m) => m.count) };
});
await pA.close();

// ---------------- PART B ----------------
const pB = await ctx.newPage(); wire(pB, "B");
await pB.goto(BASE + "/?nocache=i483pb", { waitUntil: "load" });
await pB.waitForFunction(readyFn, { timeout: 30000 });
const fxB = await setFx(pB, "high");
await pB.evaluate(() => { const vr = window.__vr; vr.world.reseed(71201); vr.world.begin(); });
await pB.waitForTimeout(500);
const RB = await pB.evaluate(() => {
  const vr = window.__vr;
  const pre = { state: vr.world.game.state, rocks: vr.rockRenders.pool.filter((m) => m.visible).length };
  vr.advance(2.5);
  const post = { state: vr.world.game.state, rocks: vr.rockRenders.pool.filter((m) => m.visible).length };
  window.requestAnimationFrame = () => 0;
  const cam = vr.camera;
  const r = vr.renderer; r.setPixelRatio(1); r.setSize(1280, 720);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  vr.render();
  const info = r.info.render;
  const cp = cam.position;
  return { pre, post, fx: vr.liveSettings().fx, calls: info.calls, tris: info.tris || info.triangles, debrisLive: vr.debrisLive(), debrisVis: vr.debris.meshes.map((m) => m.visible), hunterVis: vr.hunterRenders.pool.filter((g) => g.visible).length, gunshipVis: vr.gunshipRenders.pool.filter((g) => g.visible).length, camFinite: Number.isFinite(cp.x) && Number.isFinite(cp.y) && Number.isFinite(cp.z) };
});
await pB.close();
await browser.close();

let fail = 0;
const check = (name, ok, extra) => { if (!ok) fail++; console.log((ok ? "ok   " : "FAIL ") + name + (extra ? "  [" + extra + "]" : "")); };
check("A: state MENU", RA.state === "MENU");
check("A: L exact 22/32717 (I542 (ST-508 G73.0 gate) re-pin WITH MEASUREMENT of the I541 ship v7 swap: 22/25781 -> 22/32717, delta +6,936 = ship GLB 25,563 -> 32,499 exactly (fx=off single scene pass; non-ship 218 unchanged; boss v2 NOT drawn in the MENU A window - contributes 0; identical to the I541 I491 re-pin). I503 (ST-469 boss v2) history: re-pin WITH MEASUREMENT of the ST-467 ship v6 delta 22/17397 -> 22/25781, delta +8,420 = ship GLB 17,143 -> 25,563 (fx=off single scene pass; non-ship 218 unchanged; measured 25,781 in 3 deterministic I503 runs). I471 note: MENU frame draws no enemies; same 22 calls, ship once)", RA.L.calls === 22 && RA.L.tris === 32717, "L=" + RA.L.calls + "/" + RA.L.tris);
check("A: P exact 11/180 (I467 re-pin: +1 = B3 starflares additive Points draw call, 0 tri delta)", RA.P.calls === 11 && RA.P.tris === 180, "P=" + RA.P.calls + "/" + RA.P.tris);
check("B: pre PLAYING", RB.pre.state === "PLAYING");
check("B: post PLAYING", RB.post.state === "PLAYING");
check("B: 52/73172 (I554 (ST-520, E75 D5) RE-PIN WITH MEASUREMENT: 52/69272 -> 52/73172, delta +3,900 = the 2 in-frustum B-window pool rocks at reseed 71201 (L v2 3000->6000 + M v0 900->1800; rockInFrustum 3,900 -> 7,800 per frame, rocks drawn once per B frame; the 3 other L rocks are frustum-culled in both old and new; 52 calls unchanged; hv=0/gv=0; bwinprobe554_v3 measured: old GLB 52/69272 rockInFrustum 3900, new v12 GLB 52/73172 rockInFrustum 7800; A window unchanged at 22/32717 - MENU draws no rocks) I542 (ST-508 G73.0 gate) re-pin WITH MEASUREMENT of the I541 ship v7 swap: 52/55400 -> 52/69272, delta +13,872 = 2 x 6,936 (fx=high B window draws every scene tri twice: single-pass scene 27,700 -> 34,636; boss v2 NOT drawn at reseed 71201 frame 50 - contributes 0; identical to the I541 I491 re-pin). I503 (ST-469 boss v2) history: re-pin WITH MEASUREMENT of the ST-467 ship v6 delta 52/38560 -> 52/55400, delta +16,840 = 2 x 8,420 (fx=high B window draws every scene tri twice; single-pass scene 19,280 -> 27,700; measured 55,400 in 3 deterministic I503 runs). I471 note: B window has 0 visible hunters / gunships (hv=0/gv=0); same 52 calls, I443 decomposition unchanged)", RB.calls === 52 && RB.tris === 73172, "calls/tris=" + RB.calls + "/" + RB.tris + " hv=" + RB.hunterVis + " gv=" + RB.gunshipVis);
check("B: cam finite", RB.camFinite === true);
writeFileSync(OUT + "playframe483.json", JSON.stringify({ RA, RB, console: C }, null, 1));
console.log("console A err/warn=" + C.A.e.length + "/" + C.A.w.length + " B=" + C.B.e.length + "/" + C.B.w.length);
console.log(fail === 0 ? "PLAYFRAME456 PASS" : "PLAYFRAME456 FAIL (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
