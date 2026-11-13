// Void Runner - L3 grade / level-curve output pass (ST-308, I334).
//
// Replaces the plain vendor OutputPass on the High-tier composer with a pass that is
// BIT-IDENTICAL to OutputPass for tone mapping + output color space, plus a config-driven
// level curve applied in DISPLAY-REFERRED linear space: AFTER the ACES tone-map, BEFORE the
// sRGB OETF. That is where a standard video-style level curve (lift / contrast / gamma)
// behaves intuitively (the content is well-distributed in 0..1), matching how a colorist
// grades. The bloom threshold is applied upstream (scene + bloom buffer, pre this pass), so
// the grade never disturbs it - same design contract as the existing ACES pipeline (ST-236).
//
// The composer pass count is unchanged (RenderPass -> Bloom -> this), so NO new draw-call
// path is added (the ST-308 "zero new draw-call paths" rule). High FX tier only; the Low
// tier is a direct-render performance fallback (no composer) and, like bloom, skips the
// grade. A neutral grade (contrast 1, lift 0, gamma 1) is pixel-identical to the vendor
// OutputPass - verified by the I334 A/B probe.
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CONFIG } from '../core/config.js';

const DECL = `
\t\tuniform float uGradeContrast;
\t\tuniform float uGradeLift;
\t\tuniform float uGradeGamma;

\t\t// ST-308 (I334): level curve in DISPLAY-REFERRED linear space (post tone-map, pre sRGB).
\t\t// lift offsets the black/white point; contrast is a linear stretch pivoted at 0.5
\t\t// (1.0 = off); gamma (1.0 = off) - gamma > 1 lifts the mids, gamma < 1 crushes them.
\t\tvec3 gradeLevel( vec3 c, float lift, float gamma, float contrast ) {
\t\t\tc += lift;
\t\t\tif ( abs( contrast - 1.0 ) > 1e-4 ) c = 0.5 + ( c - 0.5 ) * contrast;
\t\t\tif ( abs( gamma - 1.0 ) > 1e-4 ) c = pow( max( c, 0.0 ), vec3( 1.0 / gamma ) );
\t\t\treturn clamp( c, 0.0, 1.0 );
\t\t}
`;

const ANCHOR = '\t\t\t// color space';
const GRADE =
  '\t\t\t// ST-308 (I334): L3 level curve / grade (display-referred linear, post tone-map)\n' +
  '\t\t\tgl_FragColor.rgb = gradeLevel( gl_FragColor.rgb, uGradeLift, uGradeGamma, uGradeContrast );\n' +
  '\t\t\t// color space';

export class GradePass extends OutputPass {
  constructor(cfg = CONFIG) {
    super();
    const g = (cfg && cfg.render && cfg.render.grade) || { contrast: 1.0, lift: 0.0, gamma: 1.0 };
    let frag = this.material.fragmentShader;
    frag = frag.replace('void main() {', DECL + '\n\t\tvoid main() {');
    if (frag.indexOf(ANCHOR) !== -1) frag = frag.replace(ANCHOR, GRADE);
    else throw new Error('gradePass: color-space anchor not found - vendor drift');
    this.material.fragmentShader = frag;
    // material.uniforms === this.uniforms (OutputPass assigns the same reference).
    this.uniforms.uGradeContrast = { value: g.contrast };
    this.uniforms.uGradeLift = { value: g.lift };
    this.uniforms.uGradeGamma = { value: g.gamma };
    this.material.needsUpdate = true;
  }
  /** Re-point the curve at runtime (settings / probes). */
  setGrade(g) {
    if (!g) return;
    this.uniforms.uGradeContrast.value = g.contrast;
    this.uniforms.uGradeLift.value = g.lift;
    this.uniforms.uGradeGamma.value = g.gamma;
  }
}
