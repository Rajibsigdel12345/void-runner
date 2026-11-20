const fs=require("fs");
const b=fs.readFileSync("src/core/config.js");
console.log("BOM:", b.slice(0,3).toString("hex"));
const s=b.toString("utf8");
const anchors=[
"Necro Gauntlet",
"'reef-4'",
"hp: { 1: 96, 2: 110, 3: 130, 4: 150 },",
"phases: { 1: 3, 2: 1, 3: 1, 4: 1 },",
"score: { 1: 1000, 2: 1400, 3: 2000, 4: 2600 },"
];
for(const a of anchors){
  const c=s.split(a).length-1;
  console.log("count", c, "first", s.indexOf(a), JSON.stringify(a.slice(0,44)));
}
const i=s.indexOf("Necro Gauntlet");
console.log("=== around Necro Gauntlet ===");
console.log(JSON.stringify(s.slice(i-300, i+900)));
