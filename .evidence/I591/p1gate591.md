# P1 GATE 591 (ST-558, E84): warden v3 + drone v2 (second nudge) - shape readability verdict

GATE (frozen, design/e84-enemy-remaster-research.md per-role briefs FINAL): warden = "solid
turret bulwark" read (NOT scattered slabs); drone = "boomerang" read with sharp-apex threat
language.
VERDICT: PASS on both ships. No rework needed.

METHOD:
1. audit591.py (EEVEE 960x540 Standard, world (0.012,0.014,0.02), suns key 3.2 / fill 1.1 /
   rim 2.0, 50mm cam, bbox_sphere framing, 4 views f34/front/side/rear34 x clay + tint per
   ship; tint_vc = VertexColor "Color" x MULTIPLY -> Principled rough 0.5 metal 0.35):
   a591_{drone,warden}_{f34,front,side,rear34}_{clay,tint}.png (16 PNGs).
2. Key PNGs VIEWED with view_image (not just listed): warden side clay + warden f34 tint +
   drone front clay + drone side clay. Judged on (a) shape identity per role brief,
   (b) feature identification (hull/deck/turret/dome/armor slabs; core/arms/pods),
   (c) consistency across views.

OBSERVATIONS (per view, actually viewed):
- warden_side_clay: low wide hexagonal fortress hull; raised parapet ring + deck; central
  turret with hex plate and dome; armor slab on the near wall reads as ONE mounted plate
  (core + faceplate + cap lips + 4 corner brackets + center boss) - a solid bulwark panel,
  not scattered slabs. Wall ribs + vents + parapet bolts visible. Solid turret-bulwark PASS.
- warden_f34_tint: deck + parapet + turret + dome + 4 dome struts + turret bolt pyramids +
  deck sensor blades all identifiable; armor slabs sit on the outer walls (bracketed, with
  center boss); rear engine nacelle visible. Identity consistent with the side view.
- drone_front_clay (top-down over the boomerang plane): pointed core nose, twin swept-back
  arms with raised outer edges (the ARM_ZT second nudge sharpened the apex), two pods on the
  arms. Reads as a boomerang - PASS.
- drone_side_clay (nose-on): chevron/arrowhead nose with the arms flanking the core, top
  spike (turret bolt pyramid) + belly port. Consistent with the top view.
- NOTE (method, not gate): tint renders run pale - the I586-convention tint_vc uses
  ShaderNodeMixRGB at default fac 0.5, which dilutes the multiply 50/50. Same convention as
  the I586 P-gate (accepted there); shape verdict is unaffected.

CONCLUSION: warden = solid turret bulwark (mounted bracketed slabs, fortress hull, turret +
dome); drone = boomerang (pointed core + swept raised arms). P-gate PASS on the first v3
build + second drone nudge; the allowed rework is NOT used. Proceed to bookkeeping +
quality bar.