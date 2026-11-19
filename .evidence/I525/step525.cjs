const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
for (let i = 230; i <= 285; i++) console.log(i + " | " + lines[i].replace(/\r$/, ""));