const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
console.log("--- bomb mentions ---");
lines.forEach((l, i) => { if (/bomb/i.test(l) && !/bombard/i.test(l)) console.log(i + " | " + l.trim().slice(0, 120)); });