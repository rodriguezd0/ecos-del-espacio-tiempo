// Arte provisional de la campaña (D30): monturas y acciones de Zygarde, elenco con nombre, Genesis y
// alias. Complementa tests/characters.test.mjs (tamaños, bloques 2×2 y píxeles sueltos de todo el registro).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTERS, getCharacter, getBattleSprite, frameRect, listAliases, playerVariant, listCharacters,
} from '../game/src/content/characters.js';
import { ANIL_CLASSES } from '../game/src/content/anilClasses.js';
import { CHARACTER_ALIASES } from '../game/src/content/characters_campaign.js';
import { Img, strayPixels } from '../tools/pixel.mjs';
import { withGlasses } from '../tools/pixel_chars/heads_campaign.mjs';
import { PROFESOR } from '../tools/pixel_chars/heads_cast.mjs';
import { recolorOverlay, recolorPoses, APRON } from '../tools/pixel_chars/overlays.mjs';
import { WALK } from '../tools/pixel_chars/body_jacket.mjs';
import { cutBelow } from '../tools/pixel_chars/rider.mjs';
import { GENESIS } from '../tools/pixel_chars/palettes_campaign.mjs';
import { ZYGARDE_GREEN, PALETTES } from '../tools/pixel_chars/palettes.mjs';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const ANIL = path.resolve(GAME, '..', 'Pokemon Anil V4.13', 'Graphics');
const load = (id) => Img.load(path.join(GAME, CHARACTERS[id].file));
const hasColor = (img, color) => img.colors().some(([c]) => c === color.toUpperCase());

/** Frame nativo (medio tamaño) de una hoja exportada ×2. */
function nativeFrame(id, row, col) {
  const ch = CHARACTERS[id];
  const img = load(id);
  const f = img.crop(col * ch.frameW, row * ch.frameH, ch.frameW, ch.frameH);
  const out = new Img(ch.frameW / 2, ch.frameH / 2);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.set(x, y, f.get(x * 2, y * 2));
  return out;
}

const PROTAS = ['protagonista_m', 'protagonista_f'];
const FIELD = ['ride10', 'ride50', 'dive', 'climb', 'fish', 'vuelo'];

test('variantes de campo: cada protagonista tiene montura, nado, buceo, trepar, pesca y Vuelo registrados', () => {
  for (const p of PROTAS) {
    const v = getCharacter(p).variants;
    assert.equal(v.run, `${p}_run`, 'se conserva la variante de correr');
    for (const name of FIELD) {
      assert.ok(v[name] && CHARACTERS[v[name]], `${p}.${name}`);
      assert.equal(CHARACTERS[v[name]].variantOf, p);
    }
  }
  assert.equal(playerVariant('F', 'ride50'), 'protagonista_f_ride50');
  assert.equal(playerVariant('M', 'fish'), 'protagonista_m_fish_offset');
  assert.equal(playerVariant('M', 'no_existe'), null);
});

test('variantes de campo: tamaños de frame y convención "_offset" de la pesca', () => {
  for (const p of PROTAS) {
    for (const id of [`${p}_ride10`, `${p}_ride50`, `${p}_dive`, `${p}_fish_offset`]) {
      const ch = CHARACTERS[id];
      assert.equal(ch.kind, 'charset', id);
      assert.deepEqual([ch.frameW, ch.frameH], [96, 96], id);
      assert.deepEqual(frameRect(ch, 8, 3), { x: 288, y: 288, w: 96, h: 96 });
    }
    assert.equal(CHARACTERS[`${p}_climb`].frameW, 64);
    assert.ok(/offset/i.test(`${p}_fish_offset`) && CHARACTERS[`${p}_fish_offset`].offsetY === 16);
    const vuelo = CHARACTERS[`${p}_vuelo`];
    assert.equal(vuelo.kind, 'effect');
    assert.deepEqual([vuelo.cols, vuelo.rows, vuelo.frameW], [8, 1, 96]);
  }
});

test('montura 10%: cada frame une a Zygarde 10% (base de Añil) y al jinete; la derecha es el espejo', () => {
  const zygardeGreen = '#8AD920'; // verde de las franjas de ZYGARDE_1.png de Añil
  for (const p of PROTAS) {
    const hair = PALETTES[p].h;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const f = nativeFrame(`${p}_ride10`, row, col);
        assert.ok(hasColor(f, zygardeGreen), `${p}_ride10 ${row},${col}: falta el 10%`);
        assert.ok(hasColor(f, hair), `${p}_ride10 ${row},${col}: falta el jinete`);
      }
    }
    const left = nativeFrame(`${p}_ride10`, 1, 0);
    const right = nativeFrame(`${p}_ride10`, 2, 0);
    assert.deepEqual([...right.mirrorX().data], [...left.data], `${p}: derecha = espejo de izquierda`);
  }
});

