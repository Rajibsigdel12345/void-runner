// Void Runner - bloom post-fx (ST-035). High FX quality only (GDD: "Low disables bloom + reduces particles").
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CONFIG } from '../core/config.js';

/**
 * Renders through EffectComposer + UnrealBloomPass when enabled (High quality);
 * falls back to a direct renderer.render when disabled (Low quality).
 */
export function createBloom(renderer, scene, camera, cfg = CONFIG) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    cfg.fx.bloom.strength,
    cfg.fx.bloom.radius,
    cfg.fx.bloom.threshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  let enabled = false;
  return {
    setEnabled(on) { enabled = on === true; },
    get enabled() { return enabled; },
    resize(w, h) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    },
    render() {
      if (enabled) composer.render();
      else renderer.render(scene, camera);
    }
  };
}
