const fs = require("fs");
const p = "E:/Game/src/render/screens.js";
let s = fs.readFileSync(p, "latin1");
const old = "    if (menuStartLine) menuStartLine.style.display = 'none'; // never set (keyboard path) - kept for symmetry";
const neu = "    if (menuStartLine) menuStartLine.style.display = mm.hasContinue ? 'none' : ''; // I544 fix: hide the keyboard start prompt only when CONTINUE owns the menu";
const n = s.split(old).length - 1;
if (n !== 1) { console.error("ANCHOR COUNT " + n); process.exit(1); }
s = s.split(old).join(neu);
fs.writeFileSync(p, s, "latin1");
console.log("I544 menuStartLine fix applied (1 replacement)");