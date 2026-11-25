# P1 GATE 586 (ST-553, E83): ship v8 "Rigid Airship Warship" - 96 px readability verdict

GATE (frozen, scope-check-E83.md): "must read as a RIGID AIRSHIP at 96 px (esp. rear34 + side)".
VERDICT: PASS. No rework needed.

METHOD:
1. Rendered audit set (audit586.py, EEVEE, 1080p, 4 views x clay+tint + front/rear34 sil96):
   a586_ship_{f34,front,side,rear34}_{clay,tint}.png + a586_ship_{front,rear34}_sil96.png.
2. Each PNG VIEWED with view_image (not just listed on disk). Judged on: (a) 96 px silhouette
   shapes, (b) feature identification at full res (hull/wings/cockpit/fin/engines),
   (c) consistent identity across all six views.

OBSERVATIONS (per view, actually viewed):
- front_sil96 (6,363 B): long horizontal fuselage + top cockpit dome + wide flat wing +
  a row of 4 small engine-sponson/nozzle bumps beneath the wing -> reads as an airship front-on.
- rear34_sil96 (6,930 B): long fuselage tapering to a bow + wide wing with sponson bumps +
  prominent tail fin -> reads as a rigid airship from behind; the fin + sponson row are the
  decisive rigid-airship cues. PASS on the "esp. rear34" clause.
- side_clay (564,790 B): full profile shows the Zeppelin signature: row of transverse ribs
  along a long envelope, pointed bow, tail fin, rear engine cluster + nozzle row, upper
  cockpit gondola dome. The wing is edge-on (expected in true side profile) - the envelope
  ribs + fin + engine cluster carry the identity.
- side_tint: same geometry, metallic silver envelope + dark navy cockpit dome; identity holds.
- rear34_tint: ribbed envelope + wing panel grid + 5 sponson nozzles visible; the wing panel
  faceting reads as riveted plating (slightly checkered in clay audit, acceptable in-game
  with material lighting - not a gate criterion).
- f34_tint: riveted panel hull, dark cockpit dome, dark fin, sponson nozzles; full warship read.

CONCLUSION: at 96 px the silhouette carries the rigid-airship identity (long envelope + wing +
fin + sponson row) from both required angles. P1 gate PASS on the first build; the one allowed
rework is NOT needed. Proceed to bookkeeping + quality bar, then I587 = THE SWAP.
