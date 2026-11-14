/* Dev tool: writes an enlarged copy of a sprite sheet with a tile grid, to read tile coordinates from.
   node web/test/sheet-grid.js <sheet.png> <out.png> [scale=3] [tile=32] [crop x y w h]
   Grid lines are red; every fifth line is yellow. Column and row numbers start at 0. */
'use strict';
const P = require('./png.js');
const [src, out, sc = '3', tile = '32', cx, cy, cw, ch] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node sheet-grid.js <sheet.png> <out.png> [scale] [tile]'); process.exit(1); }
const S = +sc, T = +tile;
let img = P.read(src);
if (cw) img = P.blit(P.blank(+cw, +ch), img, 0, 0, +cx, +cy, +cw, +ch);      // optional crop: x y w h (keep them multiples of the tile)
const big = P.blank(img.w * S + 1, img.h * S + 1);
const put = (x, y, r, g, b) => { const i = (y * big.w + x) * 4; big.data[i] = r; big.data[i + 1] = g; big.data[i + 2] = b; big.data[i + 3] = 255; };
for (let y = 0; y < big.h; y++) {
  for (let x = 0; x < big.w; x++) {
    const sx = Math.min(img.w - 1, Math.floor(x / S)), sy = Math.min(img.h - 1, Math.floor(y / S)), i = (sy * img.w + sx) * 4;
    const a = img.data[i + 3] / 255, chk = ((Math.floor(x / 12) + Math.floor(y / 12)) % 2) ? 200 : 170;   // checkerboard under transparency
    put(x, y, Math.round(img.data[i] * a + chk * (1 - a)), Math.round(img.data[i + 1] * a + chk * (1 - a)), Math.round(img.data[i + 2] * a + chk * (1 - a)));
    const gx = x % (T * S) === 0, gy = y % (T * S) === 0;
    if (gx || gy) {
      const fifth = (gx && (x / (T * S)) % 5 === 0) || (gy && (y / (T * S)) % 5 === 0);
      if (fifth) put(x, y, 255, 220, 0); else put(x, y, 230, 40, 40);
    }
  }
}
P.write(out, big);
console.log(out, big.w + 'x' + big.h, 'cols ' + Math.ceil(img.w / T) + ', rows ' + Math.ceil(img.h / T));
