/* The game's own small sprites: things Liberated Pixel Cup art has no picture for (laptop, phone, fridge, rug...).
   Drawn here as coloured rectangles at the same pixel size, outline and palette as the LPC art, and written to
   assets/custom/props.png by build-art.js. This is original art for this game, not LPC art.

   Each sprite: [name, x, y, w, h, draw]. x, y, w, h is its place in the sheet; js/sprites.js uses the same numbers.
   draw(b) gets a brush: b(x, y, w, h, colour) fills a rectangle inside the sprite; b.box(x, y, w, h, fill, line)
   draws a filled rectangle with a 1 px outline. */
'use strict';

const C = {
  line: '#2e1d1a', woodD: '#5a2e1f', wood: '#8a4a2c', woodL: '#b06a3c', woodH: '#cf8c55',
  steelD: '#454b54', steel: '#8c939c', steelL: '#c4cad1', white: '#eef1f3', shade: '#b4bcc4',
  screen: '#6fa9d0', screenL: '#b5d8ec', ink: '#23262b',
  paper: '#f3ead2', paperD: '#d6c8a4', red: '#b23a36', redL: '#d9614f', green: '#5d8a4a', greenL: '#8ab86c',
  blue: '#3f6ea5', blueL: '#73a0d4', yellow: '#dfb548', yellowL: '#f3d97c', pink: '#d98a9a',
  rug: '#8c2c2e', rugL: '#a9403a', rugD: '#6b1f24', gold: '#c9a04a', goldL: '#e4c676',
  teal: '#3c7c84', tealL: '#5ea6ab', tealD: '#2a5a61', cork: '#c49a62', corkD: '#a67c46'
};

