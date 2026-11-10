# Active session state - Void Runner (E8)

- project: Void Runner (E:\Game, three.js, no bundler)
- epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-139 (next)
- current_iteration: I138 (committed)
- branch: main
- tests: 389/389
- build: exit 0
- notes: I138 done (ST-138 asteroid belt core, cgs-dev-story). From wave 8 one drifting INDESTRUCTIBLE belt rock per wave start (max 5, config.belt {fromWave 8, max 5, size M, speed 0.5-1.1 u/s}): separate persistent layer (exempt from rock cap), field.hit -> {destroyed:false, belt:true}, bullet consumed + beltHit event, bomb-proof (shatter refuses), never splits (destroy guard), survives ship contact (1 life, normal shield/invuln). World: spawnBeltForWave after the warden hook; resolveBulletRocks belt branch; resolveShipRocks skip-destroy. 389/389 (+11 tests/belt.test.js), build 0, playtest scenario 15 clean. Next: I139 ST-139 belt tuning + perf (browser) - belt rock visual distinction in rockRenders, beltHit spark FX, perf check, playtest A/B. NOTE: Blender 5.2.3 connected - E9 Blender epic (ST-207..217) after E8 closeout; use blender MCP tools there. Do NOT spawn sub-agents.
