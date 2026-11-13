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
   Loaded after props.js. Sets window.ROOMS. */
(function (root) {
  'use strict';
  var T = 16, WALL_H = 48, REACH = 16, STEP = 4;
  var PLAYER = { w: 8, h: 4 }; // the player's feet box in px

  function L(id) { return function (s) { return s.levelId === id; }; }
  function at(id, act) { return function (s) { return s.levelId === id && s.actIdx === act; }; }
  function who(p) { return function (s) { return s.personaId === p; }; }
  var NPC_FOOT = [0.1, 1.05, 0.7, 0.35];

  var rooms = {
    /* ---------------- Bathroom (old and new) ---------------- */
    bathroom: {
      bounds: { x0: 3, x1: 21, y1: 12 },
      spawn: { x: 4.2, y: 4.7 },     // just inside the door but out of its reach, so the walking hint shows first
      items: [
        { id: 'door', kind: 'door', x: 3.4, y: 0.5, w: 1.6, h: 2.5, layer: 'wall' },
        { id: 'vanity', kind: 'vanity', x: 5.6, y: 0.6, w: 3, h: 3.2, solid: true, foot: [0, 2.4, 3, 0.8],
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { id: 'tile', kind: 'tilewall', x: 9.1, y: 0.6, w: 1.7, h: 2.2, layer: 'wall', show: at('project', 0) },
        { kind: 'window', x: 10.9, y: 0.3, w: 1.9, h: 1.3, layer: 'wall' },
        { id: 'toilet', kind: 'toilet', x: 11.1, y: 1.9, w: 1.3, h: 1.75, solid: true, foot: [0.1, 1.15, 1.1, 0.6],
          variant: function (s) {
            if (s.variant === 'new') return 'new';
            if (s.levelId === 'breaks' && s.actIdx === 3) {
              if (s.done.toilet) return 'new';
              if (s.done.valve) return 'removed';
            }
            return 'old';
          } },
        { id: 'valve', kind: 'valve', x: 12.5, y: 2.1, w: 0.75, h: 0.8, layer: 'wall', show: L('breaks') },
        { id: 'puddle', kind: 'puddle', x: 8.6, y: 3.5, w: 2.6, h: 1.4, layer: 'floor', show: at('breaks', 0) },
        { id: 'rack', kind: 'rack', x: 13.5, y: 1.1, w: 1.4, h: 1.6, layer: 'wall',
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { id: 'controls', kind: 'controls', x: 14.95, y: 1.2, w: 1.3, h: 1.5, layer: 'wall', show: at('project', 3) },
        { id: 'tub', kind: 'tub', x: 16.3, y: 1.6, w: 4.5, h: 2.6, solid: true, foot: [0, 1.4, 4.5, 1.2],
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { kind: 'mat', x: 17, y: 4.5, w: 2.6, h: 0.9, layer: 'floor',
          variant: function (s) { return s.variant === 'new' ? 'new' : 'old'; } },
        { id: 'toolbox', kind: 'toolbox', x: 13.4, y: 4.7, w: 1.1, h: 0.8, solid: true, show: at('breaks', 0) },
        { id: 'box', kind: 'boxes', x: 7.2, y: 6.6, w: 1.8, h: 1.8, solid: true, foot: [0, 0.6, 1.8, 1.2], variant: 'single', show: at('breaks', 3) },
        { id: 'manual', kind: 'manual', x: 9.6, y: 7.5, w: 0.8, h: 0.8, layer: 'floor', show: at('breaks', 3) },
        { id: 'box', kind: 'boxes', x: 6.8, y: 6.3, w: 2.8, h: 2.2, solid: true, foot: [0, 0.8, 2.8, 1.4], variant: 'stack', show: at('project', 3) },
        { id: 'phone', kind: 'stool', x: 13.7, y: 4.5, w: 0.9, h: 1.1, solid: true, foot: [0, 0.5, 0.9, 0.6], show: at('project', 3) },
        { kind: 'plant', x: 19.7, y: 9.8, w: 1, h: 1.6, solid: true, foot: [0.1, 1.1, 0.8, 0.5] },
        { kind: 'basket', x: 3.4, y: 10, w: 1, h: 1.2, solid: true, foot: [0, 0.5, 1, 0.7] }
      ]
    },

    /* ---------------- Home (living room) ---------------- */
    home: {
      bounds: { x0: 0, x1: 24, y1: 14 },
      spawn: { x: 1.8, y: 4.7 },
      items: [
        { id: 'door', kind: 'door', x: 1, y: 0.5, w: 1.6, h: 2.5, layer: 'wall' },
        { kind: 'window', x: 3.6, y: 0.5, w: 2.6, h: 1.6, layer: 'wall' },
        { kind: 'bookshelf', x: 7.2, y: 0.4, w: 2, h: 2.9, solid: true, foot: [0, 2.6, 2, 0.3] },
        { kind: 'calendar', x: 10, y: 0.9, w: 0.9, h: 1.1, layer: 'wall' },
        { id: 'moodboard', kind: 'moodboard', x: 11.6, y: 0.6, w: 2.5, h: 2.2, layer: 'wall',
          variant: function (s) { return s.levelId === 'project' ? 'board' : 'frame'; } },
        { id: 'laptop', kind: 'desk', x: 15, y: 1.4, w: 3, h: 2.4, solid: true, foot: [0, 1.6, 3, 0.8] },
        { kind: 'chair', x: 18.3, y: 3.3, w: 0.9, h: 1.3, solid: true, foot: [0, 0.5, 0.9, 0.8] },
        { id: 'fridge', kind: 'fridge', x: 20.2, y: 0.2, w: 3.5, h: 3.5, solid: true, foot: [0, 2.8, 3.5, 0.7],
          variant: function (s) { return s.levelId === 'breaks' ? 'card' : 'plain'; } },
        { id: 'notebook', kind: 'notebook', x: 21.0, y: 1.2, w: 0.8, h: 0.8, sortY: 3.75, reach: 40, show: L('project') },
        { kind: 'lamp', x: 3.0, y: 5.9, w: 0.8, h: 2.3, solid: true, foot: [0.1, 1.9, 0.6, 0.4] },
        { kind: 'sofa', x: 4, y: 6.6, w: 4, h: 2.3, solid: true, foot: [0, 0.4, 4, 1.9] },
        { id: 'tablet', kind: 'tablet', x: 6.3, y: 7.4, w: 0.8, h: 0.8, sortY: 8.95, reach: 22, show: L('breaks') },
        { kind: 'rug', x: 3.4, y: 9.4, w: 6.4, h: 3, layer: 'floor' },
        { kind: 'table', x: 5, y: 10, w: 2.6, h: 1.3, solid: true, foot: [0, 0.2, 2.6, 1.0] },
        { id: 'phone', kind: 'phone', x: 5.9, y: 9.85, w: 0.8, h: 0.8, sortY: 11.35, reach: 20 },
        // persona dressing
        { kind: 'crutch', x: 8.1, y: 6.9, w: 0.5, h: 1.9, show: who('david') },
        { id: 'mother', kind: 'npc', look: 'mother', x: 10.4, y: 5.2, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: who('david') },
        { kind: 'toys', x: 7.9, y: 10.6, w: 1.8, h: 1.1, layer: 'floor', show: who('maya') },
        { id: 'partner', kind: 'npc', look: 'partner', x: 10.4, y: 5.2, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: who('maya') },
        { kind: 'trainmat', x: 13.2, y: 9.4, w: 4, h: 1.7, layer: 'floor', show: who('elena') },
        { id: 'training', kind: 'training', x: 17.5, y: 8.4, w: 2.2, h: 2, solid: true, foot: [0, 0.9, 2.2, 1.1], show: who('elena') },
        { kind: 'plant', x: 22.6, y: 11.3, w: 1, h: 1.6, solid: true, foot: [0.1, 1.1, 0.8, 0.5] }
      ]
    },

    /* ---------------- Store (Home Depot in Level 1, Lowe's in Level 2) ---------------- */
    store: {
      bounds: { x0: 0, x1: 24, y1: 14 },
      spawn: { x: 21.9, y: 4.8 },
      items: [
        { kind: 'banner', x: 7.6, y: 0.45, w: 6, h: 1, layer: 'wall' },
        { kind: 'aislesign', x: 4.5, y: 0.55, w: 2.2, h: 0.6, layer: 'wall',
          variant: function (s) { return s.levelId === 'breaks' ? 'AISLE 25' : 'BATH'; } },
        { id: 'door', kind: 'exitdoors', x: 20.6, y: 0.5, w: 2.6, h: 2.5, layer: 'wall' },
        { kind: 'shelves', x: 0.4, y: 1.2, w: 6.6, h: 2.6, solid: true, foot: [0, 1.8, 6.6, 0.8] },
        { id: 'display', kind: 'display', x: 7.6, y: 1.55, w: 6, h: 2.6, solid: true, foot: [0, 1.5, 6, 1.1],
          variant: function (s) { return s.levelId === 'breaks' ? 'toilets' : 'bath'; } },
        { id: 'kohler', kind: 'endcap', x: 14.6, y: 1.2, w: 3, h: 3, solid: true, foot: [0, 2, 3, 1],
          variant: function (s) { return s.levelId === 'breaks' ? 'toilet' : 'bath'; } },
        { kind: 'shelves', x: 18.3, y: 1.2, w: 1.9, h: 2.6, solid: true, foot: [0, 1.8, 1.9, 0.8] },
        { id: 'shelf', kind: 'shelf3', x: 3.2, y: 6.2, w: 4.6, h: 2.2, solid: true, foot: [0, 1.3, 4.6, 0.9], show: L('breaks') },
        { id: 'board', kind: 'board', x: 3.2, y: 6.2, w: 4.6, h: 2.2, solid: true, foot: [0, 1.6, 4.6, 0.6], show: L('project') },
        { id: 'associate', kind: 'npc', look: 'associate', x: 11.5, y: 5.6, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT },
        { id: 'shopper', kind: 'npc', look: 'shopper', x: 17.2, y: 7.6, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: L('breaks') },
        { kind: 'cart', x: 18.4, y: 8, w: 1.5, h: 1.2, solid: true, foot: [0, 0.4, 1.5, 0.8], show: L('breaks') },
        { kind: 'shelves', x: 13.5, y: 10.6, w: 5.5, h: 2.6, solid: true, foot: [0, 0.8, 5.5, 1.8], show: L('breaks') },
        { id: 'contractor', kind: 'npc', look: 'contractor', x: 15.8, y: 8.5, w: 0.9, h: 1.4, solid: true, foot: NPC_FOOT, show: L('project') },
        { kind: 'prodesk', x: 13.5, y: 10.6, w: 5.5, h: 1.9, solid: true, show: L('project') },
        { kind: 'cart', x: 9.2, y: 10.2, w: 1.5, h: 1.2, solid: true, foot: [0, 0.4, 1.5, 0.8], show: L('project') },
        { kind: 'shelves', x: 0.4, y: 10.6, w: 6, h: 2.6, solid: true, foot: [0, 0.8, 6, 1.8] }
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
  function hit(it) { return foot(it) || box(it); }

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

  /* Where the player's feet point (centre x, bottom y) may be. */
  function limits(roomId) {
    var b = rooms[roomId].bounds;
    return { x0: b.x0 * T + PLAYER.w / 2, x1: b.x1 * T - PLAYER.w / 2, y0: WALL_H + PLAYER.h, y1: b.y1 * T - 1 };
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
    var A = root.ART, PR = root.PROPS, info = opts.info || {};
    var items = visible(roomId, s), list = [], i;
    A.shell(ctx, roomId, s.variant, { bounds: rooms[roomId].bounds, accent: info.accent });
    function drawItem(it) {
      var b = box(it);
      PR.draw(ctx, it.kind, b.x, b.y, b.w, b.h, variantOf(it, s), t, { accent: info.accent, store: info.store, look: it.look });
    }
    for (i = 0; i < items.length; i++) if (items[i].layer === 'wall') drawItem(items[i]);
    for (i = 0; i < items.length; i++) if (items[i].layer === 'floor') drawItem(items[i]);
    items.forEach(function (it) {
      if (it.layer === 'wall' || it.layer === 'floor') return;
      list.push({ y: sortY(it), draw: function () { drawItem(it); } });
    });
    (opts.actors || []).forEach(function (a) {
      list.push({ y: a.y, draw: function () { A.character(ctx, a.look, Math.round(a.x) - 6, Math.round(a.y) - 21, a.dir, a.frame); } });
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
    T: T, WALL_H: WALL_H, REACH: REACH, PLAYER: PLAYER, rooms: rooms,
    box: box, foot: foot, hit: hit, anchor: anchor, dist: dist, inReach: inReach, sortY: sortY,
    spawn: spawn, visible: visible, variantOf: variantOf, limits: limits, solidRects: solidRects,
    blocked: blocked, blockedBy: blockedBy, nearest: nearest, path: path
  };
})(typeof window !== 'undefined' ? window : globalThis);
