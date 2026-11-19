const fs = require("fs");
const raw = fs.readFileSync("src/core/game.js", "latin1");
const crlf = (raw.match(/\r\n/g) || []).length;
const lf = (raw.match(/\n/g) || []).length;
const cr = (raw.match(/\r/g) || []).length;
console.log("CRLF:", crlf, "total LF:", lf, "total CR:", cr, "bare LF:", lf - crlf, "bare CR:", cr - crlf);
console.log("BOM:", raw.charCodeAt(0) === 0xfeff);