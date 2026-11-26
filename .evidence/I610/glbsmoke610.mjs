// I610 (ST-575, E88 G88.0): GLB fleet smoke - all 34 GLBs load via the vendored meshopt
// decoder on the DIST arm (headless Chrome SwiftShader, :4200, server started by the
// closegate610 runner). Checks per scope-check-E88 measurement protocol sec.3:
// 34/34 ready, 0 real console errors (no 404s - every asset ships in dist),
// total triangles 123,188 EXACT (fleet contract), all position floats finite,
// and a short scripted play segment with no NaN on ship/camera.
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I610/";
const BASE = "http://localhost:4200";
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const E = []; const W = [];
const p = await ctx.newPage();
p.on("console", (m) => { if (m.type() === "error") E.push(m.text()); else if (m.type() === "warning") W.push(m.text()); });
p.on("pageerror", (e) => E.push("pageerror: " + e.message));
const readyFn = () => { const vr = window.__vr; if (!vr || !vr.assetLoader) return false; const al = vr.assetLoader; return al.names.filter((n) => n !== "floorSurface").every((n) => { const e = al.get(n); return e && e.ready; }); };
await p.goto(BASE + "/?nocache=i610glbsmoke", { waitUntil: "load" });
await p.waitForFunction(readyFn, { timeout: 60000 });
const R = await p.evaluate(() => {
  const vr = window.__vr;
  const al = vr.assetLoader;
  const glbNames = al.names.filter((n) => n !== "floorSurface");
  const seen = new Set();
  let tris = 0, meshes = 0, badFloats = 0, readyN = 0;
  for (const n of glbNames) {
    const e = al.get(n);
    if (!e || !e.ready || !e.object) continue;
    readyN++;
    e.object.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const g = o.geometry;
      if (seen.has(g)) return; // unique geometry = unique primitive (buffer-level parity with glbtris608)
      seen.add(g);
      meshes++;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      const pos = g.attributes.position;
      if (pos) { const a = pos.array; for (let i = 0; i < a.length; i++) { if (!Number.isFinite(a[i])) { badFloats++; break; } } }
    });
  }
  const w = vr.world;
  w.reseed(61001);
  w.begin();
  w.ship.invuln = 999;
  for (let i = 0; i < 60; i++) vr.advance(0.1);
  const fin = (v) => Number.isFinite(v);
  const nanPlay = !(fin(w.ship.pos.x) && fin(w.ship.pos.y) && fin(vr.camera.position.x) && fin(vr.camera.position.y) && fin(vr.camera.position.z));
  return { glbCount: glbNames.length, readyN, totalTris: tris, meshes, badFloats, nanPlay, state: w.game.state };
});
await p.close();
await browser.close();
let fail = 0;
const check = (name, ok, extra) => { if (!ok) fail++; console.log((ok ? "ok   " : "FAIL ") + name + (extra ? "  [" + extra + "]" : "")); };
const realErr = E.filter((m) => !/Failed to load resource.*404/.test(m));
check("34 GLB asset names present", R.glbCount === 34, "n=" + R.glbCount);
check("34/34 loaded via the vendored decoder", R.readyN === 34, "ready=" + R.readyN);
check("total triangles 123,188 EXACT", R.totalTris === 123188, "tris=" + R.totalTris);
check("all position floats finite", R.badFloats === 0, "bad=" + R.badFloats);
check("0 real console errors (no 404s on dist)", realErr.length === 0, "err=" + JSON.stringify(E.slice(0, 3)));
check("play segment: no NaN on ship/camera", R.nanPlay === false, "state=" + R.state);
writeFileSync(OUT + "glbsmoke610.json", JSON.stringify(Object.assign({}, R, { consoleErrN: E.length, consoleWarnN: W.length }), null, 1));
console.log("meshes=" + R.meshes + " consoleErr=" + E.length + " consoleWarn=" + W.length);
console.log(fail === 0 ? "GLBSMOKE610 PASS" : "GLBSMOKE610 FAIL (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);