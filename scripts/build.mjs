// "Build": assemble a static dist/ (index.html + src + vendor + public). No bundler, no spawn.
import { cpSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { transform } from 'esbuild'; // ST-271 (I287): per-module src minify
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'index.html'), join(dist, 'index.html'));
// ST-319 (I348): stamp the prod build flag. src/main.js registers the service worker ONLY
// when vr-build=prod, so the dev server + headless probes (repo root, content="dev") never
// register the SW and can never be served stale modules (R-E37-2).
{
  const htmlPath = join(dist, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  html = html.replace('<meta name="vr-build" content="dev" />', '<meta name="vr-build" content="prod" />');
  writeFileSync(htmlPath, html);
  console.log('build: index.html stamped vr-build=prod');
}
// I104: Blender-pass GLB assets load at runtime from assets/ (dev + dist).
try { cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true }); } catch { /* optional dir */ }
for (const d of ['src', 'public']) {
  const src = join(root, d);
  try { cpSync(src, join(dist, d), { recursive: true }); } catch { /* optional dir */ }
}
// ST-319 (I348): root-scope service worker copy - dist/sw.js sits at the dist root so its
// scope covers index.html + src + vendor + assets + public (R-E37-1).
{
  try { cpSync(join(root, 'public', 'sw.js'), join(dist, 'sw.js')); console.log('build: dist/sw.js (root scope)'); } catch { /* optional */ }
}
// ST-271 (I287): per-module minify of dist/src/**/*.js via esbuild transform -
// syntax-level only (local identifiers + whitespace; import/export paths and
// property names untouched; no bundling, no cross-module tree-shaking), so the
// import-map convention holds and every src path survives in dist. vendor/ +
// assets/ stay byte-identical (hash-compared in the I287 probe).
{
  const minifyDir = async (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await minifyDir(p);
      else if (e.name.endsWith('.js')) {
        const out = await transform(readFileSync(p, 'utf8'), {
          loader: 'js',
          format: 'esm',
          minify: true,
          keepNames: true, // console stack traces keep the original function names
          legalComments: 'none', // project code only; vendor keeps its own comments
        });
        writeFileSync(p, out.code);
      }
    }
  };
  await minifyDir(join(dist, 'src'));
  console.log('build: dist/src minified (esbuild, per-module, format=esm, no bundling)');
}
// Vendor: ship only what the app actually imports (three core + the postprocessing
// closure of the four passes used by bloom.js) instead of the full ~21MB package.
const VENDOR_FILES = [
  'three.module.js',
  'three.core.js',
  // I104: GLTFLoader (Blender-pass GLB assets) + its BufferGeometryUtils dep
  'jsm/loaders/GLTFLoader.js',
  'jsm/utils/BufferGeometryUtils.js',
  'jsm/utils/SkeletonUtils.js',
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
// ST-460 (I494): after the vendor copy, minify the r187 three ESM vendor bundles in dist
// (esbuild, syntax-level, format=esm; deterministic given the pinned esbuild). ST-460 ships
// only the classic closure (three.module.js + three.core.js); three.webgpu.js + three.tsl.js
// are added at ST-461 with its size-budget strategy (dist ceiling 3,250,000 B). JSM addons +
// assets stay byte-identical. The frozen sha256-16 pins are computed on the RAW source
// vendor/ files (see vendor-r187 ADR).
const VENDOR_MINIFY = [
  'three.module.js',
  'three.core.js',
];
{
  const crypto = await import('node:crypto');
  for (const rel of VENDOR_MINIFY) {
    const p = join(dist, 'vendor', rel);
    const out = await transform(readFileSync(p, 'utf8'), {
      loader: 'js', format: 'esm', minify: true, keepNames: true, legalComments: 'none',
    });
    writeFileSync(p, out.code);
  }
  for (const rel of VENDOR_MINIFY) {
    const h = crypto.createHash('sha256').update(readFileSync(join(dist, 'vendor', rel))).digest('hex').slice(0, 16).toUpperCase();
    console.log('build: dist/vendor/' + rel + ' minified sha256-16 ' + h);
  }
  console.log('build: vendor ESM bundles minified (esbuild, deterministic)');
}

console.log('build: dist/ assembled (static, import-map modules)');
