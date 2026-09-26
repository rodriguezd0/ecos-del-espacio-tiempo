// Protagonista femenina con el kit de protagonistas (3.ª pasada, 25-09-2026; docs/arte.md §9 y DECISIONES
// X32): cabeza de 22 px centrada, misma altura y cara que el masculino, acento verde en la goma de la trenza,
// pantalón corto con vuelo y poses a las mismas alturas que las comunes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hex, splitSheet } from '../tools/pixel.mjs';
import { PROTA, checkHead, buildProtaFrame, HEAD_MAX_PAD } from '../tools/pixel_chars/prota_kit.mjs';
import { PROTA_WALK } from '../tools/pixel_chars/prota_body.mjs';
import { PROTA_RUN } from '../tools/pixel_chars/prota_run.mjs';
import { PROTA_M_HEAD } from '../tools/pixel_chars/prota_heads.mjs';
import { PROTA_F_HEAD } from '../tools/pixel_chars/prota_heads_f.mjs';
import { PROTA_WALK_F, PROTA_RUN_F, flareShorts } from '../tools/pixel_chars/prota_body_f.mjs';
import { walkSheet, runSheet } from '../tools/pixel_chars/rider.mjs';
import { buildBackStrip, BACK_SIZE } from '../tools/pixel_chars/battle_back.mjs';
import { PALETTES, ZYGARDE_GREEN } from '../tools/pixel_chars/palettes.mjs';

const PAL = PALETTES.protagonista_f;
const same = (c, color) => c.slice(0, 3).join() === hex(color).slice(0, 3).join();

/** Filas ocupadas y ancho máximo de una franja de filas. */
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

/** Píxeles de un color en una imagen. */
function pixelsOf(img, color) {
  const out = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y) && same(img.get(x, y), color)) out.push([x, y]);
  return out;
}

test('checkHead: admite cabezas centradas de 18 + 2·pad columnas (pad ≤ 2) y rechaza las demás', () => {
  assert.equal(checkHead('f', PROTA_F_HEAD), PROTA_F_HEAD);
  assert.equal(PROTA_F_HEAD.down[0].length, PROTA.w + 2 * HEAD_MAX_PAD);
  const widen = (h, extra) => Object.fromEntries(Object.entries(h).map(([d, rows]) => [d, rows.map((r) => r + extra)]));
  assert.throws(() => checkHead('impar', widen(PROTA_M_HEAD, '.')), /ancho 19/);
  assert.throws(() => checkHead('ancha', widen(PROTA_F_HEAD, '..')), /ancho 24/);
  const bad = { ...PROTA_F_HEAD, up: [...PROTA_F_HEAD.up.slice(0, 19), '..'] };
  assert.throws(() => checkHead('mezcla', bad), /mezcla\.up: la fila 19/);
});

test('cabeza ancha centrada: la cara (iris) queda en las mismas columnas que la del masculino', () => {
  const pose = { lift: 0, torso: PROTA_WALK.down[0].torso, legs: PROTA_WALK.down[0].legs };
  const iris = (head, pal) => pixelsOf(buildProtaFrame(pose, head.down, pal), pal.i).map(([x, y]) => `${x},${y}`).sort();
  const hers = iris(PROTA_F_HEAD, PAL);
  assert.equal(hers.length, 2);
  assert.deepEqual(hers, iris(PROTA_M_HEAD, PALETTES.protagonista_m));
});

test('proporciones: misma altura que el masculino (coronilla 2, suela 30) y cabeza más ancha que el cuerpo', () => {
  const her = splitSheet(walkSheet('protagonista_f'), 32, 32);
  const him = splitSheet(walkSheet('protagonista_m'), 32, 32);
  for (const row of [0, 1, 3]) {
    const f = rowsInfo(her[row][0]);
    const m = rowsInfo(him[row][0]);
    assert.deepEqual([f.top, f.bottom], [m.top, m.bottom], `fila ${row}: altura de la figura`);
  }
  const front = her[0][0];
  const head = rowsInfo(front, 2, 18);
  assert.equal(head.bottom - head.top + 1, 17, 'cabeza de 17 filas');
  const torso = rowsInfo(buildProtaFrame({ ...PROTA_WALK_F.down[0], arms: null }, null, PAL), 19, 24);
  assert.ok(head.maxW - torso.maxW >= 8, `cabeza ${head.maxW} px, torso ${torso.maxW} px`);
});

