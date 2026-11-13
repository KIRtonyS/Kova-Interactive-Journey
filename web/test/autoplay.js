/* autoplay.js — plays the real game by sending real key events. Dev-only (used by playtest.html).

   Query options:
     level=breaks|project   persona=david|elena|maya   pick=<store choice>
     optional=1             also use every optional object
     choose=1               on choices that do not set the purchase, take this option (default 0)
     speed=20  walk=4       clock multiplier while reading; most px per frame while walking
     mash=1                 press E on every frame while text or a choice is up, like an impatient player
     mouse=1                advance text and pick options with mouse clicks instead of keys
     pauseAt=1&pauseDo=resume|restart|menu   open the pause menu during a line in that act and pick an option
     nth=2                  with stop=say, stop at the 2nd line of that object instead of the 1st
     stop=<where>           stop driving at a point so a screenshot can be taken:
                            title | levels | personas | card:<act> | play:<act> | say:<act>:<thing>
                            | screen:<act>:<thing> | choice:<act>:<thing> | ending | pause:<act>
   The result is written as JSON into <pre id="result"> and the page title becomes "PLAYTEST PASS" or "PLAYTEST FAIL". */
(function () {
  'use strict';
  var q = {};
  location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
    var p = kv.split('='); if (p[0]) q[p[0]] = decodeURIComponent(p[1] || '');
  });
  var want = {
    level: q.level || 'breaks', persona: q.persona || 'david', pick: q.pick || 'shelf',
    optional: q.optional === '1', choose: +(q.choose || 0),
    talkSpeed: +(q.speed || 20), walkSpeed: +(q.walk || 4), stop: q.stop || '', nth: +(q.nth || 1),
    mouse: q.mouse === '1', mash: q.mash === '1', pauseAt: q.pauseAt == null ? -1 : +q.pauseAt, pauseDo: q.pauseDo || ''
  };
  var out = { ok: false, done: false, want: want, errors: [], acts: [], ending: [], clock: 0, stoppedAt: null };
  var L = GAME.logic, held = {}, stopped = false, seenEnding = false, current = null;
  var lastSig = '', sameFrames = 0, saidLines = [], pausedOnce = false;

  window.addEventListener('error', function (e) {
    out.errors.push('error: ' + e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno);
  });
  window.addEventListener('unhandledrejection', function (e) {
    out.errors.push('unhandled rejection: ' + ((e.reason && e.reason.message) || e.reason));
  });
  var origError = console.error;
  console.error = function () {
    out.errors.push('console.error: ' + Array.prototype.join.call(arguments, ' '));
    origError.apply(console, arguments);
  };

  function key(type, k) { document.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true })); }
  function tap(k) { key('keydown', k); key('keyup', k); }
  function hold(k, on) { if (!!held[k] === !!on) return; held[k] = !!on; key(on ? 'keydown' : 'keyup', k); }
  function releaseAll() { ['w', 'a', 's', 'd'].forEach(function (k) { hold(k, false); }); }
  /* Continue text, close a screen, dismiss a card: a key press, or a click on the stage in mouse mode. */
  function advance(k) { if (want.mouse) document.getElementById('stage').click(); else tap(k); }
  /* Pick option idx of the open list: walk to it with the arrow keys, or click it in mouse mode. */
  function pickIndex(p, idx, nextKey) {
    if (want.mouse) p.sel.items[idx].click();
    else if (p.sel.index === idx) tap('Enter');
    else tap(nextKey);
  }

  function write() {
    document.getElementById('result').textContent = JSON.stringify(out);
  }
  function finish(ok, why) {
    releaseAll();
    out.done = true;
    if (why) out.errors.push(why);
    out.ok = !!ok && out.errors.length === 0;
    out.clock = Math.round(GAME.peek().clock);
    write();
    document.title = out.ok ? 'PLAYTEST PASS' : 'PLAYTEST FAIL';
  }
  function halt(where) {
    releaseAll(); stopped = true; GAME.config.speed = 1;
    out.stoppedAt = where; out.done = true; out.ok = out.errors.length === 0;
    write();
    document.title = 'PLAYTEST STOPPED';
  }

  /* Every choice option in the current act, by its label as shown to this persona. */
  function optionsByLabel(p) {
    var map = {};
    (function walk(steps) {
      (steps || []).forEach(function (st) {
        if (st.choice) st.choice.options.forEach(function (o) { map[L.text(o.label, p.state)] = o; walk(o.then); });
      });
    })(Object.keys(p.things).reduce(function (all, id) { return all.concat(p.things[id].steps || []); }, []));
    return map;
  }

  function selectTo(p, idx) {
    if (p.sel) pickIndex(p, idx, 'ArrowRight');
  }

  function chooseOption(p) {
    var map = optionsByLabel(p), idx = Math.min(want.choose, p.sel.items.length - 1);
    p.sel.items.forEach(function (e, i) {
      var o = map[e.textContent];
      if (o && o.set && o.set.pick === want.pick) idx = i;
    });
    pickIndex(p, idx, 'ArrowDown');
  }

  function nextTarget(p) {
    var needs = p.act.needs || [];
    var ids = Object.keys(p.things).filter(function (id) {
      return !p.state.done[id] && L.unlocked(p.things[id], p.state) && (needs.indexOf(id) >= 0 || want.optional);
    });
    if (ids.length) return ids[0];
    return L.exitOpen(p.act, p.state) ? p.act.exit : null;
  }

  function drive(p) {
    var id = nextTarget(p);
    if (!id) return finish(false, 'act ' + (p.state.actIdx + 1) + ': nothing left to use, but the exit is closed');
    var item = p.scene.usable.filter(function (it) { return it.id === id; })[0];
    if (!item) return finish(false, 'act ' + (p.state.actIdx + 1) + ': "' + id + '" is not a usable object in the room');
    current = id;
    if (p.near === item) {
      releaseAll();
      var list = out.acts[p.state.actIdx] = out.acts[p.state.actIdx] || [];
      if (list[list.length - 1] !== id) list.push(id);
      tap('e');
      return;
    }
    var path = ROOMS.path(p.act.room, p.state, p.player, item, p.scene.usable, 2);
    if (!path) return finish(false, 'act ' + (p.state.actIdx + 1) + ': no way to walk to "' + id + '"');
    steer(p, path, item);
  }

  /* Follows the 4 px grid path one axis at a time. The clock speed is set from the distance left,
     so the player lands on each corner instead of overshooting it. */
  function steer(p, path, item) {
    var x = p.player.x, y = p.player.y, a = path[0], tx = a.x, ty = a.y, alongX = false;
    if (path.length > 1) {
      var dirX = path[1].x - a.x, dirY = path[1].y - a.y, i = 1;
      while (i + 1 < path.length && path[i + 1].x - path[i].x === dirX && path[i + 1].y - path[i].y === dirY) i++;
      alongX = dirX !== 0;
      if (alongX) { ty = a.y; tx = Math.abs(a.y - y) > 1 ? x : path[i].x; }      // get onto the row first, then run along it
      else { tx = a.x; ty = Math.abs(a.x - x) > 1 ? y : path[i].y; }
    } else if (Math.abs(a.x - x) <= 0.75 && Math.abs(a.y - y) <= 0.75) {
      var an = ROOMS.anchor(item);                                           // on the last cell but not selecting yet
      tx = an.x; ty = an.y;
    }
    var dx = tx - x, dy = ty - y;
    if (Math.abs(dx) > 0.75 && Math.abs(dy) > 0.75) { if (alongX) dx = 0; else dy = 0; }   // one axis at a time
    var left = Math.max(Math.abs(dx), Math.abs(dy));
    GAME.config.speed = Math.max(0.25, Math.min(want.walkSpeed, left));    // about `speed` px per frame
    hold('d', dx > 0.75); hold('a', dx < -0.75); hold('s', dy > 0.75); hold('w', dy < -0.75);
  }

  /* stop=... handling. Returns true if the run should freeze here. */
  function shouldStop(p) {
    if (!want.stop) return false;
    var s = want.stop.split(':'), kind = s[0], act = +s[1], thing = s[2];
    var inAct = p.state && p.state.actIdx === act;
    if (kind === 'title' || kind === 'levels' || kind === 'personas' || kind === 'ending') {
      if (p.mode !== kind) return false;
      return kind !== 'ending' || document.querySelectorAll('.endline').length >= 3;
    }
    if (kind === 'card') return p.mode === 'card' && inAct;
    if (kind === 'play') return p.mode === 'play' && inAct && (!thing || !!p.state.done[thing]);
    if (kind === 'pause') {
      if (p.mode === 'play' && inAct && !p.paused) { tap('Escape'); return false; }
      return p.paused;
    }
    if (!inAct || current !== thing) return false;
    if (kind === 'say') {
      if (!(p.mode === 'talk' && p.dialog && p.dialog.done && !p.sel && !p.screenOpen)) return false;
      if (saidLines.indexOf(p.dialog.full) < 0) saidLines.push(p.dialog.full);
      return saidLines.length >= want.nth;
    }
    if (kind === 'screen') return p.screenOpen && p.waiting > 0;
    if (kind === 'choice') return p.mode === 'talk' && !!p.sel;
    return false;
  }

  function step() {
    if (out.done || stopped) return;
    var p = GAME.peek();
    GAME.config.speed = p.mode === 'play' ? 1 : want.talkSpeed;
    if (p.mode !== 'play') releaseAll();

    var sig = [p.mode, p.state && p.state.actIdx, p.state && Object.keys(p.state.done).length, p.dialog && p.dialog.full,
      p.sel && p.sel.index, Math.round(p.player.x), Math.round(p.player.y), p.waiting, p.screenOpen].join('|');
    sameFrames = sig === lastSig ? sameFrames + 1 : 0;
    lastSig = sig;
    if (sameFrames > 600) return finish(false, 'stuck: nothing changed for 600 frames (' + sig + ')');

    if (shouldStop(p)) return halt(want.stop);

    // facilitator pause: open it once during a line, pick the option asked for, and carry on
    if (p.paused) {
      if (want.pauseDo && p.sel) {
        var pi = { resume: 0, restart: 1, menu: 2 }[want.pauseDo] || 0;
        if (pi > 0) out.acts = [];
        out.paused = want.pauseDo;
        pickIndex(p, pi, 'ArrowDown');
      }
      return requestAnimationFrame(step);
    }
    if (want.pauseDo && !pausedOnce && p.mode === 'talk' && p.dialog && p.state.actIdx === want.pauseAt) {
      pausedOnce = true;
      tap('Escape');
      return requestAnimationFrame(step);
    }

    if (want.mash && p.mode === 'talk') {
      if (p.sel) GAME.config.speed = 1;      // real speed while a choice is open, as a person would see it
      tap('e');
      p = GAME.peek();
    }

    if (p.mode === 'title') selectTo(p, 0);
    else if (p.mode === 'levels') {
      if (seenEnding) return finish(true);
      selectTo(p, STORY.levels.map(function (l) { return l.id; }).indexOf(want.level));
    } else if (p.mode === 'personas') selectTo(p, p.level.personas.indexOf(want.persona));
    else if (p.mode === 'card') { if (p.waiting) advance('e'); }
    else if (p.mode === 'talk') { if (p.sel) chooseOption(p); else if (p.waiting) advance('e'); }
    else if (p.mode === 'ending') {
      seenEnding = true;
      out.ending = Array.prototype.map.call(document.querySelectorAll('.endline'), function (e) { return e.textContent; });
      out.pick = p.state.pick;
      if (p.waiting) advance('Enter');
    } else if (p.mode === 'play') drive(p);

    if (!out.done) requestAnimationFrame(step);
  }

  write();
  requestAnimationFrame(step);
})();
