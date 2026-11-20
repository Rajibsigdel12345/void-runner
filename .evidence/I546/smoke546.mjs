import { chromium } from "playwright-core";
const CH = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CH, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
let fail = 0;
const ck = (n, ok, x) => { if (!ok) fail++; console.log((ok ? "ok   " : "FAIL ") + n + (x ? "  [" + x + "]" : "")); };
const MENU_READY = () => { const vr = window.__vr; return !!(vr && vr.world && vr.world.game && vr.world.game.state === "MENU"); };
const snapInst = () => {
  const ip = window.__vr.installPrompt;
  const metas = ["mobile-web-app-capable", "apple-mobile-web-app-capable"].map((n) => {
    const m = document.querySelector('meta[name="' + n + '"]'); return m ? m.getAttribute("content") : null;
  });
  return {
    btnDom: !!document.querySelector("#vr-install-btn"),
    visible: ip ? ip.visible : null,
    reason: ip ? ip.reason : null,
    canInstall: ip ? ip.canInstall : null,
    label: ip ? ip.el.textContent : null,
    metaCaps: metas,
  };
};
const wire = (p) => { const E = [], Wn = []; p.on("console", (m) => { if (m.type() === "error") E.push(m.text()); else if (m.type() === "warning") Wn.push(m.text()); }); p.on("pageerror", (e) => E.push("pageerror: " + e.message)); return { E, Wn }; };
const clean = (n, E, Wn) => ck(n + ": console clean", E.length === 0 && Wn.length === 0, "err=" + E.length + " warn=" + Wn.length + (E.length ? " first=" + E[0] : ""));
// ---- Case A: desktop 1280x720 - button in DOM but hidden (no beforeinstallprompt), meta gap-fill present ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke546a", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(400);
  const A = await p.evaluate(snapInst);
  ck("A: install button IN DOM", A.btnDom === true, JSON.stringify(A));
  ck("A: HIDDEN (no beforeinstallprompt on desktop headless)", A.visible === false, "vis=" + A.visible);
  ck("A: reason = unavailable", A.reason === "unavailable", "reason=" + A.reason);
  ck("A: canInstall = false", A.canInstall === false, "can=" + A.canInstall);
  ck("A: label = INSTALL APP (en)", A.label === "INSTALL APP", "label=" + A.label);
  ck("A: meta gap-fill present (2 tags)", A.metaCaps[0] === "yes" && A.metaCaps[1] === "yes", JSON.stringify(A.metaCaps));
  const man = await p.evaluate(async () => { const r = await fetch("public/manifest.webmanifest"); const j = await r.json(); return j.icons.map((i) => i.sizes).join(","); });
  ck("A: manifest icons = 512x512,192x192", man === "512x512,192x192", "icons=" + man);
  clean("A", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case B: beforeinstallprompt appears -> button visible, available, canInstall, label en ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke546b", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(300);
  await p.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
  await p.waitForTimeout(250);
  const B = await p.evaluate(snapInst);
  ck("B: button VISIBLE after beforeinstallprompt", B.visible === true, JSON.stringify(B));
  ck("B: reason = available", B.reason === "available", "reason=" + B.reason);
  ck("B: canInstall = true", B.canInstall === true, "can=" + B.canInstall);
  ck("B: label = INSTALL APP", B.label === "INSTALL APP", "label=" + B.label);
  await p.screenshot({ path: ".evidence/I546/menu_install_btn.png" });
  clean("B", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case C: appinstalled -> hidden, reason installed ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke546c", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(300);
  await p.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
  await p.waitForTimeout(200);
  await p.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await p.waitForTimeout(200);
  const C = await p.evaluate(snapInst);
  ck("C: HIDDEN after appinstalled", C.visible === false, JSON.stringify(C));
  ck("C: reason = installed", C.reason === "installed", "reason=" + C.reason);
  clean("C", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case D: locale re-emit of the install button label (en -> zh -> ja -> en) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke546d", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(300);
  const label = () => p.evaluate(() => window.__vr.installPrompt.el.textContent);
  const D0 = await label();
  ck("D: boot label en", D0 === "INSTALL APP", "label=" + D0);
  await p.evaluate(() => window.__vr.setLocale("zh")); await p.waitForTimeout(200);
  ck("D: setLocale(zh) re-emits label", (await label()) === "\u5b89\u88c5\u6a21\u5757", "label=" + await label());
  await p.evaluate(() => window.__vr.setLocale("ja")); await p.waitForTimeout(200);
  ck("D: setLocale(ja) re-emits label", (await label()) === "\u30a2\u30d7\u30ea\u306e\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb", "label=" + await label());
  await p.evaluate(() => window.__vr.setLocale("en")); await p.waitForTimeout(200);
  ck("D: setLocale(en) back to en", (await label()) === "INSTALL APP", "label=" + await label());
  clean("D", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case E: menu gating - setMenuVisible(false) hides even with prompt armed; true re-shows ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke546e", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(300);
  await p.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
  await p.waitForTimeout(200);
  const E1 = await p.evaluate(() => window.__vr.installPrompt.visible);
  ck("E: visible with prompt armed (menu)", E1 === true, "vis=" + E1);
  const E2 = await p.evaluate(() => { window.__vr.installPrompt.setMenuVisible(false); return window.__vr.installPrompt.visible; });
  ck("E: setMenuVisible(false) hides", E2 === false, "vis=" + E2);
  const E3 = await p.evaluate(() => { window.__vr.installPrompt.setMenuVisible(true); return window.__vr.installPrompt.visible; });
  ck("E: setMenuVisible(true) re-shows", E3 === true, "vis=" + E3);
  clean("E", w.E, w.Wn);
  await p.close(); await ctx.close();
}
// ---- Case F: mobile context - hidden until prompt, no console noise ----
{
  const ctx = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 740, height: 360 } });
  const p = await ctx.newPage(); const w = wire(p);
  await p.goto("http://localhost:5173/?nocache=smoke546f", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 }); await p.waitForTimeout(300);
  const F1 = await p.evaluate(snapInst);
  ck("F: mobile - button hidden until prompt", F1.visible === false && F1.btnDom === true, JSON.stringify(F1));
  await p.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
  await p.waitForTimeout(200);
  const F2 = await p.evaluate(snapInst);
  ck("F: mobile - visible after prompt", F2.visible === true && F2.reason === "available", JSON.stringify(F2));
  clean("F", w.E, w.Wn);
  await p.close(); await ctx.close();
}
await browser.close();
console.log(fail === 0 ? "SMOKE546 PASS" : "SMOKE546 FAIL (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);