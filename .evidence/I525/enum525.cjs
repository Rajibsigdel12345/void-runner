const fs = require("fs");
const b = fs.readFileSync("src/core/game.js", "latin1");
const lines = b.split("\n");
const out = [];
lines.forEach((l, i) => { if (l.includes("this.emit('hit'")) out.push(i + " | " + l.trim().slice(0, 100)); });
console.log(out.join("\n"));
console.log("total hit emits:", out.length);
console.log("total lines:", lines.length);
console.log("ends with NL:", b.endsWith("\n"));