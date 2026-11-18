// Void Runner - TSL FX pipeline for the ?fx=webgpu arm (ST-462, I496).
//
// Mirrors the frozen classic FX chain (bloom.js: EffectComposer + UnrealBloomPass (half-res,
// ST-217) + GradePass (ST-308/I334: OutputPass + L3 level curve between the ACES tone-map and
// the sRGB OETF)) on the WebGPU backend via TSL:
//
//   pass(scene, camera)  -> HalfFloat, no-MSAA scene RT (the same format as EffectComposer
//                           default renderTarget: type HalfFloatType, no samples)
//     + bloom (BloomNode: luminance high-pass + 5-mip separable gaussian blur;
//                       _resolutionScale 0.5 == the ST-217 HALF factor; half-res internal RTs)
//     + manual output chain replicating RenderOutputNode.setup() with the I334 grade inserted
//       between the tone map and the sRGB OETF (RenderOutputNode has no grade hook):
//         vec4(rgb, a.clamp(0,1)) -> unpremultiplyAlpha -> toneMapping (ACES + live exposure)
//         -> gradeLevel (I334) -> workingToColorSpace(renderer.outputColorSpace)
//         -> premultiplyAlpha
//
// Both arms hold a LINEAR, un-tonemapped scene buffer (the EffectComposer contract; the
// vendor canonical RenderPipeline + BloomNode example), so the single terminal tone-map +
// OETF reproduces the classic chain order exactly. The I334 grade math is a bit-exact port
// (display-referred linear, post tone-map): the GLSL if-branches are kept as TSL select()
// calls, so neutral params stay pixel-identity (the selected value is the untouched input).
//
// Parameter map (A/B gate #1, production/scope-check-E66.md):
//   bloom strength/radius/threshold <- CONFIG.fx.bloom.*      (0.6 / 0.35 / 0.72 frozen)
//   grade  lift/contrast/gamma      <- CONFIG.render.grade.*  (0.0 / 1.0 / 1.18 frozen)
//   tone mapping + exposure + output color space <- live renderer state (main.js boot:
//   ACESFilmic / 1.15 / sRGB); render() tracks changes and rebuilds the chain (the
//   RenderPipeline._update contract - the app fixes both at boot, so no rebuilds in practice).
//
// Documented divergences (pre-registered risk R1: identity = parameter map + grade curve,
// NOT pixel equality):
//   - Bloom algorithm: TSL BloomNode (merged bilinear gaussian taps) vs UnrealBloomPass
//     kernels. Same parameters, half-res, same composite order; not pixel-identical.
//   - Alpha path: RenderOutputNode unpremultiplies/premultiplies; the classic OutputPass
//     passes alpha through. Void Runner is fully opaque (skybox, alpha == 1), so the two
//     are identical for this app.
//
// Low FX tier = the same TSL PassNode pipeline with the bloom node dropped from the output
// graph (full scene; ACES + exposure + sRGB via the manual output chain; no bloom mip work).
import { RenderPipeline } from 'three/webgpu';
import { pass, select, vec3, vec4, uniform, unpremultiplyAlpha, premultiplyAlpha } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { CONFIG } from '../core/config.js';

// ST-308 (I334) gradeLevel - the exact gradePass.js GLSL math, branches preserved as TSL
// select() so neutral params stay pixel-identity:
//   c += lift;
//   if (abs( contrast - 1.0 ) > 1e-4) c = 0.5 + ( c - 0.5 ) * contrast;
//   if (abs( gamma    - 1.0 ) > 1e-4) c = pow( max( c, 0.0 ), 1.0 / gamma );
//   return clamp( c, 0.0, 1.0 );
function gradeLevel(c, uLift, uContrast, uGamma) {
  let g = c.add(uLift);
  g = select(uContrast.sub(1.0).abs().greaterThan(1e-4), vec3(0.5).add(g.sub(vec3(0.5)).mul(uContrast)), g);
  g = select(uGamma.sub(1.0).abs().greaterThan(1e-4), g.max(vec3(0.0)).pow(vec3(1.0).div(uGamma)), g);
  return g.clamp(0.0, 1.0);
}

