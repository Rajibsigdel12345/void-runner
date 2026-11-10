# Active session state - Void Runner (E8)

- project: Void Runner (E:\Game, three.js, no bundler)
- epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-132 (next)
- current_iteration: I131 (committed)
- branch: main
- tests: 345/345 (was 337 at I130, +8 I131 spawnMix.test.js)
- build: exit 0
- notes: I131 done (ST-131 enemy spawn-mix rebalance, cgs-balance-check + cgs-dev-story). Premise: mix was hardcoded in pickSize(); GDD fixes splits not spawn ratios -> config.spawnMix.rows (4 rows + lFloor 0.28) now carries authority (like I130 powerup.weights). w1-9 byte-identical (same values + same RNG draw width); w10-14 S 0.32->0.40, w15+ L floor 0.30 / S cap 0.40 (was 0.45). A/B: 10 full-run seeds bit-identical (bot dies w5-w8 - known boss-ring limitation), forced w10-16: 21/21 hits identical (no survival shift), realized late mix L 28.4->33.5 pp, S flat ~38.9. playtest.mjs gained per-size spawn/kill tallies + oldmix arm; fixed pre-existing bot null-thrust crash (only eb/mine threats in range). Docs: balance-notes.md ## I131 (contract inline). Next: I132 ST-132 E8B GDD addendum - homing-drone section (maxAge) + I130 drop table (weights + dropLife) + I131 spawnMix table (rows + lFloor). NOTE: Blender 5.2.3 connected - the E9 Blender Graphics & Assets epic (ST-207..216) runs after the E8 closeout; use blender MCP tools there. Do NOT spawn sub-agents.
