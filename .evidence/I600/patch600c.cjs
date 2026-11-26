const fs = require("fs");
const p = "src/render/cockpitFrame.js";
let s = fs.readFileSync(p, "latin1");
const oldL = "linear-gradient(143deg, rgba(13,19,33,0) 43%, rgba(13,19,33,0.45) 47.5%, rgba(13,19,33,0.45) 52.5%, rgba(13,19,33,0) 57%) left bottom / 42% 58% no-repeat,";
const oldR = "linear-gradient(-143deg, rgba(13,19,33,0) 43%, rgba(13,19,33,0.45) 47.5%, rgba(13,19,33,0.45) 52.5%, rgba(13,19,33,0) 57%) right bottom / 42% 58% no-repeat,";
const newL = "linear-gradient(35deg, rgba(13,19,33,0) 17.5%, rgba(13,19,33,0.45) 19.3%, rgba(13,19,33,0.45) 20.1%, rgba(13,19,33,0) 21.9%) left top / 100% 100% no-repeat,";
const newR = "linear-gradient(145deg, rgba(13,19,33,0) 17.5%, rgba(13,19,33,0.45) 19.3%, rgba(13,19,33,0.45) 20.1%, rgba(13,19,33,0) 21.9%) right top / 100% 100% no-repeat,";
for (const [a, b] of [[oldL, newL], [oldR, newR]]) {
  if (s.split(a).length - 1 !== 1) throw new Error("anchor fail: " + a.slice(0, 60));
  const i = s.indexOf(a);
  s = s.slice(0, i) + b + s.slice(i + a.length);
}
fs.writeFileSync(p, s, "latin1");
console.log("struts edge-to-edge");
