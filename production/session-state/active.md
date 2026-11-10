# Active Session State

- current_epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-121 (next)
- current_iteration: I120
- branch: main
- notes: I120 done (ST-120 split tuning + scoring). RECORD CORRECTION: gen tracking already landed ST-119 (I119 - rocks carry gen rim 0 / L0->M1->S2); the genuine gap was the kill path ignored gen so a size-2 S scored the same as a fresh rim spawn. Change: config asteroid.split.genBonus:[0,0.25,0.5] (per-gen score bonus, clamps for gen>2); game.js resolveBulletRocks folds (1+genBonus) into base before scoreKeeper.kill and the kill event now carries gen (bug fixed in-session: Math.min clamp for gen beyond the 3-entry table). +5 unit tests -> 265/265 + build 0 + seq 1..120. Browser (?nocache=120): L0 +25 / M1 +62 / S2 +150, final 312 = 237 kills + 75 near-miss (eventTally {kill:3,wave:1,nearmiss:5,hit:2,powerupDrop:1}), outward kick visible, console 0/0, 0 NaN, screenshot .evidence/I120_splitscore.png. Next: I121 ST-121 shielded rocks (core: armor N hits, visual state, never splits | unit: armor + no-split | node --test) - grep asteroids.js + config for any pre-existing armor concept first (likely none; the boss may have HP).
