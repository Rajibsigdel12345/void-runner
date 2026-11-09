const { World } = await import('E:/Game/src/core/game.js');
const { RNG } = await import('E:/Game/src/core/rng.js');
// replicate a typical failing pattern
const w = new World(new RNG(57));
w.begin();
const evs0 = w.drainEvents();
console.log('evs0 === w.events:', evs0 === w.events);
// emit happens in step; check if internal code drains mid-step:
const src = (await import('fs')).readFileSync('E:/Game/src/core/game.js','utf8');
const lines = src.split('\n');
lines.forEach((l,i)=>{ if(l.includes('drainEvents')) console.log(i+1, l.trim()); });
