# E46 Scope Check - Power-up (Pickup) Emblem Value & Silhouette Coherence Pass

## Summary
Bounded, evidence-backed Blender pass on the seven in-game power-up (pickup) emblem GLBs
(assets/powerup_{rapid,spread,shield,bomb,magnet,overdrive,slowmo}.glb, I211). The I393 own-side
watch-item audit (cgs-asset-audit) documented the ONE remaining own-side minor: the overdrive
emblem is the weakest at fx-off (acc90 36.70 floor, ~+4.5 over bg p90) - unmistakable by hue
(R&B >> G) but dim on value against the current post-E42 frame. The emblems were baked in the
I211 era against an OLDER frame; E40 (sky v6), E41 (rocks v8) and E42 (floor v2) since re-armed
the background, so the emblem facet-value (COLOR_0) ladder needs a coherence re-pass. Scope: an
in-place Blender re-bake (primarily the overdrive value lift + a light ladder-coherence pass on
the other 6) that changes ONLY the COLOR_0 facet value bake - same silhouette, same topology /
tri count, same in-code material hue (authoritative, GLB materials unused), +0 draw calls, +0
tri. Flat-shaded / faceted per art-bible (NO normal maps). Cut-to-no-change fallback if the value
bake cannot lift overdrive acc90 into the target band without disturbing the puab hue pins.

## Scope Fit
- Surface is fully in-repo: 7 existing GLBs + the I211 setGLB swap path (powerupMesh.js) +
  assetLoader keys (puRapid..puSlowmo). No new subsystem, no new load path.
- Bounded to a per-vertex COLOR_0 value re-bake (the exact E41/E42 in-place re-bake pattern).
- Does NOT touch sim, does NOT touch geometry topology (same vertex count / tri), does NOT touch
  the in-code material hue (puab 7-hue pins preserved by construction - hue comes from
  powerupMesh.js, not the GLB). +0 draw calls (fixed pool of 4, per-type geometry swap).
- Pickups are sparse on screen (pool max 4) and are NOT present in the pinned MENU frame (21/366)
  or the standard PLAYING playframe pin (50/1222), so those frozen pins are unaffected by an
  in-place value re-bake; verified in the gate.
- Matches the user standing order: use Blender for asset work + improve the art element, bounded,
  grounded, anti-over-engineer.

## Cut Option
- Primary target is the overdrive value lift; if a clean in-band lift is not achievable (i.e.
  lifting overdrive acc90 would push it into the rock ember band 54.26-112.43 or collide with
  another emblem acc90), CUT to no-change and close E46 at the direction story (docs-only),
  documenting overdrive as an accepted-minor (already hue-unmistakable per I393).
- The ladder-coherence pass on the other 6 emblems is CUTTABLE: re-bake an emblem only if the
  ST-360 audit shows it out of the value ladder (not for polish sake).

## Deferral
- 3D silhouette (shape) re-author of any emblem: DEFERRED. The I211 emblems are already
  silhouette-matched to their procedural fallbacks and hue/letter-badge distinct (I70 colorblind
  glyphs). A full geometry re-author would disturb tri counts + the draw-call budget and is not
  indicated by any proven gap (the I393 gap is a VALUE gap, not a shape gap).
- Animated / emissive-pulse emblem FX: DEFERRED (FX-tier cost; the emblems already pulse via the
  scale pulse in powerupMesh.js).
- Pickup spawn-placement / magnet-feel tuning: OUT OF SCOPE (sim, not art).
## Grounding
- I393 own-side watch-item audit (cgs-asset-audit; docs-based on the I391 verbatim re-run,
  .evidence/I391/ownside_audit_i387.json): the overdrive emblem is the ONE remaining own-side
  minor - acc90 36.70 (floor, fx-off), ~+4.5 over the floor bg p90, hue-unmistakable magenta
  (R&B >> G) but dim on VALUE. The other 6 read strong or dim-but-hue-distinct. No new probe is
  needed to OPEN E46 - the scope is grounded in this existing evidence.
- design/art-bible.md: flat-shaded, faceted low-poly; "no photographic or painterly detail."
  NO normal maps. This is the constraint that rules out a normal-map pass (the real reason
  normal maps have been deferred since E41 - the aesthetic, not GPU cost). The lever is a
  per-vertex COLOR_0 facet-VALUE re-bake.
- The 7 pickup emblems are ALREADY Blender GLBs (I211) wired through the existing setGLB swap
  path (src/render/powerupMesh.js) + assetLoader keys puRapid..puSlowmo. The in-code per-type
  materials are authoritative (GLB materials are unused; hue comes from powerupMesh.js TYPES +
  config powerup.pickup) -> the puab 7-hue pins are preserved by construction.
