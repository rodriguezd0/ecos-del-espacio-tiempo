// Arte del Core de Zygarde y de la Célula (referencias del autor): silueta, ojo, flotación, pulso y el sprite de la
// célula en los eventos `zygardeCell` del mapa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img } from '../tools/pixel.mjs';
import { buildCoreSheet, buildCellSheet, CORE_PALETTE, CELL_PALETTE } from '../tools/pixel_chars/zygarde.mjs';
import { CHARACTERS } from '../game/src/content/characters.js';
import { ZYGARDE_EVENT_TYPES } from '../game/src/world/zygarde/eventTypes.js';
import { mapFromRows } from './world_helpers.mjs';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const frame = (sheetImg, row, col) => sheetImg.crop(col * 32, row * 32, 32, 32);
const hasColor = (img, color) => img.colors().some(([c]) => c === color.toUpperCase());

test('Core y célula: hojas 256×256 exportadas ×2 exactas desde el generador', () => {
  for (const [id, build] of [['zygarde_core', buildCoreSheet], ['zygarde_celula', buildCellSheet]]) {
    const png = Img.load(path.join(GAME, CHARACTERS[id].file));
    assert.equal(png.w, 256, id);
    assert.equal(png.h, 256, id);
    assert.deepEqual([...png.data], [...build().scale(2).data], `${id}: el PNG está al día con tools/pixel_chars/zygarde.mjs`);
  }
});

test('Core: silueta de la referencia (≈11×14), flota sobre la casilla y un solo ojo de frente y de perfil', () => {
  const core = buildCoreSheet();
  const box = frame(core, 0, 0).bbox();
  assert.equal(box.w, 11, 'ancho de la cabeza');
  assert.equal(box.h, 14, 'cabeza + aro + cuerpo que se estrecha');
  assert.ok(box.y + box.h <= 28, 'la punta no toca el suelo (la sombra la pone el motor)');
  for (const row of [0, 1, 2]) {
    const f = frame(core, row, 0);
    assert.ok(hasColor(f, CORE_PALETTE.e) && hasColor(f, CORE_PALETTE.w), `fila ${row}: pupila y brillo`);
    assert.ok(hasColor(f, CORE_PALETTE.y), `fila ${row}: cerco verde #B9FF66`);
  }
  const back = frame(core, 3, 0);
  assert.ok(!hasColor(back, CORE_PALETTE.e), 'de espaldas no hay ojo');
  assert.ok(hasColor(back, CORE_PALETTE.r), 'de espaldas asoma la mancha rojiza');
});

test('Core: de lado la punta queda detrás (inclinado) y la vista derecha es el espejo de la izquierda', () => {
  const core = buildCoreSheet();
  const tipX = (f) => {
    const b = f.bbox();
    const y = b.y + b.h - 1;
    const xs = [];
    for (let x = 0; x < 32; x++) if (f.alpha(x, y)) xs.push(x);
    return xs.reduce((a, v) => a + v, 0) / xs.length;
  };
  const left = frame(core, 1, 0);
  const center = left.bbox().x + left.bbox().w / 2;
  assert.ok(tipX(left) > center + 1, 'mirando a la izquierda, la punta va a la derecha');
  assert.deepEqual([...frame(core, 2, 0).data], [...left.mirrorX().data]);
});

test('Core: rebote suave (aplastado en 1, elevado en 3) y los patrones 0 y 2 iguales', () => {
  const core = buildCoreSheet();
  for (let row = 0; row < 4; row++) {
    const [f0, f1, f2, f3] = [0, 1, 2, 3].map((c) => frame(core, row, c).bbox());
    assert.deepEqual(f0, f2, `fila ${row}: 0 y 2`);
    assert.equal(f1.h, f0.h - 1, `fila ${row}: aplastado`);
    assert.equal(f1.y + f1.h, f0.y + f0.h, `fila ${row}: la punta no se mueve al aplastarse`);
    assert.equal(f3.y, f0.y - 1, `fila ${row}: elevado 1 px`);
  }
});

test('Célula: las 4 filas iguales, flota 0/1/2/1 px y el centro late', () => {
  const cell = buildCellSheet();
  for (let row = 1; row < 4; row++) assert.deepEqual([...cell.crop(0, row * 32, 128, 32).data], [...cell.crop(0, 0, 128, 32).data]);
  const bottoms = [0, 1, 2, 3].map((c) => { const b = frame(cell, 0, c).bbox(); return b.y + b.h; });
  assert.deepEqual(bottoms.map((b) => bottoms[0] - b), [0, 1, 2, 1]);
  assert.ok(hasColor(frame(cell, 0, 0), CELL_PALETTE.W), 'centro luminoso');
  assert.ok(!hasColor(frame(cell, 0, 2), CELL_PALETTE.Y), 'en el pico del pulso el halo se aviva');
  const box = frame(cell, 0, 0).bbox();
  assert.ok(box.w >= 12 && box.w <= 16 && box.h >= 11 && box.h <= 14, `haba alargada (${box.w}×${box.h})`);
});

test('evento zygardeCell: muestra el sprite de la célula (animado) con su brillo hasta recogerla', () => {
  const def = ZYGARDE_EVENT_TYPES.zygardeCell({ id: 'c', x: 1, y: 0, cell: 'cell_prueba_1' });
  assert.equal(def.pages[0].sprite, 'zygarde_celula');
  assert.equal(def.pages[0].stepAnime, true);
  assert.equal(def.pages[0].glow.name, 'zygardeCell');
  assert.equal(ZYGARDE_EVENT_TYPES.zygardeCell({ id: 'c', x: 1, y: 0, cell: 'x', sprite: '' }).pages[0].sprite, '', 'sprite: "" lo quita');
  const state = GameState.create({ name: 'Prueba' });
  const world = new World({ state, rng: () => 0.5 });
  const mapDef = { id: 'prueba', outdoor: true, events: [{ id: 'c', type: 'zygardeCell', x: 1, y: 0, cell: 'cell_prueba_1' }] };
  world.setCurrent({ id: 'prueba', def: mapDef, map: mapFromRows(['...']), offset: { x: 0, y: 0 }, events: null });
  const ev = world.events.find((e) => e.id === 'c');
  assert.equal(ev.characterName, 'zygarde_celula');
  state.addCell('cell_prueba_1');
  world.refreshEvents();
  assert.equal(ev.page, null, 'recogida: desaparece');
});
