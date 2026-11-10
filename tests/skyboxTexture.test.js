// I212: skybox texture audit (ST-212, cgs-dev-story). Pure node - the
// Blender-generated equirect PNG in assets/ must be a valid PNG with the
// expected 2:1 dimensions and under the size budget so the dist build stays
// within the adopted build budget (<=2 MB raw / <=550 KB gzip).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const PNG_MAGIC = 0x89504e47;

test('skybox_equirect.png: valid PNG, 1024x512 (2:1 equirect), under size budget (I212)', () => {
  const buf = fs.readFileSync(path.join(ASSET_DIR, 'skybox_equirect.png'));
  assert.equal(buf.readUInt32BE(0), PNG_MAGIC, 'PNG magic bytes');
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR', 'IHDR is the first chunk');
  assert.equal(buf.readUInt32BE(16), 1024, 'width 1024');
  assert.equal(buf.readUInt32BE(20), 512, 'height 512');
  assert.ok(buf.length <= 300 * 1024, 'size ' + buf.length + ' <= 300 KB');
});
