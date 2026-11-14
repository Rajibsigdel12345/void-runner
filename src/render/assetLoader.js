// Void Runner - GLB asset loader (I104). Fire-and-forget async load of the
// eighteen Blender-pass GLBs in assets/ with procedural fallback: renderers
// start procedural and each asset swaps in (via onAsset) as it resolves.
// A failed load warns and keeps the procedural stand-in - no boot gate.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSETS = {
  ship: 'assets/ship.glb',
  rockL: 'assets/asteroid_L.glb',
  rockM: 'assets/asteroid_M.glb',
  rockS: 'assets/asteroid_S.glb',
  rockComet: 'assets/asteroid_comet.glb', // I344 (ST-316): comet rock variant (S slot 2; render-only, +0 draw path)
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
};

export function createAssetLoader() {
  const loader = new GLTFLoader();
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

  function loadAll() {
    const jobs = Object.keys(ASSETS).map((n) => loadOne(n, ASSETS[n]));
    return Promise.all(jobs);
  }

  function onAsset(fn) {
    listeners.push(fn);
    for (const n of Object.keys(ready)) fn(n, ready[n]); // replay already-ready
  }

  function get(name) {
    return ready[name] || null;
  }

  return { loadAll, onAsset, get, names: Object.keys(ASSETS) };
}
