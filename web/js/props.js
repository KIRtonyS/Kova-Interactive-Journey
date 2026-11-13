/* props.js — one drawing function per object kind.
   Each function draws inside the box (x, y, w, h) in canvas pixels.
   v = variant, t = time in seconds (for small animations), info = { accent, store }.
   Loaded after art.js. Sets window.PROPS. */
(function (root) {
  'use strict';
  var A = root.ART, P = A.PAL, S = A.shape, R = A.r;
  var K = {};

  /* ================= Bathroom ================= */

  // v: 'old' (leaking), 'removed', 'new'. Seen from above and in front: tank against the wall, bowl towards the room.
  K.toilet = function (ctx, x, y, w, h, v) {
    var cx = Math.floor(w / 2);
    if (v === 'removed') {
      S(ctx, x, y, [[cx - 5, 13, 10, 10, P.greyDark]]);
      R(ctx, x + cx - 3, y + 15, 6, 6, P.ink);
      R(ctx, x + cx - 8, y + 12, 2, 2, P.metal); R(ctx, x + cx + 6, y + 22, 2, 2, P.metal);
      return;
    }
    var body = v === 'new' ? P.white : P.almond, dark = v === 'new' ? P.greyLight : P.almondDark;
    S(ctx, x, y, [
      [cx - 9, 0, 18, 9, body], [cx - 10, 0, 20, 2, dark],
      [cx - 6, 9, 12, 16, body], [cx - 8, 11, 16, 11, body], [cx - 4, 25, 8, 2, dark]
    ]);
    R(ctx, x + cx - 5, y + 12, 10, 10, dark);
    R(ctx, x + cx - 4, y + 13, 8, 8, v === 'new' ? P.waterLight : P.water);
    R(ctx, x + cx - 3, y + 14, 3, 1, P.white);
    R(ctx, x + cx + 6, y + 4, 2, 1, P.metal);
    if (v !== 'new') { R(ctx, x + cx - 6, y + 24, 1, 3, P.stain); R(ctx, x + cx + 5, y + 23, 1, 4, P.stain); R(ctx, x + cx - 9, y + 8, 4, 1, P.stain); }
  };

  // water around the toilet base with soaked towels
  K.puddle = function (ctx, x, y, w, h, v, t) {
    var sh = Math.floor((t || 0) * 2) % 2;
    S(ctx, x, y, [[6, 3, w - 10, h - 7, P.water], [2, 6, w - 6, h - 11, P.water], [10, 1, w - 20, h - 3, P.water]], false);
    R(ctx, x + 12 + sh, y + 6, 6, 1, P.waterLight);
    R(ctx, x + w - 16 - sh, y + h - 7, 5, 1, P.waterLight);
    S(ctx, x, y, [[0, h - 10, 13, 8, P.creamDeep], [3, h - 12, 12, 6, P.creamDark]]);
    R(ctx, x + 4, y + h - 10, 10, 1, P.clay);
  };

  // v: 'old' (crowded, harsh light bar) | 'new'
  K.vanity = function (ctx, x, y, w, h, v) {
    var old = v !== 'new';
    var top = h - 24;
    // mirror on the wall
    S(ctx, x, y, [[8, 4, w - 16, 16, old ? P.almondDark : P.oakDark]]);
    R(ctx, x + 10, y + 6, w - 20, 12, P.glass);
    R(ctx, x + 12, y + 7, 3, 9, P.glassLight);
    if (old) {
      S(ctx, x, y, [[10, 0, w - 20, 3, '#fff7c2']]);
      for (var i = 0; i < 4; i++) R(ctx, x + 13 + i * 6, y + 3, 2, 1, '#fff7c2');
    } else {
      R(ctx, x + 6, y + 6, 1, 12, P.gold); R(ctx, x + w - 7, y + 6, 1, 12, P.gold);
    }
    // cabinet and counter
    S(ctx, x, y, [[0, top + 4, w, 20, old ? P.almondDark : P.oak], [0, top, w, 5, old ? P.almond : P.white]]);
    R(ctx, x + w / 2 - 1, y + top + 6, 1, 17, old ? P.stain : P.oakDark);
    R(ctx, x + w / 2 - 4, y + top + 13, 2, 3, old ? P.gold : P.metal);
    R(ctx, x + w / 2 + 3, y + top + 13, 2, 3, old ? P.gold : P.metal);
    // basin and faucet
    R(ctx, x + w / 2 - 7, y + top + 1, 14, 3, old ? P.creamDeep : P.greyLight);
    R(ctx, x + w / 2 - 1, y + top - 3, 2, 4, P.metal);
    if (old) {
      // one small sink, a crowded counter, a chip, a drip
      S(ctx, x, y, [[3, top - 5, 3, 6, P.pink], [7, top - 3, 3, 4, P.teal], [w - 7, top - 6, 3, 7, P.blue], [w - 12, top - 3, 4, 4, P.yellow]]);
      R(ctx, x + w / 2 + 5, y + top + 1, 2, 1, P.ink);
      R(ctx, x + w / 2, y + top + 2, 1, 1, P.water);
    } else {
      S(ctx, x, y, [[w - 9, top - 4, 5, 5, P.clay]]);
      R(ctx, x + w - 8, y + top - 8, 3, 4, P.sage);
    }
  };

  // v: 'old' (almond tub, curtain doing a door's job) | 'new' (freestanding)
  K.tub = function (ctx, x, y, w, h, v) {
    if (v === 'new') {
      S(ctx, x, y, [[6, 12, w - 12, h - 14, P.white], [3, 15, w - 6, h - 20, P.white]]);
      R(ctx, x + 8, y + 16, w - 16, h - 22, P.waterLight);
      R(ctx, x + 10, y + 17, w - 26, 1, P.white);
      S(ctx, x, y, [[w - 12, 2, 2, 12, P.metal], [w - 16, 2, 6, 2, P.metal]]);
      return;
    }
    S(ctx, x, y, [[0, 10, w, h - 10, P.almond]]);
    R(ctx, x + 4, y + 14, w - 8, h - 18, P.creamDark);
    R(ctx, x + 6, y + 16, w - 12, h - 22, P.cream);
    R(ctx, x, y + 9, w, 1, P.stain);
    R(ctx, x + 7, y + 9, 5, 2, P.stain); R(ctx, x + w - 20, y + 9, 8, 2, P.stain);
    R(ctx, x + w - 9, y + 17, 3, 3, P.greyDark);
    // curtain rod and curtain
    S(ctx, x, y, [[0, 0, w, 2, P.greyDark]]);
    S(ctx, x, y, [[1, 2, 26, h - 8, P.sageLight]]);
    for (var i = 0; i < 4; i++) R(ctx, x + 4 + i * 6, y + 3, 2, h - 10, P.mintDark);
    R(ctx, x + 2, y + h - 9, 24, 2, P.stain);
  };

  // cracked grout and a corner that never dries (old bathroom wall)
  K.tilewall = function (ctx, x, y, w, h, v) {
    if (v === 'new') return;
    S(ctx, x, y, [[2, 6, w - 6, h - 12, P.mintDark], [0, 12, w - 2, h - 20, P.mintDark], [6, h - 9, w - 12, 4, '#7d9c88']], false);
    var c = P.ink, pts = [[5, 8], [6, 10], [8, 12], [9, 15], [11, 17], [12, 20], [14, 22], [15, 25], [9, 16], [7, 18], [6, 21], [13, 12], [15, 10], [17, 9]];
    for (var i = 0; i < pts.length; i++) R(ctx, x + pts[i][0], y + pts[i][1], 1, 2, c);
    R(ctx, x + w - 10, y + 13, 6, 6, P.creamDeep);
    R(ctx, x + w - 9, y + 14, 4, 4, P.stain);
  };

  K.rack = function (ctx, x, y, w, h, v) {
    S(ctx, x, y, [[0, 3, w, 2, P.metal]]);
    if (v === 'new') {
      S(ctx, x, y, [[3, 4, 8, 13, P.white], [w - 11, 4, 8, 13, P.sageLight]]);
    } else {
      S(ctx, x, y, [[1, 4, 9, 14, P.creamDeep], [8, 4, 8, 9, P.pink], [w - 8, 4, 7, 16, P.creamDark]]);
      R(ctx, x + 2, y + 15, 7, 1, P.clay);
    }
  };

  K.window = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h, P.white]]);
    R(ctx, x + 2, y + 2, w - 4, h - 5, P.glass);
    R(ctx, x + 3, y + 3, 4, h - 8, P.glassLight);
    R(ctx, x + Math.floor(w / 2) - 1, y + 2, 1, h - 5, P.white);
    R(ctx, x - 1, y + h - 2, w + 2, 2, P.creamDeep);
  };

  K.toolbox = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 4, w, h - 4, P.red], [4, 0, w - 8, 2, P.metal], [4, 0, 2, 4, P.metal], [w - 6, 0, 2, 4, P.metal]]);
    R(ctx, x, y + 7, w, 1, P.ink);
    R(ctx, x + w / 2 - 2, y + 6, 4, 3, P.gold);
  };

  // shut-off valve low on the wall
  K.valve = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[4, 6, 3, h - 6, P.grey], [1, 2, 9, 5, P.red], [4, 0, 3, 3, P.metal]]);
  };

  // two knobs, one lever, a QR code instead of a manual
  K.controls = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, 10, h, P.metal]]);
    R(ctx, x + 3, y + 3, 4, 4, P.greyLight); R(ctx, x + 3, y + 10, 4, 4, P.greyLight);
    R(ctx, x + 2, y + h - 5, 7, 2, P.gold);
    S(ctx, x, y, [[12, 5, 8, 8, P.white]]);
    R(ctx, x + 13, y + 6, 2, 2, P.ink); R(ctx, x + 17, y + 6, 2, 2, P.ink); R(ctx, x + 13, y + 10, 2, 2, P.ink);
    R(ctx, x + 16, y + 9, 1, 1, P.ink); R(ctx, x + 18, y + 11, 1, 1, P.ink);
  };

  // v: 'single' (one toilet carton) | 'stack' (a delivery)
  K.boxes = function (ctx, x, y, w, h, v) {
    if (v === 'stack') {
      S(ctx, x, y, [[0, 12, w - 10, h - 12, P.card], [w - 14, 18, 14, h - 18, P.cardDark], [5, 0, w - 18, 13, P.card]]);
      R(ctx, x + 5, y + 5, w - 18, 2, P.creamDark);
      R(ctx, x, y + 20, w - 10, 2, P.creamDark);
      A.text(ctx, 'KOHLER', x + 3, y + 25, P.ink);
      R(ctx, x + w - 11, y + 22, 8, 5, P.white);
      return;
    }
    S(ctx, x, y, [[0, 4, w, h - 4, P.card]]);
    R(ctx, x, y + 10, w, 2, P.creamDark);
    R(ctx, x + w / 2 - 1, y + 4, 2, 6, P.creamDark);
    if (w >= 26) A.text(ctx, 'KOHLER', x + Math.floor((w - 23) / 2), y + 15, P.ink);
  };

  K.manual = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[1, 2, w - 2, h - 4, P.white]]);
    R(ctx, x + 3, y + 4, w - 6, 1, P.grey); R(ctx, x + 3, y + 6, w - 8, 1, P.grey);
    R(ctx, x + w - 6, y + h - 6, 3, 3, P.ink);
  };

  // stool with a phone on it
  K.stool = function (ctx, x, y, w, h, v, t) {
    S(ctx, x, y, [[2, 6, w - 4, 3, P.oak], [3, 9, 2, h - 9, P.oakDark], [w - 5, 9, 2, h - 9, P.oakDark]]);
    S(ctx, x, y, [[4, 2, w - 8, 4, P.ink]]);
    R(ctx, x + 5, y + 3, w - 10, 2, Math.floor((t || 0) * 1.5) % 2 ? P.screen : P.white);
  };

  K.plant = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[3, h - 8, w - 6, 8, P.clay], [2, h - 9, w - 4, 2, P.clayDark],
      [4, h - 20, 4, 12, P.sage], [8, h - 24, 4, 16, P.sageDark], [1, h - 15, 4, 6, P.sageDark], [11, h - 17, 4, 7, P.sage]]);
  };

  K.mat = function (ctx, x, y, w, h, v) {
    S(ctx, x, y, [[0, 0, w, h, v === 'new' ? P.stoneDark : P.sageLight]], false);
    R(ctx, x + 2, y + 2, w - 4, 1, P.white); R(ctx, x + 2, y + h - 3, w - 4, 1, P.white);
  };

  K.door = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h, P.woodDark]]);
    R(ctx, x + 2, y + 2, w - 4, h - 2, P.wood);
    R(ctx, x + 5, y + 5, w - 10, Math.floor(h / 2) - 7, P.woodLight);
    R(ctx, x + 5, y + Math.floor(h / 2) + 2, w - 10, Math.floor(h / 2) - 6, P.woodLight);
    R(ctx, x + w - 6, y + Math.floor(h / 2), 2, 2, P.gold);
  };

  K.basket = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[1, 4, w - 2, h - 4, P.woodLight], [0, 3, w, 2, P.wood], [3, 0, w - 7, 4, P.creamDeep]]);
    for (var i = 3; i < w - 2; i += 3) R(ctx, x + i, y + 6, 1, h - 7, P.wood);
  };

  /* ================= Home ================= */

  K.sofa = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, 13, P.sage], [0, 6, 7, h - 6, P.sageDark], [w - 7, 6, 7, h - 6, P.sageDark],
      [7, 13, w - 14, h - 17, P.sageLight], [7, h - 4, w - 14, 4, P.sageDark]]);
    R(ctx, x + Math.floor(w / 2), y + 13, 1, h - 17, P.sage);
    R(ctx, x + 10, y + 3, 12, 8, P.clay);
  };

  K.table = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h - 6, P.wood], [0, h - 6, w, 3, P.woodDark], [1, h - 3, 3, 3, P.woodDark], [w - 4, h - 3, 3, 3, P.woodDark]]);
    R(ctx, x + 2, y + 1, w - 4, 1, P.woodLight);
  };

  K.phone = function (ctx, x, y, w, h, v, t) {
    var cx = x + Math.floor(w / 2) - 4, cy = y + Math.floor(h / 2) - 5;
    S(ctx, cx, cy, [[0, 0, 8, 11, P.ink]]);
    R(ctx, cx + 1, cy + 1, 6, 8, Math.floor((t || 0) * 1.5) % 2 ? P.screen : P.white);
    R(ctx, cx + 2, cy + 3, 4, 1, P.blue);
  };

  K.tablet = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 2, w, h - 4, P.ink]]);
    R(ctx, x + 1, y + 3, w - 2, h - 6, P.cream);
    R(ctx, x + 2, y + 4, 4, 3, P.sage); R(ctx, x + 7, y + 4, 3, 3, P.clay); R(ctx, x + 2, y + h - 6, 8, 2, P.glass);
  };

  K.rug = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h, P.clay], [3, 3, w - 6, h - 6, P.cream], [6, 6, w - 12, h - 12, P.creamDark]], false);
    for (var i = 2; i < w; i += 4) { R(ctx, x + i, y - 1, 1, 1, P.clayDark); R(ctx, x + i, y + h, 1, 1, P.clayDark); }
  };

  K.desk = function (ctx, x, y, w, h, v, t) {
    S(ctx, x, y, [[0, 12, w, h - 24, P.wood], [0, h - 12, w, 12, P.woodDark]]);
    R(ctx, x + 2, y + 13, w - 4, 1, P.woodLight);
    R(ctx, x + 4, y + h - 9, 12, 6, P.wood); R(ctx, x + w - 16, y + h - 9, 12, 6, P.wood);
    // laptop
    S(ctx, x, y, [[w / 2 - 9, 0, 18, 12, P.ink], [w / 2 - 10, 12, 20, 3, P.grey]]);
    R(ctx, x + w / 2 - 8, y + 1, 16, 10, Math.floor((t || 0) * 1.2) % 2 ? P.screen : P.glassLight);
    R(ctx, x + w / 2 - 6, y + 3, 9, 1, P.blue); R(ctx, x + w / 2 - 6, y + 5, 12, 1, P.grey); R(ctx, x + w / 2 - 6, y + 7, 7, 1, P.grey);
    // mug
    S(ctx, x, y, [[w - 9, 9, 4, 4, P.clay]]);
  };

  K.chair = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[1, 0, w - 2, 8, P.woodDark], [0, 8, w, 6, P.sage], [1, 14, 2, h - 14, P.woodDark], [w - 3, 14, 2, h - 14, P.woodDark]]);
  };

  K.bookshelf = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h, P.woodDark]]);
    var cols = [P.red, P.sage, P.blue, P.gold, P.clay, P.cream, P.teal, P.lilac];
    for (var row = 0; row < 3; row++) {
      var sy = y + 3 + row * 14;
      R(ctx, x + 2, sy, w - 4, 11, P.shadow);
      for (var i = 0, bx = x + 3; bx < x + w - 5; i++) {
        var bw = 2 + ((i + row) % 2), bh = 8 + ((i * 3 + row) % 3);
        R(ctx, bx, sy + 11 - bh, bw, bh, cols[(i + row * 3) % cols.length]);
        bx += bw + 1;
      }
    }
  };

  // counter on the left, fridge on the right. v: 'card' shows the plumber's card on the fridge.
  K.fridge = function (ctx, x, y, w, h, v) {
    var fw = 22, cw = w - fw;
    S(ctx, x, y, [[0, h - 28, cw, 28, P.creamDark], [0, h - 32, cw, 5, P.stone]]);
    R(ctx, x + Math.floor(cw / 2), y + h - 26, 1, 25, P.creamDeep);
    R(ctx, x + Math.floor(cw / 2) - 4, y + h - 18, 2, 3, P.metal); R(ctx, x + Math.floor(cw / 2) + 3, y + h - 18, 2, 3, P.metal);
    S(ctx, x, y, [[4, h - 39, 7, 7, P.clay], [5, h - 42, 5, 3, P.sage]]);
    S(ctx, x, y, [[cw, 0, fw, h, P.greyLight]]);
    R(ctx, x + cw, y + 18, fw, 1, P.greyDark);
    R(ctx, x + cw + 2, y + 6, 1, 9, P.greyDark); R(ctx, x + cw + 2, y + 22, 1, 14, P.greyDark);
    R(ctx, x + cw + 8, y + 24, 5, 4, P.yellow);
    if (v === 'card') { S(ctx, x, y, [[cw + 9, 8, 8, 6, P.white]]); R(ctx, x + cw + 10, y + 10, 5, 1, P.blue); R(ctx, x + cw + 10, y + 12, 3, 1, P.grey); }
  };

  // v: 'board' (a year of tearsheets and paint chips) | 'frame' (a framed picture)
  K.moodboard = function (ctx, x, y, w, h, v) {
    if (v !== 'board') {
      S(ctx, x, y, [[4, 2, w - 8, h - 6, P.woodDark]]);
      R(ctx, x + 6, y + 4, w - 12, h - 10, P.glass);
      R(ctx, x + 6, y + h - 12, w - 12, 6, P.sageLight);
      R(ctx, x + 10, y + h - 15, 8, 4, P.sage);
      return;
    }
    S(ctx, x, y, [[0, 0, w, h, '#c9a57b']]);
    var c = [P.white, P.sageLight, P.stone, P.cream, P.clay, P.oak, P.glass, P.white];
    var pos = [[2, 2, 9, 11], [13, 3, 8, 7], [23, 2, 10, 12], [3, 15, 7, 9], [12, 12, 9, 12], [24, 16, 5, 5], [30, 16, 5, 5], [w - 9, 4, 6, 8]];
    for (var i = 0; i < pos.length; i++) {
      if (pos[i][0] + pos[i][2] > w - 1 || pos[i][1] + pos[i][3] > h - 1) continue;
      R(ctx, x + pos[i][0], y + pos[i][1], pos[i][2], pos[i][3], c[i]);
      R(ctx, x + pos[i][0] + 1, y + pos[i][1], 1, 1, P.red);
    }
  };

  K.calendar = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h, P.white], [0, 0, w, 4, P.red]]);
    for (var j = 0; j < 3; j++) for (var i = 0; i < 4; i++) R(ctx, x + 2 + i * 3, y + 6 + j * 4, 2, 2, (i + j) % 3 ? P.greyLight : P.grey);
  };

  K.lamp = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[1, 0, w - 2, 9, '#f3dfa8'], [Math.floor(w / 2) - 1, 9, 2, h - 12, P.metal], [2, h - 3, w - 4, 3, P.metal]]);
    R(ctx, x + 2, y + 7, w - 4, 2, '#fff7c2');
  };

  // budget notebook: a number written, crossed out, written again
  K.notebook = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[1, 1, w - 2, h - 2, P.white]]);
    R(ctx, x + 1, y + 1, 2, h - 2, P.blue);
    R(ctx, x + 5, y + 3, 5, 1, P.grey); R(ctx, x + 4, y + 4, 7, 1, P.red);
    R(ctx, x + 5, y + 7, 6, 1, P.ink); R(ctx, x + 5, y + 9, 4, 1, P.grey);
  };

  K.crutch = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[1, 0, 6, 2, P.grey], [2, 2, 1, h - 2, P.greyDark], [5, 2, 1, h - 10, P.greyDark], [2, 12, 4, 1, P.greyDark], [3, h - 9, 2, 9, P.greyDark]]);
  };

  K.toys = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 6, 6, 6, P.red], [5, 2, 6, 6, P.blue], [14, 8, 6, 6, P.yellow], [22, 3, 5, 5, P.teal], [11, 13, 8, 4, P.sage]]);
    R(ctx, x + 23, y + 4, 2, 2, P.white);
  };

  // training corner: a weights rack, a kettlebell and a log on a clipboard
  K.training = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[w - 20, 2, 2, h - 2, P.greyDark], [w - 2, 2, 2, h - 2, P.greyDark], [w - 20, h - 3, 20, 3, P.greyDark]]);
    var ends = [P.teal, P.clay, P.sageDark];
    for (var i = 0; i < 3; i++) {
      var dy = 4 + i * 8;
      R(ctx, x + w - 18, y + dy + 4, 16, 1, P.greyDark);
      S(ctx, x, y, [[w - 16, dy, 3, 5, ends[i]], [w - 7, dy, 3, 5, ends[i]]]);
      R(ctx, x + w - 13, y + dy + 2, 6, 1, P.grey);
    }
    S(ctx, x, y, [[12, h - 8, 7, 7, P.metal], [14, h - 11, 3, 3, P.metal]]);
    R(ctx, x + 15, y + h - 10, 1, 1, P.grey);
    S(ctx, x, y, [[0, h - 16, 9, 12, P.white]]);
    R(ctx, x + 2, y + h - 14, 5, 1, P.grey); R(ctx, x + 2, y + h - 12, 4, 1, P.sage);
    R(ctx, x + 2, y + h - 10, 5, 1, P.grey); R(ctx, x + 2, y + h - 8, 3, 1, P.clay);
  };

  K.trainmat = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h, '#6b8fa3']], false);
    R(ctx, x + 2, y + 2, w - 4, 1, '#89a9ba'); R(ctx, x + 2, y + h - 3, w - 4, 1, '#89a9ba');
  };

  /* ================= Store ================= */

  K.banner = function (ctx, x, y, w, h, v, t, info) {
    A.sign(ctx, (info && info.store) || 'STORE', x, y, w, h, (info && info.accent) || P.hdOrange, P.white, 2);
  };

  K.aislesign = function (ctx, x, y, w, h, v) {
    R(ctx, x + 3, y - 4, 1, 4, P.greyDark); R(ctx, x + w - 4, y - 4, 1, 4, P.greyDark);
    A.sign(ctx, v || 'BATH', x, y, w, h, P.white, P.ink, 1);
  };

  function cartons(ctx, x, y, w, rowH, seed) {
    var cols = [P.card, P.cardDark, P.white, P.card, P.creamDeep, P.card, P.glass, P.cardDark];
    for (var i = 0, bx = x; bx < x + w - 5; i++) {
      var bw = 7 + ((i * 5 + seed) % 5), bh = rowH - 2 - ((i + seed) % 3);
      if (bx + bw > x + w) bw = x + w - bx;
      R(ctx, bx, y + rowH - bh, bw, bh, cols[(i + seed) % cols.length]);
      R(ctx, bx, y + rowH - bh, 1, bh, P.ink);
      R(ctx, bx + 2, y + rowH - bh + 2, Math.max(1, bw - 4), 2, (i + seed) % 3 ? P.blue : P.red);
      bx += bw;
    }
  }

  // racks of boxed products
  K.shelves = function (ctx, x, y, w, h, v, t, info) {
    var beam = (info && info.accent) || P.hdOrange;
    S(ctx, x, y, [[0, 0, w, h, P.greyDark]]);
    var rows = Math.max(1, Math.floor((h - 2) / 13));
    for (var i = 0; i < rows; i++) {
      var ry = y + 1 + i * 13;
      R(ctx, x + 1, ry, w - 2, 11, P.shadow);
      cartons(ctx, x + 2, ry, w - 4, 11, i * 3 + (w % 7));
      R(ctx, x, ry + 11, w, 2, beam);
    }
    R(ctx, x, y, 2, h, P.metal); R(ctx, x + w - 2, y, 2, h, P.metal);
  };

  // v: 'toilets' (eleven toilets, some boxed) | 'bath' (tub and vanity, half boxed, no room around them)
  K.display = function (ctx, x, y, w, h, v) {
    var i;
    S(ctx, x, y, [[0, h - 8, w, 8, P.greyLight], [0, 0, w, 16, P.greyDark]]);
    R(ctx, x, y + h - 8, w, 1, P.white);
    if (v === 'bath') {
      cartons(ctx, x + 2, y + 2, w - 4, 13, 2);
      S(ctx, x, y, [[4, h - 22, 34, 14, P.white]]);
      R(ctx, x + 7, y + h - 19, 28, 8, P.waterLight);
      S(ctx, x, y, [[44, h - 24, 22, 16, P.oak], [43, h - 26, 24, 3, P.white]]);
      S(ctx, x, y, [[72, h - 24, 20, 16, P.card]]);
      R(ctx, x + 72, y + h - 18, 20, 2, P.creamDark);
      for (i = 0; i < 3; i++) R(ctx, x + 8 + i * 34, y + h - 6, 7, 4, P.yellow);
      return;
    }
    // five boxed on the upper shelf, six out on the platform
    for (i = 0; i < 5; i++) {
      R(ctx, x + 4 + i * 18, y + 3, 14, 12, i % 2 ? P.card : P.cardDark);
      R(ctx, x + 4 + i * 18, y + 3, 1, 12, P.ink);
      R(ctx, x + 7 + i * 18, y + 6, 8, 2, i % 2 ? P.blue : P.white);
    }
    for (i = 0; i < 6; i++) {
      var tx = x + 3 + i * 15, body = i % 3 === 1 ? P.almond : P.white;
      S(ctx, tx, y + h - 24, [[1, 0, 9, 6, body], [2, 6, 7, 9, body], [3, 15, 5, 2, P.greyLight]]);
      R(ctx, tx + 4, y + h - 17, 3, 5, P.greyLight);
      R(ctx, tx + 2, y + h - 5, 7, 3, P.yellow);
    }
  };

  // Kohler end cap. v: 'toilet' (one boxed toilet) | 'bath' (a tub and vanity between other brands)
  K.endcap = function (ctx, x, y, w, h, v) {
    S(ctx, x, y, [[0, 0, w, h - 6, P.white], [0, h - 6, w, 6, P.greyLight]]);
    A.sign(ctx, 'KOHLER', x + 4, y + 2, w - 8, 9, P.ink, P.white, 1);
    if (v === 'bath') {
      S(ctx, x, y, [[3, 14, 10, h - 22, P.card], [w - 13, 14, 10, h - 22, P.cardDark]]);
      S(ctx, x, y, [[15, h - 20, w - 30, 12, P.white]]);
      R(ctx, x + 17, y + h - 18, w - 34, 6, P.waterLight);
      S(ctx, x, y, [[17, 14, w - 34, 8, P.oak]]);
    } else {
      S(ctx, x, y, [[9, 14, w - 18, h - 22, P.card]]);
      R(ctx, x + 9, y + 21, w - 18, 2, P.creamDark);
      R(ctx, x + 13, y + 26, w - 26, 7, P.white);
      R(ctx, x + 15, y + 28, w - 30, 1, P.blue); R(ctx, x + 15, y + 30, w - 34, 1, P.grey);
    }
    S(ctx, x, y, [[w - 14, h - 14, 12, 7, P.yellow]]);
    R(ctx, x + w - 12, y + h - 12, 8, 1, P.ink); R(ctx, x + w - 12, y + h - 10, 5, 1, P.ink);
  };

  // shelf of three boxes with price tags
  K.shelf3 = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, h - 9, w, 9, P.greyLight], [0, 0, 2, h, P.metal], [w - 2, 0, 2, h, P.metal]]);
    var cols = [[P.white, P.blue], [P.card, P.sage], [P.cardDark, P.red]];
    var bw = Math.floor((w - 16) / 3);
    for (var i = 0; i < 3; i++) {
      var bx = 5 + i * (bw + 3);
      S(ctx, x, y, [[bx, 2, bw, h - 12, cols[i][0]]]);
      R(ctx, x + bx + 2, y + 6, bw - 4, 4, cols[i][1]);
      R(ctx, x + bx + 2, y + 13, bw - 6, 1, P.grey);
      R(ctx, x + bx + 3, y + h - 7, bw - 6, 5, P.yellow);
      R(ctx, x + bx + 5, y + h - 5, bw - 11, 1, P.ink);
    }
  };

  // layout and fixtures board: three ways to fill one bathroom
  K.board = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 0, w, h - 8, P.white], [3, h - 8, 3, 8, P.metal], [w - 6, h - 8, 3, 8, P.metal]]);
    var pw = Math.floor((w - 16) / 3), tones = [[P.stone, P.white], [P.sageLight, P.oak], [P.creamDark, P.grey]];
    for (var i = 0; i < 3; i++) {
      var px = x + 4 + i * (pw + 4);
      R(ctx, px, y + 3, pw, h - 16, tones[i][0]);
      R(ctx, px + 2, y + 6, pw - 9, 5, tones[i][1]);
      R(ctx, px + pw - 6, y + 5, 4, 8, tones[i][1]);
      R(ctx, px + 2, y + h - 18, pw - 4, 3, P.yellow);
      R(ctx, px, y + 3, pw, 1, P.ink); R(ctx, px, y + 3, 1, h - 16, P.ink); R(ctx, px + pw - 1, y + 3, 1, h - 16, P.ink); R(ctx, px, y + h - 14, pw, 1, P.ink);
    }
  };

  K.prodesk = function (ctx, x, y, w, h, v, t, info) {
    var accent = (info && info.accent) || P.lowesNavy;
    S(ctx, x, y, [[0, 0, w, 9, P.woodLight], [0, 9, w, h - 9, P.greyLight]]);
    R(ctx, x, y + 9, w, 3, accent);
    A.sign(ctx, 'PRO DESK', x + Math.floor((w - 40) / 2), y + 15, 40, 9, accent, P.white, 1);
    S(ctx, x, y, [[6, -6, 10, 8, P.ink]]);
    R(ctx, x + 7, y - 5, 8, 5, P.screen);
    S(ctx, x, y, [[w - 18, -2, 10, 4, P.white]]);
  };

  K.cart = function (ctx, x, y, w, h, v, t, info) {
    var accent = (info && info.accent) || P.hdOrange;
    S(ctx, x, y, [[2, 2, w - 6, h - 9, P.grey], [w - 4, 0, 3, 3, accent], [3, h - 5, 3, 3, P.ink], [w - 9, h - 5, 3, 3, P.ink]]);
    for (var i = 4; i < w - 6; i += 3) R(ctx, x + i, y + 3, 1, h - 11, P.greyDark);
    R(ctx, x + 2, y + 6, w - 6, 1, P.greyDark);
    S(ctx, x, y, [[5, -4, 10, 8, P.card]]);
  };

  K.exitdoors = function (ctx, x, y, w, h) {
    S(ctx, x, y, [[0, 10, w, h - 10, P.metal]]);
    R(ctx, x + 2, y + 12, Math.floor(w / 2) - 3, h - 12, P.glass);
    R(ctx, x + Math.floor(w / 2) + 1, y + 12, Math.floor(w / 2) - 3, h - 12, P.glass);
    R(ctx, x + 4, y + 14, 3, h - 18, P.glassLight); R(ctx, x + Math.floor(w / 2) + 3, y + 14, 3, h - 18, P.glassLight);
    A.sign(ctx, 'EXIT', x + Math.floor((w - 22) / 2), y, 22, 9, P.red, P.white, 1);
  };

  /* An NPC is drawn with the character renderer. look comes from the room item. */
  K.npc = function (ctx, x, y, w, h, v, t, info) {
    var look = A.LOOKS[info && info.look] || A.LOOKS.shopper;
    if (info && info.look === 'associate') {
      look = Object.assign({}, look, { apron: info.accent || P.hdOrange });
    }
    A.character(ctx, look, x + Math.floor((w - 12) / 2), y + h - 21, 'down', 0);
  };

  function draw(ctx, kind, x, y, w, h, v, t, info) {
    var fn = K[kind];
    if (!fn) { R(ctx, x, y, w, h, '#ff00ff'); return false; }
    fn(ctx, Math.round(x), Math.round(y), Math.round(w), Math.round(h), v, t || 0, info || {});
    return true;
  }

  root.PROPS = { kinds: K, draw: draw };
})(typeof window !== 'undefined' ? window : globalThis);
