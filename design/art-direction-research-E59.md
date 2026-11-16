# Art Direction Research - Void Runner (E59, I459)

SUPERSEDES: design/art-design-research.md (E9-era) and the I101 art-bible.md
world view. Both predate the FX pipeline (bloom/grade), the Blender GLB fleet,
the E57 enemy language + camera work, and the E58 campaign stage themes. This
doc is the current source for art decisions; the old docs stay as history.

Authored under cgs-art-bible (research pass) + cgs-scope-check (E59) for
ST-428. Grounding: YouTube research (mcp__youtube, 2 passes, 70 results),
web research (2 passes), and a live-tree re-measurement (this iteration).
Research items below are labeled; tree items are verified in this tree.

## 1. Measured current state (tree-verified, I459)

World / sky:
- Starfield: 2 shell Points (near 280 / far 520), per-star twinkle, skybox-knot
  correlation (I366), parallax 0.25/0.60; single glow sprite per star.
- Skybox: Blender-baked equirect (v6) + per-stage theme dome that re-tints
  sky + stars + grid + floor (ST-420, campaign stage themes: teal Debris
  Field / ember Core Gate; stage 1 = identity).
- Arena: floor disc + ring + rocks (Blender v11 denser relief, I456).

Fleet / actors:
- Ship v4 airship GLB + layered additive engine flame (ST-256: white-hot core
  + orange mid, flameScales(); ST-237 nozzle) + shield ring. No motion trail
  behind the ship in flight.
- Enemies: 7+ roles with emissive telegraphs (hunter threat-red core dash,
  gunship bay charge, warden armor pulse + white damage flash, stinger
  cyan->white lock, splicer/monolith rim + core). E57 enemy-visual-language.md
  fixes silhouette + palette + luma ladder. Asteroids carry a fresnel rim
  (I257); enemy meshes have NO rim/outline pass today.

Projectiles (Cave-style inverted colors - mostly already true):
- Player bullets: level 1 cyan 0x7fe4ff, level 2 green 0x8affc0, level 3
  amber 0xffd27a (config fx.palette.bulletLevel).
- Enemy bolts: dark base 0x5a1410 + threat-red emissive 0xff4a2a (always the
  danger family).
- FINDING: player level-3 amber sits in the warm family, ~40 deg in hue from
  threat red. The cool-vs-warm separation that makes bullets readable at a
  glance degrades exactly at the player's best weapon.

Presentation / UI:
- waveBanner: wave / cleared / boss (per-variant tint + glow) / stage (gold)
  banners + intermission countdown (ST-028/I154/ST-420).
- Powerups: 7 types, distinct silhouette + color + colorblind glyph badge
  (I70/I064), emissiveIntensity 0.9. FINDING: bomb pickup is red 0xff5252 -
  inside the threat-red family (harmless use of the danger color; mitigated by
  box silhouette + "B" glyph).
- FX identity: bloom 0.6/0.35/0.72 frozen (E57), I334 grade pass frozen.

Budgets (frozen context):
- dist 2,873,338 B / 147 files, ceiling 3,000,000 (headroom 126,662; floor
  keeps >= 102,400). GLB tris 28,779 / cap 30,000. 26 GLBs / 1,016.33 KB.

## 2. Research sources (labeled research; not tree-verified)

YouTube (2 passes, 2026-11):
- Star Fox 64 + 2026 remake (IGN hands-on BRovRF77Bj8; "Transparency Boo"
  analysis tesYsJzew6I): crisp clean art that survives high speed; per-stage
  visual identity; silhouettes readable at boost speed.
- Space-shooter design feedback (1 Bit Studio, 3mxB9Ci3gEs): INVERTED bullet
  colors (player vs enemy distinguishable at any moment); camera should let
  the player focus on the fight, not own ship motion.
- three.js Unreal-style bloom (Wael Yasmina, ZtK70Tb9uqg): tone-mapping +
  exposure drive the glow look. Emissive maps (javaweaver, 6q1jP6Y6srU):
  emissive is the backbone of glow - color that always shows.
- 60-30-10 color rule (Breadfruit, 7d-54gTAgkc): dominant/secondary/highlight
  hierarchy. Art-direction techniques (Jason Murray, O_B_Ei5o1k4): big idea,
  palette, shape language, lighting; "visual feeling vs solution".

Web (2 passes):
- threejs-game-studio (github chrislaupama/threejs-game-studio)
  technical-art.md: material kit of NAMED SHARED ROLES (bodyPrimary/
  bodySecondary/trim/hazard/reward/shieldBoost/glass/emissiveSignal/
  groundContact/decal); VFX readability checklist (trigger event? what does
  it tell? duration? pooled? obscures collision/HUD? reduced-motion
  fallback?); event-driven VFX over permanent clutter; budgets: desktop
  <= 2 transient point lights (0 shadow-casting), <= 2,000 CPU transparent
  particles, <= 16 emitters, <= 1 brief full-screen transparent layer.
  vfx.md: hit sparks (life ~0.18s, additive, pooled), trails (ring buffer,
  clear on death), muzzle flashes (<200ms emissive sprite).
