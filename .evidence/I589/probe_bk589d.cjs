const fs = require("fs");
function lastLineEndings(p, n) {
  const b = fs.readFileSync(p);
  const lines = [];
  // walk backwards from end collecting line terminators of the last n lines
  let i = b.length - 1;
  let count = 0;
  const termAt = [];
  let j = b.length;
  while (j > 0 && count <= n) {
    if (b[j - 1] === 0x0A) {
      termAt.push((j === b.length ? "EOF" : "") + (b[j - 2] === 0x0D ? "CRLF" : "LF") + "@" + j);
      count++;
      // find start of this line
      let k = j - 2;
      while (k > 0 && b[k] !== 0x0A) k--;
      const start = k + 1;
      lines.push(b.slice(start, j).toString("latin1").slice(0, 60));
      j = k;
    } else j--;
  }
  console.log("== " + p + " (last " + count + " line terminators, oldest->newest) ==");
  for (let x = 0; x < lines.length; x++) console.log("  " + termAt[x] + "  " + JSON.stringify(lines[x]));
}
lastLineEndings("production/stories.md", 8);
lastLineEndings("production/iterations.md", 12);
lastLineEndings("production/timeline.md", 4);
lastLineEndings("production/session-state/active.md", 3);
lastLineEndings("CHANGELOG.md", 3);
