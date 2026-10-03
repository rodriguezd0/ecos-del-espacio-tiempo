import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadStampLibrary } from '../game/src/content/stamps/index.js';
import { MapBuilder } from '../game/src/world/mapBuilder.js';
import { paintBrush } from '../game/src/content/stamps/brushes.js';
import { buildPilarHall, paintPillarExterior } from '../game/src/content/stamps/pilarVertical.js';
import { MAPS } from '../game/src/content/maps/index.js';
import { GameState } from '../game/src/core/state.js';
import { archivoOnEnter } from '../game/src/content/events/b10_archivo.js';
import { hondoOnEnter } from '../game/src/content/events/b10_hondo.js';
import { GameMap } from '../game/src/world/gameMap.js';
import fs from 'node:fs';
import { EXTRA_LAYOUTS } from '../game/src/content/stamps/extraTiles.js';

const tilesets = JSON.parse(fs.readFileSync(new URL('../game/data/tilesets.json', import.meta.url), 'utf8')).tilesets;

test('el arte de las columnas conserva las variantes de bosque, playa y puntas que cierran caminos', () => {
  for (const id of [1, 6, 7, 9]) {
    const ts = tilesets[id];
    const layout = EXTRA_LAYOUTS[ts.image];
    const reserved = new Set();
    for (const kind of ['forestDense', 'beachCorners', 'sealedTips']) {
      const variants = ts[kind];
      assert.ok(variants.base >= (layout.row + layout.rows) * 8, `${ts.image}: torre y ${kind} se solapan`);
      for (const tile of Object.values(variants.map).flat()) {
        assert.ok(!reserved.has(tile), `${ts.image}: tile ${tile} pertenece a varias variantes`);
        reserved.add(tile);
      }
    }
    for (const tile of Object.values(ts.sealedTips.map)) assert.equal(ts.passages[tile], 15, 'las puntas selladas siguen bloqueando');
  }
});

test('columnas exteriores: puerta central, base sólida y diez filas completas en los cuatro biomas', async () => {
  for (const tileset of [1, 6, 7, 9]) {
    const library = await loadStampLibrary(tileset);
    const b = new MapBuilder({ width: 20, height: 20, tileset, library, paintBrush });
    const tower = paintPillarExterior(b, { centerX: 10, doorY: 12 });
    assert.deepEqual(tower.door, { x: 10, y: 12 });
    assert.equal(tower.h, 10);
    assert.equal(tower.w, 7);
    const map = new GameMap({ id: 'torre', built: { width: b.width, height: b.height, layers: b.layers }, tileset: tilesets[tileset] });
    assert.ok(map.playerPassable(10, 12, 8, {}), 'se puede entrar por la puerta');
    for (const x of [7, 8, 9, 11, 12, 13]) assert.ok(!map.playerPassable(x, 12, 8, {}), `base sólida en x${x}`);
    assert.throws(() => paintPillarExterior(b, { centerX: 10, doorY: 8 }), /diez filas/);
  }
});

test('salas verticales: las escaleras se dibujan alrededor de su casilla de enlace', async () => {
  const b = new MapBuilder({ width: 27, height: 30, tileset: 2, library: await loadStampLibrary(2), paintBrush });
  buildPilarHall(b, { floor: { x: 3, y: 5, w: 21, h: 21 }, up: { x: 13, y: 6 }, down: { x: 13, y: 25 } });
  for (const y of [6, 25]) assert.ok(b.get(2, 13, y), `escalera en (13,${y})`);
});

test('P5: Archivo, recuerdos y Guardiana ocupan tres plantas conectadas', async () => {
  const base = (await MAPS.mnemos_archivo()).default;
  const puzzle = (await MAPS.archivo_hondo()).default;
  const core = (await MAPS.archivo_hondo_nucleo()).default;
  assert.deepEqual([base, puzzle, core].map((m) => m.pillar), [1, 2, 3].map((floor) => ({ id: 'P5', floor })));
  assert.equal(base.events.filter((e) => e.type === 'trainer').length >= 3, true);
  assert.ok(!puzzle.events.some((e) => e.type === 'trainer' || e.id === 'olvido_hondo' || e.id === 'nucleo_memoria'));
  assert.ok(core.events.some((e) => e.id === 'olvido_hondo'));
  assert.ok(core.events.some((e) => e.id === 'nucleo_memoria'));
  assert.ok(base.warps.some((w) => w.to === puzzle.id));
  assert.ok(puzzle.warps.some((w) => w.to === base.id));
  assert.ok(core.warps.some((w) => w.to === puzzle.id));
});

test('P5: las partidas anteriores conservan entrenadores derrotados y posición en el núcleo', async () => {
  const state = GameState.create({ name: 'P' });
  state.setSelfSwitch('archivo_hondo', 'entrenador_investigadora_leonor');
  archivoOnEnter({ state });
  assert.ok(state.selfSwitch('mnemos_archivo', 'entrenador_investigadora_leonor'));
  const warps = [];
  await hondoOnEnter({ state, player: { x: 25, y: 20, direction: 8 }, warp: async (...args) => warps.push(args) });
  assert.deepEqual(warps, [['archivo_hondo_nucleo', 25, 20, 8]]);
});
