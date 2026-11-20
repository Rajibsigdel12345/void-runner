const fs = require("fs");
const b = fs.readFileSync("E:/Game/CHANGELOG.md", "latin1");
console.log("CRLF anchor:", b.split("## [Unreleased]\r\n").length - 1);
console.log("LF-only anchor:", b.split("## [Unreleased]\n").length - 1);
const i = b.indexOf("## [Unreleased]");
console.log("bytes after:", Array.from(b.slice(i + 15, i + 19), (c) => c.charCodeAt(0)));