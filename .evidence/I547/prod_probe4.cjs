const fs = require("fs");
const path = require("path");
const R = (p) => path.join(__dirname, "..", "..", p);
const ep = fs.readFileSync(R("production/epics.md"), "latin1");
const i = ep.indexOf("## E74");
const s0 = ep.indexOf("- Status: IN PROGRESS (opened I543)");
const s1 = ep.indexOf("\r\n", s0);
console.log("STATUS line len", s1 - s0);
console.log(JSON.stringify(ep.slice(s0 + 2300, s1 + 1)));