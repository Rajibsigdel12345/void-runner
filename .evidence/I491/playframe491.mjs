// I491 (ST-458, G64.0 close gate) re-tag of the I483 harness: fresh playframe at the I471 pin set - all E64 work
// (ST-452..ST-457) is campaign-gated; the A (MENU) and B (endless PLAYING, reseed 71201) windows are
// bit-identical - expect EXACT, no re-pins.
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I491/";
const BASE = "http://localhost:5173";
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const C = { A: { e: [], w: [] }, B: { e: [], w: [] } };
const wire = (p, k) => { p.on("console", (m) => { if (m.type() === "error") C[k].e.push(m.text()); else if (m.type() === "warning") C[k].w.push(m.text()); }); p.on("pageerror", (e) => C[k].e.push("pageerror: " + e.message)); };
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.arenaFloor || !vr.debris || !vr.assetLoader) return false; return ["ship", "rockL", "rockM", "rockS", "rockComet", "debrisChunk", "debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); };  // I503: +ship-ready gate (same 581 KB v6 GLB swap-in race as I483; pins 25,781/55,400 already post-swap state; I612: pins 82,369/172,476 already post-v9-swap state, 1,441,348 B meshopt ship)
const setFx = async (p, tier) => { for (let i = 0; i < 6; i++) { const cur = await p.evaluate(() => window.__vr.liveSettings().fx); if (cur === tier) return cur; await p.keyboard.press("f"); await p.waitForTimeout(120); } return p.evaluate(() => window.__vr.liveSettings().fx); };

// ---------------- PART A ----------------
const pA = await ctx.newPage(); wire(pA, "A");
await pA.goto(BASE + "/?nocache=i491pa", { waitUntil: "load" });
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
await pB.goto(BASE + "/?nocache=i491pb", { waitUntil: "load" });
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
check("A: L exact 22/92435 (I634 (ST-593, E93 D1) RE-PIN WITH MEASUREMENT: 22/84265 -> 22/92435, delta +8,170 = ship GLB 82,151 -> 90,321 exactly (v10 Mk.II warship 93,730 t build-space - GLTF export dedupe -3,409; 1,441,348 B -> 1,642,960 B meshopt-encoded; fx=off single scene pass: non-ship 2,114 tris unchanged = 218 base + arena ring v2 two-pass 2 x 948; I634 .evidence/I634/measure_playframe634.cjs measured L=22/92435 exactly, P 11/2076 unchanged). I623 (ST-583, E90 D3) RE-PIN WITH MEASUREMENT: 22/82369 -> 22/84265, delta +1,896 = arena ring v1 60 t (band 48 + ticks 12) -> v2 1,008 t (band 864 torus + ticks 144) drawn through the r187 built-in transparent-DoubleSide two-pass (renderObject back-then-front, forceSinglePass default false): delta = 2 x (1,008 - 60). The two-pass was already active in v1 (the old P pin 180 = floor 48 + 2 x 60 ring + 12 residual), so behavior is unchanged - I623 only made the ring 16.8x denser. fx=off single scene pass, 22 calls unchanged, all other geometry bit-identical; I623 playframe491 measured L=22/84265 exactly. I612 (ST-577, E89) RE-PIN WITH MEASUREMENT: 22/62472 -> 22/82369, delta +19,897 = ship GLB 62,254 -> 82,151 exactly (v9 warship airship 1,800,612 B raw -> 1,441,348 B meshopt-encoded; fx=off single scene pass: non-ship 218 tris unchanged; I612 playframe491 probe measured L=22/82369 exactly, P 11/180 unchanged). I587 (ST-554, E83) EXPLICIT re-pin WITH MEASUREMENT: 22/32717 -> 22/62472, delta +29,755 = ship 32,499 -> 62,254 exactly (fx=off single scene pass: non-ship 218 tris unchanged; v8 GLB post-import 62,254 t vs build-space 64,884 t - GLTF export dedupe -2,630, the in-game renderer draws the GLB indices; I587 probe playframe_probe587.out measured L=22/62472 exactly, P 11/180 unchanged). I541 (ST-507 ship v7) EXPLICIT re-pin WITH MEASUREMENT: 22/25781 -> 22/32717, delta +6,936 = ship GLB 25,563 -> 32,499 exactly (fx=off single scene pass: non-ship 218 tris unchanged). I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 22/17361 -> 22/25781, delta +8,420 = ship GLB 17,143 -> 25,563 exactly (fx=off single scene pass: ship + flame + floorDisc 48 + ring + sprite unchanged at 218 non-ship tris). I497 note below still governs the vendor pin. I497 re-pin WITH MEASUREMENT: I494 vendor r160->r187 - r187 CylinderGeometry.generateBody skips the degenerate zero-area tip triangles (radiusTop>0 || y!==0 guard, vendor diff I497 probe) -> the 2 ship flame cones draw half their indices (measured per-frame in the pin frame: 40->20 + 32->16 = -36 tris, all inside the ship group; GLB 17143 / floorDisc 48 / ArenaRing 120 / sprite 2 all unchanged; degenerate tris drew nothing - no visual change). Pre-I494 the pin was 22/17397 (I471); I494..I496 quality bars omitted the playframe regression so the drift went uncaught - I497 work proven innocent (committed I496 baseline worktree renders the identical 22/17361).", RA.L.calls === 22 && RA.L.tris === 92435, "L=" + RA.L.calls + "/" + RA.L.tris);
check("A: P exact 11/2076 (I623 (ST-583, E90 D3) RE-PIN WITH MEASUREMENT: 11/180 -> 11/2076, delta +1,896 = arena ring 60 t -> 1,008 t drawn 2x through the r187 transparent-DoubleSide two-pass (2 x 948); floor 48 + B3 starflares call + 12 residual unchanged; 11 calls unchanged. I467 re-pin: +1 = B3 starflares additive Points draw call, 0 tri delta)", RA.P.calls === 11 && RA.P.tris === 2076, "P=" + RA.P.calls + "/" + RA.P.tris);
check("B: pre PLAYING", RB.pre.state === "PLAYING");
check("B: post PLAYING", RB.post.state === "PLAYING");
check("B: 52/200808 (I634 (ST-593, E93 D1) RE-PIN WITH MEASUREMENT: 52/184468 -> 52/200808, delta +16,340 = 2 x 8,170 (fx=high two-pass: single-pass scene 92,234 -> 100,404, +8,170 ship 82,151 -> 90,321 only, non-ship + rock frustum unchanged at reseed 71201; hv=0/gv=0; 52 calls unchanged; I634 .evidence/I634/measure_playframe634.cjs measured calls/tris=52/200808 exactly). I623 (ST-583, E90 D3) RE-PIN WITH MEASUREMENT: 52/180676 -> 52/184468, delta +3,792 = 2 x 1,896 (fx=high two-pass doubles the single-pass scene delta - the arena ring v1 60 t -> v2 1,008 t through the r187 transparent-DoubleSide two-pass; rock frustum / hv / gv unchanged at reseed 71201; hv=0/gv=0; 52 calls unchanged; I623 playframe491 measured calls/tris=52/184468 exactly). I621 (ST-581, E90 D1) RE-PIN WITH MEASUREMENT: 52/172476 -> 52/180676, delta +8,200 = the 2 in-frustum B-window pool rocks at reseed 71201 (rock v13: L 6,000 -> 12,000 +6,000, M 1,800 -> 4,000 +2,200; rockInFrustum 7,800 -> 16,000 per frame, rocks drawn once per B frame; hv=0/gv=0; 52 calls unchanged; I621 playframe491 measured calls/tris=52/180676 exactly). I612 (ST-577, E89) RE-PIN WITH MEASUREMENT: 52/132682 -> 52/172476, delta +39,794 = 2 x 19,897 (fx=high two-pass: single-pass scene 66,341 -> 86,238, +19,897 ship 62,254 -> 82,151 only, non-ship + rock frustum unchanged at reseed 71201; hv=0/gv=0; 52 calls unchanged; I612 playframe491 probe measured calls/tris=52/172476 exactly). I587 (ST-554, E83) RE-PIN WITH MEASUREMENT: 52/73172 -> 52/132682, delta +59,510 = 2 x 29,755 (fx=high two-pass: single-pass scene 34,636 -> 64,391, +29,755 ship 32,499->62,254 only, non-ship 2,137 + rock frustum 3,900 unchanged at reseed 71201; hv=0/gv=0; 52 calls unchanged; I587 probe measured calls/tris=52/132682 exactly). I554 (ST-520, E75 D5) RE-PIN WITH MEASUREMENT: 52/69272 -> 52/73172, delta +3,900 = the 2 in-frustum B-window pool rocks at reseed 71201 (L v2 3000->6000 + M v0 900->1800; rockInFrustum 3,900 -> 7,800 per frame, rocks drawn once per B frame; the 3 other L rocks are frustum-culled in both old and new; 52 calls unchanged; hv=0/gv=0; bwinprobe554_v3 measured: old GLB 52/69272 rockInFrustum 3900, new v12 GLB 52/73172 rockInFrustum 7800; A window unchanged at 22/32717 - MENU draws no rocks) I541 (ST-507 ship v7) EXPLICIT re-pin WITH MEASUREMENT: 52/55400 -> 52/69272, delta +13,872 = 2 x 6,936 (fx=high two-pass: single-pass scene 27,700 -> 34,636, +6,936 ship 25,563->32,499 only, non-ship 2,137 unchanged at reseed 71201; hv=0/gv=0). I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 52/38560 -> 52/55400, delta +16,840 = 2 x 8,420 - the fx=high B window renders the scene in two passes (main + fx scene pass), so every scene tri is drawn twice; single-pass scene 19,280 -> 27,700 (+8,420 ship only, non-ship 2,137 unchanged: rocks/ring/floor/flame identical at reseed 71201). I471 pin note: measured B window (reseed 71201 frame 50) has 0 visible hunters / 0 visible gunships (hv=0/gv=0); same 52 calls, I443 decomposition unchanged)", RB.calls === 52 && RB.tris === 200808, "calls/tris=" + RB.calls + "/" + RB.tris + " hv=" + RB.hunterVis + " gv=" + RB.gunshipVis);
check("B: cam finite", RB.camFinite === true);
writeFileSync(OUT + "playframe483.json", JSON.stringify({ RA, RB, console: C }, null, 1));
console.log("console A err/warn=" + C.A.e.length + "/" + C.A.w.length + " B=" + C.B.e.length + "/" + C.B.w.length);
console.log(fail === 0 ? "PLAYFRAME456 PASS" : "PLAYFRAME456 FAIL (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
