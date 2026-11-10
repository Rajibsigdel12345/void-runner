// Void Runner - equirect skybox (I212, ST-212). Fire-and-forget TextureLoader
// for the Blender-generated starfield/nebula texture: on success
// scene.background becomes the far static sky layer (the twinkling Points
// starfield stays as the mid parallax layer). On failure we warn and keep the
// flat 0x04060f background - no boot gate, matching the assetLoader policy.
import * as THREE from 'three';

export function createSkybox(scene, url, onReady) {
  const handle = { ready: false, url };
  const loader = new THREE.TextureLoader();
  loader.load(
    url,
    (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
      handle.ready = true;
      if (onReady) onReady(tex); // I213: PBR-lite IBL hook (PMREM env map)
    },
    undefined,
    (err) => {
      console.warn('skybox: failed to load ' + url, err);
      handle.ready = false;
    },
  );
  return handle;
}
