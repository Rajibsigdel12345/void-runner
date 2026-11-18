# Enemy Visual Language - Void Runner

ST-417 (I447) / E57. Authored under cgs-design-system (rules/data/edge cases/acceptance),
grounded in a reverse-document audit of the existing fleet. Consumed by ST-418 (I448:
procedural core + fallback meshes) and ST-421 (I451: Blender GLBs).

## Summary
Two new enemy roles join the fleet: HUNTER (wave 6+, rear-approach stalker - paired with
the I445/I446 camera work so the rear threat read works) and GUNSHIP (wave 8+, slow heavy
bomber with lobbed heavy shots + chaff popups on death). This document fixes the visual
language - silhouette, color ladder, material budget, accent-glow semantics, GLB contract -
so ST-418/ST-421 build to one spec without a second design pass.

## 1. Fleet visual audit (evidence)

| Role | First wave | Body palette (CONFIG) | sRGB luma | Silhouette | Materials | Identity cue |
|------|-----------|----------------------|-----------|------------|-----------|--------------|
| Mine | 5 | renderer-side (no palette field in CONFIG) | - | drifting spiky mine, slow turn | 1 (mineMesh.js) | slow pursuit; fires only inside fireRange 7.0 |
| Drone (seeker) | 8 | 0x6f8796 steel-cyan | ~131 | small seeker, banking | 1 (droneMesh.js) | fast homing; decays (self-destruct) |
| Stinger | 7 | 0x54688a steel-blue (I511/ST-477) | 102.2 (rendered p50 ~110 sky, I511; was 0x917fb9 violet 135.0 - I383) | slender dart | 2 (stingerMesh.js) | cyan->white lock telegraph, straight-line dash |
| Flyer | 9 | 0x7d6878 mauve mid | ~110 (rendered p50 ~95 sky, I511/ST-477) | broad-winged, magenta dome | 2 (flyerMesh.js) | sine-weave crosser; never attacks |
| Vortex | 8 | (FX, non-corporeal) | - | pulsing pull field | n/a | telegraph ring; pulls rocks + ship |
| Warden | 5th waves w/o live Monolith | renderer-side (wardenMesh.js) | - | armored drone mini-boss, r 1.7 | - | armor ping before HP loss |
| Monolith | 5, 15, ... | hull 0x6b5f88, emissive 0x7a4dff | - | obelisk, r 3.4 | 3 (hull/crown/core, bossMesh.js) | purple rim 0x9a5bff; ring bursts + split |
| Splicer | 10, ... | renderer-side | - | orbiting sun, r 2.6 | - | teal rim 0x2dd4bf; two-arm spiral + aimed bolt |

Color semantics already in use (config.js comments + bossMesh.js + I252/I381/I383 audits):
- Threat red 0xff4a2a family = enemy bullets / telegraphed imminent damage (fx.enemyBullet.emissive).
- Warm amber 0xffb347 family = player ship identity (body/plume; FROZEN).
- Cool cyan 0x59d8ff = player cockpit + shield pickup (FROZEN identity).
- Purple = Monolith identity (0x9a5bff rim / 0x7a4dff emissive); teal = Splicer identity (0x2dd4bf).
- Fleet body luma ladder (top to bottom, rendered p50 sky re-audit I511/ST-477): drone ~180 > wasp ~175 > sentry ~140 > warden ~120 > hunter ~118 > stinger ~110 > flyer ~95 > boss ~68 ~= gunship ~65.
- Gold family (0xfff0a0 / 0xffe070 / 0xffc94d) = golden rock pickup (treasure language, ST-249).

