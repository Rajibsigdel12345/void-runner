const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function poll(port) { return new Promise((resolve) => { const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); }); req.on("error", () => resolve(false)); req.setTimeout(1000, () => { req.destroy(); resolve(false); }); }); }
async function waitUp(port, tries) { for (let i = 0; i < tries; i++) { if (await poll(port)) return true; await sleep(500); } return false; }
(async () => {
  const srv = spawn(process.execPath, ["scripts/serve.mjs", "5173"], { stdio: "ignore" });
  const up = await waitUp(5173, 40);
  if (!up) { console.log("FAIL server"); process.exit(1); }
  const out = [];
  const h = spawn(process.execPath, [".evidence/I491/playframe491.mjs"], { stdio: ["ignore", "pipe", "pipe"] });
  h.stdout.on("data", (d) => out.push(d));
  h.stderr.on("data", (d) => out.push(d));
  h.on("exit", (code) => {
    try { srv.kill("SIGTERM"); } catch (_) {}
    const s = Buffer.concat(out).toString("utf8");
    fs.writeFileSync(".evidence/I587/playframe_probe587.out", s, "utf8");
    console.log("harness exit=" + code);
    console.log(s.split(/\r?\n/).filter((l) => /L=|calls\/tris|PLAYFRAME|FAIL|ok/.test(l)).join("\n"));
    setTimeout(() => { try { process.kill(srv.pid, "SIGKILL"); } catch (_) {} process.exit(0); }, 1500);
  });
})();
