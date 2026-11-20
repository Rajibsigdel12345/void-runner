// I550 debug 2: replicate the EXACT bowprobe dbg IIFEs in a clean boot and print intermediates.
import { spawn } from "node:child_process";
import http from "node:http";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { CONFIG } from "../../src/core/config.js";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const PORT = 5173;
const cam = CONFIG.camera;
mkdirSync("E:/Game/.evidence/I550/", { recursive: true });
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
if (!up) { console.log("HARNESS-FAIL"); process.exit(1); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.assetLoader) return false; return ["ship"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); };
try {
  await p.goto("http://localhost:5173/?nocache=i550dbg2", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71202); vr.world.begin(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  await p.waitForTimeout(500);
  const out = await p.evaluate(`(() => {
    const vr = window.__vr;
    const s = vr.world.ship;
    s.pos.x = 0; s.pos.y = 0; s.vel.x = 0; s.vel.y = 0; s.aim = -Math.PI / 2;
    const c2 = vr.camera;
    const V = c2.position.constructor;
    const SETBACK = ${cam.cockpitSetback};
    const LOOKFAR = ${cam.cockpitLookFar};
    const FOV = ${cam.fovBase};
    const fwd = { x: Math.cos(s.aim), y: Math.sin(s.aim) };
    const seat = { x: s.pos.x - fwd.x * SETBACK, z: s.pos.y - fwd.y * SETBACK };
    const out = { fovArg: FOV, lookfar: LOOKFAR, setback: SETBACK };
    const heights = [0.62]; const drops = [2];
    for (const h of heights) for (const drop of drops) {
      c2.position.set(seat.x, h, seat.z);
      c2.updateMatrixWorld(true);
      c2.up.set(0, 1, 0);
      c2.lookAt(s.pos.x + fwd.x * LOOKFAR, h - drop, s.pos.y + fwd.y * LOOKFAR);
      c2.fov = FOV; c2.updateProjectionMatrix();
      c2.updateMatrixWorld(true);
      c2.matrixWorldInverse.copy(c2.matrixWorld).invert();
      const bow = new V(0, 0.45, -0.85).applyMatrix4(c2.matrixWorldInverse);
      const vv = new V(0, 0, -300).applyMatrix4(c2.matrixWorldInverse);
      const qq = vv.clone().applyMatrix4(c2.projectionMatrix);
      out.bow = bow.toArray();
      out.vv = vv.toArray();
      out.vvW = vv.w;
      out.qq = qq.toArray();
      out.proj = c2.projectionMatrix.elements.slice();
      out.projBefore = null;
    }
    return out;
  })()`);
  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close().catch(() => {});
  srv.kill("SIGTERM");
  await sleep(400);
}
