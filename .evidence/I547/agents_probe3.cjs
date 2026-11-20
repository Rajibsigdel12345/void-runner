const fs = require("fs");
const raw = fs.readFileSync("AGENTS.md", "utf8");
console.log("--- region 6900..7600 ---");
console.log(JSON.stringify(raw.slice(6900, 7600)));