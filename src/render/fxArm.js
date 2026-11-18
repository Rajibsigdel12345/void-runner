// Void Runner - FX arm state (ST-463, I497): holds the lazily loaded WebGPU/TSL
// modules and exposes the arm queries + the standard-material factory used by
// the webgpu-only material sites. The classic arm (?fx=webgl) and the shipping
// default (auto -> classic, I495 C3) never load three.webgpu.js or three.tsl.js:
// standardMat() falls back to THREE.MeshStandardMaterial and every isWebGPU()
// branch in the render layer stays inert, so the classic path is byte-identical
// to I496.
import * as THREE from 'three';

const WEBGPU = 'webgpu';

let state = null;

export async function initFxArm(arm) {
  if (state) return state;
  if (arm === WEBGPU) {
    const webgpu = await import('three/webgpu');
    const tsl = await import('three/tsl');
    state = { arm: WEBGPU, webgpu, tsl };
  } else {
    state = { arm, webgpu: null, tsl: null };
  }
  return state;
}

export function getFxState() {
  if (!state) throw new Error('fxArm: initFxArm() not awaited yet');
  return state;
}

export function isWebGPU() {
  return state !== null && state.arm === WEBGPU;
}

// I497 (ST-463): the rim-host materials (asteroids, boss hull/crown, the 9 enemy
// roles) build through this so the webgpu arm gets MeshStandardNodeMaterial
// (emissiveNode-capable) while every other classic material stays a plain
// MeshStandardMaterial on both arms.
export function standardMat(params) {
  if (!state) throw new Error('fxArm: standardMat before initFxArm()');
  if (state.arm === WEBGPU) return new state.webgpu.MeshStandardNodeMaterial(params);
  return new THREE.MeshStandardMaterial(params);
}