## 2. System rules
1. One hue per role. Two fleet roles must not collide: luma within 10 AND hue within 40 deg is a collision - clearance on EITHER axis suffices (rendered-luma re-audit required, I381/I383 method). [I451 audit: this line originally read "OR", which contradicted the section 3.1/3.2 pre-approvals below; corrected to the doc's intent. Exact hues from the CONFIG palettes: stinger 258.6 / drone 203.1 / flyer 314.3 / hunter 14.0 / gunship 214.3 - all 7 fleet pairs clear the AND rule; hunter/flyer is the documented approved near-band pair (luma delta 7, hue 59.7 deg).]
2. Bold silhouettes: each role identifiable from outline alone at 96 px rendered size (~30 u chase-camera distance). The BACK view must read as well as the front (HUNTER requirement - it attacks from behind).
3. Material budget <= 3 per enemy (hull / secondary-dark / emissive-accent). Fleet maximum today is 2 (stinger/flyer).
4. Accent glow encodes function, not decoration:
   - Telegraph (attack imminent) = threat red 0xff4a2a family (shared semantics with enemy bullets: "red pulse = you are about to be hit").
   - Payload (weapon/ordnance state) = warm orange 0xff9a3d family (plume payload language).
   - Energy/identity = role hue, emissiveIntensity <= 1.0 (sub-bloom; boss-rim pattern, I252 audit).
5. Overview-mode readability (camera at 56 u, I446): accent glow must survive - emissiveIntensity >= 0.9 and accent surface area >= ~4% of the silhouette.
6. Cockpit mode (ship hidden, I446): enemies must read against the empty arena - silhouette + glow carry the read; no ship as contrast reference.
7. Reduced motion: no blink-only cues. A telegraph must also change pose/shape (e.g. fins deploy) so a frozen frame is legible.
8. GLB contract (ST-421): single root node; Y-up; no rig; no UVs required (vertex colors, if present, baked NEUTRAL white - fleet convention is that the GLB COLOR_0 bake multiplies over the material color, so a colored bake would corrupt the runtime palette); 1,200-2,000 tris (cap 2,400); <= 3 materials with VR_ naming; ~20-60 KB (perFileKB 400 budget).
9. Scale classes: HUNTER radius 0.8 (stinger class); GUNSHIP radius 1.6 (warden class; strictly below the Monolith 3.4).
10. Procedural fallback is mandatory: if a GLB fails to load, the ST-418 procedural mesh renders (assetLoader policy - no boot gate, console warn only).

## 3. Role designs (proposed; ST-418 finalizes in CONFIG)

### 3.1 HUNTER (wave 6+)
- Behavior pairing: orbits to a REAR bearing, telegraphs, then dash-attacks from behind (ST-418 core spec). The silhouette must say "I am behind you" even when the player is not looking back - the I445/I446 camera work makes the rear visible, so the ship must be legible there.
- Silhouette: flat swept manta/dart - wide horizontal span, low height, two rear fins that DEPLOY (open) during the telegraph and CLOSE during the dash. Back view: deployed fins form a W - the rear signature.
- Palette (proposed): body 0x9c5a46 (rust; sRGB luma ~102 - below the flyer band ~110 with ~65 deg hue separation, clears rule 1; well clear of the violet drone/stinger/monolith band); secondary dark 0x4a2a22 (fin undersides); accent telegraph 0xff4a2a family (threat red, shared semantics, rule 4).
- Materials: 3 (hull / fin-dark / core-glow).
- Geometry: 1,200-2,000 tris; radius 0.8; visual tumble ~0.3 rad/s (sub-warden - it is fast, not bulky).
- Overview read: red core glow >= 0.9 intensity while locked (rule 5).

### 3.2 GUNSHIP (wave 8+)
- Behavior pairing: slow, high-HP bomber; lobbed heavy shots; chaff popups on death (ST-418 core spec).
- Silhouette: bulky wide hull, two exposed engine nacelles flanking a central spine, an open forward weapons bay - a "brute" outline; the largest non-boss read in the fleet.
- Palette (proposed): body 0x344250 (slate, I511/ST-477: sRGB luma 64.0, hue 210.0 sat 35% - definite hue, below every fleet band); nacelle dark 0x232a33; payload-bay glow 0xff9a3d family (payload semantics, brightens while a shot is armed, rule 4).
- Materials: 3 (hull / nacelle / bay-glow).
- Geometry: 1,200-2,000 tris; radius 1.6; slow tumble ~0.4 rad/s (warden-class read).
- Death: existing explosion FX + chaff popups (ST-418 core spec) - no new visual language.

## 4. Balance levers (visual side only)
- Telegraph duration + glow ramp (ST-418 CONFIG): the readability knob; must clear the reaction-time floor (acceptance test 4).
- Accent emissiveIntensity band 0.9-1.0 (sub-bloom; never enter the bloom band - I252 audit precedent).
- Nacelle/bay glow size (GUNSHIP payload tell): keep <= ~4% of the silhouette.
Balance numbers (HP, speed, fire rate, damage) belong to ST-418 CONFIG additions - out of scope for this document.

## 5. Edge cases
- GLB bake x material multiply: a colored COLOR_0 bake corrupts the runtime palette (rule 8 neutral-bake contract; I383 GLB-multiply precedent).
- Bloom band: accents <= 1.0 intensity; verify with the I252 bloom-band audit method.
- Low-DPR tier: accents must survive at the minimum DPR (>= 1 screen px) - probe at min DPR.
- Replay mode (ST-190): watched runs render the same enemies; palettes are CONFIG constants - no per-run variation.
- i18n: kill-feed/banner names for HUNTER/GUNSHIP need en/zh/ja strings (ST-418/420 scope, strings.js pattern).

## 6. Acceptance tests (gates for ST-418 / ST-421)
1. Ladder audit: rendered p50 sRGB luma of both roles measured in-game (I381/I383 method); no band collision per rule 1.
2. Silhouette test: headless 96 px render, role identified from outline alone, FRONT and BACK (screenshot review).
3. Overview read: overview-mode screenshot at 56 u - telegraph glow visible (screenshot review).
4. Telegraph reaction floor: telegraph duration >= the floor ST-418 pins in CONFIG (deterministic-seed unit test).
5. GLB contract (ST-421): tris <= 2,400; materials <= 3; VR_ naming; single root; Y-up; neutral COLOR_0; exactly-24-GLBs -> 26 re-pin; assetPerf totalTris 20,000 -> 26,000 re-pin (both pre-registered in scope-check-E57.md).
6. A/B gate (ST-421): clay + in-game tint, old procedural vs new GLB - roll back to procedural if not clearly better.
7. Fallback: remove a GLB -> procedural mesh renders, no crash, console clean.
- I451 audit note (rendered luma): the frozen ACES / exposure 1.15 / grade pipeline renders raw palette hexes at ~0.45x (hunter) / ~0.31x (gunship) of sRGB, so the body palettes reach their ladder bands at render time via CONFIG.hunter/gunship.renderLumaGain (3.0 / 4.1, hue-preserving gain on hull color only) - measured in-game p50 sRGB luma: hunter 103.0 (band 85-120) / gunship 65.1 (band 45-85). The palette hexes remain the design values, unchanged.

## 7. Risks
- Violet crowding: stinger + Monolith already own purple - HUNTER rust must stay out of the band (rule 1 gate).
- Bake-vs-runtime luma drift - neutral COLOR_0 contract (rule 8) + acceptance 1.
- Tri re-pin 26,000 cap: both roles at the cap would leave zero headroom for future roles - hold the ~1,600 sweet spot.
- Research grounding is UNVERIFIED-BY-PLAY (below).

## Research (UNVERIFIED-BY-PLAY)
- I444 (scope-check-E57.md): ontcnH1b_vI (Star Fox 64 retrospective), qV3UQ69mHQM (EVERSPACE genre visuals), 27RBOb2MQho / UWHp6GNt9gI (low-poly enemy Blender language), QoNukqpolS8 (wave-gated types).
- I447 supplementary search (2026-11-16): 7QiewPqkG80 (Grant Abbitt, low-poly workflow - base mesh -> detail -> decimate -> palette staging; consistent with the tri-budget approach above). The supplementary pass added no new rules beyond the fleet audit.

## Changed files
- design/enemy-visual-language.md (this document, new)

## Verification evidence
- Docs-only iteration: npm test 985/985; npm run build 0 errors; dist byte-identical (2,411,901 B / 139 files); vendor three r160 sha256-16 76DEA8151BC9352A; ports 5173/4173/5199 free + chrome 0. (Recorded in production/iterations.md I447 entry.)

## Next owner
ST-418 (I448) - HUNTER + GUNSHIP core (src/core/hunter.js, src/core/gunship.js) consumes sections 2-3; the procedural fallback meshes in src/render/ follow the section 3 silhouettes.