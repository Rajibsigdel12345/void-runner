// I272 (ST-259): source-level regression guard for the boss rim onBeforeCompile injection.
// The I263 injection ended its first concat segment with a // comment and no trailing newline,
// so the comment swallowed the rim add-term and the trailing #include <opaque_fragment> (the
// ONLY place the standard fragment assigns gl_FragColor). The hull/crown programs compiled
// cleanly but never wrote the fragment output -> the (0,0,0,0) transparent boss silhouette
// hole. WebGL cannot run in node, so the string structure is pinned here.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'render', 'bossMesh.js'),
  'latin1',
);

test('I272: boss rim uses the standard vViewPosition varying (no custom rim varying)', () => {
  assert.ok(!src.includes('vRimViewPos'), 'custom rim varying must be gone (I272)');
  assert.ok(src.includes('normalize(-vViewPosition)'), 'rim must use the standard vViewPosition');
});

test('I272: the rim #include starts its own line (resolveIncludes regex is line-anchored)', () => {
  assert.match(
    src,
    /\n\s+'#include <opaque_fragment>'\)/,
    'trailing #include must be its own line-started segment; a same-line include is left raw and gl_FragColor is never assigned',
  );
});

test('I272: no // comment may share a line with the rim add-term (I263 comment-swallow bug)', () => {
  for (const line of src.split('\n')) {
    const j = line.indexOf('outgoingLight += uRimColor');
    if (j === -1) continue;
    assert.ok(!line.slice(0, j).includes('//'), 'a // comment must not precede the rim term on the same line: ' + line);
  }
});

test('I272: rim add-term and strength uniform are still injected', () => {
  assert.ok(src.includes("'outgoingLight += uRimColor * (vRimF * uRimStrength);\\n' +"), 'rim add-term kept');
  assert.ok(src.includes('shader.uniforms.uRimStrength = { value: rim.strength };'), 'rim strength uniform kept');
});
