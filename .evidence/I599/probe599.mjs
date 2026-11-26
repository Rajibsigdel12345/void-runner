// I599 probe: ST-564 cockpit thrust basis == view direction (in-page wiring check)
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I599/";
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
const angDiff = (u, v) => { let d = (u - v) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.camera || !vr.shipGroup || !vr.assetLoader) return false; return ["ship", "rockL", "rockM", "rockS", "rockComet", "debrisChunk", "debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); };

// Page-side helpers (injected into every page) - operate on window.__vr, no Node refs.
const pageHelpers = "window.__vrAngDiff=function(u,v){let d=(u-v)%(2*Math.PI);if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;return Math.abs(d);};window.__vrReset=function(a){const vr=window.__vr;const w=vr.world;const s=w.ship;s.pos.x=0;s.pos.y=0;s.vel.x=0;s.vel.y=0;s.aim=a;s.invuln=1e9;if(w.field&&w.field.clear)w.field.clear();if(w.drones&&w.drones.clear)w.drones.clear();if(w.enemyBullets&&w.enemyBullets.clear)w.enemyBullets.clear();if(w.mines&&w.mines.clear)w.mines.clear();};window.__vrPark=function(fx,fy){window.dispatchEvent(new PointerEvent('pointermove',{clientX:fx*1280,clientY:fy*720}));};window.__vrShipRead=function(){const s=window.__vr.world.ship;const speed=Math.hypot(s.vel.x,s.vel.y);const velDir=speed>1e-6?Math.atan2(s.vel.y,s.vel.x):null;return{vel:{x:s.vel.x,y:s.vel.y},speed:speed,velDir:velDir,aim:s.aim};};window.__vrSettle=function(){const vr=window.__vr;const s=vr.world.ship;const t0=Date.now();return new Promise(function(res){let refAim=s.aim,refF=vr.framesRendered();(function step(){if(Date.now()-t0>8000){res({settled:false,aim:s.aim});return;}requestAnimationFrame(function(){const fr=vr.framesRendered();if(fr-refF>=30){if(Math.abs(s.aim-refAim)<(0.5*Math.PI/180)){res({settled:true,aim:s.aim});return;}refAim=s.aim;refF=fr;}step();});})();});};window.__vrHoldFrames=function(n){const vr=window.__vr;const st=vr.framesRendered();return new Promise(function(res){(function step(){if(vr.framesRendered()-st>=n){res();return;}requestAnimationFrame(step);})();});};";

const srv = spawn(process.execPath, ["scripts/serve.mjs", String(PORT)], { cwd: "E:/Game", stdio: "ignore" });
let up = false;
for (let i = 0; i < 40 && !up; i++) { up = await poll(PORT); if (!up) await sleep(500); }
if (!up) { console.log("HARNESS-FAIL: dev server"); process.exit(1); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
ctx.addInitScript(pageHelpers);
const R = { angles: [], chase: [], regression: null, consoleErrors: [] };
try {
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") R.consoleErrors.push(m.text()); });
  p.on("pageerror", (e) => R.consoleErrors.push("pageerror: " + e.message));
  await p.goto(BASE + "/?nocache=i599probe", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71301); vr.world.begin(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  await p.waitForTimeout(300);

  // ---- Part A: cockpit, 8 aim angles, steering engaged (pointer near center), hold W ----
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "cockpit" })); });
  await p.waitForTimeout(200);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    await p.evaluate((a) => { window.__vrReset(a); }, a);
    await p.evaluate(() => { window.__vrPark(0.5, 0.53); });
    const settle = await p.evaluate(() => window.__vrSettle());
    const aimStart = await p.evaluate(() => window.__vr.world.ship.aim);
    await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW", key: "w" })); });
    await p.evaluate(() => window.__vrHoldFrames(45));
    await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW", key: "w" })); });
    const res = await p.evaluate(() => window.__vrShipRead());
    const velDirDeg = res.velDir == null ? null : (res.velDir * 180) / Math.PI;
    const diffEndDeg = res.velDir == null ? null : (angDiff(res.velDir, res.aim) * 180) / Math.PI;
    const driftDeg = (angDiff(res.aim, aimStart) * 180) / Math.PI;
    R.angles.push({ k: k, aDeg: (a * 180) / Math.PI, settled: settle.settled, noseDeg: (res.aim * 180) / Math.PI, driftDeg: driftDeg, speed: res.speed, velDirDeg: velDirDeg, diffEndDeg: diffEndDeg });
  }
  // ---- Part B: chase cross-check, 3 angles, hold S -> velDir == +y ----
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "chase" })); });
  await p.waitForTimeout(200);
  for (const a of [0, Math.PI / 2, Math.PI]) {
    await p.evaluate((a) => { window.__vrReset(a); }, a);
    await p.evaluate(() => { window.__vrPark(0.5, 0.5); });
    await p.waitForTimeout(150);
    await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s" })); });
    await p.evaluate(() => window.__vrHoldFrames(45));
    await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyS", key: "s" })); });
    const res = await p.evaluate(() => window.__vrShipRead());
    const diffFromPlusY = res.velDir == null ? null : (angDiff(res.velDir, Math.PI / 2) * 180) / Math.PI;
    R.chase.push({ aDeg: (a * 180) / Math.PI, speed: res.speed, velDirDeg: res.velDir == null ? null : (res.velDir * 180) / Math.PI, diffFromPlusYDeg: diffFromPlusY });
  }
  // ---- Part C: regression demo (evidence, non-gate) - pointer lower-left, aim -PI/2, hold W ----
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "cockpit" })); });
  await p.waitForTimeout(150);
  await p.evaluate((a) => { window.__vrReset(a); }, -Math.PI / 2);
  await p.evaluate(() => { window.__vrPark(0.35, 0.85); });
  await p.evaluate(() => window.__vrSettle());
  const cStart = await p.evaluate(() => window.__vr.world.ship.aim);
  await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW", key: "w" })); });
  await p.evaluate(() => window.__vrHoldFrames(45));
  await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW", key: "w" })); });
  const cRes = await p.evaluate(() => window.__vrShipRead());
  R.regression = { aimStartDeg: (cStart * 180) / Math.PI, aimEndDeg: (cRes.aim * 180) / Math.PI, driftDeg: (angDiff(cRes.aim, cStart) * 180) / Math.PI, speed: cRes.speed, velDirDeg: cRes.velDir == null ? null : (cRes.velDir * 180) / Math.PI, diffEndDeg: cRes.velDir == null ? null : (angDiff(cRes.velDir, cRes.aim) * 180) / Math.PI };

  // ---- GATE ----
  // Part A acceptance: the ship must accelerate ALONG its steady nose (thrust basis == view dir):
  //   speed >= 0.5, |velDir - nose| <= 2deg, nose steady during hold (drift <= 3deg).
  let pass = true; const reasons = [];
  for (const r of R.angles) {
    if (r.speed < 0.5) { pass = false; reasons.push("A" + r.k + " speed=" + r.speed.toFixed(3)); }
    if (r.diffEndDeg == null || r.diffEndDeg > 2) { pass = false; reasons.push("A" + r.k + " diffEnd=" + (r.diffEndDeg == null ? "null" : r.diffEndDeg.toFixed(3))); }
    if (r.driftDeg > 3) { pass = false; reasons.push("A" + r.k + " drift=" + r.driftDeg.toFixed(3)); }
  }
  for (const c of R.chase) {
    if (c.diffFromPlusYDeg == null || c.diffFromPlusYDeg > 2) { pass = false; reasons.push("B a=" + c.aDeg + " diffFromPlusY=" + c.diffFromPlusYDeg); }
    if (c.speed < 0.5) { pass = false; reasons.push("B a=" + c.aDeg + " speed=" + c.speed.toFixed(3)); }
  }
  R.pass = pass; R.reasons = reasons; R.nAngles = R.angles.length; R.nChase = R.chase.length;
  writeFileSync(OUT + "probe599.json", JSON.stringify(R, null, 2));
  console.log((pass ? "PROBE599 PASS" : "PROBE599 FAIL") + " (n=" + (R.angles.length + R.chase.length) + ")");
  console.log("reasons: " + (reasons.join(" | ") || "none"));
  for (const r of R.angles) console.log("A k=" + r.k + " set=" + r.aDeg.toFixed(0) + "deg nose=" + r.noseDeg.toFixed(2) + " settled=" + r.settled + " drift=" + r.driftDeg.toFixed(3) + " speed=" + r.speed.toFixed(3) + " velDir=" + (r.velDirDeg == null ? "null" : r.velDirDeg.toFixed(2)) + " diffEnd=" + (r.diffEndDeg == null ? "null" : r.diffEndDeg.toFixed(3)));
  for (const c of R.chase) console.log("B a=" + c.aDeg.toFixed(0) + "deg speed=" + c.speed.toFixed(3) + " velDir=" + (c.velDirDeg == null ? "null" : c.velDirDeg.toFixed(2)) + " diffFromPlusY=" + c.diffFromPlusYDeg.toFixed(3));
  if (R.regression) { const g = R.regression; console.log("C [evidence] aimStart=" + g.aimStartDeg.toFixed(2) + " aimEnd=" + g.aimEndDeg.toFixed(2) + " drift=" + g.driftDeg.toFixed(3) + " velDir=" + (g.velDirDeg == null ? "null" : g.velDirDeg.toFixed(2)) + " diffEnd=" + (g.diffEndDeg == null ? "null" : g.diffEndDeg.toFixed(3)) + " speed=" + g.speed.toFixed(3)); }
  console.log("consoleErrors: " + R.consoleErrors.length + (R.consoleErrors.length ? " -> " + R.consoleErrors.slice(0, 5).join(" | ") : ""));
} finally {
  try { await browser.close(); } catch (e) {}
  srv.kill();
}