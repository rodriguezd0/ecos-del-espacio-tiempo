// Arte del Core de Zygarde y de la Célula: sprites ORIGINALES del creador (tools/pixel_chars/originals/), exportados ×2 sin
// redibujar; la célula quieta y apoyada en el suelo. Y el sprite de la célula en los eventos `zygardeCell` del mapa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img } from '../tools/pixel.mjs';
import { buildCoreSheet, buildCellSheet, cellDrawing, CORE_ORIGINAL, CELL_GROUND_Y } from '../tools/pixel_chars/zygarde.mjs';
import { CHARACTERS } from '../game/src/content/characters.js';
import { ZYGARDE_EVENT_TYPES } from '../game/src/world/zygarde/eventTypes.js';
import { mapFromRows } from './world_helpers.mjs';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const frame = (sheetImg, row, col) => sheetImg.crop(col * 32, row * 32, 32, 32);

test('Core y célula: hojas 256×256 exportadas ×2 exactas desde el generador', () => {
  for (const [id, build] of [['zygarde_core', buildCoreSheet], ['zygarde_celula', buildCellSheet]]) {
    const png = Img.load(path.join(GAME, CHARACTERS[id].file));
    assert.equal(png.w, 256, id);
    assert.equal(png.h, 256, id);
    assert.deepEqual([...png.data], [...build().scale(2).data], `${id}: el PNG está al día con tools/pixel_chars/zygarde.mjs`);
  }
});

test('Core: es el original del creador, píxel a píxel', () => {
  assert.deepEqual([...buildCoreSheet().data], [...Img.load(CORE_ORIGINAL).data]);
});

test('Célula: el dibujo original, quieto (16 frames iguales) y apoyado en el suelo', () => {
  const cell = buildCellSheet();
  const first = frame(cell, 0, 0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) assert.deepEqual([...frame(cell, row, col).data], [...first.data], `frame ${row},${col}`);
  }
  const box = first.bbox();
  assert.equal(box.y + box.h - 1, CELL_GROUND_Y, 'apoyada en el suelo');
  const drawing = cellDrawing();
  assert.deepEqual([...first.crop(box.x, box.y, box.w, box.h).data], [...drawing.data], 'sin redibujar');
});

test('evento zygardeCell: muestra el sprite de la célula hasta recogerla', () => {
  const def = ZYGARDE_EVENT_TYPES.zygardeCell({ id: 'c', x: 1, y: 0, cell: 'cell_prueba_1' });
  assert.equal(def.pages[0].sprite, 'zygarde_celula');
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