- E40 (sky v6), E41 (rock cratered v8) and E42 (floor v2) re-armed the background AFTER the
  I211-era emblem bake, so the emblem COLOR_0 facet-value ladder needs a coherence re-pass
  against the current frame.
- Env value bands for the target (frozen): sky p50 70.14 / floor p50 32.2 / rock ember band
  54.26-112.43 (bright-ember pin 112.43).
- Bounded YouTube grounding (readable pickup/item VALUE + silhouette distinctness in
  space-arcade / roguelite) is DEFERRED to the ST-361 direction story (consistent with the E40 /
  E43 pattern): max 1 search, 2-3 queries, <=3 new burned ids. The OPEN is scoped from the I393
  audit + art-bible evidence only.

## Constraints (FROZEN through E46)
- +0 draw calls (fixed pool of 4; per-type geometry swap) and +0 tri (value-only re-bake, no
  subdivision); 0 B asset delta target (emblem family 37,912 B, cap <= 45,912 B).
- Pickups are sparse (pool max 4) and are NOT present in the pinned MENU frame (21/366) or the
  standard PLAYING playframe pin (50/1222) -> those frozen pins are unaffected by an in-place
  value re-bake; re-verified in the gate.
- In-code material hue is authoritative (powerupMesh.js TYPES + config powerup.pickup); the puab
  7-hue pins (rapid 0xffc300 / spread 0xff9f43 / shield 0x53d8ff / bomb 0xff5252 / magnet
  0x69f0ae / overdrive 0xff4dd8 / slowmo 0x9fe8ff) are preserved; any re-pin is documented, never
  widened.
- Flat-shaded / faceted per the art-bible; NO normal maps.
- Blender value-only re-bake: same silhouette, same topology / tri, same filename; no material or
  hue change inside the GLB.
- Every other frozen pin holds (p1, rockab radii 2.2/1.3/0.7, 21/366 + 50/1222, FLOOR-50, skybox
  70.14, rocks 112.43/54.26/52.76, ring p90, enemy hierarchy drone 200.98 / stinger 254 / flyer
  197.74 / warden exposed 147.01 / mine 127.0 / boss 182.49, cockpit cyan 0x59d8ff @1.4, player
  bullet 219.99 / enemy 152.18, vendor sha 76DEA8151BC9352A, dist 131 files / 1,918,997 B, 929
  tests green).
## Plan (stories in production/stories.md, epic in production/epics.md)
- ST-360 (I395) pickup emblem BEFORE audit (cgs-asset-audit): headless per-emblem probe (7
  emblems, both backdrops sky/floor, fx-off + fx-high) - per-emblem acc90/p50 + hue + silhouette
  MD5 vs the I393 numbers; confirm overdrive is the only material VALUE gap; establish the
  COLOR_0 facet-value ladder target. DOCS + probe-only, zero src, CUTTABLE. Cut gate #1.
- ST-361 (I396) grounded direction (cgs-dev-story): per-emblem KEEP / ADD / AVOID + explicit
  COLOR_0 facet-value targets vs the env bands (sky 70.14 / floor 32.2 / ember 54.26-112.43) +
  puab hue pins; the bounded YouTube grounding lives here. DOCS-only. Cut gate #2.
- ST-362 (I397) Blender in-place COLOR_0 value re-bake (cgs-dev-story + blender-core/modeling/
  export/asset-qa): re-bake powerup_overdrive.glb (primary) + only the emblems ST-360 flags out
  of the ladder; same filename, same topology / tri (value-only), no silhouette / material
  change; emblem family cap <= 45,912 B; blender-asset-qa numeric + random/wire sheets.
  ASSETS-ONLY.
- ST-363 (I398) apply + A/B + re-pin guardrail (cgs-dev-story): in-place GLB swap (loader +
  setGLB unchanged, zero sim); verify overdrive acc90 lifted into the target band at fx-off, the
  other 6 stable / within noise, puab 7-hue pins held (re-pins documented), P4 holds, draw calls
  21/366 + 50/1222 unchanged, no NaN, console 0/0, closeups VIEWED.
- ST-364 (I399) G46.0 gate R1-R5 + close (cgs-regression-suite + cgs-gate-check +
  cgs-milestone-review).

