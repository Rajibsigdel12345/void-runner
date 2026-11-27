# E90 scope check - Second Blender art pass: arena rocks + finale boss + garnish

Opened I620 (ST-581..ST-584 pre-registered). E89 CLOSED at I619 (2e158dd; push landing verified via git ls-remote before I620 open). The user standing art ask continues ("use Blender to create assets required for the game and improve it", "improve the art element", research via YouTube/web allowed, "use polygons and GPU resources as much as needed", don't overengineer). E89 covered the hero ship, the L1-4 boss, and the five deep-wave enemies. The three remaining art gaps, measured: the asteroid belt (the most-drawn object in endless mode - smooth displaced ellipsoids without real craters or silhouette breaks), the L5 finale boss (boss_archon 3,108 t - thinner than the L1-4 boss art after E89), and the garnish set (11 tiny GLBs: 7 powerups / shield / 2 debris chunks / arena ring at 24-80 t each - near-wireframe).

## Scope Fit

Measured at I620 (on disk, post-I619):
- dist: 6,011,544 B / 205 files (I619 fresh measure, byte-identical to I618). E90 close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor) -> envelope 1,286,056 B.
- Assets: 34 GLB / 3,558,944 B / 159,141 t (post-MESHopt; E89 final).
- E90 targets (measured, current pins in parentheses):
  - Rocks v12 (I554 displacement remaster): L 111,008 B / 6,000 t + L_B 111,100 / 6,000 + M 35,476 / 1,800 + M_B 35,428 / 1,800 + S 15,240 / 700 + S_B 15,104 / 700 + comet 22,052 / 1,120 = 345,408 B / 18,120 t (7 GLB; assetGlbs per-variant pins + I554 B-window frustum rocks re-pin history: 2 in-frustum B pool rocks at reseed 71201, 3 L frustum-culled).
  - boss_archon.glb (I553): 58,916 B / 3,108 t (hull 1,916 + crown 752 + core 440; file cap per assetGlbs; campaign-only, absent from endless pin frames).
  - Garnish (11 GLB, 50,668 B / 534 t): powerup_spread 4,560 B / 48 t / powerup_shield 5,048 / 56 / powerup_bomb 4,788 / 48 / powerup_rapid 4,392 / 48 / powerup_overdrive 4,404 / 38 / powerup_magnet 3,936 / 36 / powerup_slowmo 3,364 / 24 / shield 5,908 / 80 / debris_chunk 4,632 / 48 / debris_sliver 4,588 / 48 / arena_ring 5,048 / 60.
- Feasibility: worst-case growth +995,008 B (Budget below) -> dist 7,006,552 B -> margin vs close target 291,048 B (>= 102,400 B floor). Feasible with cut ladder.
- The mine stays procedural (design decision, unchanged). E90 is exactly 3 asset landings (rocks v13 as ONE landing per the I554 precedent - the 7 rock variants are one family, one build session set; Archon v2; garnish v2 as ONE landing - the 11 garnish GLBs are one family) + the close gate. Nothing else.

## Research (extracted, I620 - YouTube/web per the standing research instruction)

- Asteroids (Rod DeWeese sub-D + displace + lattice workflow; CGMatter procedural craters; Sleep Fight low-poly method; Blender Bones rock sculpt): (1) SILHOUETTE FIRST - break the ellipsoid: lobe lobes + flat facet pinches (lattice-style vertex displacement) so no two rocks share an outline; (2) craters as REAL GEOMETRY - dented bowl + raised rim ring + 1-2 ejecta streaks, sized per variant (L: 5-8 craters, M: 3-4, S: 2, comet: 1-2 + the existing tail mass); (3) bump ridges / ridge bands between craters; (4) flat shading sells the rockiness; (5) albedo luma mottling stays in COLOR_0 (I554 formula family - no texture).
- Finale boss (Spacedock ship-design breakdowns / USS Vengeance; ID:R Harvester silhouette line): (1) strong distinctive silhouette - a tall vertical crown/spine above a layered hull mass (keeps the E89 obelisk language, makes it BIGGER and heavier); (2) player-facing detail first - the weak-point core must read at distance (brighter COLOR_0 + cage greebles around it); (3) layered recessed bays + visible weapon batteries (box greebles, no booleans); (4) scale cues - ring bands + hull segmentation so the 12k-t model reads as huge, not noisy.
- Garnish (standard icon-read practice for pickup items): each powerup needs a DISTINCT SILHOUETTE at ~200-300 t (currently 24-56 t near-wireframes): magnet = U-fork, spread = 3-way chevron fan, rapid = twin prongs, slowmo = spiral ring, overdrive = bolt/chevron, shield = ringed dome, bomb = spiked orb; shield pickup = layered dome; debris = irregular 3-4 facet shards (real rock chips, matching the v13 rock language); arena ring = banded torus with greeble studs (the arena boundary reads as built, not drawn).

