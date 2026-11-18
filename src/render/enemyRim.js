// I460/ST-429 A2: shared fresnel silhouette rim for enemy hulls.
//
// The I278 fragment-only pattern proven on the I257 asteroids + I272 boss:
// the standard vertex stage already sets vViewPosition = -mvPosition.xyz, so
// only the fragment stage is touched - and EVERY statement sits on its own
// line with the trailing #include starting its own segment, so three's
// resolveIncludes (regex ^[ \t]*#include) still expands it (the I263
// comment-swallow regression family). One shared helper = one GPU program
// for all seven enemy roles (per-material uniforms, same mechanism as the
// boss hull/crown dual-color rim); zero added draw calls or tris at idle.
//
// Budget (task list A2): peak rim luma = strength * luma(color) <= 29 for
// every role (CONFIG.fx.enemyRim.roles) - far under the 183.6 bloom band, so
// the rim reads as an edge accent and never triggers bloom on its own.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { isWebGPU } from './fxArm.js'; // I497 (ST-463): TSL arm
import { applyTSLRim } from './tslMaterials.js'; // I497 (ST-463): node rim (webgpu arm only)

/** applyEnemyRim(mat, role): inject the shared fresnel rim into one
 *  MeshStandardMaterial using CONFIG.fx.enemyRim.{power, roles[role]}.
 *  Idempotence: call once per material at creation (hull materials have no
 *  other onBeforeCompile in this codebase - verified by grep at I460).
 *  No per-frame work: the uniforms are set at first compile. */
export function applyEnemyRim(mat, role) {
  const r = CONFIG.fx.enemyRim.roles[role];
  if (!r) throw new Error('enemyRim: unknown role ' + role);
  const power = CONFIG.fx.enemyRim.power;
  if (isWebGPU()) { // I497 (ST-463): TSL rim (webgpu arm only) - static, no per-frame work
    applyTSLRim(mat, { color: new THREE.Color(r.color), strength: r.strength, power });
    return;
  }
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new THREE.Color(r.color) };
    shader.uniforms.uRimStrength = { value: r.strength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace('#include <opaque_fragment>',
        'float vRimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), ' + power.toFixed(2) + ');\n' +
        'outgoingLight += uRimColor * (vRimF * uRimStrength);\n' +
        '#include <opaque_fragment>');
  };
}
