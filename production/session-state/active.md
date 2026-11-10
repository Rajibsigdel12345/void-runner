# Active Session State

- current_epic: E8 - Expansion Milestone (I107-I206)
- current_story: ST-120 (next)
- current_iteration: I119
- branch: main
- notes: I119 done (ST-119 chain-splitter rocks - RECORD CORRECTION: the chain split L->[2,3]M / M->[2,3]S + cap was already implemented + tested since ST-009 in AsteroidField.destroy + config sizes.splits/child; the iteration filled the genuine gap). New: (1) outward kick - split fragments inherit the parent heading, biased within +/- cfg.asteroid.split.spread (0.9 rad) instead of fully random (spawn() gains optional dirHint; destroy() passes v2Norm(rock.vel)); (2) generation tracking - rocks carry gen (rim 0, L0->M1->S2) for ST-120 split scoring; boss-split call site unchanged (no dirHint = legacy random). +3 unit tests (gen depth, spread bound + seeded mean-direction bias, split cap at free slots). 260/260 + build 0 + seq 1..119, core-only (no browser needed). Next: I120 ST-120 split tuning + scoring (unit + browser) - gen-aware score deltas in the kill path (deeper fragments worth more), then verify the chain read in the browser (screenshot + console + no NaN).