export function createWebGPUPipeline(renderer, scene, camera, cfg = CONFIG) {
  const fx = cfg.fx.bloom;
  const grade = (cfg.render && cfg.render.grade) || { contrast: 1.0, lift: 0.0, gamma: 1.0 };

  const scenePass = pass(scene, camera);
  const sceneColor = scenePass.getTextureNode('output');
  // Parameter map: CONFIG.fx.bloom.* -> BloomNode uniforms (0.6 / 0.35 / 0.72 frozen).
  const uBloomStrength = uniform(fx.strength); // I497: the Low tier zeroes this (full scene, no bloom) without rebuilding the output node
  const bloomNode = bloom(sceneColor, uBloomStrength, fx.radius, fx.threshold);

  // Parameter map: CONFIG.render.grade.* -> I334 grade uniforms (0.0 / 1.0 / 1.18 frozen).
  const uLift = uniform(grade.lift);
  const uContrast = uniform(grade.contrast);
  const uGamma = uniform(grade.gamma);

  const pipeline = new RenderPipeline(renderer);
  // Manual output chain: the pipeline must NOT wrap the output node with its own
  // renderOutput() (that would double-apply the tone map + OETF and leave no grade hook).
  pipeline.outputColorTransform = false;

  // Rebuild the chain when the renderer tone mapping / output color space change (the
  // RenderPipeline._update contract; the app fixes both at boot - main.js).
  let enabled = true; // production default = High tier (bloom on). I497 fix for the Low/FX-off tier:
  // a plain renderer.render(scene, camera) on the WebGPURenderer only draws already-converted
  // node materials (classic floor/ship/grid/skybox materials are skipped by the plain path -
  // the gate#2 "rocks only" partial-scene bug). We always render through the TSL PassNode
  // pipeline and toggle bloom via the uBloomStrength uniform (0 on Low tier) instead of swapping
  // pipeline.outputNode after creation (the minified vendor mis-handles a post-creation swap).
  function buildOutput() {
    const content = sceneColor.add(bloomNode); // bloom always in graph; Low tier zeroes uBloomStrength (minified WebGPURenderer mis-handles a post-creation outputNode swap)
    let out = vec4(content.rgb, content.a.clamp(0.0, 1.0));
    out = unpremultiplyAlpha(out);
    out = out.toneMapping(renderer.toneMapping); // exposure: the live renderer reference (TSL default)
    out = vec4(gradeLevel(out.rgb, uLift, uContrast, uGamma), out.a); // ST-308 (I334)
    out = out.workingToColorSpace(renderer.outputColorSpace); // sRGB OETF
    out = premultiplyAlpha(out);
    return out;
  }
  pipeline.outputNode = buildOutput();
  pipeline.needsUpdate = true;

  let lastTM = renderer.toneMapping;
  let lastOCS = renderer.outputColorSpace;
  function trackRendererState() {
    if (renderer.toneMapping !== lastTM || renderer.outputColorSpace !== lastOCS) {
      lastTM = renderer.toneMapping;
      lastOCS = renderer.outputColorSpace;
      pipeline.outputNode = buildOutput();
      pipeline.needsUpdate = true;
    }
  }

  const gradePassShim = { // API symmetry with the classic wrapper (bloom.gradePass)
    setGrade(g) {
      if (!g) return;
      uLift.value = g.lift;
      uContrast.value = g.contrast;
      uGamma.value = g.gamma;
    }
  };

  return {
    setEnabled(on) {
      enabled = on === true;
      uBloomStrength.value = on ? fx.strength : 0.0; // Low tier: bloom contributes 0, the full scene still renders
    },
    get enabled() { return enabled; },
    get bloomNode() { return bloomNode; }, // probe access: strength/radius/threshold uniforms
    get pipeline() { return pipeline; }, // I497: gate RT capture access (pixel-neutral)
    get gradePass() { return gradePassShim; },
    resize() {
      // No-op by design: PassNode and BloomNode auto-sync to the renderer drawing buffer
      // every frame (BloomNode.updateBefore sizes all internal RTs).
    },
    render() {
      trackRendererState();
      pipeline.render();
    },
    dispose() {
      bloomNode.dispose();
      pipeline.dispose();
    }
  };
}
