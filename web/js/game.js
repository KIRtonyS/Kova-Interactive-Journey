/* game.js — the engine. Loaded last (after art.js, props.js, rooms.js, story.js).
   Part 1 is pure logic with no browser calls, so it can be tested with Node.
   Part 2 is the browser engine: loop, input, movement, dialogue, menus. It only starts when a page exists.
   Sets window.GAME. */

/* =====================================================================
   Part 1: logic
   ===================================================================== */
(function (root) {
  'use strict';

  var CPS = 45;          // typewriter speed, characters per second
  var WPS = 3.5;         // comfortable reading speed, words per second
  var WALK = 60;         // walking speed, px per second
  var CARD_SECONDS = 3.5, MENU_SECONDS = 12;

  /* Any text field can be a string, an object keyed by persona id (with "_" as fallback),
     or a function of state. Returns the string, or null if there is nothing for this persona. */
  function text(v, s) {
    var guard = 0;
    while (v != null && typeof v !== 'string' && guard++ < 6) {
      if (typeof v === 'function') v = v(s);
      else if (typeof v === 'object') v = (s.personaId in v) ? v[s.personaId] : v._;
      else v = String(v);
    }
    return typeof v === 'string' ? v : null;
  }

  function newState(levelId, personaId) {
    return { levelId: levelId, personaId: personaId, actIdx: 0, done: {}, flags: {}, pick: null, variant: null };
  }

  /* "pick" is the store choice; everything else is a flag. */
  function applySet(s, set) {
    for (var k in set) {
      if (k === 'pick') s.pick = set[k]; else s.flags[k] = set[k];
    }
  }

  /* Lets a story field that should be a list also be written as a single value. */
  function list(v) { return Array.isArray(v) ? v : (v == null ? [] : [v]); }

  /* The act's things that this persona can use ("only" limits a thing to one or more personas). */
  function thingsOf(act, s) {
    var out = {};
    for (var id in act.things) {
      var only = act.things[id].only;
      if (only && list(only).indexOf(s.personaId) < 0) continue;
      out[id] = act.things[id];
    }
    return out;
  }

  function unlocked(thing, s) {
    return list(thing.after).every(function (id) { return !!s.done[id]; });
  }

  function exitOpen(act, s) {
    return list(act.needs).every(function (id) { return !!s.done[id]; });
  }

  /* Plays a list of story steps one "beat" at a time.
     next()   -> { type: 'narr' | 'thought' | 'speech' | 'choice' | 'screen', ... } or null at the end
     choose(i) picks an option of the current choice */
  function createRunner(steps, s) {
    var queue = (steps || []).slice(), pending = null;

    function next() {
      if (pending) return pending.beat;
      while (queue.length) {
        var st = queue.shift(), tx;
        if (st.when && !st.when(s)) continue;
        if (st.fn) { queue = (st.fn(s) || []).concat(queue); continue; }
        if (st.set) applySet(s, st.set);
        if ('n' in st) {
          tx = text(st.n, s);
          if (tx != null) return { type: 'narr', text: tx };
        } else if ('t' in st) {
          tx = text(st.t, s);
          if (tx != null) return { type: 'thought', text: tx };
        } else if ('s' in st) {
          tx = text(st.text, s);
          if (tx != null) return { type: 'speech', speaker: text(st.s, s) || '', text: tx };
        } else if (st.choice) {
          var options = st.choice.options.filter(function (o) { return !o.when || o.when(s); });
          pending = {
            options: options,
            beat: { type: 'choice', prompt: text(st.choice.prompt, s) || '', options: options.map(function (o) { return text(o.label, s) || ''; }) }
          };
          return pending.beat;
        } else if (st.screen) {
          return { type: 'screen', screen: st.screen };
        }
      }
      return null;
    }

    function choose(i) {
      if (!pending) throw new Error('choose() called with no choice open');
      var o = pending.options[i];
      if (!o) throw new Error('no option ' + i);
      pending = null;
      if (o.set) applySet(s, o.set);
      if (o.then) queue = o.then.concat(queue);
      return o;
    }

    return { next: next, choose: choose, options: function () { return pending ? pending.options : null; } };
  }

  /* Promises that wait for the player's next action, for the game clock, or for whichever comes first.
     fire() is called on an action, advance(clock) every frame, clear() when a flow is abandoned. */
  function createWaits() {
    var actions = [], timers = [], now = 0;
    function drop(arr, x) { var i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); }
    return {
      action: function () { return new Promise(function (res) { actions.push(res); }); },
      time: function (sec) { return new Promise(function (res) { timers.push({ at: now + sec, res: res }); }); },
      /* Whichever happens first. The loser is removed, so it cannot swallow a later key press. */
      actionOr: function (sec) {
        return new Promise(function (res) {
          var a, t;
          a = function () { drop(timers, t); res('action'); };
          t = { at: now + sec, res: function () { drop(actions, a); res('time'); } };
          actions.push(a); timers.push(t);
        });
      },
      fire: function () { var a = actions; actions = []; a.forEach(function (f) { f(); }); return a.length; },
      advance: function (clock) {
        now = clock;
        var due = timers.filter(function (t) { return t.at <= now; });
        if (!due.length) return;
        timers = timers.filter(function (t) { return t.at > now; });
        due.forEach(function (t) { t.res(); });
      },
      pending: function () { return actions.length; },
      clear: function () { actions = []; timers = []; }
    };
  }

  /* The name of a pressed key, in lower case. Letter keys are read by their position on the keyboard,
     so WASD and E work on any layout or input language. */
  function keyName(ev) {
    var code = String(ev.code || ''), m = /^Key([A-Z])$/.exec(code);
    if (m) return m[1].toLowerCase();
    if (code === 'Space') return ' ';
    return String(ev.key || '').toLowerCase();
  }

  /* True for a fresh press of a pause key: Esc, or P (Safari leaves full screen on Esc, so the facilitator
     can use P on a Mac). Held keys auto-repeat; those are ignored so the menu does not flicker. */
  function pauseKey(ev) {
    var k = keyName(ev);
    return !ev.repeat && (k === 'escape' || k === 'p');
  }

  /* Moves the player's feet point by (dx, dy), one axis at a time, so walls can be slid along. */
  function move(pos, dx, dy, lim, rects) {
    var R = root.ROOMS, x = pos.x, y = pos.y;
    if (dx && !R.blockedBy(lim, rects, x + dx, y)) x += dx;
    if (dy && !R.blockedBy(lim, rects, x, y + dy)) y += dy;
    return { x: x, y: y };
  }

  function countWords(str) {
    var m = String(str || '').match(/\S+/g);
    return m ? m.length : 0;
  }

  /* How long one line stays on screen for a typical reader: typing time or reading time, plus a key press. */
  function beatSeconds(str) {
    return Math.max(String(str).length / CPS, countWords(str) / WPS) + 0.6;
  }

  /* All readable strings inside a screen (overlay) definition, resolved for this persona. */
  function screenLines(node, s, out) {
    out = out || [];
    if (node == null) return out;
    if (typeof node === 'function') return screenLines(node(s), s, out);
    if (typeof node === 'string') { if (node) out.push(node); return out; }
    if (Array.isArray(node)) { node.forEach(function (v) { screenLines(v, s, out); }); return out; }
    if (typeof node === 'object') {
      if (s.personaId in node || '_' in node) return screenLines(text(node, s), s, out);
      for (var k in node) if (k !== 'kind' && k !== 'tone') screenLines(node[k], s, out);
    }
    return out;
  }

  /* Plays one persona's path through a level without a browser: walks to every required object in an
     order that respects "after", takes the store option that sets `pick`, and adds up reading and
     walking time. Reports anything that would strand a player. opts.optional also visits optional objects. */
  function simulate(story, rooms, levelId, personaId, pick, opts) {
    opts = opts || {};
    var errors = [];
    var res = { ok: false, errors: errors, seconds: MENU_SECONDS, words: 0, beats: 0, acts: [], lines: [], state: null, ending: null };
    var level = (story.levels || []).filter(function (l) { return l.id === levelId; })[0];
    if (!level) { errors.push('no level "' + levelId + '"'); return res; }
    var s = newState(levelId, personaId);
    res.state = s;

    function runSteps(steps) {
      var run = createRunner(steps, s), b, guard = 0;
      while ((b = run.next()) && guard++ < 500) {
        res.beats++;
        if (b.type === 'choice') {
          var raw = run.options(), w = countWords(b.prompt);
          if (!raw.length) { errors.push('a choice has no options for ' + personaId); return; }
          var idx = Math.min(opts.choose || 0, raw.length - 1);
          res.lines.push(b.prompt);
          for (var i = 0; i < raw.length; i++) {
            w += countWords(b.options[i]);
            res.lines.push(b.options[i]);
            if (raw[i].set && raw[i].set.pick === pick) idx = i;
          }
          res.words += w; res.seconds += 2.5 + w / WPS;
          run.choose(idx);
        } else if (b.type === 'screen') {
          var sw = 0;
          screenLines(b.screen, s).forEach(function (ln) { sw += countWords(ln); res.lines.push(ln); });
          res.words += sw; res.seconds += 3 + sw / WPS;
        } else {
          res.lines.push(b.text);
          res.words += countWords(b.text); res.seconds += beatSeconds(b.text);
        }
      }
    }

    function walk(act, pos, item, usable, what) {
      var p = rooms.path(act.room, s, pos, item, usable);
      if (!p) { errors.push(what + ' cannot be reached'); return pos; }
      for (var i = 1; i < p.length; i++) res.seconds += Math.abs(p[i].x - p[i - 1].x + p[i].y - p[i - 1].y) / WALK;
      return p[p.length - 1];
    }

    level.acts.forEach(function (act, i) {
      var tag = 'act ' + (i + 1) + ': ', t0 = res.seconds, w0 = res.words;
      s.actIdx = i; s.done = {}; s.variant = act.variant || null;
      if (!rooms.rooms[act.room]) { errors.push(tag + 'unknown room "' + act.room + '"'); return; }
      res.seconds += CARD_SECONDS;
      [act.card && act.card.time, act.card && act.card.line, act.chip].forEach(function (v) {
        var ln = text(v, s);
        if (ln) { res.lines.push(ln); res.words += countWords(ln); }
      });
      runSteps(act.intro);

      var things = thingsOf(act, s), vis = rooms.visible(act.room, s);
      var itemOf = {}, usable = [];
      vis.forEach(function (it) {
        if (it.id && (things[it.id] || it.id === act.exit)) { itemOf[it.id] = it; usable.push(it); }
      });
      Object.keys(things).forEach(function (id) {
        if (!itemOf[id]) errors.push(tag + '"' + id + '" has no object in the ' + act.room + ' for ' + personaId);
      });
      list(act.needs).forEach(function (id) {
        if (!things[id]) errors.push(tag + 'needs "' + id + '", which ' + personaId + ' cannot use');
      });

      var pos = rooms.spawn(act.room), guard = 0;
      while (guard++ < 50) {
        var id = Object.keys(things).filter(function (k) {
          return !s.done[k] && itemOf[k] && unlocked(things[k], s) && (list(act.needs).indexOf(k) >= 0 || opts.optional);
        })[0];
        if (!id) break;
        pos = walk(act, pos, itemOf[id], usable, tag + '"' + id + '"');
        runSteps(things[id].steps);
        s.done[id] = true;
      }
      if (!exitOpen(act, s)) {
        errors.push(tag + 'dead end, the exit never opens (still needed: ' +
          list(act.needs).filter(function (k) { return !s.done[k]; }).join(', ') + ')');
      }
      if (!itemOf[act.exit]) errors.push(tag + 'exit "' + act.exit + '" has no object in the ' + act.room);
      else walk(act, pos, itemOf[act.exit], usable, tag + 'the exit');
      runSteps(act.leave);
      res.acts.push({ seconds: res.seconds - t0, words: res.words - w0 });
    });

    var lines = typeof level.ending === 'function' ? level.ending(s) : null;
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 4 ||
        lines.some(function (l) { return typeof l !== 'string' || !l.trim(); })) {
      errors.push('ending for ' + personaId + ' / ' + pick + ' must be 1 to 4 lines of text');
    } else {
      res.ending = lines;
      lines.forEach(function (l) { res.lines.push(l); res.words += countWords(l); res.seconds += beatSeconds(l) + 1; });
    }
    res.ok = errors.length === 0;
    return res;
  }

  /* The picture behind the title: the renovated bathroom, tidy, with the three personas facing the viewer.
     zoom enlarges the room so that it fills the width of the screen. */
  function titleScene(rooms) {
    var b = rooms.rooms.bathroom.bounds, T = rooms.T, feet = 4.4 * T;
    function at(look, tilesFromLeft) { return { look: look, x: (b.x0 + tilesFromLeft) * T, y: feet, dir: 'down', frame: 0 }; }
    return {
      room: 'bathroom', zoom: 24 / (b.x1 - b.x0),
      state: { levelId: 'title', personaId: null, actIdx: -1, variant: 'new', done: {}, flags: {}, pick: null },
      actors: [at('david', 2.2), at('maya', 6.5), at('elena', 8.55)]
    };
  }

  root.GAME = {
    logic: {
      CPS: CPS, WPS: WPS, WALK: WALK,
      text: text, newState: newState, applySet: applySet, list: list, thingsOf: thingsOf, unlocked: unlocked, exitOpen: exitOpen,
      createWaits: createWaits, keyName: keyName, pauseKey: pauseKey,
      createRunner: createRunner, move: move, countWords: countWords, beatSeconds: beatSeconds,
      screenLines: screenLines, simulate: simulate, titleScene: titleScene
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* =====================================================================
   Part 2: browser engine
   ===================================================================== */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return; // loaded by a test: logic only

  var A = root.ART, R = root.ROOMS, G = root.GAME, L = G.logic, STORY = null;
  var STAGE_W = 768, STAGE_H = 448;

  /* speed multiplies the game clock. The self-play test raises it; players never change it. */
  var config = { speed: 1 };

  /* Interface words. story.js can replace any of them in STORY.ui. */
  var UI = {
    start: 'Press Enter to begin',
    chooseLevel: 'Choose a journey',
    choosePersona: 'Who are you today?',
    minutes: 'About {n} minutes',
    at: 'Nearest store: {store}',
    back: 'Esc: back',
    hint: 'Walk with WASD or the arrow keys. Press E at a gold marker.',
    exitLabel: 'Leave',
    locked: 'Not yet. Something else comes first.',
    notYet: 'Not yet.',
    close: 'Press E to close',
    more: 'E',
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart level',
    mainMenu: 'Main menu',
    endPrompt: 'Press Enter to choose another journey',
    missing: 'story.js did not load, so there is nothing to play. If you just edited it, look for a missing quote or comma (an apostrophe inside a line needs a backslash before it). Otherwise check that js/story.js is next to game.js.'
  };

  var el = {}, ctx = null;
  var mode = 'boot';         // title | levels | personas | card | play | talk | ending
  var paused = false, clock = 0, last = 0;
  var state = null, level = null, act = null, persona = null, things = {};
  var scene = null;          // cached per act: items, solids, limits, usable items
  var player = { x: 0, y: 0, dir: 'down', frame: 0, walk: 0 };
  var keys = {}, near = null, usedSomething = false, hintText = '';
  var dialog = null;         // the line being typed out
  var waits = L.createWaits();
  var sel = null, selStack = [];

  /* ---------- small helpers ---------- */
  function h(tag, cls, parent, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    if (parent) parent.appendChild(e);
    return e;
  }
  function show(e, on) { e.hidden = !on; }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function ui(key, vars) {
    var s = (STORY && STORY.ui && STORY.ui[key]) || UI[key] || '';
    for (var k in (vars || {})) s = s.replace('{' + k + '}', vars[k]);
    return s;
  }
  function tx(v) { return L.text(v, state || { personaId: '_' }) || ''; }

  /* ---------- waiting for the player or the clock ---------- */
  function waitAction() { return waits.action(); }
  function waitTime(sec) { return waits.time(sec); }

  /* Drops every pending wait, so any story flow in progress simply never continues. */
  function cancelAll() {
    waits.clear(); sel = null; selStack = []; dialog = null; paused = false; keys = {};
    [el.dialog, el.choice, el.screen, el.card, el.pause, el.hint, el.chip].forEach(function (e) { show(e, false); });
    hintText = '';
  }

  /* ---------- a list of options driven by keys or mouse (menus, choices, pause) ---------- */
  /* guard: seconds during which a pick is ignored, so a key pressed for the previous line cannot choose by accident. */
  function setSel(items, onPick, onBack, start, guard) {
    sel = { items: items, index: 0, onPick: onPick, onBack: onBack, armAt: clock + (guard || 0) };
    items.forEach(function (e, i) {
      e.tabIndex = -1;                                   // keys are handled here, not by browser focus
      e.onmousedown = function (ev) { ev.preventDefault(); };
      // mousemove, not mouseenter: a cursor resting where a menu opens must not pre-select an option
      e.onmousemove = function () { if (sel && sel.items === items && sel.index !== i) mark(i); };
      e.onclick = function (ev) { ev.stopPropagation(); if (sel && sel.items === items) { mark(i); if (clock >= sel.armAt) sel.onPick(i); } };
    });
    mark(start || 0);
  }
  function mark(i) {
    sel.index = i;
    sel.items.forEach(function (e, j) { e.classList.toggle('on', j === i); });
  }
  function selKey(k) {
    var n = sel.items.length;
    if (k === 'arrowleft' || k === 'arrowup' || k === 'a' || k === 'w') mark((sel.index - 1 + n) % n);
    else if (k === 'arrowright' || k === 'arrowdown' || k === 'd' || k === 's') mark((sel.index + 1) % n);
    else if (k === 'e' || k === ' ' || k === 'enter') { if (clock >= sel.armAt) sel.onPick(sel.index); }
    else if (/^[1-9]$/.test(k) && +k <= n) { mark(+k - 1); if (clock >= sel.armAt) sel.onPick(+k - 1); }
  }

  /* ---------- input ---------- */
  function onKeyDown(ev) {
    var k = L.keyName(ev);
    var inRoom = paused || mode === 'card' || mode === 'play' || mode === 'talk' || mode === 'ending';
    if (k === 'escape' || (k === 'p' && inRoom)) {   // P only pauses in a level; in menus it does nothing
      ev.preventDefault();
      if (L.pauseKey(ev)) onEscape();
      return;
    }
    // no page scrolling, and Tab must not move focus out of the game
    if (k === ' ' || k === 'tab' || k.indexOf('arrow') === 0) ev.preventDefault();
    if (sel) { if (!ev.repeat) selKey(k); return; }
    if (k === 'e' || k === ' ' || k === 'enter') { if (!ev.repeat) onAction(); return; }
    keys[k] = true;
  }
  function onKeyUp(ev) { keys[L.keyName(ev)] = false; }

  function onAction() {
    if (paused) return;
    if (waits.pending()) waits.fire();
    else if (mode === 'play') interact();
  }

  function onEscape() {
    if (paused) return closePause();
    if (mode === 'levels') return goTitle();
    if (mode === 'personas') return goLevels(STORY.levels.indexOf(level));
    if (mode === 'card' || mode === 'play' || mode === 'talk' || mode === 'ending') openPause();
  }

  /* ---------- pause menu (for the facilitator) ---------- */
  function openPause() {
    paused = true; keys = {};
    selStack.push(sel);
    clear(el.pause);
    var box = h('div', 'panel', el.pause);
    h('h2', '', box, ui('paused'));
    var items = [h('button', 'opt', box, ui('resume')), h('button', 'opt', box, ui('restart')), h('button', 'opt', box, ui('mainMenu'))];
    show(el.pause, true);
    setSel(items, function (i) {
      if (i === 0) return closePause();
      var lv = level.id, pe = persona.id;
      cancelAll();
      if (i === 1) startLevel(lv, pe); else goTitle();
    });
  }
  function closePause() {
    paused = false; show(el.pause, false);
    sel = selStack.pop() || null;
    last = 0;
  }

  /* ---------- menus ---------- */
  function goTitle() {
    cancelAll(); mode = 'title'; state = null; level = null; act = null;
    clear(el.menu); el.menu.className = 'menu title'; show(el.menu, true);
    el.titleView = h('canvas', 'bg', el.menu);     // the title picture is a scene from the game
    paintTitle();
    var box = h('div', 'titlebox', el.menu);
    h('h1', '', box, STORY.title || '');
    h('p', 'sub', box, STORY.subtitle || '');
    var go = h('button', 'opt go', box, ui('start'));
    if (STORY.ui && STORY.ui.credits) h('p', 'credits', el.menu, STORY.ui.credits);   // the art licence asks for credit
    setSel([go], function () { goLevels(0); }, null, 0, 0.3);
  }

  /* Draws the title scene, enlarged. Called again when the pictures have loaded. */
  function paintTitle() {
    var cv = el.titleView;
    if (!cv || mode !== 'title') return;
    var SP = root.SPRITES, sc = (SP && SP.SCALE) || 1, sceneT = L.titleScene(R), k = sc * sceneT.zoom;
    cv.width = A.W * sc; cv.height = A.H * sc;
    var c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.setTransform(k, 0, 0, k, -R.rooms[sceneT.room].bounds.x0 * R.T * k, 0);
    R.render(c, sceneT.room, sceneT.state, 0, { actors: sceneT.actors });
  }

  function goLevels(startIdx) {
    cancelAll(); mode = 'levels'; state = null; act = null;
    clear(el.menu); el.menu.className = 'menu pick'; show(el.menu, true);
    h('h2', 'ask', el.menu, ui('chooseLevel'));
    var row = h('div', 'cards', el.menu);
    var items = STORY.levels.map(function (lv) {
      var c = h('button', 'pcard level', row);
      h('h3', '', c, lv.name);
      h('p', 'pitch', c, lv.pitch);
      h('p', 'meta', c, ui('minutes', { n: lv.minutes || 5 }));
      h('p', 'meta', c, ui('at', { store: lv.store }));
      return c;
    });
    h('p', 'backhint', el.menu, ui('back'));
    setSel(items, function (i) { goPersonas(STORY.levels[i].id); }, null, startIdx > 0 ? startIdx : 0, 0.3);
  }

  function goPersonas(levelId) {
    cancelAll(); mode = 'personas';
    level = STORY.levels.filter(function (l) { return l.id === levelId; })[0];
    clear(el.menu); el.menu.className = 'menu pick'; show(el.menu, true);
    h('h2', 'ask', el.menu, ui('choosePersona'));
    var row = h('div', 'cards', el.menu);
    var items = level.personas.map(function (pid) {
      var p = STORY.personas[pid], c = h('button', 'pcard persona', row);
      var cv = h('canvas', 'portrait', c);
      A.portrait(cv, p.look || pid);
      var txt = h('div', 'ptext', c);
      h('h3', '', txt, p.name + ', ' + p.age);
      h('p', 'role', txt, p.role);
      h('p', 'pitch', txt, (p.trigger && p.trigger[levelId]) || p.blurb || '');
      h('p', 'tag', txt, p.tagline || '');
      return c;
    });
    h('p', 'backhint', el.menu, ui('back'));
    setSel(items, function (i) { startLevel(levelId, level.personas[i]); }, null, 0, 0.3);
  }

  /* ---------- level and act flow ---------- */
  function startLevel(levelId, personaId) {
    cancelAll(); show(el.menu, false);
    level = STORY.levels.filter(function (l) { return l.id === levelId; })[0];
    persona = Object.assign({ id: personaId }, STORY.personas[personaId]);
    state = L.newState(levelId, personaId);
    usedSomething = false;
    startAct(0);
  }

  function refreshScene() {
    var items = R.visible(act.room, state);
    scene = {
      items: items,
      rects: items.filter(function (it) { return it.solid; }).map(R.foot),
      lim: R.limits(act.room),
      usable: items.filter(function (it) {
        if (!it.id) return false;
        if (it.id === act.exit) return true;
        var th = things[it.id];
        return !!th && (!state.done[it.id] || !!th.again);
      })
    };
  }

  function markers() {
    return scene.usable.filter(function (it) {
      if (it.id === act.exit) return L.exitOpen(act, state);
      var th = things[it.id];
      return !state.done[it.id] && L.list(act.needs).indexOf(it.id) >= 0 && L.unlocked(th, state);
    });
  }

  function storeInfo() {
    var name = level.store || '';
    return { store: name.toUpperCase(), accent: /lowe/i.test(name) ? A.PAL.lowesNavy : A.PAL.hdOrange };
  }

  async function startAct(i) {
    state.actIdx = i; state.done = {};
    act = level.acts[i];
    state.variant = act.variant || null;
    things = L.thingsOf(act, state);
    refreshScene();
    var sp = R.spawn(act.room);
    player.x = sp.x; player.y = sp.y; player.dir = 'down'; player.frame = 0;
    near = null; setHint('');
    mode = 'card';
    clear(el.card); el.card.className = 'card';
    h('p', 'time', el.card, tx(act.card && act.card.time));
    h('p', 'place', el.card, tx(act.card && act.card.line));
    show(el.card, true); show(el.chip, false);
    await waitTime(0.7);
    await waits.actionOr(3.3);
    show(el.card, false);
    el.chip.textContent = tx(act.chip); show(el.chip, !!el.chip.textContent);
    mode = 'play';
    if (act.intro) await playSteps(act.intro);
  }

  function nextAct() {
    if (act.final || state.actIdx + 1 >= level.acts.length) return showEnding();
    return startAct(state.actIdx + 1);
  }

  async function showEnding() {
    mode = 'ending'; setHint(''); show(el.chip, false);
    var lines = level.ending(state) || [];
    clear(el.card); el.card.className = 'card ending';
    var cv = h('canvas', 'portrait', el.card);
    A.portrait(cv, persona.look || persona.id);
    h('p', 'endname', el.card, persona.name);
    var box = h('div', 'endlines', el.card);
    show(el.card, true);
    await waitTime(0.8);
    for (var i = 0; i < lines.length; i++) {
      h('p', 'endline', box, lines[i]);
      await waitTime(0.8);
      await waits.actionOr(L.beatSeconds(lines[i]) + 2.5);
    }
    h('p', 'endprompt', el.card, ui('endPrompt'));
    await waitTime(0.6);
    await waitAction();
    goLevels(STORY.levels.indexOf(level));
  }

  /* ---------- dialogue ---------- */
  function hideDialog() { show(el.dialog, false); dialog = null; }

  async function say(beat) {
    el.dialog.className = 'dialog ' + beat.type;
    el.who.textContent = beat.type === 'speech' ? beat.speaker : beat.type === 'thought' ? persona.name : '';
    show(el.who, !!el.who.textContent);
    dialog = { full: beat.text, shown: 0, done: false };
    paintLine();
    show(el.dialog, true);
    await waitAction();
    if (dialog && !dialog.done) {           // first press finishes the line, second moves on
      dialog.shown = dialog.full.length; dialog.done = true; paintLine();
      await waitAction();
    }
  }

  /* The untyped part of the line is kept in place but invisible, so the box never jumps. */
  function paintLine() {
    var n = Math.floor(dialog.shown);
    el.lineOn.textContent = dialog.full.slice(0, n);
    el.lineOff.textContent = dialog.full.slice(n);
    el.more.style.visibility = dialog.done ? 'visible' : 'hidden';
  }

  function askChoice(beat) {
    return new Promise(function (res) {
      clear(el.choice);
      h('p', 'prompt', el.choice, beat.prompt);
      var items = beat.options.map(function (o) { return h('button', 'opt', el.choice, o); });
      show(el.choice, true);
      setSel(items, function (i) { show(el.choice, false); sel = null; res(i); }, null, 0, 0.6);
    });
  }

  /* Overlays: 'browser' (search results), 'phone' (an app or messages), 'paper' (a card, a manual, a notebook). */
  async function showScreen(def) {
    clear(el.screen);
    var kind = def.kind || 'paper', win;
    if (kind === 'browser') {
      win = h('div', 'win browser', el.screen);
      var tabs = h('div', 'tabs', win);
      L.list(def.tabs).forEach(function (t, j) { h('span', 'tab' + (j === 0 ? ' on' : ''), tabs, tx(t)); });
      var bar = h('div', 'bar', win);
      h('span', 'url', bar, tx(def.query));
      var list = h('div', 'results', win);
      L.list(def.results).forEach(function (r) {
        var row = h('div', 'res' + (r.sponsored ? ' sponsored' : ''), list);
        var left = h('div', 'resmain', row);
        var meta = h('div', 'resmeta', left);
        if (tx(r.tag)) h('span', 'tag' + (r.sponsored ? ' ad' : ''), meta, tx(r.tag));
        h('span', 'site', meta, tx(r.site));
        h('div', 'ttl', left, tx(r.title));
        if (tx(r.line)) h('div', 'ln', left, tx(r.line));
        h('div', 'price' + (tx(r.price) ? '' : ' none'), row, tx(r.price) || tx(r.noPrice));
      });
    } else if (kind === 'phone') {
      win = h('div', 'win phone', el.screen);
      h('div', 'app', win, tx(def.app));
      if (tx(def.head)) h('div', 'head', win, tx(def.head));
      var rows = h('div', 'rows', win);
      L.list(def.rows).forEach(function (r) {
        var row = h('div', 'row', rows);
        h('div', 'rt', row, tx(r.title));
        if (tx(r.line)) h('div', 'rl', row, tx(r.line));
        if (tx(r.badge)) h('span', 'badge ' + (r.tone || 'plain'), row, tx(r.badge));
      });
      if (tx(def.foot)) h('div', 'foot', win, tx(def.foot));
    } else {
      win = h('div', 'win paper', el.screen);
      if (tx(def.title)) h('div', 'ptitle', win, tx(def.title));
      L.list(def.lines).forEach(function (ln) {
        var struck = !!(ln && typeof ln === 'object' && ln.struck);
        h('div', 'pl' + (struck ? ' struck' : ''), win, tx(struck ? ln.text : ln));
      });
    }
    h('div', 'closehint', el.screen, ui('close'));
    show(el.screen, true);
    await waitTime(0.8);          // a quick double press cannot skip the screen unseen
    await waitAction();
    show(el.screen, false);
  }

  async function playSteps(steps) {
    mode = 'talk'; keys = {}; setHint('');
    player.frame = 0;                         // stand still while reading, not frozen mid-stride
    var run = L.createRunner(steps, state), b;
    while ((b = run.next())) {
      try {
        if (b.type === 'choice') { hideDialog(); run.choose(await askChoice(b)); }
        else if (b.type === 'screen') { hideDialog(); await showScreen(b.screen); }
        else await say(b);
      } catch (err) {                         // a broken step is skipped, so one mistake in story.js cannot freeze the room
        show(el.screen, false);
        if (root.console) root.console.error('story step failed:', err);
      }
    }
    hideDialog();
    mode = 'play';
  }

  async function interact() {
    if (mode !== 'play' || !near) return;
    var id = near.id, th = things[id];
    if (id === act.exit) {
      if (!L.exitOpen(act, state)) return playSteps([{ n: tx(act.notYet) || ui('notYet') }]);
      await playSteps(act.leave || []);
      return nextAct();
    }
    if (!L.unlocked(th, state)) return playSteps([{ n: tx(th.locked) || tx(act.locked) || ui('locked') }]);
    if (state.done[id]) { if (th.again) await playSteps(th.again); return; }
    await playSteps(th.steps);
    state.done[id] = true;
    usedSomething = true;
    refreshScene();
  }

  /* ---------- per-frame update ---------- */
  function setHint(s) {
    if (s === hintText) return;
    hintText = s;
    el.hint.textContent = s;
    show(el.hint, !!s);
  }

  function updatePlayer(dt) {
    var dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    var dy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    if (dx || dy) {
      var len = Math.sqrt(dx * dx + dy * dy), dist = L.WALK * dt;
      var n = Math.max(1, Math.ceil(dist / 2)), sx = dx / len * dist / n, sy = dy / len * dist / n;
      for (var i = 0; i < n; i++) {            // small steps, so a fast clock cannot jump through furniture
        var p = L.move(player, sx, sy, scene.lim, scene.rects);
        player.x = p.x; player.y = p.y;
      }
      player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      player.walk += dt;
      player.frame = 1 + Math.floor(player.walk / 0.14) % 2;
    } else {
      player.frame = 0;
    }
    near = R.nearest(scene.usable, player.x, player.y);
    if (near) {
      var label = near.id === act.exit ? (tx(act.exitLabel) || ui('exitLabel')) : tx(things[near.id].label);
      setHint('E  ' + label);
    } else {
      setHint(usedSomething ? '' : ui('hint'));
    }
  }

  function draw() {
    R.render(ctx, act.room, state, clock, {
      info: storeInfo(), markers: mode === 'play' ? markers() : [],
      actors: [{ x: player.x, y: player.y, look: persona.look || persona.id, dir: player.dir, frame: player.frame, walk: player.walk }]
    });
  }

  function tick(ts) {
    var dt = last ? Math.min(0.05, (ts - last) / 1000) * config.speed : 0;
    last = ts;
    try {
    if (!paused) {
      clock += dt;
      waits.advance(clock);
      if (mode === 'play' && scene) updatePlayer(dt);
      if (dialog && !dialog.done) {
        dialog.shown += dt * L.CPS;
        if (dialog.shown >= dialog.full.length) { dialog.shown = dialog.full.length; dialog.done = true; }
        paintLine();
      }
    }
    if (act && scene && (mode === 'play' || mode === 'talk' || mode === 'card')) draw();
    } catch (err) {                           // keep the loop alive: the pause menu must still work after a story mistake
      if (root.console && !tick.warned) { tick.warned = true; root.console.error('frame failed:', err); }
    }
    root.requestAnimationFrame(tick);
  }

  /* ---------- start-up ---------- */
  function fit() {
    var s = Math.min(root.innerWidth / STAGE_W, root.innerHeight / STAGE_H);
    el.stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  function boot() {
    el.stage = document.getElementById('stage');
    if (!el.stage) return;
    el.view = h('canvas', 'view', el.stage);
    /* The canvas is finer than the game's own 384x224 coordinates, so image sprites keep their detail.
       Everything is still drawn in game pixels; the transform does the scaling. */
    var SP = root.SPRITES, sc = (SP && SP.SCALE) || 1;
    el.view.width = A.W * sc; el.view.height = A.H * sc;
    ctx = el.view.getContext('2d');
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (SP) SP.load('', function () { paintTitle(); });   // falls back to the drawn art if any picture is missing
    el.chip = h('div', 'chip', el.stage);
    el.hint = h('div', 'hint', el.stage);
    el.dialog = h('div', 'dialog', el.stage);
    el.who = h('div', 'who', el.dialog);
    var line = h('p', 'line', el.dialog);
    el.lineOn = h('span', 'on', line);
    el.lineOff = h('span', 'off', line);
    el.more = h('div', 'more', el.dialog, ui('more'));
    el.choice = h('div', 'choice', el.stage);
    el.screen = h('div', 'screen', el.stage);
    el.card = h('div', 'card', el.stage);
    el.menu = h('div', 'menu', el.stage);
    el.pause = h('div', 'pause', el.stage);
    [el.chip, el.hint, el.dialog, el.choice, el.screen, el.card, el.menu, el.pause].forEach(function (e) { show(e, false); });

    fit();
    root.addEventListener('resize', fit);
    STORY = root.STORY;
    if (!STORY || !STORY.levels) {
      el.menu.className = 'menu pick'; show(el.menu, true);
      h('p', 'ask', el.menu, UI.missing);
      return;
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    root.addEventListener('blur', function () { keys = {}; });
    el.stage.addEventListener('click', onAction);
    goTitle();
    root.requestAnimationFrame(tick);
  }

  /* Read-only view of the engine for the self-play test page. */
  G.config = config;
  G.peek = function () {
    return { mode: mode, paused: paused, state: state, level: level, act: act, persona: persona, things: things,
      scene: scene, player: player, near: near, sel: sel, clock: clock, dialog: dialog,
      waiting: waits.pending(), screenOpen: el.screen ? !el.screen.hidden : false };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
