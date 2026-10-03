// Kit de partes de los protagonistas (tools/pixel_chars/prota_kit.mjs y compañía): validación de partes,
// orden de capas, rebote, espejo, mochila y proporciones del masculino frente a las referencias BW.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hex, splitSheet } from '../tools/pixel.mjs';
import {
  PROTA, part, recolorPart, shiftPart, checkHead, buildProtaFrame, buildProtaSheet, withProtaBag,
} from '../tools/pixel_chars/prota_kit.mjs';
import { PROTA_WALK, mirrorPart } from '../tools/pixel_chars/prota_body.mjs';
import { PROTA_RUN } from '../tools/pixel_chars/prota_run.mjs';
import { withBag, PROTA_BAG } from '../tools/pixel_chars/prota_bag.mjs';
import { PROTA_M_HEAD } from '../tools/pixel_chars/prota_heads.mjs';
import { KIT_HANGING_LEG, kitWalkSheet, kitRiderFrame } from '../tools/pixel_chars/prota_field.mjs';
import { prota, walkSheet, runSheet, riderFrame, climbCycle, hangingLeg } from '../tools/pixel_chars/rider.mjs';
import { PALETTES } from '../tools/pixel_chars/palettes.mjs';

const PAL = PALETTES.protagonista_m;
const SPEC = { head: PROTA_M_HEAD, palette: PAL };
const same = (img, x, y, color) => img.get(x, y).slice(0, 3).join() === hex(color).slice(0, 3).join();
const pixelsOf = (img, color) => {
  const points = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.alpha(x, y) && same(img, x, y, color)) points.push([x, y]);
  }
  return points;
};

/** Filas ocupadas y ancho máximo de una franja de filas de un frame. */
function rowsInfo(img, y0 = 0, y1 = img.h - 1) {
  let top = -1;
  let bottom = -1;
  let maxW = 0;
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) xs.push(x);
    if (!xs.length) continue;
    if (top < 0) top = y;
    bottom = y;
    maxW = Math.max(maxW, xs[xs.length - 1] - xs[0] + 1);
  }
  return { top, bottom, maxW };
}

test('part: valida el ancho de las filas y que quepa en la rejilla de 18 columnas', () => {
  assert.throws(() => part(0, ['ab', 'abc']), /fila 1/);
  assert.throws(() => part(0, ['abc'], 16), /fuera de la rejilla/);
  assert.throws(() => part(0, []), /vacía/);
  const p = part(2, ['ab'], 3);
  assert.deepEqual([p.x, p.y, p.rows[0]], [3, 2, 'ab']);
  assert.ok(Object.isFrozen(p));
  assert.deepEqual(shiftPart(p, 1, -1), { x: 4, y: 1, rows: ['ab'] });
  assert.equal(recolorPart(p, { a: 'z' }).rows[0], 'zb');
  assert.equal(p.rows[0], 'ab', 'recolorPart no modifica la original');
});

test('mirrorPart: espeja la posición en la rejilla e intercambia luz y sombra', () => {
  const p = part(0, ['kLs.'], 2);
  const m = mirrorPart(p);
  assert.equal(m.x, 18 - 2 - 4);
  assert.equal(m.rows[0], '.Sjk');
});

test('checkHead: 18×20 por vista, con errores claros', () => {
  assert.equal(checkHead('ok', PROTA_M_HEAD), PROTA_M_HEAD);
  assert.throws(() => checkHead('x', { down: ['..'], left: [], up: [] }), /x\.down/);
  const bad = { ...PROTA_M_HEAD, left: [...PROTA_M_HEAD.left.slice(0, 19), '...'] };
  assert.throws(() => checkHead('y', bad), /y\.left: la fila 19/);
});

test('buildProtaFrame: el rebote sube cabeza, torso y brazos, pero no las piernas; capas omitibles', () => {
  const pose = PROTA_WALK.down[0];
  const still = buildProtaFrame(pose, PROTA_M_HEAD.down, PAL);
  const up = buildProtaFrame({ ...pose, lift: -1 }, PROTA_M_HEAD.down, PAL);
  assert.equal(rowsInfo(up).top, rowsInfo(still).top - 1, 'la cabeza sube 1 px');
  assert.equal(rowsInfo(up).bottom, rowsInfo(still).bottom, 'los pies no se mueven');
  const green = pixelsOf(still, PAL.G);
  assert.ok(green.length > 0, 'tirador verde visible');
  assert.deepEqual(pixelsOf(up, PAL.G), green.map(([x, y]) => [x, y - 1]), 'el tirador sigue el rebote');
  const noHead = buildProtaFrame(pose, PROTA_M_HEAD.down, PAL, { skip: ['head'] });
  assert.ok(rowsInfo(noHead).top >= PROTA.bodyY, 'sin cabeza, nada por encima de la rejilla del cuerpo');
});

