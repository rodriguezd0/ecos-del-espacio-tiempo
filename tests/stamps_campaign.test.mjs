// Biblioteca de stamps para la campaña: kit común de Pilar (X23) y tinte por Pilar, overlay de tiles propios,
// brush edge2 (playas), bibliotecas nuevas (6, 8, 9, 11) y su consumo desde el MapBuilder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadStampLibrary, stampWrites } from '../game/src/content/stamps/index.js';
import { paintBrush, rectCells, brushKind } from '../game/src/content/stamps/brushes.js';
import {
  EXTRA_LAYOUTS, EXTRA_PIECES, extraTiles, extraDefs, validateLayout, pieceCells, cellProps, terrainPatchCells,
} from '../game/src/content/stamps/extraTiles.js';
import { PILAR_TINTS, PILAR_KIT, PILAR_KIT_EXTERIOR, PILAR_TILESETS, pilarTone, pilarPiece } from '../game/src/content/stamps/pilar.js';
import { deriveLibrary } from '../game/src/content/stamps/derive.js';
import { MapBuilder } from '../game/src/world/mapBuilder.js';
import { FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';

const tilesets = JSON.parse(fs.readFileSync(new URL('../game/data/tilesets.json', import.meta.url))).tilesets;
const ANIL_TILESETS = new URL('../Pokemon Anil V4.13/Graphics/Tilesets/', import.meta.url);
const byPos = (writes) => new Map(writes.map((w) => [`${w.x},${w.y},${w.layer}`, w.id]));
const tid = (x, y) => FIRST_REGULAR_TILE + y * 8 + x;

test('kit de Pilar: los 12 elementos de X23 existen con el mismo nombre en todos los tilesets de Pilar', async () => {
  const required = ['pilar_monolito', 'pilar_dintel', 'pilar_canal', 'pilar_placa_unown', 'pilar_pedestal', 'pilar_columna_quebrada',
    'pilar_escalinata', 'pilar_camara_nucleo', 'pilar_zocalo', 'pilar_losa_eco', 'pilar_arista', 'pilar_manantial'];
  for (const n of required) assert.ok(PILAR_KIT.includes(n), `kit sin ${n}`);
  for (const ts of PILAR_TILESETS.completo) {
    const lib = await loadStampLibrary(ts);
    for (const n of PILAR_KIT) assert.ok(lib.stamps[n] || lib.brushes[n], `tileset ${ts}: falta ${n}`);
  }
  for (const ts of PILAR_TILESETS.exterior) {
    const lib = await loadStampLibrary(ts);
    for (const n of PILAR_KIT_EXTERIOR) assert.ok(lib.stamps[n] || lib.brushes[n], `tileset ${ts}: falta ${n}`);
  }
  assert.equal(pilarPiece('pilar_monolito').w, 2);
  assert.throws(() => pilarPiece('grava'), /Pieza de Pilar desconocida/);
});

test('tinte por Pilar: diez tonos RMXP válidos, escalables y con errores claros', () => {
  assert.equal(Object.keys(PILAR_TINTS).length, 10);
  for (const [k, t] of Object.entries(PILAR_TINTS)) {
    assert.equal(t.tone.length, 4, k);
    t.tone.slice(0, 3).forEach((v) => assert.ok(v >= -255 && v <= 255, `${k}: ${v}`));
    assert.ok(t.tone[3] >= 0 && t.tone[3] <= 255, k);
  }
  assert.deepEqual(pilarTone('P1'), [...PILAR_TINTS.P1.tone]);
  assert.deepEqual(pilarTone(10), [...PILAR_TINTS.P10.tone]);
  assert.deepEqual(pilarTone('p2', 0), [0, 0, 0, 0]);
  assert.deepEqual(pilarTone('P4', 0.5), PILAR_TINTS.P4.tone.map((v) => Math.round(v / 2) || 0));
  assert.throws(() => pilarTone('P11'), /Pilar desconocido/);
  assert.throws(() => pilarTone('P1', 2), /fuera de 0..1/);
  const tone = pilarTone('P6');
  tone[0] = 999; // copia: no altera la tabla
  assert.notEqual(PILAR_TINTS.P6.tone[0], 999);
});

test('overlay: layouts sin solapes, dentro de filas libres y con propiedades RMXP aplicadas', () => {
  for (const image of Object.keys(EXTRA_LAYOUTS)) {
    assert.equal(validateLayout(image), true);
    const tiles = extraTiles(image);
    assert.ok(tiles.length > 0, image);
    const users = Object.values(tilesets).filter((t) => t.image === image);
    assert.ok(users.length > 0, `${image} sin tilesets`);
    for (const ts of users) {
      for (const t of tiles) {
        assert.ok(t.id < ts.passages.length, `${image}: ${t.id} fuera`);
        assert.equal(ts.passages[t.id], t.passage, `${ts.id}:${t.name} pasabilidad (node tools/stamps_extra.mjs)`);
        assert.equal(ts.priorities[t.id], t.priority, `${ts.id}:${t.name} prioridad`);
        assert.equal(ts.terrainTags[t.id], t.terrain, `${ts.id}:${t.name} terrain`);
      }
    }
  }
  // la pasabilidad sale de `pass`: la base del monolito bloquea y la cima no
  const mono = EXTRA_PIECES.pilar_monolito;
  assert.equal(cellProps(mono, 0, 2).passage, 0x0f);
  assert.equal(cellProps(mono, 0, 0).passage, 0);
  assert.equal(cellProps(mono, 0, 0).priority, 2); // 2 filas sobre la base
  assert.equal(cellProps(EXTRA_PIECES.pilar_dintel, 2, 0).priority, 3);
  // celdas vacías del dintel (hueco de paso) no generan tile
  assert.equal(pieceCells(EXTRA_PIECES.pilar_dintel).length, 14);
  assert.equal(EXTRA_PIECES.arena_honda.tag[0][0], '3');
});

test('correcciones de terrain: orilla y playa de ExteriorSafari son agua navegable (como en Exterior1)', () => {
  const cells = terrainPatchCells('ExteriorSafari');
  assert.ok(cells.length > 0);
  const blocked = cells.filter((c) => (tilesets[6].passages[c.id] & 0x0f) === 0x0f);
  assert.ok(blocked.length >= 20);
  for (const c of blocked) assert.equal(tilesets[6].terrainTags[c.id], 7, `${c.what} ${c.id}`);
  assert.equal(tilesets[6].terrainTags[tid(1, 367)], 0); // la arena interior sigue siendo arena pisable
});

test('overlay: el atlas del juego contiene el arte de cada pieza', { skip: !fs.existsSync(ANIL_TILESETS) && 'sin Añil' }, async () => {
  const { checkOverlay } = await import('../tools/stamps_extra.mjs');
  assert.deepEqual(checkOverlay(), []);
});

test('extraDefs: stamps `tiles` y brushes nine/pattern/line marcados como extra; derive no los hereda', () => {
  const { stamps, brushes } = extraDefs('Cueva1');
  assert.ok(stamps.pilar_monolito.tiles && stamps.pilar_monolito.extra);
  assert.equal(stamps.pilar_monolito.solid, true);
  assert.equal(brushKind(brushes.pilar_enlosado), 'nine');
  assert.equal(brushKind(brushes.pilar_canal), 'line');
  assert.equal(brushKind(extraDefs('ExteriorSafari').brushes.ceniza), 'pattern');
  const base = { tileset: 1, image: 'X', stamps: { a: { src: [0, 0, 1, 1] }, k: { ...stamps.pilar_zocalo } }, brushes: { b: { tile: 400 }, g: { ...brushes.pilar_enlosado } } };
  const d = deriveLibrary(base, { tileset: 2, image: 'Y', stamps: {}, brushes: {} });
  assert.deepEqual(Object.keys(d.stamps), ['a']);
  assert.deepEqual(Object.keys(d.brushes), ['b']);
});

test('edge2: borde doble exterior/interior y centro', () => {
  const b = { edge2: { src: [0, 366] }, layer: 1 };
  const m = byPos(paintBrush(b, rectCells(0, 0, 6, 6)));
  assert.equal(m.get('0,0,1'), tid(0, 366));
  assert.equal(m.get('1,1,1'), tid(1, 367));
  assert.equal(m.get('2,2,1'), tid(2, 368));
  assert.equal(m.get('5,5,1'), tid(4, 370));
  assert.equal(m.get('4,0,1'), tid(3, 366));
  assert.equal(m.get('2,5,1'), tid(2, 370));
  const hollow = byPos(paintBrush({ edge2: { src: [0, 366], fill: 0 } }, rectCells(0, 0, 6, 6)));
  assert.equal(hollow.has('2,2,1'), false);
});

test('bibliotecas nuevas: Safari, Prisma, Torre y Liga cargan y pintan sus piezas de bioma', async () => {
  const safari = await loadStampLibrary(6);
  for (const n of ['palafito', 'molino_viento', 'arbol_grande', 'invernadero']) assert.ok(safari.stamps[n], n);
  for (const n of ['barro', 'arena_honda', 'ceniza', 'ceniza_honda', 'grava', 'playa']) assert.ok(safari.brushes[n], n);
  const prisma = await loadStampLibrary(9);
  for (const n of ['cerezo', 'torii', 'pabellon_verde', 'farolillos', 'puente_rojo']) assert.ok(prisma.stamps[n], n);
  assert.ok(prisma.brushes.cerezal && prisma.brushes.mar);
  for (const ts of [8, 11]) {
    const lib = await loadStampLibrary(ts);
    for (const n of ['vestibulo_solemne', 'sala_fuego', 'sala_hielo', 'sala_trono', 'emblema_suelo']) assert.ok(lib.stamps[n], `${ts}.${n}`);
    for (const n of ['sala_azul', 'sala_dorado', 'alfombra_rombos']) assert.ok(lib.brushes[n], `${ts}.${n}`);
  }
  const e1 = await loadStampLibrary(1);
  for (const n of ['pino_nevado', 'faro', 'muelle_piedra', 'torre_cristal']) assert.ok(e1.stamps[n], n);
  for (const n of ['nieve', 'nieve_honda', 'grava', 'cascada', 'playa']) assert.ok(e1.brushes[n], n);
  const cueva = await loadStampLibrary(15);
  for (const n of ['sala_cueva_azul', 'sala_glaciar_cascada', 'plataforma_madera', 'escombros']) assert.ok(cueva.stamps[n], n);
  for (const n of ['hielo', 'nieve', 'cascada', 'pared_trepar', 'sala_gris']) assert.ok(cueva.brushes[n], n);
});

test('MapBuilder consume el kit, nine con IDs explícitos y edge2 (delegados en brushes.js)', async () => {
  const lib = await loadStampLibrary(2);
  const b = new MapBuilder({ width: 20, height: 16, tileset: 2, id: 'prueba_kit', library: lib, paintBrush });
  b.fill(null, 'vacio');
  b.rect(null, 4, 6, 10, 6, 'sala_gris');
  b.rect(null, 5, 7, 8, 4, 'pilar_enlosado');
  b.rect(null, 2, 13, 4, 2, 'estanque'); // { nine: 'ids' }
  const info = b.stamp('pilar_monolito', 8, 7);
  const built = b.build();
  assert.equal(info.w, 2);
  const mono = lib.stamp('pilar_monolito');
  assert.equal(built.layers[2][8 + 7 * 20], mono.layers[2][0]);
  assert.equal(built.layers[1][2 + 13 * 20], 408); // esquina NO del estanque de cueva
  assert.equal(built.layers[1][5 + 7 * 20], lib.brush('pilar_enlosado').nine ? tid(...lib.brush('pilar_enlosado').nine) : 0);
  const e1 = await loadStampLibrary(1);
  const c = new MapBuilder({ width: 10, height: 10, tileset: 1, id: 'playa', library: e1, paintBrush });
  c.fill(null, 'agua');
  c.rect(null, 1, 1, 7, 7, 'playa');
  assert.equal(c.build().layers[1][1 + 1 * 10], tid(0, 366));
});

test('stampWrites del kit usa solo celdas con tile (hueco del dintel libre)', async () => {
  const lib = await loadStampLibrary(11);
  const writes = stampWrites(lib.stamp('pilar_dintel'), 0, 0);
  assert.equal(writes.length, 14);
  assert.ok(!writes.some((w) => w.x >= 1 && w.x <= 3 && w.y >= 2));
});
