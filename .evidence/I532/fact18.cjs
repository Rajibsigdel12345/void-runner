const fs = require("fs");
const e = fs.readFileSync("E:/Game/production/epics.md", "latin1");
const i = e.indexOf("## E71");
console.log(e.slice(i, i + 2200));
console.log("=== tail 200 bytes ===");
console.log(JSON.stringify(e.slice(e.length - 200)));
