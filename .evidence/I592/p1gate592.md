# P1 GATE 592 (ST-559, E84): stinger v2 + flyer v2 - shape readability verdict

GATE (frozen, design/e84-enemy-remaster-research.md per-role briefs FINAL): stinger =
"missile dart" read; flyer = "crescent" read. One rework round per ship allowed
(scope-check-E84 R3).
VERDICT: PASS on both ships - reached after ONE rework round each (the allowance, now used).

FIRST BUILD: P-gate FAILED on both ships (evidence probed, not assumed):
- flyer v2 first build: island probe (probe_islands592.py / probe_dist592.py) found 5
  in-space fragments (gaps 0.066-0.805 from the hull) - detail greebles floating off the
  blades. Root cause (a): the flyer -Y blade is a 180-degree pinwheel ROTATION of the +Y
  blade, but the v2 greeble coordinates were Y-MIRRORED, so greebles on the -Y slab
  landed in empty space.
- stinger v2 first build: 6 nose rivets floating (d 0.03-0.05 off the nose surface).
  Root cause (b): systemic bevel gaps on small greebles - the bevel pass shrank the
  greeble bases below the hull surface they were placed on.
- First-build evidence (GLBs, blends, logs, PNGs, probes - 27 files) backed up to
  .evidence/I592/v0_firstbuild/ before any rework.

REWORK (one round per ship, scope-check allowance consumed):
- Fix A (flyer): greebles on the -Y slab re-placed with the true 180-degree rotation
  (not Y-mirror) of their +Y counterparts.
- Fix B (both): embed_pass (embed592b_snippet.py) - per-greeble Object.ray_cast
  ray-parity settle: any greeble vertex floating off the host surface along the host
  normal is moved onto it; buried straddlers (wireframe false positives) left untouched.
  Validation = Object.ray_cast after view_layer.update() on all 3 target nodes: PASS.
  Method detail: Blender 5.2 has no Object.collection - the host link uses
  next(iter(ob.users_collection)) (bpy.context.scene.collection fallback). A first
  snippet with ob.collection.objects.link(hostob) crashed before GLB export (stale
  timestamps confirmed); fixsnippet.cjs applied the corrected link.
- EMBED results: stinger Body 6 nose rivets moved (d 0.011-0.019 - the true floaters),
  24 straddlers buried/no-move, moved=6/30; stinger Core 2 step-bumps moved
  (d 0.0211 / 0.0148 - favorable divergence: the frozen analysis predicted core
  straddlers, the actual floaters were the bumps, both fixed); moved=2/6; flyer Body
  3 floaters moved (d 0.005 x2, d 0.0203), 62 straddlers (incl. all Fix-A-rotated
  greebles) buried, moved=3/65.
- Ladders (post-rework builds, build_{stinger,flyer}_v2b.py, Blender 5.2.3 headless,
  exit 0): stinger picked k=2.5 -> Body 2,192 t (checkpoint had predicted k=6; same tri
  target hit, no issue); flyer k=6.0 -> Body 2,088 t (as predicted).

AUDIT (audit_i592.py re-run post-rework, 3 canonical ortho 96 px views):
- stinger: sil96 0.0247 in S1-R2 [0.024, 0.028] PASS (fills A 0.0163 / B 0.0431 /
  C 0.0146 - essentially unchanged from first build; only rivets moved).
- flyer: sil96 0.0438 in [0.0351, 0.0475] PASS (fills A 0.0384 / B 0.0295 / C 0.0636 -
  fragments now overlap the blade silhouettes).
- Per-node tris EXACT: stinger 2,192/204 (Body/Core); flyer 2,088/176 (Body/Dome).
- Extents: stinger 4.015/1.0729/1.1725 (x -1.67..2.345 / y +/-0.5365 / z -0.5364..0.636,
  all inside asserts); flyer 2.55/2.0984/0.9371 (x -1.25..1.3 / y +/-1.0492 /
  z -0.3571..0.58, inside asserts).
- GLB: stinger 62,912 B; flyer 61,952 B (both <= 150,000 B single-ship gate).

ISLAND/float probe (probe_dist592b.py, standalone 3-target: stinger Body/Core + flyer
Body; dome excluded by design): STINGER_CORE 0 floats (as frozen); STINGER_BODY 11/30
(straddler wireframe false positives + island11 dorsal blade d=0.0916 - documented
attached-blade artifact, has buried verts); FLYER_BODY 34/65 (ALL buried straddlers;
max d 0.0393 vs the first build's in-space fragments at gaps 0.066-0.805).

P-gate render (audit592.py re-run, 16 fresh PNGs); 5 PNGs actually VIEWED:
- a592_flyer_front_clay (top-down): the 5 first-build in-space fragments are GONE; both
  blades carry greebles ON the slabs in proper 180-degree rotational (pinwheel) symmetry.
- a592_flyer_f34_tint: cohesive crescent ship, dome + collar, no floaters.
- a592_stinger_front_clay: clean dart; nose rivets read as attached surface bumps;
  no fragments.
- a592_stinger_f34_tint: cohesive missile dart (nose spikes, collar, flush panels/
  ridges); no visible floating slit at the dorsal blade.
- a592_flyer_rear34_tint (bonus - the Fix-A -Y side): pinwheel blades, greebles on both
  slabs, no fragments.
Judged on (a) shape identity per role brief, (b) feature identification, (c)
consistency across views.

ACCEPTED RESIDUALS (documented, not gate failures):
- STINGER_BODY probe 11/30 + FLYER_BODY 34/65: buried straddlers (wireframe
  false positives) + the attached dorsal blade artifact - no in-space fragments.
- Flyer dome-collar artifact: lower collar 16 t at 0.0224 from the dome loft,
  deliberately untouched per design item 4 (embed_pass NOT run on the Dome node).

CONCLUSION: stinger = missile dart (clean nose, rivets flush, dorsal blade attached);
flyer = crescent (pinwheel-symmetric greebled blades, dome + collar, no floaters).
P-gate PASS on both ships after one rework round each (allowance consumed). Proceed to
bookkeeping + quality bar.