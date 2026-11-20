const fs = require("fs");
const p = "E:/Game/src/core/menuModel.js";
let s = fs.readFileSync(p, "latin1");
const old = "  const p = Number.isInteger(campaignProgress) && campaignProgress > 0 ? campaignProgress : 0;";
const neu = "  const p = Number.isInteger(campaignProgress) && campaignProgress >= 1 && campaignProgress <= 4 ? campaignProgress : 0; // domain: 4 campaign levels (out-of-range = garbage -> bit-identical pre-E74 path)";
const n = s.split(old).length - 1;
if (n !== 1) { console.error("ANCHOR COUNT " + n); process.exit(1); }
s = s.split(old).join(neu);
fs.writeFileSync(p, s, "latin1");
console.log("I544 menuModel domain fix applied (1..4)");