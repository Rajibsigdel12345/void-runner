# Active session state - Void Runner (E8)

- project: Void Runner (E:\Game, three.js, no bundler)
- epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-152 (next)
- current_iteration: I151 (committed)
- branch: main
- tests: 462/462
- build: exit 0
- notes: I151 done (ST-151 first-run tutorial overlay, dismiss + persist) - opens E8D (UI/UX). New src/render/tutorialOverlay.js (one-time "how to play" card, keycap grid, reduced-motion aware); dedicated storage key getTutorialSeen/setTutorialSeen (versioned, mirrors daily pattern); tick() gates the sim while visible (world.time frozen, render continues); dismiss via LAUNCH button or Enter/Space/Esc; persisted {"version":1,"seen":true} so it never re-shows (passive hint on later runs). 462/462 (was 459, +3), build 0, browser smoke console 0/0 + NaN clean. Next: I152 ST-152 session stats (accuracy, best combo, kills, waves). NOTE: Blender 5.2.3 connected - E9 Blender epic (I207-I217) after E8 closeout; use blender MCP tools there. Do NOT spawn sub-agents.
