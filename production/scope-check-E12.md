# Scope Check - E12: Quality Settings Consistency & Skybox Art Pass (I227)

## Summary
E11 closed at I226 (G11.0 PASS). E12 picks up the 3 I225 scope-vs-code flags (the known gaps
between the E11 quality scope and the shipped code: FX high/low/off vs high/low only; DPR
1.5 under load vs a static min(dpr,2) cap; tier-visible settings vs the panel showing the
stored choice while rendering the effective tier) plus the last carried art item - the
512x256 skybox (E10 scope-check deferral) - per the user's standing art/Blender directive.
4 stories + gate G12.0 over 4 iterations (I228..I231): ST-224 FX off tier, ST-225
load-reactive DPR 1.5 + effective-tier settings sync, ST-226 skybox art pass (Blender-
generated equirect, budget-staged), ST-227 regression + gate. No core sim changes (the
demo pin is structurally untouched), no new dependencies, everything bot-verifiable.

## YouTube grounding (I227, 2 rounds: 11 queries / ~104 unique; transcripts rate-limited -> metadata + chapters; Coverage note at the end)
1. Pitchfork Academy, "How To Create A Realistic Space/Galaxy Skybox - UE5 Material Tutorial"
   (19K views, 2025-05; youtu.be/b_4qCSRkq3Y). Recipe = layered noise -> color-ramp gas
   layers with full color control + optional galaxy band + planet, plus a dedicated space-
   lighting section. Takeaway for ST-226 (engine-agnostic): 2-3 layered FBM gas bands in
   the existing palette language (keep the 0x04060f base; cyan + magenta accents; a faint
   gold accent from the weapon palette), thin dust lanes, a subtle off-axis galactic band,
   clustered stars with a few hero stars; NO planets or bright focal objects.
2. CG Cookie, "Stop Downloading HDRIs - Learn to Create Your Own Skyboxes in Blender"
   (11K views, 2026-04) + Game Dev Guide, "5 Skybox Methods" (51K views): procedural
   Blender node skyboxes and equirectangular textures are the standard low-cost background
   pipeline. The I212 pipeline (Blender equirect -> TextureLoader -> PMREM IBL, I213)
   stays; only the texture content/size changes.
3. Valentin's coding book, "Three.js Optimization - Best Practices" (75K views; chapters
   draw calls 3:05 -> materials -> textures -> shadows -> post processing 11:44): the
   canonical order ends at post processing as the heaviest item. Grounds the ST-224/225
   ordering: an FX-off tier and a DPR 1.5 under load attack exactly the two biggest
   post/fill costs; the I225 matrix already measured bloom = 12-14 draw-call premium.
4. Planetoids Deluxe (modern 2025 asteroids-style remake, vector style; trailers +
   "Parallax 3D Effect" clip): parallax depth is the named polish feature of modern
   remakes. Ours already has the static far sky + the twinkling mid parallax starfield -
   the skybox stays the far layer (readability rule: background subordinate to the world).
5. Asteroids Recharged (Switch remake, 2022) review (chapters: storyline 1:00, graphics
   sound 3:56): commercial remakes add story/modes + presentation polish. Content arcs
   are OUT of E12 scope (pin-fixed arcade loop) - noted in Deferral; presentation polish
   (the skybox) is the in-scope analog.
6. Own design/art-direction-research.md readability rules re-applied: sky STRUCTURE
   (gas, dust, clustered stars) over brightness; the sky must never compete with world
   color/motion; one-time texture upload only (no per-frame cost).

## Scope Fit
- ST-224 (FX off tier): closes I225 flag 1. Small and precise: toggleFxQuality extended
  high->low->off->high (pure core + tests), settings panel select +3rd option (ST-067
  live-preview path), F hotkey 3-state cycle, off = zero FX-tier-gated render effects
  (burst particles 0, engine trail puffs 0; bloom is already high-only). Starfield
  twinkle + juice channels are feel/readability, not FX tier - intentionally untouched.
  The adaptive ladder is unchanged (auto high->low only; off is a user-only choice);
  userSet lock semantics preserved. No core sim change -> pin-safe.