test('nado sobre el 50%: por debajo de la espuma no queda nada del cuerpo (va sumergido)', () => {
  for (const p of PROTAS) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const f = nativeFrame(`${p}_ride50`, row, col);
        const box = f.bbox();
        assert.ok(box.y + box.h <= 45, `${p}_ride50 ${row},${col}: el sprite baja hasta ${box.y + box.h}`);
        assert.ok(hasColor(f, '#F0FAFF'), `${p}_ride50 ${row},${col}: falta la espuma`);
        assert.ok(hasColor(f, PALETTES[p].h), `${p}_ride50 ${row},${col}: falta el jinete`);
      }
    }
  }
});

test('buceo: burbuja verde de contorno sin relleno alrededor del protagonista', () => {
  for (const p of PROTAS) {
    for (let col = 0; col < 4; col++) {
      const f = nativeFrame(`${p}_dive`, 0, col);
      assert.ok(hasColor(f, '#1E5A2A') && hasColor(f, '#B9FF66'), `${p}_dive: anillo y destellos`);
      assert.equal(f.alpha(11, 26), 0, 'el interior de la burbuja es transparente (se ve el fondo marino)');
      assert.ok(hasColor(f, PALETTES[p].h), `${p}_dive: el protagonista va dentro`);
    }
  }
});

test('trepar: de espaldas con los brazos por encima de los hombros; las 4 filas son iguales', () => {
  for (const p of PROTAS) {
    const sheet = load(`${p}_climb`);
    const row0 = sheet.crop(0, 0, 256, 64);
    for (let r = 1; r < 4; r++) assert.deepEqual([...sheet.crop(0, r * 64, 256, 64).data], [...row0.data], `${p}_climb fila ${r}`);
    const f = nativeFrame(`${p}_climb`, 0, 0);
    // Mano izquierda en alto: piel entre las filas 5 y 9, a la izquierda de la cabeza (columnas 3..6).
    const skin = f.crop(3, 5, 4, 5);
    assert.ok(hasColor(skin, PALETTES[p].S), `${p}_climb: mano izquierda en alto`);
    assert.ok(!hasColor(f, PALETTES[p].w), `${p}_climb: de espaldas no se ven los ojos`);
  }
});

test('pesca: la caña aparece en los 16 frames y el sedal cae en el frame 3 de perfil', () => {
  for (const p of PROTAS) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const f = nativeFrame(`${p}_fish_offset`, row, col);
        assert.ok(hasColor(f, '#4A5064') || hasColor(f, '#8890A0'), `${p}_fish ${row},${col}: sin caña`);
        assert.ok(f.bbox().y + f.bbox().h <= 48);
      }
    }
    assert.ok(hasColor(nativeFrame(`${p}_fish_offset`, 1, 3), '#F0F0F8'), 'sedal hacia el agua');
    // Pies 8 filas por encima del borde (convención "_offset"): la figura termina en la fila 38.
    const feet = nativeFrame(`${p}_fish_offset`, 1, 1).bbox(); // caña en alto: lo más bajo son los pies
    assert.equal(feet.y + feet.h - 1, 38);
  }
});

test('Vuelo: la figura se disgrega en hexágonos verdes y desaparece; sin semitransparencias ni píxeles sueltos', () => {
  for (const p of PROTAS) {
    const strip = load(`${p}_vuelo`);
    const frame = (k) => {
      const f = strip.crop(k * 96, 0, 96, 96);
      const n = new Img(48, 48);
      for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) n.set(x, y, f.get(x * 2, y * 2));
      return n;
    };
    const hair = PALETTES[p].h;
    assert.ok(hasColor(frame(0), hair) && hasColor(frame(0), '#B9FF66'), 'frame 0: figura con aura');
    assert.ok(!hasColor(frame(7), hair), 'frame 7: ya no queda figura');
    for (let k = 2; k <= 6; k++) assert.ok(hasColor(frame(k), '#B9FF66'), `frame ${k}: partículas verdes`);
    for (let i = 3; i < strip.data.length; i += 4) assert.ok(strip.data[i] === 0 || strip.data[i] === 255, 'alfa parcial');
    for (let k = 0; k < 8; k++) assert.deepEqual(strayPixels(frame(k)), [], `frame ${k}: píxeles sueltos`);
  }
  const hexes = getCharacter('zygarde_hex');
  assert.deepEqual([hexes.kind, hexes.cols, hexes.rows], ['effect', 4, 2]);
});

const NAMED = ['leandro', 'abril', 'fermin', 'olvido', 'sol', 'vertice', 'casia', 'garrido', 'genesis_tecnico', 'genesis_tecnica'];

test('elenco con nombre y combate: charset + frontal registrados y de 160×160', () => {
  for (const id of NAMED) {
    const ch = getCharacter(id);
    assert.equal(ch?.kind, 'charset', id);
    const front = getBattleSprite(ch.battle.front);
    assert.equal(front?.kind, 'battle_front', `${id}: frontal`);
    const img = load(ch.battle.front);
    assert.deepEqual([img.w, img.h], [160, 160]);
    assert.ok(img.bbox().h >= 116 && img.bbox().h <= 132, `${id}_front: figura a escala de Añil`);
  }
  assert.equal(getCharacter('vertice_lider').battle.front, 'vertice_front');
  for (const id of ['genesis_investigador', 'genesis_investigadora', 'enfermera', 'dependiente', 'molinero', 'buzo', 'archivista']) {
    assert.equal(getCharacter(id)?.kind, 'charset', id);
  }
});