## Budget
- I395-I399 (5 iterations). The Blender re-bake is re-armed ONLY at I397 (ST-362). Headless
  probes by default; <=3 new burned YouTube ids, at ST-361 only. Target 0 B asset delta (emblem
  family cap <= 45,912 B).

## Risks
- R-E46-1 the overdrive value lift collides with the rock ember band (54.26-112.43) or another
  emblem acc90 -> CUT to no-change (document overdrive as an accepted-minor; it is already
  hue-unmistakable per I393).
- R-E46-2 the COLOR_0 re-bake accidentally changes geometry / tri / silhouette -> guard: value-
  only bake, same vertex count, silhouette MD5 verified unchanged in the gate.
- R-E46-3 the hue pins drift -> in-code materials are authoritative (GLB materials unused); any
  re-pin is documented and never widened.
- R-E46-4 a pickup appears in a frozen frame -> verified NOT in the MENU (21/366) / standard
  PLAYING (50/1222) pin frames; re-verified in the gate.
- R-E46-5 over-scoping to all 7 emblems for polish -> the ladder pass is CUTTABLE; re-bake only
  what ST-360 flags out of the ladder.
- R-E46-6 the normal-map temptation -> ruled out by the art-bible (flat-faceted); value-only
  bake.

## Verification evidence (at open)
- The I393 docs-based audit (.evidence/I391/ownside_audit_i387.json): 7 emblems, both backdrops,
  fx-off + fx-high, per-emblem acc90/p50 + hue + closeups - the OPEN is scoped entirely from this
  existing evidence + the art-bible (no new probe at open).
- Asset inventory: 7 powerup_*.glb = 37,912 B total (rapid 6628, spread 6628, shield 3396, bomb
  6620, magnet 5256, overdrive 5496, slowmo 3888).
- The setGLB swap path (powerupMesh.js I211) + assetLoader keys puRapid..puSlowmo confirmed by
  inspection.
- No src or asset change at open (docs-only) -> 929/929 + build 0 + dist unchanged (carried from
  I394).

## Recommendation
- APPROVE / PROCEED. The scope is bounded (7 existing GLBs, value-only re-bake), evidence-backed
  (I393 audit + art-bible, no new probe at open) and anti-over-engineer (cut-to-no-change
  fallback + a CUTTABLE ladder pass), and it matches the user standing order (Blender asset work
  + art improvement). Open E46 now; ST-360 (BEFORE audit) is cut gate #1.

## ST-360 BEFORE audit (I395) - CUT decision (premise disproven at cut gate #1)

Verdict: CUT E46 at ST-360 (cut gate #1). The scoped lever (an in-place Blender COLOR_0
facet-value re-bake) is a NO-OP for the actual overdrive dimness, which is the in-code magenta
hue, not the GLB bake. Overdrive is confirmed an accepted-minor (hue-unmistakable; reads fine at
the default fx-high). ST-361..364 DROPPED. Docs-only, zero src, 0 B asset delta.

### Method (fresh, headless)
- Per-emblem probe .evidence/I395/ownside_probe.mjs (seed 71382; both backdrops sky/floor; fx-off O
  + fx-high H; 30 closeups + full MD5) re-run clean -> .evidence/I395/ownside_audit_i387.json. Matched
  the I393 ownside audit 6/7 emblems EXACT; only magnet-sky drifted 135->142.25 (minor re-measurement
  variance on a reads-strong emblem, not the subject).
- Node-side GLB COLOR_0 bake measurement .evidence/I395/measure_emblems.mjs (vendored three +
  GLTFLoader.parseAsync, no browser): per-emblem grayscale bake min/mean/p50/p90 + tri + verts.

### Per-emblem BEFORE (acc90 = accent p90, full emblem element; sepA = acc90 - local bg p90)
FX-OFF (O):
  emblem     sky acc90  sepA     floor acc90  sepA     calls/tris
  rapid        93.25    +22.1     105.07      +72.9     12 / 230
  spread       67.79     -3.4      68.32      +36.1     12 / 230
  shield      190.18   +119.0     164.80     +132.6     12 / 202
  bomb         67.79     -3.4      59.21      +27.0     12 / 230
  magnet      142.25    +71.1     139.90     +107.7     12 / 218
  overdrive    67.37     -3.8      36.70       +4.5     12 / 220   <- weakest (floor)
  slowmo      136.26    +65.1     165.52     +133.3     12 / 206
