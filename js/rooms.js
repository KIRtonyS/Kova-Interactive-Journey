/* rooms.js — layouts: where each object sits, what is solid, and which variant shows.
   All positions are in tiles (16 px). The canvas is 24 x 14 tiles; the top 3 rows are wall.

   Item fields:
     id       matches a `things` key in story.js to make the item usable; items without one are decoration
     kind     drawing function in props.js
     x y w h  drawn box, in tiles
     solid    true if the player cannot walk through it
     foot     [x, y, w, h] solid footprint inside the box, in tiles (default: the whole box)
     layer    'wall' (on the back wall), 'floor' (flat on the floor), default: standing object
     sortY    draw-order override in tiles, for things that sit on top of furniture
     reach    how close the player must be, in px (default 16)
     show(s)  hide the item per level, persona or progress
     variant  a string, or a function of state
     front    true if the object can only be used from its front (its lower edge), not from the aisle behind it
     painted  true if the object is part of the room's painted picture (or a function of the variant)
     drawn    [w, h] in tiles: the size of the code-drawn stand-in for a painted object, used when pictures are missing
   Room fields: bounds, spawn, items. Optional: floor (the tile row where the floor starts, default 3) and
   background(state) (which version of the room picture to show).
   Loaded after props.js. Sets window.ROOMS. */
