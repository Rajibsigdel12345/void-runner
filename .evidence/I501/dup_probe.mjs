import { chromium } from "playwright-core";
const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto("http://localhost:5173/?nocache=i501dup", { waitUntil: "load" });
await p.waitForFunction(() => { const vr = window.__vr; if (!vr || !vr.world || !vr.arenaFloor || !vr.debris || !vr.assetLoader) return false; return ["rockL","rockM","rockS","rockComet","debrisChunk","debrisSliver"].every((kk) => { const e = vr.assetLoader.get(kk); return e && e.ready; }); }, { timeout: 30000 });
await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71201); vr.world.begin(); });
await p.waitForTimeout(500);
const out = await p.evaluate(() => {
  const vr = window.__vr;
  vr.advance(2.5);
  const seen = new Map();
  vr.scene.traverse((n) => {
    if (!n.isMesh || !n.visible) return;
    let vis = true; let a = n; while (a) { if (!a.visible) { vis = false; break; } a = a.parent; }
    if (!vis) return;
    const g = n.geometry; const t = g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
    const key = (n.name || "(noname)") + " | tri=" + Math.round(t) + " | geo=" + (g.uuid || "?").slice(0, 8);
    const cur = seen.get(key) || { n: 0, tris: 0, parent: "" };
    cur.n++; cur.tris += Math.round(t); cur.parent = (n.parent && n.parent.name) || cur.parent;
    seen.set(key, cur);
  });
  const rows = [...seen.entries()].map(([k, v]) => k + " x" + v.n + " parent=" + v.parent).sort();
  return { rows, total: rows.length };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
