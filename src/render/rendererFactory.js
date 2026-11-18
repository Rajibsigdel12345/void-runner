// Void Runner - renderer factory (ST-461, I495): dual-path renderer boot.
//
// Arms (resolved from the ?fx= URL parameter; ?fx is otherwise unused by the app - the in-game
// low/high FX tier is a separate settings value):
//   ?fx=webgl   -> frozen classic THREE.WebGLRenderer (byte-identical ctor params to pre-I495).
//                  The causal / A-B reference arm: never loads three.webgpu.js + three.tsl.js.
//   ?fx=webgpu  -> force WebGPURenderer (loads the webgpu + tsl modules dynamically). EXPERIMENTAL
//                  OPT-IN: the I495 measured run shows r187 WebGPU is not yet compatible with the
//                  app's classic ShaderMaterials (THREE.NodeBuilder: 'Material ShaderMaterial is
//                  not compatible' - console errors; affected materials render degraded). The TSL
//                  work is ST-462 (FX) / ST-463 (materials); the arm stays opt-in until the probe
//                  console is clean (re-evaluated at the ST-464 close gate).
//   (default)   -> classic WebGLRenderer. I495 measured decision (C3 branch, adapted): the probe
//                  env HAS a real WebGPU device, and the auto WebGPU arm logged NodeBuilder console
//                  errors on app ShaderMaterials, so the shipping default resolves to classic to
//                  keep the console clean (quality bar: console 0/0). Core sim pins held EXACT on
//                  both arms (core is three-independent) - see causal495.json + vendor-r187 ADR.
//
// The r187 WebGPU base Renderer's render() hard-throws until `await renderer.init()` resolves, so
// init happens here (module-evaluation top-level await in main.js). The classic arm needs no init.
// Returns { renderer, rendererBackend, rendererArm } where rendererBackend is the ACTIVE backend
// ('webgpu' | 'webgl2', read from renderer.backend after init) and rendererArm is the requested
// arm ('webgl' | 'webgpu' | 'auto').
import * as THREE from 'three';

const CLASSIC = 'webgl';
const WEBGPU = 'webgpu';
const AUTO = 'auto';

export function armFromQuery() { // I497 (ST-463): shared with main.js so ?fx is parsed once
  const fx = new URLSearchParams(window.location.search).get('fx');
  if (fx === CLASSIC) return CLASSIC;
  if (fx === WEBGPU) return WEBGPU;
  return AUTO;
}

function createClassicRenderer() {
  // Frozen classic path (I494 reference): exact ctor of pre-I495 main.js.
  return new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
}

export async function createRenderer(arm = armFromQuery()) {
  if (arm === WEBGPU) {
    // WebGPU opt-in: dynamic import so classic-default users never pay for the
    // ~800 KB webgpu + tsl modules.
    const { WebGPURenderer } = await import('three/webgpu');
    const renderer = new WebGPURenderer({ antialias: true, powerPreference: 'high-performance' });
    await renderer.init(); // resolves after backend init (or the vendor's auto WebGL2 fallback)
    const backend = renderer.backend && renderer.backend.isWebGPUBackend === true ? 'webgpu' : 'webgl2';
    return { renderer, rendererBackend: backend, rendererArm: WEBGPU };
  }
  // Classic: frozen reference (?fx=webgl) and the shipping default (auto -> classic, I495 C3).
  return { renderer: createClassicRenderer(), rendererBackend: 'webgl2', rendererArm: arm };
}
