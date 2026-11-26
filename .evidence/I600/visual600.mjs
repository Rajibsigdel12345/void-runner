import { spawn } from "node:child_process";
import http from "node:http";
import { chromium } from "playwright-core";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I600/";
const PORT = 5173;
const BASE = "http://localhost:5173";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function poll(port) {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.world || !vr.camera || !vr.shipGroup || !vr.assetLoader) return false; return ["ship", "rockL", "rockM", "rockS", "rockComet", "debrisChunk", "debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); };
const helpers = "window.__vrClear=function(){const vr=window.__vr;const w=vr.world;const s=w.ship;s.pos.x=0;s.pos.y=0;s.vel.x=0;s.vel.y=0;s.aim=Math.PI/2;s.invuln=1e9;if(w.field&&w.field.clear)w.field.clear();if(w.drones&&w.drones.clear)w.drones.clear();if(w.enemyBullets&&w.enemyBullets.clear)w.enemyBullets.clear();if(w.mines&&w.mines.clear)w.mines.clear();};";
const srv = spawn(process.execPath, ["scripts/serve.mjs", String(PORT)], { cwd: "E:/Game", stdio: "ignore" });
let up = false;
for (let i = 0; i < 40 && !up; i++) { up = await poll(PORT); if (!up) await sleep(500); }
if (!up) { console.log("HARNESS-FAIL: dev server"); process.exit(1); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
ctx.addInitScript(helpers);
try {
  const p = await ctx.newPage();
  await p.goto(BASE + "/?nocache=i600visual", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71401); vr.world.begin(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "cockpit" })); });
  await p.waitForTimeout(700);
  await p.evaluate(() => { window.__vrClear(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + "visual-cockpit-clear.png" });
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "chase" })); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: OUT + "visual-chase.png" });
  console.log("VISUAL SHOTS DONE");
} finally {
  await browser.close();
  try { srv.kill("SIGTERM"); } catch (_) {}
  const pid = srv.pid;
  setTimeout(() => { try { process.kill(pid, "SIGKILL"); } catch (_) {} }, 1500).unref();
}
