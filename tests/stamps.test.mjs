// Biblioteca de stamps/brushes: sincronía definición↔horneado, validez de IDs y algoritmos de brushes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  STAMP_LIBRARIES, buildStampLibrary, loadStampLibrary, stampWrites, stampDoor, stampSignature,
} from '../game/src/content/stamps/index.js';
import { paintBrush, brushKind, rectCells, cellHash } from '../game/src/content/stamps/brushes.js';
import { FIRST_REGULAR_TILE, isAutotile, autotileSlot } from '../game/src/shared/autotile.js';

const tilesets = JSON.parse(fs.readFileSync(new URL('../game/data/tilesets.json', import.meta.url))).tilesets;
const MIN_ENTRIES = {
  ExteriorBosqueCeleste: 100, Interior1: 70, Cueva1: 160, Exterior1: 140, Exterior2: 110, Exterior3: 100,
  ExteriorSafari: 65, ExteriorPrisma: 110, InteriorTorre: 90, InteriorLiga: 90,
};
const ANIL_MAPS = new URL('../tools/cache/anil_maps/index.json', import.meta.url);

async function loadAll() {
  const out = [];
  for (const [id, entry] of Object.entries(STAMP_LIBRARIES)) {
    const def = (await entry.def()).default;
    const baked = (await entry.baked()).default;
    out.push({ id: Number(id), image: entry.image, def, baked, lib: buildStampLibrary(def, baked) });
  }
  return out;
}

const tid = (x, y) => FIRST_REGULAR_TILE + y * 8 + x;
const byPos = (writes) => new Map(writes.map((w) => [`${w.x},${w.y},${w.layer}`, w.id]));

test('cada biblioteca coincide con su tileset y alcanza el mínimo de entradas', async () => {
  for (const { id, image, def, lib } of await loadAll()) {
    assert.equal(def.tileset, id, `${image}: tileset`);
    assert.equal(tilesets[id].image, image, `${image}: imagen del tileset ${id}`);
    const n = Object.keys(lib.stamps).length + Object.keys(lib.brushes).length;
    assert.ok(n >= MIN_ENTRIES[image], `${image}: ${n} entradas < ${MIN_ENTRIES[image]}`);
  }
});

test('los horneados están al día (firma de cada stamp)', async () => {
  for (const { image, def, baked } of await loadAll()) {
    assert.deepEqual(Object.keys(baked.stamps).sort(), Object.keys(def.stamps).sort(), `${image}: stamps horneados`);
    for (const [name, sdef] of Object.entries(def.stamps)) {
      assert.equal(baked.stamps[name].sig, stampSignature(sdef), `${image}.${name} obsoleto: node tools/stamps_bake.mjs`);
    }
  }
});

test('re-hornear en memoria reproduce el archivo horneado', { skip: !fs.existsSync(ANIL_MAPS) && 'sin tools/cache/anil_maps' }, async () => {
  const { bakeStamp, originalTileset } = await import('../tools/stamps_lib.mjs');
  for (const { image, def, baked } of await loadAll()) {
    const png = originalTileset(image);
    for (const [name, sdef] of Object.entries(def.stamps)) {
      const fresh = bakeStamp(def, name, sdef, png);
      assert.deepEqual(fresh.layers, baked.stamps[name].layers, `${image}.${name}`);
    }
  }
});

test('stamps: IDs válidos, capas con tamaño w×h, puerta dentro y metadatos', async () => {
  for (const { id, image, lib } of await loadAll()) {
    const ts = tilesets[id];
    for (const s of Object.values(lib.stamps)) {
      const where = `${image}.${s.name}`;
      assert.ok(s.w > 0 && s.h > 0, where);
      assert.ok(typeof s.desc === 'string' && s.desc.length > 0, `${where}: desc`);
      assert.equal(s.layers.length, 3, where);
      assert.ok(s.layers.some(Boolean), `${where}: vacío`);
      for (const g of s.layers) {
        if (!g) continue;
        assert.equal(g.length, s.w * s.h, where);
        for (const t of g) {
          if (!t) continue;
          assert.ok(t < ts.passages.length, `${where}: tile ${t} fuera del tileset`);
          if (isAutotile(t)) assert.ok(ts.autotiles[autotileSlot(t)], `${where}: autotile ${t} sin imagen`);
          else assert.ok(t >= FIRST_REGULAR_TILE, `${where}: tile ${t} inválido`);
        }
      }
      if (s.door) assert.ok(s.door[0] >= 0 && s.door[0] < s.w && s.door[1] >= 0 && s.door[1] < s.h, `${where}: door`);
    }
  }
});

