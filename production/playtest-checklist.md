# Playtest checklist - Void Runner (I202 human playtest prep, ST-199)

Purpose: turn I202 into a fast, comparable session. The playtester plays for real;
this sheet is what to run, what to note, and what to verify afterwards.
Not a product file (not shipped) - production tooling only.

## Setup
- URL: dev server http://localhost:5173 (or `npm run preview` for the production build).
- Fresh-profile pass: open an incognito/private window (empty localStorage) to check the
  first-run tutorial path; normal pass: the regular window (scores persist).
- Desktop, keyboard+mouse. Window >= 1280x720. Headphones (music bed + SFX are part of the
  experience).
- Before starting the first run, note the menu values: BEST, DAILY (date), TOP 5 list.

## Session protocol (3 runs, ~5 min each, no timer pressure)
1. Run 1 - fresh profile (private window):
   - Verify: menu renders (controls guide, TOP 5, BEST, DAILY, audio/visuals panels).
   - Press Enter -> tutorial card appears ONCE (first-run). Read it. Press Enter to dismiss.
   - Play 3-5 min. Note: does wave 1-2 feel right? Controls (strafe/fire/aim) responsive?
   - Let the run end (death). Note: game-over screen fields (score, wave, kills, share
     code, WATCH THIS RUN button).
2. Run 2 - same profile:
   - Enter starts immediately (tutorial must NOT reappear).
   - This time use one power-up deliberately if offered (magnet/slowmo/weapon).
   - Note: what died on you, and whether it felt fair or cheap.
   - At game over: copy the share code (COPY RESULT). Note the code format
     (vr1.... two-char suffix).
3. Run 3 - replay pass:
   - At game over, press WATCH THIS RUN (only present when the run was recorded with O;
     if absent, press O during the run first, then finish, then WATCH THIS RUN).
   - Watch to the end. Note: does the replayed run look like the one you played?
   - Try 1/2/3 speed keys, P pause, Q quit.
- Optional: pause mid-run (P) -> R restart, Q quit - verify the overlay actions.

## What to note (free-form, one line each)
- Difficulty curve: which wave/minute felt too hard or too easy.
- Feel: ship speed, fire cadence, hit feedback (shake/flash/slow-mo) - too much or too little?
- Readability: can you read the HUD mid-fight (score, combo, lives, wave)?
- Audio: music bed level vs SFX; any clipping or annoyance.
- Confusing moments: any UI/controls that did not say what they would do.
- One thing that would make you keep playing (or stop).

## Post-session verification (playtester + one operator each)
- [ ] Fresh profile: tutorial showed exactly once across the session (key voidrunner.tutorial).
- [ ] High score board updated with the session bests (menu TOP 5).
- [ ] DAILY (2026-11-11) updated after the session.
- [ ] A recorded run produced a WATCH THIS RUN replay that ends at the same score.
- [ ] Browser console clean (F12) - no red errors during the session.

## Triage buckets for I203
- BUG: wrong behavior, crash, NaN, console error, state stuck. (Repro + expected/actual.)
- BALANCE: numbers/feel opinions (waves, damage, pickup value). No code change implied.
- UX: clarity/labeling issues in menus, HUD, or the tutorial.
- ART/AUDIO: visual/sound taste notes for the E9 Blender pass.

## Reference values (sanity anchors, from the deterministic test suite)
- Demo pilot (seed 1909): dies at t=36.15 s, score 11334, kills 57, wave 2, max combo x15.
- Wave formula: startAsteroids = 4 + n; maxConcurrent = 6 + 2n (cap 24); speedMult = 1 + 0.06n (cap 2.1).
- Boss (Monolith) appears every wave 5.
