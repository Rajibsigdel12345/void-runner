const fs = require("fs");
for (const f of ["src/core/boss.js", "src/core/warden.js"]) {
  const ls = fs.readFileSync(f, "latin1").split("\n");
  console.log("=== " + f + " (" + ls.length + " lines) head ===");
  ls.slice(0, 60).forEach((l, i) => console.log(i + " | " + l));
  console.log("--- hp/alive fields ---");
  ls.forEach((l, i) => { if (/(this\.(hp|maxHp|alive|armor|kind|spawnWave|phase)\s*=|get (hp|alive))/i.test(l)) console.log(i + " | " + l.trim().slice(0, 110)); });
  console.log();
}