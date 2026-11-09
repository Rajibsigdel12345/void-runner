// Void Runner - GLB asset loader (I104). Fire-and-forget async load of the
// five Blender-pass GLBs in assets/ with procedural fallback: renderers
// start procedural and each asset swaps in (via onAsset) as it resolves.
// A failed load warns and keeps the procedural stand-in - no boot gate.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSETS = {
  ship: 'assets/ship.glb',
  rockL: 'assets/asteroid_L.glb',
  rockM: 'assets/asteroid_M.glb',
  rockS: 'assets/asteroid_S.glb',
  boss: 'assets/boss.glb',
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
