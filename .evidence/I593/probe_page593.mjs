// I593 (ST-560, E84): playframe probe - measures A (MENU, reseed 71200) + B (endless PLAYING, reseed 71201)
// draw-calls/tris AND per-ship in-frustum visibility for the 4 remastered legacy-4 ships (drone/stinger/flyer/warden),
// per the frozen scope-check-E84 pin rule: B 52/132,682 PROBE FIRST -> re-pin WITH MEASUREMENT only if a
// remastered ship is in-frustum, else B stays EXACT. A EXPECTED EXACT 22/62,472 + P 11/180 (MENU draws no enemies).
import { chromium } from "playwright-core";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:5173";
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.arenaFloor || !vr.debris || !vr.assetLoader) return false; return ["ship", "rockL", "rockM", "rockS", "rockComet", "debrisChunk", "debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); };
const setFx = async (p, tier) => { for (let i = 0; i < 6; i++) { const cur = await p.evaluate(() => window.__vr.liveSettings().fx); if (cur === tier) return cur; await p.keyboard.press("f"); await p.waitForTimeout(120); } return p.evaluate(() => window.__vr.liveSettings().fx); };

// PART A (MENU)
const pA = await ctx.newPage();
await pA.goto(BASE + "/?nocache=i593pa", { waitUntil: "load" });
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
  return { state: vr.world.game.state, fx: vr.liveSettings().fx, L: L, P: P };
});
console.log("A: L=" + RA.L.calls + "/" + RA.L.tris + " P=" + RA.P.calls + "/" + RA.P.tris + " state=" + RA.state + " fx=" + RA.fx);
await pA.close();

// PART B (endless PLAYING, reseed 71201, frame 50)
const pB = await ctx.newPage();
await pB.goto(BASE + "/?nocache=i593pb", { waitUntil: "load" });
await pB.waitForFunction(readyFn, { timeout: 30000 });
const fxB = await setFx(pB, "high");
await pB.evaluate(() => { const vr = window.__vr; vr.world.reseed(71201); vr.world.begin(); });
await pB.waitForTimeout(500);
const RB = await pB.evaluate(() => {
  const vr = window.__vr;
  vr.advance(2.5);
  window.requestAnimationFrame = () => 0;
  const cam = vr.camera;
  const r = vr.renderer; r.setPixelRatio(1); r.setSize(1280, 720);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  vr.render();
  const info = r.info.render;
  const vis = (pool) => pool.filter((m) => m.visible).length;
  return {
    state: vr.world.game.state, fx: vr.liveSettings().fx,
    calls: info.calls, tris: info.tris || info.triangles,
    wave: (vr.world.wave !== undefined ? vr.world.wave : vr.world.game.wave),
    rocks: vis(vr.rockRenders.pool),
    drone: vis(vr.droneRenders.pool),
    stinger: vis(vr.stingerRenders.pool),
    flyer: vis(vr.flyerRenders.pool),
    warden: vr.wardenMesh ? vr.wardenMesh.visible : null,
    hunter: vis(vr.hunterRenders.pool),
    gunship: vis(vr.gunshipRenders.pool),
    sentry: vis(vr.sentryRenders.pool),
    wasp: vis(vr.waspRenders.pool),
    camFinite: Number.isFinite(cam.position.x) && Number.isFinite(cam.position.y) && Number.isFinite(cam.position.z)
  };
});
console.log("B: calls/tris=" + RB.calls + "/" + RB.tris + " state=" + RB.state + " fx=" + RB.fx + " wave=" + RB.wave + " rocks=" + RB.rocks);
console.log("B ships: drone=" + RB.drone + " stinger=" + RB.stinger + " flyer=" + RB.flyer + " warden=" + RB.warden + " hunter=" + RB.hunter + " gunship=" + RB.gunship + " sentry=" + RB.sentry + " wasp=" + RB.wasp + " camFinite=" + RB.camFinite);
await pB.close();
await browser.close();