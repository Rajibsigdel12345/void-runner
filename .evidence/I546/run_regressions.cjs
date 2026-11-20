const { spawn } = require("child_process");
const http = require("http");
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
  const srv = spawn(process.execPath, args, { stdio: "ignore" });
  return srv;
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
    h.stdout.on("data", (d) => out.push(d.toString()));
    h.stderr.on("data", (d) => out.push(d.toString()));
    h.on("exit", (code) => resolve({ code: code === null ? 1 : code, out: out.join("") }));
  });
}
(async () => {
  const steps = [
    { name: "causal495", port: 4200, root: "dist", harness: ".evidence/I495/causal495.mjs", marker: "CAUSAL495 PASS" },
    { name: "playframe491", port: 5173, root: null, harness: ".evidence/I491/playframe491.mjs", marker: "PLAYFRAME456 PASS" },
    { name: "pwa491", port: 5199, root: "dist", harness: ".evidence/I491/pwa491.mjs", marker: "SUMMARY 11/11" },
  ];
  let allOk = true;
  const servers = [];
  for (const s of steps) {
    const srv = startServer(s.port, s.root);
    servers.push(srv);
    const up = await waitUp(s.port, 30);
    if (!up) { console.log("FAIL " + s.name + ": server did not start on :" + s.port); allOk = false; killServer(srv); continue; }
    console.log("=== " + s.name + " (server : " + s.port + " up) ===");
    const r = await runHarness(s.harness);
    console.log(r.out);
    killServer(srv);
    await sleep(2500);
    const free = !(await poll(s.port));
    console.log(s.name + ": exit=" + r.code + " marker=" + (r.out.includes(s.marker) ? "FOUND" : "MISSING") + " port_free=" + free);
    if (!r.out.includes(s.marker) || !free) allOk = false;
  }
  console.log(allOk ? "REGRESSIONS546 PASS" : "REGRESSIONS546 FAIL");
  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error("RUNNER CRASH", e); process.exit(3); });