test('brushes: todos pintan una máscara con IDs válidos en capas 0..2', async () => {
  for (const { id, image, lib } of await loadAll()) {
    const ts = tilesets[id];
    for (const [name, b] of Object.entries(lib.brushes)) {
      const cells = rectCells(10, 10, 8, 7);
      const writes = paintBrush(b, cells, { seed: 3 });
      assert.ok(writes.length > 0, `${image}.${name}: sin escrituras (${brushKind(b)})`);
      for (const w of writes) {
        assert.ok([0, 1, 2].includes(w.layer), `${image}.${name}: capa ${w.layer}`);
        assert.ok(w.id > 0 && w.id < ts.passages.length, `${image}.${name}: id ${w.id}`);
        if (isAutotile(w.id)) assert.ok(ts.autotiles[autotileSlot(w.id)], `${image}.${name}: autotile ${w.id}`);
      }
    }
  }
});

test('loadStampLibrary carga por ID, usa alias de cueva y falla con claridad', async () => {
  const ext = await loadStampLibrary(7);
  assert.equal(ext.image, 'ExteriorBosqueCeleste');
  assert.equal((await loadStampLibrary(13)).image, 'Cueva1');
  assert.throws(() => ext.stamp('no_existe'), /Stamp desconocido/);
  assert.throws(() => ext.brush('no_existe'), /Brush desconocido/);
  await assert.rejects(loadStampLibrary(999), /No hay biblioteca/);
  assert.ok(ext.byTag('edificio').length >= 10);
});

test('buildStampLibrary detecta horneados obsoletos', async () => {
  const [{ def, baked }] = await loadAll();
  const name = Object.keys(def.stamps)[0];
  const changed = { ...def, stamps: { ...def.stamps, [name]: { ...def.stamps[name], src: [0, 0, 1, 1], from: undefined, tiles: undefined } } };
  assert.throws(() => buildStampLibrary(changed, baked), /cambió desde el horneado/);
});

test('stampWrites y stampDoor posicionan el stamp', async () => {
  const lib = await loadStampLibrary(7);
  const casa = lib.stamp('casa_roja');
  const writes = stampWrites(casa, 10, 20);
  assert.ok(writes.every((w) => w.x >= 10 && w.x < 10 + casa.w && w.y >= 20 && w.y < 20 + casa.h));
  assert.ok(writes.every((w) => w.layer === 2));
  assert.deepEqual(stampDoor(casa, 10, 20), { x: 14, y: 27 });
  assert.ok(stampWrites(casa, 0, 0, { layer: 1 }).every((w) => w.layer === 1));
});

test('nine: bordes, centro y esquinas cóncavas', () => {
  const brush = { nine: [0, 4], inner: [3, 4], layer: 1 };
  const m = byPos(paintBrush(brush, rectCells(0, 0, 3, 3)));
  assert.equal(m.get('0,0,1'), tid(0, 4));
  assert.equal(m.get('1,0,1'), tid(1, 4));
  assert.equal(m.get('2,2,1'), tid(2, 6));
  assert.equal(m.get('1,1,1'), tid(1, 5));
  // L: sin la casilla (2,0) → (1,1) tiene libre el NE y (2,1) pasa a borde superior derecho
  const l = byPos(paintBrush(brush, rectCells(0, 0, 3, 3).filter(([x, y]) => !(x === 2 && y === 0))));
  assert.equal(l.get('1,1,1'), tid(4, 4));
  assert.equal(l.get('2,1,1'), tid(2, 4));
  // fill: 0 deja el centro sin escribir
  const frame = byPos(paintBrush({ nine: [0, 520], fill: 0 }, rectCells(0, 0, 3, 3)));
  assert.equal(frame.has('1,1,1'), false);
  // nine con IDs explícitos
  const ids = byPos(paintBrush({ nine: 'ids', ids: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], layer: 0 }, rectCells(0, 0, 3, 3)));
  assert.equal(ids.get('2,2,0'), 9);
});

test('pattern y grid dependen de la posición absoluta', () => {
  const p = byPos(paintBrush({ pattern: [0, 0, 4, 4] }, [[5, 6], [-1, -1]]));
  assert.equal(p.get('5,6,0'), tid(1, 2));
  assert.equal(p.get('-1,-1,0'), tid(3, 3));
  const g = byPos(paintBrush({ grid: [[136, 134], [130, 132]] }, [[0, 0], [1, 0], [0, 1], [3, 3]]));
  assert.deepEqual([g.get('0,0,0'), g.get('1,0,0'), g.get('0,1,0'), g.get('3,3,0')], [136, 134, 130, 132]);
});

test('tile con variantes es determinista', () => {
  const b = { tile: 10 + FIRST_REGULAR_TILE, variants: [500, 501], chance: 0.5 };
  const a = paintBrush(b, rectCells(0, 0, 10, 10), { seed: 1 });
  const c = paintBrush(b, rectCells(0, 0, 10, 10), { seed: 1 });
  assert.deepEqual(a, c);
  assert.ok(a.some((w) => w.id !== b.tile) && a.some((w) => w.id === b.tile));
  assert.equal(cellHash(3, 4, 1), cellHash(3, 4, 1));
});

