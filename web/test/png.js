/* Minimal PNG reader and writer for the art build script. Dev-only, Node built-ins only.
   Reads 8-bit PNGs (palette, RGB, RGBA, grey, grey+alpha; not interlaced) into RGBA. Writes RGBA. */
'use strict';
const zlib = require('node:zlib');
const fs = require('node:fs');

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return buf => { let c = -1; for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
})();

/* Width and height from the header only. */
function size(file) {
  const b = fs.readFileSync(file);
  if (!b.subarray(0, 8).equals(SIG)) throw new Error('not a PNG: ' + file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function read(file) {
  const b = fs.readFileSync(file);
  if (!b.subarray(0, 8).equals(SIG)) throw new Error('not a PNG: ' + file);
  let pos = 8, w = 0, h = 0, depth = 0, type = 0, plte = null, trns = null;
  const idat = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos), name = b.toString('latin1', pos + 4, pos + 8), data = b.subarray(pos + 8, pos + 8 + len);
    if (name === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; if (data[12]) throw new Error('interlaced PNG: ' + file); }
    else if (name === 'PLTE') plte = data;
    else if (name === 'tRNS') trns = data;
    else if (name === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const packed = depth < 8;                       // 1, 2 or 4 bits per pixel: palette or grey only
  if (depth > 8 || (packed && type !== 3 && type !== 0)) throw new Error('unsupported PNG (' + file + ': ' + depth + '-bit, colour type ' + type + ')');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = packed ? Math.ceil(w * depth / 8) : w * ch;
  let px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[y * stride + x - ch] : 0, up = y ? px[(y - 1) * stride + x] : 0, ul = y && x >= ch ? px[(y - 1) * stride + x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - ul, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - ul); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul; }
      px[y * stride + x] = v & 255;
    }
  }
  if (packed) {                                   // unpack to one sample per byte
    const un = Buffer.alloc(w * h), mask = (1 << depth) - 1, scale = type === 0 ? 255 / mask : 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const bit = x * depth, byte = px[y * stride + (bit >> 3)];
        un[y * w + x] = Math.round(((byte >> (8 - depth - (bit & 7))) & mask) * scale);
      }
    }
    px = un;
  }
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    let r, g, bl, al = 255;
    if (type === 3) { const k = px[i]; r = plte[k * 3]; g = plte[k * 3 + 1]; bl = plte[k * 3 + 2]; if (trns && k < trns.length) al = trns[k]; }
    else if (type === 6) { r = px[i * 4]; g = px[i * 4 + 1]; bl = px[i * 4 + 2]; al = px[i * 4 + 3]; }
    else if (type === 2) { r = px[i * 3]; g = px[i * 3 + 1]; bl = px[i * 3 + 2]; }
    else if (type === 4) { r = g = bl = px[i * 2]; al = px[i * 2 + 1]; }
    else { r = g = bl = px[i]; }
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = bl; out[i * 4 + 3] = al;
  }
  return { w, h, data: out };
}

function chunk(name, data) {
  const head = Buffer.alloc(8); head.writeUInt32BE(data.length, 0); head.write(name, 4, 'latin1');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function write(file, img) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(img.h * (img.w * 4 + 1));
  for (let y = 0; y < img.h; y++) img.data.copy(raw, y * (img.w * 4 + 1) + 1, y * img.w * 4, (y + 1) * img.w * 4);
  fs.writeFileSync(file, Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

function blank(w, h) { return { w, h, data: Buffer.alloc(w * h * 4) }; }

/* Alpha-over: draws the sw x sh region of src at (sx, sy) onto dst at (dx, dy). */
function blit(dst, src, dx, dy, sx, sy, sw, sh) {
  dx = dx || 0; dy = dy || 0; sx = sx || 0; sy = sy || 0; sw = sw == null ? src.w : sw; sh = sh == null ? src.h : sh;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const tx = dx + x, ty = dy + y;
      if (tx < 0 || ty < 0 || tx >= dst.w || ty >= dst.h) continue;
      const s = ((sy + y) * src.w + sx + x) * 4, d = (ty * dst.w + tx) * 4, a = src.data[s + 3] / 255;
      if (!a) continue;
      const da = dst.data[d + 3] / 255, oa = a + da * (1 - a);
      for (let c = 0; c < 3; c++) dst.data[d + c] = Math.round((src.data[s + c] * a + dst.data[d + c] * da * (1 - a)) / oa);
      dst.data[d + 3] = Math.round(oa * 255);
    }
  }
  return dst;
}

const hex = c => { const n = parseInt(c.replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

/* Replaces each colour of `from` with the colour at the same position in `to` (lists of "#rrggbb").
   Returns how many pixels changed. */
function recolor(img, from, to) {
  const map = new Map();
  from.forEach((c, i) => { const [r, g, b] = hex(c); map.set((r << 16) | (g << 8) | b, hex(to[i])); });
  let n = 0;
  for (let i = 0; i < img.w * img.h; i++) {
    if (!img.data[i * 4 + 3]) continue;
    const t = map.get((img.data[i * 4] << 16) | (img.data[i * 4 + 1] << 8) | img.data[i * 4 + 2]);
    if (t) { img.data[i * 4] = t[0]; img.data[i * 4 + 1] = t[1]; img.data[i * 4 + 2] = t[2]; n++; }
  }
  return n;
}

/* The colours in use, most frequent first: [{ hex, n }]. */
function colors(img) {
  const m = new Map();
  for (let i = 0; i < img.w * img.h; i++) {
    if (!img.data[i * 4 + 3]) continue;
    const k = '#' + ((1 << 24) | (img.data[i * 4] << 16) | (img.data[i * 4 + 1] << 8) | img.data[i * 4 + 2]).toString(16).slice(1);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return Array.from(m, ([h, n]) => ({ hex: h, n })).sort((a, b) => b.n - a.n);
}

/* Fills a rectangle. colour is "#rrggbb" or "rgba(r,g,b,a)"; a translucent colour is blended over what is there. */
function fill(img, x, y, w, h, colour) {
  let r, g, b, a = 1;
  const m = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(colour);
  if (m) { r = +m[1]; g = +m[2]; b = +m[3]; a = +m[4]; } else { [r, g, b] = hex(colour); }
  for (let yy = Math.max(0, y); yy < Math.min(img.h, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(img.w, x + w); xx++) {
      const i = (yy * img.w + xx) * 4, da = img.data[i + 3] / 255, oa = a + da * (1 - a);
      if (!oa) { img.data[i + 3] = 0; continue; }
      img.data[i] = Math.round((r * a + img.data[i] * da * (1 - a)) / oa);
      img.data[i + 1] = Math.round((g * a + img.data[i + 1] * da * (1 - a)) / oa);
      img.data[i + 2] = Math.round((b * a + img.data[i + 2] * da * (1 - a)) / oa);
      img.data[i + 3] = Math.round(oa * 255);
    }
  }
}

module.exports = { size, read, write, blank, blit, recolor, colors, fill };
