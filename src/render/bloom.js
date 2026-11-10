// Void Runner - bloom post-fx (ST-035). High FX quality only (GDD: "Low disables bloom + reduces particles").
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CONFIG } from '../core/config.js';

// ST-217: half-resolution bloom (art research 2026-11-10, lever 1). The composer
// sizes every pass to the FULL frame on resize, so after each resize we force the
// bloom pass's internal bright pass + 5-mip blur chain to half of that. The pass
// composites the (auto-upscaled) bloom texture at full res itself, so the glow is
// visually unchanged (bloom is blurry by nature) while the per-frame cost drops
// ~60% (measured before/after in I217 under the same scripted pilot load).
const HALF = 0.5;

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
      // ST-217: half-res internal bloom targets (composer already sized the buffers full).
      const hw = Math.max(1, Math.floor(w * HALF));
      const hh = Math.max(1, Math.floor(h * HALF));
      bloomPass.resolution.set(hw, hh);
      bloomPass.setSize(hw, hh);
    },
    render() {
      if (enabled) composer.render();
      else renderer.render(scene, camera);
    }
  };
}
