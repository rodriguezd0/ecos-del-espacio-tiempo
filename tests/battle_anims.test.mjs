// Animaciones de combate de Añil (game/data/anims + battle/scene/fx/anilAnimCore.js): el creador vio que Paliza
// (Beat Up) «tira unas bolitas en vez del puño» (25-09-2026). Ahora cada movimiento usa su animación de Añil.
import test from 'node:test';
import assert from 'node:assert/strict';
import { animationSheetFile } from '../game/src/battle/scene/fx/anilAnimCore.js';
import fs from 'node:fs';
import {
  findMoveAnimDetails, findMoveAnimation, expandCel, animFrameAt, cellRect, placeCel, lineTransform, celOrder,
  emptyLayer, applyTimings, transformPoint, isReversed,
} from '../game/src/battle/scene/fx/anilAnimCore.js';
import { compactCel, convertAnimation, buildIndex } from '../tools/lib/anilAnims.mjs';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url)));
const index = load('anims/index.json');
const moves = load('moves.json');

test('el fondo original ausente de Premonición se resuelve a la hoja oscura existente de Añil', () => {
  const file = animationSheetFile('PRAS- Darkness BG');
  assert.ok(fs.existsSync(new URL(`../Pokemon Anil V4.13/Graphics/Animations/${file}`, import.meta.url)));
  assert.equal(animationSheetFile('PRAS- Darkness BG.png'), file);
  assert.equal(animationSheetFile('PRAS- Strike.png'), 'PRAS- Strike.png');
});

test('Paliza usa la animación de Añil con puños (PRAS- Strike, celda 1)', () => {
  const found = findMoveAnimation(index, moves.BEATUP, 0);
  assert.deepEqual(found, { index: 351, oppMove: false });
  const anim = load(`anims/${found.index}.json`);
  assert.equal(anim.name, 'Move:BEATUP');
  assert.equal(anim.graphic, 'PRAS- Strike.png');
  const effectCels = anim.frames.flatMap((f) => f.slice(2)).filter(Boolean).map(expandCel);
  assert.ok(effectCels.length > 0 && effectCels.every((c) => c.pattern === 1), 'solo el puño');
  assert.deepEqual(findMoveAnimation(index, moves.BEATUP, 0, 1).index, 352, 'segundo golpe: "Beat Up hit 2"');
  assert.equal(index.names[352], 'Beat Up hit 2');
});

test('casi todos los movimientos tienen animación propia en Añil', () => {
  const missing = Object.keys(moves).filter((id) => index.moves[id] === undefined);
  assert.ok(missing.length <= 20, `sin animación propia: ${missing.join(', ')}`);
  for (const id of missing) assert.ok(findMoveAnimation(index, moves[id], 0), `${id} usa la de su tipo o Placaje`);
});

test('rival: versión OppMove (papeles intercambiados) o la normal; variantes "hit N" solo si son suyas', () => {
  assert.deepEqual(findMoveAnimDetails(index, 'FURYATTACK', 1), { index: index.oppMoves.FURYATTACK, oppMove: true });
  assert.deepEqual(findMoveAnimDetails(index, 'FURYATTACK', 0, 2), { index: index.moves.FURYATTACK + 2, oppMove: false });
  assert.deepEqual(findMoveAnimDetails(index, 'TACKLE', 1), { index: index.moves.TACKLE, oppMove: false });
  // Placaje no es multigolpe: la siguiente animación es la de Látigo, así que se repite la propia
  assert.equal(index.names[index.moves.TACKLE + 1], 'Move:TAILWHIP');
  assert.equal(findMoveAnimDetails(index, 'TACKLE', 0, 1).index, index.moves.TACKLE);
  assert.equal(findMoveAnimDetails(index, 'NOEXISTE', 0), null);
});

test('animación por defecto del tipo (pbFindMoveAnimation)', () => {
  const fake = { moves: { SONICBOOM: 7, TACKLE: 1, TAILWHIP: 9, DEFENSECURL: 5 }, oppMoves: {}, names: [] };
  assert.equal(findMoveAnimation(fake, { id: 'X', type: 'NORMAL', category: 'Special', target: 'NearOther' }, 0).index, 7);
  assert.equal(findMoveAnimation(fake, { id: 'X', type: 'NORMAL', category: 'Status', target: 'NearOther' }, 0).index, 9);
  assert.equal(findMoveAnimation(fake, { id: 'X', type: 'NORMAL', category: 'Status', target: 'User' }, 0).index, 5);
  assert.equal(findMoveAnimation(fake, { id: 'X', type: 'DRAGON', category: 'Physical', target: 'NearOther' }, 0).index, 1, 'Placaje');
});

