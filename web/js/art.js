/* art.js — drawing primitives, 3x5 pixel font, characters and room shells.
   Everything is drawn in code on a 384x224 canvas. No image files are read.
   Loaded first. Sets window.ART. */
(function (root) {
  'use strict';

  var T = 16, W = 384, H = 224, WALL_H = 48;

  var PAL = {
    // core palette (build plan)
    cream: '#f6ead9', wood: '#a87a4c', sage: '#7d9170', clay: '#c98f6b', ink: '#2a1f1a', gold: '#e2b857',
    // tints and shades of the core palette
    creamDark: '#e4d3ba', creamDeep: '#cdb99b', woodDark: '#7c5633', woodLight: '#c9a27a',
    sageDark: '#5c7052', sageLight: '#a9b99c', clayDark: '#a66e4c', goldDark: '#b88a2e',
    white: '#fbf7f0', shadow: '#1c1512',
    // old bathroom
    mint: '#b7d2c0', mintDark: '#8fb19d', almond: '#e2d0ab', almondDark: '#c4ae84', stain: '#9c8f66',
    // new bathroom
    stone: '#d6c9b8', stoneDark: '#bcad99', oak: '#e0c9a3', oakDark: '#c8ab7e', metal: '#3a3531',
    // shared
    water: '#8fb8d6', waterLight: '#c3dcec', glass: '#bcdbe6', glassLight: '#e2f1f5',
    grey: '#b8b3ab', greyDark: '#8c877f', greyLight: '#dad6cf', card: '#c9a06a', cardDark: '#a9824f',
    red: '#b5493b', teal: '#3f8c8c', lilac: '#b9a3cf', blue: '#4f7cb3', pink: '#e59aa7',
    yellow: '#e9c53f', slate: '#56616b', denim: '#48648c', screen: '#bfe0ff',
    // store accents
    hdOrange: '#e8742a', lowesNavy: '#27457a',
    skinA: '#e8b890', skinB: '#c98f62', skinC: '#f0c9a4'
  };

  function r(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /* Draw a list of rectangles [dx, dy, w, h, color] with a shared 1px ink outline.
     Every prop and character goes through this, so all sprites share one outline style. */
  function shape(ctx, ox, oy, parts, outline) {
    var i, p;
    ox = Math.round(ox); oy = Math.round(oy);
    if (outline !== false) {
      ctx.fillStyle = PAL.ink;
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (p[5] === 'flat') continue;
        ctx.fillRect(ox + p[0] - 1, oy + p[1] - 1, p[2] + 2, p[3] + 2);
      }
    }
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      ctx.fillStyle = p[4];
      ctx.fillRect(ox + p[0], oy + p[1], p[2], p[3]);
    }
  }

  /* ---------- 3x5 pixel font ---------- */
  var GLYPHS = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
    E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
    I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '111101101101111', P: '110101110100100',
    Q: '111101101111001', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111',
    '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
    '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010',
    '8': '111101111101111', '9': '111101111001110',
    "'": '010010000000000', '.': '000000000000010', '-': '000000111000000', ':': '000010000010000',
    '!': '010010010000010', '?': '110001010000010', '/': '001001010100100', '$': '011110010011110',
    ' ': '000000000000000'
  };

  function textW(str, s) { return str.length * 4 * (s || 1) - (s || 1); }

  function text(ctx, str, x, y, c, s) {
    s = s || 1;
    str = String(str).toUpperCase();
    ctx.fillStyle = c || PAL.ink;
    x = Math.round(x); y = Math.round(y);
    for (var i = 0; i < str.length; i++) {
      var g = GLYPHS[str[i]] || GLYPHS['?'];
      for (var k = 0; k < 15; k++) {
        if (g[k] === '1') ctx.fillRect(x + (i * 4 + (k % 3)) * s, y + Math.floor(k / 3) * s, s, s);
      }
    }
    return textW(str, s);
  }

  /* A small plaque with centred pixel text. Used for every sign in the game. */
  function sign(ctx, str, x, y, w, h, bg, fg, s) {
    s = s || 1;
    shape(ctx, x, y, [[0, 0, w, h, bg]]);
    text(ctx, str, x + Math.floor((w - textW(str, s)) / 2), y + Math.floor((h - 5 * s) / 2), fg || PAL.white, s);
  }

  /* ---------- characters (about 12 x 21 px) ---------- */
  var LOOKS = {
    maya: { skin: PAL.skinB, hair: '#2b1d16', style: 'bun', top: PAL.sage, bottom: PAL.slate, shoes: PAL.ink },
    david: { skin: PAL.skinA, hair: '#a9a6a0', style: 'short', beard: true, top: PAL.white, bottom: PAL.denim, shoes: '#5b4636' },
    elena: { skin: PAL.skinC, hair: '#e3d6b0', style: 'ponytail', top: PAL.pink, bareArms: true, bottom: '#d8dce2', shoes: PAL.white },
    mother: { skin: PAL.skinA, hair: '#c9c6c2', style: 'bun', top: PAL.lilac, bottom: '#6b5b4d', shoes: PAL.ink, cane: true },
    partner: { skin: PAL.skinB, hair: '#2b1d16', style: 'short', top: PAL.blue, bottom: '#6b5b4d', shoes: PAL.ink },
    associate: { skin: PAL.skinA, hair: '#5a3b26', style: 'short', top: PAL.greyLight, bottom: PAL.slate, shoes: PAL.ink, apron: PAL.hdOrange },
    shopper: { skin: PAL.skinB, hair: '#3a2a20', style: 'short', top: PAL.teal, bottom: PAL.denim, shoes: PAL.ink },
    contractor: { skin: PAL.skinA, hair: '#5a3b26', style: 'short', hat: PAL.yellow, top: PAL.red, flannel: true, bottom: PAL.denim, shoes: '#5b4636', clipboard: true }
  };

  /* x, y = top-left of the 12x21 box. dir: 'down' | 'up' | 'left' | 'right'. frame: 0 stand, 1 and 2 walk. */
  function character(ctx, look, x, y, dir, frame) {
    if (typeof look === 'string') look = LOOKS[look] || LOOKS.maya;
    dir = dir || 'down'; frame = frame || 0;
    var S = look.skin, Hc = look.hair, P = look.top, B = look.bottom, K = look.shoes;
    var arm = look.bareArms ? S : P;
    var parts = [];
    var side = dir === 'left' || dir === 'right';
    var lh = frame === 1 ? 3 : 4, rh = frame === 2 ? 3 : 4;

    // legs and shoes
    parts.push([3, 16, 3, lh, B], [6, 16, 3, rh, B]);
    parts.push([3, 16 + lh, 3, 1, K], [6, 16 + rh, 3, 1, K]);
    // torso and arms
    parts.push([3, 9, 6, 7, P]);
    if (side) {
      parts.push([5, 10, 2, 5, arm], [5, 15, 2, 1, S]);
    } else {
      parts.push([1, 9, 2, 6, arm], [9, 9, 2, 6, arm], [1, 15, 2, 1, S], [9, 15, 2, 1, S]);
    }
    if (look.flannel) parts.push([4, 10, 1, 1, PAL.shadow], [7, 12, 1, 1, PAL.shadow], [5, 14, 1, 1, PAL.shadow]);
    if (look.apron && dir !== 'up') parts.push([4, 10, 4, 7, look.apron], [7, 11, 1, 1, PAL.white]);
    // head
    parts.push([3, 3, 6, 6, S]);
    if (dir === 'up') {
      parts.push([3, 1, 6, 6, Hc], [2, 3, 1, 3, Hc], [9, 3, 1, 3, Hc]);
      if (look.style === 'ponytail') parts.push([5, 7, 2, 4, Hc]);
    } else if (side) {
      var back = dir === 'left' ? 6 : 3, eye = dir === 'left' ? 4 : 7;
      parts.push([3, 1, 6, 2, Hc], [back, 3, 3, 3, Hc], [eye, 6, 1, 1, PAL.ink]);
      if (look.beard) parts.push([dir === 'left' ? 3 : 6, 8, 3, 1, Hc]);
      if (look.style === 'ponytail') parts.push([dir === 'left' ? 9 : 1, 4, 2, 5, Hc]);
    } else {
      parts.push([3, 1, 6, 2, Hc], [2, 3, 1, 3, Hc], [9, 3, 1, 3, Hc]);
      parts.push([4, 6, 1, 1, PAL.ink], [7, 6, 1, 1, PAL.ink]);
      if (look.beard) parts.push([3, 8, 6, 1, Hc], [3, 7, 1, 1, Hc], [8, 7, 1, 1, Hc]);
      if (look.style === 'ponytail') parts.push([10, 4, 1, 5, Hc]);
    }
    if (look.style === 'bun') parts.push([5, -1, 3, 2, Hc]);
    if (look.hat) parts.push([3, 0, 6, 2, look.hat], [2, 2, 8, 1, look.hat]);
    if (look.cane) parts.push([11, 11, 1, 10, PAL.woodDark], [10, 10, 2, 1, PAL.woodDark]);
    if (look.clipboard && dir !== 'up') parts.push([9, 12, 3, 4, PAL.white], [9, 12, 3, 1, PAL.wood]);
    shape(ctx, x, y, parts);
  }

  /* Persona cards reuse the character renderer as a portrait. */
  function portrait(canvas, look) {
    canvas.width = 20; canvas.height = 28;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 20, 28);
    character(ctx, look, 4, 4, 'down', 0);
  }

  /* ---------- room shells ---------- */
  var BOUNDS = { x0: 0, x1: 24, y1: 14 };

  /* room: 'bathroom' | 'home' | 'store'. variant: 'old' | 'new' (bathroom). accent: store colour. */
  function shell(ctx, room, variant, opts) {
    opts = opts || {};
    var b = opts.bounds || BOUNDS;
    var x0 = b.x0 * T, x1 = b.x1 * T, y1 = b.y1 * T, w = x1 - x0;
    var x, y, i;
    r(ctx, 0, 0, W, H, PAL.shadow);

    if (room === 'bathroom' && variant !== 'new') {
      // dated mint wall tile over a checkered almond floor
      r(ctx, x0, 0, w, WALL_H, PAL.mint);
      for (x = x0; x < x1; x += 8) r(ctx, x, 0, 1, WALL_H, PAL.mintDark);
      for (y = 7; y < WALL_H; y += 8) r(ctx, x0, y, w, 1, PAL.mintDark);
      r(ctx, x0, 0, w, 3, PAL.mintDark);
      r(ctx, x0, WALL_H - 4, w, 4, PAL.almondDark);
      r(ctx, x0, WALL_H, w, y1 - WALL_H, PAL.almond);
      for (y = WALL_H; y < y1; y += 8) {
        for (x = x0 + (((y - WALL_H) / 8) % 2) * 8; x < x1; x += 16) r(ctx, x, y, 8, 8, PAL.creamDark);
      }
    } else if (room === 'bathroom') {
      // warm stone slabs over pale oak boards
      r(ctx, x0, 0, w, WALL_H, PAL.stone);
      for (x = x0 + 32; x < x1; x += 32) r(ctx, x, 0, 1, WALL_H, PAL.stoneDark);
      r(ctx, x0, 23, w, 1, PAL.stoneDark);
      r(ctx, x0, WALL_H - 3, w, 3, PAL.oakDark);
      r(ctx, x0, WALL_H, w, y1 - WALL_H, PAL.oak);
      for (y = WALL_H, i = 0; y < y1; y += 8, i++) {
        r(ctx, x0, y + 7, w, 1, PAL.oakDark);
        for (x = x0 + (i % 2 ? 20 : 44); x < x1; x += 48) r(ctx, x, y, 1, 7, PAL.oakDark);
      }
    } else if (room === 'home') {
      // cream wall with a wainscot over wood boards
      r(ctx, x0, 0, w, WALL_H, PAL.cream);
      r(ctx, x0, 0, w, 3, PAL.creamDark);
      r(ctx, x0, 30, w, 1, PAL.creamDeep);
      r(ctx, x0, 31, w, WALL_H - 35, PAL.creamDark);
      r(ctx, x0, WALL_H - 4, w, 4, PAL.woodDark);
      r(ctx, x0, WALL_H, w, y1 - WALL_H, PAL.woodLight);
      for (y = WALL_H, i = 0; y < y1; y += 8, i++) {
        r(ctx, x0, y + 7, w, 1, PAL.wood);
        for (x = x0 + (i % 2 ? 26 : 50); x < x1; x += 56) r(ctx, x, y, 1, 7, PAL.wood);
      }
    } else {
      // big-box store: pale wall with an accent band over polished concrete
      var accent = opts.accent || PAL.hdOrange;
      r(ctx, x0, 0, w, WALL_H, PAL.greyLight);
      r(ctx, x0, 0, w, 6, accent);
      r(ctx, x0, 6, w, 1, PAL.ink);
      r(ctx, x0, WALL_H - 4, w, 4, PAL.greyDark);
      r(ctx, x0, WALL_H, w, y1 - WALL_H, PAL.grey);
      for (x = x0 + 31; x < x1; x += 32) r(ctx, x, WALL_H, 1, y1 - WALL_H, PAL.greyDark);
      for (y = WALL_H + 31; y < y1; y += 32) r(ctx, x0, y, w, 1, PAL.greyDark);
      for (x = x0 + 12; x < x1; x += 64) r(ctx, x, WALL_H + 10, 6, 1, PAL.greyLight);
    }
    // wall-to-floor line and room edges
    r(ctx, x0, WALL_H, w, 1, PAL.ink);
    r(ctx, x0 - 2, 0, 2, y1 + 2, PAL.ink);
    r(ctx, x1, 0, 2, y1 + 2, PAL.ink);
    r(ctx, x0 - 2, y1, w + 4, 2, PAL.ink);
  }

  /* Bobbing gold diamond shown over required objects. cx = centre x, y = top of the object. */
  function marker(ctx, cx, y, t) {
    var by = Math.round(y - 9 + Math.sin((t || 0) * 4) * 1.5);
    cx = Math.round(cx);
    shape(ctx, cx, by, [[-1, 0, 2, 1, PAL.gold], [-2, 1, 4, 1, PAL.gold], [-3, 2, 6, 2, PAL.gold],
      [-2, 4, 4, 1, PAL.goldDark], [-1, 5, 2, 1, PAL.goldDark]]);
    r(ctx, cx - 1, by + 1, 1, 1, PAL.white);
  }

  root.ART = {
    T: T, W: W, H: H, WALL_H: WALL_H, PAL: PAL, BOUNDS: BOUNDS, LOOKS: LOOKS, GLYPHS: GLYPHS,
    r: r, shape: shape, text: text, textW: textW, sign: sign,
    character: character, portrait: portrait, shell: shell, marker: marker
  };
})(typeof window !== 'undefined' ? window : globalThis);