FX-HIGH (H) floor acc90 (the default in-game setting): rapid 148.97 / spread 88.22 / shield 177.07 /
  bomb 74.00 / magnet 157.74 / overdrive 93.92 / slowmo 175.37 (all read strong; overdrive floor
  fx-high sepA +64.51). Local bg (probe env_baseline): O sky p90 70.43 / floor p90 32.2; H sky p90
  83.05 / floor p90 29.12. Frozen playframe env bands (context): sky p50 70.14 / floor p50 32.2;
  rock ember 54.26-112.43.

### The scope-safety check - the GLB COLOR_0 bake is NOT the lever
Node GLB bake (grayscale facet value, [0.30,1.25] domain) mean / p50 / p90:
  rapid 1.084/1.237/1.250 | spread 0.889/0.825/1.156 | shield 1.032/1.210/1.250 | bomb
  0.980/0.993/1.246 | magnet 0.940/0.986/1.250 | overdrive 0.946/0.987/1.245 | slowmo 1.029/0.993/1.250
overdrive's bake (p50 0.987) ~= bomb (0.993) and is BRIGHTER than spread (0.825); its p90 sits at
the domain ceiling (1.25). Yet overdrive renders the DIMMEST on the floor (fx-off 36.70 vs spread
68.32 whose bake is LOWER). => the overdrive dimness is NOT the GLB COLOR_0 bake.
The rendered dimness is the in-code magenta tint 0xff4dd8 (low green, G~0.30, luma~125) + the
low-green emissive 0x6d0f52 (luma~40, the lowest of the 7), applied identically to all emblems via
powerupMesh.js material.color + material.emissive (emissiveIntensity 0.9 / roughness 0.35 /
metalness 0.15 identical across all 7). Magenta is inherently low-luma; the emissive adds little green.
Re-baking the GLB COLOR_0 would (a) be a NO-OP for the render dimness and (b) collide with the
frozen PU_FACET bake-percentile pin in tests/assetGlbs.test.js (overdrive p10 0.595 / p50 1.000 /
p90 1.250 = the current values). The bake ladder is fine (all means 0.89-1.08); NO emblem has a
bake-driven gap.
### CUT decision (per scope-check Cut Option + R-E46-1)
The Cut Option: "if a clean in-band lift is not achievable ... CUT to no-change and close E46 ...
documenting overdrive as an accepted-minor (already hue-unmistakable per I393)." The scoped lever is
not merely unachievable - it is a NO-OP (the premise is disproven), so R-E46-1 applies a fortiori.
overdrive is an accepted-minor: hue-unmistakable magenta (R&B >> G, closeup-confirmed I393); it reads
FINE at the default fx-high (floor acc90 93.92, sepA +64.51 - strong); only the fx-off floor is the
weak spot (36.70, still +4.5 over the local bg p90). Anti-over-engineer (hard user directive): the
real lever is a hue-risky in-code re-tune of a MINOR item that reads fine at default - not worth the
puab tint-pin + colorblind-distinctness risk this epic.
DECISION: CUT E46 at ST-360 (cut gate #1). ST-361..364 DROPPED (premise disproven at ST-360). Close
E46 docs-only; 1/5 stories completed (ST-360), 4 dropped (ST-361..364).

### Correct lever (deferred to E47 consideration - NOT done here)
If overdrive readability is ever prioritized, the correct lever is IN-CODE (not Blender):
(a) lift overdrive's emissive 0x6d0f52 (a FREE un-pinned knob - only in powerupMesh.js, not in
config.js, not in any test) toward a brighter magenta, keeping the tint 0xff4dd8 intact (puab tint
pin held), A/B-verified; or (b) a tint lift 0xff4dd8 -> a higher-green magenta (coupled: config.js:590
pickup sparkle + powerupMesh.js TYPES must stay in sync; touches the tint pin + colorblind
distinctness - higher risk). The E47 scope-check decides whether to pursue (a) or target another
evidence-backed surface.

### Re-confirmed unchanged (docs-only)
Zero src, zero asset, zero test re-pin. Frozen pins carry: p1 / rockab 2.2/1.3/0.7 / 21/366 + 50/1222
/ FLOOR-50 / skybox 70.14 / rocks 112.43/54.26/52.76 / ring p90 / enemy hierarchy drone 200.98 /
stinger 254 / flyer 197.74 / warden exposed 147.01 / mine 127.0 / boss 182.49 / cockpit cyan
0x59d8ff@1.4 / player bullet 219.99 / enemy 152.18 / vendor sha 76DEA8151BC9352A / dist 131 files /
1,918,997 B / 929 tests green.
Evidence: .evidence/I395/ (ownside_probe.mjs, ownside_audit_i387.json, 30 closeups, measure_emblems.mjs
+ its JSON output).