const GENESIS_SHEETS = ['vertice', 'vertice_lider', 'casia', 'garrido', 'genesis_tecnico', 'genesis_tecnica', 'genesis_investigador',
  'genesis_investigadora', 'vertice_front', 'casia_front', 'garrido_front', 'genesis_tecnico_front', 'genesis_tecnica_front'];

test('Genesis: paleta carbón/blanco clínico/petróleo con acento magenta y NUNCA el verde de Zygarde', () => {
  const isGreen = ([r, g, b]) => g > r + 40 && g > b + 40;
  for (const id of GENESIS_SHEETS) {
    const img = load(id);
    assert.ok(!hasColor(img, ZYGARDE_GREEN), `${id}: usa el verde de Zygarde`);
    for (let i = 0; i < img.data.length; i += 4) {
      if (!img.data[i + 3]) continue;
      assert.ok(!isGreen([img.data[i], img.data[i + 1], img.data[i + 2]]), `${id}: píxel verde en ${i / 4}`);
    }
    assert.ok(hasColor(img, GENESIS.magenta), `${id}: falta el acento magenta (emblema, alfiler o ribete)`);
  }
  for (const id of ['genesis_tecnico', 'genesis_tecnica']) {
    const img = load(id);
    assert.ok(hasColor(img, GENESIS.petroleo) && hasColor(img, GENESIS.clinico) && hasColor(img, GENESIS.carbon), `${id}: uniforme`);
  }
});

test('alias: Casilda es la Guardiana ya dibujada y los alias resuelven a hojas existentes', () => {
  const casilda = getCharacter('casilda');
  assert.equal(casilda.file, getCharacter('guardiana').file);
  assert.equal(casilda.alias, 'casilda');
  assert.equal(casilda.aliasOf, 'guardiana');
  assert.equal(getBattleSprite('casilda_front').file, getBattleSprite('guardiana_front').file);
  assert.equal(getBattleSprite('casilda'), null, 'un charset no es sprite de combate');
  assert.equal(getCharacter('alerce').file, getCharacter('profesor').file);
  assert.equal(getCharacter('ramon').file, '/anil/Graphics/Characters/capitan.png');
  assert.deepEqual(listAliases(), { ...CHARACTER_ALIASES });
  for (const [alias, target] of Object.entries(CHARACTER_ALIASES)) {
    assert.equal(CHARACTERS[alias], undefined, `${alias} choca con un id propio`);
    assert.equal(ANIL_CLASSES[alias], undefined, `${alias} choca con una clase de Añil`);
    const entry = alias.endsWith('_front') ? getBattleSprite(alias) : getCharacter(alias);
    assert.ok(entry, `${alias} → ${target} no resuelve`);
    if (target.startsWith('anil:')) assert.ok(fs.existsSync(path.join(ANIL, 'Characters', `${target.slice(5)}.png`)), `${alias}: falta ${target}`);
  }
  assert.ok(Object.isFrozen(casilda));
  assert.ok(!listCharacters().includes('casilda'), 'los alias no son hojas');
});

test('clases de Añil de la campaña: mineros y buceadores', () => {
  assert.equal(getCharacter('anil:minero').trainerClass, 'Minero');
  assert.equal(getBattleSprite('anil:minera').file, '/anil/Graphics/Trainers/MECANICA.png');
  assert.equal(getCharacter('anil:buceadora').file, '/anil/Graphics/Characters/nadadora.png');
});

test('herramientas: gafas, recolores y corte del torso son transformaciones puras', () => {
  const before = JSON.stringify(PROFESOR);
  const g = withGlasses(PROFESOR);
  assert.equal(JSON.stringify(PROFESOR), before, 'withGlasses no modifica la cabeza original');
  assert.equal(g.down[13].slice(4, 8), 'gggg');
  assert.equal(g.down[14][5], 'l', 'cristal tintado sobre el blanco del ojo');
  assert.equal(withGlasses(PROFESOR, { tint: false }).down[14][5], PROFESOR.down[14][5]);
  assert.equal(g.left[13][2], 'g');
  assert.ok(g.down.every((r) => r.length === 18) && g.left.every((r) => r.length === 18));
  const walk = JSON.stringify(WALK);
  const gloves = recolorPoses(WALK, { S: 'Y', s: 'y' });
  assert.equal(JSON.stringify(WALK), walk);
  assert.ok(!gloves.down[0].body.join('').includes('S'));
  const apron = recolorOverlay(APRON, { C: 'Y' });
  assert.ok(apron.down0.join('').includes('Y') && !apron.down0.join('').includes('C'));
  const cut = cutBelow(WALK.down[0].body, 8);
  assert.equal(cut.length, 16);
  assert.equal(cut[9], [...WALK.down[0].body[8]].map((c) => (c === '.' ? '.' : 'k')).join(''), 'contorno bajo el torso');
  assert.equal(cut[15], '..................');
});
