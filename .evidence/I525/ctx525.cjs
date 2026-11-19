const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
const sites = [519,579,889,991,1009,1075,1165,1213,1268,1525,1541,1557,1574,1590,1606];
for (const s of sites) {
  console.log("=== 0-idx " + s + " (line " + (s+1) + ") ===");
  for (let i = Math.max(0,s-8); i <= Math.min(lines.length-1, s+1); i++) console.log(i + " | " + lines[i]);
}