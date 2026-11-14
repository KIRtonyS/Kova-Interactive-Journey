/* Builds the game's sprite files from Liberated Pixel Cup (LPC) art. Dev-only; the game never runs this.

   node web/test/build-art.js            bake character sheets, prepare the painted rooms, write assets/CREDITS.md
   node web/test/build-art.js --probe    list every downloaded character layer with its size and base palette

   Source art is not in this repository. It is read from ASSET_PACK (default: ../asset-pack next to the repo):
     ulpc/raw/         files from github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
   The painted rooms are the team's own art, read from TEAM_ART (default: ../teammate-art next to the repo):
     copies of Project1/img/parallaxes/*.png from the main branch.
   To change how a character looks, edit LOOKS below and run this script again. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const P = require('./png.js');

const PACK = process.env.ASSET_PACK || path.join(__dirname, '..', '..', '..', 'asset-pack');
const ULPC = path.join(PACK, 'ulpc', 'raw');
const STARTER = path.join(PACK, 'lpc-starter', 'sheets');
const STARTER_URL = 'https://github.com/LiberatedPixelCup/RPG_Maker_MZ_LPC_Starter_Kit';
const CUSTOM = require('./custom-art.js');
const GAME = require('./load.js').load(['art.js', 'story.js']);     // the pixel font, and the words painted on boxes
const TEAM = process.env.TEAM_ART || path.join(__dirname, '..', '..', '..', 'teammate-art');
const OUT = path.join(__dirname, '..', 'assets', 'lpc');
const ULPC_URL = 'https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator';

const json = f => JSON.parse(fs.readFileSync(path.join(ULPC, f), 'utf8'));
const PAL = {
  body: json('palette_definitions/body/body_ulpc.json'),
  hair: json('palette_definitions/hair/hair_ulpc.json'),
  cloth: json('palette_definitions/cloth/cloth_ulpc.json')
};
const BASE = { body: 'light', hair: 'orange', cloth: 'white' };   // the colours the source sheets are drawn in

/* A layer: [file under spritesheets/ (without /walk.png), palette type, colour name].
   A file ending in .png is used as it is (already coloured). Layers are drawn in the order listed. */
function person(o) {
  const thin = o.body === 'female';
  const L = [];
  if (o.hairBack) L.push(['hair/' + o.hairBack, 'hair', o.hairColor]);
  L.push(['body/bodies/' + o.body, 'body', o.skin]);
  L.push(['feet/shoes/basic/' + (thin ? 'thin' : 'male'), 'cloth', o.shoes]);
  L.push(['legs/' + o.legs + '/' + (thin ? 'thin' : 'male'), 'cloth', o.legsColor]);
  L.push(o.top.endsWith('.png') ? [o.top] : ['torso/clothes/' + o.top + '/' + o.body, 'cloth', o.topColor]);
  if (o.over) L.push([o.over]);
  L.push(['head/heads/human/' + (o.head || o.body), 'body', o.skin]);
  if (o.beard) L.push(['beards/beard/' + o.beard, 'hair', o.hairColor]);
  L.push(['hair/' + o.hair, 'hair', o.hairColor]);
  return L;
}

