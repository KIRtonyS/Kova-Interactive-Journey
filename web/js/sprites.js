/* sprites.js — picture files: which ones the game uses, and how they are shown.

   Two kinds of pictures:
     rooms    a painted picture of a whole room (assets/rooms/), made by the team. The game draws the people
              and the few objects that change on top of it.
     people   one walk sheet per person (assets/lpc/chars/), built from Liberated Pixel Cup art by
              test/build-art.js. See assets/CREDITS.md.

   The canvas is twice as fine as the game's own coordinates (SCALE = 2): one game pixel is 2 x 2 screen pixels.

   All or nothing: pictures are used only when every file below has loaded. If one is missing, or the page
   address ends in ?art=drawn, the whole game uses the code-drawn art in art.js and props.js instead.

   Loaded after art.js. Sets window.SPRITES. */
(function (root) {
  'use strict';
  var SCALE = 2;
  var CHAR = { fw: 64, fh: 64, cols: 9, rows: { up: 0, left: 1, down: 2, right: 3 }, stride: 0.09 };
  var LOOKS = ['maya', 'david', 'elena', 'mother', 'partner', 'associate', 'associate_lowes', 'shopper', 'contractor'];

  var files = {
    interior: 'assets/lpc/tiles/interior.png',        // LPC walls and wooden furniture (bookshelf, desk, small table)
    furniture: 'assets/lpc/tiles/furniture.png',      // LPC windows, plants, lamps, sofa, chairs
    inside: 'assets/lpc/tiles/inside.png',            // LPC wood floor and door
    bath: 'assets/lpc/tiles/bathroom.png',            // LPC bathroom: tiled wall, mirror and counter, sink, toilet
    toiletNew: 'assets/lpc/tiles/toilet-new.png',     // the same toilet, whitened
    custom: 'assets/custom/props.png'                 // the game's own sprites (test/custom-art.js)
  };
  LOOKS.forEach(function (l) { files['char:' + l] = 'assets/lpc/chars/' + l + '.png'; });

  /* A region is [file id, x, y, width, height] in the picture's own pixels. It is shown at half that size in
     game pixels, so a 32 px LPC tile covers one 16 px game tile. */

  /* Rooms. Key: room, or room:version (rooms.js decides the version). Rooms without an entry keep their
     code-drawn shell. Two kinds:
       tiled    wall: three regions (top, middle and bottom row of the back wall), floor: one region
       painted  image: one picture of the whole room, fitted to the height of the screen and centred;
                people: how much larger people are drawn there; wash: a thin colour over the picture, per variant */
  var backgrounds = {
    'home': { wall: [['interior', 32, 192, 32, 32], ['interior', 32, 224, 32, 32], ['interior', 32, 256, 32, 32]], floor: ['inside', 0, 128, 32, 32] },
    'bathroom:old': { wall: [['bath', 32, 0, 32, 32], ['bath', 32, 32, 32, 32], ['bath', 32, 64, 32, 32]], floor: ['custom', 168, 156, 32, 32] },
    'store:hd': { wall: [['custom', 192, 512, 32, 32], ['custom', 192, 544, 32, 32], ['custom', 224, 544, 32, 32]], floor: ['custom', 192, 576, 32, 32] },
    'store:lowes': { wall: [['custom', 224, 512, 32, 32], ['custom', 192, 544, 32, 32], ['custom', 224, 544, 32, 32]], floor: ['custom', 192, 576, 32, 32] },
    'bathroom:new': { wall: [['interior', 32, 288, 32, 32], ['interior', 32, 320, 32, 32], ['interior', 32, 352, 32, 32]], floor: ['custom', 200, 156, 32, 32] }
  };

  /* Objects. Key: kind, or kind:variant (see rooms.js). parts: each is [region, dx, dy]; dx and dy move the part
     from the first part's top-left corner, in game pixels. The first part sits on the bottom edge of the object's
     box; ax says where across the box (0 left, 0.5 centre, 1 right; default centre). Objects without an entry
     keep their code-drawn look (the store's banner and aisle sign do, so their words stay in story.js).
     repeat: true lays the first part side by side to fill the width of the box (shelving). */
  var SOFA = ['furniture', 128, 394, 64, 44], WINDOW = ['furniture', 128, 8, 32, 44];
  var props = {
    'door': { parts: [[['inside', 256, 16, 32, 48]]] },
    'window': { ax: 0, parts: [[WINDOW], [WINDOW, 20, 0]] },
    'bookshelf': { parts: [[['interior', 448, 100, 64, 72]]] },
    'calendar': { parts: [[['custom', 32, 152, 20, 24]]] },
    'moodboard:frame': { parts: [[['furniture', 168, 8, 80, 26]]] },
    'moodboard:board': { parts: [[['custom', 128, 96, 72, 48]]] },
    'desk': { parts: [[['interior', 576, 194, 64, 46]], [['custom', 0, 152, 32, 26], 8, -9]] },
    'chair': { parts: [[['furniture', 196, 394, 28, 44]]] },
    'fridge:plain': { parts: [[['custom', 208, 0, 44, 92]]] },
    'fridge:card': { parts: [[['custom', 208, 0, 44, 92]], [['custom', 100, 152, 10, 12], 8, 4]] },
    'notebook': { parts: [[['custom', 72, 152, 18, 16]]] },
    'lamp': { parts: [[['interior', 704, 160, 32, 32]], [['furniture', 100, 128, 28, 32], 1, -12]] },
    'sofa': { ax: 0, parts: [[SOFA], [SOFA, 32, 0]] },
    'tablet': { parts: [[['custom', 52, 152, 20, 16]]] },
    'rug': { parts: [[['custom', 0, 0, 208, 96]]] },
    'table': { parts: [[['custom', 0, 192, 84, 40]]] },
    'phone': { parts: [[['custom', 90, 152, 10, 16]]] },
    'crutch': { parts: [[['custom', 112, 148, 12, 44]]] },
    'toys': { parts: [[['custom', 128, 152, 40, 24]]] },
    'trainmat': { parts: [[['custom', 0, 96, 128, 52]]] },
    'training': { parts: [[['custom', 200, 96, 56, 56]]] },
    'plant': { parts: [[['furniture', 128, 64, 32, 48]]] },
    // bathroom
    'toilet:old': { parts: [[['bath', 131, 294, 27, 46]]] },
    'toilet:new': { parts: [[['toiletNew', 0, 0, 27, 46]]] },
    'toilet:removed': { parts: [[['custom', 192, 192, 20, 14]]] },
    'vanity:old': { parts: [[['bath', 0, 160, 96, 96]], [['bath', 32, 128, 32, 32], 16, 19]] },
    'vanity:new': { parts: [[['custom', 0, 376, 96, 96]]] },
    'tub:old': { parts: [[['custom', 0, 232, 96, 64]]] },
    'tub:new': { parts: [[['custom', 96, 232, 96, 64]]] },
    'rack:old': { parts: [[['custom', 196, 232, 44, 40]]] },
    'rack:new': { parts: [[['custom', 196, 272, 44, 40]]] },
    'mat:old': { parts: [[['custom', 148, 312, 84, 28]]] },
    'mat:new': { parts: [[['custom', 148, 340, 84, 28]]] },
    'tilewall': { parts: [[['custom', 232, 312, 24, 44]]] },
    'controls': { parts: [[['custom', 214, 192, 26, 30]]] },
    'valve': { parts: [[['custom', 138, 192, 12, 14]]] },
    'plunger': { parts: [[['custom', 86, 192, 14, 30]]] },
    'toolbox': { parts: [[['custom', 102, 192, 34, 22]]] },
    'manual': { parts: [[['custom', 152, 192, 16, 14]]] },
    'stool': { parts: [[['custom', 170, 192, 20, 26]]] },
    'boxes:single': { parts: [[['custom', 0, 312, 56, 52]]] },
    'boxes:stack': { parts: [[['custom', 56, 312, 88, 64]]] },
    // store
    'shelves': { repeat: true, parts: [[['custom', 0, 640, 64, 84]]] },
    'display:toilets': { parts: [[['custom', 0, 472, 192, 84]]] },
    'display:bath': { parts: [[['custom', 0, 556, 192, 84]]] },
    'endcap:toilet': { parts: [[['custom', 64, 640, 96, 96]]] },
    'endcap:bath': { parts: [[['custom', 160, 640, 96, 96]]] },
    'shelf3': { parts: [[['custom', 0, 736, 148, 70]]] },
    'board': { parts: [[['custom', 0, 816, 148, 70]]] },
    'prodesk': { parts: [[['custom', 0, 886, 176, 60]]] },
    'cart': { parts: [[['custom', 196, 472, 48, 38]]] },
    'exitdoors': { parts: [[['custom', 148, 736, 84, 80]]] },
    'pallet': { parts: [[['custom', 180, 886, 64, 60]]] },
    'checkout': { parts: [[['custom', 0, 946, 96, 64]]] },
    'flatbed': { parts: [[['custom', 96, 946, 80, 44]]] }
  };

  var S = { SCALE: SCALE, CHAR: CHAR, LOOKS: LOOKS, files: files, backgrounds: backgrounds, props: props, mode: 'drawn', images: {} };
  var bgCache = {};

  /* Every region in the manifest, for the checks. */
  S.regions = function () {
    var out = [];
    function add(name, r) { out.push({ name: name, file: r[0], sx: r[1], sy: r[2], sw: r[3], sh: r[4] }); }
    Object.keys(backgrounds).forEach(function (k) {
      if (!backgrounds[k].wall) return;
      backgrounds[k].wall.forEach(function (r, i) { add(k + ' wall ' + i, r); });
      add(k + ' floor', backgrounds[k].floor);
    });
    Object.keys(props).forEach(function (k) { props[k].parts.forEach(function (q, i) { add(k + ' part ' + i, q[0]); }); });
    return out;
  };

  function key(table, a, b) { return (b != null && table[a + ':' + b]) ? a + ':' + b : (table[a] ? a : null); }
  /* The entry used for a room and version: 'bathroom:notoilet', 'bathroom', or null if the room is not painted. */
  S.backgroundKey = function (room, version) { return key(backgrounds, room, version); };
  S.people = function (room, version) { var k = key(backgrounds, room, version); return k ? (backgrounds[k].people || 1) : 1; };
  S.hasProp = function (kind, variant) { return !!key(props, kind, variant); };
  S.hasLook = function (look) { return !!files['char:' + look]; };

  /* Which column of a walk sheet to show. frame 0 = standing; anything else = walking, timed by `walk` seconds. */
  S.frameOf = function (frame, walk) {
    if (!frame) return 0;
    return 1 + Math.floor((walk || 0) / CHAR.stride) % (CHAR.cols - 1);
  };

  /* Starts loading every file. done(mode) is called once, with 'sprites' or 'drawn'. Needs a browser. */
  S.load = function (base, done) {
    var ids = Object.keys(files), left = ids.length, failed = false, finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      S.mode = failed ? 'drawn' : 'sprites';
      if (done) done(S.mode);
    }
    var forced = root.location && /[?&]art=drawn\b/.test(root.location.search || '');
    if (forced || typeof root.Image === 'undefined') { failed = true; finish(); return; }
    ids.forEach(function (id) {
      var img = new root.Image();
      img.onload = function () { S.images[id] = img; if (--left === 0) finish(); };
      img.onerror = function () { failed = true; finish(); };
      img.src = (base || '') + files[id];
    });
  };

  function blit(ctx, r, x, y) {
    ctx.drawImage(S.images[r[0]], r[1], r[2], r[3], r[4], x, y, r[3] / SCALE, r[4] / SCALE);
  }

  /* Where a painted room sits on the screen, in game pixels: fitted to the screen height and centred. */
  S.frame = function (imgW, imgH) {
    var A = root.ART, w = imgW / imgH * A.H;
    return { x: (A.W - w) / 2, y: 0, w: w, h: A.H };
  };

  /* Walls and floor from tiles, painted once into an off-screen canvas. */
  function tiled(k, bounds) {
    var A = root.ART, T = A.T, bg = backgrounds[k], cv = root.document.createElement('canvas');
    var x0 = bounds.x0 * T, x1 = bounds.x1 * T, y1 = bounds.y1 * T, x, y, i;
    cv.width = A.W * SCALE; cv.height = A.H * SCALE;
    var c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    c.fillStyle = A.PAL.shadow; c.fillRect(0, 0, A.W, A.H);
    for (y = A.WALL_H; y < y1; y += T) for (x = x0; x < x1; x += T) blit(c, bg.floor, x, y);
    for (i = 0; i < 3; i++) for (x = x0; x < x1; x += T) blit(c, bg.wall[i], x, i * T);
    c.fillStyle = 'rgba(0, 0, 0, 0.22)'; c.fillRect(x0, A.WALL_H, x1 - x0, 3);          // the wall's shadow on the floor
    c.fillStyle = A.PAL.shadow; c.fillRect(x1, 0, A.W - x1, A.H); c.fillRect(0, y1, A.W, A.H - y1);
    return cv;
  }

  /* Paints a room. version picks the picture, variant picks the wash, bounds is the room's size in tiles.
     Returns false if the room has no pictures. */
  S.background = function (ctx, room, version, variant, bounds) {
    var k = key(backgrounds, room, version);
    if (!k || S.mode !== 'sprites') return false;
    if (backgrounds[k].wall) {
      if (!bgCache[k]) bgCache[k] = tiled(k, bounds);
      ctx.drawImage(bgCache[k], 0, 0, root.ART.W, root.ART.H);
      return true;
    }
    var A = root.ART, bg = backgrounds[k], img = S.images[bg.image], f = S.frame(img.width, img.height), cv = bgCache[k];
    if (!cv) {                                    // scaled once, smoothly, at the canvas's full detail
      cv = bgCache[k] = root.document.createElement('canvas');
      cv.width = A.W * SCALE; cv.height = A.H * SCALE;
      var c = cv.getContext('2d');
      c.fillStyle = A.PAL.shadow; c.fillRect(0, 0, cv.width, cv.height);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(img, f.x * SCALE, f.y * SCALE, f.w * SCALE, f.h * SCALE);
    }
    ctx.drawImage(cv, 0, 0, A.W, A.H);
    if (bg.wash && bg.wash[variant]) { ctx.fillStyle = bg.wash[variant]; ctx.fillRect(f.x, f.y, f.w, f.h); }
    return true;
  };

  /* Draws an object inside its box (game pixels). Returns false if this object has no sprite. */
  S.prop = function (ctx, kind, variant, x, y, w, h) {
    var k = key(props, kind, variant);
    if (!k || S.mode !== 'sprites') return false;
    var parts = props[k].parts, first = parts[0][0], ax = props[k].ax != null ? props[k].ax : 0.5;
    if (props[k].repeat) {                         // side by side across the box; the last one is cut to fit
      var uw = first[3] / SCALE, top = Math.round(y + h - first[4] / SCALE), left = Math.round(x), dx, cut;
      for (dx = 0; dx < w - 0.5; dx += uw) {
        cut = Math.min(uw, w - dx);
        ctx.drawImage(S.images[first[0]], first[1], first[2], cut * SCALE, first[4], left + dx, top, cut, first[4] / SCALE);
      }
      return true;
    }
    var ox = Math.round(x + (w - first[3] / SCALE) * ax), oy = Math.round(y + h - first[4] / SCALE);
    for (var i = 0; i < parts.length; i++) blit(ctx, parts[i][0], ox + (parts[i][1] || 0), oy + (parts[i][2] || 0));
    return true;
  };

  /* Draws a person. cx = centre, feetY = where the feet stand, in game pixels; scale makes them larger.
     Returns false if there is no sheet. */
  S.character = function (ctx, look, cx, feetY, dir, frame, walk, scale) {
    var img = S.images['char:' + look];
    if (!img || S.mode !== 'sprites') return false;
    var col = S.frameOf(frame, walk), row = CHAR.rows[dir] != null ? CHAR.rows[dir] : CHAR.rows.down;
    var k = scale || 1, w = CHAR.fw / SCALE * k, h = CHAR.fh / SCALE * k;
    ctx.drawImage(img, col * CHAR.fw, row * CHAR.fh, CHAR.fw, CHAR.fh, Math.round(cx - w / 2), Math.round(feetY - h + k), w, h);
    return true;
  };

  /* Fills a small canvas with the person facing the viewer, for menus. Returns false if there is no sheet. */
  S.portrait = function (canvas, look) {
    var img = S.images['char:' + look];
    if (!img || S.mode !== 'sprites') return false;
    canvas.width = 40; canvas.height = 56;
    var c = canvas.getContext('2d');
    c.clearRect(0, 0, 40, 56);
    c.drawImage(img, 12, CHAR.rows.down * CHAR.fh + 8, 40, 56, 0, 0, 40, 56);
    return true;
  };

  root.SPRITES = S;
})(typeof window !== 'undefined' ? window : globalThis);
