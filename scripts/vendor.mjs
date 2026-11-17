// Copy three.js + addons from node_modules into vendor/ (pure fs, no spawn).
import { cpSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto'; // ST-461 (I495): raw sha256-16 pin report
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcThree = join(root, 'node_modules', 'three', 'build', 'three.module.js');
const srcCore = join(root, 'node_modules', 'three', 'build', 'three.core.js');
const srcJsm = join(root, 'node_modules', 'three', 'examples', 'jsm');
const dst = join(root, 'vendor');

mkdirSync(dst, { recursive: true });
cpSync(srcThree, join(dst, 'three.module.js'));
cpSync(srcCore, join(dst, 'three.core.js'));
// ST-461 (I495): ship the WebGPU closure (three.webgpu.js + three.tsl.js). WebGPURenderer is imported
// dynamically from 'three/webgpu' (import map); three.webgpu.js statically imports ./three.core.js +
// ./three.tsl.js, so both must ship. Raw source sizes are pinned by the vendor-r187 ADR (raw = primary).
const srcWebGPU = join(root, 'node_modules', 'three', 'build', 'three.webgpu.js');
const srcTSL = join(root, 'node_modules', 'three', 'build', 'three.tsl.js');
cpSync(srcWebGPU, join(dst, 'three.webgpu.js'));
cpSync(srcTSL, join(dst, 'three.tsl.js'));
for (const [rel, wantBytes] of [['three.webgpu.js', 1350894], ['three.tsl.js', 1065544]]) {
  const b = readFileSync(join(dst, rel));
  if (b.length !== wantBytes) throw new Error('vendor: ' + rel + ' size ' + b.length + ' != pinned ' + wantBytes);
  const h = createHash('sha256').update(b).digest('hex').slice(0, 16).toUpperCase();
  console.log('vendor: ' + rel + ' sha256-16(raw) ' + h + ' (' + b.length + ' B)');
}
rmSync(join(dst, 'jsm'), { recursive: true, force: true });
cpSync(srcJsm, join(dst, 'jsm'), { recursive: true });
console.log('vendor: three.module.js + three.core.js + three.webgpu.js + three.tsl.js + examples/jsm copied to vendor/ (r187 classic + WebGPU closure)');
