const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Game';
function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }
function write(p, s) { fs.writeFileSync(path.join(ROOT, p), s, 'utf8'); }
let opsDone = 0;
function apply(file, ops) {
  let s = read(file);
  const before = s;
  for (const op of ops) {
    if (op.re) {
      const re = new RegExp(op.re.source, 'g');
      const m = s.match(re);
      const n = m ? m.length : 0;
      if (n !== op.want) throw new Error(file + ': regex matched ' + n + ' (want ' + op.want + '): ' + op.re.source.slice(0, 60));
      s = s.replace(re, () => op.new);
    } else {
      const n = s.split(op.old).length - 1;
      if (n !== op.want) throw new Error(file + ': fragment matched ' + n + ' (want ' + op.want + '): ' + op.old.slice(0, 70));
      s = s.split(op.old).join(op.new);
    }
    opsDone++;
  }
  if (s === before) throw new Error(file + ': no change applied');
  if ((before.charCodeAt(0) === 0xFEFF) !== (s.charCodeAt(0) === 0xFEFF)) throw new Error(file + ': BOM changed');
  write(file, s);
  console.log('patched ' + file + ': ' + ops.length + ' ops, ' + before.length + ' -> ' + s.length + ' chars');
}
const NL = '\r\n';
const NEW_PARSEGLB = [
  'function parseGlb(file) {',
  "  const buf = fs.readFileSync(path.join(ASSET_DIR, file));",
  "  assert.equal(buf.length > 12, true, file + ': file too small');",
  "  assert.equal(buf.readUInt32LE(0), GLB_MAGIC, file + ': bad magic');",
  '  const version = buf.readUInt32LE(4);',
  '  const declared = buf.readUInt32LE(8);',
  "  assert.equal(version, 2, file + ': expected glTF 2.0');",
  "  assert.equal(declared, buf.length, file + ': declared length != file size');",
  '  const fileSize = buf.length;',
  '  let off = 12; let json = null; let binOff = -1;',
  '  while (off < buf.length) {',
  '    const len = buf.readUInt32LE(off);',
  '    const type = buf.readUInt32LE(off + 4);',
  '    if (type === CHUNK_JSON) {',
  "      json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8'));",
  '    } else if (type === CHUNK_BIN) {',
  '      binOff = off + 8;',
  '    }',
  '    off += 8 + len;',
  '  }',
  "  assert.ok(json, file + ': no JSON chunk');",
  "  assert.ok(binOff >= 0, file + ': no BIN chunk');",
  '  // I609 (ST-574 E88): EXT_meshopt_compression - the BIN chunk holds meshopt-compressed views;',
  '  // rebuild the LOGICAL (post-decode) buffer so every read site below is unchanged.',
  "  if (!(json.extensionsRequired || []).includes('EXT_meshopt_compression')) {",
  '    return { buf, json, binOff, fileSize };',
  '  }',
  '  let logicalSize = 0;',
  '  for (const bv of json.bufferViews || []) {',
  '    const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;',
  '    const end = (bv.byteOffset || 0) + (ext ? ext.byteLength : bv.byteLength);',
  '    if (end > logicalSize) logicalSize = end;',
  '  }',
  '  const logical = Buffer.alloc(logicalSize);',
  '  for (const bv of json.bufferViews || []) {',
  '    const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;',
  '    const base = bv.byteOffset || 0;',
  '    if (ext) {',
  '      const out = Buffer.alloc(ext.count * ext.byteStride);',
  '      MeshoptDecoder.decodeGltfBuffer(out, ext.count, ext.byteStride, buf.subarray(binOff + ext.byteOffset, binOff + ext.byteOffset + ext.byteLength), ext.mode, ext.filter || 0);',
  '      logical.set(out, base);',
  '    } else {',
  '      logical.set(buf.subarray(binOff + base, binOff + base + bv.byteLength), base);',
  '    }',
  '  }',
  '  return { buf: logical, json, binOff: 0, fileSize };',
  '}',
].join(NL);
apply('tests/assetGlbs.test.js', [
  { re: /function parseGlb\(file\) \{[\s\S]*?\r\n\}/, new: NEW_PARSEGLB, want: 1 },
  { old: "import { CONFIG } from '../src/core/config.js';" + NL, new: "import { CONFIG } from '../src/core/config.js';" + NL + "import { createRequire } from 'node:module';" + NL + NL + "const requireCjs = createRequire(import.meta.url);" + NL + "const MeshoptDecoder = requireCjs(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'meshoptimizer', 'meshopt_decoder.cjs'));" + NL + 'await MeshoptDecoder.ready; // I609 (ST-574 E88): EXT_meshopt_compression - the meshopt wasm must be ready before any decode (same wasm the browser GLTFLoader uses)' + NL, want: 1 },
  { old: 'const MAX_FILE_BYTES = 1500000; // I587', new: 'const MAX_FILE_BYTES = 1300000; // I609 (ST-574 E88) RE-PIN WITH MEASUREMENT: 1,500,000 -> 1,300,000 (compressed ship file 1,130,488 B; max non-ship enemy_phantom 163,884 B) // I587', want: 1 },
  { old: 'const { buf, json, binOff } = parseGlb(', new: 'const { buf, json, binOff, fileSize } = parseGlb(', want: 17 },
  { old: 'const { buf, json, binOff } = remaster4Bake(', new: 'const { buf, json, binOff, fileSize } = remaster4Bake(', want: 10 },
  { old: '  return { buf, json, binOff };', new: '  return { buf, json, binOff, fileSize };', want: 1 },
  { old: "assert.ok(buf.length < MAX_FILE_BYTES, 'ship.glb under the 1,500,000 B cap (I587)');", new: "assert.ok(fileSize < MAX_FILE_BYTES, 'ship.glb ' + fileSize + ' B under the 1,300,000 B cap (I609 meshopt file 1,130,488 B)');", want: 1 },
  { old: "assert.ok(buf.length < MAX_FILE_BYTES, 'asteroid_' + size + '.glb under 100 KB');", new: "assert.ok(fileSize < MAX_FILE_BYTES, 'asteroid_' + size + '.glb under 100 KB');", want: 1 },
  { old: "assert.ok(buf.length < MAX_FILE_BYTES, 'asteroid_' + size + '_B.glb under 100 KB');", new: "assert.ok(fileSize < MAX_FILE_BYTES, 'asteroid_' + size + '_B.glb under 100 KB');", want: 1 },
  { old: "assert.ok(buf.length <= 84 * 1024, 'boss.glb ' + buf.length + ' B <= 84 KB (ST-252 budget)');", new: "assert.ok(fileSize <= 18 * 1024, 'boss.glb ' + fileSize + ' B <= 18 KB (I609 meshopt 17,008 B; ST-252 budget)');", want: 1 },
  { old: "assert.ok(buf.length < MAX_FILE_BYTES, 'shield.glb under 100 KB');", new: "assert.ok(fileSize < MAX_FILE_BYTES, 'shield.glb under 100 KB');", want: 1 },
  { old: "assert.ok(buf.length < MAX_FILE_BYTES, file + '.glb under 100 KB');", new: "assert.ok(fileSize < MAX_FILE_BYTES, file + '.glb under 100 KB');", want: 1 },
  { old: "assert.ok(buf.length < MAX_FILE_BYTES, 'drone.glb under 1 MB');", new: "assert.ok(fileSize < MAX_FILE_BYTES, 'drone.glb under 1 MB');", want: 1 },
  { old: "assert.ok(buf.length < MAX_FILE_BYTES, 'arena_ring.glb under 100 KB');", new: "assert.ok(fileSize < MAX_FILE_BYTES, 'arena_ring.glb under 100 KB');", want: 1 },
  { old: "assert.ok(buf.length <= 5700, 'arena_ring.glb v3 <= 5.7 KB raw (' + buf.length + ' B); I254 4032 -> I299 5544 (COLOR_0 bake)'); // I299", new: "assert.ok(fileSize <= 5200, 'arena_ring.glb v3 <= 5.2 KB file (' + fileSize + ' B); I254 4032 -> I299 5544 (COLOR_0 bake) -> I609 5048 (meshopt)'); // I299", want: 1 },
  { old: "assert.ok(buf.length <= 96 * 1024, 'warden.glb under 96 KB (I508 re-pin 40 -> 96 KB; I593 v2 measured 64,448 B)');", new: "assert.ok(fileSize <= 49 * 1024, 'warden.glb ' + fileSize + ' B <= 49 KB (I609 meshopt 49,020 B; I508 re-pin 40 -> 96 KB; I593 v2 raw 64,448 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 28308, 'asteroid_comet.glb ' + buf.length + ' B <= 28,308 B (I554 ST-520 rock v12 re-pin WITH MEASUREMENT 20000 -> 28308; I441 v3 was [15,968])');", new: "assert.ok(fileSize <= 22732, 'asteroid_comet.glb ' + fileSize + ' B <= 22,732 B (I609 meshopt 22,052 B; I554 ST-520 rock v12 re-pin 20000 -> 28308; I441 v3 was [15,968])');", want: 1 },
  { old: "assert.ok(buf.length <= 12000, 'debris_chunk.glb ' + buf.length + ' B <= 12 KB (ST-380 budget)');", new: "assert.ok(fileSize <= 12000, 'debris_chunk.glb ' + fileSize + ' B <= 12 KB (I609 meshopt 4,632 B; ST-380 budget)');", want: 1 },
  { old: "assert.ok(buf.length <= 12000, 'debris_sliver.glb ' + buf.length + ' B <= 12 KB (ST-380 budget)');", new: "assert.ok(fileSize <= 12000, 'debris_sliver.glb ' + fileSize + ' B <= 12 KB (I609 meshopt 4,588 B; ST-380 budget)');", want: 1 },
  { old: "assert.ok(buf.length <= 228 * 1024, 'hunter under 228 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I509 227,496 B)');", new: "assert.ok(fileSize <= 106 * 1024, 'hunter under 106 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 104,884 B; I509 raw 227,496 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 210 * 1024, 'gunship under 210 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I536 215,032 B)');", new: "assert.ok(fileSize <= 106 * 1024, 'gunship under 106 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 105,444 B; I536 raw 215,032 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 204 * 1024, 'sentry under 204 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I509 203,688 B)');", new: "assert.ok(fileSize <= 89 * 1024, 'sentry under 89 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 88,660 B; I509 raw 203,688 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 310 * 1024, 'wasp under 310 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I509 post-fix 310,036 B)');", new: "assert.ok(fileSize <= 132 * 1024, 'wasp under 132 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 131,712 B; I509 raw 310,036 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 336 * 1024, 'phantom under 336 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I561 343,244 B)');", new: "assert.ok(fileSize <= 164 * 1024, 'phantom under 164 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 163,884 B; I561 raw 343,244 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 187 * 1024, 'bulwark under 187 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I535 190,584 B)');", new: "assert.ok(fileSize <= 85 * 1024, 'bulwark under 85 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 84,860 B; I535 raw 190,584 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 284 * 1024, 'hauler under 284 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I561 289,748 B)');", new: "assert.ok(fileSize <= 139 * 1024, 'hauler under 139 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 139,040 B; I561 raw 289,748 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 127 * 1024, 'sweeper under 127 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I561 129,764 B)');", new: "assert.ok(fileSize <= 55 * 1024, 'sweeper under 55 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 54,220 B; I561 raw 129,764 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 204 * 1024, 'beacon under 204 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I552 208,100 B)');", new: "assert.ok(fileSize <= 89 * 1024, 'beacon under 89 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 88,204 B; I552 raw 208,100 B)');", want: 1 },
  { old: "assert.ok(buf.length <= 126 * 1024, 'archon under 126 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I553 128,780 B)');", new: "assert.ok(fileSize <= 60 * 1024, 'archon under 60 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 58,916 B; I553 raw 128,780 B)');", want: 1 },
]);
apply('tests/assetPerf.test.js', [
  { old: 'totalFilesKB: 4328,  // [I593', new: 'totalFilesKB: 2668,  // [I609 (ST-574 E88) RE-PIN WITH MEASUREMENT 4328 -> 2668: meshopt fleet 4,431,160 -> 2,731,884 B; measured 2,667.86 KiB; [I593', want: 1 },
  { old: 'perFileKB: 1400,      // [I587', new: 'perFileKB: 1105,      // [I609 (ST-574 E88) RE-PIN WITH MEASUREMENT 1400 -> 1105: max = ship.glb 1,103.99 KB (1,130,488 B compressed); I587: ship v8 raw 1,370.02 KB]; [I587', want: 1 },
]);
apply('src/render/assetLoader.js', [
  { old: "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\n", new: "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nimport { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'; // I609 (ST-574 E88): EXT_meshopt_compression\n", want: 1 },
  { old: '  const loader = new GLTFLoader();\n', new: '  const loader = new GLTFLoader();\n  loader.setMeshoptDecoder(MeshoptDecoder); // I609 (ST-574 E88): decode the meshopt-compressed GLB buffer views\n', want: 1 },
  { old: '  function loadAll() {\n    const jobs = Object.keys(ASSETS).map((n) => loadOne(n, ASSETS[n]));', new: '  async function loadAll() {\n    await MeshoptDecoder.ready; // I609 (ST-574 E88): wasm ready before the decode burst (GLTFLoader\'s async decode also awaits it)\n    const jobs = Object.keys(ASSETS).map((n) => loadOne(n, ASSETS[n]));', want: 1 },
]);
apply('scripts/build.mjs', [
  { old: "  // I104: GLTFLoader (Blender-pass GLB assets) + its BufferGeometryUtils dep" + NL + "  'jsm/loaders/GLTFLoader.js'," + NL, new: "  // I104: GLTFLoader (Blender-pass GLB assets) + its BufferGeometryUtils dep" + NL + "  'jsm/loaders/GLTFLoader.js'," + NL + '  // I609 (ST-574 E88): meshopt decoder (EXT_meshopt_compression; ships raw - NOT in the 4-bundle VENDOR_MINIFY list; raw sha256-16 D428E73A000057C6 pinned in vendor.mjs)' + NL + "  'jsm/libs/meshopt_decoder.module.js'," + NL, want: 1 },
]);
apply('scripts/vendor.mjs', [
  { old: "console.log('vendor: three.module.js + three.core.js + three.webgpu.js + three.tsl.js + examples/jsm copied to vendor/ (r187 classic + WebGPU closure)');\n", new: "console.log('vendor: three.module.js + three.core.js + three.webgpu.js + three.tsl.js + examples/jsm copied to vendor/ (r187 classic + WebGPU closure)');\n\n// I609 (ST-574 E88): meshopt decoder raw pin (ships byte-identical to dist - not in the 4-bundle minify list)\n{\n  const b = readFileSync(join(dst, 'jsm', 'libs', 'meshopt_decoder.module.js'));\n  if (b.length !== 29256) throw new Error('vendor: jsm/libs/meshopt_decoder.module.js size ' + b.length + ' != pinned 29256');\n  const h = createHash('sha256').update(b).digest('hex').slice(0, 16).toUpperCase();\n  if (h !== 'D428E73A000057C6') throw new Error('vendor: meshopt_decoder sha256-16(raw) ' + h + ' != pinned D428E73A000057C6');\n  console.log('vendor: jsm/libs/meshopt_decoder.module.js sha256-16(raw) ' + h + ' (' + b.length + ' B)');\n}\n", want: 1 },
]);
console.log('patch609: ALL APPLIED, ' + opsDone + ' ops total');

