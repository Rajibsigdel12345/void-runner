// Void Runner - ship node materials (I557, ST-523, E76 D1): webgpu-arm-only
// material factory for the hero ship. The classic arm (default + ?fx=webgl)
// never builds these: shipMesh.js passes the webgpu/tsl module namespaces in
// as arguments and keeps its plain MeshStandardMaterial path byte-identical
// (this file imports nothing but ./tslMaterials.js -> ./fxArm.js -> 'three').
//
// Ships (frozen CONFIG.ship.palette values, mirrored exactly from the classic
// constructor params in shipMesh.js):
//   body/wing/cockpit: MeshPhysicalNodeMaterial + clearcoat (the "real
//     airship" sheen; the webgpu arm is the opt-in visual upgrade per the
//     standing user directive - the default arm is NEVER changed, I495 C3).
//   engineMat: dedicated glow slot. ship.glb has 6 nodes and the VR_Ship_Engine
//     + VR_Ship_Nozzle nodes share the Hull material, so a pulsing bodyMat
//     would pulse the whole hull; shipMesh.useGLB routes those two node names
//     to engineMat (webgpu arm only). Time-pulsed engine EMISSIVE from the
//     frozen flame palette (F.core.color) via applyTSLGlow's live-uniform
//     pattern: base idle ember + thrust-driven amplitude (one per-frame
//     uniform write in shipMesh.sync) + GPU-side two-sine flicker at the
//     frozen flame flicker rates (deterministic amplitude, wall-clock phase).
import { applyTSLGlow } from './tslMaterials.js';

export function createShipNodeMats(P, F, fx) {
  const { webgpu: W } = fx;
  const bodyMat = new W.MeshPhysicalNodeMaterial({
    color: P.body.color, metalness: P.body.metalness, roughness: P.body.roughness,
    emissive: P.body.emissive !== undefined ? P.body.emissive : 0x000000,
    emissiveIntensity: P.body.emissiveIntensity !== undefined ? P.body.emissiveIntensity : 0,
    flatShading: true, vertexColors: true,
    clearcoat: 0.3, clearcoatRoughness: 0.35,
  });
  const wingMat = new W.MeshPhysicalNodeMaterial({
    color: P.wing.color, metalness: P.wing.metalness, roughness: P.wing.roughness,
    flatShading: true, vertexColors: true,
    clearcoat: 0.2, clearcoatRoughness: 0.45,
  });
  const cockpitMat = new W.MeshPhysicalNodeMaterial({
    color: P.cockpit.color, emissive: P.cockpit.emissive,
    emissiveIntensity: P.cockpit.emissiveIntensity, roughness: P.cockpit.roughness,
    clearcoat: 0.5, clearcoatRoughness: 0.2,
  });
  const engineMat = new W.MeshPhysicalNodeMaterial({
    color: P.body.color, metalness: P.body.metalness, roughness: P.body.roughness,
    emissive: 0x000000, emissiveIntensity: 0,
    flatShading: true, vertexColors: true,
    clearcoat: 0.4, clearcoatRoughness: 0.3,
  });
  const engineGlow = applyTSLGlow(engineMat, {
    color: F.core.color, base: 0.35,
    amp: F.flicker.amp, speed: F.flicker.speed, speed2: F.flicker.speed2, amp2: F.flicker.amp2,
  });
  return { bodyMat, wingMat, cockpitMat, engineMat, engineGlow };
}