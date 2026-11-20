const fs = require("fs");
const s = fs.readFileSync("E:/Game/production/stories.md", "latin1");
const lines = s.split("\n");
console.log("FULL L667:");
console.log(lines[666]);
console.log();
console.log("FULL L671 (last 400 chars):");
console.log(lines[670].slice(-400));
