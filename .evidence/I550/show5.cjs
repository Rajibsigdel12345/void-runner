const fs = require('fs');
const s = fs.readFileSync('CHANGELOG.md', 'latin1');
const i = s.indexOf('## [Unreleased]');
console.log(JSON.stringify(s.slice(i, i + 60)));