test('acento verde: la goma de la trenza se ve en los 16 frames de caminar y correr, y nunca en la chaqueta', () => {
  for (const [name, sheetImg] of [['caminar', walkSheet('protagonista_f')], ['correr', runSheet('protagonista_f')]]) {
    splitSheet(sheetImg, 32, 32).forEach((row, r) => row.forEach((f, c) => {
      const green = pixelsOf(f, ZYGARDE_GREEN);
      assert.ok(green.length >= 2, `${name} ${r},${c}: sin goma verde`);
      assert.ok(green.every(([, y]) => y < PROTA.bodyY + 1), `${name} ${r},${c}: verde por debajo de los hombros`);
    }));
  }
});

test('pantalón corto con vuelo: 1 px más por lado en el muslo, sin tocar el perfil ni las poses comunes', () => {
  const before = JSON.stringify(PROTA_WALK);
  const legs = PROTA_WALK.down[0].legs;
  const flared = flareShorts(legs);
  assert.equal(flared.x, legs.x - 1);
  assert.equal(flared.rows[1].length, legs.rows[1].length + 2);
  assert.equal(flared.rows[1], 'kPPPpkkPPppk');
  assert.equal(flared.rows[0], `.${legs.rows[0]}.`);
  assert.equal(flareShorts(PROTA_WALK.left[0].legs), PROTA_WALK.left[0].legs, 'de perfil no cambia');
  assert.equal(JSON.stringify(PROTA_WALK), before, 'no modifica las poses comunes');
});

test('poses propias: mismas alturas de hombros, cadera y rebote que las comunes (mochila y jinete encajan)', () => {
  for (const [mine, common] of [[PROTA_WALK_F, PROTA_WALK], [PROTA_RUN_F, PROTA_RUN]]) {
    for (const dir of ['down', 'left', 'up']) {
      mine[dir].forEach((p, i) => {
        const c = common[dir][i];
        assert.equal(p.lift, c.lift);
        assert.equal(p.torso.y, c.torso.y);
        assert.equal(p.torso.x, c.torso.x);
        assert.equal(p.legs.y, c.legs.y);
        assert.ok(!p.torso.rows.join('').includes('G'), `${dir}${i}: la chaqueta no lleva el verde`);
      });
    }
  }
});

test('paleta: pelo azul marino con lectura azul, iris propio y mochila teja (D06)', () => {
  for (const [k, margin] of [['H', 40], ['h', 40], ['m', 30], ['n', 20]]) {
    const [r, g, b] = hex(PAL[k]);
    assert.ok(b > r + margin && b > g + margin, `${k} ${PAL[k]}: el azul domina`);
  }
  assert.ok(PAL.i && PAL.i !== PALETTES.protagonista_m.i, 'iris propio');
  for (const k of ['A', 'a', 'D', 'z']) assert.ok(PAL[k], `mochila ${k}`);
  assert.equal(PAL.G, ZYGARDE_GREEN);
});

test('espalda de combate: melena, trenza con goma verde y mochila en los 5 frames', () => {
  const strip = buildBackStrip('protagonista_f');
  assert.deepEqual([strip.w, strip.h], [BACK_SIZE * 5, BACK_SIZE]);
  for (let i = 0; i < 5; i++) {
    const f = strip.crop(i * BACK_SIZE, 0, BACK_SIZE, BACK_SIZE);
    assert.ok(pixelsOf(f, ZYGARDE_GREEN).length > 4, `frame ${i}: goma verde`);
    assert.ok(pixelsOf(f, PAL.h).length > 200, `frame ${i}: melena`);
    assert.ok(pixelsOf(f, PAL.a).length > 50, `frame ${i}: mochila`);
  }
});
