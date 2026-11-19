const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
console.log("--- resolveShipRocks (495-521) ---");
for (let i = 495; i <= 521; i++) console.log(i + " | " + lines[i]);