test('cels compactos: ida y vuelta con los valores por defecto', () => {
  const raw = [];
  Object.assign(raw, { 0: 345, 1: 73, 2: 100, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 130, 11: 100, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 25: 1, 26: 1 });
  const c = compactCel(raw);
  assert.deepEqual(c, [1, 345, 73, 1, 1, 100, 100, 0, 0, 0, 130]);
  const e = expandCel(c);
  assert.equal(e.opacity, 130);
  assert.equal(e.visible, true);
  assert.equal(e.zoomY, 100);
  assert.deepEqual(expandCel([0, 10, 20, 4, 1]), {
    pattern: 0, x: 10, y: 20, focus: 4, priority: 1, zoomX: 100, zoomY: 100, angle: 0, mirror: false, blend: 0,
    opacity: 255, visible: true, color: null, tone: null,
  });
  assert.equal(compactCel(null), 0);
  const conv = convertAnimation({ name: 'Move:X', graphic: 'g.png', hue: 0, position: 1, array: [[raw, null]], timing: [{ frame: 0, timingType: 0, name: 'a.wav', volume: 80, pitch: 100 }] });
  assert.deepEqual(conv.frames, [[c]]);
  assert.equal(conv.timing[0].name, 'a.wav');
  const idx = buildIndex([{ name: 'Move:A' }, { name: 'A hit 2' }, { name: 'OppMove:A' }, { name: 'Common:Burn' }, null]);
  assert.deepEqual([idx.moves.A, idx.oppMoves.A, idx.common.Burn, idx.names[4]], [0, 2, 3, '']);
});

test('fotogramas a 20 fps, celdas de 192 en filas de 5', () => {
  assert.equal(animFrameAt(0, 5), 0);
  assert.equal(animFrameAt(2, 5), 0);
  assert.equal(animFrameAt(3, 5), 1);
  assert.equal(animFrameAt(15, 5), -1);
  assert.deepEqual(cellRect(7, 960, 384), { x: 384, y: 192, w: 192, h: 192, inside: true });
  assert.equal(cellRect(10, 960, 384).inside, false);
});

test('focos: objetivo, usuario, línea usuario→objetivo (con volteo) y pantalla', () => {
  const ctx = { userOrig: [124, 178], targetOrig: [390, 120], ...lineTransform([124, 322], 288, [390, 236], 192) };
  assert.deepEqual(ctx.dstLine, [124, 178, 390, 140]);
  assert.deepEqual(placeCel(expandCel([1, 345, 73, 1, 1]), ctx), { x: 351, y: 97, mirror: false });
  assert.deepEqual(placeCel(expandCel([1, 130, 230, 2, 1]), ctx), { x: 126, y: 184, mirror: false });
  const onLine = placeCel(expandCel([0, 256, 160, 3, 1]), ctx);
  assert.deepEqual([onLine.x, onLine.y], [257, 159]);
  assert.deepEqual(placeCel(expandCel([0, 50, 60, 4, 1]), ctx), { x: 50, y: 60, mirror: false });
  // Rival usando la animación del jugador: la línea se invierte y los dibujos se voltean
  const rev = lineTransform([390, 236], 192, [124, 322], 288);
  const flipped = placeCel(expandCel([0, 128, 224, 3, 1]), { userOrig: [0, 0], targetOrig: [0, 0], ...rev });
  assert.equal(flipped.mirror, true);
  assert.deepEqual(transformPoint([0, 0, 10, 10], [0, 0, 20, 40], 5, 5), [10, 20]);
  assert.equal(isReversed(128, 384, 390, 124), true);
  assert.equal(placeCel(expandCel([0, 1, 1, 3, 1]), { userOrig: [0, 0], targetOrig: [0, 0] }), null);
});

test('orden de dibujo por prioridad', () => {
  assert.equal(celOrder(expandCel([0, 0, 0, 4, 0]), 60, 33), 14);
  assert.equal(celOrder(expandCel([0, 0, 0, 1, 1]), 60, 33), 80);
  assert.equal(celOrder(expandCel([0, 0, 0, 1, 2]), 60, 33), 32.5);
  assert.equal(celOrder(expandCel([0, 0, 0, 2, 3]), 60, 33), 60.5);
  assert.equal(celOrder(expandCel([0, 0, 0, 3, 2]), 60, 33), 20);
});

test('temporizaciones: SE, fondo de color que se funde y fondo con imagen', () => {
  const timing = [
    { frame: 0, type: 0, name: 'PRSFX- Beat Up.wav', volume: 100, pitch: 120 },
    { frame: 0, type: 1, colorRed: 0, colorGreen: 0, colorBlue: 0, colorAlpha: 255, opacity: 0 },
    { frame: 1, type: 2, opacity: 200, duration: 4 },
    { frame: 6, type: 1, name: 'PRAS- MegaEvo BG.png', bgX: 10, opacity: 255 },
    { frame: 7, type: 0 },
  ];
  let st = { bg: emptyLayer(), fg: emptyLayer() };
  const f0 = applyTimings(timing, 0, st);
  assert.deepEqual(f0.sounds, [{ name: 'PRSFX- Beat Up.wav', volume: 100, pitch: 120 }]);
  assert.equal(f0.bg.plainOpacity, 0);
  assert.deepEqual(f0.bg.plainColor, [0, 0, 0, 255]);
  assert.equal(st.bg.plainColor[3], 0, 'no muta el estado recibido');
  st = f0;
  for (let f = 1; f <= 3; f++) st = applyTimings(timing, f, st);
  assert.equal(st.bg.plainOpacity, 100, 'a mitad del fundido (2/4)');
  for (let f = 4; f <= 6; f++) st = applyTimings(timing, f, st);
  assert.equal(st.bg.graphic, 'PRAS- MegaEvo BG.png');
  assert.equal(st.bg.ox, -10);
  assert.equal(st.bg.plainOpacity, 0);
  assert.deepEqual(applyTimings(timing, 7, st).sounds, [{ name: '', volume: 80, pitch: 100 }], 'sin nombre: grito del usuario');
});
