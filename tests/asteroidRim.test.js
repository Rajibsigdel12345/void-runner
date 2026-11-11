import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../src/core/config.js';

const src = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'render', 'asteroidRenderer.js'),
  'latin1',
);

test('I278: rock rim is FRAGMENT-ONLY (standard vViewPosition, no custom varying / vertex injection)', () => {
  assert.ok(!src.includes('vRimViewPos'), 'no custom vRimViewPos varying (the I272 boss pattern)');
  assert.ok(!src.includes('shader.vertexShader'), 'no vertex-shader injection (project_vertex drop)');
  assert.ok(src.includes('normalize(vViewPosition)') && !src.includes('normalize(-vViewPosition)'), 'I278 sign fix: vViewPosition (fragment->camera), NOT -vViewPosition (f=1 flat coat since I60)');
});

test('I278: the rock rim #include starts its own line (resolveIncludes regex is line-anchored)', () => {
  assert.match(src, /\n\s+'#include <opaque_fragment>'\)/, 'trailing #include must be its own line-started segment');
});

test('I278: no // comment may share a line with the rock rim add-term (I263 comment-swallow bug)', () => {
  for (const line of src.split('\n')) {
    const j = line.indexOf('outgoingLight += uRimColor');
    if (j === -1) continue;
    assert.ok(!line.slice(0, j).includes('//'), 'a // comment must not precede the rim term on the same line: ' + line);
  }
});

test('I278: rock rim power is data-driven in CONFIG + strength uniform wired to CONFIG', () => {
  assert.ok(src.includes('CONFIG.asteroid.rim.power'), 'CONFIG.asteroid.rim.power referenced in the injected GLSL');
  assert.ok(!src.includes(', 5.0);'), 'no hardcoded pow(..., 5.0) left in the rock rim GLSL');
  assert.ok(src.includes('outgoingLight += uRimColor * (vRimF * uRimStrength)'), 'rim add-term kept');
  assert.ok(src.includes('shader.uniforms.uRimStrength = { value: CONFIG.asteroid.rim.strength }'), 'rim strength uniform wired to CONFIG');
});

test('I278: CONFIG.asteroid.rim sanity (warm frozen accent + silhouette-hugging power band)', () => {
  const r = CONFIG.asteroid.rim;
  assert.ok(r, 'CONFIG.asteroid.rim exists');
  assert.ok(r.color === 0xd8a878, 'warm edge color frozen (I257)');
  assert.ok(r.strength === 0.12, 'strength frozen 0.12 (I257)');
  assert.ok(typeof r.power === 'number' && 7 <= r.power && r.power <= 10, 'power 7..10 (silhouette-hugging)');
  const R = (r.color >> 16) & 0xff, G = (r.color >> 8) & 0xff, B = r.color & 0xff;
  assert.ok(R > G && G > B, 'warm accent: R > G > B');
});
