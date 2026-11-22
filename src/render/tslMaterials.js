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
import * as THREE from 'three'; // I557 (ST-523): hex->Color normalization for applyTSLGlow

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

// I557 (ST-523, E76 D1): shared TSL time-pulsed emissive glow - the TSL
// equivalent of the classic emissive slots (engine/weapon/core). Live
// uniforms (same proven pattern as applyTSLRim above):
//   emissiveNode = materialEmissive + uColor * (base + uAmp * (1 + flicker))
// flicker = amp*sin(speed*T.time) + amp2*sin(speed2*T.time), GPU-side
// (T.time = renderer-updated wall-clock seconds): ZERO per-frame CPU work
// beyond an optional setPulse(v) amplitude write. The existing per-frame
// emissive.setRGB/emissiveIntensity hit ramps keep working: materialEmissive
// is the live materialReference (emissive * emissiveIntensity), so the base
// glow and the TSL glow ramp together on hits.
// Static-call contract: call once per material at creation, arm-gated
// (isWebGPU()) - classic arm never reaches here.
export function applyTSLGlow(mat, { color, base = 0, amp = 1, speed = 2, speed2 = 5, amp2 = 0.1 }) {
  const { tsl: T } = getFxState();
  const uColor = T.uniform(color && color.isColor ? color : new THREE.Color(color));
  const uAmp = T.uniform(0);
  const flick = T.add(
    T.mul(T.float(amp), T.sin(T.mul(T.float(speed), T.time))),
    T.mul(T.float(amp2), T.sin(T.mul(T.float(speed2), T.time)))
  );
  mat.emissiveNode = T.materialEmissive.add(
    uColor.mul(T.add(T.float(base), T.mul(uAmp, T.add(T.float(1.0), flick))))
  );
  return { setPulse: (v) => { uAmp.value = v; } };
}
