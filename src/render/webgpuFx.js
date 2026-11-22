// Void Runner - TSL FX pipeline for the ?fx=webgpu arm (ST-462, I496) + the D2 cinematic
// post block (ST-524/I558, E76 scope section 3) - webgpu arm ONLY; the classic arms never
// import this module (the I495 cost contract + the byte-identical default arm).
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
//
// D2 (ST-524/I558) adds, AFTER the sRGB OETF (display space):
//   dispTex (convertToTexture, +1 sub-render - shared by CA + lensflare: one texture, two consumers)
//     -> ChromaticAberrationNode (subtle radial CA, 0.0018 UV displacement - display space,
//        where the displacement is visually predictable)
//     -> [cockpit pipeline ONLY] DepthOfField (7 sub-passes; NEVER in the chase/overview graph -
//        the D2 FPS gate measures chase and must not pay the sub-passes per frame)
//     -> + LensflareNode ghost trail (screen-space, 1/4-res RT; the K1 decision REPLACING
//        GodraysNode, which needs a shadow-casting scene light + scene depth - unusable for the
//        engine glow). Its output = ghosts only (no base image) - the node is ADDed to the chain.
//     -> FilmNode grain (mix() => exact identity at intensity 0.0 - the Low tier sets 0.0)
//     -> raw-TSL corner vignette (r187 has NO VignetteNode; modest on purpose - the DOM
//        #vignette overlay already darkens the corners at alpha 0.62 in every arm)
// and softens the bloom knee: the vendor high-pass is already
//   smoothstep(threshold, threshold + smoothWidth, luma) with a mutable smoothWidth uniform,
// so the knee = widen smoothWidth to CONFIG.fx.cinematic.softKnee and center it on the frozen
// 0.72 threshold (smoothstep(0.72-k, 0.72+k, luma)); the classic arm keeps its hard 0.72.
//
// Two pipelines (the I497-safe cockpit-DOF switch): pipeline A (chase/overview, no DOF) and
// pipeline B (cockpit, DOF) are each built ONCE at creation with its final outputNode;
// setCockpit() only swaps the ACTIVE pointer. No post-creation outputNode swap (the minified
// vendor mis-handles those - I497). The inactive pipeline's graph is never traversed (zero
// per-frame cost); its RTs stay allocated (2x bloom-mip memory - accepted).
//
// Parameter map (A/B gate #1, production/scope-check-E66.md + the D2 config block fx.cinematic):
//   bloom strength/radius/threshold <- CONFIG.fx.bloom.*      (0.6 / 0.35 / 0.72 frozen)
//   soft knee width                 <- CONFIG.fx.cinematic.softKnee
//   grade  lift/contrast/gamma      <- CONFIG.render.grade.*  (0.0 / 1.0 / 1.18 frozen)
//   CA / vignette / film / flare / DOF / dprCap <- CONFIG.fx.cinematic.* (D2; webgpu arm only)
//   tone mapping + exposure + output color space <- live renderer state (main.js boot:
//   ACESFilmic / 1.15 / sRGB); render() tracks changes and rebuilds the chain (the
//   RenderPipeline._update contract - the app fixes both at boot, so no rebuilds in practice).
//
// Tier policy (setEnabled): High = full chain; Low/Off = bloom strength 0 (existing I497
// behavior), film 0.0 + lensflare threshold 1.0 (exactly off - display space is <= 1.0, so
// max(sample - 1.0) == 0), CA + vignette kept (zero-pass math). DOF is camera-driven
// (cockpit) and independent of the FX tier.
//
// Documented divergences (pre-registered risk R1: identity = parameter map + grade curve,
// NOT pixel equality):
//   - Bloom algorithm: TSL BloomNode (merged bilinear gaussian taps) vs UnrealBloomPass
//     kernels. Same parameters, half-res, same composite order; not pixel-identical.
//   - Bloom knee: D2 soft knee (webgpu arm) vs hard threshold (classic arm) - D2 scope.
//   - Alpha path: RenderOutputNode unpremultiplies/premultiplies; the classic OutputPass
//     passes alpha through. Void Runner is fully opaque (skybox, alpha == 1), so the two
//     are identical for this app.
import { RenderPipeline } from 'three/webgpu';
import { pass, select, sub, vec2, vec3, vec4, uniform, unpremultiplyAlpha, premultiplyAlpha, uv, distance, smoothstep, convertToTexture } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import LensflareNode from 'three/addons/tsl/display/LensflareNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
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
  const cin = (cfg.fx && cfg.fx.cinematic) || {};
  const grade = (cfg.render && cfg.render.grade) || { contrast: 1.0, lift: 0.0, gamma: 1.0 };
  const knee = cin.softKnee > 0 ? cin.softKnee : 0.01; // D2: soft-knee half-width (0.25)
  const filmOn = cin.film != null ? cin.film : 0.06;
  const flareOn = (cin.lensFlare && cin.lensFlare.threshold) || 0.5;

  // ---- shared live uniforms (one instance drives BOTH pipelines) ----
  const uBloomStrength = uniform(fx.strength); // I497: the Low tier zeroes this (full scene, no bloom) without rebuilding the output node
  const uBloomThreshold = uniform(fx.threshold - knee / 2); // D2: the knee centered on the frozen 0.72 threshold
  const uLift = uniform(grade.lift);
  const uContrast = uniform(grade.contrast);
  const uGamma = uniform(grade.gamma);
  const uCAStrength = uniform((cin.ca && cin.ca.strength) || 0.0018);
  const uCAScale = uniform((cin.ca && cin.ca.scale) || 1.0);
  const uVig = uniform(cin.vignette != null ? cin.vignette : 0.08);
  const uFilm = uniform(filmOn);
  const uFlareThreshold = uniform(flareOn);
  const uDofFocus = uniform((cin.dof && cin.dof.focusDistance) || 20);
  const uDofFocal = uniform((cin.dof && cin.dof.focalLength) || 60);
  const uDofBokeh = uniform((cin.dof && cin.dof.bokehScale) || 0.8);

  // D2 display-space corner vignette (raw TSL; r187 has no VignetteNode). Corner factor ~
  // (1 - uVig), center 1.0 - modest on top of the DOM #vignette (every arm).
  function vignetteMath(c) {
    const d = distance(uv().sub(vec2(0.5)), vec2(0.0));
    const v = sub(1.0, uVig.mul(smoothstep(0.45, 0.75, d)));
    return c.mul(vec4(v, v, v, 1.0));
  }

  let enabled = true; // production default = High tier (full chain)

  // One pipeline: scene pass + its own BloomNode (the bloom input is pass-specific) + the
  // full output chain. withDOF = the cockpit pipeline B (the chase/overview pipeline A omits
  // the 7 DoF sub-passes - the D2 FPS gate measures chase and would otherwise pay them every
  // frame even with the DOF math degenerate).
  function makePipeline(withDOF) {
    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode('output');
    // D2 soft-knee bloom: the vendor high-pass is smoothstep(threshold, threshold +
    // smoothWidth, luma) with a mutable smoothWidth uniform - widen it, center the knee on 0.72.
    const bloomNode = bloom(sceneColor, uBloomStrength, fx.radius, uBloomThreshold);
    bloomNode.smoothWidth.value = knee;

    function buildOutput() {
      const content = sceneColor.add(bloomNode); // bloom always in graph; Low tier zeroes uBloomStrength (minified WebGPURenderer mis-handles a post-creation outputNode swap)
      let out = vec4(content.rgb, content.a.clamp(0.0, 1.0));
      out = unpremultiplyAlpha(out);
      out = out.toneMapping(renderer.toneMapping); // exposure: the live renderer reference (TSL default)
      out = vec4(gradeLevel(out.rgb, uLift, uContrast, uGamma), out.a); // ST-308 (I334)
      out = out.workingToColorSpace(renderer.outputColorSpace); // sRGB OETF -> display space
      // ---- D2 display-space cinematic block (webgpu arm only) ----
      const dispTex = convertToTexture(out); // +1 sub-render (free fn in r187; Node.prototype has no .convertToTexture); shared by CA + lensflare (one texture, two consumers)
      let c = chromaticAberration(dispTex, uCAStrength, vec2(0.5), uCAScale); // subtle radial CA (display space)
      if (withDOF) c = dof(c, scenePass.getViewZNode('depth'), uDofFocus, uDofFocal, uDofBokeh); // cockpit only (7 sub-passes)
      const flare = new LensflareNode(dispTex, { ghostTint: 0xffffff, threshold: uFlareThreshold, ghostSamples: (cin.lensFlare && cin.lensFlare.ghostSamples) || 4, ghostSpacing: (cin.lensFlare && cin.lensFlare.ghostSpacing) || 0.25, ghostAttenuationFactor: (cin.lensFlare && cin.lensFlare.ghostAttenuation) || 25, downSampleRatio: (cin.lensFlare && cin.lensFlare.downSampleRatio) || 4 });
      c = c.add(flare); // LensflareNode output = ghosts only (no base image) - add to the chain
      c = film(c, uFilm, null); // grain; mix() => exact identity at uFilm 0.0 (Low tier)
      c = vignetteMath(c); // raw-TSL corner vignette (the DOM #vignette already darkens corners)
      c = premultiplyAlpha(c);
      return c;
    }

    const pipeline = new RenderPipeline(renderer);
    // Manual output chain: the pipeline must NOT wrap the output node with its own
    // renderOutput() (that would double-apply the tone map + OETF and leave no grade hook).
    pipeline.outputColorTransform = false;

    pipeline.outputNode = buildOutput();
    pipeline.needsUpdate = true;

    // Rebuild the chain when the renderer tone mapping / output color space change (the
    // RenderPipeline._update contract; the app fixes both at boot - main.js).
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
    return { pipeline, scenePass, bloomNode, trackRendererState };
  }

  const A = makePipeline(false); // chase / overview
  const B = makePipeline(true);  // cockpit (DOF)
  let active = A;
  let cockpit = false;

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
      uFilm.value = on ? filmOn : 0.0; // D2: grain off on Low (exact identity at 0.0)
      uFlareThreshold.value = on ? flareOn : 1.0; // D2: threshold 1.0 = exactly off (display space <= 1.0)
    },
    setCockpit(on) { // D2: the I497-safe DOF switch - swap the ACTIVE pipeline pointer, never a post-creation outputNode
      cockpit = on === true;
      active = cockpit ? B : A;
    },
    get enabled() { return enabled; },
    get cockpit() { return cockpit; },
    get bloomNode() { return A.bloomNode; }, // probe access: strength/radius/threshold uniforms
    get pipeline() { return active.pipeline; }, // I497: gate RT capture access (pixel-neutral)
    get gradePass() { return gradePassShim; },
    resize() {
      // No-op by design: PassNode and BloomNode auto-sync to the renderer drawing buffer
      // every frame (BloomNode.updateBefore sizes all internal RTs).
    },
    render() {
      A.trackRendererState();
      B.trackRendererState();
      active.pipeline.render(); // only the active pipeline traverses its graph (zero cost for the other)
    },
    dispose() {
      A.bloomNode.dispose();
      B.bloomNode.dispose();
      A.pipeline.dispose();
      B.pipeline.dispose();
    }
  };
}