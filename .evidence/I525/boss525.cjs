const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
function dump(a, b, label) { console.log("--- " + label + " (" + a + "-" + b + ") ---"); for (let i = a; i <= Math.min(b, lines.length-1); i++) console.log(i + " | " + lines[i]); }
dump(355, 380, "aimed bolt callers");
dump(585, 625, "boss spawn");
dump(893, 935, "fireAimedBolt + bossBurst + splicer spiral");