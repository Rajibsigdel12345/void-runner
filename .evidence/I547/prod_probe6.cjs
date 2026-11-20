const fs = require("fs");
const path = require("path");
const R = (p) => path.join(__dirname, "..", "..", p);
const ep = fs.readFileSync(R("production/epics.md"), "latin1");
const s0 = ep.indexOf("- Status: IN", ep.indexOf("## E74"));
console.log("s0", s0, "filelen", ep.length);
console.log(JSON.stringify(ep.slice(s0 + 1700)));