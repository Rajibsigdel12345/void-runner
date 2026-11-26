// I600 (ST-565): regression check - the DOM-only cockpit frame change must leave the
// scripted/deterministic harness pins EXACT (the frame is DOM-only: 0 3D draw calls, 0 tris, no RNG).
// Runs the two key harnesses with self-started, self-killed servers: playframe491 (dev :5173)
// + causal495 (dist :4200). Full 5/5 close gate belongs to I602 (ST-567).
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const OUTDIR = ".evidence/I600/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function poll(port) {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}
function startServer(port, root) {
  const args = ["scripts/serve.mjs", String(port)];
  if (root) args.push(root);
  return spawn(process.execPath, args, { stdio: "ignore" });
}
async function waitUp(port, tries) {
  for (let i = 0; i < tries; i++) { if (await poll(port)) return true; await sleep(500); }
  return false;
}
function killServer(srv) {
  try { srv.kill("SIGTERM"); } catch (_) {}
  const pid = srv.pid;
  setTimeout(() => { try { process.kill(pid, "SIGKILL"); } catch (_) {} }, 1500).unref();
}
function runHarness(file) {
  return new Promise((resolve) => {
    const out = [];
    const h = spawn(process.execPath, [file], { stdio: ["ignore", "pipe", "pipe"] });
    h.stdout.on("data", (d) => out.push(d));
    h.stderr.on("data", (d) => out.push(d));
    h.on("exit", (code) => resolve({ code: code === null ? 1 : code, out: Buffer.concat(out).toString("utf8") }));
  });
}
(async () => {
  const steps = [
    { name: "playframe491", port: 5173, root: null, harness: ".evidence/I491/playframe491.mjs", marker: "PLAYFRAME456 PASS" },
    { name: "causal495", port: 4200, root: "dist", harness: ".evidence/I495/causal495.mjs", marker: "CAUSAL495 PASS" },
  ];
  let allOk = true;
  for (const s of steps) {
    const srv = startServer(s.port, s.root);
    const up = await waitUp(s.port, 30);
    if (!up) { console.log("FAIL " + s.name + ": server did not start on :" + s.port); allOk = false; killServer(srv); continue; }
    console.log("=== " + s.name + " (:" + s.port + " up) ===");
    const r = await runHarness(s.harness);
    fs.writeFileSync(OUTDIR + s.name + ".out", r.out, "utf8");
    const lines = r.out.split(/\r?\n/).filter((l) => l.trim().length > 0);
    console.log("head: " + lines.slice(0, 3).join(" | "));
    console.log("tail: " + lines.slice(-5).join(" | "));
    killServer(srv);
    await sleep(2500);
    const free = !(await poll(s.port));
    const found = r.out.includes(s.marker);
    console.log(s.name + ": exit=" + r.code + " marker=" + (found ? "FOUND" : "MISSING") + " port_free=" + free);
    if (!found || !free) allOk = false;
  }
  console.log(allOk ? "REGRESSION600 PASS (2/2 EXACT)" : "REGRESSION599 FAIL");
  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error("RUNNER CRASH", e); process.exit(3); });