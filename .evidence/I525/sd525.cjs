const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
function dump(a, b, label) { console.log("--- " + label + " ---"); for (let i = a; i <= Math.min(b, lines.length-1); i++) console.log(i + " | " + lines[i]); }
const sd = lines.findIndex(l => l.includes("shipDamage() {"));
dump(sd - 2, sd + 20, "shipDamage");
dump(995, 1015, "resolveShipEnemyBullets full");
const wd = lines.findIndex(l => l.includes("wardenDeath"));
dump(wd - 12, wd + 8, "warden death area");
const sl = fs.readFileSync("src/core/ship.js", "latin1").split("\n");
sl.forEach((l, i) => { if (/damage\(|isInvulnerable/.test(l)) console.log("ship.js:" + i + " | " + l.trim().slice(0, 120)); });