const SPRITES = [
  ['rug', 0, 0, 208, 96, b => {
    b.box(4, 0, 200, 96, C.rug, C.rugD);
    for (let y = 2; y < 94; y += 4) { b(0, y, 4, 2, C.goldL); b(204, y, 4, 2, C.goldL); }        // fringe
    b(10, 6, 188, 2, C.gold); b(10, 88, 188, 2, C.gold); b(10, 6, 2, 84, C.gold); b(196, 6, 2, 84, C.gold);
    b(16, 12, 176, 72, C.rugL);
    b(20, 16, 168, 1, C.rugD); b(20, 79, 168, 1, C.rugD); b(20, 16, 1, 64, C.rugD); b(187, 16, 1, 64, C.rugD);
    for (let i = 0; i < 12; i++) {                                                                 // centre diamond
      b(104 - 4 * (i + 1), 36 + i, 8 * (i + 1), 1, i % 4 === 3 ? C.goldL : C.gold);
      b(104 - 4 * (i + 1), 59 - i, 8 * (i + 1), 1, i % 4 === 3 ? C.goldL : C.gold);
    }
    b(84, 44, 40, 8, C.rug); b(96, 46, 16, 4, C.goldL);
    for (const x of [30, 170]) for (const y of [24, 64]) { b(x, y, 8, 8, C.gold); b(x + 2, y + 2, 4, 4, C.rugD); }
  }],
  ['fridge', 208, 0, 44, 92, b => {
    b(2, 86, 42, 6, 'rgba(0,0,0,0.25)');
    b.box(0, 0, 42, 88, C.white, C.line);
    b(1, 1, 40, 2, '#ffffff'); b(34, 3, 7, 84, C.shade); b(1, 84, 40, 3, C.steel);
    b(1, 28, 40, 1, C.steelD); b(1, 29, 40, 1, C.shade);
    b(5, 10, 3, 14, C.steelD); b(6, 10, 1, 14, C.steelL); b(5, 34, 3, 26, C.steelD); b(6, 34, 1, 26, C.steelL);
    b(4, 4, 28, 1, '#ffffff');
  }],
  ['mat', 0, 96, 128, 52, b => {
    b.box(0, 4, 118, 44, C.teal, C.tealD);
    b(2, 6, 114, 2, C.tealL); b(2, 44, 114, 2, C.tealD);
    for (let x = 10; x < 112; x += 12) b(x, 10, 1, 32, C.tealD);
    b.box(114, 0, 14, 52, C.tealL, C.tealD); b(117, 3, 3, 46, '#8cc7ca'); b(124, 3, 2, 46, C.teal);   // rolled end
  }],
  ['corkboard', 128, 96, 72, 48, b => {
    b.box(0, 0, 72, 48, C.wood, C.line); b(1, 1, 70, 1, C.woodH);
    b.box(4, 4, 64, 40, C.cork, C.woodD);
    for (let i = 0; i < 40; i++) b(6 + (i * 37) % 60, 6 + (i * 23) % 36, 1, 1, C.corkD);
    const pin = (x, y, w, h, c, p) => { b.box(x, y, w, h, c, C.line); b(x + (w >> 1) - 1, y + 1, 2, 2, p); };
    pin(8, 8, 14, 12, '#d8cdbb', C.red); pin(26, 7, 12, 16, '#e7dcc3', C.blue); pin(42, 9, 18, 10, '#9fb59a', C.red);
    pin(9, 25, 16, 14, '#c9b08a', C.yellow); pin(29, 27, 10, 12, C.white, C.red); pin(43, 24, 20, 16, '#b9c4cc', C.blue);
    b(45, 27, 16, 6, '#8fa4b3'); b(11, 28, 12, 5, '#dcc8a6');
  }],
  ['weights', 200, 96, 56, 56, b => {
    b(4, 50, 50, 6, 'rgba(0,0,0,0.25)');
    b.box(4, 2, 4, 50, C.steelD, C.line); b.box(46, 2, 4, 50, C.steelD, C.line);
    for (const y of [10, 26, 42]) {
      b.box(2, y, 50, 4, C.steel, C.line); b(3, y + 1, 48, 1, C.steelL);
      for (const x of [8, 22, 36]) {                                                              // three dumbbells per shelf
        b.box(x, y - 7, 4, 8, C.ink, C.line); b.box(x + 8, y - 7, 4, 8, C.ink, C.line);
        b(x + 4, y - 4, 4, 2, C.steelL); b(x + 1, y - 6, 1, 6, C.steelD); b(x + 9, y - 6, 1, 6, C.steelD);
      }
    }
  }],
  ['laptop', 0, 152, 32, 26, b => {
    b.box(3, 0, 26, 17, C.steelD, C.line); b(5, 2, 22, 13, C.screen);
    b(5, 2, 22, 2, C.screenL); b(7, 6, 10, 1, C.white); b(7, 8, 14, 1, C.screenL); b(7, 10, 8, 1, C.screenL); b(20, 6, 5, 5, C.yellowL);
    b.box(0, 17, 32, 8, C.steelL, C.line); b(1, 18, 30, 1, C.white);
    for (let x = 3; x < 29; x += 3) { b(x, 20, 2, 1, C.steel); b(x, 22, 2, 1, C.steel); }
    b(12, 23, 8, 1, C.steelD);
  }],
  ['calendar', 32, 152, 20, 24, b => {
    b.box(0, 2, 20, 22, C.paper, C.line); b(1, 3, 18, 5, C.red); b(1, 3, 18, 1, C.redL);
    b(4, 0, 2, 4, C.steelD); b(14, 0, 2, 4, C.steelD);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) b(3 + c * 3, 10 + r * 3, 2, 2, (r === 2 && c === 3) ? C.red : C.paperD);
  }],
  ['tablet', 52, 152, 20, 16, b => {
    b.box(0, 0, 20, 16, C.ink, C.line); b(2, 2, 16, 12, C.screenL);
    b(3, 3, 6, 4, '#d9c7a8'); b(10, 3, 7, 4, '#9fb59a'); b(3, 8, 6, 5, C.white); b(10, 8, 7, 5, '#c9a9a0');
  }],
  ['notebook', 72, 152, 18, 16, b => {
    b.box(0, 0, 18, 16, C.paper, C.line); b(1, 1, 3, 14, C.woodL);
    for (let y = 2; y < 14; y += 3) b(1, y, 2, 1, C.steelD);
    for (let y = 4; y < 14; y += 3) b(6, y, 10, 1, C.paperD);
    b(6, 4, 6, 1, C.blue); b(6, 7, 8, 1, C.red);
  }],
  ['phone', 90, 152, 10, 16, b => {
    b.box(0, 0, 10, 16, C.ink, C.line); b(1, 2, 8, 11, C.screen); b(1, 2, 8, 2, C.screenL); b(2, 6, 6, 1, C.white); b(2, 8, 4, 1, C.white); b(4, 14, 2, 1, C.steel);
  }],
  ['card', 100, 152, 10, 12, b => {
    b.box(0, 2, 10, 10, C.white, C.steelD); b(2, 5, 6, 1, C.blue); b(2, 7, 5, 1, C.steel); b(2, 9, 6, 1, C.steel); b(4, 0, 3, 3, C.red); b(5, 0, 1, 1, C.redL);
  }],
  ['crutch', 112, 148, 12, 44, b => {
    b.box(1, 0, 10, 4, C.steelD, C.line); b(2, 1, 8, 1, C.steel);
    b(3, 4, 2, 36, C.steelL); b(7, 4, 2, 20, C.steelL); b(2, 4, 1, 36, C.line); b(5, 4, 1, 36, C.steel); b(6, 4, 1, 20, C.line); b(9, 4, 1, 20, C.steel);
    b.box(2, 18, 8, 3, C.ink, C.line); b(5, 24, 3, 2, C.steel); b.box(2, 40, 4, 4, C.ink, C.line);
  }],
  ['toys', 128, 152, 40, 24, b => {
    b.box(0, 10, 12, 12, C.red, C.line); b(1, 11, 10, 2, C.redL); b(4, 15, 4, 4, C.white);
    b.box(10, 2, 12, 12, C.blue, C.line); b(11, 3, 10, 2, C.blueL); b(14, 7, 4, 4, C.yellowL);
    b.box(16, 12, 12, 12, C.yellow, C.line); b(17, 13, 10, 2, C.yellowL); b(20, 17, 4, 4, C.red);
    b.box(30, 14, 10, 10, C.green, C.line); b(31, 14, 8, 1, C.line); b(32, 15, 4, 3, C.greenL); b(30, 14, 1, 1, 'rgba(0,0,0,0)');
  }],
  ['coffeetable', 0, 192, 84, 40, b => {
    b(4, 34, 78, 6, 'rgba(0,0,0,0.25)');
    b.box(6, 20, 6, 18, C.woodD, C.line); b.box(72, 20, 6, 18, C.woodD, C.line);
    b.box(0, 0, 84, 22, C.wood, C.line); b(1, 1, 82, 2, C.woodH); b(1, 3, 82, 13, C.woodL);
    for (const x of [22, 43, 63]) b(x, 3, 1, 13, C.wood);
    b(1, 16, 82, 5, C.woodD); b(1, 16, 82, 1, C.wood);
  }],

  /* ---- bathroom ---- */
  ['floorOld', 168, 156, 32, 32, b => {                      // dated almond tiles, two tones
    b(0, 0, 32, 32, '#e2d2ad'); b(0, 0, 16, 16, '#d8c79e'); b(16, 16, 16, 16, '#d8c79e');
    b(0, 15, 32, 1, '#c3b087'); b(0, 31, 32, 1, '#c3b087'); b(15, 0, 1, 32, '#c3b087'); b(31, 0, 1, 32, '#c3b087');
    b(1, 0, 14, 1, '#ebdcba'); b(17, 16, 14, 1, '#e3d4b0');
  }],
  ['floorNew', 200, 156, 32, 32, b => {                      // pale oak boards
    b(0, 0, 32, 32, '#dcc7a0');
    for (let y = 7; y < 32; y += 8) b(0, y, 32, 1, '#c2a97d');
    b(10, 0, 1, 7, '#c2a97d'); b(26, 8, 1, 7, '#c2a97d'); b(6, 16, 1, 7, '#c2a97d'); b(20, 24, 1, 7, '#c2a97d');
    for (let y = 0; y < 32; y += 8) b(0, y, 32, 1, '#e6d4b1');
  }],
  ['plunger', 86, 192, 14, 30, b => {
    b.box(5, 0, 4, 21, C.woodL, C.line); b(6, 1, 1, 19, C.woodH);
    b.box(2, 19, 10, 8, C.red, C.line); b(3, 20, 8, 1, C.redL); b.box(0, 25, 14, 5, '#7a2622', C.line);
  }],
  ['toolbox', 102, 192, 34, 22, b => {
    b(11, 0, 12, 2, C.ink); b(11, 0, 2, 6, C.ink); b(21, 0, 2, 6, C.ink);
    b.box(0, 5, 34, 17, C.red, C.line); b(1, 6, 32, 1, C.redL); b(1, 11, 32, 1, '#7a2622'); b(1, 19, 32, 2, '#8f2c2a');
    b.box(14, 8, 6, 6, C.yellow, C.line); b(15, 9, 4, 1, C.yellowL);
  }],
  ['valve', 138, 192, 12, 14, b => {
    b(5, 0, 2, 14, C.steel); b(4, 0, 1, 14, C.line); b(7, 0, 1, 14, C.line);
    b.box(2, 7, 8, 6, C.steelL, C.line); b.box(0, 2, 12, 4, C.red, C.line); b(1, 3, 10, 1, C.redL);
  }],
  ['manual', 152, 192, 16, 14, b => {
    b.box(0, 0, 16, 14, C.white, C.line); b(2, 2, 7, 1, C.ink); b(2, 5, 12, 1, C.steel); b(2, 7, 12, 1, C.steel); b(2, 9, 8, 1, C.steel);
    b.box(10, 9, 4, 3, C.screenL, C.steelD);
  }],
  ['stool', 170, 192, 20, 26, b => {
    b(2, 23, 16, 3, 'rgba(0,0,0,0.25)');
    b.box(2, 13, 4, 12, C.woodD, C.line); b.box(14, 13, 4, 12, C.woodD, C.line); b(5, 18, 10, 2, C.woodD);
    b.box(0, 8, 20, 6, C.woodL, C.line); b(1, 9, 18, 1, C.woodH);
    b.box(6, 0, 8, 9, C.ink, C.line); b(7, 1, 6, 6, C.screen); b(7, 1, 6, 1, C.screenL);
  }],
  ['flange', 192, 192, 20, 14, b => {
    b.box(2, 1, 16, 12, '#7b8088', C.line); b(3, 2, 14, 1, C.steelL); b.box(6, 4, 8, 6, '#121416', C.line);
    b(0, 6, 2, 2, C.steelL); b(18, 6, 2, 2, C.steelL);
  }],
  ['controls', 214, 192, 26, 30, b => {
    b.box(0, 0, 26, 30, '#3d3834', C.line); b(1, 1, 24, 1, '#5a534d');
    b.box(3, 4, 7, 7, C.steelL, C.line); b(4, 5, 2, 2, C.white); b.box(3, 14, 7, 7, C.steelL, C.line); b(4, 15, 2, 2, C.white);
    b.box(3, 24, 9, 3, C.gold, C.line);
    b.box(13, 4, 11, 11, C.white, C.line);                                                          // the code to scan
    for (const [x, y] of [[14, 5], [17, 5], [21, 5], [15, 8], [19, 8], [14, 11], [18, 11], [21, 11], [21, 8]]) b(x, y, 2, 2, C.ink);
  }],
  ['tubOld', 0, 232, 96, 64, b => {                          // almond tub, a curtain doing a door's job
    b(2, 58, 92, 6, 'rgba(0,0,0,0.22)');
    b.box(0, 18, 96, 42, '#e2d0ab', C.line); b(1, 19, 94, 3, '#f1e5c8');
    b.box(8, 24, 80, 24, '#cdb98f', '#8f7d57'); b(10, 26, 76, 20, '#eadcbd'); b(10, 26, 76, 2, '#d6c69f');
    b(1, 50, 94, 9, '#c9b488'); b(1, 50, 94, 1, '#b7a273');
    b(42, 51, 12, 2, '#9c8f66'); b(66, 54, 18, 2, '#9c8f66'); b(40, 22, 8, 2, '#9c8f66');
    b.box(84, 19, 7, 7, C.steel, C.line); b(85, 20, 2, 2, C.white);
    b.box(0, 0, 96, 4, C.steelD, C.line); b(1, 1, 94, 1, C.steelL);
    b.box(2, 3, 36, 53, '#a9b99c', '#4f6247');
    for (let x = 6; x < 36; x += 6) b(x, 4, 2, 51, '#8fa585');
    b(3, 52, 34, 2, '#7d9170'); for (let x = 4; x < 36; x += 6) b(x, 2, 3, 3, C.steelL);
  }],
  ['tubNew', 96, 232, 96, 64, b => {                         // freestanding, white
    b(8, 58, 80, 6, 'rgba(0,0,0,0.22)');
    b.box(10, 8, 76, 52, C.white, C.line); b.box(4, 14, 88, 40, C.white, C.line); b(11, 15, 74, 38, C.white);
    b(11, 9, 74, 2, '#ffffff'); b(5, 50, 86, 3, C.shade); b(11, 55, 74, 4, C.shade);
    b.box(14, 18, 68, 28, '#cfe3ee', '#93aab8'); b(16, 20, 64, 2, '#eef7fb'); b(18, 26, 30, 1, '#eef7fb'); b(54, 32, 20, 1, '#eef7fb');
    b.box(82, 0, 6, 16, C.steelD, C.line); b(83, 1, 1, 14, C.steelL); b.box(70, 0, 14, 5, C.steelD, C.line); b(70, 5, 4, 5, C.steelD);
  }],
  ['rackOld', 196, 232, 44, 40, b => {                       // three towels, one bar
    b.box(0, 3, 44, 4, C.steelD, C.line); b(1, 4, 42, 1, C.steelL); b(2, 0, 3, 4, C.steelD); b(39, 0, 3, 4, C.steelD);
    b.box(3, 6, 12, 26, C.pink, C.line); b(4, 7, 10, 2, '#eab0bb'); b(4, 26, 10, 1, '#b96d7c');
    b.box(15, 6, 13, 19, C.tealL, C.line); b(16, 7, 11, 2, '#8cc7ca'); b(16, 20, 11, 1, C.teal);
    b.box(28, 6, 13, 32, '#e9dcc0', C.line); b(29, 7, 11, 2, '#f6eedb'); b(29, 31, 11, 2, C.paperD); b(30, 14, 2, 2, '#9c8f66');
  }],
  ['rackNew', 196, 272, 44, 40, b => {                       // two towels, folded the same
    b.box(0, 3, 44, 4, C.steelD, C.line); b(1, 4, 42, 1, C.steelL); b(2, 0, 3, 4, C.steelD); b(39, 0, 3, 4, C.steelD);
    for (const x of [5, 24]) { b.box(x, 6, 15, 28, C.white, C.line); b(x + 1, 7, 13, 2, '#ffffff'); b(x + 1, 26, 13, 3, '#8fa585'); b(x + 12, 9, 2, 24, C.shade); }
  }],
  ['boxOne', 0, 312, 56, 52, (b, words) => {
    b(2, 46, 54, 6, 'rgba(0,0,0,0.22)');
    b.box(0, 6, 56, 44, '#c9a06a', C.line); b(1, 7, 54, 7, '#dcb983'); b(1, 14, 54, 1, '#a9824f'); b(25, 7, 6, 42, '#e9d6ab'); b(48, 15, 7, 34, '#b8905c');
    b.box(2, 22, 52, 15, C.white, C.steelD); b.text(words.kohler, 28, 25, C.ink, 2, true);
  }],
  ['boxStack', 56, 312, 88, 64, (b, words) => {
    b(2, 58, 86, 6, 'rgba(0,0,0,0.22)');
    b.box(0, 24, 88, 38, '#c9a06a', C.line); b(1, 25, 86, 6, '#dcb983'); b(1, 31, 86, 1, '#a9824f'); b(41, 25, 6, 36, '#e9d6ab'); b(80, 32, 7, 29, '#b8905c');
    b.box(14, 0, 58, 26, '#d2ab76', C.line); b(15, 1, 56, 6, '#e3c28f'); b(15, 7, 56, 1, '#a9824f'); b(40, 1, 6, 24, '#e9d6ab');
    b.box(3, 38, 52, 15, C.white, C.steelD); b.text(words.kohler, 29, 41, C.ink, 2, true);
    b.box(59, 40, 22, 10, C.white, C.steelD); b(62, 43, 14, 1, C.steel); b(62, 46, 10, 1, C.steel);
  }],
  ['matOld', 148, 312, 84, 28, b => {
    b.box(0, 0, 84, 28, '#a9b99c', '#4f6247'); b(3, 3, 78, 1, '#c2cfb7'); b(3, 24, 78, 1, '#8fa585'); b(3, 3, 1, 22, '#c2cfb7'); b(80, 3, 1, 22, '#8fa585');
    b(30, 12, 22, 2, '#8a7f5c'); b(58, 18, 10, 2, '#8a7f5c');
  }],
  ['matNew', 148, 340, 84, 28, b => {
    b.box(0, 0, 84, 28, '#e9e2d2', '#a79f8c'); b(3, 3, 78, 1, '#f7f2e6'); b(6, 9, 72, 2, '#b9c4ae'); b(6, 17, 72, 2, '#b9c4ae');
  }],
  ['cracks', 232, 312, 24, 44, b => {                        // cracked grout and a corner that never dries
    b(6, 26, 16, 16, 'rgba(110,96,60,0.35)'); b(9, 30, 12, 12, 'rgba(96,82,48,0.35)');
    for (const [x, y, w, h] of [[4, 2, 1, 5], [5, 7, 1, 4], [6, 11, 3, 1], [9, 12, 1, 5], [10, 17, 1, 4], [11, 21, 3, 1], [14, 22, 1, 6], [15, 28, 1, 5],
      [8, 14, 1, 1], [7, 15, 1, 4], [5, 19, 2, 1], [12, 9, 4, 1], [16, 6, 1, 3], [17, 4, 3, 1]]) b(x, y, w, h, '#3a322b');
  }],
  ['vanityNew', 0, 376, 96, 96, b => {
    b(4, 90, 90, 6, 'rgba(0,0,0,0.22)');
    b.box(20, 0, 56, 40, '#d2b382', C.line); b.box(24, 4, 48, 32, '#bfdcea', '#7f9bab'); b(27, 7, 4, 24, '#e6f3f8'); b(34, 7, 2, 16, '#e6f3f8');
    b.box(8, 8, 6, 16, C.goldL, C.line); b(9, 9, 2, 14, '#fff3c4'); b.box(82, 8, 6, 16, C.goldL, C.line); b(83, 9, 2, 14, '#fff3c4');
    b.box(0, 50, 96, 12, C.white, C.line); b(1, 51, 94, 2, '#ffffff'); b(1, 58, 94, 3, C.shade);
    b.box(30, 46, 36, 9, '#e3eaee', '#93a1ab'); b(33, 49, 30, 3, '#c5d3db'); b.box(46, 38, 4, 10, C.steelD, C.line); b(42, 38, 12, 3, C.steelD);
    b.box(2, 61, 92, 32, '#d9bc8c', C.line); b(3, 62, 90, 2, '#e8cfa3'); b(47, 63, 2, 29, '#b3945f'); b(3, 88, 90, 4, '#c2a372');
    b.box(40, 74, 3, 8, C.steelD, C.line); b.box(53, 74, 3, 8, C.steelD, C.line);
    b.box(78, 40, 10, 10, C.redL, C.line); b(80, 32, 6, 9, C.green); b(79, 35, 2, 4, C.greenL); b(85, 34, 2, 5, C.greenL);
  }],

  /* ---- store ---- */
  ['displayToilets', 0, 472, 192, 84, b => {                 // a row of toilets on a platform, some still boxed
    platform(b, 192);
    for (const x of [8, 40, 72, 104]) toilet(b, x, 14);
    carton(b, 136, 22, 24, 34); carton(b, 162, 14, 26, 42);
    for (const x of [14, 46, 78, 110, 142, 170]) b.box(x, 66, 10, 7, C.yellowL, C.line);
  }],
  ['displayBath', 0, 556, 192, 84, b => {                    // a tub and a vanity on a platform, half still boxed
    platform(b, 192);
    b.box(6, 26, 72, 30, C.white, C.line); b(7, 27, 70, 2, '#ffffff'); b.box(12, 31, 60, 16, '#cfe3ee', '#93aab8'); b(7, 50, 70, 5, C.shade);
    b.box(86, 30, 44, 26, '#d9bc8c', C.line); b.box(84, 24, 48, 8, C.white, C.line); b(107, 33, 2, 22, '#b3945f'); b.box(98, 12, 20, 12, '#bfdcea', '#7f9bab');
    carton(b, 138, 18, 24, 38); carton(b, 164, 28, 24, 28);
    for (const x of [30, 100, 144, 170]) b.box(x, 66, 10, 7, C.yellowL, C.line);
  }],
  ['cart', 196, 472, 48, 38, b => {
    b(4, 33, 40, 5, 'rgba(0,0,0,0.22)');
    b.box(4, 6, 36, 22, C.steelL, C.line); for (let x = 9; x < 38; x += 5) b(x, 7, 1, 20, C.steel); b(5, 14, 34, 1, C.steel); b(5, 21, 34, 1, C.steel);
    b.box(40, 2, 8, 4, C.steelD, C.line); b(42, 6, 2, 20, C.steelD);
    b.box(8, 28, 6, 6, C.ink, C.line); b.box(30, 28, 6, 6, C.ink, C.line);
    carton(b, 12, 0, 20, 14);
  }],
  ['wallTopHD', 192, 512, 32, 32, b => { b(0, 0, 32, 32, '#dfdbd2'); b(0, 0, 32, 12, '#e8742a'); b(0, 0, 32, 2, '#f39a55'); b(0, 12, 32, 2, C.line); b(31, 14, 1, 18, '#cfcac0'); }],
  ['wallTopLW', 224, 512, 32, 32, b => { b(0, 0, 32, 32, '#dfdbd2'); b(0, 0, 32, 12, '#27457a'); b(0, 0, 32, 2, '#3f63a3'); b(0, 12, 32, 2, C.line); b(31, 14, 1, 18, '#cfcac0'); }],
  ['wallMid', 192, 544, 32, 32, b => { b(0, 0, 32, 32, '#dfdbd2'); b(31, 0, 1, 32, '#cfcac0'); }],
  ['wallLow', 224, 544, 32, 32, b => { b(0, 0, 32, 32, '#dfdbd2'); b(31, 0, 1, 24, '#cfcac0'); b(0, 24, 32, 8, '#8c877f'); b(0, 24, 32, 1, '#6f6a63'); }],
  ['storeFloor', 192, 576, 32, 32, b => {                    // polished concrete
    b(0, 0, 32, 32, '#b9b4ab'); b(31, 0, 1, 32, '#a39e95'); b(0, 31, 32, 1, '#a39e95'); b(5, 9, 7, 1, '#c8c3ba'); b(18, 21, 6, 1, '#c8c3ba'); b(24, 5, 3, 1, '#aca79e');
  }],
  ['shelfUnit', 0, 640, 64, 84, b => {                       // warehouse racking; repeats sideways
    b(0, 79, 64, 5, 'rgba(0,0,0,0.22)');
    const goods = ['#c9a06a', C.white, C.blue, '#c9a06a', C.red, C.white, C.green, '#c9a06a', C.yellow];
    [26, 52, 78].forEach((y, row) => {
      for (let i = 0, x = 5; x < 58; i++) {
        const w = 8 + ((i * 5 + row * 3) % 3) * 3, h = 12 + ((i * 7 + row * 5) % 4) * 3, c = goods[(i * 2 + row * 4) % goods.length];
        if (x + w > 59) break;
        b.box(x, y - h, w, h, c, C.line); b(x + 1, y - h + 1, w - 2, 1, 'rgba(255,255,255,0.35)'); if (w > 9) b(x + 2, y - h + 5, w - 5, 2, 'rgba(0,0,0,0.18)');
        x += w;
      }
      b.box(0, y, 64, 5, '#d98a3a', C.line); b(1, y + 1, 62, 1, '#f0b06a');
    });
    b.box(0, 0, 4, 83, C.steelD, C.line); b.box(60, 0, 4, 83, C.steelD, C.line); b(1, 1, 1, 81, C.steel); b(61, 1, 1, 81, C.steel);
  }],
  ['endcapToilet', 64, 640, 96, 96, (b, words) => {          // the Kohler end of the aisle: one boxed toilet
    endcap(b, words.kohler);
    carton(b, 22, 34, 52, 42); b.box(27, 52, 42, 13, C.white, C.steelD); b(31, 56, 22, 1, C.ink); b(31, 59, 30, 1, C.steel);
    b.box(70, 72, 18, 9, C.yellowL, C.line); b(73, 75, 10, 1, C.ink);
  }],
  ['endcapBath', 160, 640, 96, 96, (b, words) => {           // the Kohler display: a vanity, and a tag where the tub should be
    endcap(b, words.kohler);
    b.box(8, 50, 40, 28, '#d9bc8c', C.line); b.box(6, 44, 44, 8, C.white, C.line); b(27, 53, 2, 24, '#b3945f'); b.box(18, 28, 20, 14, '#bfdcea', '#7f9bab');
    b.box(58, 34, 30, 22, C.white, C.steelD); b(62, 38, 22, 6, '#cfe3ee'); b(62, 47, 18, 1, C.ink); b(62, 50, 14, 1, C.steel); b(72, 30, 2, 5, C.steelD);
    b.box(62, 66, 22, 9, C.yellowL, C.line); b(65, 69, 14, 1, C.ink);
  }],
  ['shelf3', 0, 736, 148, 70, (b, words) => {                // three boxes to choose from
    b(2, 64, 146, 6, 'rgba(0,0,0,0.22)');
    b.box(0, 50, 148, 16, C.steelL, C.line); b(1, 51, 146, 2, C.white); b.box(0, 46, 148, 5, '#d98a3a', C.line);
    carton(b, 6, 6, 42, 40); b.box(9, 20, 36, 13, C.white, C.steelD); b.text(words.kohler, 27, 24, C.ink, 1, true);
    carton(b, 53, 12, 42, 34); b.box(57, 22, 34, 12, C.blueL, C.blue); b(61, 26, 20, 1, C.white); b(61, 29, 14, 1, C.white);
    carton(b, 100, 16, 42, 30); b.box(104, 24, 34, 12, C.greenL, C.green); b(108, 28, 22, 1, C.white); b(108, 31, 12, 1, C.white);
    for (const x of [18, 65, 112]) { b.box(x, 54, 18, 9, C.yellowL, C.line); b(x + 3, 57, 10, 1, C.ink); b(x + 3, 60, 7, 1, C.ink); }
  }],
  ['exitdoors', 148, 736, 84, 80, (b, words) => {
    b.box(0, 20, 84, 60, C.steelD, C.line);
    for (const x of [4, 44]) { b.box(x, 24, 36, 55, '#bcdbe6', '#6f8f9c'); b(x + 3, 27, 6, 46, '#e2f1f5'); b(x + 12, 27, 2, 30, '#e2f1f5'); b(x + (x === 4 ? 30 : 3), 48, 3, 10, C.steelD); }
    b(40, 24, 4, 55, C.ink);
    b.box(22, 0, 40, 17, C.red, C.line); b(23, 1, 38, 2, C.redL); b.text(words.exit, 42, 5, C.white, 2, true);
  }],
  ['board', 0, 816, 148, 70, b => {                          // three ways to fill one bathroom
    b(4, 64, 140, 6, 'rgba(0,0,0,0.22)');
    b.box(6, 54, 6, 14, C.steelD, C.line); b.box(136, 54, 6, 14, C.steelD, C.line);
    b.box(0, 0, 148, 56, C.white, C.line); b(1, 1, 146, 2, '#ffffff'); b(1, 52, 146, 3, C.shade);
    [['#d6c9b8', C.white, '#bfdcea'], ['#a9b99c', '#d9bc8c', C.white], ['#e4d3ba', C.steelL, '#c9a06a']].forEach((tone, i) => {
      const x = 6 + i * 47;
      b.box(x, 6, 42, 34, tone[0], C.line); b.box(x + 4, 10, 20, 10, tone[1], C.steelD); b.box(x + 28, 10, 10, 18, tone[2], C.steelD); b.box(x + 4, 24, 14, 12, tone[2], C.steelD);
      b.box(x + 4, 43, 34, 7, C.yellowL, C.line); b(x + 8, 46, 20, 1, C.ink);
    });
  }],
  ['prodesk', 0, 886, 176, 60, (b, words) => {
    b(2, 54, 174, 6, 'rgba(0,0,0,0.22)');
    b.box(0, 14, 176, 44, '#e3dfd6', C.line); b.box(0, 8, 176, 10, C.woodL, C.line); b(1, 9, 174, 2, C.woodH);
    b(1, 18, 174, 6, '#27457a'); b(1, 18, 174, 1, '#3f63a3'); b(1, 52, 174, 5, '#bdb8ae');
    b.box(50, 28, 76, 17, '#27457a', C.line); b.text(words.proDesk, 88, 32, C.white, 2, true);
    b.box(10, 0, 22, 14, C.ink, C.line); b(12, 2, 18, 9, C.screen); b(12, 2, 18, 2, C.screenL); b(18, 13, 6, 2, C.steelD);
    b.box(140, 4, 20, 6, C.white, C.steelD); b(143, 6, 12, 1, C.steel);
  }],
  ['pallet', 180, 886, 64, 60, b => {                        // cartons stacked on a wooden pallet
    b(2, 55, 62, 5, 'rgba(0,0,0,0.22)');
    b.box(0, 50, 64, 8, C.woodL, C.line); b(1, 51, 62, 1, C.woodH); for (const x of [4, 28, 52]) b.box(x, 54, 8, 4, C.woodD, C.line);
    carton(b, 2, 26, 30, 25); carton(b, 32, 26, 30, 25); carton(b, 6, 4, 28, 23); carton(b, 34, 10, 24, 17);
    b(0, 34, 64, 2, 'rgba(255,255,255,0.35)'); b(0, 16, 60, 1, 'rgba(255,255,255,0.3)');     // stretch wrap
  }],
  ['checkout', 0, 946, 96, 64, b => {                        // a till near the way out
    b(2, 58, 94, 6, 'rgba(0,0,0,0.22)');
    b.box(0, 22, 96, 40, '#e3dfd6', C.line); b.box(0, 16, 96, 10, C.steelL, C.line); b(1, 17, 94, 2, C.white); b(1, 54, 94, 7, '#bdb8ae');
    b.box(4, 30, 56, 18, '#3a3e45', C.line); for (let x = 8; x < 58; x += 6) b(x, 32, 3, 14, '#4a4f57');   // belt
    b.box(66, 0, 22, 18, C.ink, C.line); b(68, 2, 18, 11, C.screen); b(68, 2, 18, 2, C.screenL); b(74, 17, 6, 2, C.steelD);
    b.box(46, 8, 12, 10, C.steelD, C.line); b(48, 10, 8, 4, C.screenL);
    b.box(66, 32, 24, 18, C.white, C.steelD); b(69, 36, 18, 1, C.ink); b(69, 39, 14, 1, C.steel); b(69, 42, 16, 1, C.steel); b(69, 45, 10, 1, C.steel);
  }],
  ['flatbed', 96, 946, 80, 44, b => {                        // a flatbed cart with four boxes
    b(4, 39, 72, 5, 'rgba(0,0,0,0.22)');
    b.box(0, 30, 70, 6, '#d98a3a', C.line); b(1, 31, 68, 1, '#f0b06a');
    b.box(6, 36, 6, 6, C.ink, C.line); b.box(56, 36, 6, 6, C.ink, C.line);
    b.box(68, 2, 4, 30, C.steelD, C.line); b.box(66, 0, 12, 4, C.steelD, C.line);
    carton(b, 2, 12, 22, 18); carton(b, 24, 8, 22, 22); carton(b, 46, 14, 20, 16); carton(b, 12, 0, 20, 12);
  }]
];

