// I549 (ST-515, E75 D1a): headless camera/cockpit VERIFICATION harness - MEASURES, never fixes.
//   W1 chase:    ship-NDC invariant across center/mid/rim + see-behind at rim + node-side chaseTargets xcheck
//   W2 overview: fixed rig signature + whole-arena framing
//   W3 cockpit:  seat signature + nose/canopy/ship in frame + crosshair dot/ticks + bearing strip + resting fov
//   W4 controls: empirical WASD mapping vs camera basis (confirms/refutes "W moves back") + mouse aim
//   W5 v-switch: damped vs snap measurement (45-frame rAF samples per switch)
// Self-contained: spawns dev server :5173, one headless Chrome tab, kills both in finally.
// Output: camprobe549.json + 5 PNGs + ok/GAP lines. Gaps are RESULTS (input for ST-516), not harness failures.
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { chaseTargets } from "../../src/core/cameraModel.js";
import { CONFIG } from "../../src/core/config.js";

const CHROME = "C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe";
const OUT = "E:/Game/.evidence/I549/";
const BASE = "http://localhost:5173";
const PORT = 5173;
const ARENA_R = CONFIG.arena.radius;
const cam = CONFIG.camera;
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function poll(port) {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

let gapCount = 0;
const gaps = [];
const check = (name, ok, extra) => {
  console.log((ok ? "ok   " : "GAP  ") + name + (extra ? "  [" + extra + "]" : ""));
  if (!ok) { gapCount++; gaps.push(name); }
};

const R = {};
const PROJ = "function mkProj(c) { c.updateMatrixWorld(true); const V = c.position.constructor; return function proj(x, y, z) { const v = new V(x, y, z).applyMatrix4(c.matrixWorldInverse); const depth = -v.z; const q = v.applyMatrix4(c.projectionMatrix); return { x: q.x, y: q.y, depth: depth, inFront: depth > 0.01, inFrame: depth > 0.01 && Math.abs(q.x) <= 1 && Math.abs(q.y) <= 1 }; }; }";

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
const setFx = async (tier) => { for (let i = 0; i < 6; i++) { const cur = await p.evaluate(() => window.__vr.liveSettings().fx); if (cur === tier) return cur; await p.keyboard.press("f"); await p.waitForTimeout(120); } return p.evaluate(() => window.__vr.liveSettings().fx); };

try {
  // ---------------- W0: setup ----------------
  await p.goto(BASE + "/?nocache=i549cam", { waitUntil: "load" });
  await p.waitForFunction(readyFn, { timeout: 30000 });
  R.fx = await setFx("off");
  await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71202); vr.world.begin(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__vr.dismissTutorial(); });
  await p.waitForTimeout(500);
  const w0 = await p.evaluate(() => ({ state: window.__vr.world.game.state, tutorial: window.__vr.tutorialActive(), camMode: window.__vr.camMode() }));
  check("w0: PLAYING + tutorial dismissed + chase mode", w0.state === "PLAYING" && w0.tutorial === false && w0.camMode === "chase", JSON.stringify(w0));
  R.w0 = w0;

  // ---------------- W1: CHASE ----------------
  const chaseReadSrc = `(() => {
    const vr = window.__vr;
    const c2 = vr.camera;
    ${PROJ}
    const proj = mkProj(c2);
    const s = vr.world.ship;
    const m = c2.matrixWorld.elements;
    return {
      camMode: vr.camMode(),
      state: vr.world.game.state,
      camPos: [c2.position.x, c2.position.y, c2.position.z],
      camDir: [-m[8], -m[9], -m[10]],
      fov: c2.fov,
      ship: { x: s.pos.x, y: s.pos.y, aim: s.aim, speed: Math.hypot(s.vel.x, s.vel.y) },
      shipNdc: proj(s.pos.x, 0.4, s.pos.y),
      centerNdc: proj(0, 0, 0),
      farRimNdc: proj(0, 0, -${ARENA_R}),
      sideRimNdc: proj(${ARENA_R}, 0, 0)
    };
  })()`;
  const chasePositions = [[0, 0], [0, 12], [0, 23]];
  const chaseShots = ["chase_center.png", "chase_mid.png", "chase_rim.png"];
  const chaseData = [];
  for (let i = 0; i < chasePositions.length; i++) {
    const pos = chasePositions[i];
    await p.evaluate(([x, y]) => { const s = window.__vr.world.ship; s.pos.x = x; s.pos.y = y; s.vel.x = 0; s.vel.y = 0; s.aim = -Math.PI / 2; }, pos);
    await p.waitForTimeout(1900);
    const d = await p.evaluate(chaseReadSrc);
    chaseData.push(d);
    await p.screenshot({ path: OUT + chaseShots[i] });
    // node-side chaseTargets cross-check
    const fwd = { x: Math.cos(d.ship.aim), y: Math.sin(d.ship.aim) };
    const out = {};
    chaseTargets({ x: d.ship.x, y: d.ship.y }, fwd, 0, Math.hypot(d.ship.x, d.ship.y), ARENA_R, cam, out);
    const camErr = Math.max(Math.abs(d.camPos[0] - out.camX), Math.abs(d.camPos[1] - out.camY), Math.abs(d.camPos[2] - out.camZ));
    const ldx = out.lookX - out.camX, ldy = out.lookY - out.camY, ldz = out.lookZ - out.camZ;
    const ll = Math.hypot(ldx, ldy, ldz);
    const dlen = Math.hypot(d.camDir[0], d.camDir[1], d.camDir[2]);
    const dot = ll > 1e-9 && dlen > 1e-9 ? (d.camDir[0] * ldx + d.camDir[1] * ldy + d.camDir[2] * ldz) / (ll * dlen) : -1;
    d.xcheck = { camErr, lookDot: dot, modelCam: [out.camX, out.camY, out.camZ], modelLook: [out.lookX, out.lookY, out.lookZ], s: out.s, pass: camErr < 0.15 && dot > 0.9998 };
    check("chase.modelXcheck@" + pos.join(","), d.xcheck.pass, "camErr=" + d.xcheck.camErr.toFixed(3) + " lookDot=" + d.xcheck.lookDot.toFixed(5) + " s=" + out.s.toFixed(3));
  }
  R.chase = chaseData;
  const xs = chaseData.map((d) => d.shipNdc.x), ys = chaseData.map((d) => d.shipNdc.y);
  const spreadX = Math.max(...xs) - Math.min(...xs);
  const spreadY = Math.max(...ys) - Math.min(...ys);
  check("chase.invariant ship-NDC spread < 0.035", spreadX < 0.035 && spreadY < 0.035, "dx=" + spreadX.toFixed(4) + " dy=" + spreadY.toFixed(4) + " ndc=" + chaseData.map((d) => d.shipNdc.x.toFixed(3) + "/" + d.shipNdc.y.toFixed(3)).join(" "));
  const rim = chaseData[2];
  check("chase.rim.seeBehind center+farRim inFrame at (0,23)", rim.centerNdc.inFrame && rim.farRimNdc.inFrame, "center=" + JSON.stringify(rim.centerNdc).slice(0, 90) + " farRim=" + JSON.stringify(rim.farRimNdc).slice(0, 90));

  // ---------------- W2: OVERVIEW ----------------
  await p.keyboard.press("v");
  await p.waitForTimeout(1900);
  const ov = await p.evaluate(`(() => {
    const vr = window.__vr;
    const c2 = vr.camera;
    ${PROJ}
    const proj = mkProj(c2);
    const s = vr.world.ship;
    return {
      camMode: vr.camMode(),
      state: vr.world.game.state,
      camPos: [c2.position.x, c2.position.y, c2.position.z],
      fov: c2.fov,
      shipNdc: proj(s.pos.x, 0.4, s.pos.y),
      rimE: proj(${ARENA_R}, 0, 0),
      rimN: proj(0, 0, ${ARENA_R}),
      rimW: proj(-${ARENA_R}, 0, 0),
      rimS: proj(0, 0, -${ARENA_R})
    };
  })()`);
  R.overview = ov;
  await p.screenshot({ path: OUT + "overview.png" });
  check("mode.cycle1 chase->overview", ov.camMode === "overview", ov.camMode);
  const ovErr = Math.max(Math.abs(ov.camPos[0] - 0), Math.abs(ov.camPos[1] - cam.overviewHeight), Math.abs(ov.camPos[2] - cam.overviewBack));
  check("overview.rig (0," + cam.overviewHeight + "," + cam.overviewBack + ") +-0.2", ovErr < 0.2, "camPos=" + ov.camPos.map((v) => v.toFixed(2)).join(",") + " err=" + ovErr.toFixed(3));
  const rimPts = ["rimE", "rimN", "rimW", "rimS"];
  const allFramed = rimPts.every((k) => ov[k].inFrame && Math.abs(ov[k].x) <= 0.95 && Math.abs(ov[k].y) <= 0.95);
  check("overview.framing all 4 rims |NDC| <= 0.95", allFramed, rimPts.map((k) => k + "=" + ov[k].x.toFixed(2) + "/" + ov[k].y.toFixed(2) + (ov[k].inFrame ? "" : "(out)")).join(" "));

  // ---------------- W3: COCKPIT ----------------
  await p.keyboard.press("v");
  await p.waitForTimeout(1600);
  const ck = await p.evaluate(`(() => {
    const vr = window.__vr;
    const c2 = vr.camera;
    ${PROJ}
    const proj = mkProj(c2);
    const s = vr.world.ship;
    const fx = Math.cos(s.aim), fz = Math.sin(s.aim);
    const nose = [0.5, 0.8, 1.1, 1.4].map((d) => ({ d: d, ndc: proj(s.pos.x + fx * d, 0.45, s.pos.y + fz * d) }));
    const strip = document.querySelector('#vr-bearing-strip');
    const dot = document.querySelector('#vr-cockpit-dot');
    const ticks = Array.prototype.filter.call(document.body.children, (el) => el && el.tagName === 'DIV' && el.style && el.style.left === '50%' && el.style.top === '50%' && el.style.zIndex === '55' && el.id !== 'vr-cockpit-dot');
    const op = (el) => (el ? parseFloat(getComputedStyle(el).opacity) : NaN);
    return {
      camMode: vr.camMode(),
      state: vr.world.game.state,
      camPos: [c2.position.x, c2.position.y, c2.position.z],
      fov: c2.fov,
      ship: { x: s.pos.x, y: s.pos.y, aim: s.aim, speed: Math.hypot(s.vel.x, s.vel.y) },
      shipVisible: !!(vr.shipGroup && vr.shipGroup.visible),
      nose: nose,
      canopy: proj(s.pos.x + fx * 0.9, 0.58, s.pos.y + fz * 0.9),
      shipNdc: proj(s.pos.x, 0.4, s.pos.y),
      dom: { strip: op(strip), dot: op(dot), ticks: ticks.map(op) }
    };
  })()`);
  R.cockpit = ck;
  await p.screenshot({ path: OUT + "cockpit.png" });
  check("mode.cycle2 overview->cockpit", ck.camMode === "cockpit", ck.camMode);
  const ckEx = ck.ship.x - Math.cos(ck.ship.aim) * cam.cockpitSetback;
  const ckEz = ck.ship.y - Math.sin(ck.ship.aim) * cam.cockpitSetback;
  const ckErr = Math.max(Math.abs(ck.camPos[0] - ckEx), Math.abs(ck.camPos[1] - cam.cockpitHeight), Math.abs(ck.camPos[2] - ckEz));
  check("cockpit.seat cam at ship-fwd*setback y=" + cam.cockpitHeight + " +-0.35", ckErr < 0.35, "camPos=" + ck.camPos.map((v) => v.toFixed(2)).join(",") + " exp=" + ckEx.toFixed(2) + "," + cam.cockpitHeight + "," + ckEz.toFixed(2) + " err=" + ckErr.toFixed(3));
  const noseOk = ck.nose.every((n) => n.ndc.inFront && Math.abs(n.ndc.x) < 0.4 && n.ndc.y > -0.95 && n.ndc.y < 0.25);
  check("cockpit.nose.inFrame lower-center (d 0.5..1.4)", noseOk, ck.nose.map((n) => "d" + n.d + ":" + n.ndc.x.toFixed(2) + "/" + n.ndc.y.toFixed(2) + (n.ndc.inFront ? "" : "(behind)")).join(" "));
  check("cockpit.shipVisible group+ NDC y > -1.15", ck.shipVisible && ck.shipNdc.y > -1.15, "visible=" + ck.shipVisible + " shipNdc=" + ck.shipNdc.x.toFixed(2) + "/" + ck.shipNdc.y.toFixed(2));
  const crossOk = ck.dom.dot >= 0.99 && ck.dom.ticks.length === 4 && ck.dom.ticks.every((t) => t >= 0.99);
  check("cockpit.crosshair dot+4 ticks opacity ~1", crossOk, "dot=" + ck.dom.dot + " ticks=" + ck.dom.ticks.map((t) => t.toFixed(2)).join(","));
  check("cockpit.bearingStrip opacity ~1", ck.dom.strip >= 0.99, "strip=" + ck.dom.strip);
  check("cockpit.fovAtRest ~60 (+-0.5)", Math.abs(ck.fov - cam.fovBase) < 0.5, "fov=" + ck.fov.toFixed(2));

  // ---------------- W4: COCKPIT CONTROLS (empirical WASD + mouse aim) ----------------
  const w4 = { attempts: [] };
  let w4ok = false;
  for (let attempt = 1; attempt <= 2 && !w4ok; attempt++) {
    let st = await p.evaluate(() => ({ state: window.__vr.world.game.state, mode: window.__vr.camMode() }));
    if (st.state !== "PLAYING") {
      await p.evaluate(() => { const vr = window.__vr; vr.world.reseed(71202); vr.world.begin(); });
      await p.waitForTimeout(700);
    }
    await p.mouse.move(640, 360); // pointer active -> aimPoint ahead -> aim settles
    await p.waitForTimeout(500);
    const keyDefs = [
      ["w", (a) => ({ x: Math.cos(a), y: Math.sin(a) })],
      ["s", (a) => ({ x: -Math.cos(a), y: -Math.sin(a) })],
      ["a", (a) => ({ x: Math.sin(a), y: -Math.cos(a) })],
      ["d", (a) => ({ x: -Math.sin(a), y: Math.cos(a) })],
    ];
    const results = {};
    let dead = false;
    for (const kd of keyDefs) {
      const key = kd[0];
      const r0 = await p.evaluate(() => { const s = window.__vr.world.ship; return { x: s.pos.x, y: s.pos.y, aim: s.aim, state: window.__vr.world.game.state }; });
      if (r0.state !== "PLAYING") { dead = true; break; }
      const ex = kd[1](r0.aim);
      await p.keyboard.down(key);
      await p.waitForTimeout(450);
      await p.keyboard.up(key);
      await p.waitForTimeout(150);
      const r1 = await p.evaluate(() => { const s = window.__vr.world.ship; return { x: s.pos.x, y: s.pos.y, aim: s.aim, state: window.__vr.world.game.state }; });
      const dx = r1.x - r0.x, dy = r1.y - r0.y;
      const mag = Math.hypot(dx, dy);
      const along = dx * ex.x + dy * ex.y;
      const cross = dx * (-ex.y) + dy * ex.x;
      results[key] = { dx: +dx.toFixed(3), dy: +dy.toFixed(3), mag: +mag.toFixed(3), along: +along.toFixed(3), cross: +cross.toFixed(3), pass: mag > 0.05 && along > 0.3 * mag && along > cross, state: r1.state };
      if (r1.state !== "PLAYING") { dead = true; break; }
    }
    let mouse = null;
    if (!dead) {
      const a0 = await p.evaluate(() => window.__vr.world.ship.aim);
      await p.mouse.move(1100, 360);
      await p.waitForTimeout(800);
      const a1 = await p.evaluate(() => window.__vr.world.ship.aim);
      const daim = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
      mouse = { a0: +a0.toFixed(4), a1: +a1.toFixed(4), daim: +daim.toFixed(4), pass: daim > 0.1 && daim < 3.0 };
    }
    w4.attempts.push({ attempt, keys: results, mouse, dead });
    if (!dead) w4ok = true;
  }
  R.controls = w4;
  const att = w4.attempts[w4.attempts.length - 1];
  const kres = att.keys || {};
  check("cockpit.controls.W moves +fwd (camera basis)", !!(kres.w && kres.w.pass), kres.w ? JSON.stringify(kres.w) : "no-data");
  check("cockpit.controls.S moves -fwd", !!(kres.s && kres.s.pass), kres.s ? JSON.stringify(kres.s) : "no-data");
  check("cockpit.controls.A moves -right", !!(kres.a && kres.a.pass), kres.a ? JSON.stringify(kres.a) : "no-data");
  check("cockpit.controls.D moves +right", !!(kres.d && kres.d.pass), kres.d ? JSON.stringify(kres.d) : "no-data");
  check("cockpit.controls.mouseAim right -> nose turns screen-right (daim > 0.1)", !!(att.mouse && att.mouse.pass), att.mouse ? JSON.stringify(att.mouse) : "no-data");

  // ---------------- W5: V-SWITCH DAMP VS SNAP ----------------
  const sampleSwitch = () => new Promise((resolve) => {
    const vr = window.__vr;
    const pts = [];
    let n = 0;
    function f() {
      pts.push([vr.camera.position.x, vr.camera.position.y, vr.camera.position.z]);
      if (++n >= 45) { resolve(pts); return; }
      requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  });
  async function doSwitch(label) {
    await p.keyboard.press("v");
    const pts = await p.evaluate(sampleSwitch);
    let pathLen = 0;
    let frame1 = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
      if (i === 1) frame1 = d;
      pathLen += d;
    }
    const end = pts[pts.length - 1];
    let t99 = null;
    for (let i = 0; i < pts.length; i++) {
      const rem = Math.hypot(pts[i][0] - end[0], pts[i][1] - end[1], pts[i][2] - end[2]);
      if (rem < 0.01 * pathLen) { t99 = +((i / 60) * 1000).toFixed(0); break; }
    }
    return { label, frames: pts.length, pathLen: +pathLen.toFixed(3), frame1Dist: +frame1.toFixed(3), fracOfPathInFrame1: pathLen > 0 ? +(frame1 / pathLen).toFixed(4) : 0, t99ms: t99, verdict: pathLen > 0.5 ? (frame1 > 0.5 * pathLen ? "SNAP" : "DAMPED") : "NO-MOTION" };
  }
  const sv1 = await doSwitch("cockpitToChase");
  await p.waitForTimeout(2000);
  const sv2 = await doSwitch("chaseToOverview");
  R.vswitch = { cockpitToChase: sv1, chaseToOverview: sv2 };
  check("vswitch.cockpitToChase DAMPED (frame1 frac <= 0.5)", sv1.verdict === "DAMPED", JSON.stringify(sv1));
  check("vswitch.chaseToOverview DAMPED (frame1 frac <= 0.5)", sv2.verdict === "DAMPED", JSON.stringify(sv2));
  const modeAfter = await p.evaluate(() => window.__vr.camMode());
  check("w5: mode cycle lands on overview", modeAfter === "overview", modeAfter);
} catch (err) {
  console.log("HARNESS-FAIL: " + (err && err.stack ? err.stack : String(err)));
  writeFileSync(OUT + "camprobe549.json", JSON.stringify({ error: String(err), gaps, console: C }, null, 1));
  process.exitCode = 1;
}

await browser.close();
killServer(srv);
await sleep(2500);
const portFree = !(await poll(PORT));
console.log("port 5173 free after teardown: " + portFree);
writeFileSync(OUT + "camprobe549.json", JSON.stringify({ R, gaps, gapCount, console: C }, null, 1));
console.log("console err/warn=" + C.e.length + "/" + C.w.length + (C.e.length ? " errs=" + JSON.stringify(C.e.slice(0, 5)) : ""));
console.log("GAPS: " + (gaps.length ? gaps.join(" | ") : "none"));
console.log(gapCount === 0 ? "CAMPROBE549 ALL OK" : "CAMPROBE549 " + gapCount + " GAP(S)");
process.exitCode = 0;

function killServer(s) {
  try { s.kill("SIGTERM"); } catch (_) {}
  const pid = s.pid;
  setTimeout(() => { try { process.kill(pid, "SIGKILL"); } catch (_) {} }, 1500).unref();
}