# Active Session State

- current_epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-123 (next)
- current_iteration: I122
- branch: main
- notes: I122 done (ST-122 weapon progression levels 1-3 by wave, core). RECORD CORRECTION: weapon already had fixed fireInterval + 2 TEMPORARY power-ups (rapid x2, spread 3-way) but no PERMANENT wave-driven level; because rocks are 1-hit, 'damage' = bullet count + cadence, not per-bullet HP. Design: L1 (wave 1) single / L2 (wave 5) narrow twin / L3 (wave 10) triple + faster; spread power-up OVERRIDES the level layout, rapid + level rateMul STACK. config weapon.levels; game.js weaponLevel()/weaponSpec() + _wlevel (ctor+reset) + 'weaponLevelUp' {level} on wave rise + fireWeapon uses the spec + 'fire' carries level. +6 unit tests -> 279/279 + build 0 + seq 1..122. Core-only (no browser). Next: I123 ST-123 weapon visuals per level (browser) - render twin/triple layout + level-up flash/HUD cue. NOTE: Blender 5.2.3 connected - asset/graphics pass planned for the render iterations + an E9 graphics epic after the E8 closeout.
