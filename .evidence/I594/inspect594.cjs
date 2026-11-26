const fs = require("fs");
const s = fs.readFileSync("E:/Game/AGENTS.md", "utf8");
const marker = "4. `npm run build` dist/ total stays under";
const i = s.indexOf(marker);
const line = s.slice(i, s.indexOf("\n", i));
console.log("LEN", line.length);
console.log("HEAD:", JSON.stringify(line.slice(0, 900)));
console.log("TAIL:", JSON.stringify(line.slice(-900)));