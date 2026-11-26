import { radialDollyDir, azimuthDamp } from "../../src/core/cameraModel.js";
const AZTAU = 0.25, DEADBAND = 1e-4, DT = 1 / 60, BAND = 0.7 * 26;
function wrap(x) { while (x > Math.PI) x -= 2 * Math.PI; while (x <= -Math.PI) x += 2 * Math.PI; return x; }
function stepHeldG2(held, dist, px, py) {
  const target = dist >= BAND ? Math.atan2(py, px) : Math.PI / 2;
  const a = azimuthDamp(held, target, DT, AZTAU);
  const backDir = Math.abs(wrap(a - Math.PI / 2)) >= DEADBAND ? { x: Math.cos(a), y: Math.sin(a) } : null;
  return { a, backDir };
}
let mismatches = 0, checked = 0;
const helds = [Math.PI / 2, -Math.PI / 2, 0, Math.PI, 0.3, -2.5, 3.0, 2.9];
const poses = [];
for (let r = 0; r <= 26; r += 1.3) for (let tdeg = 0; tdeg < 360; tdeg += 15) poses.push({ x: r * Math.cos(tdeg * Math.PI / 180), y: r * Math.sin(tdeg * Math.PI / 180) });
for (const h0 of helds) {
  let held = h0;
  const out = { a: h0, backDir: null, bd: { x: 0, y: 1 } };
  for (const p of poses) {
    const dist = Math.hypot(p.x, p.y);
    const ref = stepHeldG2(held, dist, p.x, p.y);
    const got = radialDollyDir(out.a, Math.atan2(p.y, p.x), dist, BAND, DT, AZTAU, DEADBAND, out);
    checked++;
    const sameA = Object.is(got.a, ref.a);
    const sameNull = (got.backDir == null) === (ref.backDir == null);
    const sameVals = got.backDir == null ? true : Object.is(got.backDir.x, ref.backDir.x) && Object.is(got.backDir.y, ref.backDir.y);
    if (!sameA || !sameNull || !sameVals) { mismatches++; if (mismatches <= 5) console.log("MISMATCH held0=" + h0.toFixed(3) + " pose=(" + p.x.toFixed(2) + "," + p.y.toFixed(2) + ") dist=" + dist.toFixed(2) + " refA=" + ref.a + " gotA=" + got.a + " refBD=" + JSON.stringify(ref.backDir) + " gotBD=" + JSON.stringify(got.backDir)); }
    held = got.a;
  }
}
console.log("GATEQ606 checked=" + checked + " mismatches=" + mismatches + " -> " + (mismatches === 0 ? "PASS" : "FAIL"));
process.exit(mismatches === 0 ? 0 : 1);