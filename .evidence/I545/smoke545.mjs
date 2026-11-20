import { chromium } from "playwright-core";
const CH = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CH, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
let fail = 0;
const ck = (n, ok, x) => { if (!ok) fail++; console.log((ok ? "ok   " : "FAIL ") + n + (x ? "  [" + x + "]" : "")); };
const MENU_READY = () => { const vr = window.__vr; return !!(vr && vr.world && vr.world.game && vr.world.game.state === "MENU"); };
const snapMobile = () => {
  const rh = window.__vr.rotateHint;
  const menu = document.querySelector("#screen-menu");
  const ring = document.querySelector("#vr-touch-stick > div");
  return {
    hintDom: !!document.querySelector("#vr-rotate-hint"),
    hintVisible: rh ? rh.visible : null,
    hintLabel: (rh && rh.labelEl) ? rh.labelEl.textContent : null,
    geom: window.__vr.stickGeom(),
    menuPadTop: menu ? getComputedStyle(menu).paddingTop : null,
    ringW: ring ? ring.style.width : null,
    locale: window.__vr.locale(),
  };
};
const wire = (p) => { const E = [], Wn = []; p.on("console", (m) => { if (m.type() === "error") E.push(m.text()); else if (m.type() === "warning") Wn.push(m.text()); }); p.on("pageerror", (e) => E.push("pageerror: " + e.message)); return { E, Wn }; };
const clean = (n, E, Wn) => ck(n + ": console clean", E.length === 0 && Wn.length === 0, "err=" + E.length + " warn=" + Wn.length + (E.length ? " first=" + E[0] : ""));
// ---- Case A: desktop 1280x720 - no rotate hint, no stick, safe-area padding 0 -> 24px, geom 90/24 ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke545a", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(400);
  const A = await p.evaluate(snapMobile);
  ck("A: rotate hint NOT in DOM (desktop, coarse=false)", A.hintDom === false, JSON.stringify(A));
  ck("A: rotate hint not visible (desktop stub)", A.hintVisible === false, "vis=" + A.hintVisible);
  ck("A: menu paddingTop = 24px (safe-area 0 on desktop)", A.menuPadTop === "24px", "pad=" + A.menuPadTop);
  ck("A: stickGeom = 90/24 (vh 720)", A.geom.maxPx === 90 && A.geom.deadzone === 24, JSON.stringify(A.geom));
  ck("A: no touch stick (desktop)", A.ringW === null, "ring=" + A.ringW);
  clean("A", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case B: mobile landscape 740x360 - hint in DOM but hidden; geom 90/24; ring 180px ----
{
  const ctx = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 740, height: 360 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke545b", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(400);
  const B = await p.evaluate(snapMobile);
  ck("B: rotate hint in DOM (coarse) but HIDDEN (landscape)", B.hintDom === true && B.hintVisible === false, JSON.stringify(B));
  ck("B: stickGeom = 90/24 (vh 360 boundary)", B.geom.maxPx === 90 && B.geom.deadzone === 24, JSON.stringify(B.geom));
  ck("B: touch stick present, ring 180px (2*90)", B.ringW === "180px", "ring=" + B.ringW);
  clean("B", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case C: portrait 360x740 -> hint visible + en label; resize to landscape -> hidden ----
{
  const ctx = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 360, height: 740 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke545c", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(400);
  const C1 = await p.evaluate(snapMobile);
  ck("C: rotate hint VISIBLE (portrait + coarse)", C1.hintVisible === true, JSON.stringify(C1));
  ck("C: label = ROTATE TO LANDSCAPE (en)", C1.hintLabel === "ROTATE TO LANDSCAPE", "label=" + C1.hintLabel);
  await p.setViewportSize({ width: 740, height: 360 }); await p.waitForTimeout(400);
  const C2 = await p.evaluate(snapMobile);
  ck("C: hint HIDDEN after rotate to landscape", C2.hintVisible === false, JSON.stringify(C2));
  clean("C", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case D: short landscape 640x280 -> geom 70/22, ring 140px ----
{
  const ctx = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 640, height: 280 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke545d", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(400);
  const D = await p.evaluate(snapMobile);
  ck("D: stickGeom = 70/22 (vh 280 < 360)", D.geom.maxPx === 70 && D.geom.deadzone === 22, JSON.stringify(D.geom));
  ck("D: ring width = 140px (2*70)", D.ringW === "140px", "ring=" + D.ringW);
  clean("D", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case E: portrait mobile - locale re-emit of the rotate hint label (en -> zh -> ja -> en) ----
{
  const ctx = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 360, height: 740 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke545e", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(400);
  const label = () => p.evaluate(() => window.__vr.rotateHint.labelEl.textContent);
  const E1 = await label();
  ck("E: boot label en", E1 === "ROTATE TO LANDSCAPE", "label=" + E1);
  await p.evaluate(() => window.__vr.setLocale("zh")); await p.waitForTimeout(200);
  ck("E: setLocale(zh) re-emits label", (await label()) === "\u8bf7\u6a2a\u5c4f\u6e38\u73a9", "label=" + await label());
  await p.evaluate(() => window.__vr.setLocale("ja")); await p.waitForTimeout(200);
  ck("E: setLocale(ja) re-emits label", (await label()) === "\u6a2a\u5411\u304d\u3067\u30d7\u30ec\u30a4\u3057\u3066\u304f\u3060\u3055\u3044", "label=" + await label());
  await p.evaluate(() => window.__vr.setLocale("en")); await p.waitForTimeout(200);
  ck("E: setLocale(en) back to en", (await label()) === "ROTATE TO LANDSCAPE", "label=" + await label());
  clean("E", w.E, w.Wn);
  await p.close(); await ctx.close();
}
await browser.close();
console.log(fail === 0 ? "SMOKE545 PASS" : "SMOKE545 FAIL (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