## Fix set (PRE-REGISTERED)

- ST-581 (I621) - rocks v13 remaster, ONE atomic commit: (1) Blender 5.2.3 headless build (D:\Blender\blender.exe), 7 GLB one family (extend the I554 rock build pattern in .evidence/): silhouette break (lobe + facet pinch, deterministic per variant from the seeded rng), real craters (bowl dent + raised rim + ejecta streaks), bump ridges; flat shading; COLOR_0 same formula family as I554 (rock luma mottling; per-part percentile pins re-pinned WITH MEASUREMENT); tris targets post-GLB: L/L_B 12,000 / M/M_B 4,000 / S/S_B 1,600 / comet 2,400 (= 36,000 t total, +17,880); (2) GLB contract (single GLB / COLOR_0 / flat named node set / perFileMats <= 5 / no rig / no morph / BIN 4-align); (3) I609 encode pattern (double-encode determinism, ABORT on diff, orig/ backup + hash manifest); (4) glbtris fleet re-run + caps re-pinned WITH MEASUREMENT (per-variant tri pins + file caps measured+15% per rule 5 + fleet total pins); (5) playframe B re-pin WITH MEASUREMENT (frustum rocks grow; A = MENU draws no rocks, unchanged expected), causal EXPECTED EXACT, pwa EXPECTED 11/11 + NEW glbsmoke; (6) ONE atomic commit.
- ST-582 (I622) - Archon v2, ONE atomic commit: 3,108 -> 10,000-14,000 t post-GLB (target 12,000; hull 6,000-7,500 + crown 3,000-4,000 + core 1,500-2,000); layered recessed bays + weapon battery greebles, taller multi-ring crown, weak-point core cage with brighter COLOR_0; envelope windows re-pinned WITH MEASUREMENT where they change (campaign boss extent pins); playframe B-tris only expected (campaign-only -> EXACT UNCHANGED pre-registered), causal EXPECTED EXACT, pwa EXPECTED 11/11 + glbsmoke re-run.
- ST-583 (I623) - garnish v2 (11 GLB, ONE landing, one build session set): powerups 7 x ~200-300 t with distinct silhouettes (research list), shield 80 -> ~400 t, debris x2 48 -> ~250 t each, arena ring 60 -> ~800 t (worst case ~4,864 t total, +4,330); same protocol; frustum re-pins WITH MEASUREMENT only where the pin frames draw them (verify per landing; powerups may appear in the B window).
- ST-584 (I624) - G90.0 close gate: 6/6 harness (clone runner pattern, labels CLOSEGATE624) + GLB fleet smoke + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E90 WITH MEASUREMENT + AGENTS.md refresh (asset line + item-4 chain + one-liner) + E90 CLOSED.

## Budget (FROZEN post-encode ceilings)

- rocks v13 combined: <= 900,000 B (current 345,408; growth cap +554,592)
- boss_archon v2: <= 250,000 B (current 58,916; growth cap +191,084)
- garnish v2 combined (11): <= 300,000 B (current 50,668; growth cap +249,332)
- Worst-case total growth: +995,008 B -> dist 7,006,552 B (margin 291,048 B vs close target; >= 102,400 B floor)
- Worst-case fleet tris: 159,141 + 17,880 (rocks) + 8,892 (Archon at 12,000) + 4,330 (garnish) = ~190,243 t (pin grows WITH MEASUREMENT per landing)
- MAX_FILE_BYTES 1,658,000 B (ship-binding, 1,441,348 B) - no E90 asset approaches it.

## Cut ladder (FROZEN triggers)

- C1: rocks v13 combined 900,000 -> 700,000 B (L/L_B 12,000 -> 9,500; M 4,000 -> 3,200)
- C2: Archon v2 250,000 -> 180,000 B (12,000 -> 8,500 t)
- C3: garnish v2 300,000 -> 200,000 B (powerups 300 -> 220 t each)
- C4: garnish v2 scope cut to 8 assets (powerups x7 + shield; debris + ring stay v1)
Invoked only per the frozen trigger (a landing measures over its ceiling after the encode); never silent.

