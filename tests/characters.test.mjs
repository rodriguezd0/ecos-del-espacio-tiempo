// Registro de sprites de personajes y herramientas de pixel art (tools/pixel.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CHARACTERS, getCharacter, frameRect, listCharacters, DIR_ROW } from '../game/src/content/characters.js';
import { Img, fromRows, hex, outline, strayPixels, sheet, splitSheet } from '../tools/pixel.mjs';
import { buildFrame, mirrorLimbs, stretchRows, checkRows } from '../tools/pixel_chars/assemble.mjs';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');

test('cada hoja registrada existe y mide cols×frameW por rows×frameH', () => {
  for (const [id, ch] of Object.entries(CHARACTERS)) {
    const file = path.join(GAME, ch.file);
    assert.ok(fs.existsSync(file), `falta ${ch.file} (${id})`);
    const img = Img.load(file);
    assert.equal(img.w, ch.frameW * ch.cols, `${id}: ancho`);
    assert.equal(img.h, ch.frameH * ch.rows, `${id}: alto`);
  }
});

test('todo el arte propio está marcado como provisional (D30) y documentado', () => {
  for (const [id, ch] of Object.entries(CHARACTERS)) {
    assert.equal(ch.provisional, true, `${id} debe ser provisional`);
    assert.equal(ch.decision, 'D30');
    assert.ok(ch.name && ch.note, `${id} necesita name y note`);
  }
});

test('las referencias a variantes y sprites de combate apuntan a entradas existentes', () => {
  for (const [id, ch] of Object.entries(CHARACTERS)) {
    for (const ref of Object.values({ ...(ch.variants || {}), ...(ch.battle || {}) })) {
      assert.ok(CHARACTERS[ref], `${id} → ${ref} no está registrado`);
    }
    if (ch.variantOf) assert.ok(CHARACTERS[ch.variantOf], `${id}.variantOf`);
  }
});

test('frameRect sigue la convención RMXP (2 abajo, 4 izq, 6 der, 8 arriba)', () => {
  const ch = getCharacter('protagonista_m');
  assert.deepEqual(frameRect(ch, 2, 0), { x: 0, y: 0, w: 64, h: 64 });
  assert.deepEqual(frameRect(ch, 8, 3), { x: 192, y: 192, w: 64, h: 64 });
  assert.deepEqual(frameRect(ch, 6, 5), { x: 64, y: 128, w: 64, h: 64 }); // patrón cíclico
  assert.equal(DIR_ROW[4], 1);
});

test('getCharacter admite charsets de Añil y devuelve null si no existe', () => {
  const anil = getCharacter('anil:chaval1');
  assert.equal(anil.file, '/anil/Graphics/Characters/chaval1.png');
  assert.deepEqual(frameRect(anil, 4, 1, 240, 256), { x: 60, y: 64, w: 60, h: 64 });
  assert.equal(getCharacter('no_existe'), null);
  assert.equal(getCharacter(''), null);
  assert.throws(() => frameRect(anil, 2, 0), /tamaño de frame/);
});

test('listCharacters filtra por tipo', () => {
  assert.ok(listCharacters('charset').includes('zygarde_core'));
  assert.ok(listCharacters().length >= listCharacters('charset').length);
});

test('los charsets no tienen píxeles sueltos ni semitransparencias', () => {
  for (const id of listCharacters('charset')) {
    const img = Img.load(path.join(GAME, CHARACTERS[id].file));
    for (let i = 3; i < img.data.length; i += 4) assert.ok(img.data[i] === 0 || img.data[i] === 255, `${id}: alfa parcial`);
    // Ampliación exacta ×2: cada bloque 2×2 es de un solo color.
    for (let y = 0; y < img.h; y += 2) {
      for (let x = 0; x < img.w; x += 2) {
        const c = img.get(x, y).join();
        assert.equal(img.get(x + 1, y + 1).join(), c, `${id}: bloque 2×2 roto en ${x},${y}`);
      }
    }
    const native = new Img(img.w / 2, img.h / 2);
    for (let y = 0; y < native.h; y++) for (let x = 0; x < native.w; x++) native.set(x, y, img.get(x * 2, y * 2));
    assert.deepEqual(strayPixels(native), [], `${id}: píxeles sueltos`);
  }
});

test('pixel.mjs: matrices, contorno, espejo y hojas', () => {
  const img = fromRows(['.a.', 'aba'], { a: '#FF0000', b: '#00FF00' });
  assert.deepEqual(img.get(1, 1), [0, 255, 0, 255]);
  assert.deepEqual(img.get(0, 0), [0, 0, 0, 0]);
  assert.deepEqual(img.mirrorX().get(0, 1), hex('#FF0000'));
  assert.equal(img.scale(2).w, 6);
  const o = outline(img, '#000000');
  assert.deepEqual(o.get(0, 0), [0, 0, 0, 255]);
  assert.throws(() => fromRows(['z'], {}), /sin color/);
  assert.throws(() => hex('#12'), /no válido/);
  const s = sheet([[img, img], [img, img]], 3, 2);
  assert.equal(s.w, 6);
  assert.equal(splitSheet(s, 3, 2)[1][1].get(1, 1)[1], 255);
});

test('assemble: validación de filas, estirado y espejo de extremidades', () => {
  assert.throws(() => checkRows('x', ['..', '...']), /fila 1/);
  assert.deepEqual(stretchRows(['a', 'b', 'c'], 1), ['a', 'b', 'b', 'c']);
  // Se espeja e intercambia luz/sombra para mantener la luz a la izquierda.
  assert.deepEqual(mirrorLimbs(['kLs.'], { keepRows: [5, 5] }), ['.Sjk']);
  // Las filas del torso conservan las columnas indicadas.
  assert.deepEqual(mirrorLimbs(['aXYe'], { keepRows: [0, 0], keepCols: [1, 1] }), ['eXXa']);
  const head = Array(18).fill('.'.repeat(18));
  const body = Array(16).fill('.'.repeat(18));
  const frame = buildFrame({ head, body }, { k: '#000000' });
  assert.equal(frame.w, 32);
  assert.throws(() => buildFrame({ head: ['...'], body }, {}), /cabeza/);
});