test('line: extremos y medio', () => {
  const m = byPos(paintBrush({ line: { ids: [1, 2, 3] } }, rectCells(0, 0, 4, 1)));
  assert.deepEqual([m.get('0,0,1'), m.get('1,0,1'), m.get('2,0,1'), m.get('3,0,1')], [1, 2, 2, 3]);
  const v = byPos(paintBrush({ line: { ids: [7, 8, 8], axis: 'v' } }, rectCells(0, 0, 1, 3)));
  assert.deepEqual([v.get('0,0,1'), v.get('0,1,1'), v.get('0,2,1')], [7, 8, 8]);
});

test('forest: troncos alineados con la última fila y copas en la capa superior', () => {
  const b = { forest: { trees: [[0, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1 };
  const writes = paintBrush(b, rectCells(0, 0, 4, 10));
  const m = byPos(writes);
  assert.equal(m.get('0,9,1'), tid(0, 44)); // tronco del árbol inferior en la última fila
  assert.equal(m.get('0,4,2'), tid(0, 39)); // copa del árbol inferior (anclado en y = 4)
  assert.equal(m.get('0,8,1'), tid(0, 43));
  assert.equal(m.get('0,0,2'), tid(0, 39)); // árbol superior anclado en y = 0
  assert.ok(writes.every((w) => w.x >= 0 && w.x < 4 && w.y >= 0 && w.y < 10));
});

test('cliff: borde superior, cuerpo y cara de 3 filas', () => {
  const b = { cliff: { src: [0, 45], width: 4, faceRows: 3 }, layer: 1 };
  const m = byPos(paintBrush(b, rectCells(0, 0, 5, 6)));
  assert.equal(m.get('0,0,1'), tid(0, 45));
  assert.equal(m.get('4,0,1'), tid(3, 45));
  assert.equal(m.get('0,1,1'), tid(0, 46));
  assert.equal(m.get('2,3,1'), tid(1, 47));
  assert.equal(m.get('4,5,1'), tid(3, 49));
});

test('terrace: laterales dobles y cara sur', async () => {
  const lib = await loadStampLibrary(7);
  const m = byPos(paintBrush(lib.brush('terraza'), rectCells(0, 0, 6, 6)));
  const t = lib.brush('terraza').terrace;
  assert.equal(m.get('0,0,1'), t.rim.w0);
  assert.equal(m.get('2,0,1'), t.rim.mid);
  assert.equal(m.get('5,5,1'), t.face.e0[2]);
  assert.equal(m.get('2,3,1'), t.face.mid[0]);
  assert.equal(m.has('2,1,1'), false); // interior sin tocar
});

test('room: paredes, suelo y marco alrededor', async () => {
  const lib = await loadStampLibrary(4);
  const b = lib.brush('habitacion_casa');
  const m = byPos(paintBrush(b, rectCells(5, 5, 6, 7)));
  const r = b.room;
  assert.equal(m.get('5,5,0'), r.wall[0][0]);
  assert.equal(m.get('10,7,0'), r.wall[2][2]);
  assert.equal(m.get('6,8,0'), r.floorShade);
  assert.equal(m.get('7,9,0'), r.floor);
  assert.equal(m.get('4,4,2'), r.frame.tl);
  assert.equal(m.get('11,5,2'), r.frame.r);
  assert.equal(m.get('4,11,2'), r.frame.bl[0]);
  assert.equal(m.get('8,12,2'), r.frame.b);
  assert.equal(m.get('4,12,0'), r.void);
});

test('cave: anillo de paredes de 3 a los lados, 4 arriba y 1 abajo', async () => {
  const lib = await loadStampLibrary(2);
  const writes = paintBrush(lib.brush('sala'), rectCells(10, 10, 4, 3));
  const m = byPos(writes);
  const xs = writes.map((w) => w.x); const ys = writes.map((w) => w.y);
  assert.deepEqual([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)], [7, 16, 6, 13]);
  assert.equal(m.get('7,6,1'), tid(0, 19));
  assert.equal(m.get('16,13,1'), tid(7, 25));
  assert.equal(m.has('11,11,1'), false); // suelo libre
  assert.equal(m.get('7,6,0'), 403);
});

test('autotile resuelve por vecinos (agua de cueva)', () => {
  const m = byPos(paintBrush({ autotile: 6 }, rectCells(5, 5, 3, 3), { width: 50, height: 50 }));
  assert.equal(m.get('6,6,0'), 48 * 7); // centro: patrón 0
  assert.notEqual(m.get('5,5,0'), 48 * 7); // esquina: patrón de borde
  // fuera del mapa cuenta como mismo autotile (como RMXP)
  const edge = byPos(paintBrush({ autotile: 6 }, rectCells(0, 0, 2, 2), { width: 50, height: 50 }));
  assert.equal(edge.get('0,0,0'), 48 * 7);
});
