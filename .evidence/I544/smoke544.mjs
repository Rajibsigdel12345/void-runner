import { chromium } from "playwright-core";
const CH = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CH, headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--force-color-profile=srgb"] });
let fail = 0;
const ck = (n, ok, x) => { if (!ok) fail++; console.log((ok ? "ok   " : "FAIL ") + n + (x ? "  [" + x + "]" : "")); };
const MENU_READY = () => { const vr = window.__vr; return !!(vr && vr.world && vr.world.game && vr.world.game.state === "MENU"); };
const snap = () => {
  const btns = Array.from(document.querySelectorAll("button.vr-start"));
  const cont = btns.find((b) => b.style.color === "rgb(255, 224, 138)") || btns.find((b) => b.textContent.includes("CONTINUE")); // gold = CONTINUE primary (structural, works while hidden+unlabeled)
  const lines = Array.from(document.querySelectorAll("#screen-menu div")).filter((d) => d.textContent === "PRESS ENTER TO START");
  const set = Array.from(document.querySelectorAll("button.vr-pause-btn")).find((b) => b.textContent === "SETTINGS");
  const panel = document.querySelector("#screen-menu .vr-settings");
  return {
    startVis: !!lines[0] && lines[0].style.display !== "none",
    contExists: !!cont,
    contVis: cont ? cont.style.display !== "none" : null,
    contText: cont ? cont.textContent : null,
    contAria: cont ? cont.getAttribute("aria-label") : null,
    setExpanded: set ? set.getAttribute("aria-expanded") : null,
    panelDisp: panel ? getComputedStyle(panel).display : null,
    newGameHead: !!Array.from(document.querySelectorAll("#screen-menu div")).find((d) => d.textContent === "NEW GAME"),
    menuNaN: document.querySelector("#screen-menu").textContent.includes("NaN"),
  };
};
// ---- Case A: fresh profile, no storage ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const E = [], Wn = [];
  p.on("console", (m) => { if (m.type() === "error") E.push(m.text()); else if (m.type() === "warning") Wn.push(m.text()); });
  p.on("pageerror", (e) => E.push("pageerror: " + e.message));
  await p.goto("http://localhost:5173/?nocache=smoke544a", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 });
  await p.waitForTimeout(400);
  const A = await p.evaluate(snap);
  ck("A: start prompt visible", A.startVis === true, JSON.stringify(A));
  ck("A: CONTINUE btn exists but hidden (no progress)", A.contExists === true && A.contVis === false && (A.contText === "" || !A.contText.includes("CONTINUE")), "text=" + JSON.stringify(A.contText));
  ck("A: settings collapsed by default", A.setExpanded === "false" && A.panelDisp === "none");
  ck("A: NEW GAME head present", A.newGameHead === true);
  ck("A: no NaN in menu text", A.menuNaN === false);
  await p.click("button.vr-pause-btn:has-text('SETTINGS')");
  await p.waitForTimeout(200);
  const B = await p.evaluate(snap);
  ck("A: SETTINGS click opens panel", B.setExpanded === "true" && B.panelDisp === "flex", JSON.stringify({ e: B.setExpanded, d: B.panelDisp }));
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  const C = await p.evaluate(snap);
  ck("A: Esc closes panel", C.setExpanded === "false" && C.panelDisp === "none", JSON.stringify({ e: C.setExpanded, d: C.panelDisp }));
  ck("A: console clean", E.length === 0 && Wn.length === 0, "err=" + E.length + " warn=" + Wn.length + (E.length ? " first=" + E[0] : ""));
  await p.close(); await ctx.close();
}
// ---- Case B: saved campaign level 3 -> CONTINUE primary, Enter -> campaign ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("voidrunner.campaign", JSON.stringify({ version: 1, level: 3 })); } catch (e) {} });
  const p = await ctx.newPage();
  const E = [], Wn = [];
  p.on("console", (m) => { if (m.type() === "error") E.push(m.text()); else if (m.type() === "warning") Wn.push(m.text()); });
  p.on("pageerror", (e) => E.push("pageerror: " + e.message));
  await p.goto("http://localhost:5173/?nocache=smoke544b", { waitUntil: "load" });
  await p.waitForFunction(MENU_READY, null, { timeout: 30000 });
  await p.waitForTimeout(400);
  const D = await p.evaluate(snap);
  ck("B: CONTINUE visible with progress", D.contVis === true, JSON.stringify(D));
  ck("B: CONTINUE label = CONTINUE ? LV 3", D.contText === "CONTINUE \u2014 LV 3", "text=" + D.contText);
  ck("B: aria label set", D.contAria === "Continue the campaign from level 3", "aria=" + D.contAria);
  ck("B: start prompt hidden when CONTINUE owns menu", D.startVis === false);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(1200);
  const F = await p.evaluate(() => { const vr = window.__vr; return { state: vr.world.game.state, mode: vr.world.mode }; });
  ck("B: Enter -> campaign checkpoint continue", F.state === "PLAYING" && F.mode === "campaign", JSON.stringify(F));
  ck("B: console clean", E.length === 0 && Wn.length === 0, "err=" + E.length + " warn=" + Wn.length + (E.length ? " first=" + E[0] : ""));
  await p.close(); await ctx.close();
}
await browser.close();
console.log(fail === 0 ? "SMOKE544 PASS" : "SMOKE544 FAIL (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);