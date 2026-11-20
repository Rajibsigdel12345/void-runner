// I550 (ST-516, E75 D1b): COCKPIT BOW-FRAMING probe - MEASURES the real ship v7 bow geometry
// and sweeps candidate cockpit configs (eye height x look drop) projecting the bow vertex
// cloud through the camera. Single boot, single synchronous evaluate (no tick interference).
// Output: bowprobe550.json + cockpit_sweep.png (best candidate rendered live).
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { CONFIG } from "../../src/core/config.js";

const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I550/";
const BASE = "http://localhost:5173";
const PORT = 5173;
const cam = CONFIG.camera;
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function poll(port) {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

const srv = spawn(process.execPath, ["scripts/serve.mjs", String(PORT)], { cwd: "E:/Game", stdio: "ignore" });
let up = false;
for (let i = 0; i < 40 && !up; i++) { up = await poll(PORT); if (!up) await sleep(500); }
if (!up) { console.log("HARNESS-FAIL: dev server did not start on :" + PORT); process.exit(1); }

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const C = { e: [], w: [] };
p.on("console", (m) => { if (m.type() === "error") C.e.push(m.text()); else if (m.type() === "warning") C.w.push(m.text()); });
p.on("pageerror", (e) => C.e.push("pageerror: " + e.message));

const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.arenaFloor || !vr.debris || !vr.assetLoader) return false; return ["ship", "rockL", "rockM", "rockS", "rockComet", "debrisChunk", "debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); };

const R = {};
try {
  await p.goto(BASE + "/?nocache=i550bow", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71202); vr.world.begin(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  await p.waitForTimeout(600);

  // pin the ship at the center, zero velocity, nose -Y
  await p.evaluate(() => { const s = window.__vr.world.ship; s.pos.x = 0; s.pos.y = 0; s.vel.x = 0; s.vel.y = 0; s.aim = -Math.PI / 2; });
  await p.waitForTimeout(250);

  R.sweep = await p.evaluate(`(() => {
    const vr = window.__vr;
    const s = vr.world.ship;
    s.pos.x = 0; s.pos.y = 0; s.vel.x = 0; s.vel.y = 0; s.aim = -Math.PI / 2;
    const g = vr.shipGroup; g.updateMatrixWorld(true);
    const V = vr.camera.position.constructor;
    const SETBACK = ${cam.cockpitSetback};
    const fwd = { x: Math.cos(s.aim), y: Math.sin(s.aim) };
    const seat = { x: s.pos.x - fwd.x * SETBACK, z: s.pos.y - fwd.y * SETBACK };
    const SKIP = /flame|trail|shield|glow|ring|beam|spark|plume|trail|engine|wisp|dot|flash|puff|wake|contrail/i;
    const meshNames = [];
    const pts = [];
    const v = new V();
    g.traverse((o) => {
      if (!o.isMesh) return;
      const nm = (o.name || "") + "|" + ((o.material && o.material.name) || "");
      if (SKIP.test(nm)) return;
      meshNames.push(o.name || "(anon)");
      const pos = o.geometry && o.geometry.attributes.position; if (!pos) return;
      const step = Math.max(1, Math.floor(pos.count / 1200));
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        const dx = v.x - seat.x, dz = v.z - seat.z;
        const d = dx * fwd.x + dz * fwd.y;
        const lat = Math.abs(-fwd.y * dx + fwd.x * dz);
        if (d > -0.05 && d < 4.5 && lat < 0.65 && v.y > 0.05) pts.push([v.x, v.y, v.z]);
      }
    });
    const c2 = vr.camera;
    const saved = { x: c2.position.x, y: c2.position.y, z: c2.position.z, fov: c2.fov, mwi: c2.matrixWorldInverse.clone() };
    let dbg = null;
    const results = [];
    const heights = [0.62, 0.75, 0.9, 1.02];
    const drops = [2, 4, 6, 8, 10, 14];
    const LOOKFAR = ${cam.cockpitLookFar};
    const FOV = ${cam.fovBase};
    for (const h of heights) for (const drop of drops) {
      c2.position.set(seat.x, h, seat.z);
      c2.updateMatrixWorld(true); // lookAt reads the world position - sync it first
      c2.up.set(0, 1, 0);
      c2.lookAt(s.pos.x + fwd.x * LOOKFAR, h - drop, s.pos.y + fwd.y * LOOKFAR);
      c2.fov = FOV; c2.updateProjectionMatrix();
      c2.updateMatrixWorld(true);
      c2.matrixWorldInverse.copy(c2.matrixWorld).invert();
      if (h === heights[0] && drop === drops[0]) dbg = { camWorld: [c2.position.x, c2.position.y, c2.position.z], parent: c2.parent ? (c2.parent.name || "(parent)") : null, bowView: (function () { const vv = new V(0, 0.45, -0.85).applyMatrix4(c2.matrixWorldInverse); return [vv.x, vv.y, vv.z]; })(), horizonClip: (function () { const vv = new V(0, 0, -300).applyMatrix4(c2.matrixWorldInverse); const qq = vv.clone().applyMatrix4(c2.projectionMatrix); return [qq.x, qq.y, vv.z]; })() };
      let inF = 0, minD = 1e9, yMin = 1e9, yMax = -1e9, xMin = 1e9, xMax = -1e9, centerBand = 0;
      const q = new V();
      for (const pt of pts) {
        v.set(pt[0], pt[1], pt[2]).applyMatrix4(c2.matrixWorldInverse);
        const depth = -v.z;
        if (depth <= 0.01) continue;
        q.copy(v).applyMatrix4(c2.projectionMatrix);
        const nx = q.x, ny = q.y; // r187: applyMatrix4 already divides by w -> q IS NDC
        if (depth > 0.12 && Math.abs(nx) <= 1 && Math.abs(ny) <= 1) {
          inF++; if (depth < minD) minD = depth;
          if (ny < yMin) yMin = ny; if (ny > yMax) yMax = ny;
          if (nx < xMin) xMin = nx; if (nx > xMax) xMax = nx;
          if (Math.abs(nx) < 0.15 && Math.abs(ny) < 0.15) centerBand++;
        }
      }
      v.set(s.pos.x + fwd.x * 300, 0, s.pos.y + fwd.y * 300).applyMatrix4(c2.matrixWorldInverse);
      q.copy(v).applyMatrix4(c2.projectionMatrix);
      results.push({ h: h, drop: drop, inF: inF, minD: +minD.toFixed(3), yMin: +yMin.toFixed(3), yMax: +yMax.toFixed(3), xMin: +xMin.toFixed(3), xMax: +xMax.toFixed(3), centerBand: centerBand, horizonY: +q.y.toFixed(3) });
    }
    c2.position.set(saved.x, saved.y, saved.z);
    c2.fov = saved.fov; c2.updateProjectionMatrix();
    c2.matrixWorldInverse.copy(saved.mwi);
    return { dbg: dbg, nPts: pts.length, meshes: [...new Set(meshNames)], shipGroupPos: [g.position.x, g.position.y, g.position.z], shipGroupRotZ: +g.rotation.z.toFixed(3), shipWorldY: g.position.y, results: results };
  })()`);

  // render the CURRENT-config cockpit frame for reference (live tick places the camera)
  await p.keyboard.press("v"); // chase -> overview
  await p.waitForTimeout(300);
  await p.keyboard.press("v"); // overview -> cockpit
  await p.waitForTimeout(1800);
  const ck = await p.evaluate(() => {
    const vr = window.__vr; const c2 = vr.camera;
    const m = c2.matrixWorld.elements;
    return { camMode: vr.camMode(), camPos: [c2.position.x, c2.position.y, c2.position.z], camDir: [-m[8], -m[9], -m[10]], fov: c2.fov };
  });
  R.liveCockpit = ck;
  await p.screenshot({ path: OUT + "cockpit_before.png" });
} finally {
  await browser.close().catch(() => {});
  srv.kill("SIGTERM");
  await sleep(400);
}

R.console = { errors: C.e.length, warnings: C.w.length, sample: C.e.slice(0, 5) };
writeFileSync(OUT + "bowprobe550.json", JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1).slice(0, 6000));
