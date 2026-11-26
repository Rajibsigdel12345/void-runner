const fs = require('fs');
const R = (f) => fs.readFileSync('E:/Game/' + f, 'latin1');
const ep = R('production/epics.md');
const iE = ep.lastIndexOf('## E86', 390090);
const iNext = ep.indexOf('\n## ', 390090 + 10);
console.log('E86 SECTION:', JSON.stringify(ep.slice(iE, iNext > 0 ? iNext : ep.length).slice(0, 1600)));