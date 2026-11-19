const fs = require("fs");
const ls = fs.readFileSync("src/core/powerups.js", "latin1").split("\n");
console.log("=== powerups.js head ===");
ls.forEach((l, i) => { if (i < 80 || /active|isShielding|count|inventory|this\./.test(l) && i < 140) console.log(i + " | " + l); });