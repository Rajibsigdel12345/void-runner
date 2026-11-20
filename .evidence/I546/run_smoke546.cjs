const { spawn } = require("child_process");
const http = require("http");
const server = spawn(process.execPath, ["scripts/serve.mjs", "5173"], { stdio: "ignore", detached: false });
let done = false;
function killServer() { if (!done) { done = true; try { server.kill("SIGTERM"); } catch (_) {} setTimeout(() => { try { process.kill(server.pid, "SIGKILL"); } catch (_) {} }, 1500).unref(); } }
process.on("exit", killServer);
process.on("SIGINT", () => { killServer(); process.exit(130); });
function poll(n) {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:5173/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}
(async () => {
  let up = false;
  for (let i = 0; i < 20; i++) { up = await poll(i); if (up) break; await new Promise((r) => setTimeout(r, 500)); }
  if (!up) { console.log("DEV SERVER FAILED TO START"); killServer(); process.exit(2); }
  console.log("dev server up on :5173");
  const smoke = spawn(process.execPath, [".evidence/I546/smoke546.mjs"], { stdio: "inherit" });
  smoke.on("exit", (code) => { killServer(); process.exit(code === null ? 1 : code); });
})();