## Constraints / risks

1. Rocks are the most-drawn pool objects in endless - the per-instance cost grows (L 6,000 -> 12,000 t); the I554 frustum analysis bounds the playframe B delta to the in-frustum pool rocks only (3 L culled). GPU: user explicitly permits the growth ("use polygons and GPU resources as much as needed").
2. Comet v12 (1,120 t) includes the tail mass - the tail structure grows with the head; keep the comet extent window (frustum + camera follow) re-pinned WITH MEASUREMENT if it changes.
3. Archon envelope: the L5 campaign extent windows (ST-252 family) must be checked per node; re-pin WITH MEASUREMENT where they move.
4. Garnish powerups may be drawn in the playframe B window at reseed 71201 - verify per landing; re-pin WITH MEASUREMENT only where drawn.
5. COLOR_0: rocks stay in the I554 mottling formula family (per-part percentile pins re-pinned WITH MEASUREMENT); Archon crown/core keep the I553 domains; garnish is flat-tint per asset (1 material each, no mottling).
6. perFileMats <= 5 (all E90 assets: 1-3 materials).
7. Blender 5.2.3 headless determinism: double-encode byte-compare + audit screenshots; any export jitter ABORTs the landing (rebuild, do not ship).

## Verification evidence

At open (I620): I619 close gate 6/6 EXACT (CLOSEGATE619) + push 2e158dd landing verified via git ls-remote before open; the measured basis above is on disk. Per landing: protocol steps produce the evidence trail (.evidence/I6xx/ + harness outputs + dist measure). At close: the G90.0 gate set (6/6 harness + GLB fleet smoke + fresh dist + CLOSE FLOOR E90 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-581..ST-584 all DONE; E90 header CLOSED at the G90.0 gate.
- 34-GLB contract intact: glbtris per-asset pins EXACT + fleet total WITH MEASUREMENT; the house glbtris agrees.
- dist measured <= 7,297,600 B at the close gate; CLOSE FLOOR E90 WITH MEASUREMENT recorded.
- Vendor 4/4 EXACT + decoder raw pin intact.
- 6/6 harness + GLB fleet smoke at the close gate; causal arms EXACT (webgpu report-only).
- AGENTS.md asset line + item-4 chain + project one-liner refreshed WITH MEASUREMENT.
- ONE atomic commit per landing + the close-gate commit; every commit pushed (delegate) + verified via git ls-remote.
- Hygiene: 0 tabs, all ports free, no terminals left.

## Next owner

I621 = ST-581 rocks v13 D1 in Blender (the I554 rock build source is the starting point; research notes above are the design brief).

## AMENDMENT (I622) - ST-582 Archon v2 D2

- Trigger: first encode of Archon v2 (11,076 t post-GLB) = 252,332 B, 2,332 B (0.9%) OVER the frozen 250,000 B D2 ceiling.
- Root cause: measured compressibility 22.8 B/t vs the plan's 20.8 B/t - box-greeble geometry (band studs, exhaust boxes) compresses worst (low vertex reuse); the plan's ratio assumed mostly nprism/torus/gplate mass.
- C2 (250,000 -> 180,000 B, 12,000 -> 8,500 t) analyzed and NOT invoked: at the measured 22.8 B/t, 180,000 B requires ~7,900 t = a 41% model gut, against the standing user detail directive; the 0.9% overrun did not warrant the fallback's scope.
- Action taken (proportional): 336 t trim of the worst-compressing, base/occluded, low-visual-value elements (24 band studs = 288 t + 4 rear-exhaust boxes = 48 t); build-script hull floor 6000 -> 5600 (AMENDMENT comment in build_archon_v2.py); gameplay-angle (f34) re-view confirmed the studs are invisible in play.
- Outcome: 10,740 t post-GLB (hull 5,688 / crown 3,184 / core 1,868) -> encoded 241,800 B; the 250,000 B D2 ceiling is HELD (margin 8,200 B, 96.7%). C2 is hereby AMENDED: the trim path above supersedes the 180,000 B fallback for D2; C1/C3/C4 unchanged. The remaining E90 landings (D3 garnish, D4 close gate) proceed on the original pre-registrations.
- Evidence: .evidence/I622/ (build_archon_v2.py + audit_glb622.cjs CONTRACT_PASS + probe622.cjs + encode622.cjs ENC622_DONE + patch_trim2622.cjs + 12-angle view audit + orig/ backup byte-verified).