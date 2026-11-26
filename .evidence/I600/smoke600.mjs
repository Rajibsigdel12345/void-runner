// I600 smoke: ST-565 cockpit interior frame (DOM) - geometry/z/opacity/RM + HUD layering.
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I600/";
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
const readFrame = () => {
  const el = document.getElementById("vr-cockpit-frame");
  if (!el) return { exists: false };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const layers = (cs.backgroundImage.match(/linear-gradient\(/g) || []).length;
  const z = (id) => { const e = document.getElementById(id); return e ? getComputedStyle(e).zIndex : null; };
  return {
    exists: true,
    zIndex: cs.zIndex,
    opacity: cs.opacity,
    pointerEvents: cs.pointerEvents,
    position: cs.position,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    layers: layers,
    transitionInline: el.style.transition || null,
    zStrip: z("vr-bearing-strip"),
    zGaugeSpeed: z("vr-gauge-speed"),
    zGaugeHull: z("vr-gauge-hull"),
    zDot: z("vr-cockpit-dot"),
  };
};

const srv = spawn(process.execPath, ["scripts/serve.mjs", String(PORT)], { cwd: "E:/Game", stdio: "ignore" });
let up = false;
for (let i = 0; i < 40 && !up; i++) { up = await poll(PORT); if (!up) await sleep(500); }
if (!up) { console.log("HARNESS-FAIL: dev server"); process.exit(1); }
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const R = { cockpitOn: null, cockpitOff: null, reducedMotion: null, consoleErrors: [] };
try {
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") R.consoleErrors.push(m.text()); });
  p.on("pageerror", (e) => R.consoleErrors.push("pageerror: " + e.message));
  await p.goto(BASE + "/?nocache=i600smoke", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71401); vr.world.begin(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  await p.waitForTimeout(300);

  // Part A: cockpit ON - frame visible, geometry + z-order
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "cockpit" })); });
  await p.waitForTimeout(650);
  R.cockpitOn = await p.evaluate(readFrame);
  await p.screenshot({ path: OUT + "cockpit-frame-on.png" });

  // Part B: chase - frame faded out
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "chase" })); });
  await p.waitForTimeout(650);
  R.cockpitOff = await p.evaluate(readFrame);

  // Part C: reduced motion - transition must be 'none' and the fade instant
  await p.evaluate(() => { const vr = window.__vr; vr.applySettings(Object.assign({}, vr.liveSettings(), { cameraMode: "cockpit", reducedMotion: true })); });
  await p.waitForTimeout(120);
  R.reducedMotion = await p.evaluate(readFrame);
  await p.screenshot({ path: OUT + "cockpit-frame-rm.png" });

  const ok =
    R.cockpitOn && R.cockpitOn.exists &&
    R.cockpitOn.zIndex === "40" &&
    R.cockpitOn.opacity === "1" &&
    R.cockpitOn.pointerEvents === "none" &&
    R.cockpitOn.rect.x === 0 && R.cockpitOn.rect.y === 0 &&
    Math.abs(R.cockpitOn.rect.w - W) < 1 && Math.abs(R.cockpitOn.rect.h - H) < 1 &&
    R.cockpitOn.layers === 7 &&
    R.cockpitOn.zStrip === "55" && R.cockpitOn.zGaugeSpeed === "55" && R.cockpitOn.zGaugeHull === "55" &&
    Number(R.cockpitOn.zDot) >= 40 &&
    R.cockpitOff && R.cockpitOff.opacity === "0" &&
    R.reducedMotion && R.reducedMotion.transitionInline === "none" && R.reducedMotion.opacity === "1" &&
    R.consoleErrors.length === 0;
  console.log(JSON.stringify(R, null, 1));
  console.log(ok ? "SMOKE600 PASS" : "SMOKE600 FAIL");
  writeFileSync(OUT + "smoke600.json", JSON.stringify(R, null, 1));
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
  try { srv.kill("SIGTERM"); } catch (_) {}
  const pid = srv.pid;
  setTimeout(() => { try { process.kill(pid, "SIGKILL"); } catch (_) {} }, 1500).unref();
}
