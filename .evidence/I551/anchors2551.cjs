const fs=require("fs");
const s=fs.readFileSync("src/core/config.js").toString("utf8");
const i=s.lastIndexOf("'reef-4'");
console.log("=== around reef-4 palette entry ===");
console.log(JSON.stringify(s.slice(i-260, i+220)));
const h=s.indexOf("hp: { 1: 96");
console.log("=== around campaignBoss hp/phases/score ===");
console.log(JSON.stringify(s.slice(h-260, h+520)));
