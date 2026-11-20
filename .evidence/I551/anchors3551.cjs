const fs=require("fs");
const s=fs.readFileSync("src/core/config.js").toString("utf8");
const i=s.indexOf("boss: 'abyssal'");
console.log(JSON.stringify(s.slice(i-220, i+120)));
const a="optionalTargets: ['rapid', 'shielded'], checkpointAt: 0 }";
console.log("closeSeq count:", s.split(a).length-1);
const j=s.indexOf(a);
console.log("after close:", JSON.stringify(s.slice(j+a.length, j+a.length+40)));
