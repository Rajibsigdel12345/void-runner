// I551 (ST-517, E75): campaign Level 5 boot smoke - headless Chrome on the dev server.
// Boots the game, starts a campaign continued at L5, and checks: levelIntro L5,
// forced zoneEnter with the zenith-1 palette, levelState sanity, no NaN, console clean.
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I551/";
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
  await p.goto(BASE + "/?nocache=i551verify", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  await p.waitForTimeout(400);

  R.boot = await p.evaluate(() => { const w = window.__vr.world; w.setMode("campaign"); w.setCampaignStartLevel(5); const ok = w.begin("campaign"); const evs = w.drainEvents(); return { ok, level: w.levelState.level, distance: w.levelState.distance, zone: w.levelState.zone,
    intro: evs.filter((e) => e.type === "levelIntro").map((e) => e.data),
    zones: evs.filter((e) => e.type === "zoneEnter").map((e) => e.data) }; });

  await p.waitForTimeout(1500); // a few live ticks at L5 (zenith-1 palette live)

  R.tick = await p.evaluate(() => { const vr = window.__vr; const w = vr.world; const s = w.ship;
    return { level: w.levelState.level, zone: w.levelState.zone, distanceFinite: Number.isFinite(w.levelState.distance),
      posFinite: Number.isFinite(s.pos.x) && Number.isFinite(s.pos.y),
      camFinite: Number.isFinite(vr.camera.position.x) && Number.isFinite(vr.camera.position.y) && Number.isFinite(vr.camera.position.z),
      scoreFinite: Number.isFinite(w.score) }; });

  await p.screenshot({ path: OUT + "l5_boot.png" });
} finally {
  await browser.close().catch(() => {});
  srv.kill("SIGTERM");
  await sleep(400);
}

R.console = { errors: C.e.length, warnings: C.w.length, sample: C.e.slice(0, 5) };
writeFileSync(OUT + "verify551.json", JSON.stringify(R, null, 2));
const b = R.boot, t = R.tick;
const ok = b && b.ok && b.level === 5 && b.intro.length === 1 && b.intro[0].level === 5 && b.intro[0].nameKey === "level.name.l5"
  && b.zones.length === 1 && b.zones[0].level === 5 && b.zones[0].zone === 1 && b.zones[0].paletteId === "zenith-1" && b.zones[0].forced === true
  && t && t.level === 5 && t.distanceFinite && t.posFinite && t.camFinite && t.scoreFinite && R.console.errors === 0;
console.log(JSON.stringify(R, null, 1));
console.log(ok ? "VERIFY551 PASS" : "VERIFY551 FAIL");
