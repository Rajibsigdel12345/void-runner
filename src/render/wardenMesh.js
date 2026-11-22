// ST-137: WARDEN mini-boss rendering - one armored drone (not pooled).
// I220 (E10): hull + armor geometry from assets/warden.glb (VR_Warden_Hull /
// VR_Warden_Armor) when the asset loads; the procedural fallback below (jittered
// dodecahedron hull + hex plate ring) stays for a failed load. Armor: the plate
// ring retracts and the glow shifts cyan -> hot orange once the armor is spent.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim
import { standardMat, isWebGPU } from './fxArm.js'; // I497 (ST-463): node material on the webgpu arm
import { applyTSLGlow } from './tslMaterials.js'; // I557 (ST-523): TSL time-pulsed glow (webgpu arm only)

function bakeDroneGeometry() {
  const r = CONFIG.warden.radius;
  const geo = new THREE.DodecahedronGeometry(r, 0);
  const pos = geo.attributes.position;
  const rng = new RNG(0x5c4e); // fixed seed: same drone every load
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x += (rng.next() - 0.5) * 0.16;
    v.y += (rng.next() - 0.5) * 0.12;
    v.z += (rng.next() - 0.5) * 0.16;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  { // I289/ST-273: white value identity for the procedural fallback geo (material now uses vertexColors)
    const col = new Float32Array(geo.attributes.position.count * 3).fill(1);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return geo;
}

export function createWardenMesh(scene) {
  const r = CONFIG.warden.radius;
  const group = new THREE.Group();

  const hullMat = standardMat({ // I497 (ST-463)
    color: new THREE.Color(0x2c3548).multiplyScalar(CONFIG.warden.renderLumaGain), roughness: 0.4, metalness: 0.55, flatShading: true, // I511/ST-477: gain restores the ~120 rung (v2 bake rendered p50 83.9)
    vertexColors: true, // I289/ST-273: GLB COLOR_0 facet-value bake multiplies on top of the base tint
    emissive: 0x19d3c5, emissiveIntensity: 0.3,
  });
  const hull = new THREE.Mesh(bakeDroneGeometry(), hullMat);
  group.add(hull);

  const armorMat = standardMat({ // I497 (ST-463)
    color: new THREE.Color(0x8fa3c8).multiplyScalar(CONFIG.warden.renderLumaGain), roughness: 0.3, metalness: 0.85, flatShading: true, // I511/ST-477: gain restores the ~120 rung (armor plate)
    emissive: 0x19d3c5, emissiveIntensity: 0.12,
    vertexColors: true, // I289/ST-273: GLB COLOR_0 facet-value bake multiplies on top of the base tint
  });
  const armorGeo = new THREE.CylinderGeometry(r * 1.45, r * 1.55, r * 0.28, 6, 1);
  { // I289/ST-273: white value identity for the procedural fallback geo
    const col = new Float32Array(armorGeo.attributes.position.count * 3).fill(1);
    armorGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const armor = new THREE.Mesh(armorGeo, armorMat);
  armor.rotation.y = Math.PI / 6; // stagger the hex plate from the core facets
  group.add(armor);

  // I155: shape cues (colorblind-friendly) - a spike collar extends once the armor is spent,
  // so the "exposed" state reads by silhouette, not just by the orange glow.
  let shapeCuesOn = true;
  const spikeGeo = new THREE.ConeGeometry(r * 0.16, r * 0.55, 4);
  const spikeMat = standardMat({ color: new THREE.Color(0x8fa3c8).multiplyScalar(CONFIG.warden.renderLumaGain), roughness: 0.3, metalness: 0.85, flatShading: true, emissive: 0xff7a3c, emissiveIntensity: 0.5 }); // I511/ST-477: spike collar shares the armor gain (single CONFIG lever)
  const spikes = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const holder = new THREE.Object3D();
    holder.rotation.y = (i / 8) * Math.PI * 2;
    const s = new THREE.Mesh(spikeGeo, spikeMat);
    s.position.set(r * 1.35, 0, 0);
    s.rotation.z = -Math.PI / 2; // cone tip (+Y) points outward along the holder
    holder.add(s);
    spikes.add(holder);
  }
  spikes.visible = false;
  group.add(spikes);

  group.visible = false;
  scene.add(group);

  const ARMORED = new THREE.Color(0x19d3c5);
  const EXPOSED = new THREE.Color(0xff7a3c);
  const FLASH_WHITE = new THREE.Color(1, 1, 1); // ST-385/E51: hit-flash lerp target (white, not a hue)

  /** sync(warden, t): place the drone, pulse the glow, show the armor state. */
  function sync(warden, t) {
    if (!warden || !warden.alive) { group.visible = false; armor.scale.setScalar(1); spikes.visible = false; return; }
    group.position.set(warden.pos.x, r * 1.1 + 0.3, warden.pos.y);
    group.rotation.y = warden.rot;
    const armored = warden.armor > 0;
    const c = armored ? ARMORED : EXPOSED;
    hullMat.emissive.copy(c);
    hullMat.emissiveIntensity = (armored ? 0.26 : 0.5) + 0.18 * (0.5 + 0.5 * Math.sin(t * (armored ? 2.2 : 5.0)));
    armorMat.emissive.copy(c);
    armorMat.emissiveIntensity = 0.12; // ST-386 fix: sync now rewrites the armor base every frame (it never did before -> the += flash below accumulated forever and never restored)
    const k = warden.hitFlash || 0; // ST-385/E51: white hit-flash (sim scalar; 0 at rest)
    if (k > 0) {
      const sfx = CONFIG.fx.enemyHitFlash.spike;
      hullMat.emissive.lerp(FLASH_WHITE, k);
      hullMat.emissiveIntensity += sfx * k;
      armorMat.emissive.lerp(FLASH_WHITE, k);
      armorMat.emissiveIntensity += sfx * k; // flash adds on top of the base rewritten above (ST-386)
    }
    armor.scale.setScalar(armored ? 1 : 0.62); // spent armor retracts to a thin skirt
    spikes.visible = shapeCuesOn && !armored; // I155: silhouette cue for the exposed state
    group.visible = true;
  }

  // I220 (E10): useGLB(obj) - swap in the Blender Warden geometry. Two meshes by
  // node name: VR_Warden_Hull -> hull, VR_Warden_Armor -> armor plate (the existing
  // sync() drives the armor retract/glow unchanged). In-code materials are kept, so
  // the GLB's own materials are ignored.
  // I460/ST-429 A2: silhouette rim on hull + armor (shared I278 pattern; the armor
  // emissive rewrite in sync() is additive to outgoingLight and coexists with the rim).
  applyEnemyRim(hullMat, 'warden');
  applyEnemyRim(armorMat, 'warden');

  function useGLB(obj) {
    if (!obj) return;
    let hullG = null;
    let armorG = null;
    obj.traverse((n) => {
      if (!n.isMesh) return;
      const nm = n.name || '';
      if (nm.indexOf('Armor') >= 0 && !armorG) armorG = n.geometry;
      else if (!hullG) hullG = n.geometry;
    });
    for (const g of [hullG, armorG]) {
      if (!g) continue;
      if (!g.hasAttribute('color')) { // I289/ST-273: keep a GLB without COLOR_0 safe under vertexColors (white identity)
        const col = new Float32Array(g.attributes.position.count * 3).fill(1);
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
    }
    if (hullG) hull.geometry = hullG;
    if (armorG) armor.geometry = armorG;
  }

  // I155: shape-cue toggle (settings.shapeCues; on by default for colorblind-friendly play).
  function setShapeCues(on) { shapeCuesOn = on === true; }

  return { sync, mesh: group, useGLB, setShapeCues };
}
