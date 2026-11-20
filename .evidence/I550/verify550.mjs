// I550 (ST-516, E75 D1b): G-c VERIFY - live cockpit camera from the patched config
// (cockpitLookDrop 4.0). Single boot, live tick places the camera; the bow vertex cloud
// is projected through the LIVE camera (no overrides). Output: verify550.json + cockpit_after.png.
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I550/";
const BASE = "http://localhost:5173";
const PORT = 5173;
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
  await p.goto(BASE + "/?nocache=i550verify", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71202); vr.world.begin(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  await p.waitForTimeout(600);

  // pin the ship at the center, zero velocity, nose -Y; live tick then drives the cockpit camera
  await p.evaluate(() => { const s = window.__vr.world.ship; s.pos.x = 0; s.pos.y = 0; s.vel.x = 0; s.vel.y = 0; s.aim = -Math.PI / 2; });
  await p.waitForTimeout(1200);

  // V cycles chase -> overview -> cockpit (main.js L807)
  await p.keyboard.press("v");
  await p.waitForTimeout(300);
  await p.keyboard.press("v");
  await p.waitForTimeout(300);
  await p.waitForTimeout(1200); // live tick converges the cockpit camera (fov damp etc.)

  R.verify = await p.evaluate(`(() => {
    const vr = window.__vr;
    const s = vr.world.ship;
    const fwd = { x: Math.cos(s.aim), y: Math.sin(s.aim) };
    const SETBACK = ${JSON.stringify(0.15)};
    const seat = { x: s.pos.x - fwd.x * SETBACK, z: s.pos.y - fwd.y * SETBACK };
    const g = vr.shipGroup; g.updateMatrixWorld(true);
    const V = vr.camera.position.constructor;
    const SKIP = /flame|trail|shield|glow|ring|beam|spark|plume|trail|engine|wisp|dot|flash|puff|wake|contrail/i;
    const pts = [];
    const v = new V();
    g.traverse((o) => {
      if (!o.isMesh) return;
      const nm = (o.name || "") + "|" + ((o.material && o.material.name) || "");
      if (SKIP.test(nm)) return;
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
    c2.updateMatrixWorld(true);
    c2.matrixWorldInverse.copy(c2.matrixWorld).invert();
    let inF = 0, minD = 1e9, yMin = 1e9, yMax = -1e9, centerBand = 0;
    const q = new V();
    for (const pt of pts) {
      v.set(pt[0], pt[1], pt[2]).applyMatrix4(c2.matrixWorldInverse);
      const depth = -v.z;
      if (depth <= 0.01) continue;
      q.copy(v).applyMatrix4(c2.projectionMatrix); // r187: applyMatrix4 divides by w -> NDC
      if (depth > 0.12 && Math.abs(q.x) <= 1 && Math.abs(q.y) <= 1) {
        inF++; if (depth < minD) minD = depth;
        if (q.y < yMin) yMin = q.y; if (q.y > yMax) yMax = q.y;
        if (Math.abs(q.x) < 0.15 && Math.abs(q.y) < 0.15) centerBand++;
      }
    }
    v.set(s.pos.x + fwd.x * 300, 0, s.pos.y + fwd.y * 300).applyMatrix4(c2.matrixWorldInverse);
    q.copy(v).applyMatrix4(c2.projectionMatrix);
    return { camMode: vr.camMode(), camPos: [c2.position.x, c2.position.y, c2.position.z], fov: c2.fov,
             nPts: pts.length, inF: inF, minD: +minD.toFixed(3), yMin: +yMin.toFixed(3), yMax: +yMax.toFixed(3),
             centerBand: centerBand, horizonY: +q.y.toFixed(3) };
  })()`);

  await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + "cockpit_after.png" });
} finally {
  await browser.close().catch(() => {});
  srv.kill("SIGTERM");
  await sleep(400);
}

R.console = { errors: C.e.length, warnings: C.w.length, sample: C.e.slice(0, 5) };
writeFileSync(OUT + "verify550.json", JSON.stringify(R, null, 2));
const v = R.verify;
const ok = v && v.camMode === "cockpit" && v.inF / v.nPts >= 0.2 && v.yMin <= -0.9 && v.minD > 0.15 && v.horizonY >= 0.05 && v.horizonY <= 0.5 && R.console.errors === 0;
console.log(JSON.stringify(R, null, 1));
console.log(ok ? "G-C VERIFY PASS" : "G-C VERIFY FAIL");
