// Void Runner - asset loader (I104). Fire-and-forget async load of the
// twenty-six Blender-pass GLBs + the one floor-surface PNG (ST-327) in assets/
// with procedural fallback: renderers start procedural and each asset swaps
// in (via onAsset) as it resolves. A failed load warns and keeps the
// procedural stand-in - no boot gate.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextureLoader, SRGBColorSpace } from 'three';

const ASSETS = {
  ship: 'assets/ship.glb',
  rockL: 'assets/asteroid_L.glb',
  rockM: 'assets/asteroid_M.glb',
  rockS: 'assets/asteroid_S.glb',
  rockComet: 'assets/asteroid_comet.glb', // I344 (ST-316): comet rock variant (S slot 2; render-only, +0 draw path)
  rockL_B: 'assets/asteroid_L_B.glb', // I420 (ST-390 E52): L silhouette-variant B
  rockM_B: 'assets/asteroid_M_B.glb', // I420 (ST-390 E52): M silhouette-variant B
  rockS_B: 'assets/asteroid_S_B.glb', // I420 (ST-390 E52): S silhouette-variant B
  boss: 'assets/boss.glb',
  shield: 'assets/shield.glb', // I210: energy armor plates
  // I211: seven powerup emblems + drone (Blender, silhouette-matched to procedural fallbacks)
  puRapid: 'assets/powerup_rapid.glb',
  puSpread: 'assets/powerup_spread.glb',
  puShield: 'assets/powerup_shield.glb',
  puBomb: 'assets/powerup_bomb.glb',
  puMagnet: 'assets/powerup_magnet.glb',
  puOverdrive: 'assets/powerup_overdrive.glb',
  puSlowmo: 'assets/powerup_slowmo.glb',
  drone: 'assets/drone.glb',
  warden: 'assets/warden.glb', // I220: armored sentinel mini-boss (hull + armor plate)
  arenaRing: 'assets/arena_ring.glb', // I212: arena boundary ring
  stinger: 'assets/stinger.glb', // ST-230: charger dart (body + emissive core)
  flyer: 'assets/flyer.glb', // ST-234: evasive saucer (hull + emissive dome)
  debrisChunk: 'assets/debris_chunk.glb', // ST-381 (I411): death-shatter shard (angular chunk, 48 tris)
  debrisSliver: 'assets/debris_sliver.glb', // ST-381 (I411): death-shatter shard (thin plate, 48 tris)
  hunter: 'assets/enemy_hunter.glb', // I451 (ST-421 E57): manta hull + W-fin + core (1432 tris; I448 useGLB pre-wire)
  gunship: 'assets/enemy_gunship.glb', // I451 (ST-421 E57): brute hull + open bay + nacelle (1688 tris; I448 useGLB pre-wire)
  sentry: 'assets/enemy_sentry.glb', // ST-449 (pre-wired at I481; procedural until the GLB lands)
  wasp: 'assets/enemy_wasp.glb', // ST-449 (pre-wired at I481; procedural until the GLB lands)
  phantom: 'assets/enemy_phantom.glb', // ST-485 (E69): arrow hull + 2 canopy pods (I519: render wiring)
  hauler: 'assets/enemy_hauler.glb', // ST-485 (E69): squat armored transport + mine-bay hatch
  bulwark: 'assets/enemy_bulwark.glb', // ST-485 (E69): shield slab + spine + core (I519: render wiring)
  sweeper: 'assets/enemy_sweeper.glb', // ST-518 (E75): arc triangle (I552: procedural until the GLB lands)
  beacon: 'assets/enemy_beacon.glb', // ST-518 (E75): signal island (I552: procedural until the GLB lands)
};

// ST-327 (I358): the one PNG texture asset (Blender floor surface, 8,586 B,
// 512x512 sRGB bytes, max luma 48.757 < 50, FLOOR-50 family). Same
// fire-and-forget + fallback contract as the GLBs: the floor disc keeps its
// procedural canvas gradient until this resolves (missing/corrupt PNG =
// pre-ST-327 look, no visual regression).
const TEXTURES = {
  floorSurface: 'assets/floor_surface.png',
};

export function createAssetLoader() {
  const loader = new GLTFLoader();
  const texLoader = new TextureLoader(); // ST-327: PNG branch
  const ready = {};
  const listeners = [];

  function notify(name, entry) {
    for (const fn of listeners) fn(name, entry);
  }

  function loadOne(name, url) {
    return new Promise((resolve) => {
      loader.load(
        url,
        (gltf) => {
          const entry = { object: gltf.scene, ready: true };
          ready[name] = entry;
          notify(name, entry);
          resolve(entry);
        },
        undefined,
        (err) => {
          console.warn('assetLoader: failed to load ' + url, err);
          const entry = { object: null, ready: false };
          ready[name] = entry;
          notify(name, entry);
          resolve(entry); // never reject: procedural fallback stays
        },
      );
    });
  }

  function loadTexture(name, url) {
    return new Promise((resolve) => {
      texLoader.load(
        url,
        (tex) => {
          tex.colorSpace = SRGBColorSpace;
          const entry = { texture: tex, ready: true };
          ready[name] = entry;
          notify(name, entry);
          resolve(entry);
        },
        undefined,
        (err) => {
          console.warn('assetLoader: failed to load ' + url, err);
          const entry = { texture: null, ready: false };
          ready[name] = entry;
          notify(name, entry);
          resolve(entry); // never reject: procedural fallback stays
        },
      );
    });
  }

  function loadAll() {
    const jobs = Object.keys(ASSETS).map((n) => loadOne(n, ASSETS[n]));
    jobs.push(...Object.keys(TEXTURES).map((n) => loadTexture(n, TEXTURES[n])));
    return Promise.all(jobs);
  }

  function onAsset(fn) {
    listeners.push(fn);
    for (const n of Object.keys(ready)) fn(n, ready[n]); // replay already-ready
  }

  function get(name) {
    return ready[name] || null;
  }

  return { loadAll, onAsset, get, names: Object.keys(ASSETS).concat(Object.keys(TEXTURES)) };
}
