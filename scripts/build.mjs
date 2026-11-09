// "Build": assemble a static dist/ (index.html + src + vendor + public). No bundler, no spawn.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'index.html'), join(dist, 'index.html'));
// I104: Blender-pass GLB assets load at runtime from assets/ (dev + dist).
try { cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true }); } catch { /* optional dir */ }
for (const d of ['src', 'public']) {
  const src = join(root, d);
  try { cpSync(src, join(dist, d), { recursive: true }); } catch { /* optional dir */ }
}
// Vendor: ship only what the app actually imports (three core + the postprocessing
// closure of the four passes used by bloom.js) instead of the full ~21MB package.
const VENDOR_FILES = [
  'three.module.js',
  // I104: GLTFLoader (Blender-pass GLB assets) + its BufferGeometryUtils dep
  'jsm/loaders/GLTFLoader.js',
  'jsm/utils/BufferGeometryUtils.js',
  'jsm/postprocessing/EffectComposer.js',
  'jsm/postprocessing/RenderPass.js',
  'jsm/postprocessing/OutputPass.js',
  'jsm/postprocessing/UnrealBloomPass.js',
  'jsm/postprocessing/Pass.js',
  'jsm/postprocessing/ShaderPass.js',
  'jsm/postprocessing/MaskPass.js',
  'jsm/shaders/CopyShader.js',
  'jsm/shaders/OutputShader.js',
  'jsm/shaders/LuminosityHighPassShader.js',
];
for (const rel of VENDOR_FILES) {
  const fromV = join(root, 'vendor', rel);
  const toV = join(dist, 'vendor', rel);
  mkdirSync(dirname(toV), { recursive: true });
  cpSync(fromV, toV);
}
console.log('build: dist/ assembled (static, import-map modules)');
