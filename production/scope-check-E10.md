# Scope Check - E10 Post-E9 Polish Milestone (I219 / cgs-scope-check)

## Summary
E9 closed at I218 (G9.1 PASS): 11/11 stories, 15 Blender GLBs + skybox, post-processing polish
landed, 676/676 tests, dist 1940.6/501.9 KB. This check scopes the next milestone as a SMALL
polish pass (not a new content arc): finish the last procedural enemy (Warden) in Blender,
land the last unowned art-research lever (camera/feel), then a regression + gate. Recommendation:
APPROVE as "E10 - Post-E9 Polish" with 3 stories (ST-218..220) and gate G10.0. No new runtime
dependencies; Blender + existing GLB pipeline only; camera work is render-layer only (no core
determinism changes).

## Scope Fit
Baseline (evidence, verified at I218): 676/676 green, build 0, dist 1940.6/501.9 KB (<=2048/<=550,
~48.1 KB headroom), log 1..218 sequential, clean tree (blender/ untracked by policy).

What remains, grounded in current state:
1. Warden (mini-boss, ST-137) is the LAST purely procedural enemy model: jittered dodecahedron
   hull + procedural hex plate ring (src/render/wardenMesh.js). All 14 other enemy/pickup models
   are now Blender GLBs. Asymmetry visible in pause screenshots; low cost to fix, art direction
   (silhouette-first, flat-shaded low-poly, emissive accent) already established.
2. Art research lever 6 (camera/feel) is the ONLY unowned lever: 2-5% camera lead toward the
   aim point, boss-approach zoom-out of a few degrees, slow menu orbit drift; the player view
   must stay stable during normal play (dodge read). Levers 1-5 all landed/closed in E9.
3. E10 needs the standard closeout: regression round + soak + gate (G10.0) + docs.

## YouTube grounding (I219, youtube_search 2026-11-11, 6 queries / 41 results)
- GMTK "The Challenge of Cameras" (youtu.be/bHdi5Ar8GXw, 1.1M views): cameras serve the
  gameplay first - wide view for peripheral dodge vision, zoom for precision (0:03); dynamic
  cameras are state-driven (third-person aim zoom, 7:16); "no one-size-fits-all" (9:17).
  => lever 6 confirmed as SUBTLE + state-tied only; never move the camera during normal play.
- Genre comps (Disasteroids 3D youtu.be/VTTk8vtvhxo / iD5_5VaSR28, Solaroids MEsVMZXzn_Y /
  OlD6W6P2CIU): classic near-fixed arena views - no novel camera behavior is the genre norm.
  => keep the arena read fixed; only lead + boss zoom-out + menu drift (exactly lever 6).
- Warden model: no direct low-poly mini-boss tutorial hit in this pass (q4 off-target); the
  existing grounding (Curious Archive silhouette 9:29/11:33, Ansimuz contrast - art-direction-
  research.md) stands: silhouette-first, readable at gameplay scale, emissive accent, flat-shaded.
  Design: jagged armored sentinel hull + SEPARATE armor-plate mesh so the existing armor-state
  animation (retract + cyan->orange glow) carries over unchanged (2 draw calls, like the
  procedural original).

## Cut Option (if E10 must shrink)
Cut ST-219 (camera/feel) first - it is the only render-only lever with no test surface beyond
browser; ST-218 (Warden GLB) and ST-220 (regression + gate) stand alone. The game remains
shippable without any of E10 (E9 closed it).

## Deferral
- 8 HUMAN-PENDING perception items (2 ART/AUDIO) - need a human playtest session; parked, non-blocking.
- Low-end physical device / GPU validation - needs hardware; adaptive quality (I73) mitigates.
- KTX2/BasisU texture compression - no textures exist yet (art research condition "if textures grow"); no basis.
- 512x256 skybox downscale option - deferred at I212, still not needed (skybox 2.0 MB GPU, no bottleneck per I214).
- Any NEW content (mechanics/enemies) - explicitly out of E10; E10 is polish, keeping the slice small.

## Recommendation
APPROVE E10 as 3 stories:
- ST-218 | Blender Warden model: armored sentinel (jagged hull + separate retractable armor-plate
  mesh) replaces the procedural dodecahedron; silhouette-first, flat-shaded, emissive core accent;
  2 draw calls; budgets <=200 tris total, <=40 KB, <=3 materials, VR_ names; armor-state animation
  (retract + cyan->orange glow) unchanged; procedural fallback preserved | browser + node (asset audit)
- ST-219 | Camera/feel (art research lever 6): 2-5% camera lead toward the aim point (eased, capped),
  boss-approach zoom-out of a few degrees (eased in/out), slow menu orbit drift; view FIXED during
  normal play (dodge-read rule); motion-gated + FX-tier aware; frame-time delta ~0 expected | browser
- ST-220 | E10 regression round + 600 s soak (if warranted) + G10.0 gate + closeout docs | node + browser

## Risks
- R-E10-1 (low) Warden GLB breaks the armor-state visual (the core readability state) -> keep the
  armor mesh as a separate node the existing wardenMesh.js animation drives; screenshot-compare
  armored/spent states in smoke.
- R-E10-2 (low) camera lead hurts dodge read (HUMAN-PENDING items are about perception) -> cap at
  2-5%, ease both ways, A/B screenshot + scripted-pilot survival parity check (no core change, so
  determinism is structurally untouched).
- R-E10-3 (low) dist creep: +1 GLB (~40 KB max) against ~48.1 KB gzip headroom -> same per-file
  budget pattern as E9 (assetPerf.test.js extended to 16 assets).

## Verification
- Baseline re-verified at I218 (fresh 676/676 + build 0 + dist + log audit); this check is docs-only.
