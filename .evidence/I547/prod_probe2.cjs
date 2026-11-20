const fs = require("fs");
const path = require("path");
const R = (p) => path.join(__dirname, "..", "..", p);
const ep = fs.readFileSync(R("production/epics.md"), "latin1");
const i = ep.indexOf("## E74");
console.log(JSON.stringify(ep.slice(i, i + 2600)));