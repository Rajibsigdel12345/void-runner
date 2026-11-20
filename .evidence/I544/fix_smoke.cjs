const fs = require("fs");
const p = "E:/Game/.evidence/I544/smoke544.mjs";
let s = fs.readFileSync(p, "latin1");
const old = 'const cont = btns.find((b) => b.textContent.includes("CONTINUE"));';
const neu = 'const cont = btns.find((b) => b.style.color === "rgb(255, 224, 138)") || btns.find((b) => b.textContent.includes("CONTINUE")); // gold = CONTINUE primary (structural, works while hidden+unlabeled)';
const n = s.split(old).length - 1;
if (n !== 1) { console.error("ANCHOR COUNT " + n); process.exit(1); }
s = s.split(old).join(neu);
const old2 = '  ck("A: CONTINUE hidden (no progress)", A.contExists === true && A.contVis === false);';
const neu2 = '  ck("A: CONTINUE btn exists but hidden (no progress)", A.contExists === true && A.contVis === false && (A.contText === "" || !A.contText.includes("CONTINUE")), "text=" + JSON.stringify(A.contText));';
const n2 = s.split(old2).length - 1;
if (n2 !== 1) { console.error("ANCHOR2 COUNT " + n2); process.exit(1); }
s = s.split(old2).join(neu2);
fs.writeFileSync(p, s, "latin1");
console.log("smoke544 selector patch applied");