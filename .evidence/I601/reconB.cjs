const fs = require("fs");
const s = fs.readFileSync("src/core/cameraModel.js", "latin1");
const lines = s.split("\n");
// chaseTargets full body L54-88, projectNdc full L89-119
console.log("=== chaseTargets body (L54-88) ===");
for(let i=53;i<88;i++) console.log("L"+(i+1)+" "+lines[i]);
console.log("=== projectNdc tail (L108-119) ===");
for(let i=107;i<119;i++) console.log("L"+(i+1)+" "+lines[i]);
const c = fs.readFileSync("src/core/config.js", "latin1");
const cam = c.indexOf("camera:");
console.log("=== CONFIG.camera block ===");
const camEnd = c.indexOf("cockpitLookDrop", cam);
console.log(c.slice(cam, cam + 2200));
const ar = c.indexOf("arena:");
console.log("=== CONFIG.arena block (first 500) ===");
console.log(c.slice(ar, ar + 500));