const LOOKS = {
  maya: person({ body: 'female', skin: 'olive', hair: 'bangs_bun/adult', hairColor: 'black',
    top: 'shortsleeve/tshirt', topColor: 'forest', legs: 'pants', legsColor: 'slate', shoes: 'black' }),
  david: person({ body: 'male', skin: 'light', hair: 'parted/adult', hairColor: 'gray', beard: 'trimmed',
    top: 'shortsleeve/shortsleeve_polo', topColor: 'white', legs: 'pants', legsColor: 'navy', shoes: 'brown' }),
  elena: person({ body: 'female', skin: 'light', hair: 'ponytail/adult/fg', hairBack: 'ponytail/adult/bg', hairColor: 'platinum',
    top: 'torso/clothes/sleeveless/tanktop/female/walk/pink.png', legs: 'leggings', legsColor: 'gray', shoes: 'white' }),
  mother: person({ body: 'female', head: 'female_elderly', skin: 'light', hair: 'bangs_bun/adult', hairColor: 'white',
    top: 'longsleeve/longsleeve2_cardigan', topColor: 'lavender', legs: 'pants', legsColor: 'brown', shoes: 'black' }),
  partner: person({ body: 'male', skin: 'olive', hair: 'plain/adult', hairColor: 'black',
    top: 'shortsleeve/tshirt', topColor: 'blue', legs: 'pants', legsColor: 'brown', shoes: 'black' }),
  associate: person({ body: 'male', skin: 'light', hair: 'plain/adult', hairColor: 'dark_brown',
    top: 'shortsleeve/tshirt', topColor: 'gray', over: 'torso/aprons/apron/male/walk/orange.png', legs: 'pants', legsColor: 'slate', shoes: 'black' }),
  associate_lowes: person({ body: 'male', skin: 'light', hair: 'plain/adult', hairColor: 'dark_brown',
    top: 'shortsleeve/tshirt', topColor: 'gray', over: 'torso/aprons/apron/male/walk/navy.png', legs: 'pants', legsColor: 'slate', shoes: 'black' }),
  shopper: person({ body: 'male', skin: 'taupe', hair: 'buzzcut/adult', hairColor: 'black',
    top: 'shortsleeve/tshirt', topColor: 'teal', legs: 'pants', legsColor: 'blue', shoes: 'black' }),
  contractor: person({ body: 'male', skin: 'amber', hair: 'buzzcut/adult', hairColor: 'dark_brown',
    top: 'longsleeve/longsleeve', topColor: 'red', over: 'torso/aprons/overalls/male/walk/blue.png', legs: 'pants', legsColor: 'blue', shoes: 'brown' })
};

/* LPC room sheets, copied as they are: [file in lpc-starter/sheets, name in assets/lpc/tiles, what the game uses from it]. */
const TILES = [
  ['Interior.png', 'interior.png', 'wallpapered walls, bookshelf, desk, kitchen counter, small table'],
  ['Inside_B.png', 'furniture.png', 'window, painting, plants, lamp, sofa, chair'],
  ['inside.png', 'inside.png', 'wood floor, door'],
  ['toilets.png', 'bathroom.png', 'tiled wall, mirror and counter, sink, toilet (by Matthew Nash)']
];

/* The game's own sprites (custom-art.js), drawn into assets/custom/props.png. */
function custom() {
  const sheet = P.blank(CUSTOM.W, CUSTOM.H);
  for (const [name, x, y, w, h, draw] of CUSTOM.SPRITES) {
    if (x + w > CUSTOM.W || y + h > CUSTOM.H) throw new Error('custom sprite "' + name + '" does not fit the sheet');
    const b = (bx, by, bw, bh, c) => P.fill(sheet, x + Math.max(0, bx), y + Math.max(0, by), Math.min(bw, w - bx), Math.min(bh, h - by), c);
    b.box = (bx, by, bw, bh, fillC, lineC) => { b(bx, by, bw, bh, lineC); b(bx + 1, by + 1, bw - 2, bh - 2, fillC); };
    /* Words in the game's 3 x 5 pixel font (js/art.js). centred: x is the middle of the word. */
    b.text = (str, tx, ty, c, scale, centred) => {
      str = String(str).toUpperCase();
      if (centred) tx -= Math.round((str.length * 4 - 1) * scale / 2);
      for (let i = 0; i < str.length; i++) {
        const g = GAME.ART.GLYPHS[str[i]] || GAME.ART.GLYPHS['?'];
        for (let k = 0; k < 15; k++) if (g[k] === '1') b(tx + (i * 4 + (k % 3)) * scale, ty + Math.floor(k / 3) * scale, scale, scale, c);
      }
    };
    draw(b, GAME.STORY.signs);
  }
  fs.mkdirSync(path.join(OUT, '..', 'custom'), { recursive: true });
  P.write(path.join(OUT, '..', 'custom', 'props.png'), sheet);
  console.log('custom/props.png ' + CUSTOM.SPRITES.length + ' sprites');
}

