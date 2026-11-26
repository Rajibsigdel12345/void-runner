const fs = require("fs");
const s = fs.readFileSync("E:/Game/production/epics.md", "utf8");
const i = s.indexOf("## E84");
const j = s.indexOf("\n## ", i + 1);
const block = s.slice(i, j === -1 ? undefined : j);
const L = block.replace(/\r/g, "").split("\n");
L.forEach((l, k) => console.log("L" + k + " [" + l.length + "]: " + l.slice(0, 1200)));