(function (root) {
  'use strict';
  var T = 16, WALL_H = 48, REACH = 16, STEP = 4;
  var PLAYER = { w: 8, h: 4 }; // the player's feet box in px

  function L(id) { return function (s) { return s.levelId === id; }; }
  /* Sign words come from story.js (STORY.signs). */
  function word(key, fallback) { var sg = root.STORY && root.STORY.signs; return (sg && sg[key]) || fallback; }
  function at(id, act) { return function (s) { return s.levelId === id && s.actIdx === act; }; }
  function who(p) { return function (s) { return s.personaId === p; }; }
  var NPC_FOOT = [0.1, 1.05, 0.7, 0.35];

  /* Room sizes in tiles: width x height, with the three wall rows included. One scale for all three places, so a
     bathroom is small, a living room is larger and a store fills the screen (24 x 14). Rooms sit at the top of
     the screen, centred left to right. */
  var SIZE = { bathroom: [12, 9], home: [16, 11], store: [24, 14] };
  function sized(roomId) { var s = SIZE[roomId], x0 = (24 - s[0]) / 2; return { x0: x0, x1: x0 + s[0], y1: s[1] }; }

  var rooms = {
    /* ---------------- Bathroom (dated and renovated): 12 x 9 tiles, from x = 6 to x = 18 ---------------- */
    bathroom: {
      bounds: sized('bathroom'),
      spawn: { x: 6.8, y: 4.7 },
      items: [
        { id: 'door', kind: 'door', x: 6.2, y: 0.5, w: 1.2, h: 2.5, layer: 'wall' },
        { id: 'rack', kind: 'rack', x: 7.5, y: 1.0, w: 1.4, h: 1.6, layer: 'wall',
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { id: 'vanity', kind: 'vanity', x: 9, y: 0.2, w: 3, h: 3.6, solid: true, foot: [0, 2.8, 3, 0.8],
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { id: 'plunger', kind: 'plunger', x: 12.1, y: 2.5, w: 0.8, h: 1.3, show: at('breaks', 0) },
        { id: 'toilet', kind: 'toilet', x: 13.0, y: 2.0, w: 1.1, h: 1.7, solid: true, foot: [0.05, 1.0, 1.0, 0.7],
          variant: function (s) {
            if (s.variant === 'new') return 'new';
            if (s.levelId === 'breaks' && s.actIdx === 3) {
              if (s.done.toilet) return 'new';
              if (s.done.valve) return 'removed';
            }
            return 'old';
          } },
        { id: 'valve', kind: 'valve', x: 14.2, y: 2.1, w: 0.75, h: 0.8, layer: 'wall', show: L('breaks') },
        { id: 'tile', kind: 'tilewall', x: 14.15, y: 0.6, w: 0.85, h: 2.3, layer: 'wall', show: at('project', 0) },
        { id: 'controls', kind: 'controls', x: 14.1, y: 1.0, w: 0.9, h: 1.7, layer: 'wall', show: at('project', 3) },
        { id: 'tub', kind: 'tub', x: 15, y: 1.6, w: 3, h: 2.6, solid: true, foot: [0, 1.2, 3, 1.4],
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { kind: 'mat', x: 15.2, y: 4.4, w: 2.6, h: 0.9, layer: 'floor',
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { id: 'toolbox', kind: 'toolbox', x: 12.4, y: 5.2, w: 1.1, h: 0.8, solid: true, show: at('breaks', 0) },
        { id: 'box', kind: 'boxes', x: 8.5, y: 5.6, w: 1.8, h: 1.7, solid: true, foot: [0, 0.6, 1.8, 1.1], variant: 'single', show: at('breaks', 3) },
        { id: 'manual', kind: 'manual', x: 11.0, y: 6.6, w: 0.8, h: 0.8, layer: 'floor', show: at('breaks', 3) },
        { id: 'box', kind: 'boxes', x: 7.6, y: 5.2, w: 2.8, h: 2.1, solid: true, foot: [0, 0.8, 2.8, 1.3], variant: 'stack', show: at('project', 3) },
        { id: 'phone', kind: 'stool', x: 12.5, y: 5.0, w: 0.9, h: 1.3, solid: true, foot: [0, 0.6, 0.9, 0.7], show: at('project', 3) },
        { kind: 'plant', x: 16.9, y: 7.0, w: 1, h: 1.6, solid: true, foot: [0.1, 1.1, 0.8, 0.5] }
      ]
    },

    /* ---------------- Home (living room): 16 x 11 tiles, from x = 4 to x = 20 ---------------- */
    home: {
      bounds: sized('home'),
      spawn: { x: 4.9, y: 4.7 },
      items: [
        { id: 'door', kind: 'door', x: 4.2, y: 0.5, w: 1.4, h: 2.5, layer: 'wall' },
        { kind: 'window', x: 5.9, y: 0.5, w: 2.3, h: 1.6, layer: 'wall' },
        { kind: 'bookshelf', x: 8.4, y: 0.4, w: 2, h: 2.9, solid: true, foot: [0, 2.6, 2, 0.3] },
        { kind: 'calendar', x: 10.7, y: 0.9, w: 0.9, h: 1.1, layer: 'wall' },
        { id: 'moodboard', kind: 'moodboard', x: 11.9, y: 0.6, w: 2.5, h: 2.2, layer: 'wall',
          variant: function (s) { return s.levelId === 'project' ? 'board' : 'frame'; } },
        { id: 'laptop', kind: 'desk', x: 14.7, y: 1.9, w: 2, h: 1.9, solid: true, foot: [0, 1.1, 2, 0.8] },
        { kind: 'chair', x: 16.9, y: 3.2, w: 0.9, h: 1.4, solid: true, foot: [0, 0.6, 0.9, 0.8] },
        { id: 'fridge', kind: 'fridge', x: 18.4, y: 0.7, w: 1.4, h: 2.9, solid: true, foot: [0, 2.2, 1.4, 0.7],
          variant: function (s) { return s.levelId === 'breaks' ? 'card' : 'plain'; } },
        { kind: 'lamp', x: 4.3, y: 5.3, w: 1, h: 1.9, solid: true, foot: [0.1, 1.2, 0.8, 0.6] },
        { kind: 'sofa', x: 6, y: 6.2, w: 4, h: 1.5, solid: true, foot: [0, 0.3, 4, 1.2] },
        { id: 'tablet', kind: 'tablet', x: 6.5, y: 6.4, w: 0.8, h: 0.8, sortY: 7.75, reach: 22, show: L('breaks') },
        { id: 'notebook', kind: 'notebook', x: 6.5, y: 6.4, w: 0.8, h: 0.8, sortY: 7.75, reach: 22, show: L('project') },
        { kind: 'rug', x: 5.2, y: 7.95, w: 6.5, h: 3, layer: 'floor' },
        { kind: 'table', x: 7.2, y: 8.9, w: 2.6, h: 1.25, solid: true, foot: [0, 0.2, 2.6, 0.9] },
        { id: 'phone', kind: 'phone', x: 8.9, y: 8.4, w: 0.8, h: 0.8, sortY: 10.2, reach: 20 },
        // persona dressing
        { kind: 'crutch', x: 10.2, y: 6.2, w: 0.5, h: 1.5, show: who('david') },
        { id: 'mother', kind: 'npc', look: 'mother', x: 12.4, y: 4.6, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: who('david') },
        { kind: 'toys', x: 12.4, y: 9.4, w: 1.4, h: 0.8, layer: 'floor', show: who('maya') },
        { id: 'partner', kind: 'npc', look: 'partner', x: 12.4, y: 4.6, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: who('maya') },
        { kind: 'trainmat', x: 12.6, y: 8.6, w: 4, h: 1.7, layer: 'floor', show: who('elena') },
        { id: 'training', kind: 'training', x: 17.4, y: 6.4, w: 1.9, h: 1.8, solid: true, foot: [0, 0.9, 1.9, 0.9], show: who('elena') },
        { kind: 'plant', x: 18.8, y: 9.2, w: 1, h: 1.6, solid: true, foot: [0.1, 1.1, 0.8, 0.5] }
      ]
    },

    /* ---------------- Store (Home Depot in Level 1, Lowe's in Level 2): 24 x 14 tiles ----------------
       Three rows of shelving make the aisles: one along the back wall, two across the floor. Gaps in the rows
       are the cross aisles. The player comes in by the doors at the top right. */
    store: {
      bounds: sized('store'),
      background: function (s) { return s.levelId === 'breaks' ? 'hd' : 'lowes'; },   // which store's colours
      spawn: { x: 21.9, y: 4.8 },
      items: [
        // along the back wall
        { kind: 'banner', x: 7.6, y: 0.45, w: 6, h: 1, layer: 'wall' },
        { kind: 'aislesign', x: 2.2, y: 0.55, w: 2.6, h: 0.6, layer: 'wall',
          variant: function (s) { return s.levelId === 'breaks' ? word('aisle', 'AISLE 25') : word('bath', 'BATH'); } },
        { id: 'door', kind: 'exitdoors', x: 20.6, y: 0.5, w: 2.6, h: 2.5, layer: 'wall' },
        { kind: 'shelves', x: 0.5, y: 1.2, w: 6, h: 2.6, solid: true, foot: [0, 1.8, 6, 0.8] },
        { id: 'display', kind: 'display', x: 7.6, y: 1.55, w: 6, h: 2.6, solid: true, foot: [0, 1.5, 6, 1.1],
          variant: function (s) { return s.levelId === 'breaks' ? 'toilets' : 'bath'; } },
        { id: 'kohler', kind: 'endcap', x: 14.6, y: 1.2, w: 3, h: 3, solid: true, foot: [0, 2, 3, 1],
          variant: function (s) { return s.levelId === 'breaks' ? 'toilet' : 'bath'; } },
        { kind: 'shelves', x: 18.2, y: 1.2, w: 2, h: 2.6, solid: true, foot: [0, 1.8, 2, 0.8] },
        { id: 'associate', kind: 'npc', look: 'associate', x: 13.7, y: 4.1, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT },
        // second row: shelving, with the choice in the middle
        { kind: 'shelves', x: 0.5, y: 5.6, w: 6, h: 2.6, solid: true, foot: [0, 1.0, 6, 1.6] },
        { kind: 'aislesign', x: 2.2, y: 4.9, w: 2.6, h: 0.6, sortY: 8.25,
          variant: function (s) { return s.levelId === 'breaks' ? word('aisleBefore', 'AISLE 24') : word('plumbing', 'PLUMBING'); } },
        { id: 'shelf', kind: 'shelf3', x: 8.4, y: 6.0, w: 4.6, h: 2.2, solid: true, foot: [0, 0.9, 4.6, 1.3], front: true, show: L('breaks') },
        { id: 'board', kind: 'board', x: 8.4, y: 6.0, w: 4.6, h: 2.2, solid: true, foot: [0, 0.9, 4.6, 1.3], front: true, show: L('project') },
        { kind: 'shelves', x: 14.8, y: 5.6, w: 6, h: 2.6, solid: true, foot: [0, 1.0, 6, 1.6] },
        { id: 'shopper', kind: 'npc', look: 'shopper', x: 16.6, y: 8.3, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: L('breaks') },
        { kind: 'cart', x: 17.8, y: 8.6, w: 1.5, h: 1.2, solid: true, foot: [0, 0.4, 1.5, 0.8], show: L('breaks') },
        { id: 'contractor', kind: 'npc', look: 'contractor', x: 16.6, y: 8.3, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: L('project') },
        { kind: 'flatbed', x: 17.8, y: 8.5, w: 2.5, h: 1.4, solid: true, foot: [0, 0.6, 2.5, 0.8], show: L('project') },
        // third row: more shelving, a pallet, the pro desk (Lowe's) and a till near the way out
        { kind: 'shelves', x: 0.5, y: 9.6, w: 6, h: 2.6, solid: true, foot: [0, 1.0, 6, 1.6] },
        { kind: 'aislesign', x: 2.2, y: 8.9, w: 2.6, h: 0.6, sortY: 12.25,
          variant: function (s) { return s.levelId === 'breaks' ? word('aisleAfter', 'AISLE 26') : word('tile', 'TILE'); } },
        { kind: 'pallet', x: 7.2, y: 10.3, w: 2, h: 1.9, solid: true, foot: [0, 0.7, 2, 1.2] },
        { kind: 'shelves', x: 10, y: 9.6, w: 6, h: 2.6, solid: true, foot: [0, 1.0, 6, 1.6], show: L('breaks') },
        { kind: 'prodesk', x: 10, y: 10.3, w: 5.5, h: 1.9, solid: true, show: L('project') },
        { kind: 'checkout', x: 19.6, y: 9.9, w: 3, h: 2, solid: true, foot: [0, 0.7, 3, 1.3] },
        { kind: 'pallet', x: 21.6, y: 6.2, w: 2, h: 1.9, solid: true, foot: [0, 0.7, 2, 1.2], show: L('project') }
      ]
    }
  };

  /* ---------- geometry (all results in px) ---------- */
  function box(it) { return { x: it.x * T, y: it.y * T, w: it.w * T, h: it.h * T }; }

  function foot(it) {
    if (!it.solid) return null;
    var f = it.foot || [0, 0, it.w, it.h];
    return { x: (it.x + f[0]) * T, y: (it.y + f[1]) * T, w: f[2] * T, h: f[3] * T };
  }

  /* The rectangle the player must be near to use the item. */
  function hit(it) {
    var f = foot(it);
    if (f && it.front) return { x: f.x, y: f.y + f.h - 2, w: f.w, h: 2 };     // only its front edge counts
    return f || box(it);
  }

  function anchor(it) {
    var h = hit(it);
    if (it.layer === 'wall') return { x: h.x + h.w / 2, y: h.y + h.h };
    return { x: h.x + h.w / 2, y: h.y + h.h / 2 };
  }

  function dist(it, x, y) {
    var h = hit(it);
    var dx = Math.max(h.x - x, 0, x - (h.x + h.w));
    var dy = Math.max(h.y - y, 0, y - (h.y + h.h));
    return Math.sqrt(dx * dx + dy * dy);
  }

  function inReach(it, x, y) { return dist(it, x, y) <= (it.reach || REACH); }

  function sortY(it) { return (it.sortY != null ? it.sortY : it.y + it.h) * T; }

  function spawn(roomId) { var s = rooms[roomId].spawn; return { x: s.x * T, y: s.y * T }; }

  function visible(roomId, s) {
    return rooms[roomId].items.filter(function (it) { return !it.show || it.show(s); });
  }

  function variantOf(it, s) { return typeof it.variant === 'function' ? it.variant(s) : it.variant; }

  /* Where the floor starts, in px. */
  function floorTop(roomId) { var f = rooms[roomId].floor; return f != null ? f * T : WALL_H; }

  /* Where the player's feet point (centre x, bottom y) may be. */
  function limits(roomId) {
    var b = rooms[roomId].bounds;
    return { x0: b.x0 * T + PLAYER.w / 2, x1: b.x1 * T - PLAYER.w / 2, y0: floorTop(roomId) + PLAYER.h, y1: b.y1 * T - 1 };
  }

  function solidRects(roomId, s) {
    return visible(roomId, s).filter(function (it) { return it.solid; }).map(foot);
  }

  /* True if the feet box at (x, y) leaves the room or touches a solid footprint. */
  function blockedBy(lim, rects, x, y) {
    if (x < lim.x0 || x > lim.x1 || y < lim.y0 || y > lim.y1) return true;
    var fx = x - PLAYER.w / 2, fy = y - PLAYER.h;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (fx < r.x + r.w && r.x < fx + PLAYER.w && fy < r.y + r.h && r.y < fy + PLAYER.h) return true;
    }
    return false;
  }

  function blocked(roomId, s, x, y) { return blockedBy(limits(roomId), solidRects(roomId, s), x, y); }

  /* Of the given items, the one the player at (x, y) would use: in reach, with the nearest anchor. */
  function nearest(items, x, y) {
    var best = null, bestD = Infinity;
    for (var i = 0; i < items.length; i++) {
      if (!inReach(items[i], x, y)) continue;
      var a = anchor(items[i]), d = (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y);
      if (d < bestD) { bestD = d; best = items[i]; }
    }
    return best;
  }

  /* Breadth-first walk on a 4 px grid from `from` to the spot beside `target` where `target` is the
     item that would be selected. Returns a list of points, or null if the item cannot be reached.
     `usable` is the list of items that can be used in this scene (default: every item with an id).
     `clear` keeps the path that many px away from furniture (default 0).
     Used by the tests and by the self-play run; the game itself moves freely. */
  function path(roomId, s, from, target, usable, clear) {
    var lim = limits(roomId), rects = solidRects(roomId, s);
    if (clear) rects = rects.map(function (r) { return { x: r.x - clear, y: r.y - clear, w: r.w + 2 * clear, h: r.h + 2 * clear }; });
    var items = usable || visible(roomId, s).filter(function (it) { return it.id; });
    var cols = Math.floor((lim.x1 - lim.x0) / STEP) + 1, rows = Math.floor((lim.y1 - lim.y0) / STEP) + 1;
    function px(i) { return lim.x0 + i * STEP; }
    function py(j) { return lim.y0 + j * STEP; }
    function open(i, j) { return i >= 0 && j >= 0 && i < cols && j < rows && !blockedBy(lim, rects, px(i), py(j)); }
    var si = Math.round((from.x - lim.x0) / STEP), sj = Math.round((from.y - lim.y0) / STEP);
    if (!open(si, sj)) {
      var fixed = false;
      for (var rad = 1; rad < 6 && !fixed; rad++) {
        for (var a = -rad; a <= rad && !fixed; a++) for (var b = -rad; b <= rad && !fixed; b++) {
          if (open(si + a, sj + b)) { si += a; sj += b; fixed = true; }
        }
      }
      if (!fixed) return null;
    }
    var prev = {}, queue = [[si, sj]], key = function (i, j) { return i + ',' + j; };
    prev[key(si, sj)] = null;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length) {
      var c = queue.shift(), x = px(c[0]), y = py(c[1]);
      var goal = target.kind ? (dist(target, x, y) <= (target.reach || REACH) - 3 && nearest(items, x, y) === target)
        : (Math.abs(x - target.x) <= STEP && Math.abs(y - target.y) <= STEP);
      if (goal) {
        var out = [], k = key(c[0], c[1]);
        while (k) { var q = k.split(','); out.unshift({ x: px(+q[0]), y: py(+q[1]) }); k = prev[k]; }
        return out;
      }
      for (var d = 0; d < 4; d++) {
        var ni = c[0] + dirs[d][0], nj = c[1] + dirs[d][1], nk = key(ni, nj);
        if (nk in prev || !open(ni, nj)) continue;
        prev[nk] = key(c[0], c[1]);
        queue.push([ni, nj]);
      }
    }
    return null;
  }

  /* ---------- drawing ----------
     Draws one frame of a room: shell, wall items, floor items, then objects and actors sorted by depth.
     opts.actors  [{ x, y, look, dir, frame }] with x = centre and y = feet, in px
     opts.markers [item] items that get the bobbing gold marker
     opts.info    { store, accent } for store signs and colours */
  function render(ctx, roomId, s, t, opts) {
    opts = opts || {};
    var A = root.ART, PR = root.PROPS, SP = root.SPRITES, info = opts.info || {};
    var items = visible(roomId, s), list = [], i;
    /* Image sprites (sprites.js) are used where they exist; everything else is drawn in code. */
    var spr = !!SP && SP.mode === 'sprites', room = rooms[roomId];
    var version = room.background ? room.background(s) : s.variant;
    var painted = spr && SP.background(ctx, roomId, version, s.variant, room.bounds);
    if (!painted) A.shell(ctx, roomId, s.variant, { bounds: room.bounds, accent: info.accent, wallH: floorTop(roomId) });
    var people = painted ? SP.people(roomId, version) : 1;      // people are drawn larger in a painted room
    function drawItem(it) {
      var b = box(it), v = variantOf(it, s);
      var inPicture = typeof it.painted === 'function' ? it.painted(v) : !!it.painted;
      if (painted && inPicture) return;
      if (it.drawn) {                               // the code-drawn stand-in sits at the bottom of the painted object's box
        b = { x: b.x + (b.w - it.drawn[0] * T) / 2, y: b.y + b.h - it.drawn[1] * T, w: it.drawn[0] * T, h: it.drawn[1] * T };
      }
      if (spr && it.kind === 'npc') {
        var look = it.look === 'associate' && info.accent === A.PAL.lowesNavy ? 'associate_lowes' : it.look;
        if (SP.character(ctx, look, b.x + b.w / 2, b.y + b.h, 'down', 0, 0, people)) return;
      } else if (spr && SP.prop(ctx, it.kind, v, b.x, b.y, b.w, b.h)) {
        return;
      }
      PR.draw(ctx, it.kind, b.x, b.y, b.w, b.h, v, t, { accent: info.accent, store: info.store, look: it.look });
    }
    for (i = 0; i < items.length; i++) if (items[i].layer === 'wall') drawItem(items[i]);
    for (i = 0; i < items.length; i++) if (items[i].layer === 'floor') drawItem(items[i]);
    items.forEach(function (it) {
      if (it.layer === 'wall' || it.layer === 'floor') return;
      list.push({ y: sortY(it), draw: function () { drawItem(it); } });
    });
    (opts.actors || []).forEach(function (a) {
      list.push({ y: a.y, draw: function () {
        if (spr && SP.character(ctx, a.look, a.x, a.y, a.dir, a.frame, a.walk, people)) return;
        A.character(ctx, a.look, Math.round(a.x) - 6, Math.round(a.y) - 21, a.dir, a.frame);
      } });
    });
    list.sort(function (p, q) { return p.y - q.y; });
    for (i = 0; i < list.length; i++) list[i].draw();
    (opts.markers || []).forEach(function (it) {
      var b = box(it);
      A.marker(ctx, b.x + b.w / 2, b.y, t);
    });
  }

  root.ROOMS = {
    render: render,
    T: T, WALL_H: WALL_H, REACH: REACH, PLAYER: PLAYER, rooms: rooms, SIZE: SIZE,
    box: box, foot: foot, hit: hit, anchor: anchor, dist: dist, inReach: inReach, sortY: sortY,
    spawn: spawn, floorTop: floorTop, visible: visible, variantOf: variantOf, limits: limits, solidRects: solidRects,
    blocked: blocked, blockedBy: blockedBy, nearest: nearest, path: path
  };
})(typeof window !== 'undefined' ? window : globalThis);
