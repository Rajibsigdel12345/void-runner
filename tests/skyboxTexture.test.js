// I212 (I230): skybox texture audit (ST-212, ST-226, cgs-dev-story). Pure node -
// the Blender-generated equirect JPEG in assets/ must be a valid JPEG with the
// expected 2:1 dimensions and under the size budget so the dist build stays
// within the adopted build budget (<=2 MB raw / <=550 KB gzip). I230 swapped the
// I212 1024x512 PNG for a 1024x512 JPEG: the layered nebula + dense starfield is
// high-frequency texture that PNG cannot compress (679 KB at 1024x512), while the
// JPEG lands at ~73 KB (net +32 KB raw vs the 41.2 KB PNG, within the ST-226
// budget of net delta <= 40 KB).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// Walk JPEG marker segments to the first SOF (0xC0-0xCF, minus DHT/JPG/SOF variants)
// and read the big-endian height/width that follow the precision byte.
function jpegSof(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      throw new Error('bad JPEG marker at ' + i);
    }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('no SOF segment found');
}

test('skybox_equirect.jpg: valid JPEG, 1024x512 (2:1 equirect), under size budget (I212, I230)', () => {
  const buf = fs.readFileSync(path.join(ASSET_DIR, 'skybox_equirect.jpg'));
  assert.equal(buf.readUInt32BE(0) >>> 8, 0xffd8ff, 'JPEG SOI magic bytes');
  const sof = jpegSof(buf);
  assert.equal(sof.w, 1024, 'width 1024');
  assert.equal(sof.h, 512, 'height 512');
  assert.ok(buf.length <= 120 * 1024, 'size ' + buf.length + ' <= 120 KB');
});
