const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
lines.forEach((l, i) => { const m = l.match(/emit\('([a-zA-Z]+)'/); if (m) console.log(m[1]); }).reduce((s, x) => { s.add(x); return s; }, new Set());
const evs = [];
const seen = new Set();
lines.forEach((l, i) => { const m = l.match(/emit\('([a-zA-Z]+)'/); if (m && !seen.has(m[1])) { seen.add(m[1]); evs.push(m[1]); } });
console.log("ALL EVENT TYPES: " + evs.join(", "));
console.log("--- wave events context ---");
lines.forEach((l, i) => { if (l.includes("emit('wave'") || l.includes("emit('waveCleared'")) console.log(i + " | " + l.trim().slice(0, 130)); });