- ST-225 (DPR + tier sync): closes I225 flags 2+3. Same subsystem (adaptiveQuality <->
  settings), one owner, one verification session: (a) pure helper dprForTier(tier, dpr)
  (high -> min(dpr,2), low -> min(dpr,1.5)) + main.js applies it on onTier / reset /
  userSet with a single labeled renderer resize; (b) on autoDowngrade the panel + pause
  F-row + screenOpts reflect the effective tier with an AUTO marker; the stored user
  choice is NOT overwritten (storage stays authoritative; the F path re-applies settings
  before userSet per I225 semantics). Bot-verifiable via Playwright deviceScaleFactor=2
  emulation (this session's display dpr 1.25 makes the live change a no-op - labeled).
- ST-226 (skybox art pass): closes the carried 512x256 skybox deferral + the user's
  Blender/art directive. Blender node-based equirect (recipe per grounding #1),
  budget-staged encode (2048x1024 -> 1024x512 -> 768x384; PNG -> WebP/JPEG; net delta
  <= 40 KB raw vs the current 41.2 KB asset; dist stays <=2048/<=550 - ~42 KB headroom).
  Documented fallback if no encode fits: runtime canvas FBM generator (zero asset cost,
  one-time MENU-time generation labeled). Render-layer only -> pin-safe.
- ST-227: regression + G12.0 + closeout (the E10/E11 pattern).
Total: 4 stories, 4 iterations (I228..I231) - the same shape as E10/E11. All bot-
verifiable headless; no hardware needed; no new dependencies; no core sim changes.

## Cut Option
If E12 must shrink: (1) ST-226 first, if no skybox encode fits the budget and the
canvas-FBM fallback reads insufficient (defer to E13; E12 closes at 3 stories);
(2) ST-225(b) tier-sync UX (the minor flag) cuts before ST-225(a) DPR; (3) ST-224 is
the cheapest story and lands first (I228), so any cut still closes one flag.

## Deferral
- 8 HUMAN-PENDING perception items (production/bug-triage.md) - need a human session.
- Low-end physical device / GPU remainder (HARDWARE-pending checklist, perf-profile.md).
- Combo cap balance (demo pin constraint).
- New content arc (story / modes / wave 8+ gated enemies) - needs an explicit demo-pin
  decision; E13+ candidate (grounding #5 shows where commercial remakes go next).
- Music quality polish (HUMAN-PENDING #5). KTX2 (no texture growth beyond the skybox).
  Touch input (later per AGENTS.md).

## Recommendation
APPROVE as scoped: ST-224..227 + gate G12.0, 4 iterations. Order: ST-224 (I228) ->
ST-225 (I229) -> ST-226 (I230) -> ST-227 (I231). ST-226's Blender work happens inside
the story (MCP), staged sizes, decision recorded with size evidence.

## Risks
- R-E12-1 (med) FX off tier leaks particles/trail at some render site -> grep-audit
  every fx-tier-gated read first; zero-counts driven from CONFIG (single source of
  truth); browser zero-leak check at off (scripted kills -> live 0 + trail 0 + bloom
  off); frame probe.
- R-E12-2 (low) mid-session DPR switch = one-time resize hitch -> single labeled
  resize; DPR follows the tier only (tier already has confirm windows + hysteresis, so
  no churn); frame probe after the switch.
- R-E12-3 (med) skybox encode blows the dist budget (~42 KB headroom) -> staged
  sizes/formats with recorded size evidence, then the documented canvas-FBM fallback;
  dist gate is a hard criterion; the asset size audit pins the final file.
- R-E12-4 (low) AUTO tier indicator reads as a settings bug (panel vs storage mismatch)
  -> explicit "(auto)" marker + the existing toast + tests pin that automation never
  overwrites the stored user choice.

## Changed files (I227, docs only)
- production/scope-check-E12.md (this file, new), production/epics.md (+E12 + risk
  register), production/stories.md (+E12 ST-224..227), production/timeline.md (+E12
  opened line), CHANGELOG.md (+I227), production/iterations.md (+I227),
  production/session-state/active.md. .evidence/I227/01-skybox-baseline-menu.png
  (baseline A/B reference, gitignored). No src changes.

## Verification evidence
- No src changes: npm test 689/689, node scripts/build.mjs exit 0, dist
  1958.4/507.8 KB unchanged (<=2048/<=550); log audit 1..227 sequential.
- Baseline skybox screenshot: .evidence/I227/01-skybox-baseline-menu.png (fresh load
  ?nocache=227a, MENU, skybox ready from assets/skybox_equirect.png, 41.2 KB).

## Coverage note
YouTube transcript fetches were rate-limited during I227 (one retry batch, then the
block extended - not retried further per the I207/I223 discipline). Grounding above
uses search metadata + chapter maps + descriptions from both rounds (11 queries / ~104
unique). The skybox recipe (grounding #1) is corroborated by two independent sources
(Pitchfork + CG Cookie/Game Dev Guide) and by the existing I212 pipeline; the three.js
optimization ordering (grounding #3) matches the shipped I225 measurement (bloom =
12-14 call premium).

## Next owner / decision
I228: ST-224 (FX off tier) via cgs-dev-story + cgs-standards-tests.
