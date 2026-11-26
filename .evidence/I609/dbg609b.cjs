const fs = require("fs");
for (const f of ["arena_ring.glb", "ship.glb"]) {
  const e = fs.readFileSync("E:/Game/.evidence/I609/enc/" + f);
  const o = fs.readFileSync("E:/Game/.evidence/I609/orig/" + f);
  for (const [name, b] of [["enc", e], ["orig", o]]) {
    const magic = b.readUInt32LE(0).toString(16), ver = b.readUInt32LE(4), decl = b.readUInt32LE(8);
    const jl = b.readUInt32LE(12), jt = b.readUInt32LE(16).toString(16);
    const bl = b.readUInt32LE(20 + jl), bt = b.readUInt32LE(24 + jl).toString(16);
    console.log(f + " " + name + " len=" + b.length + " decl=" + decl + " jsonLen=" + jl + " jsonType=" + jt + " binLen=" + bl + " binType=" + bt + " calcEnd=" + (28 + jl + bl));
  }
}