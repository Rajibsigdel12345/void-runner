const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function poll(port) {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}
async function waitUp(port, tries) {
  for (let i = 0; i < tries; i++) { if (await poll(port)) return true; await sleep(500); }
  return false;
}
function runFile(f) {
  return new Promise((resolve) => {
    const out = [];
    const h = spawn(process.execPath, [f], { stdio: ["ignore", "pipe", "pipe"] });
    h.stdout.on("data", (d) => out.push(d));
    h.stderr.on("data", (d) => out.push(d));
    h.on("exit", (code) => resolve({ code: code === null ? 1 : code, out: Buffer.concat(out).toString("utf8") }));
  });
}
(async () => {
  const srv = spawn(process.execPath, ["scripts/serve.mjs", "5173"], { stdio: "ignore" });
  const up = await waitUp(5173, 40);
  if (!up) { console.log("FAIL server did not start"); process.exit(1); }
  const r1 = await runFile(".evidence/I593/probe_page593.mjs");
  fs.writeFileSync(".evidence/I593/playframe_probe593.out", r1.out, "utf8");
  console.log("probe exit=" + r1.code);
  console.log(r1.out.split(/\r?\n/).filter((l) => /A:|B:|FAIL|Error/.test(l)).join("\n"));
  const r2 = await runFile(".evidence/I491/playframe491.mjs");
  fs.writeFileSync(".evidence/I593/playframe491_gate.out", r2.out, "utf8");
  console.log("gate exit=" + r2.code);
  console.log(r2.out.split(/\r?\n/).filter((l) => /ok|FAIL|PLAYFRAME/.test(l)).join("\n"));
  try { srv.kill("SIGTERM"); } catch (_) {}
  setTimeout(() => { try { process.kill(srv.pid, "SIGKILL"); } catch (_) {} process.exit(0); }, 1500);
})();