const http = require('http');
function poll(port) {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:" + port + "/", (res) => { res.resume(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => { req.destroy(); resolve(false); });
  });
}
(async () => {
  for (const p of [5173, 4173, 4200, 5199]) {
    console.log("port " + p + ": " + (await poll(p) ? "IN USE" : "free"));
  }
})();