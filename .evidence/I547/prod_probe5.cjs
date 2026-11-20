const fs = require("fs");
const path = require("path");
const R = (p) => path.join(__dirname, "..", "..", p);
const ep = fs.readFileSync(R("production/epics.md"), "latin1");
const i = ep.indexOf("## E74");
const s0 = ep.indexOf("- Status:", i);
const s1 = ep.indexOf("\r\n", s0);
console.log("STATUS line len", s1 - s0, "at", s0, "end", s1);
console.log(JSON.stringify(ep.slice(s0 + 1800, s1 + 1)));