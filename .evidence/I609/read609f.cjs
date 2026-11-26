const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('E:/Game/node_modules/meshoptimizer/package.json','utf8'));
console.log('version: ' + pkg.version);
console.log('main: ' + pkg.main);
console.log('exports: ' + JSON.stringify(pkg.exports, null, 1));
// check cjs files present
const d = fs.readdirSync('E:/Game/node_modules/meshoptimizer');
console.log('files: ' + d.join(', '));