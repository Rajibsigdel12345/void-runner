const fs = require("fs");
const path = require("path");
const R = (p) => path.join(__dirname, "..", "..", p);
const ep = fs.readFileSync(R("production/epics.md"), "latin1");
console.log(JSON.stringify(ep.slice(350800)));