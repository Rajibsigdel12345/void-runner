const s = require("fs").readFileSync("src/core/strings.js", "utf8");
const lines = s.split(/\r?\n/);
lines.forEach((l, i) => { if (l.includes("'menu.install':")) console.log((i + 1) + ": " + l); });