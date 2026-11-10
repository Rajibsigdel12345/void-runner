# Active Session State

- current_epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-122 (next)
- current_iteration: I121
- branch: main
- notes: I121 done (ST-121 shielded rocks, core). RECORD CORRECTION: rocks were 1-hit (no armor field); only the Monolith boss had HP (boss.js takeHit); the rock shield is distinct from the existing SHIP shield power-up (powerups.isShielding()/consumeShieldHit(), event 'shieldPop'), so it uses rock.shielded/rock.armor + AsteroidField.hit() + 'rockShieldHit' event. Design: a rare rim-spawn variant (like golden) that absorbs `armor` bullet hits then shatters (NEVER splits) and pays a higher flat score. config asteroid.shielded{minWave:4,chance:0.10,armor:3,size:'M',score:400}; asteroids.js spawn(shielded)+destroy no-split guard+hit(); game.js resolveBulletRocks via hit() (absorb->rockShieldHit no score / shatter->shielded.score kill.shielded) + bombBlast shielded.score; waves.js shielded rim roll (precedence over golden, never a fragment). +8 unit tests -> 273/273 + build 0 + seq 1..121. Core-only (no browser). Next: I122 ST-122 weapon progression lvl 1-3 (core: levels by wave, damage/rate | unit: level thresholds | node --test).
