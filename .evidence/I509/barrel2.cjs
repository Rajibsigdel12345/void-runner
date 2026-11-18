const fs = require('fs');
const buf = fs.readFileSync('assets/enemy_sentry.glb');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const binOff = 20 + ((jsonLen + 3) & ~3) + 12;
for (const meshName of ['VR_Sentry_Platform','VR_Sentry_Base','VR_Sentry_Barrel','VR_Sentry_Charge']) {
  const m = json.meshes.find((mm) => mm.name === meshName);
  const pos = json.accessors[m.primitives[0].attributes.POSITION];
  const bv = json.bufferViews[pos.bufferView];
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9,minz=1e9,maxz=-1e9;
  for (let i = 0; i < pos.count; i++) {
    const o = binOff + (bv.byteOffset||0) + (pos.byteOffset||0) + i*12;
    const x=buf.readFloatLE(o), y=buf.readFloatLE(o+4), z=buf.readFloatLE(o+8);
    if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; if(z<minz)minz=z; if(z>maxz)maxz=z;
  }
  console.log(meshName, 'ext', (maxx-minx).toFixed(4), (maxy-miny).toFixed(4), (maxz-minz).toFixed(4), 'cx', ((minx+maxx)/2).toFixed(4), 'cz', ((minz+maxz)/2).toFixed(4));
}