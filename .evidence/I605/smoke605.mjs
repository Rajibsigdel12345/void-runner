// I605 smoke: shipped ST-569 R2 banded radial dolly - live browser sanity on the CURRENT build.
// Boot endless, scripted N-rim -> S-rim crossing (400 rAF frames), assert: consoleErrors 0,
// all ship/cam coords finite, cam-ship distance sane, per-frame ship-relative cam azimuth steps recorded
// (the runtime cam damper smooths the target-level whip; the probe owns the frozen ceiling).
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync } from "node:fs";

const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I605/";
const PORT = 5173;
const BASE = "http://localhost:5173";
const W = 1280, H = 720;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function poll(port) {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.camera || !vr.shipGroup || !vr.assetLoader) return false; return ["ship", "rockL", "rockM", "rockS", "rockComet", "debrisChunk", "debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); };

const srv = spawn(process.execPath, ["scripts/serve.mjs", String(PORT)], { cwd: "E:/Game", stdio: "ignore" });
let up = false;
for (let i = 0; i < 40 && !up; i++) { up = await poll(PORT); if (!up) await sleep(500); }
if (!up) { console.log("HARNESS-FAIL: dev server"); srv.kill(); process.exit(1); }
const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const R = { consoleErrors: [], flight: null, ok: false };
try {
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") R.consoleErrors.push(m.text()); });
  p.on("pageerror", (e) => { R.pageerror = (R.pageerror || 0) + 1; });
  await p.goto(BASE + "/?nocache=i605smoke", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 45000 });
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71401); vr.world.begin(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  const flight = await p.evaluate(async () => {
    const vr = window.__vr;
    const world = vr.world;
    const ship = world.ship;
    const N = 400, Y0 = 26, Y1 = -26;
    ship.pos.x = 0; ship.pos.y = Y0; ship.vel.x = 0; ship.vel.y = 0; ship.aim = -Math.PI / 2;
    const frames = [];
    let maxStep = 0, maxCamStep = 0, minD = 1e9, maxD = 0, bad = 0, prev = null;
    await new Promise((resolve) => {
      let i = 0;
      const loop = () => {
        ship.pos.x = 0;
        ship.pos.y = Y0 + (Y1 - Y0) * (i / N);
        ship.vel.x = 0; ship.vel.y = 0; ship.aim = -Math.PI / 2;
        const cam = vr.camera.position;
        const sx = ship.pos.x, sy = ship.pos.y;
        const az = Math.atan2(cam.z - sy, cam.x - sx);
        const d = Math.hypot(cam.z - sy, cam.x - sx, cam.y);
        if (!(isFinite(cam.x) && isFinite(cam.y) && isFinite(cam.z) && isFinite(sx) && isFinite(sy))) bad++;
        if (prev) {
          let st = Math.abs(az - prev.az);
          while (st > Math.PI) st -= 2 * Math.PI;
          if (st > maxStep) maxStep = st;
          const cs = Math.hypot(cam.x - prev.cx, cam.z - prev.cz);
          if (cs > maxCamStep) maxCamStep = cs;
        }
        if (d < minD) minD = d; if (d > maxD) maxD = d;
        if (i % 20 === 0 || i === N - 1) frames.push({ i, sy: +sy.toFixed(2), cam: [+cam.x.toFixed(2), +cam.y.toFixed(2), +cam.z.toFixed(2)], azRelDeg: +(az * 180 / Math.PI).toFixed(1), dist: +d.toFixed(2) });
        prev = { az, cx: cam.x, cz: cam.z };
        i++;
        if (i >= N) { resolve(); return; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    return { frames, maxStepDeg: +(maxStep * 180 / Math.PI).toFixed(2), maxCamStep: +maxCamStep.toFixed(3), minDist: +minD.toFixed(2), maxDist: +maxD.toFixed(2), bad, state: world.state };
  });
  R.flight = flight;
  const fin = flight.bad === 0 && flight.maxDist < 60 && flight.minDist > 2 && flight.maxCamStep < 30;
  R.ok = fin && R.consoleErrors.length === 0 && !(R.pageerror > 0);
} finally {
  await ctx.close();
  await browser.close();
  srv.kill();
  let free = false;
  for (let i = 0; i < 40 && !free; i++) { free = await poll(PORT) === false; if (!free) await sleep(500); }
  R.portFree = free;
}
writeFileSync(OUT + "smoke605.json", JSON.stringify(R, null, 2), "latin1");
console.log("OK=" + R.ok, "portFree=" + R.portFree, "consoleErrors=" + R.consoleErrors.length, "pageerror=" + (R.pageerror || 0));
if (R.flight) console.log("maxStep=" + R.flight.maxStepDeg + "deg maxCamStep=" + R.flight.maxCamStep + " minDist=" + R.flight.minDist + " maxDist=" + R.flight.maxDist + " bad=" + R.flight.bad);
for (const f of (R.flight ? R.flight.frames : [])) console.log(JSON.stringify(f));