test('proporciones BW: cabeza de media figura, pecho estrecho y altura humana de 29 filas', () => {
  const [row] = splitSheet(buildProtaSheet(SPEC, PROTA_WALK), 32, 32);
  const f = row[0];
  const all = rowsInfo(f);
  assert.equal(all.top, 2, 'coronilla en la fila 2');
  assert.equal(all.bottom, 30, 'suela en la fila 30');
  const head = rowsInfo(buildProtaFrame({}, PROTA_M_HEAD.down, PAL));
  assert.ok(head.bottom - head.top + 1 >= (all.bottom - all.top + 1) / 2, 'cabeza grande de estilo BW');
  // Las manos y los hombros se abren; se compara con el pecho, no con la anchura de los brazos.
  const chest = rowsInfo(buildProtaFrame({ torso: PROTA_WALK.down[0].torso }, null, PAL), 21, 25);
  assert.ok(head.maxW >= chest.maxW * 2, `cabeza ${head.maxW} px, pecho ${chest.maxW} px`);
});

test('ciclos: caminar 3 poses (p2 = p0) y correr 4 por dirección; hojas 128×128 nativas con la derecha espejada', () => {
  for (const dir of ['down', 'left', 'up']) {
    assert.equal(PROTA_WALK[dir].length, 3);
    assert.equal(PROTA_RUN[dir].length, 4);
  }
  for (const s of [buildProtaSheet(SPEC, PROTA_WALK), buildProtaSheet(SPEC, PROTA_RUN)]) {
    assert.deepEqual([s.w, s.h], [128, 128]);
    const frames = splitSheet(s, 32, 32);
    for (let c = 0; c < 4; c++) assert.deepEqual([...frames[2][c].data], [...frames[1][c].mirrorX().data]);
  }
  assert.throws(() => buildProtaSheet(SPEC, { ...PROTA_WALK, up: PROTA_WALK.up.slice(0, 2) }), /"up"/);
});

test('mochila: withBag no modifica las poses y sigue el torso (torsoDx de la carrera de perfil)', () => {
  const before = JSON.stringify(PROTA_WALK);
  const bag = withBag(PROTA_WALK);
  assert.equal(JSON.stringify(PROTA_WALK), before);
  assert.deepEqual(bag.down[0].bag, PROTA_BAG.down);
  const runLeft = withBag(PROTA_RUN).left[0];
  assert.equal(runLeft.bag.x, PROTA_BAG.left.x + PROTA_RUN.left[0].torsoDx);
  const custom = withProtaBag({ down: [{ key: 'a' }], left: [], up: [] }, { down: null, left: null, up: null });
  assert.equal(custom.down[0].bag, undefined, 'sin bolsa para esa vista, la pose no cambia');
});

test('protagonistas: los dos usan el kit, con la misma API de campo', () => {
  assert.throws(() => prota('gael'), /Sin datos de protagonista/);
  for (const id of ['protagonista_m', 'protagonista_f']) {
    assert.deepEqual([walkSheet(id).w, runSheet(id).h], [128, 128]);
    for (const dir of ['down', 'left', 'up']) assert.equal(riderFrame(id, dir).w, 32);
    assert.ok(hangingLeg(id).h >= 5);
    const climb = climbCycle(id);
    assert.equal(climb.length, 4);
    assert.ok(climb.every((f) => f.w === 32 && f.h === 32));
  }
  assert.equal(KIT_HANGING_LEG.length, 5);
});

test('kit: un protagonista puede traer poses propias (walk) y el jinete usa su pose 0', () => {
  const walk = { ...PROTA_WALK, down: PROTA_WALK.down.map((p) => ({ ...p, arms: null })) };
  const spec = { ...SPEC, walk };
  const width = (img) => rowsInfo(img, 19, 25).maxW;
  const custom = splitSheet(kitWalkSheet(spec), 32, 32)[0][0];
  const base = splitSheet(kitWalkSheet(SPEC), 32, 32)[0][0];
  assert.ok(width(custom) < width(base), 'sin brazos, el cuerpo es más estrecho');
  assert.ok(width(kitRiderFrame(spec, 'down')) < width(kitRiderFrame(SPEC, 'down')));
});

test('jinete del kit: de frente sin piernas por debajo de la cadera; de perfil sentado con zapato delante', () => {
  const front = riderFrame('protagonista_m', 'down');
  assert.ok(rowsInfo(front).bottom <= PROTA.bodyY + 8, 'la cadera se cierra en la fila 26');
  const seated = riderFrame('protagonista_m', 'left', { seated: true });
  let shoe = false;
  for (let y = 26; y < 32; y++) for (let x = 0; x < 14; x++) if (same(seated, x, y, PAL.B)) shoe = true;
  assert.ok(shoe, 'pierna sentada hacia delante');
});
