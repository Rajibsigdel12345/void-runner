const fs=require('fs');
let s=fs.readFileSync('.evidence/I535/build_bulwark_v2.py','utf8');
const old='for i in range(6):\r\n    a0 = (i+0.5)*2.0*math.pi/6; a1 = (i+1.5)*2.0*math.pi/6\r\n    plate(bm, (-0.04, 0.98*math.cos(a0), 0.98*math.sin(a0)),\r\n              (-0.04, 0.98*math.cos(a1), 0.98*math.sin(a1)),\r\n              (-0.04, 0.62*math.cos(a0), 0.62*math.sin(a0)),\r\n              (-0.04, 0.62*math.cos(a1), 0.62*math.sin(a1)), 5, 3, t=0.012)  # rear gussets';
const nw='for i in range(6):\r\n    a = (i+0.5)*2.0*math.pi/6\r\n    boxx(bm, -0.065, 0.80*math.cos(a), 0.80*math.sin(a), 0.04, 0.14, 0.16, a)  # raised rear gussets';
const k=s.split(old).length-1;
if(k!==1)throw new Error('occurrence '+k);
s=s.replace(old,nw);
fs.writeFileSync('.evidence/I535/build_bulwark_v2.py',s);
console.log('GUSSET_LOOP_REPLACED');