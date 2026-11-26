const fs = require("fs");
const L = fs.readFileSync("E:/Game/src/core/config.js", "utf8").replace(/\r/g, "").split("\n");
function show(a, b, tag) { console.log("=== " + tag + " L" + a + "-L" + b + " ==="); for (let k = a - 1; k < b; k++) console.log("L" + (k + 1) + ": " + L[k]); }
show(397, 413, "DRONE block");
show(555, 585, "block between wasp and phantom");