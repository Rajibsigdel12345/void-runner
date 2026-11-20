const fs=require("fs");
const c=fs.readFileSync("src/core/strings.js","utf8");
const keys=["level.name.l5","level.zone.l5z1","level.zone.l5z2","level.zone.l5z3","level.zone.l5z4"];
for(const k of keys){
  const i=c.indexOf(k);
  if(i<0){console.log(k,"NOT FOUND");continue;}
  const line=c.slice(i,c.indexOf("\n",i));
  console.log(line.trim());
}
