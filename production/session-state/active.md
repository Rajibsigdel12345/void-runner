# Active session state - Void Runner (E8)

- project: Void Runner (E:\Game, three.js, no bundler)
- epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-158 (next)
- current_iteration: I157 (committed)
- branch: main
- tests: 468/468
- build: exit 0
- notes: I157 done (ST-157 hotkeys M/P/F): F is a new FX-quality hotkey - main.js keydown flips low<->high via storage.toggleFxQuality, persists, applySettings + adaptive.userSet (user choice overrides auto-downgrade) + fxPreview + menu/pause panel sync + toast 'FX <LEVEL>'; pause screen gains an 'F — FX' row, menu keycaps gain ['F','fx']; panel-focus guard swallows f/F while a settings control is focused. +1 test (toggleFxQuality). M/P regression-verified (M toggles MUTE, Q quits, P pauses). 468/468, build 0, console 0/0, screenshots .evidence/I157/. Next: I158 ST-158 options rows (slow-mo hint, colorblind, music). NOTE: Blender 5.2.3 connected - E9 Blender epic after E8 closeout (model low-poly ship/rocks/bosses/warden, export GLB, integrate via useGLB/setGLB/assetLoader). Art-direction improvement = accepted research item. Do NOT spawn sub-agents.
