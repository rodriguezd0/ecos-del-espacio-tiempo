// Registro de sprites de personajes y herramientas de pixel art (tools/pixel.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CHARACTERS, getCharacter, getBattleSprite, frameRect, listCharacters, DIR_ROW } from '../game/src/content/characters.js';
import { ANIL_CLASSES, listAnilClasses } from '../game/src/content/anilClasses.js';
import { Img, fromRows, hex, outline, strayPixels, sheet, splitSheet } from '../tools/pixel.mjs';
import { buildFrame, mirrorLimbs, stretchRows, checkRows } from '../tools/pixel_chars/assemble.mjs';
import { withBackpack, paste, shoulderRow } from '../tools/pixel_chars/backpack.mjs';
import { WALK } from '../tools/pixel_chars/body_jacket.mjs';
import { PALETTES } from '../tools/pixel_chars/palettes.mjs';
import { CHARACTERS as ROSTER } from '../tools/pixel_chars/roster.mjs';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const ANIL = path.resolve(GAME, '..', 'Pokemon Anil V4.13', 'Graphics');

test('cada hoja registrada existe y mide cols×frameW por rows×frameH', () => {
  for (const [id, ch] of Object.entries(CHARACTERS)) {
    const file = path.join(GAME, ch.file);
    assert.ok(fs.existsSync(file), `falta ${ch.file} (${id})`);
    const img = Img.load(file);
    assert.equal(img.w, ch.frameW * ch.cols, `${id}: ancho`);
    assert.equal(img.h, ch.frameH * ch.rows, `${id}: alto`);
  }
});

