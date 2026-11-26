const fs = require("fs");
const s = fs.readFileSync("E:/Game/production/epics.md", "utf8");
const i = s.indexOf("## E84");
const j = s.indexOf("\n## ", i + 1);
const L = s.slice(i, j).replace(/\r/g, "").split("\n");
console.log("STORIES TAIL 400:", JSON.stringify(L[4].slice(-400)));
function count(str, a) { let n = 0, k = 0; while ((k = str.indexOf(a, k)) !== -1) { n++; k += a.length; } return n; }
console.log("hdr anchor count:", count(s, ") - OPEN I589 (ST-556)"));
console.log("status anchor count:", count(s, "- Status: OPEN (opened I589; ST-556 DONE I589;"));
console.log("stories-tail anchor count:", count(s, L[4].slice(-120)));