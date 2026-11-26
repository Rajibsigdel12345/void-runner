I606 (ST-572, E87): G2 damped dolly direction shipped

main.js R2 gate replaced by the damped dolly DIRECTION (radialDollyDir):
the held azimuth ALWAYS damps toward radial outside the band / legacy
PI/2 inside (the I604 dist>0.5 guard dropped on purpose); backDir =
(cos a, sin a) outside the azDeadband, else null = the exact legacy
branch, so the camera target is continuous across the band crossing.

- config +1 lever camera.dolly.azDeadband 1e-4 (commented)
- cameraModel.js additive pure radialDollyDir (no alloc, shortest arc)
- +3 unit tests -> npm test 1,246/1,246
- gateq606: src bitwise-identical to the farframe604 G2 sim (3,840 checks, 0 mismatches)
- regression 2/2 EXACT zero re-pins (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm)
- smoke606: maxStepSettled 5.35 deg/frame (S re-entry whip gone; acceptance <= 30)
- farframe604 re-run: G2 numbers exact, amendedD=true
- dist 6,854,378 B / 204 (+335 B, within E87 budget <= 6,858,000 B), vendor 4/4 EXACT