/* shared pieces */
function platform(b, w) {
  b(2, 78, w - 2, 6, 'rgba(0,0,0,0.22)');
  b.box(0, 54, w, 28, '#e9e4d8', C.line); b(1, 55, w - 2, 3, '#ffffff'); b(1, 64, w - 2, 17, '#cfc9bb'); b(1, 64, w - 2, 1, '#b5ae9f');
}
function toilet(b, x, y) {
  b.box(x + 1, y, 22, 14, C.white, C.line); b(x + 2, y + 1, 20, 2, '#ffffff'); b(x + 18, y + 4, 3, 2, C.steelD);
  b.box(x + 3, y + 13, 18, 22, C.white, C.line); b.box(x + 6, y + 17, 12, 9, '#cfe3ee', '#93aab8'); b(x + 4, y + 30, 16, 4, C.shade);
  b.box(x + 7, y + 34, 10, 7, C.shade, C.line);
}
function carton(b, x, y, w, h) {
  b.box(x, y, w, h, '#c9a06a', C.line); b(x + 1, y + 1, w - 2, 5, '#dcb983'); b(x + 1, y + 6, w - 2, 1, '#a9824f');
  b(x + (w >> 1) - 2, y + 1, 4, h - 2, '#e9d6ab'); b(x + w - 5, y + 7, 4, h - 8, '#b8905c');
}
function endcap(b, word) {
  b(2, 90, 94, 6, 'rgba(0,0,0,0.22)');
  b.box(0, 20, 96, 72, '#efeae0', C.line); b(1, 84, 94, 7, C.steelD); b(88, 21, 7, 63, '#d9d3c6');
  b.box(0, 0, 96, 22, C.ink, C.line); b(1, 1, 94, 2, '#3a3e45'); b.text(word, 48, 6, C.white, 2, true);
}

module.exports = { SPRITES, W: 256, H: 1010 };
