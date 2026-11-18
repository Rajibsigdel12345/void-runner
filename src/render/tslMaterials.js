// Void Runner - TSL rim helper (ST-463, I497): the one shared TSL equivalent of
// the I278 onBeforeCompile fresnel rim (outgoingLight += uRimColor *
// pow(1 - NdotV, power) * strength). In the standard TSL lighting model the
// emissive stage is the same insertion point:
//   emissiveNode = materialEmissive + rimColor * fresnel^power * strength.
//
// Vendor-verified (three.tsl.js r187, 819 exports) + probe-verified this
// iteration (.evidence/I497/probedyn*.html):
//   - materialEmissive is a live materialReference (emissive * emissiveIntensity)
//     - per-frame mat.emissive.setHex/lerp/intensity (bossMesh sync()) propagates;
//   - T.uniform(Color) holds the passed Color instance live - the boss per-frame
//     rimHull.color.setHex(rimHex) propagates through uRimColor;
//   - T.uniform(strength).value = s per frame propagates (setStrength below);
//   - normalView + modelViewPosition.negate() give the same view-space NdotV the
//     classic vViewPosition rim uses (probe rim renders on the silhouette edge).
//
// Static-call contract (same as applyEnemyRim): call once per material at
// creation, no per-frame work beyond the existing live-mutation paths.
import { getFxState } from './fxArm.js';

export function applyTSLRim(mat, { color, strength, power }) {
  const { tsl: T } = getFxState();
  const uRimColor = T.uniform(color);
  const uRimStrength = T.uniform(strength);
  mat.emissiveNode = T.materialEmissive.add(uRimColor.mul(
    T.pow(
      T.oneMinus(T.clamp(T.dot(T.normalView.normalize(), T.modelViewPosition.negate().normalize()), T.float(0.0), T.float(1.0))),
      T.float(power)
    )
  ).mul(uRimStrength));
  return { setStrength: (s) => { uRimStrength.value = s; } };
}