/* The LPC toilet in bright white, for a newly fitted one: assets/lpc/tiles/toilet-new.png. */
function whiteToilet() {
  const bath = P.read(path.join(STARTER, 'toilets.png'));
  const toilet = P.blit(P.blank(27, 46), bath, 0, 0, 131, 294, 27, 46);
  for (let i = 0; i < toilet.data.length; i += 4) {
    const lum = (toilet.data[i] * 3 + toilet.data[i + 1] * 6 + toilet.data[i + 2]) / 10;
    if (!toilet.data[i + 3] || lum < 110) continue;                       // keep the outline and the shadow
    for (let c = 0; c < 3; c++) toilet.data[i + c] = Math.round(toilet.data[i + c] + (255 - toilet.data[i + c]) * 0.62);
  }
  P.write(path.join(OUT, 'tiles', 'toilet-new.png'), toilet);
  console.log('tiles/toilet-new.png');
}

/* Painted rooms. bathroom.png is the team's painting as it is. bathroom-notoilet.png is the same picture with
   the toilet covered: the strip of wall and floor just left of it is repeated across it. */
function rooms() {
  const out = path.join(OUT, '..', 'rooms');
  fs.mkdirSync(out, { recursive: true });
  const src = path.join(TEAM, 'HomeBathroom_FullScreen_816x624.png');
  fs.copyFileSync(src, path.join(out, 'bathroom.png'));
  const img = P.read(src), X0 = 650, X1 = 762, Y0 = 150, Y1 = 350, SX = 598, SW = 50;
  for (let y = Y0; y < Y1; y++) {
    for (let x = X0; x < X1; x++) img.data.copy(img.data, (y * img.w + x) * 4, (y * img.w + SX + (x - X0) % SW) * 4, (y * img.w + SX + (x - X0) % SW) * 4 + 4);
  }
  P.write(path.join(out, 'bathroom-notoilet.png'), img);
  console.log('rooms/bathroom.png, rooms/bathroom-notoilet.png');
}

const srcFile = l => path.join(ULPC, 'spritesheets', l[0].endsWith('.png') ? l[0] : l[0] + '/walk.png');
const srcKey = l => (l[0].endsWith('.png') ? l[0] : l[0] + '/walk.png');

function probe() {
  const seen = new Set();
  (function walk(d) {
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      if (fs.statSync(p).isDirectory()) { walk(p); continue; }
      if (!n.endsWith('.png') || seen.has(p)) continue;
      seen.add(p);
      const img = P.read(p), cs = new Set(P.colors(img).map(c => c.hex.toLowerCase()));
      let best = '-', bn = 0;
      for (const k of Object.keys(PAL)) for (const name of Object.keys(PAL[k])) {
        const n2 = PAL[k][name].filter(c => cs.has(c.toLowerCase())).length;
        if (n2 > bn) { bn = n2; best = k + ':' + name; }
      }
      console.log(path.relative(path.join(ULPC, 'spritesheets'), p).split(path.sep).join('/').padEnd(64), img.w + 'x' + img.h, 'colours', cs.size, 'palette', best, bn + '/6');
    }
  })(path.join(ULPC, 'spritesheets'));
}

