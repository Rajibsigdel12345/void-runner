const fs = require("fs");
const p = "E:/Game/src/core/config.js";
let s = fs.readFileSync(p, "latin1");
function hex16(b){ return Array.from(b.slice(0,16)).map(x=>x.toString(16).padStart(2,"0")).join(""); }
const before = hex16(fs.readFileSync(p));
const edits = [
  [
    "enterDur: 1.2,       // s: invisible entry",
    "enterDur: 2.0,       // s: invisible entry (I524/ST-490 E70: 1.2 -> 2.0, Option B primary; R1 TTK residual WITH measurement)"
  ],
  [
    "    // enter 1.2 s (invisible) -> orbit 3.5 / cloak 1.2 / drift 1.0 / strike 2.5",
    "    // enter 2.0 s (invisible; I524/ST-490: was 1.2) -> orbit 3.5 / cloak 1.2 / drift 1.0 / strike 2.5"
  ],
];
for (const [a, b] of edits) {
  if (s.split(a).length !== 2) throw new Error("anchor not unique: " + a.slice(0, 60));
  s = s.replace(a, b);
}
fs.writeFileSync(p, s, "latin1");
const after = hex16(fs.readFileSync(p));
console.log("config.js enterDur 1.2 -> 2.0 applied; head16", before, "->", after, before === after ? "UNCHANGED" : "CHANGED");