- Shader-stable hit feedback (supagamesai threejs-lighting-shadows):
  pre-created transparent overlay (MeshBasicMaterial, unlit), animate
  opacity only - never add/remove lights per hit (avoids shader
  recompilation at contact).
- Starfield patterns (ef-map.com; shanebrumback.com): single Points draw
  call; 3 layers from same geometry (core / glow clone renderOrder 1 /
  flare clone with per-star rotation renderOrder 2); distance falloff does
  more work than color; per-star aSize/aPhase + onBeforeCompile twinkle;
  nebula = 3 BackSide icosahedron shells (near/mid/far) for parallax,
  depthWrite false.
- Perf (spet01.dev): GPU vertex-shader particles (uTime uniform, mod()
  wrap, zero CPU); ring-buffer particle pools (pre-allocated, zero GC);
  InstancedMesh merging for asteroid fields.
- Readability (aigamedev.ai; gamedeveloper.com "reduce visual confusion";
  "Anatomy of a Shmup"; h-idris.com game-UI-colour; Xbox a11y; roguebasin):
  silhouette-first (solid-black test per enemy type); value contrast >= 3:1
  vs local background (WCAG floor; grayscale-screenshot audit); saturation
  focus (mute scenery, save strong color for player/threat/reward); light
  rim beats dark outline on dark backgrounds (TF2); ONE danger color
  (red-orange only for threats, zero harmless uses, paired with shape);
  enemy bullets always visible + high contrast; UI palette built from ROLES
  (8-12 values total, one defended accent, dark ground plates behind text);
  stress-test readability at the BUSIEST combat moment.

## 3. Findings mapped to Void Runner

1. Danger-color discipline is 90% in place, not 100%. Enemy bolts are the
   threat family; player L1/L2 are cool. The L3 amber 0xffd27a and the bomb
   pickup red 0xff5252 are harmless warm/red uses that erode the "red =
   threat" contract at exactly the moments it matters most (max weapon in a
   dense fight; a bomb pickup near an enemy bolt).
2. Enemy meshes lack the rim/outline that the rocks already have (I257).
   Research is explicit: on dark space, a light rim beats a dark outline.
   The E57 luma ladder (enemy sRGB luma ~110-135 vs near-black arena) is the
   right direction; a subtle fresnel rim would push silhouette readability
   without new materials per enemy (one shared shader injection).
3. Glow backbone already exists (bloom 0.6/0.35/0.72 + emissive telegraphs +
   additive particles). Research says exposure/tone-mapping do the work -
   but the I334 grade + bloom constants are FROZEN (E57). So glow work here
   is ADDITIVE (new emissive elements, overlay flashes), never re-tuning.
4. Event-driven VFX > permanent clutter: Void Runner already does event FX
   (hit sparks, shockwave, vortex, warps). The remaining gap is cheap
   shader-stable feedback (pre-created overlay flashes) where a per-hit
   light would be needed otherwise.
5. Starfield is already a 2-shell parallax with twinkle + knot clumps +
   stage re-tint. The 3-layer (core/glow/flare) pattern would add flare
   clones for the brightest stars - cosmetic only, and the flare renderOrder
   pass costs one extra draw per shell.
6. Readability stress test is the acceptance frame: audit at the busiest
   combat moment (boss ring + barrage), not the calm menu.
7. Material-kit roles: Void Runner's palette already maps to roles
   (threat red / reward golds / shield cyan / engine warm / hull steel),
   scattered across config + per-mesh modules. A role-named palette section
   in config (docs-level refactor, values unchanged) makes future art work
   safer. P2.

## 4. Explicitly NOT changing (frozen identity)
- Bloom 0.6 / 0.35 / 0.72; I334 grade pass; vendor three r160 pin
  (76DEA8151BC9352A); WebGL2 (WebGPU re-check kept in E58, F1-F3 unmet);
  core logic (causal pin must stay EXACT); arena radius / radii; enemy
  luma ladder (E57). Any change to a frozen constant is a scope violation
  (scope-check-E59 R5).

## 5. Unknowns
- Measured worst-frame cost of a shared fresnel-rim injection across all
  7 enemy mesh modules (needs the I460 perf probe at the busiest moment).
- Whether the amber L3 shift should be a hue move or a shape cue (bigger
  bullet head) - decide in I460 from a busy-moment screenshot A/B.
- Starflare visibility against the knot-clump density (may be invisible at
  far shell - defer).

## 6. Changed files (I459)
- design/art-direction-research-E59.md (NEW - this file)
- design/art-task-list.md (NEW)

## 7. Verification evidence
Docs-only iteration: npm test 1027/1027 + npm run build 0 + dist
byte-identical + vendor PIN_OK + hygiene (no servers, no chrome).

## 8. Next owner
I460 = ST-429: execute the P0 picks from design/art-task-list.md
(causal-EXACT gate; frozen constants untouched).