test('D30 aprueba las trece poses frontales y conserva provisional el resto del arte propio', () => {
  const approved = new Set(['gael_front', 'profesor_front', 'guardiana_front', 'leandro_front', 'abril_front',
    'fermin_front', 'olvido_front', 'sol_front', 'vertice_front', 'casia_front', 'garrido_front',
    'genesis_tecnico_front', 'genesis_tecnica_front']);
  for (const [id, ch] of Object.entries(CHARACTERS)) {
    assert.equal(ch.provisional, !approved.has(id), `${id}: alcance de la aprobación del autor`);
    assert.equal(ch.decision, 'D30');
    assert.ok(ch.name && ch.note, `${id} necesita name y note`);
    if (approved.has(id)) {
      assert.equal(ch.kind, 'battle_front');
      assert.equal(ch.approvedOn, '2026-10-04');
      assert.equal(ch.approvedBy, 'autor');
    } else {
      assert.equal(ch.approvedOn, undefined, `${id} no recibió aprobación en esta tanda`);
    }
  }
  assert.equal(getBattleSprite('casilda_front').provisional, false);
  assert.equal(getBattleSprite('alerce_front').approvedOn, '2026-10-04');
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

// ───────────────────────── 2.ª pasada: mochila, elenco nuevo, clases de Añil ─────────────────────────

/** Frame nativo (32×32) de una hoja exportada ×2. */
function nativeFrame(id, row, col) {
  const img = Img.load(path.join(GAME, CHARACTERS[id].file));
  const f = img.crop(col * 64, row * 64, 64, 64);
  const out = new Img(32, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) out.set(x, y, f.get(x * 2, y * 2));
  return out;
}

const hasColor = (img, color) => img.colors().some(([c]) => c === color.toUpperCase());

test('los registros del constructor (tools) y del juego coinciden', () => {
  const built = ROSTER.flatMap((c) => c.sheets.map((s) => s.id)).sort();
  assert.deepEqual(built, Object.keys(CHARACTERS).sort());
});

test('D06: los protagonistas llevan mochila en caminar, correr y combate de espaldas', () => {
  for (const id of ['protagonista_m', 'protagonista_f']) {
    const bag = PALETTES[id].a;
    for (const sheetId of [id, `${id}_run`]) {
      for (const [row, dir] of [[0, 'frente (correas)'], [1, 'perfil'], [2, 'perfil derecho'], [3, 'espalda']]) {
        for (let col = 0; col < 4; col++) {
          assert.ok(hasColor(nativeFrame(sheetId, row, col), bag), `${sheetId} ${dir} patrón ${col}: sin mochila`);
        }
      }
    }
    const back = Img.load(path.join(GAME, CHARACTERS[`${id}_back`].file));
    for (let i = 0; i < 5; i++) assert.ok(hasColor(back.crop(i * 160, 0, 160, 160), bag), `${id}_back frame ${i}: sin mochila`);
  }
});

test('D06: la mochila no tapa el acento verde ni la chaqueta del masculino', () => {
  const front = nativeFrame('protagonista_m', 0, 0);
  assert.ok(hasColor(front, '#B9FF66'), 'tirador verde visible de frente');
  assert.ok(hasColor(nativeFrame('protagonista_m', 1, 0), '#B9FF66'), 'tirador verde visible de perfil');
  assert.ok(hasColor(nativeFrame('protagonista_m', 3, 0), PALETTES.protagonista_m.J), 'chaqueta visible de espaldas');
});

test('mochila: transformación pura sobre las poses (no muta) y errores claros', () => {
  const before = JSON.stringify(WALK);
  const bag = withBackpack(WALK);
  assert.equal(JSON.stringify(WALK), before, 'las poses originales no cambian');
  assert.equal(bag.down.length, WALK.down.length);
  assert.equal(shoulderRow(WALK.down[0].body), 1); // fila 17 del frame
  assert.ok(bag.up[0].body.join('').includes('z'), 'solapa de la bolsa de espaldas');
  assert.ok(bag.left[0].body.some((r) => r.length === 18), 'se conserva el ancho de la rejilla');
  assert.deepEqual(paste(['....', '....'], ['ab'], 1, 1), ['....', '.ab.']);
  assert.throws(() => paste(['..'], ['abc'], 0, 0), /se sale/);
  assert.throws(() => shoulderRow(['....']), /sin contorno/);
});

test('proporciones: cabeza del masculino ≤ 15 filas y figura como un charset BW (≈28 filas)', () => {
  const front = nativeFrame('protagonista_m', 0, 0);
  const box = front.bbox();
  assert.ok(box.y >= 2, `la coronilla empieza en la fila ${box.y}`);
  assert.ok(box.h <= 29, `altura total ${box.h}`);
  // La cabeza termina donde empieza el torso (fila 17): altura de cabeza = 17 − primera fila + 1.
  assert.ok(17 - box.y + 1 <= 16, 'cabeza demasiado alta');
  // La femenina queda a la misma altura de coronilla (±1).
  const fem = nativeFrame('protagonista_f', 0, 0).bbox();
  assert.ok(Math.abs(fem.y - box.y) <= 1, `coronillas ${box.y} y ${fem.y}`);
});

test('elenco nuevo registrado: madre, ayudante, Guardiana (con frontal), niño y niña', () => {
  for (const id of ['madre', 'ayudante', 'guardiana', 'nino', 'nina']) {
    assert.equal(getCharacter(id)?.kind, 'charset', id);
  }
  assert.equal(getCharacter('guardiana').battle.front, 'guardiana_front');
  assert.equal(getBattleSprite('guardiana_front').kind, 'battle_front');
  // Los niños son claramente más bajos que los adultos.
  const kid = nativeFrame('nino', 0, 0).bbox().h;
  const adult = nativeFrame('madre', 0, 0).bbox().h;
  assert.ok(adult - kid >= 4, `niño ${kid} filas, adulta ${adult}`);
});

test('clases de Añil: getCharacter y getBattleSprite resuelven alias, archivos y ids propios', () => {
  const b = getCharacter('anil:bichero');
  assert.equal(b.file, '/anil/Graphics/Characters/cazabichos.png');
  assert.equal(b.alias, 'bichero');
  assert.equal(b.trainerClass, 'Bichero');
  assert.equal(b.battle.front, 'anil:CAZABICHOS');
  assert.equal(getBattleSprite('anil:bichero').file, '/anil/Graphics/Trainers/CAZABICHOS.png');
  assert.equal(getBattleSprite('anil:CHICO').file, '/anil/Graphics/Trainers/CHICO.png');
  assert.deepEqual(frameRect(getBattleSprite('anil:CHICO'), 2, 0, 160, 160), { x: 0, y: 0, w: 160, h: 160 });
  assert.equal(getBattleSprite('gael_front'), CHARACTERS.gael_front);
  assert.equal(getBattleSprite('protagonista_m'), null, 'un charset no es sprite de combate');
  assert.equal(getBattleSprite(''), null);
  assert.equal(getCharacter('anil:Lider 1 bw').file, '/anil/Graphics/Characters/Lider%201%20bw.png');
  assert.equal(getCharacter('toString'), null, 'sin fugas del prototipo');
});

test('clases de Añil: cada alias apunta a un charset y a un sprite de entrenador que existen', () => {
  assert.ok(listAnilClasses().length >= 20);
  for (const [alias, c] of Object.entries(ANIL_CLASSES)) {
    assert.ok(fs.existsSync(path.join(ANIL, 'Characters', `${c.charset}.png`)), `${alias}: falta charset ${c.charset}`);
    assert.ok(fs.existsSync(path.join(ANIL, 'Trainers', `${c.front}.png`)), `${alias}: falta Trainers/${c.front}`);
    assert.ok(c.trainerClass && /^[MF]$/.test(c.gender), `${alias}: clase y género`);
    assert.equal(CHARACTERS[alias], undefined, `${alias} no debe chocar con un id propio`);
  }
  for (const wanted of ['joven', 'chica', 'bichero', 'excursionista', 'montanero', 'nadador', 'nadadora', 'cientifico', 'cientifica', 'dama']) {
    assert.ok(ANIL_CLASSES[wanted], `falta la clase ${wanted}`);
  }
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