/* One row of the generator's CREDITS.csv: filename, notes, authors, licenses, urls. */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell.trim()); cell = ''; }
    else if (c === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

function build() {
  fs.mkdirSync(path.join(OUT, 'chars'), { recursive: true });
  const used = {};                                   // source file -> the looks that use it
  for (const name of Object.keys(LOOKS)) {
    let sheet = null;
    for (const l of LOOKS[name]) {
      const img = P.read(srcFile(l));
      if (!sheet) sheet = P.blank(img.w, img.h);
      if (l[1]) {
        const to = PAL[l[1]][l[2]];
        if (!to) throw new Error(name + ': no ' + l[1] + ' colour called "' + l[2] + '"');
        const n = l[2] === BASE[l[1]] ? 1 : P.recolor(img, PAL[l[1]][BASE[l[1]]], to);
        if (!n) throw new Error(name + ': ' + l[0] + ' has none of the ' + l[1] + ' base colours, so it cannot be recoloured');
      }
      P.blit(sheet, img);
      (used[srcKey(l)] = used[srcKey(l)] || []).push(name);
    }
    P.write(path.join(OUT, 'chars', name + '.png'), sheet);
    console.log('chars/' + name + '.png', sheet.w + 'x' + sheet.h, LOOKS[name].length + ' layers');
  }
  fs.mkdirSync(path.join(OUT, 'tiles'), { recursive: true });
  for (const t of TILES) { fs.copyFileSync(path.join(STARTER, t[0]), path.join(OUT, 'tiles', t[1])); console.log('tiles/' + t[1]); }
  fs.copyFileSync(path.join(STARTER, 'Final Attribution.txt'), path.join(OUT, 'tiles', 'ATTRIBUTION.txt'));
  custom();
  whiteToilet();
  if (process.argv.includes('--rooms')) rooms();     // painted rooms are not used by the game at the moment

  const credit = {};
  for (const r of parseCsv(fs.readFileSync(path.join(ULPC, 'CREDITS.csv'), 'utf8'))) credit[r[0]] = r;
  const md = ['# Art credits', '',
    'The character art in `assets/lpc/` is built from Liberated Pixel Cup (LPC) art. Each file below is used under the licences listed for it.',
    'The files in `assets/lpc/` are edited or combined versions of that art and are shared under the same terms: CC-BY-SA 3.0 or later, or GPL 3.0 or later.',
    'The game\'s code, text and code-drawn graphics are not LPC art.', '',
    'Licence texts: https://creativecommons.org/licenses/by-sa/3.0/ and https://www.gnu.org/licenses/gpl-3.0.html', '',
    '## Characters (`assets/lpc/chars/`)', '',
    'Layers from the Universal LPC Spritesheet Character Generator, ' + ULPC_URL + '. Recoloured and merged by `test/build-art.js`.', ''];
  const missing = [];
  for (const key of Object.keys(used).sort()) {
    const c = credit[key] || credit[key.replace(/\/walk\/[^/]+\.png$/, '/walk.png')];   // colour variants share the row of their walk.png
    if (!c) { missing.push(key); continue; }
    md.push('### ' + key, '', '- Used in: ' + Array.from(new Set(used[key])).map(n => '`chars/' + n + '.png`').join(', '),
      '- Authors: ' + c[2], '- Licences: ' + c[3]);
    if (c[1]) md.push('- Notes: ' + c[1]);
    md.push('- Sources: ' + c[4].split(',').map(u => u.trim()).filter(Boolean).join(' , '), '');
  }
  md.push('## Room tiles and furniture (`assets/lpc/tiles/`)', '',
    'Sheets from the LPC starter kit, ' + STARTER_URL + ', copied unchanged. They are collections by several artists:',
    'Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), Matthew Nash, Tuomo Untinen, Janna, Casper Nilsson, Xenodora and others.',
    '`tiles/ATTRIBUTION.txt` is the kit\'s own list of who made what; it notes a few pieces whose author the kit could not name.',
    'Licences: CC-BY-SA 3.0 / GPL 3.0 (some pieces also CC-BY 3.0, OGA-BY 3.0 or CC0).', '');
  for (const t of TILES) md.push('- `tiles/' + t[1] + '`: the game uses ' + t[2] + '.');
  md.push('- `tiles/toilet-new.png`: the toilet from `tiles/bathroom.png`, whitened by `test/build-art.js`.');
  md.push('', '## The game\'s own sprites (`assets/custom/`)', '', 'Drawn for this game by `test/custom-art.js`. Not LPC art.', '');
  md.push('## Font (`assets/fonts/`)', '', 'Jersey 10 by Sarah Cadigan-Fried, from https://github.com/google/fonts/tree/main/ofl/jersey10.',
    'SIL Open Font License 1.1; the licence text is `assets/fonts/OFL.txt` and must travel with the font.', '');
  fs.writeFileSync(path.join(OUT, '..', 'CREDITS.md'), md.join('\n'));
  console.log('CREDITS.md: ' + Object.keys(used).length + ' character layers');
  if (missing.length) { console.error('NO CREDIT ROW for: ' + missing.join(', ')); process.exitCode = 1; }
}

if (process.argv.includes('--probe')) probe(); else build();
